"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/restaurant/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/restaurant/components/ui/dialog";
import { Input } from "@/app/restaurant/components/ui/input";
import { Label } from "@/app/restaurant/components/ui/label";
import { errorMessage } from "@/app/restaurant/lib/client";
import { GLASS_BUTTON } from "@/app/restaurant/lib/header-style";
import { cn } from "@/app/restaurant/lib/utils";
import { getToken, setToken, useToken } from "@/app/articles/lib/auth";
import { admin } from "@/app/articles/lib/endpoints";

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const change = useMutation({
    mutationFn: () => admin.changePassword(getToken() ?? "", current, next),
    onSuccess: (res) => {
      setToken(res.token); // the old token stops working with the old password
      toast.success("Password changed.");
      onOpenChange(false);
    },
  });
  const mismatch = confirm !== "" && confirm !== next;
  const canSave = current !== "" && next.length >= 8 && next === confirm && !change.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setCurrent("");
          setNext("");
          setConfirm("");
          change.reset();
        }
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) change.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Use at least 8 characters. You stay logged in on this browser.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="pw-current">Current password</Label>
            <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pw-new">New password</Label>
            <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pw-confirm">Repeat new password</Label>
            <Input id="pw-confirm" type="password" autoComplete="new-password" aria-invalid={mismatch} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {mismatch && <p className="text-xs text-destructive">The passwords do not match.</p>}
          </div>
          {change.isError && <p role="alert" className="text-sm text-destructive">{errorMessage(change.error)}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSave}>{change.isPending ? "Saving…" : "Save password"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Change password and log out, shown in the header only while an admin is logged in. */
export function AdminActions() {
  const token = useToken();
  const router = useRouter();
  const [passwordOpen, setPasswordOpen] = useState(false);
  if (!token) return null;

  return (
    <>
      <button type="button" aria-label="Change password" title="Change password" onClick={() => setPasswordOpen(true)} className={cn(GLASS_BUTTON)}>
        <KeyRound className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Log out"
        title="Log out"
        onClick={() => {
          setToken(null);
          router.replace("/articles");
        }}
        className={cn(GLASS_BUTTON)}
      >
        <LogOut className="size-4" />
      </button>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
