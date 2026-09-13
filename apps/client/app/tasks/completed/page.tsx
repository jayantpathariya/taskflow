"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TaskList } from "@/components/dashboard/task-list";

export default function CompletedTasksPage() {
  return (
    <DashboardShell pageTitle="Completed Tasks">
      {({ onOpenCreate, onOpenEdit }) => (
        <TaskList
          currentFilter="COMPLETED"
          onOpenCreate={onOpenCreate}
          onOpenEdit={onOpenEdit}
        />
      )}
    </DashboardShell>
  );
}
