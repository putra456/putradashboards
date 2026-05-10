"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "../config-context";
import { Clock, Check, Sparkles, ArrowUpCircle, Bug, Shield } from "lucide-react";

const typeConfig = {
  feat: { icon: <Sparkles size={11} />, label: "New", color: "#34c759", bg: "rgba(52,199,89,0.12)" },
  fix: { icon: <Bug size={11} />, label: "Fix", color: "#ff9500", bg: "rgba(255,149,0,0.12)" },
  imp: { icon: <ArrowUpCircle size={11} />, label: "Imp", color: "#5ac8fa", bg: "rgba(90,200,250,0.12)" },
  sec: { icon: <Shield size={11} />, label: "Sec", color: "#af52de", bg: "rgba(175,82,222,0.12)" },
};

export default function UpdatesPage() {
  const { config } = useConfig();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("xau_user");
    if (!stored) router.push("/");
  }, [router]);

  if (!mounted) return null;
  const updates = config.updates;
  const site = config.site;

  return (
    <>
      <div className="animate-slide-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Clock size={15} className="text-white/50" />
          </div>
          <h1 className="font-bold text-white" style={{ fontSize: "clamp(17px, 4.5vw, 22px)" }}>Updates</h1>
        </div>
      </div>

      <div className="animate-slide-up mb-4" style={{ animationDelay: "0.1s", opacity: 0 }}>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-fit" style={{ background: "rgba(52,199,89,0.1)", border: "1px solid rgba(52,199,89,0.2)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "#34c759", boxShadow: "0 0 8px rgba(52,199,89,0.5)" }} />
          <span className="text-[#34c759] text-[11px] font-semibold">Latest: {updates[0]?.version} — {updates[0]?.date}</span>
        </div>
      </div>

      <div className="space-y-3">
        {updates.map((update, idx) => (
          <div key={idx} className="animate-slide-up" style={{ animationDelay: `${0.15 + idx * 0.06}s`, opacity: 0 }}>
            <div className="liquid-glass p-4 sm:p-5">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-white/80 font-bold text-sm">{update.version}</span>
                    {idx === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(52,199,89,0.2)", color: "#34c759" }}>LATEST</span>}
                  </div>
                  <span className="text-white/25 text-[11px] font-medium">{update.date}</span>
                </div>
                <div className="space-y-2">
                  {update.changes.map((change, cidx) => {
                    const cfg = typeConfig[change.type];
                    return (
                      <div key={cidx} className="flex items-start gap-2.5 py-1.5">
                        <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}{cfg.label}</span>
                        <span className="text-white/50 text-[11px] sm:text-xs leading-relaxed">{change.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-5 mt-2"><p className="text-white/12 text-[10px] tracking-wider">{site.copyright}</p></div>
    </>
  );
}
