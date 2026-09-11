import type { MetadataRoute } from "next";

// ไฟล์บอกมือถือว่าเว็บนี้ "ติดตั้งเป็นแอป" ได้ (Next.js เสิร์ฟที่ /manifest.webmanifest)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HONEY STUDIO POS",
    short_name: "Honey Studio",
    description: "ระบบจัดการร้านเช่า–ขายชุด HONEY STUDIO",
    lang: "th",
    start_url: "/",
    display: "standalone", // เปิดเต็มจอ ไม่มีแถบเบราว์เซอร์
    orientation: "portrait",
    background_color: "#FBF9F4",
    theme_color: "#D4AF37",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
