"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TimeLogsHistory } from "@/components/dashboard/time-logs-history";

export default function TimeLogsPage() {
  return (
    <DashboardShell pageTitle="Time Logs">
      {() => <TimeLogsHistory />}
    </DashboardShell>
  );
}
