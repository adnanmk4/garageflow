import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const SUPPORTED_LOCALES = ["en", "ur"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "gf_locale";

/**
 * We deliberately do NOT use next-intl's URL-based routing ([locale]
 * segments). The brief calls for a language switcher that instantly
 * changes the whole UI without navigating anywhere — a cookie-based
 * locale keeps every route the same URL in either language, which also
 * means invoice/QR links don't fork by language.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = SUPPORTED_LOCALES.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : DEFAULT_LOCALE;

  const [common, jobs, invoices, vehicles, settings] = await Promise.all([
    import(`@/locales/${locale}/common.json`),
    import(`@/locales/${locale}/jobs.json`),
    import(`@/locales/${locale}/invoices.json`),
    import(`@/locales/${locale}/vehicles.json`),
    import(`@/locales/${locale}/settings.json`),
  ]);

  return {
    locale,
    messages: {
      ...common.default,
      ...jobs.default,
      ...invoices.default,
      ...vehicles.default,
      ...settings.default,
    },
  };
});
