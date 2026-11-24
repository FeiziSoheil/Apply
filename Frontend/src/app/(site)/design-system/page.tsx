import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  formatJalaliDate,
  formatNumber,
  formatPrice,
  toPersianDigits,
} from "@/lib/format";

export const metadata: Metadata = createPageMetadata({
  title: "سیستم طراحی",
  description:
    "صفحه موقت بررسی توکن‌ها و کامپوننت‌های UI",
  path: "/design-system",
  noIndex: true,
});

const buttonVariants = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
  "link",
] as const;

const badgeVariants = [
  "default",
  "secondary",
  "outline",
  "destructive",
  "ghost",
  "link",
] as const;

export default function DesignSystemPage() {
  const sampleDate = new Date("2026-03-20T12:00:00Z");

  return (
    <>
      <Section title="سیستم طراحی"
        subtitle="صفحه موقت برای بازبینی بصری توکن‌ها، تایپوگرافی و کامپوننت‌های پایه. جهت صفحه RTL است."
        className="pb-8"
      />

      <Section title="تایپوگرافی"
        subtitle="مقیاس عنوان‌ها و متن بدنه با line-height مناسب فارسی">
        <div className="flex flex-col gap-4">
          <h1>عنوان یک — همراه مطمئن برای تحصیل در خارج</h1>
          <h2>عنوان دو — مسیر پذیرش و ویزا</h2>
          <h3>عنوان سه — مشاوره تخصصی کشورها</h3>
          <h4>عنوان چهار — جزئیات برنامه تحصیلی</h4>
          <p>
            متن بدنه با حداقل فاصله خطوط ۱٫۸ برای خوانایی فارسی. این پاراگراف
            نمونه است تا ارتفاع خط و وزن فونت وزیرمتن روی پس‌زمینه خنثی روشن
            بررسی شود.
          </p>
        </div>
      </Section>

      <Section title="رنگ‌ها"
        subtitle="توکن‌های اصلی برند — آبی عمیق و نارنجی گرم">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["primary", "bg-primary text-primary-foreground"],
              ["accent", "bg-accent text-accent-foreground"],
              ["secondary", "bg-secondary text-secondary-foreground"],
              ["muted", "bg-muted text-muted-foreground"],
            ] as const
          ).map(([name, classes]) => (
            <div
              key={name}
              className={`flex h-20 items-end rounded-lg p-3 text-sm font-medium ${classes}`}
            >
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="دکمه‌ها" subtitle="همه variantهای Button">
        <div className="flex flex-wrap items-center gap-3">
          {buttonVariants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            CTA accent
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">کوچک</Button>
          <Button size="default">پیش‌فرض</Button>
          <Button size="lg">بزرگ</Button>
        </div>
      </Section>

      <Section title="ورودی" subtitle="Input با برچسب فارسی">
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ds-name">نام و نام خانوادگی</Label>
            <Input
              id="ds-name"
              name="name"
              placeholder="مثلاً سارا احمدی"
              autoComplete="name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ds-email">ایمیل</Label>
            <Input
              id="ds-email"
              name="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
            />
          </div>
        </div>
      </Section>

      <Section title="نشان‌ها" subtitle="Badge variants">
        <div className="flex flex-wrap items-center gap-2">
          {badgeVariants.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="کارت" subtitle="ترکیب کامل Card">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>مشاوره پذیرش</CardTitle>
            <CardDescription>
              بررسی پرونده تحصیلی و پیشنهاد دانشگاه‌های مناسب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              هزینه نمونه: {formatPrice(4_500_000)}
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button>شروع کنید</Button>
            <Button variant="outline">جزئیات</Button>
          </CardFooter>
        </Card>
      </Section>

      <Section title="قالب‌بندی اعداد و تاریخ"
        subtitle="خروجی توابع src/lib/format.ts">
        <ul className="flex flex-col gap-2 text-foreground">
          <li>
            toPersianDigits: {toPersianDigits("Phone: 021-9100")}
          </li>
          <li>formatNumber: {formatNumber(1234567)}</li>
          <li>formatPrice: {formatPrice(1250000)}</li>
          <li>formatJalaliDate: {formatJalaliDate(sampleDate)}</li>
        </ul>
      </Section>

      <Section title="بردکرامب و صفحه‌بندی"
        subtitle="بررسی جهت فلش‌ها در RTL">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">خانه</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/design-system">سیستم طراحی</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>نمایش</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {toPersianDigits(1)}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">{toPersianDigits(2)}</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Section>
    </>
  );
}
