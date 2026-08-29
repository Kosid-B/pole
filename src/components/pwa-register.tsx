"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let mounted = true;
    let registration: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (!mounted) return;
        if (registration.waiting) setWaiting(registration.waiting);

        registration.addEventListener("updatefound", () => {
          const worker = registration?.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(worker);
            }
          });
        });

        const timer = window.setInterval(() => registration?.update(), 5 * 60 * 1000);
        return () => window.clearInterval(timer);
      } catch (error) {
        console.warn("PWA service worker registration failed", error);
      }
    };

    const cleanupPromise = register();
    const onVisible = () => {
      if (document.visibilityState === "visible") registration?.update();
    };
    document.addEventListener("visibilitychange", onVisible);

    let reloading = false;
    const onControllerChange = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      void cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, []);

  if (!waiting) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[100] flex w-[min(520px,calc(100%-24px))] -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-sky-300/20 bg-slate-950/95 p-4 text-slate-100 shadow-2xl backdrop-blur">
      <div>
        <p className="text-sm font-semibold">มีเวอร์ชันใหม่พร้อมใช้งาน</p>
        <p className="mt-1 text-xs text-slate-400">อัปเดต App โดยไม่ต้องติดตั้งใหม่</p>
      </div>
      <button
        type="button"
        className="rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950"
        onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
      >
        อัปเดต
      </button>
    </div>
  );
}
