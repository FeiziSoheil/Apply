import { redirect } from "next/navigation";

/** مسیر قدیمی — به `/panel/messages` منتقل شد */
export default function PanelTicketsRedirectPage() {
  redirect("/panel/messages");
}
