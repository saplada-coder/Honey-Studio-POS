"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Shirt, Boxes, Users, ShoppingBag, Truck, CalendarDays,
  Wallet, BarChart3, UserCog, Menu, X, Search, Plus, Bell, QrCode, Printer,
  ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Package, ChevronRight, Filter, Download, LayoutGrid,
  List, Calendar as CalIcon, Crown, Shield, Tag, Phone,
  MapPin, Eye, Coins, Pencil, Trash2, LogOut, ImagePlus, Loader2, Settings,
  Droplets, Wrench
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import * as XLSX from "xlsx";

// ===== ส่งออกไฟล์ Excel จริง (.xlsx) =====
function exportExcel(sheets, filename) {
  const wb = XLSX.utils.book_new();
  sheets.forEach((s) => {
    const ws = XLSX.utils.json_to_sheet(s.rows);
    XLSX.utils.book_append_sheet(wb, ws, s.name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}

/* ============ THEME ============ */
const C = {
  gold: "#D4AF37", goldSoft: "#E6D49B", goldBg: "#F3E9CC",
  cream: "#F5F1E8", rose: "#D8B4B8", roseBg: "#F4E7E8",
  taupe: "#A8978E", taupeBg: "#ECE6E1", charcoal: "#333333",
  bg: "#FBF9F4", line: "#EAE2D4", green: "#6FA66B", greenBg: "#E6F0E4",
  blue: "#7C93B8", blueBg: "#E6EBF3", red: "#C66B6B", redBg: "#F6E4E4",
};
const baht = (n) => "฿" + Number(n || 0).toLocaleString("th-TH");
const ICONS = { Crown, Shield, UserCog, Users };
const genId = (prefix) => prefix + Math.floor(1000 + Math.random() * 9000);
// วันที่วันนี้แบบไทยย่อ เช่น "16 มิ.ย." (ใช้ตอนกดเพิ่มรายการ — รันใน event handler ปลอดภัยจาก hydration)
const todayTH = () => {
  const d = new Date();
  const m = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${d.getDate()} ${m[d.getMonth()]}`;
};

/* ============ FAUX QR ============ */
function QR({ value = "HS", size = 120 }) {
  const n = 25;
  let seed = 7;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const cell = size / n;
  const isFinder = (r, c) => {
    const inBox = (R, Cc) => r >= R && r < R + 7 && c >= Cc && c < Cc + 7;
    return inBox(0, 0) || inBox(0, n - 7) || inBox(n - 7, 0);
  };
  const finderFill = (r, c) => {
    const box = (R, Cc) => {
      const rr = r - R, cc = c - Cc;
      if (rr === 0 || rr === 6 || cc === 0 || cc === 6) return true;
      if (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) return true;
      return false;
    };
    if (r < 7 && c < 7) return box(0, 0);
    if (r < 7 && c >= n - 7) return box(0, n - 7);
    if (r >= n - 7 && c < 7) return box(n - 7, 0);
    return false;
  };
  const rects = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      let fill = false;
      if (isFinder(r, c)) fill = finderFill(r, c);
      else fill = rnd() > 0.55;
      if (fill) rects.push(<rect key={r + "-" + c} x={c * cell} y={r * cell} width={cell} height={cell} fill={C.charcoal} />);
    }
  return (
    <svg width={size} height={size} style={{ background: "#fff", borderRadius: 8, padding: 6 }} viewBox={`0 0 ${size} ${size}`}>
      {rects}
    </svg>
  );
}

/* ============ ข้อมูลกราฟ (ภาพรวมเชิงสถิติ) ============ */
const revData = [
  { d: "จ", เช่า: 4200, ขาย: 1200 }, { d: "อ", เช่า: 3800, ขาย: 2100 },
  { d: "พ", เช่า: 5100, ขาย: 990 }, { d: "พฤ", เช่า: 4700, ขาย: 3200 },
  { d: "ศ", เช่า: 6800, ขาย: 2400 }, { d: "ส", เช่า: 9200, ขาย: 4100 },
  { d: "อา", เช่า: 8100, ขาย: 1800 },
];
const catData = [
  { name: "ชุดราตรี", value: 45 }, { name: "ชุดเพื่อนเจ้าสาว", value: 25 },
  { name: "ชุดไทย", value: 15 }, { name: "รองเท้า/กระเป๋า", value: 15 },
];
const PIE_COLORS = [C.gold, C.rose, C.taupe, C.blue];

/* ============ STATUS COLORS ============ */
const statusColor = (s) => ({
  // สถานะชุด
  "พร้อมเช่า": [C.green, C.greenBg], "ถูกจอง": [C.gold, C.goldBg], "กำลังเช่า": [C.blue, C.blueBg],
  "ซัก": [C.blue, C.blueBg], "ซ่อม": [C.red, C.redBg], "ปลดสต็อก": [C.taupe, C.taupeBg],
  "ว่าง": [C.green, C.greenBg], "ถูกเช่า": [C.gold, C.goldBg], // เก่า (เผื่อข้อมูลเดิม)
  // สถานะการเช่า
  "จองแล้ว": [C.rose, C.roseBg], "รับชุดแล้ว": [C.blue, C.blueBg], "คืนแล้ว": [C.green, C.greenBg],
  "เกินกำหนด": [C.red, C.redBg], "รับ/ส่งแล้ว": [C.blue, C.blueBg], "กำลังใช้งาน": [C.blue, C.blueBg],
  // สถานะออเดอร์/จัดส่ง
  "รอชำระ": [C.taupe, C.taupeBg], "เตรียมของ": [C.rose, C.roseBg], "กำลังจัดส่ง": [C.blue, C.blueBg],
  "สำเร็จ": [C.green, C.greenBg], "ส่งสำเร็จ": [C.green, C.greenBg], "รอสร้างเลข": [C.taupe, C.taupeBg],
  // สถานะซัก-ซ่อม
  "รอดำเนินการ": [C.gold, C.goldBg], "กำลังดำเนินการ": [C.gold, C.goldBg], "รอซ่อม": [C.taupe, C.taupeBg], "เสร็จแล้ว": [C.green, C.greenBg],
}[s] || [C.taupe, C.taupeBg]);

const Badge = ({ s }) => {
  const [fg, bg] = statusColor(s);
  return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{ color: fg, background: bg }}>{s}</span>;
};

/* ============ SHARED UI ============ */
const Card = ({ children, className = "" }) => (
  <div className={"rounded-2xl border " + className} style={{ background: "#fff", borderColor: C.line }}>{children}</div>
);
const PageHead = ({ title, sub, action }) => (
  <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
    <div>
      <h1 className="text-xl md:text-2xl font-bold" style={{ color: C.charcoal, fontFamily: "Georgia, serif" }}>{title}</h1>
      {sub && <p className="text-sm mt-0.5" style={{ color: C.taupe }}>{sub}</p>}
    </div>
    {action}
  </div>
);
const Btn = ({ children, onClick, variant = "solid", icon: Icon, size = "md", type = "button" }) => {
  const base = "inline-flex items-center gap-1.5 rounded-xl font-medium transition active:scale-95 " + (size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm");
  const styles = variant === "solid"
    ? { background: C.gold, color: "#fff" }
    : variant === "ghost"
    ? { background: C.cream, color: C.charcoal }
    : variant === "danger"
    ? { background: C.redBg, color: C.red }
    : { background: "#fff", color: C.charcoal, border: "1px solid " + C.line };
  return <button type={type} onClick={onClick} className={base} style={styles}>{Icon && <Icon size={16} />}{children}</button>;
};

/* ============ MODAL ============ */
function Modal({ children, onClose, title, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.45)" }} onClick={onClose}>
      <div className={"w-full rounded-2xl overflow-hidden " + (wide ? "max-w-lg" : "max-w-sm")} style={{ background: "#fff" }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center px-5 py-4 border-b" style={{ borderColor: C.line }}>
          <span className="font-bold">{title}</span>
          <button onClick={onClose}><X size={20} style={{ color: C.taupe }} /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ============ ช่องอัปโหลดรูป ============ */
function ImageField({ value, onChange }) {
  const [up, setUp] = useState(false);
  const [err, setErr] = useState("");
  async function pick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUp(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) onChange(data.url);
      else setErr(data.error || "อัปโหลดไม่สำเร็จ");
    } catch {
      setErr("อัปโหลดไม่สำเร็จ");
    } finally {
      setUp(false);
    }
  }
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden shrink-0" style={{ background: C.cream }}>
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <Shirt size={24} style={{ color: C.taupe }} />}
        </div>
        <label className="text-xs px-3 py-2 rounded-xl cursor-pointer inline-flex items-center gap-1.5" style={{ background: C.cream, color: C.charcoal }}>
          {up ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {up ? "กำลังอัปโหลด..." : value ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
          <input type="file" accept="image/*" onChange={pick} className="hidden" disabled={up} />
        </label>
      </div>
      {err && <div className="text-[11px] mt-1" style={{ color: C.red }}>{err}</div>}
    </div>
  );
}

/* ============ ช่องอัปโหลดหลายรูป (เช่น รูปตำหนิ สูงสุด max รูป) ============ */
// แปลงค่าที่เก็บใน DB (JSON array หรือ string ว่าง) → array ของ URL อย่างปลอดภัย
function parseUrls(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try { const a = JSON.parse(value); return Array.isArray(a) ? a : []; } catch { return []; }
}
function MultiImageField({ value, onChange, max = 10 }) {
  const urls = parseUrls(value);
  const [up, setUp] = useState(false);
  const [err, setErr] = useState("");
  const save = (arr) => onChange(JSON.stringify(arr)); // เก็บเป็น JSON string

  async function pick(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // เคลียร์เพื่อให้เลือกไฟล์เดิมซ้ำได้
    if (!files.length) return;
    const room = max - urls.length;
    if (room <= 0) { setErr(`อัปโหลดได้สูงสุด ${max} รูป`); return; }
    setUp(true); setErr("");
    const added = [];
    for (const file of files.slice(0, room)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (res.ok) added.push(data.url);
        else setErr(data.error || "อัปโหลดบางรูปไม่สำเร็จ");
      } catch { setErr("อัปโหลดบางรูปไม่สำเร็จ"); }
    }
    if (added.length) save([...urls, ...added]);
    if (files.length > room) setErr(`อัปโหลดได้อีกแค่ ${room} รูป (เกิน ${max} รูป)`);
    setUp(false);
  }
  const remove = (i) => save(urls.filter((_, idx) => idx !== i));

  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden" style={{ background: C.cream }}>
            <img src={u} alt="" className="w-full h-full object-cover" />
            <button type="button" onClick={() => remove(i)} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: C.red }}><X size={12} /></button>
          </div>
        ))}
        {urls.length < max && (
          <label className="w-16 h-16 rounded-xl cursor-pointer flex flex-col items-center justify-center gap-1 border border-dashed" style={{ borderColor: C.line, color: C.taupe }}>
            {up ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
            <span className="text-[9px]">{up ? "อัป.." : "เพิ่มรูป"}</span>
            <input type="file" accept="image/*" multiple onChange={pick} className="hidden" disabled={up} />
          </label>
        )}
      </div>
      <div className="text-[11px] mt-1" style={{ color: err ? C.red : C.taupe }}>{err || `${urls.length}/${max} รูป`}</div>
    </div>
  );
}

/* ============ ฟอร์มทั่วไป (เพิ่ม/แก้ไข) ============ */
/* ============ ช่องเลือกลูกค้า (เลือกจากรายชื่อ + เพิ่มใหม่ได้ในตัว) ============ */
function CustomerSelect({ value, onChange, customers = [] }) {
  const [adding, setAdding] = useState(false);
  const [extra, setExtra] = useState([]); // ลูกค้าใหม่ที่เพิ่งเพิ่ม (โชว์ใน dropdown ทันที)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const names = [...customers.map((c) => c.name), ...extra];

  async function add() {
    if (!name.trim()) { setErr("กรุณากรอกชื่อ"); return; }
    setBusy(true); setErr("");
    try {
      const id = "C" + Math.floor(1000 + Math.random() * 9000);
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: name.trim(), phone }) });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) { setErr(data.error || "เพิ่มไม่สำเร็จ"); return; }
      setExtra((e) => [...e, data.name]);
      onChange(data.name);
      setAdding(false); setName(""); setPhone("");
    } catch { setBusy(false); setErr("เพิ่มไม่สำเร็จ"); }
  }

  if (adding) {
    return (
      <div className="mt-1 p-2.5 rounded-xl space-y-2" style={{ background: C.cream }}>
        <div className="text-xs font-semibold">เพิ่มลูกค้าใหม่</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อ-นามสกุล *" className="w-full py-2 px-3 text-sm rounded-lg border outline-none" style={{ borderColor: C.line }} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="เบอร์โทร (ไม่บังคับ)" className="w-full py-2 px-3 text-sm rounded-lg border outline-none" style={{ borderColor: C.line }} />
        {err && <div className="text-[11px]" style={{ color: C.red }}>{err}</div>}
        <div className="flex gap-2">
          <button type="button" onClick={() => { setAdding(false); setErr(""); }} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "#fff", border: "1px solid " + C.line }}>ยกเลิก</button>
          <button type="button" onClick={add} disabled={busy} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: C.gold }}>{busy ? "กำลังบันทึก..." : "บันทึกลูกค้า"}</button>
        </div>
      </div>
    );
  }
  return (
    <select value={value} onChange={(e) => e.target.value === "__new__" ? setAdding(true) : onChange(e.target.value)}
      className="w-full py-2.5 px-3 mt-1 text-sm rounded-xl border outline-none bg-white" style={{ borderColor: C.line }}>
      <option value="">— เลือกลูกค้า —</option>
      {names.map((n) => <option key={n} value={n}>{n}</option>)}
      <option value="__new__">+ เพิ่มลูกค้าใหม่...</option>
    </select>
  );
}

function FormModal({ title, fields, initial, onClose, onSubmit, customers = [], products = [] }) {
  const [form, setForm] = useState(() => {
    const base = {};
    fields.forEach((f) => { base[f.key] = initial?.[f.key] ?? (f.type === "number" ? 0 : ""); });
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  async function handle(e) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      await onSubmit(form);
    } catch (e2) {
      setErr(e2?.message || "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} title={title} wide>
      <form onSubmit={handle} className="space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-xs" style={{ color: C.taupe }}>{f.label}{f.required && " *"}</label>
            {f.type === "image" ? (
              <div className="mt-1"><ImageField value={form[f.key]} onChange={(v) => set(f.key, v)} /></div>
            ) : f.type === "images" ? (
              <div className="mt-1"><MultiImageField value={form[f.key]} onChange={(v) => set(f.key, v)} max={10} /></div>
            ) : f.type === "customer" ? (
              <CustomerSelect value={form[f.key]} onChange={(v) => set(f.key, v)} customers={customers} />
            ) : f.type === "product" ? (
              <select value={form[f.key]} required={f.required}
                onChange={(e) => {
                  const pid = e.target.value;
                  set(f.key, pid);
                  // เลือกสินค้าแล้วเติมช่องอื่นให้อัตโนมัติ (เช่น ชื่อ/ราคา) ตาม f.fill
                  const prod = products.find((p) => p.id === pid);
                  if (prod && f.fill) Object.entries(f.fill).forEach(([k, src]) => set(k, typeof src === "function" ? src(prod) : (prod[src] ?? "")));
                }}
                className="w-full py-2.5 px-3 mt-1 text-sm rounded-xl border outline-none bg-white" style={{ borderColor: C.line }}>
                <option value="">— เลือกสินค้าจากคลัง —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.name} (เช่า {p.stockRent}/ขาย {p.stockSell})</option>)}
              </select>
            ) : f.type === "select" ? (
              <select value={form[f.key]} onChange={(e) => set(f.key, e.target.value)} required={f.required}
                className="w-full py-2.5 px-3 mt-1 text-sm rounded-xl border outline-none bg-white" style={{ borderColor: C.line }}>
                <option value="">— เลือก —</option>
                {f.options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
              </select>
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                value={form[f.key]}
                onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                placeholder={f.placeholder || ""}
                required={f.required}
                disabled={f.readOnly}
                className="w-full py-2.5 px-3 mt-1 text-sm rounded-xl border outline-none" style={{ borderColor: C.line, background: f.readOnly ? C.cream : "#fff" }}
              />
            )}
          </div>
        ))}
        {err && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: C.redBg, color: C.red }}>{err}</div>}
        <div className="flex gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>ยกเลิก</Btn>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white transition active:scale-95" style={{ background: C.gold, opacity: saving ? 0.7 : 1 }}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============ ยืนยันการลบ ============ */
function ConfirmDelete({ name, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal onClose={onClose} title="ยืนยันการลบ">
      <p className="text-sm mb-4">ต้องการลบ <b>{name}</b> ใช่ไหม? การลบนี้ย้อนกลับไม่ได้</p>
      <div className="flex gap-2">
        <Btn variant="outline" onClick={onClose}>ยกเลิก</Btn>
        <button onClick={async () => { setBusy(true); await onConfirm(); }} disabled={busy}
          className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white" style={{ background: C.red, opacity: busy ? 0.7 : 1 }}>
          {busy ? "กำลังลบ..." : "ลบ"}
        </button>
      </div>
    </Modal>
  );
}

/* ============ โปรไฟล์ / เปลี่ยนรหัสผ่าน ============ */
function ProfileModal({ me, onClose, onSaved }) {
  const [name, setName] = useState(me?.name || "");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const inputCls = "w-full py-2.5 px-3 mt-1 text-sm rounded-xl border outline-none";

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr(""); setMsg("");
    const body: any = { name };
    if (pw) { body.currentPassword = cur; body.newPassword = pw; }
    try {
      const res = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      setBusy(false);
      if (!res.ok) { setErr(data.error || "บันทึกไม่สำเร็จ"); return; }
      setMsg("บันทึกเรียบร้อยแล้ว ✓"); setCur(""); setPw("");
      onSaved(data.user);
    } catch {
      setBusy(false); setErr("เกิดข้อผิดพลาด");
    }
  }

  return (
    <Modal onClose={onClose} title="โปรไฟล์ / ตั้งค่า" wide>
      <form onSubmit={save} className="space-y-3">
        <div className="flex items-center gap-3 pb-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.gold }}>{(me?.name || "?")[0]}</div>
          <div className="text-xs" style={{ color: C.taupe }}>{me?.email}<br />สิทธิ์: {me?.role}</div>
        </div>
        <div>
          <label className="text-xs" style={{ color: C.taupe }}>ชื่อที่แสดง</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} style={{ borderColor: C.line }} />
        </div>
        <div className="pt-3 border-t" style={{ borderColor: C.line }}>
          <div className="text-xs font-semibold mb-1">เปลี่ยนรหัสผ่าน <span style={{ color: C.taupe }}>(เว้นว่างถ้าไม่เปลี่ยน)</span></div>
          <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="รหัสผ่านเดิม" className={inputCls} style={{ borderColor: C.line }} />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)" className={inputCls} style={{ borderColor: C.line }} />
        </div>
        {err && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: C.redBg, color: C.red }}>{err}</div>}
        {msg && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: C.greenBg, color: C.green }}>{msg}</div>}
        <div className="flex gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>ปิด</Btn>
          <button type="submit" disabled={busy} className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white" style={{ background: C.gold, opacity: busy ? 0.7 : 1 }}>
            {busy ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============ FIELD CONFIGS ============ */
const PROD_STATUS = ["พร้อมเช่า", "ถูกจอง", "กำลังเช่า", "ซัก", "ซ่อม", "ปลดสต็อก"];
const ORDER_STATUS = ["รอชำระ", "เตรียมของ", "กำลังจัดส่ง", "สำเร็จ"];
const RENTAL_STATUS = ["จองแล้ว", "รับชุดแล้ว", "กำลังเช่า", "คืนแล้ว", "เกินกำหนด"];
const LAUNDRY_STATUS = ["รอดำเนินการ", "กำลังดำเนินการ", "รอซ่อม", "เสร็จแล้ว"];
const CARRIERS = ["Kerry", "Flash", "ไปรษณีย์ไทย", "J&T"];

const productFields = (isEdit, cats = []) => [
  { key: "id", label: "รหัสสินค้า", required: true, readOnly: isEdit, placeholder: "เช่น HS-D001" },
  { key: "name", label: "ชื่อสินค้า", required: true },
  { key: "cat", label: "หมวดหมู่", type: "select", required: true, options: cats },
  { key: "type", label: "ประเภท", type: "select", options: ["เช่า", "ขาย", "ทั้งคู่"], required: true },
  { key: "size", label: "ไซส์", placeholder: "เช่น S / M / L / Free" },
  { key: "color", label: "สี", placeholder: "เช่น แดง, ทอง" },
  { key: "chest", label: "อก (นิ้ว)", type: "number" },
  { key: "waist", label: "เอว (นิ้ว)", type: "number" },
  { key: "hip", label: "สะโพก (นิ้ว)", type: "number" },
  { key: "length", label: "ความยาว (นิ้ว)", type: "number" },
  { key: "rent", label: "ค่าเช่า (บาท)", type: "number" },
  { key: "sell", label: "ราคาขาย (บาท)", type: "number" },
  { key: "stockRent", label: "สต็อกเช่า (ชิ้น)", type: "number" },
  { key: "stockSell", label: "สต็อกขาย (ชิ้น)", type: "number" },
  { key: "loc", label: "ตำแหน่งเก็บ", placeholder: "เช่น ราว A1" },
  { key: "value", label: "มูลค่าชุด (บาท)", type: "number" },
  { key: "acquired", label: "วันที่ได้มา", placeholder: "เช่น 16 มิ.ย. 68" },
  { key: "note", label: "หมายเหตุ", placeholder: "รายละเอียดเพิ่มเติม เช่น ตำหนิ/ที่มา" },
  { key: "status", label: "สถานะ", type: "select", options: PROD_STATUS },
  { key: "image", label: "รูปด้านหน้า", type: "image" },
  { key: "imageBack", label: "รูปด้านหลัง", type: "image" },
  { key: "defects", label: "รูปตำหนิ (สูงสุด 10 รูป)", type: "images" },
];
const customerFields = (isEdit) => [
  { key: "id", label: "รหัสลูกค้า", required: true, readOnly: isEdit, placeholder: "เช่น C001" },
  { key: "name", label: "ชื่อ-นามสกุล", required: true },
  { key: "phone", label: "เบอร์โทร" },
  { key: "line", label: "LINE ID" },
  { key: "addr", label: "ที่อยู่" },
  { key: "orders", label: "จำนวนออเดอร์สะสม", type: "number" },
  { key: "spent", label: "ยอดใช้จ่ายสะสม", type: "number" },
];
const orderFields = (isEdit) => [
  { key: "id", label: "เลขที่ออเดอร์", required: true, readOnly: isEdit, placeholder: "เช่น ORD-2401" },
  { key: "cust", label: "ลูกค้า", type: "customer", required: true },
  { key: "code", label: "เลือกสินค้าจากคลัง (ตัดสต็อกขายอัตโนมัติ)", type: "product", fill: { items: "name", total: (p) => p.sell || p.rent || 0 } },
  { key: "items", label: "รายการสินค้า (แก้ไขได้)", required: true },
  { key: "total", label: "ยอดรวม (บาท)", type: "number" },
  { key: "status", label: "สถานะ", type: "select", options: ORDER_STATUS },
  { key: "date", label: "วันที่", placeholder: "เช่น 16 มิ.ย. 68" },
];
const rentalFields = (isEdit) => [
  { key: "id", label: "เลขที่การเช่า", required: true, readOnly: isEdit, placeholder: "เช่น R-501" },
  { key: "cust", label: "ลูกค้า", type: "customer", required: true },
  { key: "phone", label: "เบอร์โทรลูกค้า", placeholder: "เช่น 081-234-5678" },
  { key: "code", label: "เลือกชุดจากคลัง (ตัดสต็อกอัตโนมัติ + เติมชื่อ/ค่าเช่าให้)", type: "product", fill: { item: "name", fee: (p) => p.rent || 0 } },
  { key: "item", label: "รายการที่เช่า (แก้ไขได้)", required: true },
  { key: "start", label: "วันรับ", placeholder: "เช่น 16 มิ.ย." },
  { key: "end", label: "วันคืน", placeholder: "เช่น 18 มิ.ย." },
  { key: "fee", label: "ค่าเช่า (บาท)", type: "number" },
  { key: "deposit", label: "เงินมัดจำ (บาท)", type: "number" },
  { key: "fine", label: "ค่าปรับล่าช้า (บาท)", type: "number" },
  { key: "damage", label: "ค่าเสียหาย/ค่าซ่อม (บาท)", type: "number" },
  { key: "status", label: "สถานะ", type: "select", options: RENTAL_STATUS },
  { key: "inspector", label: "ผู้ตรวจรับ-คืน", placeholder: "ชื่อพนักงานที่ตรวจ" },
  { key: "condition", label: "สภาพชุดหลังคืน", placeholder: "เช่น สมบูรณ์ / มีรอยเปื้อน / ชำรุด" },
  { key: "photoBefore", label: "รูปก่อนส่งมอบ", type: "image" },
  { key: "photoAfter", label: "รูปหลังรับคืน", type: "image" },
];
const laundryFields = (isEdit) => [
  { key: "id", label: "รหัสรายการ", required: true, readOnly: isEdit, placeholder: "เช่น LR-001" },
  { key: "date", label: "วันที่", placeholder: "เช่น 16 มิ.ย." },
  { key: "code", label: "เลือกชุดจากคลัง", type: "product" },
  { key: "item", label: "รายการ", required: true, placeholder: "เช่น ซักแห้งชุดราตรี / ซ่อมซิปข้าง" },
  { key: "type", label: "ประเภท", type: "select", options: ["ซัก", "ซ่อม"], required: true },
  { key: "cost", label: "ค่าใช้จ่าย (บาท)", type: "number" },
  { key: "owner", label: "ผู้รับผิดชอบ/ร้าน", placeholder: "เช่น ร้านซักพี่หมี" },
  { key: "status", label: "สถานะ", type: "select", options: LAUNDRY_STATUS },
];
const txnFields = () => [
  { key: "id", label: "รหัสรายการ", required: true, placeholder: "เช่น T-9001" },
  { key: "date", label: "วันที่", placeholder: "เช่น 16 มิ.ย." },
  { key: "desc", label: "รายละเอียด", required: true },
  { key: "cat", label: "หมวด", placeholder: "เช่น รายรับ-เช่า" },
  { key: "type", label: "ประเภท", type: "select", options: [{ value: "in", label: "รายรับ" }, { value: "out", label: "รายจ่าย" }], required: true },
  { key: "amt", label: "จำนวนเงิน (บาท)", type: "number" },
];
const shipFields = (isEdit) => [
  { key: "id", label: "รหัสใบส่ง", required: true, readOnly: isEdit, placeholder: "เช่น SH-301" },
  { key: "order", label: "เลขที่ออเดอร์", required: true },
  { key: "cust", label: "ชื่อลูกค้า", required: true },
  { key: "carrier", label: "ขนส่ง", type: "select", options: CARRIERS },
];
const userFields = (isEdit) => [
  { key: "name", label: "ชื่อ-นามสกุล", required: true },
  { key: "email", label: "อีเมล (ใช้ล็อกอิน)", required: !isEdit, readOnly: isEdit, placeholder: "name@studio.co" },
  { key: "password", label: isEdit ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน (อย่างน้อย 6 ตัว)", required: !isEdit },
  { key: "role", label: "บทบาท", type: "select", required: true, options: ["เจ้าของ", "ผู้ดูแลระบบ", "พนักงานขาย", "ลูกค้า"] },
];

/* ============ NAV CONFIG ============ */
const NAV = [
  { id: "dash", label: "แดชบอร์ด", icon: LayoutDashboard },
  { id: "products", label: "สต็อกสินค้า", icon: Shirt, children: [
    { id: "products-rent", label: "สินค้าเช่า" },
    { id: "products-sell", label: "สินค้าขาย" },
  ] },
  { id: "customers", label: "ลูกค้า", icon: Users },
  { id: "orders", label: "คำสั่งซื้อ", icon: ShoppingBag },
  { id: "rentals", label: "จองชุดเช่า", icon: CalendarDays },
  { id: "laundry", label: "ซัก-ซ่อม", icon: Droplets },
  { id: "accounting", label: "บัญชีรับจ่าย", icon: Wallet },
  { id: "reports", label: "รายงาน", icon: BarChart3 },
  { id: "userman", label: "จัดการผู้ใช้", icon: UserCog },
];

// ===== สิทธิ์: บทบาทไหนเห็นเมนูอะไรบ้าง =====
const ALL_PAGES = NAV.map((n) => n.id);
const ROLE_PAGES = {
  "เจ้าของ": ALL_PAGES,
  "ผู้ดูแลระบบ": ALL_PAGES, // เหมือนเจ้าของ (ต่างแค่ลบบัญชีเจ้าของไม่ได้)
  "พนักงานขาย": ["dash", "products", "customers", "orders", "rentals", "laundry"],
  "ลูกค้า": ["dash", "orders", "rentals"],
};
const pagesForRole = (role) => ROLE_PAGES[role] || ["dash"]; // บทบาทไม่รู้จัก = เห็นแค่แดชบอร์ด
// หน้าย่อย products-rent / products-sell ถือเป็นหน้า products หลัก
const baseOf = (pg) => (pg && pg.startsWith("products") ? "products" : pg);

/* ============ MAIN APP ============ */
export default function App() {
  const [page, setPage] = useState("dash");
  const [mobile, setMobile] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false); // เมนูย่อยสินค้า เปิด/ปิด
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [laundry, setLaundry] = useState([]);
  const [txns, setTxns] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [qrItem, setQrItem] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // ดึง JSON แบบปลอดภัย — ถ้าเข้าไม่ได้ (เช่น 403 ตามสิทธิ์) คืนค่า fallback
  async function getJSON(url, fallback) {
    try {
      const r = await fetch(url);
      if (!r.ok) return fallback;
      const d = await r.json();
      return Array.isArray(d) || typeof d === "object" ? d : fallback;
    } catch {
      return fallback;
    }
  }

  async function loadAll() {
    try {
      const [mr, p, c, o, r, l, t, s, u, cat] = await Promise.all([
        getJSON("/api/auth/me", { user: null }),
        getJSON("/api/products", []),
        getJSON("/api/customers", []),
        getJSON("/api/orders", []),
        getJSON("/api/rentals", []),
        getJSON("/api/laundry", []),
        getJSON("/api/transactions", []),
        getJSON("/api/shipments", []),
        getJSON("/api/users", []),
        getJSON("/api/categories", []),
      ]);
      setMe(mr.user);
      setProducts(p); setCustomers(c); setOrders(o); setRentals(r); setLaundry(l);
      setTxns(t); setShipments(s); setUsers(u); setCategories(cat);
    } catch (e) {
      console.error("โหลดข้อมูลไม่สำเร็จ", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const f = () => setMobile(window.innerWidth < 768);
    f(); window.addEventListener("resize", f);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap";
    document.head.appendChild(link);
    const st = document.createElement("style");
    st.textContent = `[style*="Georgia"]{font-family:'Playfair Display','Noto Sans Thai',Georgia,serif !important;letter-spacing:.005em;}`;
    document.head.appendChild(st);
    loadAll();
    return () => window.removeEventListener("resize", f);
  }, []);

  const go = (id) => { setPage(id); setMoreOpen(false); window.scrollTo(0, 0); };

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  // ===== ตัวช่วย CRUD (บันทึกลงฐานข้อมูล แล้วโหลดใหม่) =====
  async function saveEntity(endpoint, data, id) {
    const url = id ? `/api/${endpoint}/${id}` : `/api/${endpoint}`;
    const method = id ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "บันทึกไม่สำเร็จ");
    }
    await loadAll();
  }
  async function deleteEntity(endpoint, id) {
    await fetch(`/api/${endpoint}/${id}`, { method: "DELETE" });
    await loadAll();
  }

  // mutation เดิม (ปุ่มลัด)
  // ปรับสต็อกแยกคลัง (field = "stockRent" หรือ "stockSell")
  const adjustStock = async (id, field, delta) => {
    const cur = products.find((x) => x.id === id);
    if (!cur) return;
    const val = Math.max(0, (cur[field] || 0) + delta);
    setProducts((p) => p.map((x) => (x.id === id ? { ...x, [field]: val } : x)));
    await fetch(`/api/products/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: val }) });
  };
  const advanceRental = async (id) => {
    const order = ["จองแล้ว", "รับชุดแล้ว", "กำลังเช่า", "คืนแล้ว"];
    const cur = rentals.find((x) => x.id === id);
    if (!cur) return;
    const i = order.indexOf(cur.status);
    if (i < 0 || i >= order.length - 1) return;
    const status = order[i + 1];
    setRentals((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch(`/api/rentals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  };
  const makeTrack = async (id) => {
    const track = "TH" + Math.floor(Math.random() * 900000000 + 100000000);
    const status = "กำลังจัดส่ง";
    setShipments((s) => s.map((x) => (x.id === id ? { ...x, track, status } : x)));
    await fetch(`/api/shipments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track, status }) });
  };

  // ===== สิทธิ์ตามบทบาท =====
  const role = me?.role || "";
  const allowed = pagesForRole(role);
  const navItems = NAV.filter((n) => allowed.includes(n.id));
  const canEdit = role !== "ลูกค้า"; // ลูกค้า = อ่านอย่างเดียว

  // ถ้าหน้าปัจจุบันไม่อยู่ในสิทธิ์ ให้กลับไปหน้าแรกที่เข้าได้
  useEffect(() => {
    if (me && !allowed.includes(baseOf(page))) setPage(allowed[0] || "dash");
  }, [me, page, allowed]);

  const ctx = {
    products, customers, orders, rentals, laundry, txns, shipments, users, categories,
    adjustStock, advanceRental, makeTrack, setQrItem, setReceipt, mobile,
    saveEntity, deleteEntity, me, role, canEdit,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: C.bg, color: C.taupe, fontFamily: "'Noto Sans Thai', sans-serif" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold animate-pulse" style={{ background: C.gold, fontFamily: "Georgia,serif" }}>HS</div>
        <div className="text-sm">กำลังโหลดข้อมูลจากฐานข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: C.bg, fontFamily: "'Noto Sans Thai', -apple-system, 'Segoe UI', sans-serif", color: C.charcoal }}>
      {!mobile && (
        <aside className="w-64 shrink-0 border-r flex flex-col sticky top-0 h-screen" style={{ background: "#fff", borderColor: C.line }}>
          <Brand />
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {navItems.map(n => (
              <div key={n.id}>
                {n.children ? (
                  <button onClick={() => setProductsOpen(o => !o)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
                    style={{ background: baseOf(page) === n.id ? C.goldBg : "transparent", color: baseOf(page) === n.id ? "#8a6d1f" : C.charcoal }}>
                    <n.icon size={18} style={{ color: baseOf(page) === n.id ? C.gold : C.taupe }} />
                    {n.label}
                    <ChevronRight size={15} className="ml-auto" style={{ color: C.taupe, transform: productsOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
                  </button>
                ) : (
                  <NavItem n={n} active={page === n.id} onClick={() => go(n.id)} />
                )}
                {n.children && productsOpen && n.children.map(ch => (
                  <button key={ch.id} onClick={() => go(ch.id)} className="w-full flex items-center gap-2 pl-11 pr-3 py-2 rounded-xl text-sm transition"
                    style={{ background: page === ch.id ? C.goldBg : "transparent", color: page === ch.id ? "#8a6d1f" : C.taupe }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: page === ch.id ? C.gold : C.line }} />{ch.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="p-3 border-t" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-2 p-2 rounded-xl mb-2" style={{ background: C.cream }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.gold }}>{(me?.name || "H")[0]}</div>
              <div className="leading-tight min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{me?.name || "ผู้ใช้"}</div>
                <div className="text-xs" style={{ color: C.taupe }}>{me?.role || ""}</div>
              </div>
              <button onClick={() => setProfileOpen(true)} title="โปรไฟล์ / ตั้งค่า" className="p-1.5 rounded-lg" style={{ background: "#fff" }}><Settings size={15} style={{ color: C.taupe }} /></button>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium" style={{ background: C.redBg, color: C.red }}>
              <LogOut size={15} />ออกจากระบบ
            </button>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {mobile && (
          <header className="sticky top-0 z-20 flex items-center justify-between px-4 h-14 border-b" style={{ background: "#fff", borderColor: C.line }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: C.gold, fontFamily: "Georgia,serif" }}>HS</div>
              <span className="font-bold text-sm" style={{ fontFamily: "Georgia,serif", letterSpacing: 1 }}>HONEY STUDIO</span>
            </div>
            <button className="relative"><Bell size={20} style={{ color: C.taupe }} /><span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: C.red }} /></button>
          </header>
        )}

        <main className="flex-1 px-4 md:px-7 py-5 md:py-7 pb-24 md:pb-7 max-w-7xl w-full mx-auto">
          {page === "dash" && <Dashboard {...ctx} go={go} />}
          {baseOf(page) === "products" && <Products {...ctx} mode={page === "products-rent" ? "rent" : page === "products-sell" ? "sell" : "all"} />}
          {page === "customers" && <Customers {...ctx} />}
          {page === "orders" && <Orders {...ctx} />}
          {page === "rentals" && <Rentals {...ctx} />}
          {page === "laundry" && <Laundry {...ctx} />}
          {page === "accounting" && <Accounting {...ctx} />}
          {page === "reports" && <Reports {...ctx} />}
          {page === "userman" && <UserMan {...ctx} />}
        </main>

        {mobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-30 border-t flex" style={{ background: "#fff", borderColor: C.line }}>
            {navItems.slice(0, 4).map(n => (
              <button key={n.id} onClick={() => go(n.id)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5" style={{ color: baseOf(page) === n.id ? C.gold : C.taupe }}>
                <n.icon size={20} /><span className="text-[10px]">{n.label}</span>
              </button>
            ))}
            <button onClick={() => setMoreOpen(true)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5" style={{ color: C.taupe }}>
              <Menu size={20} /><span className="text-[10px]">เพิ่มเติม</span>
            </button>
          </nav>
        )}

        {mobile && moreOpen && (
          <div className="fixed inset-0 z-40 flex items-end" style={{ background: "rgba(0,0,0,.4)" }} onClick={() => setMoreOpen(false)}>
            <div className="w-full rounded-t-3xl p-5 pb-8" style={{ background: "#fff" }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">เมนูทั้งหมด</span>
                <button onClick={() => setMoreOpen(false)}><X size={22} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {navItems.flatMap(n => n.children ? [n, ...n.children.map(ch => ({ id: ch.id, label: ch.label, icon: n.icon }))] : [n]).map(n => (
                  <button key={n.id} onClick={() => go(n.id)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl" style={{ background: page === n.id ? C.goldBg : C.cream }}>
                    <n.icon size={22} style={{ color: page === n.id ? C.gold : C.charcoal }} />
                    <span className="text-[11px] text-center" style={{ color: C.charcoal }}>{n.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => { setMoreOpen(false); setProfileOpen(true); }} className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-4 rounded-xl text-sm font-medium" style={{ background: C.cream, color: C.charcoal }}>
                <Settings size={15} />โปรไฟล์ / เปลี่ยนรหัสผ่าน
              </button>
              <button onClick={logout} className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 rounded-xl text-sm font-medium" style={{ background: C.redBg, color: C.red }}>
                <LogOut size={15} />ออกจากระบบ ({me?.name})
              </button>
            </div>
          </div>
        )}
      </div>

      {qrItem && (
        <Modal onClose={() => setQrItem(null)} title="รายละเอียดสินค้า" wide>
          <div className="flex flex-col items-center gap-3 py-1">
            {/* รูปด้านหน้า/หลัง */}
            {(qrItem.image || qrItem.imageBack) && (
              <div className="flex gap-3 w-full justify-center">
                {qrItem.image && (
                  <div className="text-center">
                    <img src={qrItem.image} alt="หน้า" className="w-28 h-36 object-cover rounded-xl" style={{ background: C.cream }} />
                    <div className="text-[10px] mt-1" style={{ color: C.taupe }}>ด้านหน้า</div>
                  </div>
                )}
                {qrItem.imageBack && (
                  <div className="text-center">
                    <img src={qrItem.imageBack} alt="หลัง" className="w-28 h-36 object-cover rounded-xl" style={{ background: C.cream }} />
                    <div className="text-[10px] mt-1" style={{ color: C.taupe }}>ด้านหลัง</div>
                  </div>
                )}
              </div>
            )}
            <div className="text-center">
              <div className="font-bold">{qrItem.name}</div>
              <div className="text-sm" style={{ color: C.taupe }}>รหัส: {qrItem.id} · {qrItem.cat} · {qrItem.loc}</div>
            </div>
            {/* สัดส่วน */}
            {(qrItem.size || qrItem.color || qrItem.chest || qrItem.waist || qrItem.hip || qrItem.length) && (
              <div className="grid grid-cols-3 gap-2 w-full text-xs">
                {[["ไซส์", qrItem.size], ["สี", qrItem.color], ["อก", qrItem.chest && qrItem.chest + '"'], ["เอว", qrItem.waist && qrItem.waist + '"'], ["สะโพก", qrItem.hip && qrItem.hip + '"'], ["ความยาว", qrItem.length && qrItem.length + '"']]
                  .filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="p-2 rounded-lg text-center" style={{ background: C.cream }}>
                      <div style={{ color: C.taupe }}>{k}</div><div className="font-semibold">{v}</div>
                    </div>
                  ))}
              </div>
            )}
            <QR value={qrItem.id} size={140} />
            <div className="flex gap-2 w-full">
              <Btn icon={Printer} variant="outline">พิมพ์สติกเกอร์</Btn>
              <Btn icon={Download}>ดาวน์โหลด QR</Btn>
            </div>
            <p className="text-xs text-center" style={{ color: C.taupe }}>สแกน QR เพื่อเช็ก / คืน / เช็กสถานะเช่า</p>
          </div>
        </Modal>
      )}

      {receipt && <Receipt o={receipt} onClose={() => setReceipt(null)} />}

      {profileOpen && <ProfileModal me={me} onClose={() => setProfileOpen(false)} onSaved={(u) => setMe(u)} />}
    </div>
  );
}

/* ============ BRAND + NAV ITEM ============ */
function Brand() {
  return (
    <div className="px-5 py-5 border-b" style={{ borderColor: C.line }}>
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: C.gold, fontFamily: "Georgia,serif", fontSize: 16 }}>HS</div>
        <div className="leading-tight">
          <div className="font-bold tracking-wide" style={{ fontFamily: "Georgia,serif", letterSpacing: 1.5 }}>HONEY STUDIO</div>
          <div className="text-[10px]" style={{ color: C.taupe, letterSpacing: 1 }}>ระบบจัดการออเดอร์</div>
        </div>
      </div>
    </div>
  );
}
function NavItem({ n, active, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
      style={{ background: active ? C.goldBg : "transparent", color: active ? "#8a6d1f" : C.charcoal }}>
      <n.icon size={18} style={{ color: active ? C.gold : C.taupe }} />
      {n.label}
      {active && <ChevronRight size={15} className="ml-auto" style={{ color: C.gold }} />}
    </button>
  );
}

/* ============ ปุ่มแก้ไข/ลบ เล็ก ============ */
const IconBtn = ({ icon: Icon, onClick, color }) => (
  <button onClick={onClick} className="p-1.5 rounded-lg" style={{ background: C.cream }}><Icon size={15} style={{ color: color || C.charcoal }} /></button>
);

/* ============ 1. DASHBOARD ============ */
function Dashboard({ go, products, rentals }) {
  const kpis = [
    { label: "ยอดขายวันนี้", val: baht(2490), sub: "+12% จากเมื่อวาน", up: true, icon: Coins, color: C.gold, bg: C.goldBg },
    { label: "ยอดเช่าวันนี้", val: baht(3900), sub: "3 รายการ", up: true, icon: CalendarDays, color: C.rose, bg: C.roseBg },
    { label: "ออเดอร์ค้าง", val: "4", sub: "รอดำเนินการ", up: false, icon: ShoppingBag, color: C.blue, bg: C.blueBg },
    { label: "เกินกำหนดคืน", val: String(rentals.filter(r => r.status === "เกินกำหนด").length), sub: "ต้องติดตาม", up: false, icon: AlertTriangle, color: C.red, bg: C.redBg },
  ];
  return (
    <div>
      <PageHead title="แดชบอร์ด" sub="ภาพรวมร้าน วันอังคารที่ 16 มิถุนายน 2568" action={<Btn icon={Plus} onClick={() => go("orders")}>สร้างออเดอร์</Btn>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        {kpis.map(k => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: k.bg }}><k.icon size={20} style={{ color: k.color }} /></div>
              {k.up !== null && (k.up ? <ArrowUpRight size={18} style={{ color: C.green }} /> : <ArrowDownRight size={18} style={{ color: C.red }} />)}
            </div>
            <div className="text-2xl font-bold" style={{ fontFamily: "Georgia,serif" }}>{k.val}</div>
            <div className="text-xs mt-0.5" style={{ color: C.charcoal }}>{k.label}</div>
            <div className="text-[11px]" style={{ color: C.taupe }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold">รายรับ 7 วันล่าสุด</span>
            <span className="text-xs px-2 py-1 rounded-lg" style={{ background: C.cream, color: C.taupe }}>เช่า + ขาย</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.5} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.rose} stopOpacity={0.5} /><stop offset="100%" stopColor={C.rose} stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 12, fill: C.taupe }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.taupe }} axisLine={false} tickLine={false} width={40} />
              <Tooltip />
              <Area type="monotone" dataKey="เช่า" stroke={C.gold} fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="ขาย" stroke={C.rose} fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <span className="font-bold">สัดส่วนหมวดสินค้า</span>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={catData} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {catData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {catData.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />{c.name}</span>
                <span style={{ color: C.taupe }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3"><span className="font-bold">คืนที่ต้องติดตาม</span><button onClick={() => go("rentals")} className="text-xs" style={{ color: C.gold }}>ดูทั้งหมด</button></div>
          <div className="space-y-2.5">
            {rentals.filter(r => ["กำลังเช่า", "เกินกำหนด", "รับชุดแล้ว"].includes(r.status)).map(r => (
              <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: C.cream }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#fff" }}><Shirt size={16} style={{ color: C.taupe }} /></div>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{r.item}</div><div className="text-xs" style={{ color: C.taupe }}>{r.cust} · ครบ {r.end}</div></div>
                <Badge s={r.status} />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3"><span className="font-bold flex items-center gap-1.5"><AlertTriangle size={16} style={{ color: C.red }} />สตอกใกล้หมด</span><button onClick={() => go("inventory")} className="text-xs" style={{ color: C.gold }}>จัดการ</button></div>
          <div className="space-y-2.5">
            {products.filter(p => {
              const lowRent = (p.type === "เช่า" || p.type === "ทั้งคู่") && p.stockRent <= 1;
              const lowSell = (p.type === "ขาย" || p.type === "ทั้งคู่") && p.stockSell <= 1;
              return lowRent || lowSell;
            }).map(p => {
              const parts = [];
              if (p.type === "เช่า" || p.type === "ทั้งคู่") parts.push(`เช่า ${p.stockRent}`);
              if (p.type === "ขาย" || p.type === "ทั้งคู่") parts.push(`ขาย ${p.stockSell}`);
              const zero = p.stockRent === 0 && p.stockSell === 0;
              return (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: zero ? C.redBg : C.cream }}>
                <Package size={18} style={{ color: zero ? C.red : C.taupe }} />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs" style={{ color: C.taupe }}>{p.id} · {p.loc}</div></div>
                <span className="text-sm font-bold" style={{ color: zero ? C.red : C.gold }}>{parts.join(" · ")}</span>
              </div>
            );})}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============ 2. PRODUCTS ============ */
/* ============ จัดการหมวดหมู่ ============ */
function CategoryManager({ categories, saveEntity, deleteEntity, onClose }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function add(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setErr("");
    try { await saveEntity("categories", { name: name.trim() }, null); setName(""); }
    catch (e2) { setErr(e2?.message || "เพิ่มไม่สำเร็จ"); }
    finally { setBusy(false); }
  }
  return (
    <Modal onClose={onClose} title="จัดการหมวดหมู่">
      <form onSubmit={add} className="flex gap-2 mb-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อหมวดหมู่ใหม่ เช่น ชุดสูท" className="flex-1 py-2.5 px-3 text-sm rounded-xl border outline-none" style={{ borderColor: C.line }} />
        <button type="submit" disabled={busy} className="px-4 rounded-xl text-sm font-medium text-white" style={{ background: C.gold, opacity: busy ? 0.7 : 1 }}>เพิ่ม</button>
      </form>
      {err && <div className="text-xs mb-2 px-3 py-2 rounded-lg" style={{ background: C.redBg, color: C.red }}>{err}</div>}
      <div className="space-y-1.5">
        {categories.length === 0 && <div className="text-xs text-center py-3" style={{ color: C.taupe }}>ยังไม่มีหมวดหมู่</div>}
        {categories.map(c => (
          <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: C.cream }}>
            <span className="text-sm flex items-center gap-1.5"><Tag size={13} style={{ color: C.gold }} />{c.name}</span>
            <button onClick={() => deleteEntity("categories", c.id)} className="p-1 rounded-lg"><Trash2 size={14} style={{ color: C.red }} /></button>
          </div>
        ))}
      </div>
      <p className="text-[11px] mt-3" style={{ color: C.taupe }}>ลบหมวดหมู่ไม่กระทบสินค้าที่มีอยู่ (สินค้ายังเก็บชื่อหมวดเดิมไว้)</p>
    </Modal>
  );
}

/* ============ 2. PRODUCTS ============ */
function Products({ products, adjustStock, setQrItem, saveEntity, deleteEntity, categories, mode = "all" }) {
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [form, setForm] = useState(null); // {mode, data}
  const [del, setDel] = useState(null);
  const [catOpen, setCatOpen] = useState(false);
  const [stockAdj, setStockAdj] = useState(null); // { product, field, sign, label }
  const catNames = categories.map(c => c.name);

  // กรองตามโหมด: เช่า = type เช่า/ทั้งคู่, ขาย = type ขาย/ทั้งคู่
  const inMode = (p) => mode === "rent" ? (p.type === "เช่า" || p.type === "ทั้งคู่")
    : mode === "sell" ? (p.type === "ขาย" || p.type === "ทั้งคู่") : true;
  const modeLabel = mode === "rent" ? "เช่า" : mode === "sell" ? "ขาย" : "ทั้งหมด";

  const text = q.trim();
  const list = products.filter(p => {
    const matchText = !text || p.name.includes(text) || p.id.includes(text) || (p.cat || "").includes(text);
    const matchCat = !catFilter || p.cat === catFilter;
    return inMode(p) && matchText && matchCat;
  });

  const defaultType = mode === "rent" ? "เช่า" : mode === "sell" ? "ขาย" : "ทั้งคู่";
  const openAdd = () => setForm({ mode: "add", data: { id: genId("HS-"), type: defaultType, status: "ว่าง", cat: catNames[0] || "" } });
  const openEdit = (p) => setForm({ mode: "edit", data: p });

  // สรุปสต็อก (ยุบจากหน้าคลังสินค้าเดิม) — คิดจากรายการที่กรองอยู่
  const totalRent = list.filter(p => p.type === "เช่า" || p.type === "ทั้งคู่").reduce((s, p) => s + (p.stockRent || 0), 0);
  const totalSell = list.filter(p => p.type === "ขาย" || p.type === "ทั้งคู่").reduce((s, p) => s + (p.stockSell || 0), 0);
  const lowCount = list.filter(p => {
    const lowR = (p.type === "เช่า" || p.type === "ทั้งคู่") && p.stockRent <= 1;
    const lowS = (p.type === "ขาย" || p.type === "ทั้งคู่") && p.stockSell <= 1;
    return lowR || lowS;
  }).length;
  const exportProducts = () => exportExcel([{ name: "สินค้า", rows: list.map(p => ({
    รหัส: p.id, ชื่อ: p.name, หมวด: p.cat, ประเภท: p.type, ไซส์: p.size, สี: p.color,
    อก: p.chest, เอว: p.waist, สะโพก: p.hip, ความยาว: p.length,
    "ค่าเช่า": p.rent, "ราคาขาย": p.sell, "สต็อกเช่า": p.stockRent, "สต็อกขาย": p.stockSell, "ตำแหน่ง": p.loc, สถานะ: p.status,
  })) }], `honey-studio-สินค้า-${modeLabel}.xlsx`);

  return (
    <div>
      <PageHead title={mode === "all" ? "สต็อกสินค้า" : `สต็อกสินค้า — ${modeLabel}`} sub={`${list.length} รายการ · ${categories.length} หมวดหมู่`} action={
        <div className="flex gap-2">
          <Btn variant="outline" icon={Download} onClick={exportProducts}>ส่งออก</Btn>
          <Btn variant="outline" icon={Tag} onClick={() => setCatOpen(true)}>หมวดหมู่</Btn>
          <Btn icon={Plus} onClick={openAdd}>เพิ่มสินค้า</Btn>
        </div>
      } />
      {/* สรุปสต็อกรวม */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[["📦 รวมสต็อกเช่า", totalRent, C.gold], ["🛍️ รวมสต็อกขาย", totalSell, C.rose], ["⚠️ ใกล้หมด", lowCount, C.red]].map(([l, v, c]) => (
          <Card key={l} className="p-3 text-center">
            <div className="text-xl font-bold" style={{ color: c, fontFamily: "Georgia,serif" }}>{v}</div>
            <div className="text-[11px] mt-0.5" style={{ color: C.taupe }}>{l}</div>
          </Card>
        ))}
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 px-3 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
          <Search size={18} style={{ color: C.taupe }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาชื่อ / รหัส / หมวดหมู่" className="flex-1 py-2.5 text-sm outline-none bg-transparent" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2.5 text-sm rounded-xl border bg-white outline-none" style={{ borderColor: C.line }}>
          <option value="">ทุกหมวดหมู่</option>
          {catNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="text-xs mb-3" style={{ color: C.taupe }}>พบ {list.length} รายการ</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {list.map(p => {
          const measures = [p.chest && `อก ${p.chest}`, p.waist && `เอว ${p.waist}`, p.hip && `สะโพก ${p.hip}`, p.length && `ยาว ${p.length}`].filter(Boolean).join(" · ");
          return (
          <Card key={p.id} className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <button onClick={() => setQrItem(p)} className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: C.cream }}>
                {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Shirt size={24} style={{ color: C.taupe }} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-snug">{p.name}</div>
                <div className="text-xs mt-0.5" style={{ color: C.taupe }}>{p.id} · {p.cat}</div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.goldBg, color: "#8a6d1f" }}>{p.type}</span>
                  {p.size && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.cream, color: C.charcoal }}>ไซส์ {p.size}</span>}
                  {p.color && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.cream, color: C.charcoal }}>{p.color}</span>}
                </div>
              </div>
              <button onClick={() => setQrItem(p)} className="shrink-0 p-1.5 rounded-lg" style={{ background: C.cream }}><QrCode size={18} style={{ color: C.charcoal }} /></button>
            </div>
            {measures && <div className="text-[11px] mb-2" style={{ color: C.taupe }}>{measures} (นิ้ว)</div>}
            {parseUrls(p.defects).length > 0 && (
              <div className="mb-2">
                <div className="text-[11px] mb-1 flex items-center gap-1" style={{ color: C.red }}><AlertTriangle size={11} />ตำหนิ {parseUrls(p.defects).length} จุด</div>
                <div className="flex gap-1 flex-wrap">
                  {parseUrls(p.defects).slice(0, 5).map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg overflow-hidden" style={{ background: C.cream }}>
                      <img src={u} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                  {parseUrls(p.defects).length > 5 && <span className="text-[10px] self-center" style={{ color: C.taupe }}>+{parseUrls(p.defects).length - 5}</span>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2 rounded-lg" style={{ background: C.cream }}><div style={{ color: C.taupe }}>ค่าเช่า</div><div className="font-bold">{p.rent ? baht(p.rent) : "—"}</div></div>
              <div className="p-2 rounded-lg" style={{ background: C.cream }}><div style={{ color: C.taupe }}>ราคาขาย</div><div className="font-bold">{p.sell ? baht(p.sell) : "—"}</div></div>
            </div>
            {/* คลังเช่า */}
            {(p.type === "เช่า" || p.type === "ทั้งคู่") && (
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span style={{ color: C.taupe }}>📦 คลังเช่า: <b style={{ color: p.stockRent === 0 ? C.red : C.charcoal }}>{p.stockRent}</b> ชิ้น</span>
                <div className="flex gap-1">
                  <button onClick={() => setStockAdj({ product: p, field: "stockRent", sign: -1, label: "เบิกชุดออก (คลังเช่า)" })} className="px-2 py-1 rounded-lg font-medium" style={{ background: C.roseBg, color: C.charcoal }}>เบิก</button>
                  <button onClick={() => setStockAdj({ product: p, field: "stockRent", sign: 1, label: "รับชุดคืน (คลังเช่า)" })} className="px-2 py-1 rounded-lg font-medium" style={{ background: C.greenBg, color: C.charcoal }}>คืน</button>
                </div>
              </div>
            )}
            {/* คลังขาย */}
            {(p.type === "ขาย" || p.type === "ทั้งคู่") && (
              <div className="flex items-center justify-between text-xs mb-2">
                <span style={{ color: C.taupe }}>🛍️ คลังขาย: <b style={{ color: p.stockSell === 0 ? C.red : C.charcoal }}>{p.stockSell}</b> ชิ้น</span>
                <div className="flex gap-1">
                  <button onClick={() => setStockAdj({ product: p, field: "stockSell", sign: -1, label: "ตัดสต็อกขายออก (คลังขาย)" })} className="px-2 py-1 rounded-lg font-medium" style={{ background: C.roseBg, color: C.charcoal }}>ขายออก</button>
                  <button onClick={() => setStockAdj({ product: p, field: "stockSell", sign: 1, label: "รับสินค้าเข้า (คลังขาย)" })} className="px-2 py-1 rounded-lg font-medium" style={{ background: C.greenBg, color: C.charcoal }}>รับเข้า</button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: C.line }}>
              <Badge s={p.status} />
              <div className="flex gap-1">
                <IconBtn icon={Pencil} onClick={() => openEdit(p)} />
                <IconBtn icon={Trash2} color={C.red} onClick={() => setDel(p)} />
              </div>
            </div>
          </Card>
        );})}
      </div>

      {form && (
        <FormModal
          title={form.mode === "add" ? "เพิ่มสินค้า" : "แก้ไขสินค้า"}
          fields={productFields(form.mode === "edit", catNames)}
          initial={form.data}
          onClose={() => setForm(null)}
          onSubmit={async (data) => { await saveEntity("products", data, form.mode === "edit" ? form.data.id : null); setForm(null); }}
        />
      )}
      {del && <ConfirmDelete name={del.name} onClose={() => setDel(null)} onConfirm={async () => { await deleteEntity("products", del.id); setDel(null); }} />}
      {catOpen && <CategoryManager categories={categories} saveEntity={saveEntity} deleteEntity={deleteEntity} onClose={() => setCatOpen(false)} />}
      {stockAdj && <StockAdjustModal info={stockAdj} adjustStock={adjustStock} onClose={() => setStockAdj(null)} />}
    </div>
  );
}

/* ============ ปรับสต็อก (กรอกจำนวน + ยืนยัน กันเผลอกด) ============ */
function StockAdjustModal({ info, adjustStock, onClose }) {
  const { product, field, sign, label } = info;
  const current = product[field] || 0;
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const isOut = sign < 0;
  const n = Math.max(0, Math.floor(Number(qty) || 0));
  const next = Math.max(0, current + sign * n);
  const tooMuch = isOut && n > current; // เบิก/ขายออกมากกว่าที่มี
  const color = isOut ? C.red : C.green;

  async function apply() {
    if (n <= 0 || tooMuch) return;
    setBusy(true);
    await adjustStock(product.id, field, sign * n);
    onClose();
  }

  return (
    <Modal onClose={onClose} title={label}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: C.cream }}>
          <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: "#fff" }}>
            {product.image ? <img src={product.image} alt="" className="w-full h-full object-cover" /> : <Shirt size={20} style={{ color: C.taupe }} />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{product.name}</div>
            <div className="text-xs" style={{ color: C.taupe }}>{product.id} · คงเหลือ <b style={{ color: C.charcoal }}>{current}</b> ชิ้น</div>
          </div>
        </div>

        <div>
          <label className="text-xs" style={{ color: C.taupe }}>จำนวน (ชิ้น)</label>
          <div className="flex items-center gap-2 mt-1">
            <button type="button" onClick={() => setQty(q => Math.max(1, Math.floor(Number(q) || 1) - 1))} className="w-10 h-10 rounded-xl text-lg font-bold shrink-0" style={{ background: C.cream }}>−</button>
            <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} autoFocus
              className="flex-1 text-center py-2.5 text-base font-bold rounded-xl border outline-none" style={{ borderColor: tooMuch ? C.red : C.line }} />
            <button type="button" onClick={() => setQty(q => Math.floor(Number(q) || 0) + 1)} className="w-10 h-10 rounded-xl text-lg font-bold shrink-0" style={{ background: C.cream }}>+</button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm px-1">
          <span style={{ color: C.taupe }}>คงเหลือหลังปรับ</span>
          <span className="font-bold" style={{ color }}>{current} {isOut ? "→" : "→"} {next} ชิ้น</span>
        </div>
        {tooMuch && <div className="text-xs px-3 py-2 rounded-lg" style={{ background: C.redBg, color: C.red }}>มีของแค่ {current} ชิ้น เบิก/ขายออกได้ไม่เกินนี้</div>}

        <div className="flex gap-2 pt-1">
          <Btn variant="outline" onClick={onClose}>ยกเลิก</Btn>
          <button type="button" onClick={apply} disabled={busy || n <= 0 || tooMuch}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white transition active:scale-95" style={{ background: color, opacity: (busy || n <= 0 || tooMuch) ? 0.5 : 1 }}>
            {busy ? "กำลังบันทึก..." : `ยืนยัน ${isOut ? "−" : "+"}${n} ชิ้น`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============ 3. INVENTORY (แยกคลังเช่า/ขาย) ============ */
function Inventory({ products }) {
  const [tab, setTab] = useState("rent"); // rent | sell
  const isRent = tab === "rent";
  const field = isRent ? "stockRent" : "stockSell";
  // สินค้าที่อยู่ในคลังนี้ (เช่า = type เช่า/ทั้งคู่, ขาย = type ขาย/ทั้งคู่)
  const inThisStore = (p) => isRent ? (p.type === "เช่า" || p.type === "ทั้งคู่") : (p.type === "ขาย" || p.type === "ทั้งคู่");
  const items = products.filter(inThisStore);
  const cats = [...new Set(items.map(p => p.cat))];
  const totalRent = products.filter(p => p.type === "เช่า" || p.type === "ทั้งคู่").reduce((s, p) => s + (p.stockRent || 0), 0);
  const totalSell = products.filter(p => p.type === "ขาย" || p.type === "ทั้งคู่").reduce((s, p) => s + (p.stockSell || 0), 0);
  const low = items.filter(p => (p[field] || 0) <= 1).length;

  const exportRows = (list, f) => list.map(p => ({ รหัส: p.id, ชื่อ: p.name, หมวด: p.cat, "สต็อก": p[f], "ตำแหน่ง": p.loc, สถานะ: p.status }));

  return (
    <div>
      <PageHead title="คลังสินค้า" sub="แยกคลังเช่า / คลังขาย ชัดเจน" action={
        <Btn icon={Download} variant="outline" onClick={() => exportExcel([
          { name: "คลังเช่า", rows: exportRows(products.filter(p => p.type === "เช่า" || p.type === "ทั้งคู่"), "stockRent") },
          { name: "คลังขาย", rows: exportRows(products.filter(p => p.type === "ขาย" || p.type === "ทั้งคู่"), "stockSell") },
        ], "honey-studio-คลังสินค้า.xlsx")}>ส่งออก Excel</Btn>
      } />

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[["📦 รวมคลังเช่า", totalRent, C.gold], ["🛍️ รวมคลังขาย", totalSell, C.rose], [`⚠️ ใกล้หมด (${isRent ? "เช่า" : "ขาย"})`, low, C.red]].map(([l, v, c]) => (
          <Card key={l} className="p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: c, fontFamily: "Georgia,serif" }}>{v}</div>
            <div className="text-xs mt-1" style={{ color: C.taupe }}>{l}</div>
          </Card>
        ))}
      </div>

      {/* สลับคลัง */}
      <div className="flex gap-2 mb-4">
        {[["rent", "📦 คลังเช่า"], ["sell", "🛍️ คลังขาย"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: tab === id ? C.gold : "#fff", color: tab === id ? "#fff" : C.charcoal, border: "1px solid " + (tab === id ? C.gold : C.line) }}>{label}</button>
        ))}
      </div>

      {cats.length === 0 && <div className="text-sm text-center py-8" style={{ color: C.taupe }}>ยังไม่มีสินค้าในคลังนี้</div>}
      {cats.map(cat => (
        <div key={cat} className="mb-5">
          <div className="flex items-center gap-2 mb-2"><Tag size={15} style={{ color: C.gold }} /><span className="font-bold text-sm">{cat}</span></div>
          <Card className="overflow-hidden">
            {items.filter(p => p.cat === cat).map((p, i, arr) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs flex items-center gap-1" style={{ color: C.taupe }}><MapPin size={11} />{p.loc} · {p.id}</div></div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: (p[field] || 0) <= 1 ? C.red : C.charcoal }}>{p[field] || 0} ชิ้น</div>
                  {(p[field] || 0) <= 1 && <div className="text-[10px]" style={{ color: C.red }}>ใกล้หมด</div>}
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}
    </div>
  );
}

/* ============ 4. CUSTOMERS ============ */
function Customers({ customers, orders, saveEntity, deleteEntity }) {
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const openAdd = () => setForm({ mode: "add", data: { id: genId("C") } });
  const openEdit = (c) => setForm({ mode: "edit", data: c });
  return (
    <div>
      <PageHead title="ลูกค้า" sub={`${customers.length} รายชื่อ`} action={<Btn icon={Plus} onClick={openAdd}>เพิ่มลูกค้า</Btn>} />
      <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
        {customers.map(c => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: C.rose }}>{(c.name.replace("คุณ", "") || "?")[0]}</div>
              <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{c.name}</div><div className="text-xs" style={{ color: C.taupe }}>{c.id}</div></div>
              <IconBtn icon={Eye} onClick={() => setSel(c)} />
              <IconBtn icon={Pencil} onClick={() => openEdit(c)} />
              <IconBtn icon={Trash2} color={C.red} onClick={() => setDel(c)} />
            </div>
            <div className="space-y-1.5 text-xs" style={{ color: C.charcoal }}>
              <div className="flex items-center gap-2"><Phone size={13} style={{ color: C.taupe }} />{c.phone}</div>
              <div className="flex items-center gap-2"><MapPin size={13} style={{ color: C.taupe }} />{c.addr}</div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: C.line }}>
              <div className="flex-1 text-center"><div className="text-sm font-bold">{c.orders}</div><div className="text-[10px]" style={{ color: C.taupe }}>ออเดอร์</div></div>
              <div className="flex-1 text-center"><div className="text-sm font-bold" style={{ color: C.gold }}>{baht(c.spent)}</div><div className="text-[10px]" style={{ color: C.taupe }}>ยอดสะสม</div></div>
            </div>
          </Card>
        ))}
      </div>
      {sel && (
        <Modal onClose={() => setSel(null)} title={sel.name} wide>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span style={{ color: C.taupe }}>เบอร์โทร</span><span className="font-medium">{sel.phone}</span></div>
            <div className="flex justify-between"><span style={{ color: C.taupe }}>LINE</span><span className="font-medium">{sel.line}</span></div>
            <div className="flex justify-between"><span style={{ color: C.taupe }}>ที่อยู่</span><span className="font-medium">{sel.addr}</span></div>
            <div className="flex justify-between"><span style={{ color: C.taupe }}>ยอดใช้จ่ายสะสม</span><span className="font-bold" style={{ color: C.gold }}>{baht(sel.spent)}</span></div>
            <div className="pt-2 border-t" style={{ borderColor: C.line }}>
              <div className="font-semibold mb-2">ประวัติล่าสุด</div>
              {orders.filter(o => o.cust === sel.name).map(o => (
                <div key={o.id} className="flex justify-between items-center py-1.5"><span className="text-xs">{o.items}</span><Badge s={o.status} /></div>
              ))}
            </div>
          </div>
        </Modal>
      )}
      {form && (
        <FormModal
          title={form.mode === "add" ? "เพิ่มลูกค้า" : "แก้ไขลูกค้า"}
          fields={customerFields(form.mode === "edit")}
          initial={form.data}
          onClose={() => setForm(null)}
          onSubmit={async (data) => { await saveEntity("customers", data, form.mode === "edit" ? form.data.id : null); setForm(null); }}
        />
      )}
      {del && <ConfirmDelete name={del.name} onClose={() => setDel(null)} onConfirm={async () => { await deleteEntity("customers", del.id); setDel(null); }} />}
    </div>
  );
}

/* ============ 5. ORDERS ============ */
function Orders({ orders, setReceipt, saveEntity, deleteEntity, canEdit, me, shipments, makeTrack, customers, products = [] }) {
  const [section, setSection] = useState("orders"); // orders | shipping
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  // คำสั่งซื้อ = ขายเท่านั้น
  const visible = canEdit ? orders : orders.filter(o => me && (o.cust.includes(me.name) || me.name.includes(o.cust)));
  const list = visible.filter(o => o.type === "ขาย");
  const openAdd = () => setForm({ mode: "add", data: { id: genId("ORD-"), type: "ขาย", status: "รอชำระ" } });
  const openEdit = (o) => setForm({ mode: "edit", data: o });

  // แท็บสลับ คำสั่งซื้อ / การจัดส่ง (เฉพาะพนักงานขึ้นไป)
  const sectionToggle = (
    <div className="flex gap-2 mb-4">
      {[["orders", "🛒 คำสั่งซื้อ"], ["shipping", "🚚 การจัดส่ง"]].map(([id, label]) => (
        <button key={id} onClick={() => setSection(id)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: section === id ? C.gold : "#fff", color: section === id ? "#fff" : C.charcoal, border: "1px solid " + (section === id ? C.gold : C.line) }}>{label}</button>
      ))}
    </div>
  );

  // โหมดการจัดส่ง
  if (canEdit && section === "shipping") {
    return (<div>{sectionToggle}<Shipping shipments={shipments} makeTrack={makeTrack} saveEntity={saveEntity} /></div>);
  }

  return (
    <div>
      {canEdit && sectionToggle}
      <PageHead title="คำสั่งซื้อ (ขาย)" sub={canEdit ? "รายการขายทั้งหมด" : "ออเดอร์ของคุณ"} action={canEdit ? <Btn icon={Plus} onClick={openAdd}>สร้างคำสั่งซื้อ</Btn> : null} />
      {list.length === 0 && <div className="text-sm text-center py-8" style={{ color: C.taupe }}>ยังไม่มีรายการขาย</div>}
      <Card className="overflow-hidden">
        {list.map((o, i, arr) => (
          <div key={o.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: o.type === "เช่า" ? C.roseBg : C.goldBg }}>
              {o.type === "เช่า" ? <CalendarDays size={18} style={{ color: C.rose }} /> : <ShoppingBag size={18} style={{ color: C.gold }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="font-semibold text-sm">{o.id}</span><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: C.cream, color: C.taupe }}>{o.type}</span></div>
              <div className="text-xs truncate" style={{ color: C.taupe }}>{o.cust} · {o.items}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-sm">{baht(o.total)}</div>
              <Badge s={o.status} />
            </div>
            <div className="flex gap-1 shrink-0">
              <IconBtn icon={Printer} onClick={() => setReceipt(o)} />
              {canEdit && <IconBtn icon={Pencil} onClick={() => openEdit(o)} />}
              {canEdit && <IconBtn icon={Trash2} color={C.red} onClick={() => setDel(o)} />}
            </div>
          </div>
        ))}
      </Card>
      {form && (
        <FormModal
          title={form.mode === "add" ? "สร้างคำสั่งซื้อ" : "แก้ไขคำสั่งซื้อ"}
          fields={orderFields(form.mode === "edit")}
          initial={form.data}
          customers={customers}
          products={products}
          onClose={() => setForm(null)}
          onSubmit={async (data) => { await saveEntity("orders", { ...data, type: "ขาย" }, form.mode === "edit" ? form.data.id : null); setForm(null); }}
        />
      )}
      {del && <ConfirmDelete name={del.id} onClose={() => setDel(null)} onConfirm={async () => { await deleteEntity("orders", del.id); setDel(null); }} />}
    </div>
  );
}

/* ============ RECEIPT ============ */
function Receipt({ o, onClose }) {
  return (
    <Modal onClose={onClose} title="ใบเสร็จรับเงิน" wide>
      <div className="border rounded-xl p-5" style={{ borderColor: C.line }}>
        <div className="text-center mb-4 pb-4 border-b" style={{ borderColor: C.line }}>
          <div className="text-xl font-bold" style={{ fontFamily: "Georgia,serif", letterSpacing: 2 }}>HONEY STUDIO</div>
          <div className="text-xs" style={{ color: C.taupe }}>ร้านเช่า–ขาย ชุด รองเท้า กระเป๋า</div>
          <div className="text-xs" style={{ color: C.taupe }}>โทร 074-000-000 · LINE @honeystudio</div>
        </div>
        <div className="flex justify-between text-sm mb-1"><span style={{ color: C.taupe }}>เลขที่</span><span className="font-medium">{o.id}</span></div>
        <div className="flex justify-between text-sm mb-1"><span style={{ color: C.taupe }}>วันที่</span><span>{o.date}</span></div>
        <div className="flex justify-between text-sm mb-3"><span style={{ color: C.taupe }}>ลูกค้า</span><span>{o.cust}</span></div>
        <div className="border-t border-b py-3 my-2" style={{ borderColor: C.line }}>
          <div className="flex justify-between text-sm"><span>{o.items}</span><span>{baht(o.total)}</span></div>
          <div className="text-xs mt-1" style={{ color: C.taupe }}>ประเภท: {o.type}</div>
        </div>
        <div className="flex justify-between font-bold text-base mb-4"><span>ยอดสุทธิ</span><span style={{ color: C.gold }}>{baht(o.total)}</span></div>
        <div className="text-center text-xs" style={{ color: C.taupe }}>ขอบคุณที่ใช้บริการ 🍯</div>
      </div>
      <div className="flex gap-2 mt-4"><Btn icon={Printer} variant="outline">พิมพ์</Btn><Btn icon={Download}>บันทึก PDF</Btn></div>
    </Modal>
  );
}

/* ============ 6. SHIPPING ============ */
function Shipping({ shipments, makeTrack, saveEntity }) {
  const [form, setForm] = useState(null);
  const carriers = CARRIERS;
  const openAdd = () => setForm({ id: genId("SH-"), carrier: "Kerry" });
  return (
    <div>
      <PageHead title="การจัดส่ง" sub="สร้างเลขแทร็กกิ้ง · ติดตามสถานะ" action={<Btn icon={Plus} onClick={openAdd}>สร้างใบส่ง</Btn>} />
      <div className="space-y-3">
        {shipments.map(s => (
          <Card key={s.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.blueBg }}><Truck size={18} style={{ color: C.blue }} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-sm">{s.id}</span><Badge s={s.status} /></div>
                <div className="text-xs mt-0.5" style={{ color: C.taupe }}>{s.order} · {s.cust}</div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-lg" style={{ background: C.cream }}>{s.carrier}</span>
                  {s.track !== "—" ? (
                    <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ background: C.goldBg, color: "#8a6d1f" }}>{s.track}</span>
                  ) : (
                    <button onClick={() => makeTrack(s.id)} className="text-xs px-3 py-1 rounded-lg font-medium" style={{ background: C.gold, color: "#fff" }}>+ สร้างเลขแทร็กกิ้ง</button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-4 mt-4">
        <div className="font-bold text-sm mb-2">ขนส่งที่รองรับ</div>
        <div className="flex gap-2 flex-wrap">{carriers.map(c => <span key={c} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: C.cream }}>{c}</span>)}</div>
      </Card>
      {form && (
        <FormModal
          title="สร้างใบส่ง"
          fields={shipFields(false)}
          initial={form}
          onClose={() => setForm(null)}
          onSubmit={async (data) => { await saveEntity("shipments", { ...data, track: "—", status: "รอสร้างเลข" }, null); setForm(null); }}
        />
      )}
    </div>
  );
}

/* ============ 7. RENTALS ============ */
function Rentals({ rentals, advanceRental, saveEntity, deleteEntity, canEdit, me, customers, products = [] }) {
  const [view, setView] = useState("board");
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const statuses = RENTAL_STATUS;
  const views = [["board", "บอร์ด", LayoutGrid], ["calendar", "ปฏิทิน", CalIcon], ["list", "รายการ", List]];
  // ลูกค้าเห็นเฉพาะการเช่าของตัวเอง
  const visible = canEdit ? rentals : rentals.filter(r => me && (r.cust.includes(me.name) || me.name.includes(r.cust)));
  const openAdd = () => setForm({ mode: "add", data: { id: genId("R-"), status: "จองแล้ว" } });
  const openEdit = (r) => setForm({ mode: "edit", data: r });
  return (
    <div>
      <PageHead title="จองชุดเช่า" sub={`${visible.length} รายการเช่า`} action={canEdit ? <Btn icon={Plus} onClick={openAdd}>จองชุด</Btn> : null} />
      <div className="flex gap-2 mb-4">
        {views.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setView(id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium" style={{ background: view === id ? C.gold : "#fff", color: view === id ? "#fff" : C.charcoal, border: "1px solid " + (view === id ? C.gold : C.line) }}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {view === "board" && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {statuses.map(st => {
            const [fg, bg] = statusColor(st);
            const items = visible.filter(r => r.status === st);
            return (
              <div key={st} className="shrink-0 w-60">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: fg }} />
                  <span className="font-semibold text-sm">{st}</span>
                  <span className="text-xs ml-auto px-1.5 rounded" style={{ background: bg, color: fg }}>{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(r => (
                    <Card key={r.id} className="p-3">
                      <div className="flex items-start justify-between gap-1">
                        <div className="text-sm font-medium leading-snug">{r.item}</div>
                        {canEdit && (
                          <div className="flex gap-1 shrink-0">
                            <IconBtn icon={Pencil} onClick={() => openEdit(r)} />
                            <IconBtn icon={Trash2} color={C.red} onClick={() => setDel(r)} />
                          </div>
                        )}
                      </div>
                      <div className="text-xs mt-1" style={{ color: C.taupe }}>{r.cust}</div>
                      <div className="flex items-center gap-1 text-xs mt-1.5" style={{ color: C.taupe }}><Clock size={11} />{r.start} → {r.end}</div>
                      {canEdit && !["คืนแล้ว", "เกินกำหนด"].includes(r.status) && (
                        <button onClick={() => advanceRental(r.id)} className="mt-2 w-full text-xs py-1.5 rounded-lg font-medium" style={{ background: C.cream, color: C.charcoal }}>เลื่อนสถานะถัดไป →</button>
                      )}
                    </Card>
                  ))}
                  {items.length === 0 && <div className="text-xs text-center py-4 rounded-xl border border-dashed" style={{ color: C.taupe, borderColor: C.line }}>ว่าง</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === "calendar" && <RentalCalendar rentals={rentals} />}

      {view === "list" && (
        <Card className="overflow-hidden">
          {visible.map((r, i, arr) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.cream }}><Shirt size={16} style={{ color: C.taupe }} /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{r.item}</div><div className="text-xs" style={{ color: C.taupe }}>{r.id} · {r.cust} · {r.start}→{r.end}</div></div>
              <Badge s={r.status} />
              {canEdit && (
                <div className="flex gap-1 shrink-0">
                  <IconBtn icon={Pencil} onClick={() => openEdit(r)} />
                  <IconBtn icon={Trash2} color={C.red} onClick={() => setDel(r)} />
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      {form && (
        <FormModal
          title={form.mode === "add" ? "จองชุด/เพิ่มการเช่า" : "แก้ไขการเช่า"}
          fields={rentalFields(form.mode === "edit")}
          initial={form.data}
          customers={customers}
          products={products.filter(p => p.type === "เช่า" || p.type === "ทั้งคู่")}
          onClose={() => setForm(null)}
          onSubmit={async (data) => { await saveEntity("rentals", data, form.mode === "edit" ? form.data.id : null); setForm(null); }}
        />
      )}
      {del && <ConfirmDelete name={del.item} onClose={() => setDel(null)} onConfirm={async () => { await deleteEntity("rentals", del.id); setDel(null); }} />}
    </div>
  );
}

function RentalCalendar({ rentals }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const firstDow = 6;
  const evMap = { 16: ["จองแล้ว"], 15: ["รับชุดแล้ว"], 13: ["กำลังเช่า"], 10: ["คืนแล้ว"], 8: ["เกินกำหนด"], 17: ["จองแล้ว"] };
  return (
    <Card className="p-4">
      <div className="text-center font-bold mb-3" style={{ fontFamily: "Georgia,serif" }}>มิถุนายน 2568</div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1" style={{ color: C.taupe }}>
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(d => <div key={d} className="py-1 font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDow }).map((_, i) => <div key={"e" + i} />)}
        {days.map(d => {
          const evs = evMap[d];
          return (
            <div key={d} className="aspect-square rounded-lg p-1 text-xs flex flex-col" style={{ background: d === 16 ? C.goldBg : C.cream }}>
              <span className="font-medium" style={{ color: d === 16 ? "#8a6d1f" : C.charcoal }}>{d}</span>
              <div className="flex-1 flex flex-col gap-0.5 mt-0.5">
                {evs && evs.map((e, i) => { const [fg] = statusColor(e); return <span key={i} className="h-1.5 rounded-full" style={{ background: fg }} />; })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-4 text-xs">
        {RENTAL_STATUS.map(s => { const [fg] = statusColor(s); return <span key={s} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: fg }} />{s}</span>; })}
      </div>
    </Card>
  );
}

/* ============ ซัก & ซ่อม ============ */
const LAUNDRY_FLOW = ["รอดำเนินการ", "กำลังดำเนินการ", "รอซ่อม", "เสร็จแล้ว"];
function Laundry({ laundry = [], saveEntity, deleteEntity, products = [] }) {
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const [filter, setFilter] = useState("ทั้งหมด");
  const filters = ["ทั้งหมด", "ซัก", "ซ่อม"];

  const visible = filter === "ทั้งหมด" ? laundry : laundry.filter(l => l.type === filter);
  const washCount = laundry.filter(l => l.type === "ซัก").length;
  const repairCount = laundry.filter(l => l.type === "ซ่อม").length;
  const doing = laundry.filter(l => l.status !== "เสร็จแล้ว").length;
  const totalCost = laundry.reduce((s, l) => s + (l.cost || 0), 0);

  const openAdd = () => setForm({ mode: "add", data: { id: genId("LR-"), type: "ซัก", status: "รอดำเนินการ", date: todayTH() } });
  const openEdit = (l) => setForm({ mode: "edit", data: l });
  // เลื่อนสถานะถัดไปอย่างรวดเร็ว
  const advance = async (l) => {
    const i = LAUNDRY_FLOW.indexOf(l.status);
    if (i < 0 || i >= LAUNDRY_FLOW.length - 1) return;
    await saveEntity("laundry", { status: LAUNDRY_FLOW[i + 1] }, l.id);
  };

  return (
    <div>
      <PageHead title="ซัก-ซ่อม" sub={`${laundry.length} รายการ · กำลังดำเนินการ ${doing}`} action={<Btn icon={Plus} onClick={openAdd}>เพิ่มรายการ</Btn>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Card className="p-4"><div className="flex items-center gap-2 text-xs" style={{ color: C.taupe }}><Droplets size={14} style={{ color: C.blue }} />งานซัก</div><div className="text-lg md:text-xl font-bold mt-1" style={{ color: C.blue }}>{washCount}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs" style={{ color: C.taupe }}><Wrench size={14} style={{ color: C.red }} />งานซ่อม</div><div className="text-lg md:text-xl font-bold mt-1" style={{ color: C.red }}>{repairCount}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs" style={{ color: C.taupe }}><Clock size={14} style={{ color: C.gold }} />ค้างดำเนินการ</div><div className="text-lg md:text-xl font-bold mt-1" style={{ color: C.gold }}>{doing}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs" style={{ color: C.taupe }}><Coins size={14} style={{ color: C.charcoal }} />ค่าใช้จ่ายรวม</div><div className="text-lg md:text-xl font-bold mt-1">{baht(totalCost)}</div></Card>
      </div>
      <div className="flex gap-2 mb-4">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-3.5 py-2 rounded-xl text-sm font-medium" style={{ background: filter === f ? C.gold : "#fff", color: filter === f ? "#fff" : C.charcoal, border: "1px solid " + (filter === f ? C.gold : C.line) }}>{f}</button>
        ))}
      </div>
      <Card className="overflow-hidden">
        {visible.length === 0 && <div className="text-sm text-center py-8" style={{ color: C.taupe }}>ยังไม่มีรายการ</div>}
        {visible.map((l, i, arr) => {
          const [fg, bg] = statusColor(l.type);
          return (
            <div key={l.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                {l.type === "ซ่อม" ? <Wrench size={16} style={{ color: fg }} /> : <Droplets size={16} style={{ color: fg }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{l.item}</div>
                <div className="text-xs" style={{ color: C.taupe }}>{l.id}{l.code ? " · " + l.code : ""} · {l.date || "—"}{l.owner ? " · " + l.owner : ""}{l.cost ? " · " + baht(l.cost) : ""}</div>
              </div>
              <Badge s={l.status} />
              {l.status !== "เสร็จแล้ว" && (
                <button onClick={() => advance(l)} title="เลื่อนสถานะถัดไป" className="text-xs px-2 py-1.5 rounded-lg font-medium shrink-0" style={{ background: C.cream, color: C.charcoal }}>ถัดไป →</button>
              )}
              <div className="flex gap-1 shrink-0">
                <IconBtn icon={Pencil} onClick={() => openEdit(l)} />
                <IconBtn icon={Trash2} color={C.red} onClick={() => setDel(l)} />
              </div>
            </div>
          );
        })}
      </Card>
      {form && (
        <FormModal
          title={form.mode === "add" ? "เพิ่มรายการซัก-ซ่อม" : "แก้ไขรายการซัก-ซ่อม"}
          fields={laundryFields(form.mode === "edit")}
          initial={form.data}
          products={products}
          onClose={() => setForm(null)}
          onSubmit={async (data) => { await saveEntity("laundry", data, form.mode === "edit" ? form.data.id : null); setForm(null); }}
        />
      )}
      {del && <ConfirmDelete name={del.item} onClose={() => setDel(null)} onConfirm={async () => { await deleteEntity("laundry", del.id); setDel(null); }} />}
    </div>
  );
}

/* ============ 8. ACCOUNTING ============ */
function Accounting({ txns, saveEntity, deleteEntity }) {
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const inSum = txns.filter(t => t.type === "in").reduce((s, t) => s + t.amt, 0);
  const outSum = txns.filter(t => t.type === "out").reduce((s, t) => s + t.amt, 0);
  const openAdd = () => setForm({ id: genId("T-"), type: "in" });
  return (
    <div>
      <PageHead title="บัญชีรับจ่าย" sub="รายรับ–รายจ่าย · บันทึกรายรับอัตโนมัติจากเช่า+ขาย" action={<Btn icon={Plus} onClick={openAdd}>เพิ่มรายการ</Btn>} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="p-4"><div className="flex items-center gap-2 text-xs" style={{ color: C.taupe }}><ArrowUpRight size={14} style={{ color: C.green }} />รายรับ</div><div className="text-lg md:text-xl font-bold mt-1" style={{ color: C.green }}>{baht(inSum)}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs" style={{ color: C.taupe }}><ArrowDownRight size={14} style={{ color: C.red }} />รายจ่าย</div><div className="text-lg md:text-xl font-bold mt-1" style={{ color: C.red }}>{baht(outSum)}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs" style={{ color: C.taupe }}><TrendingUp size={14} style={{ color: C.gold }} />คงเหลือ</div><div className="text-lg md:text-xl font-bold mt-1" style={{ color: C.gold }}>{baht(inSum - outSum)}</div></Card>
      </div>
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b font-bold text-sm" style={{ borderColor: C.line }}>รายการล่าสุด</div>
        {txns.map((t, i, arr) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.type === "in" ? C.greenBg : C.redBg }}>
              {t.type === "in" ? <ArrowUpRight size={16} style={{ color: C.green }} /> : <ArrowDownRight size={16} style={{ color: C.red }} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium flex items-center gap-1.5">{t.desc}{t.auto && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: C.goldBg, color: "#8a6d1f" }}>AUTO</span>}</div>
              <div className="text-xs" style={{ color: C.taupe }}>{t.date} · {t.cat}</div>
            </div>
            <div className="font-bold text-sm shrink-0" style={{ color: t.type === "in" ? C.green : C.red }}>{t.type === "in" ? "+" : "-"}{baht(t.amt)}</div>
            <IconBtn icon={Trash2} color={C.red} onClick={() => setDel(t)} />
          </div>
        ))}
      </Card>
      {form && (
        <FormModal title="เพิ่มรายการบัญชี" fields={txnFields()} initial={form} onClose={() => setForm(null)}
          onSubmit={async (data) => { await saveEntity("transactions", data, null); setForm(null); }} />
      )}
      {del && <ConfirmDelete name={del.desc} onClose={() => setDel(null)} onConfirm={async () => { await deleteEntity("transactions", del.id); setDel(null); }} />}
    </div>
  );
}

/* ============ 9. REPORTS ============ */
function Reports({ products = [], orders = [], rentals = [], txns = [] }) {
  const [tab, setTab] = useState("ยอดขาย");
  const tabs = [["ยอดขาย", BarChart3], ["สตอกสินค้า", Boxes], ["การเงิน", Wallet]];

  // ===== คำนวณจากข้อมูลจริง =====
  const rentRevenue = orders.filter(o => o.type === "เช่า").reduce((s, o) => s + (o.total || 0), 0);
  const sellRevenue = orders.filter(o => o.type === "ขาย").reduce((s, o) => s + (o.total || 0), 0);
  const salesData = [{ name: "เช่า", ยอดขาย: rentRevenue }, { name: "ขาย", ยอดขาย: sellRevenue }];
  const catReal = Object.entries(products.reduce((m, p) => { m[p.cat] = (m[p.cat] || 0) + 1; return m; }, {})).map(([name, value]) => ({ name, value }));
  const inSum = txns.filter(t => t.type === "in").reduce((s, t) => s + (t.amt || 0), 0);
  const outSum = txns.filter(t => t.type === "out").reduce((s, t) => s + (t.amt || 0), 0);
  const finReal = [{ name: "รายรับ", ยอด: inSum }, { name: "รายจ่าย", ยอด: outSum }, { name: "คงเหลือ", ยอด: inSum - outSum }];

  const exportAll = () => exportExcel([
    { name: "สินค้า", rows: products.map(p => ({ รหัส: p.id, ชื่อ: p.name, หมวด: p.cat, ประเภท: p.type, "ค่าเช่า": p.rent, "ราคาขาย": p.sell, "สต็อกเช่า": p.stockRent, "สต็อกขาย": p.stockSell, สถานะ: p.status })) },
    { name: "คำสั่งซื้อ", rows: orders.map(o => ({ "เลขที่": o.id, "ลูกค้า": o.cust, ประเภท: o.type, รายการ: o.items, "ยอดรวม": o.total, สถานะ: o.status, "วันที่": o.date })) },
    { name: "การเช่า", rows: rentals.map(r => ({ "เลขที่": r.id, "ลูกค้า": r.cust, รายการ: r.item, "วันรับ": r.start, "วันคืน": r.end, สถานะ: r.status })) },
    { name: "บัญชี", rows: txns.map(t => ({ รหัส: t.id, "วันที่": t.date, รายละเอียด: t.desc, หมวด: t.cat, ประเภท: t.type === "in" ? "รายรับ" : "รายจ่าย", "จำนวนเงิน": t.amt })) },
  ], "honey-studio-รายงาน.xlsx");

  return (
    <div>
      <PageHead title="รายงาน" sub="วิเคราะห์ยอดขาย สตอก และการเงิน" action={<Btn icon={Download} variant="outline" onClick={exportAll}>ส่งออก Excel</Btn>} />
      <div className="flex gap-2 mb-4">
        {tabs.map(([t, Icon]) => (
          <button key={t} onClick={() => setTab(t)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium" style={{ background: tab === t ? C.gold : "#fff", color: tab === t ? "#fff" : C.charcoal, border: "1px solid " + (tab === t ? C.gold : C.line) }}><Icon size={15} />{t}</button>
        ))}
      </div>

      {tab === "ยอดขาย" && (
        <Card className="p-4">
          <div className="font-bold text-sm mb-3">รายได้ เช่า vs ขาย (จากออเดอร์จริง)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.taupe }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.taupe }} axisLine={false} tickLine={false} width={55} />
              <Tooltip />
              <Bar dataKey="ยอดขาย" fill={C.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-xs text-center mt-2" style={{ color: C.taupe }}>รวมรายได้ {baht(rentRevenue + sellRevenue)} (เช่า {baht(rentRevenue)} · ขาย {baht(sellRevenue)})</div>
        </Card>
      )}

      {tab === "สตอกสินค้า" && (
        <Card className="p-4">
          <div className="font-bold text-sm mb-3">จำนวนสินค้าตามหมวด (จริง)</div>
          {catReal.length === 0 ? <div className="text-sm text-center py-6" style={{ color: C.taupe }}>ยังไม่มีสินค้า</div> : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={catReal} dataKey="value" nameKey="name" outerRadius={90} label>
                {catReal.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
          )}
        </Card>
      )}

      {tab === "การเงิน" && (
        <Card className="p-4">
          <div className="font-bold text-sm mb-3">รายรับ–รายจ่าย–คงเหลือ (จากบัญชีจริง)</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={finReal}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.taupe }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.taupe }} axisLine={false} tickLine={false} width={55} />
              <Tooltip />
              <Bar dataKey="ยอด" radius={[4, 4, 0, 0]}>
                {finReal.map((e, i) => <Cell key={i} fill={[C.green, C.red, C.gold][i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

/* ============ 10. USER MANAGEMENT ============ */
function UserMan({ users, me, saveEntity, deleteEntity }) {
  const [form, setForm] = useState(null);
  const [del, setDel] = useState(null);
  const perms = {
    "เจ้าของ": "เข้าถึงทุกอย่าง · จัดการผู้ใช้ได้ทั้งหมด",
    "ผู้ดูแลระบบ": "ทำได้ทุกอย่างเหมือนเจ้าของ (ลบบัญชีเจ้าของไม่ได้)",
    "พนักงานขาย": "งานขายหน้าร้าน + จัดการสต็อก (ไม่เห็นบัญชี/รายงาน)",
    "ลูกค้า": "ดูออเดอร์/การเช่าของตัวเอง · ติดตามสถานะ",
  };
  return (
    <div>
      <PageHead title="จัดการผู้ใช้งาน" sub="กำหนดสิทธิ์ตามบทบาท" action={<Btn icon={Plus} onClick={() => setForm({ mode: "add", data: { role: "พนักงานขาย" } })}>เพิ่มผู้ใช้</Btn>} />
      <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mb-5">
        {users.map(u => {
          const Icon = ICONS[u.icon] || Users;
          const isSelf = me && u.email === me.email;
          // ผู้ดูแลระบบยุ่งกับบัญชีเจ้าของไม่ได้ (ทั้งแก้ไข/ลบ)
          const canManage = !(me?.role === "ผู้ดูแลระบบ" && u.role === "เจ้าของ");
          const canDelete = canManage && !isSelf;
          return (
            <Card key={u.email} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: u.color + "22" }}><Icon size={22} style={{ color: u.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{u.name}{isSelf && <span className="ml-1 text-[10px]" style={{ color: C.taupe }}>(คุณ)</span>}</div>
                  <div className="text-xs" style={{ color: C.taupe }}>{u.email}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: u.color + "22", color: u.color }}>{u.role}</span>
                {canManage && <IconBtn icon={Pencil} onClick={() => setForm({ mode: "edit", data: u })} />}
                {canDelete && <IconBtn icon={Trash2} color={C.red} onClick={() => setDel(u)} />}
              </div>
              <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: C.line, color: C.taupe }}>{perms[u.role]}</div>
            </Card>
          );
        })}
      </div>

      {form && (
        <FormModal
          title={form.mode === "add" ? "เพิ่มผู้ใช้" : "แก้ไขผู้ใช้"}
          fields={userFields(form.mode === "edit")}
          initial={form.data}
          onClose={() => setForm(null)}
          onSubmit={async (data) => { await saveEntity("users", data, form.mode === "edit" ? form.data.id : null); setForm(null); }}
        />
      )}
      {del && <ConfirmDelete name={`${del.name} (${del.email})`} onClose={() => setDel(null)} onConfirm={async () => { await deleteEntity("users", del.id); setDel(null); }} />}
      <Card className="p-4">
        <div className="font-bold text-sm mb-3 flex items-center gap-1.5"><Shield size={15} style={{ color: C.gold }} />สิทธิ์การเข้าถึง</div>
        <div className="space-y-2">
          {Object.entries(perms).map(([role, p]) => (
            <div key={role} className="flex items-start gap-2 text-xs">
              <CheckCircle2 size={14} style={{ color: C.green }} className="mt-0.5 shrink-0" />
              <span><b>{role}:</b> <span style={{ color: C.taupe }}>{p}</span></span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
