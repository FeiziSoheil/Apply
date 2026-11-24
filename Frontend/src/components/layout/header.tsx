import { getCountries } from "@/services/countries";
import { HeaderClient } from "@/components/layout/header-client";

/** Server wrapper: loads countries for mega menu, then hands off to client shell */
export async function Header() {
  const countries = await getCountries();
  return <HeaderClient countries={countries} />;
}
