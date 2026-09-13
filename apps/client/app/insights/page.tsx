"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DailyAnalytics } from "@/components/dashboard/daily-analytics";

export default function InsightsPage() {
  return (
    <DashboardShell pageTitle="Insights">
      {() => <DailyAnalytics />}
    </DashboardShell>
  );
}
