"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";

import { isNotice, NOTICE_PARAM, withoutNotice } from "@/lib/notices";

export default function NoticeToast() {
  const t = useTranslations("toasts");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const notice = searchParams.get(NOTICE_PARAM);

  useEffect(() => {
    if (!isNotice(notice)) return;
    toast.success(t(notice), { id: notice });
    globalThis.history.replaceState(null, "", withoutNotice(pathname, globalThis.location.search));
  }, [notice, pathname, t]);

  return null;
}
