"use client";

import React, { useState } from "react";
import { Crown, Lock, Mail } from "lucide-react";

const C = {
  gold: "#D4AF37", goldBg: "#F3E9CC", cream: "#F5F1E8",
  taupe: "#A8978E", charcoal: "#333333", bg: "#FBF9F4", line: "#EAE2D4", red: "#C66B6B",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "เข้าสู่ระบบไม่สำเร็จ");
        setLoading(false);
        return;
      }
      // โหลดหน้าใหม่เพื่อให้ระบบรับรู้การล็อกอิน
      window.location.href = "/";
    } catch {
      setErr("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.bg, fontFamily: "'Noto Sans Thai', -apple-system, sans-serif", color: C.charcoal }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold mx-auto mb-3" style={{ background: C.gold, fontFamily: "Georgia,serif", fontSize: 22 }}>HS</div>
          <div className="text-2xl font-bold" style={{ fontFamily: "Georgia,serif", letterSpacing: 1 }}>HONEY STUDIO</div>
          <div className="text-sm mt-1" style={{ color: C.taupe }}>ระบบจัดการร้านเช่า–ขายชุด</div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border p-6 space-y-4" style={{ background: "#fff", borderColor: C.line }}>
          <div className="flex items-center gap-1.5 text-sm font-semibold"><Crown size={16} style={{ color: C.gold }} />เข้าสู่ระบบพนักงาน</div>

          <div>
            <label className="text-xs" style={{ color: C.taupe }}>อีเมล</label>
            <div className="flex items-center gap-2 px-3 mt-1 rounded-xl border" style={{ borderColor: C.line }}>
              <Mail size={16} style={{ color: C.taupe }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.co" required className="flex-1 py-2.5 text-sm outline-none bg-transparent" />
            </div>
          </div>

          <div>
            <label className="text-xs" style={{ color: C.taupe }}>รหัสผ่าน</label>
            <div className="flex items-center gap-2 px-3 mt-1 rounded-xl border" style={{ borderColor: C.line }}>
              <Lock size={16} style={{ color: C.taupe }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="flex-1 py-2.5 text-sm outline-none bg-transparent" />
            </div>
          </div>

          {err && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#F6E4E4", color: C.red }}>{err}</div>}

          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl font-medium text-sm text-white transition active:scale-95" style={{ background: C.gold, opacity: loading ? 0.7 : 1 }}>
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>

          <div className="text-[11px] text-center pt-2 border-t" style={{ borderColor: C.line, color: C.taupe }}>
            บัญชีทดสอบ: <b>test@test.com</b> / <b>admin123</b>
          </div>
        </form>
      </div>
    </div>
  );
}
