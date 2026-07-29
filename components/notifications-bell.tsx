"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<NotifRow[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent): void {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

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
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        className={
          "relative flex min-h-9 min-w-9 items-center justify-center " +
          "text-[var(--ink)] hover:bg-[var(--surface-muted)]"
        }
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
      >
        <span className="sr-only">Notifications</span>
        <svg
          aria-hidden
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 ? (
          <span
            className={
              "absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center " +
              "justify-center rounded-full bg-[var(--accent)] px-1 " +
              "text-[10px] font-semibold text-[var(--ink)]"
            }
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={
            "absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] " +
            "border border-[var(--border)] bg-[var(--surface)] shadow-lg"
          }
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Notifications
            </p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs text-[var(--accent-ink)] hover:underline"
                onClick={() => void markAll()}
              >
                Tout lire
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {rows.length === 0 ? (
              <li className="px-3 py-4 text-sm text-[var(--muted)]">
                Aucune notification. Complétez la Boussole pour
                recevoir des alertes de résonance.
              </li>
            ) : (
              rows.map((n) => (
                <li
                  key={n.id}
                  className={
                    n.readAt
                      ? "border-b border-[var(--border)]"
                      : "border-b border-[var(--border)] bg-[var(--accent-soft)]/40"
                  }
                >
                  <Link
                    href={n.href}
                    className="block px-3 py-2.5 hover:bg-[var(--surface-muted)]"
                    onClick={() => {
                      if (!n.readAt) void markOne(n.id);
                      setOpen(false);
                    }}
                  >
                    <p className="text-sm font-medium leading-snug">
                      {n.titre}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">
                      {n.body}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <p className="border-t border-[var(--border)] px-3 py-2 text-[10px] text-[var(--muted)]">
            Alignement avec votre Boussole — pas de jugement moral.
          </p>
        </div>
      ) : null}
    </div>
  );
}
