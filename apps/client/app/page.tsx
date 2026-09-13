"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TaskList } from "@/components/dashboard/task-list";

export default function AllTasksPage() {
  return (
    <DashboardShell pageTitle="All Tasks">
      {({ onOpenCreate, onOpenEdit, onOpenDetail }) => (
        <TaskList
          currentFilter="ALL"
          onOpenCreate={onOpenCreate}
          onOpenEdit={onOpenEdit}
          onOpenDetail={onOpenDetail}
        />
      )}
    </DashboardShell>
  );
}
