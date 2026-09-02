"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { validateInvitePassword } from "@/lib/invite-password";

type InvitePasswordFormProps = {
  supabaseUrl: string;
  publishableKey: string;
};

type FormStatus = "loading-link" | "ready" | "saving" | "success" | "invalid-link" | "error";

function readInviteAccessToken() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);

  return hash.get("access_token") || query.get("access_token") || "";
}

export function InvitePasswordForm({
  supabaseUrl,
  publishableKey,
}: InvitePasswordFormProps) {
  const [accessToken, setAccessToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<FormStatus>("loading-link");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = readInviteAccessToken();
    if (!token) {
      setStatus("invalid-link");
      setMessage("ลิงก์เชิญไม่สมบูรณ์หรือหมดอายุ กรุณาขอคำเชิญใหม่จากผู้ดูแลระบบ");
      return;
    }

    setAccessToken(token);
    setStatus("ready");
  }, []);

  const validation = useMemo(
    () => validateInvitePassword(password, confirmPassword),
    [password, confirmPassword],
  );
  const passwordTooShort = password.length > 0 && password.length < 12;
  const passwordMismatch =
    password.length >= 12 &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const currentValidation = validateInvitePassword(password, confirmPassword);
    if (!currentValidation.ok) {
      setStatus("error");
      setMessage(
        currentValidation.error === "PASSWORD_TOO_SHORT"
          ? "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร"
          : "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
      );
      return;
    }

    if (!accessToken) {
      setStatus("invalid-link");
      setMessage("ไม่พบ session ของคำเชิญ กรุณาเปิดลิงก์เชิญจากอีเมลอีกครั้ง");
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string; error_description?: string }
          | null;
        throw new Error(
          payload?.error_description || payload?.message || `HTTP_${response.status}`,
        );
      }

      setStatus("success");
      setMessage("ตั้งรหัสผ่านสำเร็จ กำลังกลับไปหน้าเข้าสู่ระบบ");

      // Remove invite/session tokens from browser history before leaving this page.
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.assign("/sign-in?invite=accepted");
    } catch {
      setStatus("error");
      setMessage("ไม่สามารถตั้งรหัสผ่านได้ ลิงก์อาจหมดอายุ กรุณาขอคำเชิญใหม่");
    }
  }

  const disabled = status === "loading-link" || status === "saving" || status === "invalid-link";

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={status === "saving"}>
      {message ? (
        <div
          role={status === "error" || status === "invalid-link" ? "alert" : "status"}
          className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
            status === "success"
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
              : status === "error" || status === "invalid-link"
                ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
                : "border-sky-300/20 bg-sky-300/10 text-sky-100"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-medium text-slate-100">
          รหัสผ่านใหม่
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          disabled={disabled}
          aria-invalid={passwordTooShort}
          aria-describedby="new-password-help"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (status === "error") {
              setStatus("ready");
              setMessage("");
            }
          }}
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-sky-300/50 focus-visible:ring-2 focus-visible:ring-sky-300/50"
        />
        <p
          id="new-password-help"
          className={`text-xs leading-5 ${passwordTooShort ? "text-amber-200" : "text-slate-400"}`}
        >
          {passwordTooShort
            ? `ต้องเพิ่มอีก ${12 - password.length} ตัวอักษร`
            : "อย่างน้อย 12 ตัวอักษร และควรเป็นรหัสที่ไม่ใช้ซ้ำกับระบบอื่น"}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="confirm-password" className="text-sm font-medium text-slate-100">
          ยืนยันรหัสผ่าน
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={12}
          autoComplete="new-password"
          disabled={disabled}
          aria-invalid={passwordMismatch}
          aria-describedby="confirm-password-help"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (status === "error") {
              setStatus("ready");
              setMessage("");
            }
          }}
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-sky-300/50 focus-visible:ring-2 focus-visible:ring-sky-300/50"
        />
        <p
          id="confirm-password-help"
          className={`text-xs leading-5 ${passwordMismatch ? "text-amber-200" : "text-slate-500"}`}
        >
          {passwordMismatch ? "รหัสผ่านทั้งสองช่องยังไม่ตรงกัน" : "พิมพ์รหัสผ่านเดิมอีกครั้งเพื่อยืนยัน"}
        </p>
      </div>

      <button
        type="submit"
        disabled={disabled || !password || !confirmPassword || !validation.ok}
        className="min-h-12 w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
      >
        {status === "saving" ? "กำลังบันทึก..." : "ตั้งรหัสผ่านและเปิดใช้งานบัญชี"}
      </button>

      <p className="text-center text-xs leading-5 text-slate-500">
        ระบบจะไม่บันทึกรหัสผ่านของคุณใน SiteCost โดยตรง การจัดการ credential ทำผ่าน Supabase Auth
      </p>
    </form>
  );
}
