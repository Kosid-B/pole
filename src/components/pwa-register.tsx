"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

type VersionInfo = {
  ok: boolean;
  app: string;
  version: string;
  build: string;
  ref: string | null;
  environment: string;
  serverTime: string;
};

const INSTALLED_VERSION_KEY = "sitecost-installed-version";
const CACHE_PREFIXES = ["pole-saas-", "sitecost-pwa-"];

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const classicIos = /iphone|ipad|ipod/.test(ua);
  const ipadDesktopMode = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return classicIos || ipadDesktopMode;
}

function isStandaloneMode() {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

async function readLatestVersion(): Promise<VersionInfo> {
  const response = await fetch(`/api/app-version?ts=${Date.now()}`, {
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Cache-Control": "no-cache" },
  });

  if (!response.ok) {
    throw new Error(`Version endpoint returned HTTP ${response.status}`);
  }

  return (await response.json()) as VersionInfo;
}

export function PwaRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [latest, setLatest] = useState<VersionInfo | null>(null);
  const [installedVersion, setInstalledVersion] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const reloadingRef = useRef(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const updateAvailable = useMemo(() => {
    if (waiting) return true;
    if (!latest || !installedVersion) return false;
    return latest.version !== installedVersion;
  }, [installedVersion, latest, waiting]);

  const checkVersion = useCallback(async (silent = false) => {
    if (!silent) {
      setChecking(true);
      setMessage(null);
    }

    try {
      const info = await readLatestVersion();
      setLatest(info);

      const stored = window.localStorage.getItem(INSTALLED_VERSION_KEY);
      if (!stored) {
        window.localStorage.setItem(INSTALLED_VERSION_KEY, info.version);
        setInstalledVersion(info.version);
      } else {
        setInstalledVersion(stored);
      }

      const currentRegistration = registrationRef.current;
      await currentRegistration?.update();

      if (!silent) {
        if (stored && stored !== info.version) {
          setMessage(`พบเวอร์ชันใหม่ ${info.version}`);
        } else if (currentRegistration?.waiting) {
          setMessage("พบ Service Worker เวอร์ชันใหม่พร้อมอัปเดต");
        } else {
          setMessage("เป็นเวอร์ชันล่าสุดแล้ว");
        }
      }
    } catch (error) {
      if (!silent) {
        setMessage(
          error instanceof Error
            ? `ตรวจเวอร์ชันไม่สำเร็จ: ${error.message}`
            : "ตรวจเวอร์ชันไม่สำเร็จ",
        );
      }
    } finally {
      if (!silent) setChecking(false);
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    setChecking(true);
    setMessage("กำลังอัปเดต SiteCost…");

    try {
      const info = await readLatestVersion();
      setLatest(info);

      const currentRegistration = registrationRef.current;
      await currentRegistration?.update();

      const activeWaiting = currentRegistration?.waiting || waiting;
      if (activeWaiting) {
        activeWaiting.postMessage({ type: "SKIP_WAITING" });
      }

      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(
          keys
            .filter((key) => CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
            .map((key) => window.caches.delete(key)),
        );
      }

      window.localStorage.setItem(INSTALLED_VERSION_KEY, info.version);
      setInstalledVersion(info.version);

      await fetch(window.location.href, {
        cache: "reload",
        credentials: "same-origin",
      }).catch(() => undefined);

      window.setTimeout(() => {
        if (!reloadingRef.current) {
          reloadingRef.current = true;
          window.location.reload();
        }
      }, activeWaiting ? 1200 : 250);
    } catch (error) {
      setChecking(false);
      setMessage(
        error instanceof Error ? `อัปเดตไม่สำเร็จ: ${error.message}` : "อัปเดตไม่สำเร็จ",
      );
    }
  }, [waiting]);

  const installApp = useCallback(async () => {
    if (standalone) {
      setMessage("SiteCost ถูกติดตั้งบนอุปกรณ์นี้แล้ว");
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        const info = latest || (await readLatestVersion());
        window.localStorage.setItem(INSTALLED_VERSION_KEY, info.version);
        setInstalledVersion(info.version);
        setMessage("ติดตั้ง SiteCost แล้ว เปิดจากไอคอนบนอุปกรณ์ได้เลย");
        setInstallPrompt(null);
      } else {
        setMessage("ยังไม่ได้ติดตั้ง คุณสามารถกดติดตั้งภายหลังได้");
      }
      return;
    }

    if (ios) {
      setMessage("iPhone/iPad: เปิดหน้านี้ใน Safari → กด Share → Add to Home Screen → Add");
      return;
    }

    setMessage(
      "Laptop: ใช้ Chrome/Edge แล้วกดไอคอน Install ที่แถบที่อยู่ หรือเมนู ⋮ → Install SiteCost",
    );
  }, [installPrompt, ios, latest, standalone]);

  useEffect(() => {
    setStandalone(isStandaloneMode());
    setIos(isIosDevice());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setStandalone(true);
      setInstallPrompt(null);
      void readLatestVersion().then((info) => {
        window.localStorage.setItem(INSTALLED_VERSION_KEY, info.version);
        setLatest(info);
        setInstalledVersion(info.version);
      });
      setMessage("ติดตั้ง SiteCost สำเร็จ");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      void checkVersion(true);
      return;
    }

    let mounted = true;
    let timer: number | undefined;

    const register = async () => {
      try {
        const nextRegistration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        if (!mounted) return;
        registrationRef.current = nextRegistration;
        if (nextRegistration.waiting) setWaiting(nextRegistration.waiting);

        nextRegistration.addEventListener("updatefound", () => {
          const worker = nextRegistration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(worker);
            }
          });
        });

        await checkVersion(true);
        timer = window.setInterval(() => {
          void nextRegistration.update();
          void checkVersion(true);
        }, 5 * 60 * 1000);
      } catch (error) {
        console.warn("PWA service worker registration failed", error);
        void checkVersion(true);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void registrationRef.current?.update();
        void checkVersion(true);
      }
    };

    const onControllerChange = () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      window.location.reload();
    };

    void register();
    document.addEventListener("visibilitychange", onVisible);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      mounted = false;
      registrationRef.current = null;
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [checkVersion]);

  return (
    <>
      <button
        type="button"
        aria-label="เปิดเมนูติดตั้งและอัปเดต SiteCost"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+16px)] right-4 z-[100] min-h-12 rounded-2xl border border-sky-300/30 bg-slate-950/95 px-4 py-3 text-left text-sm font-semibold text-white shadow-2xl shadow-slate-950/40 backdrop-blur"
        onClick={() => setPanelOpen((value) => !value)}
      >
        <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-sky-300">
          SiteCost App
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          {updateAvailable ? (
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
          ) : (
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
          )}
          {updateAvailable ? "มีเวอร์ชันใหม่" : latest?.version || "Version"}
        </span>
      </button>

      {panelOpen ? (
        <div
          className="fixed inset-0 z-[110] bg-slate-950/55 p-4 backdrop-blur-sm"
          onClick={() => setPanelOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="SiteCost App Manager"
            className="absolute bottom-[calc(env(safe-area-inset-bottom)+16px)] left-1/2 w-[min(560px,calc(100%-24px))] -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-950 p-5 text-slate-100 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">
                  SiteCost Drying Yard 446
                </p>
                <h2 className="mt-2 text-xl font-semibold">Install & Version Manager</h2>
                <p className="mt-1 text-sm text-slate-400">
                  ติดตั้งครั้งเดียว แล้วกด Update Version เมื่อมีรุ่นใหม่
                </p>
              </div>
              <button
                type="button"
                className="min-h-11 min-w-11 rounded-xl border border-white/10 text-xl text-slate-300"
                onClick={() => setPanelOpen(false)}
                aria-label="ปิด"
              >
                ×
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">เวอร์ชันที่ติดตั้ง</p>
                <p className="mt-1 font-semibold">{installedVersion || "กำลังตรวจ…"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-slate-400">เวอร์ชัน Production ล่าสุด</p>
                <p className="mt-1 font-semibold">{latest?.version || "กำลังตรวจ…"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-400">สถานะติดตั้ง</span>
                <span
                  className={
                    standalone
                      ? "font-semibold text-emerald-300"
                      : "font-semibold text-amber-300"
                  }
                >
                  {standalone ? "ติดตั้งแล้ว" : "ยังเปิดผ่าน Browser"}
                </span>
              </div>
              {latest?.build ? (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-slate-400">Build</span>
                  <span className="font-mono text-xs text-slate-300">{latest.build}</span>
                </div>
              ) : null}
            </div>

            {message ? (
              <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4 text-sm text-sky-100">
                {message}
              </div>
            ) : null}

            {!standalone ? (
              <button
                type="button"
                className="mt-4 min-h-12 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-950"
                onClick={() => void installApp()}
              >
                ติดตั้ง SiteCost บนอุปกรณ์นี้
              </button>
            ) : null}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                disabled={checking}
                onClick={() => void checkVersion(false)}
              >
                {checking ? "กำลังตรวจ…" : "ตรวจอัปเดต"}
              </button>
              <button
                type="button"
                className="min-h-12 rounded-2xl bg-sky-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
                disabled={checking}
                onClick={() => void applyUpdate()}
              >
                {checking ? "กำลังอัปเดต…" : "Update Version"}
              </button>
            </div>

            {ios && !standalone ? (
              <p className="mt-4 text-xs leading-5 text-slate-400">
                สำหรับ iPhone/iPad: หากเปิดจาก Gmail/LINE ให้เลือก Open in Safari ก่อน จากนั้นกด Share → Add to Home Screen → Add
              </p>
            ) : (
              <p className="mt-4 text-xs leading-5 text-slate-400">
                Laptop แนะนำ Chrome หรือ Microsoft Edge เพื่อให้ระบบแสดง Install App แบบ native
              </p>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
