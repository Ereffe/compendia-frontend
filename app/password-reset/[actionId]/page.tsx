import { notFound } from "next/navigation";

import { ConfirmPasswordChangeForm } from "@/components/account/accountActionForms";
import { isValidActionId } from "@/lib/account";

export default async function PasswordResetPage({ params }: Readonly<{ params: Promise<{ actionId: string }> }>) {
  const { actionId } = await params;
  if (!isValidActionId(actionId)) {
    notFound();
  }

  return (
    <section className="container-page flex flex-1 flex-col justify-center py-10 sm:py-16">
      <ConfirmPasswordChangeForm actionId={actionId} />
    </section>
  );
}
