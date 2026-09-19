import { ResetPasswordForm } from "@/components/PasswordForms";
import { currentUser } from "@/lib/supabase";
import { AuthScreen } from "../login/AuthScreen";

export const metadata = { title: "Set a new password — Crossdesk" };

/** Reached from the reset email through /auth/callback, which has already signed the person in. */
export default async function ResetPasswordPage() {
  const user = await currentUser();
  return (
    <AuthScreen>
      <ResetPasswordForm signedIn={Boolean(user)} />
    </AuthScreen>
  );
}
