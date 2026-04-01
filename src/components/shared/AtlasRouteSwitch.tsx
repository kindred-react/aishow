"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function AtlasRouteSwitch({ title }: { title: string }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <header className="hero compact">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="hero-badge" style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}><Sparkles size={14} /> AI Learning Atlas</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.18rem", borderRadius: "999px", background: "rgba(18,28,52,0.68)", border: "1px solid rgba(120,160,255,0.15)" }}>
          <Link href="/atlas" className={`dimension-btn ${pathname === "/atlas" ? "active" : ""}`} style={{ minHeight: "unset", padding: "0.28rem 0.7rem", borderRadius: "999px", textDecoration: "none" }}>{t.pageAtlas}</Link>
          <Link href="/tools" className={`dimension-btn ${pathname === "/tools" ? "active" : ""}`} style={{ minHeight: "unset", padding: "0.28rem 0.7rem", borderRadius: "999px", textDecoration: "none" }}>{t.pageTools}</Link>
        </span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.4 }}>
        {title}
      </motion.h1>
    </header>
  );
}
