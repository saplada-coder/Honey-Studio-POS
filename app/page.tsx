"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Shirt, Boxes, Users, ShoppingBag, Truck, CalendarDays,
  Wallet, BarChart3, UserCog, Menu, X, Search, Plus, Bell, QrCode, Printer,
  ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, Package, ChevronRight, Filter, Download, LayoutGrid,
  List, Calendar as CalIcon, Crown, Shield, Tag, Phone,
  MapPin, Eye, Coins
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

/* ============ THEME ============ */
const C = {
  gold: "#D4AF37", goldSoft: "#E6D49B", goldBg: "#F3E9CC",
  cream: "#F5F1E8", rose: "#D8B4B8", roseBg: "#F4E7E8",
  taupe: "#A8978E", taupeBg: "#ECE6E1", charcoal: "#333333",
  bg: "#FBF9F4", line: "#EAE2D4", green: "#6FA66B", greenBg: "#E6F0E4",
  blue: "#7C93B8", blueBg: "#E6EBF3", red: "#C66B6B", redBg: "#F6E4E4",
};
const baht = (n) => "฿" + Number(n || 0).toLocaleString("th-TH");

// แผนที่ไอคอนของผู้ใช้ (ฐานข้อมูลเก็บเป็นชื่อ string)
const ICONS = { Crown, Shield, UserCog, Users };

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
  "ว่าง": [C.green, C.greenBg], "ถูกเช่า": [C.gold, C.goldBg], "ซ่อม": [C.red, C.redBg],
  "จองแล้ว": [C.rose, C.roseBg], "รับ/ส่งแล้ว": [C.blue, C.blueBg],
  "กำลังใช้งาน": [C.gold, C.goldBg], "คืนแล้ว": [C.green, C.greenBg], "เกินกำหนด": [C.red, C.redBg],
  "รอชำระ": [C.taupe, C.taupeBg], "เตรียมของ": [C.rose, C.roseBg], "กำลังจัดส่ง": [C.blue, C.blueBg],
  "สำเร็จ": [C.green, C.greenBg], "ส่งสำเร็จ": [C.green, C.greenBg], "รอสร้างเลข": [C.taupe, C.taupeBg],
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
const Btn = ({ children, onClick, variant = "solid", icon: Icon, size = "md" }) => {
  const base = "inline-flex items-center gap-1.5 rounded-xl font-medium transition active:scale-95 " + (size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm");
  const styles = variant === "solid"
    ? { background: C.gold, color: "#fff" }
    : variant === "ghost"
    ? { background: C.cream, color: C.charcoal }
    : { background: "#fff", color: C.charcoal, border: "1px solid " + C.line };
  return <button onClick={onClick} className={base} style={styles}>{Icon && <Icon size={16} />}{children}</button>;
};

/* ============ NAV CONFIG ============ */
const NAV = [
  { id: "dash", label: "แดชบอร์ด", icon: LayoutDashboard },
  { id: "products", label: "สินค้า", icon: Shirt },
  { id: "inventory", label: "คลังสินค้า", icon: Boxes },
  { id: "customers", label: "ลูกค้า", icon: Users },
  { id: "orders", label: "คำสั่งซื้อ", icon: ShoppingBag },
  { id: "shipping", label: "การจัดส่ง", icon: Truck },
  { id: "rentals", label: "การเช่า", icon: CalendarDays },
  { id: "accounting", label: "บัญชีรับจ่าย", icon: Wallet },
  { id: "reports", label: "รายงาน", icon: BarChart3 },
  { id: "userman", label: "จัดการผู้ใช้", icon: UserCog },
];

/* ============ MAIN APP ============ */
export default function App() {
  const [page, setPage] = useState("dash");
  const [mobile, setMobile] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [txns, setTxns] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [users, setUsers] = useState([]);

  const [qrItem, setQrItem] = useState(null);
  const [receipt, setReceipt] = useState(null);

  // โหลดข้อมูลทั้งหมดจากฐานข้อมูล
  async function loadAll() {
    try {
      const [p, c, o, r, t, s, u] = await Promise.all([
        fetch("/api/products").then((x) => x.json()),
        fetch("/api/customers").then((x) => x.json()),
        fetch("/api/orders").then((x) => x.json()),
        fetch("/api/rentals").then((x) => x.json()),
        fetch("/api/transactions").then((x) => x.json()),
        fetch("/api/shipments").then((x) => x.json()),
        fetch("/api/users").then((x) => x.json()),
      ]);
      setProducts(p); setCustomers(c); setOrders(o); setRentals(r);
      setTxns(t); setShipments(s); setUsers(u);
    } catch (e) {
      console.error("โหลดข้อมูลไม่สำเร็จ", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const f = () => setMobile(window.innerWidth < 768);
    f(); window.addEventListener("resize", f);
    // โหลดฟอนต์ไทย + เซอริฟ
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

  // ปรับสตอกสินค้า (บันทึกลงฐานข้อมูล)
  const toggleStock = async (id, delta) => {
    const cur = products.find((x) => x.id === id);
    if (!cur) return;
    const stock = Math.max(0, cur.stock + delta);
    const status = stock <= 0 ? "ถูกเช่า" : cur.status;
    setProducts((p) => p.map((x) => (x.id === id ? { ...x, stock, status } : x))); // อัปเดตจอทันที
    await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock, status }),
    });
  };

  // เลื่อนสถานะการเช่า (บันทึกลงฐานข้อมูล)
  const advanceRental = async (id) => {
    const order = ["จองแล้ว", "รับ/ส่งแล้ว", "กำลังใช้งาน", "คืนแล้ว"];
    const cur = rentals.find((x) => x.id === id);
    if (!cur) return;
    const i = order.indexOf(cur.status);
    if (i < 0 || i >= order.length - 1) return;
    const status = order[i + 1];
    setRentals((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    await fetch(`/api/rentals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  // สร้างเลขแทร็กกิ้ง (บันทึกลงฐานข้อมูล)
  const makeTrack = async (id) => {
    const track = "TH" + Math.floor(Math.random() * 900000000 + 100000000);
    const status = "กำลังจัดส่ง";
    setShipments((s) => s.map((x) => (x.id === id ? { ...x, track, status } : x)));
    await fetch(`/api/shipments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track, status }),
    });
  };

  const ctx = {
    products, customers, orders, rentals, txns, shipments, users,
    toggleStock, advanceRental, makeTrack, setQrItem, setReceipt, mobile,
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
      {/* DESKTOP SIDEBAR */}
      {!mobile && (
        <aside className="w-64 shrink-0 border-r flex flex-col sticky top-0 h-screen" style={{ background: "#fff", borderColor: C.line }}>
          <Brand />
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {NAV.map(n => <NavItem key={n.id} n={n} active={page === n.id} onClick={() => go(n.id)} />)}
          </nav>
          <div className="p-3 border-t" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: C.cream }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold" style={{ background: C.gold }}>H</div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">คุณฮันนี่</div>
                <div className="text-xs" style={{ color: C.taupe }}>เจ้าของร้าน</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* MOBILE TOP */}
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
          {page === "products" && <Products {...ctx} />}
          {page === "inventory" && <Inventory {...ctx} />}
          {page === "customers" && <Customers {...ctx} />}
          {page === "orders" && <Orders {...ctx} />}
          {page === "shipping" && <Shipping {...ctx} />}
          {page === "rentals" && <Rentals {...ctx} />}
          {page === "accounting" && <Accounting {...ctx} />}
          {page === "reports" && <Reports {...ctx} />}
          {page === "userman" && <UserMan {...ctx} />}
        </main>

        {/* MOBILE BOTTOM NAV */}
        {mobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-30 border-t flex" style={{ background: "#fff", borderColor: C.line }}>
            {[NAV[0], NAV[6], NAV[4], NAV[1]].map(n => (
              <button key={n.id} onClick={() => go(n.id)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5" style={{ color: page === n.id ? C.gold : C.taupe }}>
                <n.icon size={20} /><span className="text-[10px]">{n.label}</span>
              </button>
            ))}
            <button onClick={() => setMoreOpen(true)} className="flex-1 flex flex-col items-center gap-0.5 py-2.5" style={{ color: C.taupe }}>
              <Menu size={20} /><span className="text-[10px]">เพิ่มเติม</span>
            </button>
          </nav>
        )}

        {/* MOBILE MORE SHEET */}
        {mobile && moreOpen && (
          <div className="fixed inset-0 z-40 flex items-end" style={{ background: "rgba(0,0,0,.4)" }} onClick={() => setMoreOpen(false)}>
            <div className="w-full rounded-t-3xl p-5 pb-8" style={{ background: "#fff" }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">เมนูทั้งหมด</span>
                <button onClick={() => setMoreOpen(false)}><X size={22} /></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {NAV.map(n => (
                  <button key={n.id} onClick={() => go(n.id)} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl" style={{ background: page === n.id ? C.goldBg : C.cream }}>
                    <n.icon size={22} style={{ color: page === n.id ? C.gold : C.charcoal }} />
                    <span className="text-[11px] text-center" style={{ color: C.charcoal }}>{n.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR MODAL */}
      {qrItem && (
        <Modal onClose={() => setQrItem(null)} title="QR สินค้า">
          <div className="flex flex-col items-center gap-3 py-2">
            <QR value={qrItem.id} size={160} />
            <div className="text-center">
              <div className="font-bold">{qrItem.name}</div>
              <div className="text-sm" style={{ color: C.taupe }}>รหัส: {qrItem.id} · {qrItem.loc}</div>
            </div>
            <div className="flex gap-2 w-full">
              <Btn icon={Printer} variant="outline">พิมพ์สติกเกอร์</Btn>
              <Btn icon={Download}>ดาวน์โหลด</Btn>
            </div>
            <p className="text-xs text-center" style={{ color: C.taupe }}>สแกนเพื่อเช็ก / คืน / เช็กสถานะเช่ากี้</p>
          </div>
        </Modal>
      )}

      {/* RECEIPT MODAL */}
      {receipt && <Receipt o={receipt} onClose={() => setReceipt(null)} />}
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
            {rentals.filter(r => ["กำลังใช้งาน", "เกินกำหนด", "รับ/ส่งแล้ว"].includes(r.status)).map(r => (
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
            {products.filter(p => p.stock <= 1).map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: p.stock === 0 ? C.redBg : C.cream }}>
                <Package size={18} style={{ color: p.stock === 0 ? C.red : C.taupe }} />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs" style={{ color: C.taupe }}>{p.id} · {p.loc}</div></div>
                <span className="text-sm font-bold" style={{ color: p.stock === 0 ? C.red : C.gold }}>{p.stock} ชิ้น</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============ 2. PRODUCTS ============ */
function Products({ products, toggleStock, setQrItem }) {
  const [q, setQ] = useState("");
  const list = products.filter(p => p.name.includes(q) || p.id.includes(q));
  return (
    <div>
      <PageHead title="สินค้า" sub={`ทั้งหมด ${products.length} รายการ · มี QR ติดทุกตัว`} action={<Btn icon={Plus}>เพิ่มสินค้า</Btn>} />
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 rounded-xl border" style={{ background: "#fff", borderColor: C.line }}>
          <Search size={18} style={{ color: C.taupe }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ค้นหาชื่อ / รหัสสินค้า" className="flex-1 py-2.5 text-sm outline-none bg-transparent" />
        </div>
        <Btn variant="outline" icon={Filter}>กรอง</Btn>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {list.map(p => (
          <Card key={p.id} className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.cream }}>
                <Shirt size={24} style={{ color: C.taupe }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-snug">{p.name}</div>
                <div className="text-xs mt-0.5" style={{ color: C.taupe }}>{p.id}</div>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.goldBg, color: "#8a6d1f" }}>{p.type}</span>
              </div>
              <button onClick={() => setQrItem(p)} className="shrink-0 p-1.5 rounded-lg" style={{ background: C.cream }}><QrCode size={18} style={{ color: C.charcoal }} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="p-2 rounded-lg" style={{ background: C.cream }}><div style={{ color: C.taupe }}>ค่าเช่า</div><div className="font-bold">{p.rent ? baht(p.rent) : "—"}</div></div>
              <div className="p-2 rounded-lg" style={{ background: C.cream }}><div style={{ color: C.taupe }}>ราคาขาย</div><div className="font-bold">{p.sell ? baht(p.sell) : "—"}</div></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge s={p.status} />
                <span className="text-xs" style={{ color: C.taupe }}>สตอก {p.stock}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleStock(p.id, -1)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: C.roseBg, color: C.charcoal }}>เบิก</button>
                <button onClick={() => toggleStock(p.id, 1)} className="px-2.5 py-1.5 rounded-lg text-xs font-medium" style={{ background: C.greenBg, color: C.charcoal }}>คืน</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============ 3. INVENTORY ============ */
function Inventory({ products }) {
  const cats = [...new Set(products.map(p => p.cat))];
  const total = products.reduce((s, p) => s + p.stock, 0);
  return (
    <div>
      <PageHead title="คลังสินค้า" sub={`รวม ${total} ชิ้น · ${cats.length} หมวดหมู่`} action={<Btn icon={Download} variant="outline">ส่งออก</Btn>} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[["สินค้าทั้งหมด", products.length, C.gold], ["พร้อมให้เช่า", products.filter(p => p.status === "ว่าง").length, C.green], ["ต้องเติม", products.filter(p => p.stock <= 1).length, C.red]].map(([l, v, c]) => (
          <Card key={l} className="p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: c, fontFamily: "Georgia,serif" }}>{v}</div>
            <div className="text-xs mt-1" style={{ color: C.taupe }}>{l}</div>
          </Card>
        ))}
      </div>
      {cats.map(cat => (
        <div key={cat} className="mb-5">
          <div className="flex items-center gap-2 mb-2"><Tag size={15} style={{ color: C.gold }} /><span className="font-bold text-sm">{cat}</span></div>
          <Card className="overflow-hidden">
            {products.filter(p => p.cat === cat).map((p, i, arr) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
                <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.name}</div><div className="text-xs flex items-center gap-1" style={{ color: C.taupe }}><MapPin size={11} />{p.loc} · {p.id}</div></div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: p.stock <= 1 ? C.red : C.charcoal }}>{p.stock} ชิ้น</div>
                  {p.stock <= 1 && <div className="text-[10px]" style={{ color: C.red }}>ใกล้หมด</div>}
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
function Customers({ customers, orders }) {
  const [sel, setSel] = useState(null);
  return (
    <div>
      <PageHead title="ลูกค้า" sub={`${customers.length} รายชื่อ`} action={<Btn icon={Plus}>เพิ่มลูกค้า</Btn>} />
      <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
        {customers.map(c => (
          <Card key={c.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: C.rose }}>{c.name.replace("คุณ", "")[0]}</div>
              <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{c.name}</div><div className="text-xs" style={{ color: C.taupe }}>{c.id}</div></div>
              <button onClick={() => setSel(c)} className="p-1.5 rounded-lg" style={{ background: C.cream }}><Eye size={16} /></button>
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
    </div>
  );
}

/* ============ 5. ORDERS ============ */
function Orders({ orders, setReceipt }) {
  const [tab, setTab] = useState("ทั้งหมด");
  const tabs = ["ทั้งหมด", "เช่า", "ขาย"];
  const list = orders.filter(o => tab === "ทั้งหมด" || o.type === tab);
  return (
    <div>
      <PageHead title="คำสั่งซื้อ" sub="รวมการเช่าและการขาย" action={<Btn icon={Plus}>สร้างคำสั่งซื้อ</Btn>} />
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: tab === t ? C.gold : "#fff", color: tab === t ? "#fff" : C.charcoal, border: "1px solid " + (tab === t ? C.gold : C.line) }}>{t}</button>
        ))}
      </div>
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
            <button onClick={() => setReceipt(o)} className="p-2 rounded-lg shrink-0" style={{ background: C.cream }}><Printer size={16} /></button>
          </div>
        ))}
      </Card>
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
function Shipping({ shipments, makeTrack }) {
  const carriers = ["Kerry", "Flash", "ไปรษณีย์ไทย", "J&T"];
  return (
    <div>
      <PageHead title="การจัดส่ง" sub="สร้างเลขแทร็กกิ้ง · ติดตามสถานะ" action={<Btn icon={Plus}>สร้างใบส่ง</Btn>} />
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
    </div>
  );
}

/* ============ 7. RENTALS ============ */
function Rentals({ rentals, advanceRental }) {
  const [view, setView] = useState("board");
  const statuses = ["จองแล้ว", "รับ/ส่งแล้ว", "กำลังใช้งาน", "คืนแล้ว", "เกินกำหนด"];
  const views = [["board", "บอร์ด", LayoutGrid], ["calendar", "ปฏิทิน", CalIcon], ["list", "รายการ", List]];
  return (
    <div>
      <PageHead title="การเช่า" sub={`${rentals.length} รายการเช่า`} action={<Btn icon={Plus}>จองชุด</Btn>} />
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
            const items = rentals.filter(r => r.status === st);
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
                      <div className="text-sm font-medium leading-snug">{r.item}</div>
                      <div className="text-xs mt-1" style={{ color: C.taupe }}>{r.cust}</div>
                      <div className="flex items-center gap-1 text-xs mt-1.5" style={{ color: C.taupe }}><Clock size={11} />{r.start} → {r.end}</div>
                      {!["คืนแล้ว", "เกินกำหนด"].includes(r.status) && (
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
          {rentals.map((r, i, arr) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid " + C.line : "none" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.cream }}><Shirt size={16} style={{ color: C.taupe }} /></div>
              <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{r.item}</div><div className="text-xs" style={{ color: C.taupe }}>{r.id} · {r.cust} · {r.start}→{r.end}</div></div>
              <Badge s={r.status} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function RentalCalendar({ rentals }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const firstDow = 6;
  const evMap = { 16: ["จองแล้ว"], 15: ["รับ/ส่งแล้ว"], 13: ["กำลังใช้งาน"], 10: ["คืนแล้ว"], 8: ["เกินกำหนด"], 17: ["จองแล้ว"] };
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
        {["จองแล้ว", "รับ/ส่งแล้ว", "กำลังใช้งาน", "คืนแล้ว", "เกินกำหนด"].map(s => { const [fg] = statusColor(s); return <span key={s} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: fg }} />{s}</span>; })}
      </div>
    </Card>
  );
}

/* ============ 8. ACCOUNTING ============ */
function Accounting({ txns }) {
  const inSum = txns.filter(t => t.type === "in").reduce((s, t) => s + t.amt, 0);
  const outSum = txns.filter(t => t.type === "out").reduce((s, t) => s + t.amt, 0);
  return (
    <div>
      <PageHead title="บัญชีรับจ่าย" sub="รายรับ–รายจ่าย · บันทึกรายรับอัตโนมัติจากเช่า+ขาย" action={<Btn icon={Plus}>เพิ่มรายการ</Btn>} />
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
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ============ 9. REPORTS ============ */
function Reports() {
  const [tab, setTab] = useState("ยอดขาย");
  const tabs = [["ยอดขาย", BarChart3], ["สตอกสินค้า", Boxes], ["การเงิน", Wallet]];
  const finData = [{ m: "ม.ค.", in: 42000, out: 31000 }, { m: "ก.พ.", in: 51000, out: 33000 }, { m: "มี.ค.", in: 48000, out: 35000 }, { m: "เม.ย.", in: 67000, out: 38000 }, { m: "พ.ค.", in: 72000, out: 41000 }, { m: "มิ.ย.", in: 58000, out: 36000 }];
  return (
    <div>
      <PageHead title="รายงาน" sub="วิเคราะห์ยอดขาย สตอก และการเงิน" action={<Btn icon={Download} variant="outline">ส่งออก Excel</Btn>} />
      <div className="flex gap-2 mb-4">
        {tabs.map(([t, Icon]) => (
          <button key={t} onClick={() => setTab(t)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium" style={{ background: tab === t ? C.gold : "#fff", color: tab === t ? "#fff" : C.charcoal, border: "1px solid " + (tab === t ? C.gold : C.line) }}><Icon size={15} />{t}</button>
        ))}
      </div>

      {tab === "ยอดขาย" && (
        <Card className="p-4">
          <div className="font-bold text-sm mb-3">ยอดเช่า vs ขาย รายสัปดาห์</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="d" tick={{ fontSize: 12, fill: C.taupe }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.taupe }} axisLine={false} tickLine={false} width={40} />
              <Tooltip /><Legend />
              <Bar dataKey="เช่า" fill={C.gold} radius={[4, 4, 0, 0]} />
              <Bar dataKey="ขาย" fill={C.rose} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab === "สตอกสินค้า" && (
        <Card className="p-4">
          <div className="font-bold text-sm mb-3">สินค้าตามหมวด (สัดส่วน)</div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={catData} dataKey="value" outerRadius={90} label>
                {catData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {tab === "การเงิน" && (
        <Card className="p-4">
          <div className="font-bold text-sm mb-3">รายรับ–รายจ่าย 6 เดือน</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={finData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 12, fill: C.taupe }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.taupe }} axisLine={false} tickLine={false} width={45} />
              <Tooltip /><Legend />
              <Bar dataKey="in" name="รายรับ" fill={C.green} radius={[4, 4, 0, 0]} />
              <Bar dataKey="out" name="รายจ่าย" fill={C.taupe} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

/* ============ 10. USER MANAGEMENT ============ */
function UserMan({ users }) {
  const perms = {
    "เจ้าของ": "เข้าถึงทุกอย่าง · ดูบัญชี+รายงานทั้งหมด",
    "ผู้ดูแลระบบ": "จัดการสินค้า ออเดอร์ ลูกค้า · ตั้งค่าระบบ",
    "พนักงานขาย": "สร้างออเดอร์ จัดส่ง · ดูสินค้า (ไม่เห็นบัญชี)",
    "ลูกค้า": "ดูออเดอร์/การเช่าของตัวเอง · ติดตามสถานะ",
  };
  return (
    <div>
      <PageHead title="จัดการผู้ใช้งาน" sub="กำหนดสิทธิ์ตามบทบาท" action={<Btn icon={Plus}>เพิ่มผู้ใช้</Btn>} />
      <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mb-5">
        {users.map(u => {
          const Icon = ICONS[u.icon] || Users;
          return (
            <Card key={u.email} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: u.color + "22" }}><Icon size={22} style={{ color: u.color }} /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{u.name}</div>
                  <div className="text-xs" style={{ color: C.taupe }}>{u.email}</div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: u.color + "22", color: u.color }}>{u.role}</span>
              </div>
              <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: C.line, color: C.taupe }}>{perms[u.role]}</div>
            </Card>
          );
        })}
      </div>
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
