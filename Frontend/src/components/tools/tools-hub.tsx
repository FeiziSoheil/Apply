import Link from "next/link";
import { Calculator, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const TOOLS = [
  {
    href: "/tools/cost-calculator",
    title: "ماشین‌حساب هزینه تحصیل",
    description:
      "شهریه، زندگی، بیمه و ویزا را بر اساس کشور، مقطع و سبک زندگی برآورد کنید.",
    icon: Calculator,
  },
  {
    href: "/tools/deadline-countdown",
    title: "شمارش معکوس ددلاین",
    description:
      "برنامه یا دانشگاه را انتخاب کنید و زمان باقی‌مانده تا مهلت پذیرش را ببینید.",
    icon: Timer,
  },
] as const;

export function ToolsHub() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        return (
          <li key={tool.href}>
            <Card className="h-full">
              <CardHeader>
                <div
                  className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
                  aria-hidden
                >
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={tool.href}>باز کردن ابزار</Link>
                </Button>
              </CardFooter>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
