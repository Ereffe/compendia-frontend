import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";

import { timeZone, type Locale } from "@/i18n/config";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

const messagesByLocale = { pl, en };

/** Renders with the real translations. Polish by default, like the app. */
export function renderWithIntl(ui: ReactElement, { locale = "pl", ...options }: RenderOptions & { locale?: Locale } = {}) {
    return render(
        <NextIntlClientProvider
            locale={locale}
            messages={messagesByLocale[locale]}
            timeZone={timeZone}
            // Fail the test on a missing or malformed message instead of logging a warning.
            onError={(error) => {
                throw error;
            }}
        >
            {ui}
        </NextIntlClientProvider>,
        options,
    );
}
