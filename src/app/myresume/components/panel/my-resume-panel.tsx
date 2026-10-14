"use client";

import { BarChart3, SlidersHorizontal } from "lucide-react";
import { GuidedTabsTrigger } from "@/app/restaurant/components/panel/tab-guide";
import { Tabs, TabsContent, TabsList } from "@/app/restaurant/components/ui/tabs";
import { useLab, type PanelTab } from "@/app/myresume/stores/lab-store";
import { ConfigurationTab } from "./configuration-tab";
import { EvaluationTab } from "./evaluation-tab";

const TABS: { id: PanelTab; label: string; icon: typeof BarChart3 }[] = [
  { id: "configuration", label: "Configuration", icon: SlidersHorizontal },
  { id: "evaluation", label: "Evaluation", icon: BarChart3 },
];

/** The tuning panel: retrieval configuration and the ranking evaluation. Same look as the restaurant lab's panel. */
export function MyResumePanel() {
  const tab = useLab((s) => s.panelTab);
  const setTab = useLab((s) => s.setPanelTab);
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as PanelTab)} className="gap-0">
      <div className="mb-5 max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList className="inline-flex h-auto w-full items-center justify-start gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1.5 shadow-inner group-data-horizontal/tabs:h-auto sm:w-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <GuidedTabsTrigger
              key={id}
              project="myresume"
              guide={id}
              value={id}
              className={
                "h-auto flex-1 items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2 text-xs font-medium text-slate-600 sm:flex-none " +
                "cursor-pointer transition-all duration-150 hover:bg-slate-200/50 hover:text-slate-900 " +
                "data-active:scale-[1.01] data-active:border-slate-200/80 data-active:bg-card data-active:font-semibold data-active:text-slate-900 data-active:shadow-sm " +
                "[&_svg]:text-slate-400 [&_svg]:transition-colors hover:[&_svg]:text-slate-600 data-active:[&_svg]:text-emerald-600 data-active:hover:[&_svg]:text-emerald-600"
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </GuidedTabsTrigger>
          ))}
        </TabsList>
      </div>
      {/* Keep the configuration form mounted so unsaved edits survive switching tabs. */}
      <TabsContent value="configuration" keepMounted>
        <ConfigurationTab />
      </TabsContent>
      <TabsContent value="evaluation">
        <EvaluationTab />
      </TabsContent>
    </Tabs>
  );
}
