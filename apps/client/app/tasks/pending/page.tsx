"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TaskList } from "@/components/dashboard/task-list";

export default function PendingTasksPage() {
  return (
    <DashboardShell pageTitle="Pending Tasks">
      {({ onOpenCreate, onOpenEdit, onOpenDetail }) => (
        <TaskList
          currentFilter="PENDING"
          onOpenCreate={onOpenCreate}
          onOpenEdit={onOpenEdit}
          onOpenDetail={onOpenDetail}
        />
      )}
    </DashboardShell>
  );
}
