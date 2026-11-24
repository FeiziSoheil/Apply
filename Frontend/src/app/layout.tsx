import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { DemoBanner } from "@/components/shared/demo-banner";
import { JsonLd } from "@/components/shared/json-ld";
import { INSTITUTE } from "@/lib/constants";
import { isDemoBuild } from "@/lib/mock-safety";
import { MockDevPanel } from "@/mocks/dev-panel";
import { vazirmatn } from "@/lib/fonts";
import {
  absoluteUrl,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  createPageMetadata,
} from "@/lib/seo";
import "./globals.css";

const rootMeta = createPageMetadata({
  title: INSTITUTE.name,
  description:
    "موسسه اعزام دانشجو به خارج از کشور — مشاوره تحصیلی، پذیرش دانشگاه، ویزا و همراهی تا شروع تحصیل.",
  path: "/",
  keywords: [
    "اعزام دانشجو",
    "تحصیل در خارج",
    "مشاوره تحصیلی",
    "پذیرش دانشگاه",
    "ویزای تحصیلی",
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl("/")),
  title: {
    default: INSTITUTE.name,
    template: `%s | ${INSTITUTE.name}`,
  },
  description: rootMeta.description,
  keywords: rootMeta.keywords,
  alternates: rootMeta.alternates,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: INSTITUTE.name,
  },
  openGraph: {
    ...rootMeta.openGraph,
    type: "website",
  },
  twitter: rootMeta.twitter,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
      data-demo-build={isDemoBuild() ? "" : undefined}
    >
      <body className="flex min-h-full flex-col bg-background pb-(--demo-banner-height) font-sans text-foreground">
        <JsonLd data={buildOrganizationJsonLd()} />
        <JsonLd data={buildWebSiteJsonLd()} />
        <NuqsAdapter>
          <DirectionProvider dir="rtl">
            <TooltipProvider>
              {children}
              <Toaster richColors position="top-center" dir="rtl" />
              <MockDevPanel />
              <DemoBanner />
            </TooltipProvider>
          </DirectionProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
