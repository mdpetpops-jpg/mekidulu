"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HEARTBEAT_MS = 15_000;
const SESSION_KEY = "mk_sid";

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

/**
 * Dwell-time beacon.
 *
 * One row every 15 s while the tab is visible, plus a final row when the page
 * is hidden or closed (sendBeacon survives unload). Duration is seconds since
 * the page was opened — enough to rank pages by attention without tracking
 * individual clicks.
 */
export function TrafficBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const id = sessionId();
    const startedAt = Date.now();
    let lastSent = 0;

    const send = (useBeacon = false) => {
      const duration = Math.round((Date.now() - startedAt) / 1000);
      if (duration <= lastSent) return;
      lastSent = duration;

      const payload = JSON.stringify({ sessionId: id, path: pathname, duration });

      if (useBeacon && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
        return;
      }

      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") send(true);
    };

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") send();
    }, HEARTBEAT_MS);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", () => send(true));

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      send(true);
    };
  }, [pathname]);

  return null;
}
