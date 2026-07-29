"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HAS_CLERK = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);

type NotifRow = {
  id: number;
  type: string;
  titre: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

/** Cloche notifications in-app (Clerk uniquement). */
export function NotificationsBell(): React.ReactElement | null {
  if (!HAS_CLERK) return null;
  return <NotificationsBellInner />;
}

function NotificationsBellInner(): React.ReactElement | null {
  const { isSignedIn, isLoaded } = useAuth();
  const [rows, setRows] = useState<NotifRow[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch("/api/me/notifications");
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications?: NotifRow[];
        unread?: number;
      };
      setRows(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void refresh();
  }, [isLoaded, isSignedIn, refresh]);

  if (!isLoaded || !isSignedIn) return null;

  async function markAll(): Promise<void> {
    await fetch("/api/me/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    void refresh();
  }

  async function markOne(id: number): Promise<void> {
    await fetch("/api/me/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    void refresh();
  }

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) void refresh();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative rounded-none"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unread > 0 ? (
            <span
              className={
                "absolute right-0.5 top-0.5 flex h-4 min-w-4 " +
                "items-center justify-center bg-accent px-1 " +
                "text-[10px] font-semibold text-accent-foreground"
              }
            >
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] rounded-none p-0"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-xs uppercase tracking-wide">
            Notifications
          </DropdownMenuLabel>
          {unread > 0 ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={() => void markAll()}
            >
              Tout lire
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Aucune notification. Complétez la Boussole pour
              recevoir des alertes de résonance.
            </p>
          ) : (
            rows.map((n) => (
              <DropdownMenuItem
                key={n.id}
                asChild
                className={
                  "cursor-pointer rounded-none px-3 py-2.5 " +
                  (n.readAt ? "" : "bg-accent/40")
                }
              >
                <Link
                  href={n.href}
                  onClick={() => {
                    if (!n.readAt) void markOne(n.id);
                  }}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-snug">
                      {n.titre}
                    </span>
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <p className="px-3 py-2 text-[10px] text-muted-foreground">
          Alignement avec votre Boussole — pas de jugement moral.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
