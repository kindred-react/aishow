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
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="hero-badge flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2"><Sparkles size={14} /> AI Learning Atlas</span>
        <span className="inline-flex items-center gap-2 p-1 rounded-full bg-[rgba(18,28,52,0.68)] border border-[rgba(120,160,255,0.15)]">
          <Link href="/atlas" className={`dimension-btn ${pathname === "/atlas" ? "active" : ""} min-h-0 py-1 px-[0.7rem] rounded-full no-underline`}>{t.pageAtlas}</Link>
          <Link href="/tools" className={`dimension-btn ${pathname === "/tools" ? "active" : ""} min-h-0 py-1 px-[0.7rem] rounded-full no-underline`}>{t.pageTools}</Link>
        </span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.4 }}>
        {title}
      </motion.h1>
    </header>
  );
}
