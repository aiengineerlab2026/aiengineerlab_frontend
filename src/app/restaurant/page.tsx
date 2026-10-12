import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LabPanel } from "@/app/restaurant/components/panel/lab-panel";
import { RestaurantSimulator } from "@/app/restaurant/components/simulator/restaurant-simulator";

export const metadata: Metadata = { title: "The Restaurant · AI Engineer Lab" };

export default function RestaurantLabPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> AI Engineer Lab
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="text-sm font-semibold text-brand-dark">The Restaurant</h1>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1500px] flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[2fr_3fr] lg:items-start">
        {/* ~40%: the mobile app being tuned */}
        <section aria-label="Restaurant mobile app simulator" className="lg:sticky lg:top-4">
          <RestaurantSimulator />
        </section>
        {/* ~60%: tuning panel */}
        <section aria-label="Tuning panel" className="min-w-0">
          <LabPanel />
        </section>
      </main>
    </div>
  );
}
