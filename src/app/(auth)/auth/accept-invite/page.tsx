import { InvitePasswordForm } from "@/components/auth/invite-password-form";

function getInviteAuthConfig() {
  const url = process.env.SITECOST_SUPABASE_URL?.trim().replace(/\/+$/, "") || "";
  const publishableKey = process.env.SITECOST_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

  return { url, publishableKey };
}

export default function AcceptInvitePage() {
  const auth = getInviteAuthConfig();
  const configured = Boolean(auth.url && auth.publishableKey);

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-7 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-200/70">
          SiteCost Account Activation
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          ตั้งรหัสผ่านของคุณเอง
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          คำเชิญนี้ใช้เปิดบัญชี SiteCost ขององค์กร รหัสผ่านจะถูกจัดการโดย Supabase Auth และไม่ได้ถูกส่งให้ผู้ดูแลระบบกำหนดแทนคุณ
        </p>

        <div className="mt-6 grid gap-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
            <p className="font-medium text-white">1. ตั้งรหัสผ่าน</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">ใช้รหัสอย่างน้อย 12 ตัวอักษรและไม่ใช้ซ้ำกับระบบอื่น</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
            <p className="font-medium text-white">2. กลับไปเข้าสู่ระบบ</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">หลังบันทึกสำเร็จ ระบบจะลบ token จาก URL และพาคุณกลับหน้า Sign in</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-7 text-slate-100 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
        <h3 className="text-xl font-semibold">เปิดใช้งานบัญชี</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          ทำรายการนี้ให้เสร็จจากอุปกรณ์ส่วนตัว และอย่าส่งต่อลิงก์คำเชิญให้ผู้อื่น
        </p>

        <div className="mt-6">
          {configured ? (
            <InvitePasswordForm
              supabaseUrl={auth.url}
              publishableKey={auth.publishableKey}
            />
          ) : (
            <div role="alert" className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
              ระบบรับคำเชิญยังไม่ได้ตั้งค่า Supabase Auth สำหรับ environment นี้ กรุณาติดต่อผู้ดูแลระบบ
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
