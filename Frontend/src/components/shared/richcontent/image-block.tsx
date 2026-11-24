import Image from "next/image";
import {
  resolveFileUrl as defaultResolveFileUrl,
  type ResolveFileUrl,
} from "@/lib/files/resolve-file-url";

type ImageBlockProps = {
  fileId: string;
  alt: string;
  caption?: string;
  resolveFileUrl?: ResolveFileUrl;
};

/** RichContent image: fileId → URL, next/image + optional caption. */
export function ImageBlock({
  fileId,
  alt,
  caption,
  resolveFileUrl = defaultResolveFileUrl,
}: ImageBlockProps) {
  const src = resolveFileUrl(fileId) ?? null;
  if (!src) return null;

  const localStatic = src.startsWith("/images/");

  return (
    <figure className="my-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 720px"
          unoptimized={!localStatic}
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
