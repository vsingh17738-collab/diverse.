import { LoginForm } from "@/components/auth/auth-form";

export const metadata = { title: "Sign in · Nexus Gaming Zone" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
