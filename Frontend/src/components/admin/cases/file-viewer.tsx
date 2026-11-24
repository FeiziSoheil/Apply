"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  Download,
  Loader2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FileWarning,
} from "lucide-react";
import { AdminSideDrawer } from "@/components/admin/admin-side-drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileViewerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fileUrl: string | null | undefined;
  fileName?: string | null;
  mimeType?: string | null;
};

function isImage(mime: string | null | undefined, url: string | null | undefined) {
  if (mime?.startsWith("image/")) return true;
  if (!url) return false;
  return /\.(jpe?g|png|webp|gif)$/i.test(url);
}

function isPdf(mime: string | null | undefined, url: string | null | undefined) {
  if (mime === "application/pdf") return true;
  if (!url) return false;
  return /\.pdf$/i.test(url);
}

function ViewerToolbar({
  fileUrl,
  fileName,
  image,
  setZoom,
  setRotation,
}: {
  fileUrl: string | null | undefined;
  fileName?: string | null;
  image: boolean;
  setZoom: Dispatch<SetStateAction<number>>;
  setRotation: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className="flex flex-wrap gap-1 pt-2">
      {image ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="بزرگ‌نمایی"
            onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
          >
            <ZoomIn aria-hidden className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="کوچک‌نمایی"
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
          >
            <ZoomOut aria-hidden className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="چرخش"
            onClick={() => setRotation((value) => (value + 90) % 360)}
          >
            <RotateCw aria-hidden className="size-4" />
          </Button>
        </>
      ) : null}
      {fileUrl ? (
        <Button type="button" size="sm" variant="secondary" asChild>
          <a
            href={fileUrl}
            download={fileName ?? undefined}
            target="_blank"
            rel="noreferrer"
          >
            <Download data-icon="inline-start" aria-hidden />
            دانلود
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function ViewerBody({
  title,
  fileUrl,
  mimeType,
  zoom,
  setZoom,
  rotation,
  setRotation,
}: {
  title: string;
  fileUrl: string | null | undefined;
  mimeType?: string | null;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  rotation: number;
  setRotation: Dispatch<SetStateAction<number>>;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setZoom((value) => Math.min(3, value + 0.25));
      } else if (event.key === "-") {
        event.preventDefault();
        setZoom((value) => Math.max(0.5, value - 0.25));
      } else if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        setRotation((value) => (value + 90) % 360);
      }
    },
    [setZoom, setRotation],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  const image = isImage(mimeType, fileUrl);
  const pdf = isPdf(mimeType, fileUrl);

  return (
    <>
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
        {!fileUrl ? (
          <EmptyFile message="فایلی برای نمایش وجود ندارد." />
        ) : image ? (
          imgError ? (
            <EmptyFile message="بارگذاری تصویر ناموفق بود." />
          ) : (
            <>
              {imgLoading ? (
                <Loader2
                  aria-hidden
                  className="absolute size-8 animate-spin text-muted-foreground"
                />
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileUrl}
                alt={title}
                className={cn(
                  "max-h-full max-w-full object-contain transition-transform",
                  imgLoading && "opacity-0",
                )}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
                onLoad={() => setImgLoading(false)}
                onError={() => {
                  setImgLoading(false);
                  setImgError(true);
                }}
              />
            </>
          )
        ) : pdf ? (
          <iframe
            title={title}
            src={fileUrl}
            className="size-full min-h-[60dvh] rounded-md border bg-background"
          />
        ) : (
          <EmptyFile message="این نوع فایل در پیش‌نمایش پشتیبانی نمی‌شود. از دانلود استفاده کنید." />
        )}
      </div>
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        میانبرها: + / − برای بزرگ‌نمایی، R برای چرخش، Escape برای بستن
      </p>
    </>
  );
}

function FileViewerOpen({
  open,
  onOpenChange,
  title,
  fileUrl,
  fileName,
  mimeType,
}: FileViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const image = isImage(mimeType, fileUrl);

  return (
    <AdminSideDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={<span className="truncate">{title}</span>}
      description={
        <span className="truncate" dir="ltr">
          {fileName ?? "فایل"}
        </span>
      }
      headerExtra={
        <ViewerToolbar
          fileUrl={fileUrl}
          fileName={fileName}
          image={image}
          setZoom={setZoom}
          setRotation={setRotation}
        />
      }
      className="max-w-3xl"
      sheetSide="bottom"
      sheetClassName="h-[min(92dvh,900px)] p-0 sm:inset-y-0 sm:start-auto sm:end-0 sm:h-full sm:w-full sm:max-w-3xl sm:rounded-none data-[side=end]:sm:max-w-3xl"
    >
      <ViewerBody
        title={title}
        fileUrl={fileUrl}
        mimeType={mimeType}
        zoom={zoom}
        setZoom={setZoom}
        rotation={rotation}
        setRotation={setRotation}
      />
    </AdminSideDrawer>
  );
}

export function FileViewer({
  open,
  onOpenChange,
  title,
  fileUrl,
  fileName,
  mimeType,
}: FileViewerProps) {
  if (!open) {
    return (
      <AdminSideDrawer
        open={false}
        onOpenChange={onOpenChange}
        title={title}
        description={fileName ?? "فایل"}
        className="max-w-3xl"
        sheetSide="bottom"
      >
        {null}
      </AdminSideDrawer>
    );
  }

  return (
    <FileViewerOpen
      key={fileUrl ?? title}
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      fileUrl={fileUrl}
      fileName={fileName}
      mimeType={mimeType}
    />
  );
}

function EmptyFile({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
      <FileWarning aria-hidden className="size-8 opacity-60" />
      <p>{message}</p>
    </div>
  );
}
