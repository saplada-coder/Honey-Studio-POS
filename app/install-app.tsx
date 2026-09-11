"use client";

import { useEffect, useState } from "react";
import { Smartphone, Share, PlusSquare, X, MoreVertical } from "lucide-react";

const C = { gold: "#D4AF37", goldBg: "#F3E9CC", cream: "#F5F1E8", line: "#EAE2D4", taupe: "#A8978E", charcoal: "#333333" };

// เก็บ event "ติดตั้งได้" ของ Android/Chrome ไว้ระดับหน้า (ยิงครั้งเดียวตอนโหลด ก่อน component จะ mount)
let deferredPrompt: any = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; window.dispatchEvent(new Event("hs-can-install")); });
}

// ปุ่ม "ติดตั้งแอป" — Android กดแล้วขึ้นหน้าต่างติดตั้งทันที · iPhone โชว์ขั้นตอน (Safari ไม่มีปุ่มติดตั้งอัตโนมัติ)
export default function InstallApp({ compact = false }: { compact?: boolean }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // ลงทะเบียน service worker (จำเป็นสำหรับติดตั้งเป็นแอป)
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    setInstalled(standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
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
    setGuide(true); // ไม่มี prompt (iPhone / เบราว์เซอร์อื่น) → โชว์ขั้นตอน
  }

  const btnCls = compact
    ? "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium"
    : "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium";

  return (
    <>
      <button type="button" onClick={install} className={btnCls} style={{ background: C.goldBg, color: "#8a6d1f" }}>
        <Smartphone size={16} />{canPrompt && !isIOS ? "ติดตั้งแอปบนมือถือ" : "ติดตั้งเป็นแอปมือถือ"}
      </button>

      {guide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.45)" }} onClick={() => setGuide(false)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "#fff", color: C.charcoal }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-5 py-4 border-b" style={{ borderColor: C.line }}>
              <span className="font-bold">ติดตั้งแอปบนมือถือ</span>
              <button onClick={() => setGuide(false)}><X size={20} style={{ color: C.taupe }} /></button>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <img src="/logo.png" alt="" className="w-20 h-20 object-contain mx-auto" />
              {isIOS ? (
                <ol className="space-y-3">
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: C.gold }}>1</span><span>เปิดเว็บนี้ด้วย <b>Safari</b> (ถ้าเปิดจาก LINE ให้กด "เปิดใน Safari" ก่อน)</span></li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: C.gold }}>2</span><span>กดปุ่ม <b>แชร์</b> <Share size={14} className="inline -mt-0.5" /> ที่แถบด้านล่าง</span></li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: C.gold }}>3</span><span>เลื่อนหา <b>"เพิ่มไปยังหน้าจอโฮม"</b> <PlusSquare size={14} className="inline -mt-0.5" /> แล้วกด <b>เพิ่ม</b></span></li>
                </ol>
              ) : (
                <ol className="space-y-3">
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: C.gold }}>1</span><span>เปิดเว็บนี้ด้วย <b>Chrome</b> (ถ้าเปิดจาก LINE ให้กด "เปิดในเบราว์เซอร์" ก่อน)</span></li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: C.gold }}>2</span><span>กดเมนู <MoreVertical size={14} className="inline -mt-0.5" /> มุมขวาบน</span></li>
                  <li className="flex gap-3"><span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: C.gold }}>3</span><span>กด <b>"ติดตั้งแอป"</b> หรือ <b>"เพิ่มไปยังหน้าจอหลัก"</b></span></li>
                </ol>
              )}
              <div className="text-xs rounded-xl p-3" style={{ background: C.cream, color: C.taupe }}>ติดตั้งแล้วจะมีไอคอน HONEY STUDIO บนหน้าจอ เปิดได้เหมือนแอปทั่วไป ไม่มีแถบเบราว์เซอร์</div>
              <button onClick={() => setGuide(false)} className="w-full py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: C.gold }}>เข้าใจแล้ว</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
