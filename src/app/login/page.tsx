import { AuthScreen } from "./AuthScreen";

export const metadata = { title: "Log in — Crossdesk" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, mode } = await searchParams;
  return (
    <AuthScreen
      mode={mode === "signup" ? "signup" : "login"}
      error={typeof error === "string" ? error : undefined}
    />
  );
}
