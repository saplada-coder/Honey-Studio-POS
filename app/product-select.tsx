"use client";

import { useId, useRef, useState } from "react";

type Product = { id: string; name: string; stockRent: number; stockSell: number };
const label = (p: Product) => `${p.id} — ${p.name} (เช่า ${p.stockRent}/ขาย ${p.stockSell})`;

export default function ProductSelect({ value, onChange, products, required, title }: {
  value: string; onChange: (id: string) => void; products: Product[]; required?: boolean; title: string;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const selected = products.find(p => p.id === value);
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = products.filter(p => terms.every(term => `${p.id} ${p.name}`.toLocaleLowerCase().includes(term)));

  function choose(id: string) {
    input.current?.setCustomValidity(required && !id ? "กรุณาเลือกชุดจากรายการ" : "");
    onChange(id);
    setOpen(false);
    setQuery("");
    setActive(-1);
  }

  return <div className="relative mt-1">
    <div className="flex items-center rounded-xl border bg-white" style={{ borderColor: "#EAE2D4" }}>
      <input ref={input} role="combobox" aria-label={title} aria-expanded={open}
        aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off" placeholder="พิมพ์รหัสหรือชื่อชุดเพื่อค้นหา"
        value={open ? query : selected ? label(selected) : value || ""}
        required={required} className="w-full min-w-0 py-2.5 px-3 text-sm rounded-xl outline-none"
        onFocus={() => { setOpen(true); setQuery(""); setActive(-1); }}
        onClick={() => { if (!open) { setOpen(true); setQuery(""); setActive(-1); } }}
        onBlur={() => { setOpen(false); setQuery(""); setActive(-1); }}
        onChange={e => {
          e.target.setCustomValidity(required && !value && e.target.value ? "กรุณาเลือกชุดจากรายการ" : "");
          setQuery(e.target.value); setOpen(true); setActive(-1);
        }}
        onKeyDown={e => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault(); setOpen(true);
            const next = matches.length ? (e.key === "ArrowDown" ? Math.min(active + 1, matches.length - 1) : active < 0 ? matches.length - 1 : Math.max(0, active - 1)) : -1;
            setActive(next);
            requestAnimationFrame(() => document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" }));
          } else if (e.key === "Enter" && open) {
            e.preventDefault();
            const product = matches[active] || (matches.length === 1 ? matches[0] : undefined);
            if (product) choose(product.id);
          } else if (e.key === "Escape" && open) {
            e.preventDefault(); e.stopPropagation(); setOpen(false); setQuery("");
          }
        }} />
      {value && <button type="button" aria-label="ล้างชุดที่เลือก" className="px-3 py-2 text-sm"
        onMouseDown={e => e.preventDefault()} onClick={() => choose("")}>×</button>}
    </div>
    {open && <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border bg-white shadow-lg"
      style={{ borderColor: "#EAE2D4" }} id={listId} role="listbox" aria-label={title}>
      {matches.length ? matches.map((p, index) => <div key={p.id} id={`${listId}-${index}`}
        role="option" aria-selected={p.id === value}
        className="px-3 py-2.5 text-sm cursor-pointer"
        style={{ background: active === index ? "#F3E9CC" : p.id === value ? "#F5F1E8" : undefined }}
        onMouseEnter={() => setActive(index)} onMouseDown={e => e.preventDefault()}
        onClick={() => choose(p.id)}>{label(p)}</div>)
        : <div role="status" className="px-3 py-3 text-sm" style={{ color: "#A8978E" }}>ไม่พบชุดที่ค้นหา</div>}
    </div>}
  </div>;
}
