import { Applications } from "@/app/restaurant/components/home/applications";
import { Hero } from "@/app/restaurant/components/home/hero";
import { errorMessage } from "@/app/restaurant/lib/client";
import { apps } from "@/app/restaurant/lib/endpoints";
import type { AppInfo } from "@/app/restaurant/types/api";

// The registry lives in the backend; never prerender it at build time.
export const dynamic = "force-dynamic";

async function loadApps(): Promise<{ apps: AppInfo[]; error: string | null }> {
  try {
    return { apps: await apps.list(), error: null };
  } catch (e) {
    return { apps: [], error: errorMessage(e) };
  }
}

export default async function HomePage() {
  const { apps: registry, error } = await loadApps();
  return (
    <main className="flex-1">
      <Hero />
      <Applications apps={registry} error={error} />
    </main>
  );
}
