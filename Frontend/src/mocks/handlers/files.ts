import { HttpResponse, http, type HttpHandler } from "msw";
import type { FileAsset } from "@/contracts/common";
import { defineRoute, type RouteImplementations } from "../contract";
import { getDb } from "../db";
import { requireUser } from "../domain/users";
import { apiError } from "../errors";
import { created, newId, nowIso } from "../utils";

/** Same limits as the contract description of `POST /files` */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES: readonly string[] = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

type GlobalWithBlobs = typeof globalThis & { __applyMockBlobs?: Map<string, Blob> };

/** Uploaded file contents (memory only, never persisted) */
function blobs(): Map<string, Blob> {
  const holder = globalThis as GlobalWithBlobs;
  holder.__applyMockBlobs ??= new Map();
  return holder.__applyMockBlobs;
}

function extForMime(mime: string): string {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

/** Non-guessable storage key — never use the original student filename */
export function storageFileName(id: string, mimeType: string): string {
  return `${id}.${extForMime(mimeType)}`;
}

const userUploadTimestamps = new Map<string, number[]>();
const MAX_UPLOADS_PER_WINDOW = 10;
const UPLOAD_WINDOW_MS = 60 * 1000;

export function resetUploadRateLimits() {
  userUploadTimestamps.clear();
}

/**
 * Deterministic signature for mock signed file URLs.
 * Links are short-lived and restricted to the designated user.
 */
export function signMockFileUrl(
  fileId: string,
  userId: string,
  expires: number,
): string {
  let hash = 0;
  const str = `${fileId}:${userId}:${expires}:apply-file-secret`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function contractFileAsset(file: FileAsset & { ownerId?: string | null }): FileAsset {
  return {
    id: file.id,
    url: file.url,
    name: file.name,
    size: file.size,
    mimeType: file.mimeType,
    createdAt: file.createdAt,
  };
}

export const fileHandlers: RouteImplementations = {
  uploadFile: defineRoute<{ body: FormData }>(({ user, body, origin, request }) => {
    const actor = requireUser(user);

    // Mock rate limiting on upload
    const now = Date.now();
    const timestamps = (userUploadTimestamps.get(actor.id) ?? []).filter(
      (ts) => now - ts < UPLOAD_WINDOW_MS,
    );
    if (
      request?.headers?.get?.("x-mock-rate-limit") === "upload" ||
      timestamps.length >= MAX_UPLOADS_PER_WINDOW
    ) {
      const retryAfter = timestamps[0]
        ? Math.max(1, Math.ceil((timestamps[0] + UPLOAD_WINDOW_MS - now) / 1000))
        : 30;
      throw apiError.rateLimited(retryAfter);
    }
    userUploadTimestamps.set(actor.id, [...timestamps, now]);

    const entry = body.get("file");
    if (!(entry instanceof File)) {
      throw apiError.invalidField("file", "فایلی ارسال نشده است");
    }
    if (!ALLOWED_MIME_TYPES.includes(entry.type)) {
      throw apiError.invalidField("file", "فقط فایل‌های pdf، jpg، png و webp پذیرفته می‌شوند");
    }
    if (entry.size > MAX_UPLOAD_BYTES) {
      throw apiError.invalidField("file", "حجم فایل نباید بیشتر از ۱۰ مگابایت باشد");
    }

    const id = newId();
    const storedName = storageFileName(id, entry.type);
    blobs().set(id, entry);
    // name = UUID-based only (privacy: never store original filename)
    const expires = Date.now() + 15 * 60 * 1000;
    const sig = signMockFileUrl(id, actor.id, expires);
    const stored = getDb().files.insert({
      id,
      url: `${origin}/mock-files/${id}/${encodeURIComponent(storedName)}?exp=${expires}&uid=${actor.id}&sig=${sig}`,
      name: storedName,
      size: entry.size,
      mimeType: entry.type,
      createdAt: nowIso(),
      ownerId: actor.id,
    });
    return created(contractFileAsset(stored));
  }),
};

/** Placeholder document served for seeded files (no real binary exists) */
function placeholderSvg(label: string): string {
  const safe = label.replace(/[<>&"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320"><rect width="480" height="320" fill="#f4f4f5"/><text x="240" y="150" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#52525b">فایل آزمایشی</text><text x="240" y="186" text-anchor="middle" font-family="monospace" font-size="14" fill="#71717a">${safe}</text></svg>`;
}

/**
 * Non-contract helper endpoint: `GET /mock-files/:id/:name` serves uploaded
 * blobs or an SVG placeholder. Paths use UUID storage keys only.
 * Validates expiration, signature, and user isolation for student files.
 */
export function createFileServingHandlers(): HttpHandler[] {
  return [
    http.get("*/mock-files/:id/:name", ({ params, request }) => {
      const id = String(params.id);
      const url = new URL(request.url);
      const exp = url.searchParams.get("exp");
      const uid = url.searchParams.get("uid");
      const sig = url.searchParams.get("sig");

      const file = getDb().files.get(id);
      if (!file) return new HttpResponse("Not found", { status: 404 });

      // If file has an ownerId, verify signed URL, expiration, and user restriction
      if (file.ownerId) {
        if (!exp) {
          return new HttpResponse("لینک امضاشده نامعتبر است", { status: 404 });
        }
        const expires = Number(exp);
        if (Number.isFinite(expires) && Date.now() > expires) {
          return new HttpResponse("لینک منقضی شده است", { status: 410 });
        }
        // Verify signature (allow legacy 'mock' sig only if uid matches owner)
        const expectedSig = signMockFileUrl(file.id, uid ?? file.ownerId, expires);
        const isValidSig = sig === expectedSig || (sig === "mock" && (!uid || uid === file.ownerId));
        if (!isValidSig) {
          return new HttpResponse("امضای فایل نامعتبر است", { status: 404 });
        }
        // Restrict to the same user: if requested by a different user id, return 404
        if (uid && uid !== file.ownerId) {
          return new HttpResponse("Not found", { status: 404 });
        }
      } else if (exp) {
        const expires = Number(exp);
        if (Number.isFinite(expires) && Date.now() > expires) {
          return new HttpResponse("لینک منقضی شده است", { status: 410 });
        }
      }

      const blob = blobs().get(id);
      if (blob) {
        return new HttpResponse(blob, { headers: { "content-type": blob.type } });
      }
      return new HttpResponse(placeholderSvg(file.id), {
        headers: { "content-type": "image/svg+xml; charset=utf-8" },
      });
    }),
  ];
}
