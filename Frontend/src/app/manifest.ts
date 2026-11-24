import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "اپلای | پذیرش تحصیلی",
    short_name: "اپلای",
    description: "سامانه پذیرش تحصیلی، مدارک و مشاوره مهاجرت دانشجویی",
    start_url: "/panel",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#09090b",
    lang: "fa",
    dir: "rtl",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
