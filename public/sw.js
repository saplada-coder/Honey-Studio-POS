// Service Worker ของ HONEY STUDIO POS — ทำให้ติดตั้งเป็นแอปได้ + เปิดหน้าเดิมได้ตอนเน็ตหลุด
// หลักการ: ข้อมูล (/api/*) ดึงสดเสมอ · รูป/ไอคอน/ฟอนต์ จำไว้ · หน้าเว็บลองเน็ตก่อน ไม่ได้ค่อยใช้ของเก่า
const CACHE = "honey-studio-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // ข้อมูลจากฐานข้อมูล: ไม่แคชเด็ดขาด (ต้องเห็นของล่าสุดเสมอ)
  if (url.pathname.startsWith("/api/")) return;

  // รูป / ไอคอน / ฟอนต์: ใช้ของที่จำไว้ก่อน (โหลดเร็ว) ถ้าไม่มีค่อยดึงแล้วจำ
  const isAsset = /\.(png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname) || url.hostname.endsWith("gstatic.com") || url.pathname.startsWith("/_next/static/");
  if (isAsset) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const hit = await c.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) c.put(request, res.clone());
        return res;
      })
    );
    return;
  }

  // หน้าเว็บ: ลองเน็ตก่อน ถ้าเน็ตหลุดใช้หน้าที่เคยเปิดล่าสุด
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});
