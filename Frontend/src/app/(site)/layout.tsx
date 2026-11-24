import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingContact } from "@/components/layout/floating-contact";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-3 focus:ring-ring/50"
      >
        رفتن به محتوای اصلی
      </a>

      <Header />

      <main
        id="content"
        tabIndex={-1}
        className="flex-1 pb-24 outline-none md:pb-0"
      >
        {children}
      </main>

      <Footer />
      <FloatingContact />
    </>
  );
}
