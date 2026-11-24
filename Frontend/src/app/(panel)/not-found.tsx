import { PanelNotFound } from "@/components/panel/panel-not-found";

/** 404 of `/panel/*`, rendered inside the student shell */
export default function PanelNotFoundPage() {
  return <PanelNotFound homeHref="/panel" homeLabel="بازگشت به داشبورد" />;
}
