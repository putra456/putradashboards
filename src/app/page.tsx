"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useConfig } from "./dashboard/config-context";

export default function LoginPage() {
  const { config } = useConfig();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const user = localStorage.getItem("xau_user");
    if (user) router.push("/dashboard");
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      localStorage.setItem("xau_user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  };

  const handleGetAccess = () => {
    const msg = encodeURIComponent(config.links.whatsappMessage);
    window.open(`https://wa.me/${config.links.whatsapp}?text=${msg}`, "_blank");
  };

  if (!mounted) return null;

  const site = config.site;
  const login = config.login;

  return (
    <div className="app-container">
      <div
        className="animate-slide-up w-full"
        style={{ animationDelay: "0.05s", opacity: 0 }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div
            className="relative flex items-center justify-center"
            style={{
              width: "clamp(72px, 22vw, 100px)",
              height: "clamp(72px, 22vw, 100px)",
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)",
                filter: "blur(18px)",
                animation: "pulse-glow 3s ease-in-out infinite",
              }}
            />
            <img
              src={site.logo}
              alt={`${site.name} Logo`}
              className="w-full h-full object-contain relative z-10 rounded-full"
              style={{
                filter: "drop-shadow(0 0 16px rgba(255,255,255,0.12))",
              }}
            />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1
            className="font-bold tracking-tight text-white"
            style={{
              fontSize: "clamp(26px, 6.5vw, 36px)",
              letterSpacing: "-0.03em",
            }}
          >
            {site.name}
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Sparkles size={12} className="text-white/30" />
            <p
              className="text-white/35 font-medium"
              style={{ fontSize: "clamp(11px, 3vw, 14px)" }}
            >
              {site.tagline}
            </p>
            <Sparkles size={12} className="text-white/30" />
          </div>
        </div>

        {/* Login Card */}
        <div className="liquid-glass p-5 sm:p-7">
          <div className="relative z-10">
            <h2
              className="text-white/80 font-semibold mb-5 text-center"
              style={{ fontSize: "clamp(15px, 4vw, 18px)" }}
            >
              Sign In
            </h2>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-white/40 text-[11px] font-semibold mb-1.5 uppercase tracking-widest">
                  Username
                </label>
                <div className="relative flex items-center">
                  <div
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-lg"
                    style={{
                      width: "34px",
                      height: "34px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <User size={15} className="text-white/35" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="liquid-input"
                    style={{ paddingLeft: "48px" }}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/40 text-[11px] font-semibold mb-1.5 uppercase tracking-widest">
                  Password
                </label>
                <div className="relative flex items-center">
                  <div
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-lg"
                    style={{
                      width: "34px",
                      height: "34px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Lock size={15} className="text-white/35" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="liquid-input"
                    style={{ paddingLeft: "48px", paddingRight: "48px" }}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff size={15} className="text-white/30" />
                    ) : (
                      <Eye size={15} className="text-white/30" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-medium"
                  style={{
                    background: "rgba(255,59,48,0.12)",
                    border: "1px solid rgba(255,59,48,0.25)",
                    color: "#ff6b6b",
                  }}
                >
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="liquid-btn w-full py-3.5 text-sm font-semibold mt-1 flex items-center justify-center gap-2"
                style={{
                  background: loading
                    ? "rgba(255,255,255,0.05)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      Sign In
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Get Access Card */}
        {login.showGetAccess && (
          <div
            className="animate-slide-up"
            style={{ animationDelay: "0.25s", opacity: 0 }}
          >
            <div className="liquid-glass p-5 sm:p-6 mt-4">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={18} className="text-emerald-400/70" />
                  <h3 className="text-white/80 font-semibold text-sm">
                    Belum punya akun?
                  </h3>
                </div>
                <p className="text-white/35 text-xs leading-relaxed mb-4">
                  {login.getAccessText}
                </p>
                <button
                  onClick={handleGetAccess}
                  className="liquid-btn w-full py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(37,211,102,0.2), rgba(37,211,102,0.06))",
                    borderColor: "rgba(37,211,102,0.25)",
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <MessageCircle size={16} />
                    {login.getAccessButton}
                    <ArrowRight size={14} />
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-5 mb-2">
          <p className="text-white/15 text-[11px] tracking-wide">
            {site.copyright}
          </p>
        </div>
      </div>
    </div>
  );
}
