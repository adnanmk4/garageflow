import { NextResponse } from "next/server";
import { SUPPORTED_LOCALES, LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n/request";

export async function POST(request: Request) {
  const { locale } = await request.json();

  if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
