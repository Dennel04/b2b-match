import { AuthScreen } from "./AuthScreen";

export const metadata = { title: "Log in — B2B Match" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, mode } = await searchParams;
  return (
    <AuthScreen
      mode={mode === "signup" ? "signup" : "login"}
      error={typeof error === "string" ? error : undefined}
    />
  );
}
