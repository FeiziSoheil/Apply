import Link from "next/link";
import { POPULAR_LINKS } from "@/lib/constants";
import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center gap-8 py-16 text-center">
      <div className="space-y-3">
        <p
          className="font-heading text-6xl font-bold tracking-tight text-primary sm:text-7xl"
          aria-hidden="true"
        >
          ۴۰۴
        </p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          صفحه پیدا نشد
        </h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          متأسفانه صفحه مورد نظر وجود ندارد، حذف شده یا آدرس آن تغییر کرده است.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/">بازگشت به خانه</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">تماس با ما</Link>
        </Button>
      </div>

      <nav aria-label="صفحات پربازدید" className="w-full max-w-lg">
        <p className="mb-3 text-sm font-medium text-foreground">
          صفحات پیشنهادی
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {POPULAR_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {link.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}