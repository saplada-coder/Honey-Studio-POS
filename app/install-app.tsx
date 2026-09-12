"use client";

import { useEffect, useState } from "react";
import { Smartphone, Share, PlusSquare, X, MoreVertical } from "lucide-react";

const C = { gold: "#D4AF37", goldBg: "#F3E9CC", cream: "#F5F1E8", line: "#EAE2D4", taupe: "#A8978E", charcoal: "#333333" };

// เก็บ event "ติดตั้งได้" ของ Android/Chrome ไว้ระดับหน้า (ยิงครั้งเดียวตอนโหลด ก่อน component จะ mount)
let deferredPrompt: any = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; window.dispatchEvent(new Event("hs-can-install")); });
}

const Num = ({ n }: { n: number }) => (
  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: C.gold }}>{n}</span>
);

// ขั้นตอนติดตั้งแยกตามเครื่อง
function Steps({ platform }: { platform: "ios" | "android" }) {
  return platform === "ios" ? (
    <ol className="space-y-2.5 text-sm">
      <li className="flex gap-3"><Num n={1} /><span>เปิดเว็บนี้ด้วย <b>Safari</b> (ถ้าเปิดจาก LINE ให้กด "เปิดใน Safari" ก่อน)</span></li>
      <li className="flex gap-3"><Num n={2} /><span>กดปุ่ม <b>แชร์</b> <Share size={14} className="inline -mt-0.5" /> ที่แถบด้านล่าง</span></li>
      <li className="flex gap-3"><Num n={3} /><span>เลื่อนหา <b>"เพิ่มไปยังหน้าจอโฮม"</b> <PlusSquare size={14} className="inline -mt-0.5" /> แล้วกด <b>เพิ่ม</b></span></li>
    </ol>
  ) : (
    <ol className="space-y-2.5 text-sm">
      <li className="flex gap-3"><Num n={1} /><span>เปิดเว็บนี้ด้วย <b>Chrome</b> (ถ้าเปิดจาก LINE ให้กด "เปิดในเบราว์เซอร์" ก่อน)</span></li>
      <li className="flex gap-3"><Num n={2} /><span>กดปุ่ม <b>"ติดตั้งแอปบนมือถือ"</b> ด้านบน หรือเมนู <MoreVertical size={14} className="inline -mt-0.5" /> มุมขวาบน → <b>"ติดตั้งแอป"</b></span></li>
      <li className="flex gap-3"><Num n={3} /><span>กด <b>ติดตั้ง</b> ในหน้าต่างที่เด้งขึ้น — เสร็จแล้ว</span></li>
    </ol>
  );
}

// ปุ่ม "ติดตั้งแอป" — Android กดแล้วขึ้นหน้าต่างติดตั้งทันที · iPhone โชว์ขั้นตอน (Safari ไม่มีปุ่มติดตั้งอัตโนมัติ)
// inline = โชว์ขั้นตอนไว้ในหน้าเลย · auto = เปิดหน้าต่างเล็กๆ บอกวิธีติดตั้งเองตอนเข้าหน้า (เฉพาะมือถือ ยังไม่ติดตั้ง ยังไม่เคยกดปิด)
// ไม่ใส่ทั้งคู่ = ปุ่มอย่างเดียว กดแล้วค่อยขึ้นคู่มือ
const SEEN_KEY = "hs-install-guide-seen";
export default function InstallApp({ compact = false, inline = false, auto = false }: { compact?: boolean; inline?: boolean; auto?: boolean }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [tab, setTab] = useState<"android" | "ios">("android"); // ใช้ตอนเปิดบนคอม (ไม่รู้ว่ามือถือรุ่นไหน)

  useEffect(() => {
    // ลงทะเบียน service worker (จำเป็นสำหรับติดตั้งเป็นแอป)
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setInstalled(standalone);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
    if (ios) setTab("ios");
    const mobile = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
    setIsMobile(mobile);
    // เด้งหน้าต่างวิธีติดตั้งเองครั้งแรก (มือถือ + ยังไม่ได้ติดตั้ง + ยังไม่เคยกด "เข้าใจแล้ว")
    if (auto && mobile && !standalone) {
      let seen = false;
      try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch {}
      if (!seen) setTimeout(() => setGuide(true), 600);
    }
    setCanPrompt(!!deferredPrompt);
    const on = () => setCanPrompt(true);
    const done = () => { setInstalled(true); deferredPrompt = null; };
    window.addEventListener("hs-can-install", on);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("hs-can-install", on); window.removeEventListener("appinstalled", done); };
  }, []);

  if (installed) return null; // เปิดจากแอปอยู่แล้ว ไม่ต้องโชว์

  async function install() {
    // iPhone/iPad ไม่มีหน้าต่างติดตั้งอัตโนมัติทุกเบราว์เซอร์ → โชว์ขั้นตอนเสมอ
    if (!isIOS && deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      deferredPrompt = null;
      setCanPrompt(false);
      return;
    }
    if (!inline) setGuide(true); // ไม่มี prompt → โชว์ขั้นตอน (ถ้า inline ขั้นตอนอยู่ในหน้าอยู่แล้ว)
  }
  // ปิดหน้าต่าง + จำไว้ว่าเคยเห็นแล้ว (จะไม่เด้งเองอีก แต่กดปุ่มเปิดดูได้)
  const closeGuide = () => { setGuide(false); try { localStorage.setItem(SEEN_KEY, "1"); } catch {} };

  const btnCls = compact
    ? "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium"
    : "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium";
  const button = (
    <button type="button" onClick={install} className={btnCls} style={{ background: canPrompt && !isIOS ? C.gold : C.goldBg, color: canPrompt && !isIOS ? "#fff" : "#8a6d1f" }}>
      <Smartphone size={16} />{canPrompt && !isIOS ? "ติดตั้งแอปบนมือถือ" : "ติดตั้งเป็นแอปมือถือ"}
    </button>
  );

  // ===== แบบ inline: การ์ดขั้นตอนอยู่ในหน้าเลย =====
  if (inline) {
    return (
      <div className="rounded-2xl border p-4" style={{ background: "#fff", borderColor: C.line, color: C.charcoal }}>
        <div className="flex items-center gap-2 mb-1">
          <Smartphone size={18} style={{ color: C.gold }} />
          <span className="font-bold text-sm">ติดตั้งเป็นแอปบนมือถือ</span>
        </div>
        <div className="text-xs mb-3" style={{ color: C.taupe }}>มีไอคอน HONEY STUDIO บนหน้าจอ เปิดเต็มจอเหมือนแอปทั่วไป — ทำครั้งเดียว</div>
        {isMobile ? (
          <>
            {!isIOS && <div className="mb-3">{button}</div>}
            <Steps platform={isIOS ? "ios" : "android"} />
          </>
        ) : (
          <>
            <div className="text-xs mb-2 rounded-xl p-2.5" style={{ background: C.cream, color: C.taupe }}>เปิดลิงก์เว็บนี้บน<b>มือถือ</b> แล้วทำตามขั้นตอนของเครื่องที่ใช้</div>
            <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: C.cream }}>
              {(["android", "ios"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setTab(k)} className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ background: tab === k ? "#fff" : "transparent", color: tab === k ? C.charcoal : C.taupe }}>{k === "android" ? "Android" : "iPhone / iPad"}</button>
              ))}
            </div>
            <Steps platform={tab} />
          </>
        )}
      </div>
    );
  }

  // ===== แบบปุ่ม: กดแล้วติดตั้ง / ขึ้นคู่มือ =====
  return (
    <>
      {button}
      {guide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,.45)" }} onClick={closeGuide}>
          <div className="w-full max-w-[300px] rounded-2xl overflow-hidden shadow-xl" style={{ background: "#fff", color: C.charcoal }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 border-b" style={{ borderColor: C.line }}>
              <span className="font-bold text-sm flex items-center gap-1.5"><Smartphone size={15} style={{ color: C.gold }} />ติดตั้งเป็นแอปมือถือ</span>
              <button onClick={closeGuide} aria-label="ปิด"><X size={18} style={{ color: C.taupe }} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="" className="w-12 h-12 object-contain shrink-0" />
                <div className="text-[11px] leading-snug" style={{ color: C.taupe }}>มีไอคอน HONEY STUDIO บนหน้าจอ เปิดเต็มจอเหมือนแอป — ทำครั้งเดียว</div>
              </div>
              <Steps platform={isIOS ? "ios" : "android"} />
              {!isIOS && canPrompt && (
                <button onClick={install} className="w-full py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: C.gold }}>ติดตั้งเลย</button>
              )}
              <button onClick={closeGuide} className="w-full py-2 rounded-xl text-sm font-medium" style={{ background: C.cream, color: C.charcoal }}>{!isIOS && canPrompt ? "ไว้ทีหลัง" : "เข้าใจแล้ว"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
