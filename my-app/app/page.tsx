import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";
import HeroPage from "@/components/HeroPage";

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  const isAuthenticated = Boolean(userId);

  return <HeroPage isAuthenticated={isAuthenticated} />;
}
