import { ForgotPasswordForm } from "@/components/PasswordForms";
import { AuthScreen } from "../login/AuthScreen";

export const metadata = { title: "Forgot password — Crossdesk" };

export default function ForgotPasswordPage() {
  return (
    <AuthScreen>
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
