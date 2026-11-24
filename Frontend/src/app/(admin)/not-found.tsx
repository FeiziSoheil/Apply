import { PanelNotFound } from "@/components/panel/panel-not-found";

/** 404 of `/admin/*`, rendered inside the admin shell */
export default function AdminNotFound() {
  return <PanelNotFound homeHref="/admin" homeLabel="بازگشت به داشبورد مدیریت" />;
}
