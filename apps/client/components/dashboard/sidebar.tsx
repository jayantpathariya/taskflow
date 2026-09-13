"use client";

import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ListTodo,
  CircleDashed,
  Timer,
  Plus,
  LogOut,
  User as UserIcon,
  X,
} from "lucide-react";

interface SidebarProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onNewTask: () => void;
  taskCounts: {
    all: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  currentFilter,
  onFilterChange,
  onNewTask,
  taskCounts,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: "ALL",
      label: "All Tasks",
      icon: ListTodo,
      count: taskCounts.all,
    },
    {
      id: "PENDING",
      label: "Pending",
      icon: CircleDashed,
      count: taskCounts.pending,
    },
    {
      id: "IN_PROGRESS",
      label: "In Progress",
      icon: Timer,
      count: taskCounts.inProgress,
    },
    {
      id: "COMPLETED",
      label: "Completed",
      icon: CheckCircle2,
      count: taskCounts.completed,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-foreground">
                TaskFlow
              </span>
              <span className="block text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                Workspace
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onCloseMobile}
              className="md:hidden text-muted-foreground"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <Button
            onClick={() => {
              onNewTask();
              onCloseMobile?.();
            }}
            className="w-full justify-center gap-2 shadow-xs font-medium"
          >
            <Plus className="size-4" />
            <span>New Task</span>
          </Button>
        </div>

        {/* Navigation Filters */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Task Views
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = currentFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onFilterChange(item.id);
                  onCloseMobile?.();
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </div>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-mono ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* User Profile Footer */}
        {user && (
          <div className="p-3 border-t border-border">
            <div className="flex items-center justify-between rounded-xl p-2 bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-xs"
                onClick={logout}
                title="Sign out"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
