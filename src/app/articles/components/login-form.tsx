"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/app/restaurant/components/ui/button";
import { Input } from "@/app/restaurant/components/ui/input";
import { Label } from "@/app/restaurant/components/ui/label";
import { errorMessage } from "@/app/restaurant/lib/client";
import { setToken } from "@/app/articles/lib/auth";
import { admin } from "@/app/articles/lib/endpoints";

/** Only same-site paths are allowed as the place to go after logging in. */
function safeNext(next: string | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/articles";
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => admin.login(username.trim(), password),
    onSuccess: (res) => {
      setToken(res.token);
      router.replace(safeNext(next));
    },
  });

  return (
    <main className="flex flex-1 items-center justify-center bg-(--paper-sunk) px-4 py-12">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (username && password) login.mutate();
        }}
        className="w-full max-w-sm space-y-5 rounded-xl border border-l-4 border-l-(--brand) bg-card p-6 shadow-xs"
      >
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex size-10 items-center justify-center rounded-lg border bg-(--brand)/10 text-(--brand)">
            <FlaskConical className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold">Admin login</h1>
            <p className="text-sm text-muted-foreground">AI Engineer Lab</p>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {login.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(login.error)}</p>}
        <Button type="submit" size="lg" className="w-full bg-(--brand) text-white hover:bg-(--brand-hover)" disabled={!username || !password || login.isPending}>
          {login.isPending && <Loader2 className="animate-spin" />}
          Log in
        </Button>
        <Link href="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          Back to AI Engineer Lab
        </Link>
      </form>
    </main>
  );
}
