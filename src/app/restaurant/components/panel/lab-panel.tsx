"use client";

import { BarChart3, Microscope, SlidersHorizontal } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/restaurant/components/ui/tabs";
import { useLabStore, type PanelTab } from "@/app/restaurant/stores/lab-store";
import { ConfigurationTab } from "./configuration-tab";
import { LiveEvaluationView } from "./live-evaluation";
import { InspectorTab } from "./inspector-tab";

const TABS: { id: PanelTab; label: string; icon: typeof Microscope }[] = [
  { id: "configuration", label: "Configuration", icon: SlidersHorizontal },
  { id: "inspector", label: "Retrieval Inspector", icon: Microscope },
  { id: "evaluation", label: "Evaluation", icon: BarChart3 },
];

export function LabPanel() {
  const tab = useLabStore((s) => s.panelTab);
  const setTab = useLabStore((s) => s.setPanelTab);
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as PanelTab)} className="gap-0">
      <div className="mb-5 max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <TabsList className="inline-flex h-auto w-full min-w-max items-center justify-start gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1.5 shadow-inner group-data-horizontal/tabs:h-auto sm:w-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className={
                "h-auto flex-none items-center justify-center gap-2 rounded-lg border border-transparent px-4 py-2 text-xs font-medium text-slate-600 " +
                "cursor-pointer transition-all duration-150 hover:bg-slate-200/50 hover:text-slate-900 " +
                "data-active:scale-[1.01] data-active:border-slate-200/80 data-active:bg-card data-active:font-semibold data-active:text-slate-900 data-active:shadow-sm " +
                "[&_svg]:text-slate-400 [&_svg]:transition-colors hover:[&_svg]:text-slate-600 data-active:[&_svg]:text-emerald-600 data-active:hover:[&_svg]:text-emerald-600"
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {/* Keep the configuration form mounted so unsaved edits survive switching tabs. */}
      <TabsContent value="configuration" keepMounted>
        <ConfigurationTab />
      </TabsContent>
      <TabsContent value="inspector">
        <InspectorTab />
      </TabsContent>
      <TabsContent value="evaluation">
        <LiveEvaluationView />
      </TabsContent>
    </Tabs>
  );
}
