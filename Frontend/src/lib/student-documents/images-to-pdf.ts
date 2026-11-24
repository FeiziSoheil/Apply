/**
 * Merge one or more JPEG/PNG page blobs into a single PDF.
 *
 * Primary path: `pdf-lib`. Fallback: minimal JPEG-in-PDF writer if import fails.
 */

export type PdfPageInput = {
  /** Image bytes (jpeg/png) */
  bytes: Uint8Array;
  mimeType: string;
  width: number;
  height: number;
};

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function encoder() {
  return new TextEncoder();
}

function asBlobPart(bytes: Uint8Array): BlobPart {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

/**
 * Minimal multi-page PDF with embedded JPEG images (DCTDecode).
 * Used only when pdf-lib is unavailable at runtime.
 */
export function buildJpegPagesPdf(
  pages: readonly { jpeg: Uint8Array; width: number; height: number }[],
): Uint8Array {
  if (pages.length === 0) {
    throw new Error("حداقل یک صفحه برای ساخت PDF لازم است.");
  }

  const enc = encoder();
  const offsets: number[] = [];

  const pageCount = pages.length;
  const catalogNum = 1;
  const pagesNum = 2;
  let nextNum = 3;
  const pageNums: number[] = [];
  const contentNums: number[] = [];
  const imageNums: number[] = [];

  for (let i = 0; i < pageCount; i++) {
    pageNums.push(nextNum++);
    contentNums.push(nextNum++);
    imageNums.push(nextNum++);
  }

  const parts: Uint8Array[] = [];
  let position = 0;

  const write = (chunk: Uint8Array) => {
    parts.push(chunk);
    position += chunk.length;
  };

  const writeObj = (num: number, dictAndStream: string | Uint8Array) => {
    offsets[num] = position;
    write(enc.encode(`${num} 0 obj\n`));
    if (typeof dictAndStream === "string") {
      write(enc.encode(dictAndStream));
    } else {
      write(dictAndStream);
    }
    write(enc.encode("\nendobj\n"));
  };

  write(enc.encode("%PDF-1.4\n"));

  const kids = pageNums.map((n) => `${n} 0 R`).join(" ");
  writeObj(catalogNum, `<< /Type /Catalog /Pages ${pagesNum} 0 R >>`);
  writeObj(
    pagesNum,
    `<< /Type /Pages /Kids [ ${kids} ] /Count ${pageCount} >>`,
  );

  for (let i = 0; i < pageCount; i++) {
    const page = pages[i]!;
    const pageNum = pageNums[i]!;
    const contentNum = contentNums[i]!;
    const imageNum = imageNums[i]!;
    const w = page.width;
    const h = page.height;

    writeObj(
      pageNum,
      `<< /Type /Page /Parent ${pagesNum} 0 R /MediaBox [0 0 ${w} ${h}] /Contents ${contentNum} 0 R /Resources << /XObject << /Im${i} ${imageNum} 0 R >> >> >>`,
    );

    const contentStream = enc.encode(`q ${w} 0 0 ${h} 0 0 cm /Im${i} Do Q`);
    writeObj(
      contentNum,
      concatBytes([
        enc.encode(`<< /Length ${contentStream.length} >>\nstream\n`),
        contentStream,
        enc.encode("\nendstream"),
      ]),
    );

    writeObj(
      imageNum,
      concatBytes([
        enc.encode(
          `<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
        ),
        page.jpeg,
        enc.encode("\nendstream"),
      ]),
    );
  }

  const xrefStart = position;
  const maxObj = nextNum - 1;
  let xref = `xref\n0 ${maxObj + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i <= maxObj; i++) {
    const off = offsets[i] ?? 0;
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }
  write(enc.encode(xref));
  write(
    enc.encode(
      `trailer\n<< /Size ${maxObj + 1} /Root ${catalogNum} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
    ),
  );

  return concatBytes(parts);
}

async function blobToJpegBytes(
  blob: Blob,
  width: number,
  height: number,
): Promise<{ jpeg: Uint8Array; width: number; height: number }> {
  if (blob.type === "image/jpeg" || blob.type === "image/jpg") {
    const buffer = await blob.arrayBuffer();
    return { jpeg: new Uint8Array(buffer), width, height };
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width || bitmap.width;
    canvas.height = height || bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("امکان تبدیل تصویر به PDF نیست.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result
            ? resolve(result)
            : reject(new Error("تبدیل تصویر ناموفق بود.")),
        "image/jpeg",
        0.9,
      );
    });
    const buffer = await jpegBlob.arrayBuffer();
    return {
      jpeg: new Uint8Array(buffer),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    bitmap.close();
  }
}

/** Prefer pdf-lib; return null if it cannot embed the pages. */
export async function mergeWithPdfLib(
  pages: readonly PdfPageInput[],
): Promise<Uint8Array | null> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    for (const page of pages) {
      const embedded =
        page.mimeType === "image/png"
          ? await doc.embedPng(page.bytes)
          : await doc.embedJpg(page.bytes);
      const pdfPage = doc.addPage([embedded.width, embedded.height]);
      pdfPage.drawImage(embedded, {
        x: 0,
        y: 0,
        width: embedded.width,
        height: embedded.height,
      });
    }
    return await doc.save();
  } catch {
    return null;
  }
}

/**
 * Merge image pages into one PDF File.
 * Uses pdf-lib first; falls back to the JPEG PDF writer only if needed.
 */
export async function mergeImagePagesToPdf(
  pages: readonly PdfPageInput[],
  fileName = "document.pdf",
): Promise<File> {
  if (pages.length === 0) {
    throw new Error("صفحه‌ای برای ساخت PDF انتخاب نشده است.");
  }

  const viaLib = await mergeWithPdfLib(pages);
  if (viaLib) {
    return new File([asBlobPart(viaLib)], fileName, {
      type: "application/pdf",
    });
  }

  const jpegPages = await Promise.all(
    pages.map(async (page) => {
      const blob = new Blob([asBlobPart(page.bytes)], { type: page.mimeType });
      return blobToJpegBytes(blob, page.width, page.height);
    }),
  );

  const pdfBytes = buildJpegPagesPdf(jpegPages);
  return new File([asBlobPart(pdfBytes)], fileName, {
    type: "application/pdf",
  });
}
