// หน้าสินค้าสาธารณะ — ปลายทางของ QR บนสติกเกอร์ (สแกนแล้วเปิดหน้านี้ได้เลย ไม่ต้องล็อกอิน)
// โชว์เฉพาะข้อมูลที่ให้ลูกค้าเห็นได้ ไม่โชว์ตำแหน่งเก็บ / มูลค่าชุด / หมายเหตุภายใน / จำนวนสตอก
import { prisma } from "@/lib/prisma";
import { currentUser } from '@/lib/session';
import { productMeasurements, rentalPrice } from '@/lib/product-details';
import RentalControls from './rental-controls';
import LineContact from '@/app/shop/line-contact';

export const dynamic = "force-dynamic";

const C = {
  gold: "#D4AF37", goldBg: "#F3E9CC", cream: "#F5F1E8", taupe: "#A8978E",
  charcoal: "#333333", bg: "#FBF9F4", line: "#EAE2D4", green: "#6FA66B",
  greenBg: "#E6F0E4", red: "#C66B6B", redBg: "#F6E4E4",
};

const baht = (n: number) => "฿" + Number(n || 0).toLocaleString("th-TH");

// รูปตำหนิเก็บเป็น JSON array ของ URL (เหมือนใน page.tsx)
function parseUrls(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (!value) return [];
  try {
    const a = JSON.parse(String(value));
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

// รหัสสินค้าที่มี % หรืออักขระแปลกๆ จะทำให้ decodeURIComponent โยน error → กันไว้ไม่ให้หน้าพัง
function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id: safeDecode(id) } });
  return { title: p ? `${p.name} · HONEY STUDIO` : "ไม่พบสินค้า · HONEY STUDIO" };
}

export default async function PublicProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id: safeDecode(id) } });
  const user=await currentUser();
  const isStaff=!!user&&['เจ้าของ','ผู้ดูแลระบบ','พนักงานขาย'].includes(user.role);

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.charcoal, fontFamily: "'Noto Sans Thai', -apple-system, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 460, margin: "0 auto", padding: "20px 16px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <img src="/logo.png" alt="HONEY STUDIO" width={110} height={110} style={{ display: "block", margin: "0 auto 4px", objectFit: "contain" }} />
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, fontFamily: "Georgia, serif" }}>HONEY STUDIO</div>
          <div style={{ fontSize: 12, color: C.taupe }}>ร้านเช่า–ขาย ชุด รองเท้า กระเป๋า</div>
        </div>
        {children}
        {!isStaff&&<LineContact/>}
        <div style={{ textAlign: "center", fontSize: 12, color: C.taupe, marginTop: 22 }}>
          <a href="https://lin.ee/OfHxMgW" target="_blank" rel="noopener noreferrer">สอบถาม / จองทาง LINE</a>
        </div>
      </div>
    </div>
  );

  if (!p) {
    return shell(
      <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>ไม่พบสินค้ารหัสนี้</div>
        <div style={{ fontSize: 13, color: C.taupe }}>
          รหัสที่สแกนมา: <b>{safeDecode(id)}</b>
          <br />อาจถูกลบออกจากระบบแล้ว หรือสติกเกอร์เก่า — รบกวนสอบถามพนักงานได้เลย
        </div>
      </div>
    );
  }

  const defects = parseUrls(p.defects);
  const canRent = (p.type === "เช่า" || p.type === "ทั้งคู่") && (p.stockRent ?? 0) > 0 && !['ซัก','ซ่อม','ปลดสต็อก'].includes(p.status);
  const canSell = (p.type === "ขาย" || p.type === "ทั้งคู่") && (p.stockSell ?? 0) > 0;
  const available = canRent || canSell;
  const specs: [string, string][] = [
    ["ไซส์", p.size], ["สี", p.color],
    ...productMeasurements(p),
  ].filter(([, v]) => v) as [string, string][];

  return shell(
    <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, overflow: "hidden" }}>
      {(p.image || p.imageBack) && (
        <div style={{ display: "flex", gap: 8, padding: 12, background: C.cream, justifyContent: "center" }}>
          {p.image && <img src={p.image} alt={p.name} style={{ width: "48%", maxWidth: 190, aspectRatio: "3/4", objectFit: "cover", borderRadius: 12 }} />}
          {p.imageBack && <img src={p.imageBack} alt={`${p.name} (ด้านหลัง)`} style={{ width: "48%", maxWidth: 190, aspectRatio: "3/4", objectFit: "cover", borderRadius: 12 }} />}
        </div>
      )}

      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.3 }}>{p.name}</div>
            <div style={{ fontSize: 12, color: C.taupe, marginTop: 4 }}>
              รหัส <span style={{ fontFamily: "monospace" }}>{p.id}</span>{p.cat ? ` · ${p.cat}` : ""}
            </div>
          </div>
          <span style={{ whiteSpace: "nowrap", fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, color: available ? C.green : C.red, background: available ? C.greenBg : C.redBg }}>
            {available ? "พร้อมให้บริการ" : "ไม่ว่างตอนนี้"}
          </span>
        </div>

        {(canRent || canSell || p.rent > 0 || p.sell > 0) && (
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            {p.rent > 0 && (
              <div style={{ flex: 1, background: C.goldBg, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "#8a6d1f" }}>ราคาเช่า</div>
                {[1,3,5].map(days=><div key={days}>{days} วัน = {baht(rentalPrice(p,days))}</div>)}
                <div>เพิ่มวัน +50 บาท/วัน</div><div>มัดจำ {baht(p.rent)} (ราคาเช่าวันแรก คงที่ทุกจำนวนวัน)</div>
              </div>
            )}
            {p.sell > 0 && (
              <div style={{ flex: 1, background: C.cream, borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: C.taupe }}>ราคาขาย</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "Georgia, serif" }}>{baht(p.sell)}</div>
              </div>
            )}
          </div>
        )}

        {specs.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 8 }}>ขนาด / รายละเอียด</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {specs.map(([k, v]) => (
                <div key={k} style={{ background: C.cream, borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: C.taupe }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {defects.length > 0 && (
          <>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 18, marginBottom: 6 }}>
              ⚠️ ตำหนิที่แจ้งไว้ ({defects.length} จุด)
            </div>
            <div style={{ fontSize: 12, color: C.taupe, marginBottom: 8 }}>ร้านแจ้งไว้ล่วงหน้าตามจริง ไม่ถือเป็นความเสียหายของผู้เช่า</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {defects.map((u, i) => (
                <img key={i} src={u} alt={`ตำหนิจุดที่ ${i + 1}`} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, border: `1px solid ${C.line}` }} />
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-3 mt-5"><a href={'/shop?view=booking&product='+encodeURIComponent(p.id)} className="shop-button">จองชุดออนไลน์</a><a href={'/shop?view=calendar&product='+encodeURIComponent(p.id)} className="shop-button secondary">ตรวจวันที่ว่าง</a></div>
        {isStaff?<RentalControls product={{id:p.id,rent:p.rent,rentPrices:p.rentPrices,type:p.type}}/>:!user?<a href={`/login?next=${encodeURIComponent('/p/'+encodeURIComponent(p.id))}`} className="block mt-5 underline text-sm">พนักงาน: เข้าสู่ระบบเพื่อเช็คสต๊อก เช่า และคืน</a>:null}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${C.line}`, fontSize: 12, color: C.taupe }}>
          ข้อมูลจากระบบร้าน · สถานะชุด: {p.status}
        </div>
      </div>
    </div>
  );
}
