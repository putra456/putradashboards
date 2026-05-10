"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "../config-context";
import {
  User, Shield, LogOut, Check, Music, FileCode2,
  MessageCircle, ChevronRight, Crown, KeyRound,
} from "lucide-react";

interface UserInfo {
  username: string;
  role: string;
  premium: boolean;
}

export default function ProfilePage() {
  const { config } = useConfig();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tiktokFollowed, setTiktokFollowed] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapTimer = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("xau_user");
    if (!stored) { router.push("/"); return; }
    try { setUser(JSON.parse(stored)); } catch { router.push("/"); }
    const followed = localStorage.getItem("xau_tiktok_followed");
    if (followed === "true") setTiktokFollowed(true);
  }, [router]);

  const handleAvatarTap = () => {
    if (!user || user.role !== "admin") return;
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (newCount >= 2) { setTapCount(0); router.push("/dashboard/admin"); return; }
    tapTimer.current = setTimeout(() => setTapCount(0), 500);
  };

  const handleLogout = () => {
    localStorage.removeItem("xau_user");
    localStorage.removeItem("xau_tiktok_followed");
    router.push("/");
  };

  if (!mounted || !user) return null;
  const site = config.site;

  const menuItems = [
    { icon: <User size={15} />, label: "Username", value: user.username, color: "rgba(255,255,255,0.4)" },
    { icon: <Shield size={15} />, label: "Role", value: user.role.charAt(0).toUpperCase() + user.role.slice(1), color: user.role === "admin" ? "rgba(255,193,7,0.6)" : "rgba(255,255,255,0.4)" },
    { icon: user.premium ? <Crown size={15} /> : <User size={15} />, label: "Status", value: user.premium ? "Premium" : "Regular", color: user.premium ? "#ffc107" : "rgba(255,255,255,0.4)" },
    { icon: <Music size={15} />, label: "TikTok Follow", value: tiktokFollowed ? "Followed" : "Not Followed", color: tiktokFollowed ? "#34c759" : "#ff6b6b" },
    { icon: <FileCode2 size={15} />, label: "Scripts Access", value: user.premium ? "Full Access" : "Limited", color: user.premium ? "#34c759" : "rgba(255,255,255,0.4)" },
  ];

  return (
    <>
      <div className="animate-slide-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <User size={15} className="text-white/50" />
          </div>
          <h1 className="font-bold text-white" style={{ fontSize: "clamp(17px, 4.5vw, 22px)" }}>Profile</h1>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
        <div className="liquid-glass p-5 sm:p-6 mb-3.5">
          <div className="relative z-10 flex flex-col items-center text-center">
            <button onClick={handleAvatarTap} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden flex items-center justify-center mb-3 transition-transform active:scale-95" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.1)" }}>
              <img src={site.logo} alt="Avatar" className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
              {user.role === "admin" && (
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,193,7,0.2)", border: "1px solid rgba(255,193,7,0.3)" }}>
                  <KeyRound size={10} className="text-amber-400" />
                </div>
              )}
            </button>
            <h2 className="text-white font-bold text-base sm:text-lg">{user.username}</h2>
            <div className="flex items-center gap-2 mt-1">
              {user.role === "admin" ? <Shield size={12} className="text-amber-400/70" /> : <User size={12} className="text-white/30" />}
              <span className="text-white/35 text-xs font-medium capitalize">{user.role}</span>
              {user.premium && <><span className="text-white/10">•</span><Crown size={11} className="text-amber-400/60" /><span className="text-amber-400/60 text-[10px] font-bold">PREMIUM</span></>}
            </div>
            {user.role === "admin" && <p className="text-white/15 text-[9px] mt-2">Double-tap avatar for Admin Panel</p>}
          </div>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "0.18s", opacity: 0 }}>
        <div className="liquid-glass p-4 sm:p-5 mb-3.5">
          <div className="relative z-10">
            <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-3">Account Info</h3>
            <div className="space-y-1">
              {menuItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-2.5"><span style={{ color: item.color }}>{item.icon}</span><span className="text-white/40 text-[11px] sm:text-xs">{item.label}</span></div>
                  <span className="text-[11px] sm:text-xs font-semibold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "0.26s", opacity: 0 }}>
        <div className="liquid-glass p-4 sm:p-5 mb-3.5">
          <div className="relative z-10">
            <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={() => router.push("/dashboard")} className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2.5"><FileCode2 size={15} className="text-white/35" /><span className="text-white/50 text-[11px] sm:text-xs">Get EA Script</span></div>
                <ChevronRight size={14} className="text-white/20" />
              </button>
              <button onClick={() => window.open(config.links.tiktok, "_blank")} className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2.5"><Music size={15} className="text-white/35" /><span className="text-white/50 text-[11px] sm:text-xs">Follow TikTok</span></div>
                <ChevronRight size={14} className="text-white/20" />
              </button>
              <button onClick={() => { const msg = encodeURIComponent(config.links.whatsappMessage + " Username: " + user.username); window.open(`https://wa.me/${config.links.whatsapp}?text=${msg}`, "_blank"); }} className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="flex items-center gap-2.5"><MessageCircle size={15} className="text-emerald-400/50" /><span className="text-white/50 text-[11px] sm:text-xs">Contact Owner</span></div>
                <ChevronRight size={14} className="text-white/20" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "0.34s", opacity: 0 }}>
        <button onClick={handleLogout} className="liquid-btn w-full py-3.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, rgba(255,59,48,0.15), rgba(255,59,48,0.04))", borderColor: "rgba(255,59,48,0.2)" }}>
          <span className="relative z-10 flex items-center gap-2"><LogOut size={15} />Logout</span>
        </button>
      </div>

      <div className="text-center py-5 mt-2"><p className="text-white/12 text-[10px] tracking-wider">{site.copyright}</p></div>
    </>
  );
}
