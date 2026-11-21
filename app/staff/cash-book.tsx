"use client";

import { useEffect, useState } from 'react';

type Entry = { id: string; date: string; desc: string; type: string; amt: number };
const money = (amount: number) => amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());

export default function CashBook() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{date: string; desc: string; type: string; amt: string} | null>(null);
  async function load() {
    const response = await fetch('/api/cash-book', { cache: 'no-store' });
    if (!response.ok) throw new Error('โหลดสมุดเงินสดไม่สำเร็จ กรุณาลองอีกครั้ง');
    setEntries(await response.json());
    setReady(true);
  }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  const incoming = entries.filter(e => e.type === 'in').reduce((s, e) => s + Math.round(e.amt * 100), 0) / 100;
  const outgoing = entries.filter(e => e.type === 'out').reduce((s, e) => s + Math.round(e.amt * 100), 0) / 100;
  async function remove(entry: Entry) {
    if (!window.confirm(`ลบบันทึก ${entry.desc} ${money(entry.amt)} บาท?`)) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/cash-book/${encodeURIComponent(entry.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('ลบบันทึกไม่สำเร็จ');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
    finally { setSaving(false); }
  }
  return <section className="rounded-2xl border border-amber-200 bg-white p-4 mb-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-bold text-lg">สมุดเงินสดที่ร้าน</h2><p className="text-sm text-stone-500">บันทึกเงินสดแยกจากบัญชีรายรับรายจ่าย · ยอดสะสมทุกเดือน</p></div>
      <button disabled={!ready || saving} className="rounded-xl bg-amber-100 px-4 py-2 font-medium disabled:opacity-50" onClick={() => setForm({ date: today(), desc: '', type: 'in', amt: '' })}>บันทึกเงินสด</button>
    </div>
    {error && <p role="alert" className="text-red-700 my-3">{error} <button className="underline" onClick={() => { setError(''); load().catch(e => setError(e.message)); }}>ลองโหลดใหม่</button></p>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
      {[['เงินสดรับเข้า', incoming], ['เงินสดจ่ายออก / นำออก', outgoing], ['เงินสดคงเหลือที่ร้าน', (Math.round(incoming * 100) - Math.round(outgoing * 100)) / 100]].map(([label, value]) => <div key={label} className="rounded-xl bg-amber-50 p-3"><p className="text-sm text-stone-600">{label}</p><p className="text-xl font-bold mt-1">{ready ? `${money(Number(value))} บาท` : 'กำลังโหลด…'}</p></div>)}
    </div>
    <p className="text-sm text-stone-500 mb-3">เริ่มใช้ครั้งแรก ให้บันทึกเงินสดที่มีอยู่เป็น “เงินเข้า” รายละเอียด “ยอดยกมา” · เงินนำฝากธนาคารให้บันทึกเป็น “เงินออก”</p>
    {form && <form className="grid sm:grid-cols-2 gap-3 rounded-xl border p-3 mb-4" onSubmit={async e => {
      e.preventDefault(); setSaving(true); setError('');
      try {
        const response = await fetch('/api/cash-book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amt: Number(form.amt) }) });
        if (!response.ok) throw new Error((await response.json()).error || 'บันทึกไม่สำเร็จ');
        setForm(null); await load();
      } catch (e) { setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'); }
      finally { setSaving(false); }
    }}>
      <label className="text-sm">วันที่<input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="block w-full rounded-lg border p-2 mt-1" /></label>
      <label className="text-sm">ประเภท<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="block w-full rounded-lg border p-2 mt-1"><option value="in">เงินเข้า</option><option value="out">เงินออก / นำฝากธนาคาร</option></select></label>
      <label className="text-sm">รายละเอียด<input required value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="เช่น รับเงินสดจากลูกค้า / ยอดยกมา" className="block w-full rounded-lg border p-2 mt-1" /></label>
      <label className="text-sm">จำนวนเงิน (บาท)<input required type="number" min="0.01" step="0.01" value={form.amt} onChange={e => setForm({ ...form, amt: e.target.value })} className="block w-full rounded-lg border p-2 mt-1" /></label>
      <div className="flex gap-3"><button disabled={saving} className="rounded-lg bg-amber-100 px-4 py-2">{saving ? 'กำลังบันทึก…' : 'บันทึก'}</button><button type="button" disabled={saving} onClick={() => setForm(null)}>ยกเลิก</button></div>
    </form>}
    {ready && entries.length === 0 && <p className="text-sm py-3 text-stone-500">ยังไม่มีบันทึกเงินสด</p>}
    {entries.length > 0 && <details><summary className="cursor-pointer text-sm font-medium">ประวัติเงินสด ({entries.length} รายการ)</summary><div className="overflow-x-auto mt-2"><table className="w-full text-sm"><thead><tr className="text-left"><th className="py-2">วันที่</th><th>รายละเอียด</th><th className="text-right">เงินเข้า</th><th className="text-right">เงินออก</th><th><span className="sr-only">จัดการ</span></th></tr></thead><tbody>{entries.map(entry => <tr key={entry.id} className="border-t"><td className="py-3 whitespace-nowrap">{entry.date}</td><td className="px-2">{entry.desc}</td><td className="text-right text-green-700">{entry.type === 'in' ? money(entry.amt) : '—'}</td><td className="text-right text-red-700">{entry.type === 'out' ? money(entry.amt) : '—'}</td><td className="pl-3"><button disabled={saving} onClick={() => remove(entry)} className="text-stone-500">ลบ</button></td></tr>)}</tbody></table></div></details>}
  </section>;
}
