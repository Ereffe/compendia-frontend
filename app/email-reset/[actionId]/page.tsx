import { notFound } from "next/navigation";

import { ConfirmEmailChangeForm } from "@/components/account/accountActionForms";
import { isValidActionId } from "@/lib/account";

export default async function EmailResetPage({ params }: Readonly<{ params: Promise<{ actionId: string }> }>) {
  const { actionId } = await params;
  if (!isValidActionId(actionId)) {
    notFound();
  }

  return (
    <section className="container-page flex flex-1 flex-col justify-center py-10 sm:py-16">
      <ConfirmEmailChangeForm actionId={actionId} />
    </section>
  );
}
