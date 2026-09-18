import { redirect } from "next/navigation";

// No landing page yet: the proxy sends signed-in users on to /dashboard.
export default function Home() {
  redirect("/login");
}
