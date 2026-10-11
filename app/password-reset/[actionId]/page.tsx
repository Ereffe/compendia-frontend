import { ActionLinkInvalid, ConfirmPasswordChangeForm } from "@/components/account/accountActionForms";
import { isActionLinkValid } from "@/lib/server/actionLinks";

export default async function PasswordResetPage({ params }: Readonly<{ params: Promise<{ actionId: string }> }>) {
  const { actionId } = await params;
  const valid = await isActionLinkValid(actionId, "CHANGE_PASSWORD");

  return (
    <section className="container-page flex flex-1 flex-col justify-center py-10 sm:py-16">
      {valid ? <ConfirmPasswordChangeForm actionId={actionId} /> : <ActionLinkInvalid />}
    </section>
  );
}
