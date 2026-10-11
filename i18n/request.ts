import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, isLocale, LOCALE_COOKIE, timeZone } from "./config";

export default getRequestConfig(async () => {
    const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
    const locale = isLocale(cookieLocale) ? cookieLocale : defaultLocale;

    return {
        locale,
        timeZone,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
