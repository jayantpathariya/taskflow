"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ListTodo,
  CircleDashed,
  Timer,
  BarChart3,
  History,
  Plus,
  LogOut,
  User as UserIcon,
  X,
} from "lucide-react";

interface SidebarProps {
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
  onNewTask,
  taskCounts,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isInsights = pathname === "/insights";
  const isTimeLogs = pathname === "/time-logs";

  const navItems = [
    {
      href: "/",
      label: "All Tasks",
      icon: ListTodo,
      count: taskCounts.all,
      isActive: pathname === "/",
    },
    {
      href: "/tasks/pending",
      label: "Pending",
      icon: CircleDashed,
      count: taskCounts.pending,
      isActive: pathname === "/tasks/pending",
    },
    {
      href: "/tasks/in-progress",
      label: "In Progress",
      icon: Timer,
      count: taskCounts.inProgress,
      isActive: pathname === "/tasks/in-progress",
    },
    {
      href: "/tasks/completed",
      label: "Completed",
      icon: CheckCircle2,
      count: taskCounts.completed,
      isActive: pathname === "/tasks/completed",
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

      {/* Sidebar Container: Fixed height sticky sidebar that never stretches with page scroll */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out md:sticky md:top-0 md:translate-x-0 " +
          (mobileOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-border">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
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
          </Link>

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
        <div className="p-4 shrink-0">
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

        {/* Navigation Sections */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {/* 1. Task Views Section (First) */}
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Task Views
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all " +
                  (item.isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground")
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </div>
                <span
                  className={
                    "rounded-md px-1.5 py-0.5 text-[11px] font-mono " +
                    (item.isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground")
                  }
                >
                  {item.count}
                </span>
              </Link>
            );
          })}

          {/* 2. Overview Section (Below Task Views) */}
          <div className="pt-4 pb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Overview
          </div>
          <Link
            href="/insights"
            onClick={onCloseMobile}
            className={
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all " +
              (isInsights
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground")
            }
          >
            <BarChart3 className="size-4" />
            <span>Insights</span>
          </Link>

          <Link
            href="/time-logs"
            onClick={onCloseMobile}
            className={
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-all " +
              (isTimeLogs
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground")
            }
          >
            <History className="size-4" />
            <span>Time Logs</span>
          </Link>
        </div>

        {/* User Profile Footer */}
        {user && (
          <div className="p-3 border-t border-border shrink-0">
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
