import type { Metadata } from "next";
import { LoginForm } from "@/app/articles/components/login-form";

export const metadata: Metadata = { title: "Login · AI Engineer Lab", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <LoginForm next={Array.isArray(next) ? next[0] : next} />;
}
