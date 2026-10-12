"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/app/restaurant/components/ui/tooltip";
import { Toaster } from "@/app/restaurant/components/ui/sonner";
import { ApiError } from "@/app/restaurant/lib/client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            // Don't hammer the API on client errors; retry transient/network failures once.
            retry: (count, error) =>
              count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delay={200}>{children}</TooltipProvider>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
