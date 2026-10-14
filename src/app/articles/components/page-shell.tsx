import { SiteHeader } from "@/app/restaurant/components/site-header";
import { AdminActions } from "@/app/articles/components/admin-actions";

/** The site header (with the admin buttons while logged in) and a reading-width column. Pages bring their own <h1>. */
export function PageShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader actions={<AdminActions />} />
      <main className={wide ? "mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6" : "mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6"}>
        {children}
      </main>
    </div>
  );
}
