"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/app/restaurant/lib/client";
import { setToken, useToken } from "@/app/articles/lib/auth";
import { admin } from "@/app/articles/lib/endpoints";

/** Renders its children only for a logged-in admin; anyone else is sent to /login and brought back afterwards. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = useToken();
  const router = useRouter();
  const pathname = usePathname();
  const session = useQuery({
    queryKey: ["admin-session", token],
    queryFn: () => admin.session(token ?? ""),
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
  });
  const rejected = session.error instanceof ApiError && session.error.status === 401;

  useEffect(() => {
    if (rejected) setToken(null); // an expired or revoked token is worthless
    if (token === null || rejected) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [token, rejected, router, pathname]);

  if (token && session.isSuccess) return <>{children}</>;
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {session.isError && !rejected ? "Cannot check your login right now." : "Checking your login…"}
    </div>
  );
}
