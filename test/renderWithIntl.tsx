import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";

import { timeZone, type Locale } from "@/i18n/config";
import en from "@/messages/en.json";
import pl from "@/messages/pl.json";

const messagesByLocale = { pl, en };

export function renderWithIntl(ui: ReactElement, { locale = "pl", ...options }: RenderOptions & { locale?: Locale } = {}) {
    return render(
        <NextIntlClientProvider
            locale={locale}
            messages={messagesByLocale[locale]}
            timeZone={timeZone}
            onError={(error) => {
                throw error;
            }}
        >
            {ui}
        </NextIntlClientProvider>,
        options,
    );
}
