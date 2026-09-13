"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TaskList } from "@/components/dashboard/task-list";

export default function InProgressTasksPage() {
  return (
    <DashboardShell pageTitle="In Progress Tasks">
      {({ onOpenCreate, onOpenEdit }) => (
        <TaskList
          currentFilter="IN_PROGRESS"
          onOpenCreate={onOpenCreate}
          onOpenEdit={onOpenEdit}
        />
      )}
    </DashboardShell>
  );
}
