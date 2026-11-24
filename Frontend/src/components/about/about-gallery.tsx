import Image from "next/image";
import type { AboutGalleryImage } from "@/types";

type AboutGalleryProps = {
  images: AboutGalleryImage[];
};

export function AboutGallery({ images }: AboutGalleryProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {images.map((image) => (
        <li key={image.id} className="overflow-hidden rounded-2xl bg-muted">
          <div className="relative aspect-[16/10]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 560px"
            />
          </div>
          <p className="px-4 py-3 text-sm text-muted-foreground">
            {image.caption}
          </p>
        </li>
      ))}
    </ul>
  );
}
