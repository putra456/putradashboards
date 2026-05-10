"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "./config-context";
import {
  LogOut, Copy, Download, FileCode2, Check, X, Loader2,
  MessageCircle, ArrowRight, Shield, User, ExternalLink,
  Zap, TrendingUp, Code2, Music, Crown,
} from "lucide-react";

interface UserInfo {
  username: string;
  role: string;
  premium: boolean;
}

export default function HomePage() {
  const { config } = useConfig();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [script, setScript] = useState("");
  const [scriptB64, setScriptB64] = useState("");
  const [loadingScript, setLoadingScript] = useState(false);
  const [tiktokFollowed, setTiktokFollowed] = useState(false);
  const [tiktokOpened, setTiktokOpened] = useState(false);
  const [toast, setToast] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("xau_user");
    if (!stored) { router.push("/"); return; }
    try { setUser(JSON.parse(stored)); } catch { router.push("/"); }
    const followed = localStorage.getItem("xau_tiktok_followed");
    if (followed === "true") setTiktokFollowed(true);
  }, [router]);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg); setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("xau_user");
    router.push("/");
  };

  const handleOpenTiktok = () => {
    window.open(config.links.tiktok, "_blank");
    setTiktokOpened(true);
    setTimeout(() => showToastMsg("Follow dulu, lalu klik Confirm Follow"), 2000);
  };

  const handleConfirmFollow = () => {
    if (!tiktokOpened) { showToastMsg("Buka TikTok dulu dan follow!"); return; }
    setTiktokFollowed(true);
    localStorage.setItem("xau_tiktok_followed", "true");
    showToastMsg("Follow confirmed! Sekarang bisa Get EA");
  };

  const handleGetEA = async () => {
    if (!tiktokFollowed) { showToastMsg("Follow TikTok dulu sebelum Get EA!"); return; }
    setLoadingScript(true);
    try {
      const res = await fetch("/api/script");
      const data = await res.json();
      if (data.script) {
        setScriptB64(data.script);
        setScript(atob(data.script));
        setShowScript(true);
      }
    } catch { showToastMsg("Error loading script"); }
    setLoadingScript(false);
  };

  const handleCopyB64 = async () => {
    try { await navigator.clipboard.writeText(scriptB64); setCopied(true); setTimeout(() => setCopied(false), 2000); showToastMsg("Base64 copied!"); }
    catch { showToastMsg("Copy failed"); }
  };

  const handleDownloadDecoded = () => {
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = config.ea.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToastMsg("File downloaded!");
  };

  const handleGetAccess = () => {
    const msg = encodeURIComponent(config.links.whatsappMessage + " Username: " + (user?.username || "unknown"));
    window.open(`https://wa.me/${config.links.whatsapp}?text=${msg}`, "_blank");
  };

  if (!mounted || !user) return null;
  const site = config.site;
  const home = config.home;

  return (
    <>
      <div className="animate-slide-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))", border: "1px solid rgba(255,255,255,0.12)" }}>
              <img src={site.logo} alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-white leading-tight" style={{ fontSize: "clamp(17px, 4.5vw, 22px)" }}>{site.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.role === "admin" ? <Shield size={11} className="text-amber-400/70" /> : <User size={11} className="text-white/30" />}
                <p className="text-white/35 text-[11px] font-medium capitalize">{user.role} • {user.username}</p>
                {user.premium && <><span className="text-white/10">•</span><Crown size={10} className="text-amber-400/60" /><span className="text-amber-400/60 text-[9px] font-bold">PREMIUM</span></>}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="liquid-btn px-3.5 py-2 text-[11px] font-semibold flex items-center gap-1.5"><LogOut size={13} /><span className="relative z-10 hidden sm:inline">Logout</span></button>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "0.12s", opacity: 0 }}>
        <div className="liquid-glass p-5 sm:p-6 mb-3.5">
          <div className="relative z-10">
            <div className="flex items-start gap-3.5 mb-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.08)" }}>
                <img src={site.logo} alt="Logo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              </div>
              <div className="min-w-0 pt-0.5">
                <h2 className="font-bold text-white" style={{ fontSize: "clamp(15px, 4vw, 20px)" }}>{home.welcomeTitle}, {user.username}</h2>
                <div className="flex items-center gap-1.5 mt-1"><Zap size={11} className="text-amber-400/60" /><p className="text-white/35 text-[11px] sm:text-xs font-medium">{config.ea.name} {config.ea.version}</p></div>
              </div>
            </div>
            <p className="text-white/40 text-[11px] sm:text-xs leading-relaxed">{config.ea.description}</p>
          </div>
        </div>
      </div>

      {home.showTiktokStep && (
        <div className="animate-slide-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          <div className="liquid-glass p-5 sm:p-6 mb-3.5">
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}><Music size={14} className="text-white/50" /></div>
                <h3 className="font-semibold text-white text-sm sm:text-base flex-1">{home.tiktokTitle}</h3>
                {tiktokFollowed && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0" style={{ background: "rgba(52,199,89,0.15)", color: "#34c759", border: "1px solid rgba(52,199,89,0.25)" }}><Check size={10} />Done</span>}
              </div>
              <p className="text-white/35 text-[11px] sm:text-xs mb-4 leading-relaxed">{home.tiktokDesc}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={handleOpenTiktok} className="liquid-btn py-3 px-4 text-xs sm:text-sm font-semibold flex-1 flex items-center justify-center gap-2" style={{ background: tiktokOpened ? "linear-gradient(135deg, rgba(52,199,89,0.15), rgba(52,199,89,0.04))" : undefined }}>
                  <span className="relative z-10 flex items-center gap-2"><ExternalLink size={14} />{tiktokOpened ? "TikTok Opened" : home.tiktokButton}</span>
                </button>
                {tiktokOpened && !tiktokFollowed && (
                  <button onClick={handleConfirmFollow} className="liquid-btn py-3 px-4 text-xs sm:text-sm font-semibold flex-1 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, rgba(52,199,89,0.2), rgba(52,199,89,0.06))", borderColor: "rgba(52,199,89,0.25)" }}>
                    <span className="relative z-10 flex items-center gap-2"><Check size={14} />{home.tiktokConfirmButton}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="animate-slide-up" style={{ animationDelay: "0.28s", opacity: 0 }}>
        <div className="liquid-glass p-5 sm:p-6 mb-3.5">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}><Code2 size={14} className="text-white/50" /></div>
              <h3 className="font-semibold text-white text-sm sm:text-base">{home.scriptTitle}</h3>
            </div>
            <p className="text-white/35 text-[11px] sm:text-xs mb-4 leading-relaxed">{home.scriptDesc}</p>
            <button onClick={handleGetEA} disabled={loadingScript} className="liquid-btn w-full py-3.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2" style={{ background: tiktokFollowed ? "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06))" : "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", opacity: tiktokFollowed ? 1 : 0.5 }}>
              <span className="relative z-10 flex items-center gap-2">
                {loadingScript ? <><Loader2 size={15} className="animate-spin" />Loading...</> : <><FileCode2 size={15} />{home.scriptButton}<ArrowRight size={13} /></>}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showScript && script && (
        <div className="animate-slide-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <div className="liquid-glass p-4 sm:p-6 mb-3.5">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><TrendingUp size={15} className="text-white/40" /><h3 className="font-semibold text-white text-xs sm:text-sm">{config.ea.filename}</h3></div>
                <button onClick={() => setShowScript(false)} className="text-white/25 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/5"><X size={16} /></button>
              </div>
              <pre className="code-block"><code>{script}</code></pre>
              <div className="flex gap-2 mt-4">
                <button onClick={handleCopyB64} className="liquid-btn flex-1 py-3.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2" style={{ background: copied ? "linear-gradient(135deg, rgba(52,199,89,0.2), rgba(52,199,89,0.06))" : "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", borderColor: copied ? "rgba(52,199,89,0.25)" : "rgba(255,255,255,0.15)" }}>
                  <span className="relative z-10 flex items-center gap-2">{copied ? <><Check size={15} />Copied!</> : <><Copy size={14} />Copy Base64</>}</span>
                </button>
                <button onClick={handleDownloadDecoded} className="liquid-btn flex-1 py-3.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
                  <span className="relative z-10 flex items-center gap-2"><Download size={14} />Download .mq4</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="animate-slide-up" style={{ animationDelay: "0.36s", opacity: 0 }}>
        <div className="liquid-glass p-5 sm:p-6 mb-3.5">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.12)" }}><MessageCircle size={14} className="text-emerald-400/70" /></div>
              <h3 className="font-semibold text-white text-sm sm:text-base">{home.accessTitle}</h3>
            </div>
            <p className="text-white/35 text-[11px] sm:text-xs mb-4 leading-relaxed">{home.accessDesc}</p>
            <button onClick={handleGetAccess} className="liquid-btn w-full py-3.5 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, rgba(37,211,102,0.18), rgba(37,211,102,0.05))", borderColor: "rgba(37,211,102,0.2)" }}>
              <span className="relative z-10 flex items-center gap-2"><MessageCircle size={15} />{home.accessButton}<ArrowRight size={13} /></span>
            </button>
          </div>
        </div>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: "0.44s", opacity: 0 }}>
        <div className="text-center py-4"><p className="text-white/12 text-[10px] tracking-wider">{site.copyright}</p></div>
      </div>

      <div className={`toast ${showToast ? "show" : ""}`}>{toast}</div>
    </>
  );
}
