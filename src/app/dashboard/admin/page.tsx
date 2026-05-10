"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Users, Plus, Trash2, X, Crown, User,
  ArrowLeft, Loader2, AlertCircle, Settings,
  Layout, Eye, LogOut, Save, Globe, Palette, Link as LinkIcon,
  Type, Code, Smartphone, FileText, Sparkles,
  Upload, MoveUp, MoveDown, Wand2,
} from "lucide-react";
import { useConfig } from "../config-context";
import type { AppConfig } from "../config-context";

interface UserItem {
  username: string;
  password: string;
  role: string;
  premium: boolean;
}

type AdminTab = "site" | "content" | "nav" | "about" | "updates" | "scripts" | "upload" | "projects" | "visibility" | "users" | "exit";

export default function AdminPage() {
  const { config, refresh } = useConfig();
  const [mounted, setMounted] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("site");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [editConfig, setEditConfig] = useState<AppConfig>(config);
  const router = useRouter();

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  // AI changelog state
  const [aiScriptContent, setAiScriptContent] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{
    version: string;
    date: string;
    changes: { type: "feat" | "fix" | "imp" | "sec"; text: string }[];
  } | null>(null);

  const currentUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("xau_user") || "{}")
    : {};

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("xau_user");
    if (!stored) { router.push("/"); return; }
    try {
      const u = JSON.parse(stored);
      if (u.role !== "admin") { router.push("/dashboard/profile"); return; }
    } catch { router.push("/"); }
    fetchUsers();
  }, [router]);

  useEffect(() => { setEditConfig(config); }, [config]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {}
    setLoadingUsers(false);
  };

  const handleSave = async () => {
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: editConfig }),
      });
      const data = await res.json();
      if (data.success) { setSaveMsg("Saved!"); refresh(); setTimeout(() => setSaveMsg(""), 2000); }
      else setSaveMsg(data.error || "Save failed");
    } catch { setSaveMsg("Connection error"); }
    setSaving(false);
  };

  const updateField = (path: string, value: unknown) => {
    setEditConfig((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let target: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]] as Record<string, unknown>;
      target[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const getValue = (path: string): unknown => {
    const keys = path.split(".");
    let target: Record<string, unknown> = editConfig as unknown as Record<string, unknown>;
    for (const k of keys) target = target[k] as Record<string, unknown>;
    return target;
  };

  const addItem = (path: string, item: unknown) => {
    const arr = [...(getValue(path) as unknown[]), item];
    updateField(path, arr);
  };
  const removeItem = (path: string, idx: number) => {
    const arr = [...(getValue(path) as unknown[])];
    arr.splice(idx, 1);
    updateField(path, arr);
  };
  const updateItem = (path: string, idx: number, key: string, value: unknown) => {
    const arr = [...(getValue(path) as Record<string, unknown>[])];
    arr[idx] = { ...arr[idx], [key]: value };
    updateField(path, arr);
  };
  const moveItem = (path: string, idx: number, dir: -1 | 1) => {
    const arr = [...(getValue(path) as unknown[])];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    updateField(path, arr);
  };

  // Upload handler
  const handleUpload = async () => {
    if (!uploadFile) { setUploadMsg("Select a file first"); return; }
    setUploading(true); setUploadMsg("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) { setUploadMsg(`Uploaded: ${data.filename}`); setUploadFile(null); }
      else setUploadMsg(data.error || "Upload failed");
    } catch { setUploadMsg("Upload error"); }
    setUploading(false);
  };

  // AI Changelog handler
  const handleAiChangelog = async () => {
    if (!aiScriptContent.trim()) { setError("Paste script content first"); return; }
    setAiGenerating(true); setError("");
    try {
      const res = await fetch("/api/ai/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptContent: aiScriptContent }),
      });
      const data = await res.json();
      if (data.changelog) { setAiResult(data.changelog); }
      else setError(data.error || "AI failed");
    } catch { setError("AI connection error"); }
    setAiGenerating(false);
  };

  const applyAiChangelog = () => {
    if (!aiResult) return;
    addItem("updates", aiResult);
    setAiResult(null);
    setAiScriptContent("");
    setSaveMsg("Changelog added! Click Save to persist.");
  };

  const handleDeleteUser = async (username: string) => {
    if (!confirm(`Delete "${username}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users?username=${username}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchUsers();
      else setError(data.error || "Failed");
    } catch { setError("Failed"); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const body = {
      username: fd.get("username") as string,
      password: fd.get("password") as string,
      role: fd.get("role") as string,
      premium: fd.get("premium") === "on",
    };
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) { form.reset(); fetchUsers(); }
      else setError(data.error || "Failed");
    } catch { setError("Failed"); }
  };

  if (!mounted) return null;

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "site", label: "Site", icon: <Settings size={14} /> },
    { key: "content", label: "Content", icon: <Type size={14} /> },
    { key: "nav", label: "Nav", icon: <Layout size={14} /> },
    { key: "about", label: "About", icon: <FileText size={14} /> },
    { key: "updates", label: "Updates", icon: <Sparkles size={14} /> },
    { key: "scripts", label: "Scripts", icon: <Code size={14} /> },
    { key: "upload", label: "Upload", icon: <Upload size={14} /> },
    { key: "projects", label: "Projects", icon: <Smartphone size={14} /> },
    { key: "visibility", label: "Visibility", icon: <Eye size={14} /> },
    { key: "users", label: "Users", icon: <Users size={14} /> },
    { key: "exit", label: "Exit", icon: <LogOut size={14} /> },
  ];

  return (
    <>
      {/* Header */}
      <div className="animate-slide-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <button onClick={() => router.push("/dashboard/profile")} className="liquid-btn p-2"><ArrowLeft size={16} /></button>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.15)" }}>
              <Shield size={15} className="text-amber-400/70" />
            </div>
            <div>
              <h1 className="font-bold text-white leading-tight" style={{ fontSize: "clamp(17px, 4.5vw, 22px)" }}>{config.admin.title}</h1>
              <p className="text-white/25 text-[10px]">Full CMS Control</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="liquid-btn px-3 py-2 text-[11px] font-semibold flex items-center gap-1.5">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            <span className="relative z-10">{saving ? "Saving..." : "Save"}</span>
          </button>
        </div>
        {saveMsg && (
          <div className={`text-[11px] font-medium mb-3 px-3 py-2 rounded-xl ${saveMsg.includes("Saved") || saveMsg.includes("added") ? "text-emerald-400" : "text-red-400"}`}
            style={{ background: saveMsg.includes("Saved") || saveMsg.includes("added") ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)", border: `1px solid ${saveMsg.includes("Saved") || saveMsg.includes("added") ? "rgba(52,199,89,0.2)" : "rgba(255,59,48,0.2)"}` }}>
            {saveMsg}
          </div>
        )}
      </div>

      {/* Admin Nav */}
      <div className="animate-slide-up mb-4" style={{ animationDelay: "0.1s", opacity: 0 }}>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => t.key === "exit" ? router.push("/dashboard/profile") : setActiveTab(t.key)}
              className="liquid-btn px-3 py-2 text-[11px] font-semibold flex items-center gap-1.5 flex-shrink-0"
              style={{ background: activeTab === t.key ? "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))" : undefined, borderColor: activeTab === t.key ? "rgba(255,255,255,0.25)" : undefined }}>
              <span className="relative z-10 flex items-center gap-1.5">{t.icon}{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== SITE TAB ===== */}
      {activeTab === "site" && (
        <div className="space-y-3">
          <SectionCard title="Site Info" icon={<Globe size={14} />}>
            <Input label="Name" value={editConfig.site.name} onChange={(v) => updateField("site.name", v)} />
            <Input label="Tagline" value={editConfig.site.tagline} onChange={(v) => updateField("site.tagline", v)} />
            <Input label="Favicon URL" value={editConfig.site.favicon} onChange={(v) => updateField("site.favicon", v)} />
            <Input label="Logo URL" value={editConfig.site.logo} onChange={(v) => updateField("site.logo", v)} />
            <Input label="Copyright" value={editConfig.site.copyright} onChange={(v) => updateField("site.copyright", v)} />
          </SectionCard>
          <SectionCard title="Colors" icon={<Palette size={14} />}>
            <ColorInput label="Primary" value={editConfig.colors.primary} onChange={(v) => updateField("colors.primary", v)} />
            <ColorInput label="Accent" value={editConfig.colors.accent} onChange={(v) => updateField("colors.accent", v)} />
            <ColorInput label="Danger" value={editConfig.colors.danger} onChange={(v) => updateField("colors.danger", v)} />
            <ColorInput label="Warning" value={editConfig.colors.warning} onChange={(v) => updateField("colors.warning", v)} />
            <ColorInput label="Info" value={editConfig.colors.info} onChange={(v) => updateField("colors.info", v)} />
          </SectionCard>
          <SectionCard title="Links" icon={<LinkIcon size={14} />}>
            <Input label="TikTok URL" value={editConfig.links.tiktok} onChange={(v) => updateField("links.tiktok", v)} />
            <Input label="WhatsApp Number" value={editConfig.links.whatsapp} onChange={(v) => updateField("links.whatsapp", v)} />
            <TextArea label="WhatsApp Message" value={editConfig.links.whatsappMessage} onChange={(v) => updateField("links.whatsappMessage", v)} />
          </SectionCard>
          <SectionCard title="EA Info" icon={<Code size={14} />}>
            <Input label="EA Name" value={editConfig.ea.name} onChange={(v) => updateField("ea.name", v)} />
            <Input label="Version" value={editConfig.ea.version} onChange={(v) => updateField("ea.version", v)} />
            <Input label="Filename" value={editConfig.ea.filename} onChange={(v) => updateField("ea.filename", v)} />
            <TextArea label="Description" value={editConfig.ea.description} onChange={(v) => updateField("ea.description", v)} />
          </SectionCard>
        </div>
      )}

      {/* ===== CONTENT TAB ===== */}
      {activeTab === "content" && (
        <div className="space-y-3">
          <SectionCard title="Login Page" icon={<LogOut size={14} />}>
            <Input label="Title" value={editConfig.login.title} onChange={(v) => updateField("login.title", v)} />
            <Input label="Subtitle" value={editConfig.login.subtitle} onChange={(v) => updateField("login.subtitle", v)} />
            <Toggle label="Show Get Access Card" value={editConfig.login.showGetAccess} onChange={(v) => updateField("login.showGetAccess", v)} />
            <TextArea label="Get Access Text" value={editConfig.login.getAccessText} onChange={(v) => updateField("login.getAccessText", v)} />
            <Input label="Get Access Button Text" value={editConfig.login.getAccessButton} onChange={(v) => updateField("login.getAccessButton", v)} />
          </SectionCard>
          <SectionCard title="Home Page" icon={<Smartphone size={14} />}>
            <Input label="Welcome Title" value={editConfig.home.welcomeTitle} onChange={(v) => updateField("home.welcomeTitle", v)} />
            <Toggle label="Show TikTok Step" value={editConfig.home.showTiktokStep} onChange={(v) => updateField("home.showTiktokStep", v)} />
            <Input label="TikTok Title" value={editConfig.home.tiktokTitle} onChange={(v) => updateField("home.tiktokTitle", v)} />
            <TextArea label="TikTok Description" value={editConfig.home.tiktokDesc} onChange={(v) => updateField("home.tiktokDesc", v)} />
            <Input label="TikTok Button" value={editConfig.home.tiktokButton} onChange={(v) => updateField("home.tiktokButton", v)} />
            <Input label="Confirm Button" value={editConfig.home.tiktokConfirmButton} onChange={(v) => updateField("home.tiktokConfirmButton", v)} />
            <Input label="Script Title" value={editConfig.home.scriptTitle} onChange={(v) => updateField("home.scriptTitle", v)} />
            <TextArea label="Script Description" value={editConfig.home.scriptDesc} onChange={(v) => updateField("home.scriptDesc", v)} />
            <Input label="Script Button" value={editConfig.home.scriptButton} onChange={(v) => updateField("home.scriptButton", v)} />
            <Input label="Access Title" value={editConfig.home.accessTitle} onChange={(v) => updateField("home.accessTitle", v)} />
            <TextArea label="Access Description" value={editConfig.home.accessDesc} onChange={(v) => updateField("home.accessDesc", v)} />
            <Input label="Access Button" value={editConfig.home.accessButton} onChange={(v) => updateField("home.accessButton", v)} />
          </SectionCard>
          <SectionCard title="Admin Panel" icon={<Shield size={14} />}>
            <Input label="Title" value={editConfig.admin.title} onChange={(v) => updateField("admin.title", v)} />
            <Input label="Subtitle" value={editConfig.admin.subtitle} onChange={(v) => updateField("admin.subtitle", v)} />
            <Toggle label="Show User List" value={editConfig.admin.showUserList} onChange={(v) => updateField("admin.showUserList", v)} />
            <Toggle label="Show Add User" value={editConfig.admin.showAddUser} onChange={(v) => updateField("admin.showAddUser", v)} />
            <Toggle label="Show Delete User" value={editConfig.admin.showDeleteUser} onChange={(v) => updateField("admin.showDeleteUser", v)} />
            <Toggle label="Show Stats" value={editConfig.admin.showStats} onChange={(v) => updateField("admin.showStats", v)} />
          </SectionCard>
        </div>
      )}

      {/* ===== NAV TAB ===== */}
      {activeTab === "nav" && (
        <div className="space-y-3">
          <SectionCard title="Navigation Items" icon={<Layout size={14} />}>
            {editConfig.nav.items.map((item, idx) => (
              <div key={idx} className="liquid-glass p-3 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/60 text-xs font-semibold flex-1">Nav {idx + 1}</span>
                  <button onClick={() => moveItem("nav.items", idx, -1)} className="p-1 text-white/30 hover:text-white/60"><MoveUp size={14} /></button>
                  <button onClick={() => moveItem("nav.items", idx, 1)} className="p-1 text-white/30 hover:text-white/60"><MoveDown size={14} /></button>
                  <button onClick={() => removeItem("nav.items", idx)} className="p-1 text-white/30 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input value={item.label} onChange={(e) => updateItem("nav.items", idx, "label", e.target.value)} className="liquid-input text-xs" placeholder="Label" />
                  <input value={item.icon} onChange={(e) => updateItem("nav.items", idx, "icon", e.target.value)} className="liquid-input text-xs" placeholder="Icon" />
                  <input value={item.key} onChange={(e) => updateItem("nav.items", idx, "key", e.target.value)} className="liquid-input text-xs" placeholder="Path" />
                </div>
              </div>
            ))}
            <button onClick={() => addItem("nav.items", { key: "/dashboard/new", label: "New", icon: "Circle" })} className="liquid-btn w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2">
              <Plus size={14} /> Add Nav Item
            </button>
          </SectionCard>
          <SectionCard title="Center Button" icon={<Smartphone size={14} />}>
            <Input label="Label" value={editConfig.nav.centerButton.label} onChange={(v) => updateField("nav.centerButton.label", v)} />
            <Input label="Badge" value={editConfig.nav.centerButton.badge} onChange={(v) => updateField("nav.centerButton.badge", v)} />
            <Input label="Icon" value={editConfig.nav.centerButton.icon} onChange={(v) => updateField("nav.centerButton.icon", v)} />
            <Input label="URL" value={editConfig.nav.centerButton.url} onChange={(v) => updateField("nav.centerButton.url", v)} />
          </SectionCard>
        </div>
      )}

      {/* ===== ABOUT TAB ===== */}
      {activeTab === "about" && (
        <div className="space-y-3">
          <SectionCard title="About Info" icon={<FileText size={14} />}>
            <Input label="Title" value={editConfig.about.title} onChange={(v) => updateField("about.title", v)} />
            <Input label="Dev Name" value={editConfig.about.devName} onChange={(v) => updateField("about.devName", v)} />
            <Input label="Dev Subtitle" value={editConfig.about.devSubtitle} onChange={(v) => updateField("about.devSubtitle", v)} />
            <TextArea label="Description" value={editConfig.about.description} onChange={(v) => updateField("about.description", v)} />
          </SectionCard>
          <SectionCard title="Tags" icon={<Type size={14} />}>
            <div className="flex flex-wrap gap-2 mb-2">
              {editConfig.about.tags.map((tag, idx) => (
                <span key={idx} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  {tag}
                  <button onClick={() => { const arr = [...editConfig.about.tags]; arr.splice(idx, 1); updateField("about.tags", arr); }} className="text-white/30 hover:text-red-400"><X size={10} /></button>
                </span>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); const input = (e.target as HTMLFormElement).elements.namedItem("tag") as HTMLInputElement; if (input.value.trim()) { updateField("about.tags", [...editConfig.about.tags, input.value.trim()]); input.value = ""; } }} className="flex gap-2">
              <input name="tag" placeholder="New tag..." className="liquid-input text-xs flex-1" />
              <button type="submit" className="liquid-btn px-3 py-2 text-xs"><Plus size={14} /></button>
            </form>
          </SectionCard>
          <SectionCard title="Features" icon={<Sparkles size={14} />}>
            {editConfig.about.features.map((f, idx) => (
              <div key={idx} className="liquid-glass p-3 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/60 text-xs font-semibold flex-1">Feature {idx + 1}</span>
                  <button onClick={() => moveItem("about.features", idx, -1)} className="p-1 text-white/30 hover:text-white/60"><MoveUp size={14} /></button>
                  <button onClick={() => moveItem("about.features", idx, 1)} className="p-1 text-white/30 hover:text-white/60"><MoveDown size={14} /></button>
                  <button onClick={() => removeItem("about.features", idx)} className="p-1 text-white/30 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
                <div className="space-y-2">
                  <input value={f.icon} onChange={(e) => updateItem("about.features", idx, "icon", e.target.value)} className="liquid-input text-xs" placeholder="Icon name (e.g. Zap)" />
                  <input value={f.title} onChange={(e) => updateItem("about.features", idx, "title", e.target.value)} className="liquid-input text-xs" placeholder="Title" />
                  <input value={f.desc} onChange={(e) => updateItem("about.features", idx, "desc", e.target.value)} className="liquid-input text-xs" placeholder="Description" />
                </div>
              </div>
            ))}
            <button onClick={() => addItem("about.features", { icon: "Zap", title: "New Feature", desc: "Description here" })} className="liquid-btn w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2">
              <Plus size={14} /> Add Feature
            </button>
          </SectionCard>
          <SectionCard title="Tech Stack" icon={<Code size={14} />}>
            {editConfig.about.techStack.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input value={item.label} onChange={(e) => updateItem("about.techStack", idx, "label", e.target.value)} className="liquid-input text-xs flex-1" placeholder="Label" />
                <input value={item.value} onChange={(e) => updateItem("about.techStack", idx, "value", e.target.value)} className="liquid-input text-xs flex-1" placeholder="Value" />
                <button onClick={() => removeItem("about.techStack", idx)} className="p-1.5 text-white/30 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            ))}
            <button onClick={() => addItem("about.techStack", { label: "New", value: "Value" })} className="liquid-btn w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2">
              <Plus size={14} /> Add Tech Stack
            </button>
          </SectionCard>
        </div>
      )}

      {/* ===== UPDATES TAB ===== */}
      {activeTab === "updates" && (
        <div className="space-y-3">
          <SectionCard title="Changelog Entries" icon={<Sparkles size={14} />}>
            {editConfig.updates.map((update, idx) => (
              <div key={idx} className="liquid-glass p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/60 text-xs font-semibold flex-1">{update.version} — {update.date}</span>
                  <button onClick={() => moveItem("updates", idx, -1)} className="p-1 text-white/30 hover:text-white/60"><MoveUp size={14} /></button>
                  <button onClick={() => moveItem("updates", idx, 1)} className="p-1 text-white/30 hover:text-white/60"><MoveDown size={14} /></button>
                  <button onClick={() => removeItem("updates", idx)} className="p-1 text-white/30 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input value={update.version} onChange={(e) => updateItem("updates", idx, "version", e.target.value)} className="liquid-input text-xs" placeholder="Version" />
                  <input value={update.date} onChange={(e) => updateItem("updates", idx, "date", e.target.value)} className="liquid-input text-xs" placeholder="Date" />
                </div>
                <div className="space-y-1.5">
                  {update.changes.map((change, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-2">
                      <select value={change.type} onChange={(e) => { const arr = [...update.changes]; arr[cIdx] = { ...arr[cIdx], type: e.target.value as "feat" | "fix" | "imp" | "sec" }; updateItem("updates", idx, "changes", arr); }} className="liquid-input text-xs w-20 flex-shrink-0" style={{ appearance: "auto" }}>
                        <option value="feat">New</option>
                        <option value="fix">Fix</option>
                        <option value="imp">Imp</option>
                        <option value="sec">Sec</option>
                      </select>
                      <input value={change.text} onChange={(e) => { const arr = [...update.changes]; arr[cIdx] = { ...arr[cIdx], text: e.target.value }; updateItem("updates", idx, "changes", arr); }} className="liquid-input text-xs flex-1" placeholder="Change description" />
                      <button onClick={() => { const arr = [...update.changes]; arr.splice(cIdx, 1); updateItem("updates", idx, "changes", arr); }} className="p-1 text-white/30 hover:text-red-400"><X size={14} /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => { const arr = [...update.changes, { type: "feat", text: "" }]; updateItem("updates", idx, "changes", arr); }} className="liquid-btn w-full py-2 mt-2 text-[10px] font-semibold flex items-center justify-center gap-1">
                  <Plus size={12} /> Add Change
                </button>
              </div>
            ))}
            <button onClick={() => addItem("updates", { date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), version: "v" + (editConfig.updates.length > 0 ? (parseFloat(editConfig.updates[0].version.replace("v", "")) + 0.1).toFixed(1) : "1.0"), changes: [{ type: "feat", text: "" }] })} className="liquid-btn w-full py-3 text-xs font-semibold flex items-center justify-center gap-2">
              <Plus size={14} /> Add New Version
            </button>
          </SectionCard>
        </div>
      )}

      {/* ===== SCRIPTS TAB ===== */}
      {activeTab === "scripts" && (
        <div className="space-y-3">
          <SectionCard title="EA Scripts" icon={<Code size={14} />}>
            {editConfig.scripts.map((script, idx) => (
              <div key={idx} className="liquid-glass p-3 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/60 text-xs font-semibold flex-1">{script.name}</span>
                  <button onClick={() => moveItem("scripts", idx, -1)} className="p-1 text-white/30 hover:text-white/60"><MoveUp size={14} /></button>
                  <button onClick={() => moveItem("scripts", idx, 1)} className="p-1 text-white/30 hover:text-white/60"><MoveDown size={14} /></button>
                  <button onClick={() => removeItem("scripts", idx)} className="p-1 text-white/30 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
                <div className="space-y-2">
                  <input value={script.name} onChange={(e) => updateItem("scripts", idx, "name", e.target.value)} className="liquid-input text-xs" placeholder="Script name" />
                  <input value={script.version} onChange={(e) => updateItem("scripts", idx, "version", e.target.value)} className="liquid-input text-xs" placeholder="Version" />
                  <input value={script.desc} onChange={(e) => updateItem("scripts", idx, "desc", e.target.value)} className="liquid-input text-xs" placeholder="Description" />
                  <input value={script.file} onChange={(e) => updateItem("scripts", idx, "file", e.target.value)} className="liquid-input text-xs" placeholder="Filename" />
                  <select value={script.status} onChange={(e) => updateItem("scripts", idx, "status", e.target.value)} className="liquid-input text-xs" style={{ appearance: "auto" }}>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
            ))}
            <button onClick={() => addItem("scripts", { name: "New Script", version: "v1.0", desc: "Description", status: "free", file: "NewScript.mq4" })} className="liquid-btn w-full py-3 text-xs font-semibold flex items-center justify-center gap-2">
              <Plus size={14} /> Add Script
            </button>
          </SectionCard>
        </div>
      )}

      {/* ===== UPLOAD TAB ===== */}
      {activeTab === "upload" && (
        <div className="space-y-3">
          <SectionCard title="Upload EA Script" icon={<Upload size={14} />}>
            <div className="space-y-3">
              <div
                className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}
              >
                <Upload size={24} className="text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-xs mb-1">Drag & drop .mq4 file here</p>
                <p className="text-white/20 text-[10px]">or</p>
                <label className="liquid-btn px-4 py-2 text-xs font-semibold mt-2 inline-block cursor-pointer">
                  <span className="relative z-10">Choose File</span>
                  <input type="file" accept=".mq4" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setUploadFile(f); }} />
                </label>
              </div>
              {uploadFile && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <FileText size={14} className="text-white/40" />
                  <span className="text-white/60 text-xs flex-1">{uploadFile.name}</span>
                  <span className="text-white/25 text-[10px]">{(uploadFile.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
              <button onClick={handleUpload} disabled={!uploadFile || uploading} className="liquid-btn w-full py-3 text-xs font-semibold flex items-center justify-center gap-2">
                <span className="relative z-10 flex items-center gap-2">
                  {uploading ? <><Loader2 size={14} className="animate-spin" />Uploading...</> : <><Upload size={14} />Upload to Server</>}
                </span>
              </button>
              {uploadMsg && (
                <div className={`text-[11px] font-medium px-3 py-2 rounded-xl ${uploadMsg.includes("Uploaded") ? "text-emerald-400" : "text-red-400"}`}
                  style={{ background: uploadMsg.includes("Uploaded") ? "rgba(52,199,89,0.1)" : "rgba(255,59,48,0.1)", border: `1px solid ${uploadMsg.includes("Uploaded") ? "rgba(52,199,89,0.2)" : "rgba(255,59,48,0.2)"}` }}>
                  {uploadMsg}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="AI Auto Changelog" icon={<Wand2 size={14} />}>
            <div className="space-y-3">
              <p className="text-white/35 text-[11px] leading-relaxed">Paste your MQL4 script content below and AI will automatically generate a changelog entry based on the script's features.</p>
              <textarea
                value={aiScriptContent}
                onChange={(e) => setAiScriptContent(e.target.value)}
                placeholder="Paste your .mq4 script content here..."
                rows={8}
                className="liquid-input text-xs resize-none font-mono"
              />
              <button onClick={handleAiChangelog} disabled={aiGenerating || !aiScriptContent.trim()} className="liquid-btn w-full py-3 text-xs font-semibold flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, rgba(175,82,222,0.2), rgba(175,82,222,0.06))", borderColor: "rgba(175,82,222,0.25)" }}>
                <span className="relative z-10 flex items-center gap-2">
                  {aiGenerating ? <><Loader2 size={14} className="animate-spin" />Generating...</> : <><Wand2 size={14} />Generate Changelog with AI</>}
                </span>
              </button>
              {error && (
                <div className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs" style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)", color: "#ff6b6b" }}>
                  <AlertCircle size={13} />{error}
                </div>
              )}
              {aiResult && (
                <div className="liquid-glass p-3">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-xs font-semibold">{aiResult.version} — {aiResult.date}</span>
                      <button onClick={() => setAiResult(null)} className="p-1 text-white/30 hover:text-red-400"><X size={14} /></button>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {aiResult.changes.map((change, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-2">
                          <span className="flex-shrink-0 flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5"
                            style={{
                              background: change.type === "feat" ? "rgba(52,199,89,0.12)" : change.type === "fix" ? "rgba(255,149,0,0.12)" : change.type === "imp" ? "rgba(90,200,250,0.12)" : "rgba(175,82,222,0.12)",
                              color: change.type === "feat" ? "#34c759" : change.type === "fix" ? "#ff9500" : change.type === "imp" ? "#5ac8fa" : "#af52de",
                            }}>
                            {change.type === "feat" ? "New" : change.type === "fix" ? "Fix" : change.type === "imp" ? "Imp" : "Sec"}
                          </span>
                          <span className="text-white/50 text-[11px]">{change.text}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={applyAiChangelog} className="liquid-btn w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg, rgba(52,199,89,0.2), rgba(52,199,89,0.06))", borderColor: "rgba(52,199,89,0.25)" }}>
                      <span className="relative z-10 flex items-center gap-2"><Plus size={14} />Add to Changelog</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ===== PROJECTS TAB ===== */}
      {activeTab === "projects" && (
        <div className="space-y-3">
          <SectionCard title="Other Projects" icon={<Smartphone size={14} />}>
            {editConfig.projects.map((project, idx) => (
              <div key={idx} className="liquid-glass p-3 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white/60 text-xs font-semibold flex-1">{project.name}</span>
                  <button onClick={() => moveItem("projects", idx, -1)} className="p-1 text-white/30 hover:text-white/60"><MoveUp size={14} /></button>
                  <button onClick={() => moveItem("projects", idx, 1)} className="p-1 text-white/30 hover:text-white/60"><MoveDown size={14} /></button>
                  <button onClick={() => removeItem("projects", idx)} className="p-1 text-white/30 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
                <div className="space-y-2">
                  <input value={project.name} onChange={(e) => updateItem("projects", idx, "name", e.target.value)} className="liquid-input text-xs" placeholder="Project name" />
                  <input value={project.desc} onChange={(e) => updateItem("projects", idx, "desc", e.target.value)} className="liquid-input text-xs" placeholder="Description" />
                  <input value={project.icon} onChange={(e) => updateItem("projects", idx, "icon", e.target.value)} className="liquid-input text-xs" placeholder="Icon (e.g. Zap)" />
                  <input value={project.url || ""} onChange={(e) => updateItem("projects", idx, "url", e.target.value || undefined)} className="liquid-input text-xs" placeholder="Visit URL (external link)" />
                  <input value={project.visitText || ""} onChange={(e) => updateItem("projects", idx, "visitText", e.target.value || undefined)} className="liquid-input text-xs" placeholder="Visit Button Text (e.g. Visit, Download)" />
                  <select value={project.status} onChange={(e) => updateItem("projects", idx, "status", e.target.value)} className="liquid-input text-xs" style={{ appearance: "auto" }}>
                    <option value="live">Live</option>
                    <option value="beta">Beta</option>
                    <option value="coming">Coming Soon</option>
                  </select>
                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
                        {tag}
                        <button onClick={() => { const arr = [...project.tags]; arr.splice(tIdx, 1); updateItem("projects", idx, "tags", arr); }} className="text-white/30 hover:text-red-400"><X size={9} /></button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); const input = (e.target as HTMLFormElement).elements.namedItem("tag") as HTMLInputElement; if (input.value.trim()) { updateItem("projects", idx, "tags", [...project.tags, input.value.trim()]); input.value = ""; } }} className="flex gap-2">
                    <input name="tag" placeholder="Add tag..." className="liquid-input text-xs flex-1" />
                    <button type="submit" className="liquid-btn px-2 py-1 text-[10px]"><Plus size={12} /></button>
                  </form>
                </div>
              </div>
            ))}
            <button onClick={() => addItem("projects", { name: "New Project", desc: "Description", icon: "Zap", tags: ["New"], status: "coming" })} className="liquid-btn w-full py-3 text-xs font-semibold flex items-center justify-center gap-2">
              <Plus size={14} /> Add Project
            </button>
          </SectionCard>
        </div>
      )}

      {/* ===== VISIBILITY TAB ===== */}
      {activeTab === "visibility" && (
        <div className="space-y-3">
          <SectionCard title="Page Visibility" icon={<Eye size={14} />}>
            <Toggle label="About Page" value={editConfig.visible.about} onChange={(v) => updateField("visible.about", v)} />
            <Toggle label="Updates Page" value={editConfig.visible.updates} onChange={(v) => updateField("visible.updates", v)} />
            <Toggle label="Scripts Page" value={editConfig.visible.scripts} onChange={(v) => updateField("visible.scripts", v)} />
            <Toggle label="Projects Page" value={editConfig.visible.projects} onChange={(v) => updateField("visible.projects", v)} />
            <Toggle label="Profile Page" value={editConfig.visible.profile} onChange={(v) => updateField("visible.profile", v)} />
          </SectionCard>
        </div>
      )}

      {/* ===== USERS TAB ===== */}
      {activeTab === "users" && (
        <div className="space-y-3">
          {config.admin.showStats && (
            <div className="grid grid-cols-3 gap-2.5">
              <div className="liquid-glass p-3 text-center">
                <Users size={14} className="text-white/30 mx-auto mb-1" />
                <span className="text-white font-bold text-lg block">{users.length}</span>
                <span className="text-white/25 text-[10px]">Total</span>
              </div>
              <div className="liquid-glass p-3 text-center">
                <Crown size={14} className="text-amber-400/50 mx-auto mb-1" />
                <span className="text-white font-bold text-lg block">{users.filter((u) => u.premium).length}</span>
                <span className="text-white/25 text-[10px]">Premium</span>
              </div>
              <div className="liquid-glass p-3 text-center">
                <Shield size={14} className="text-emerald-400/50 mx-auto mb-1" />
                <span className="text-white font-bold text-lg block">{users.filter((u) => u.role === "admin").length}</span>
                <span className="text-white/25 text-[10px]">Admins</span>
              </div>
            </div>
          )}

          {config.admin.showAddUser && (
            <div className="liquid-glass p-4">
              <h3 className="text-white/70 text-sm font-semibold mb-3">Add User</h3>
              <form onSubmit={handleAddUser} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input name="username" placeholder="Username" className="liquid-input" required />
                  <input name="password" placeholder="Password" className="liquid-input" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select name="role" className="liquid-input" style={{ appearance: "auto" }}>
                    <option value="buyer">Buyer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <label className="flex items-center gap-2 liquid-input cursor-pointer">
                    <input name="premium" type="checkbox" className="w-4 h-4" />
                    <span className="text-white/50 text-xs">Premium</span>
                  </label>
                </div>
                <button type="submit" className="liquid-btn w-full py-2.5 text-xs font-semibold">
                  <span className="relative z-10 flex items-center justify-center gap-2"><Plus size={14} /> Add User</span>
                </button>
              </form>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 py-2 px-3 rounded-xl text-xs" style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.2)", color: "#ff6b6b" }}>
              <AlertCircle size={13} />{error}
            </div>
          )}

          {config.admin.showUserList && (
            <div className="space-y-2">
              {loadingUsers ? (
                <div className="text-center py-8"><Loader2 size={24} className="text-white/20 animate-spin mx-auto" /></div>
              ) : (
                users.map((u) => (
                  <div key={u.username} className="liquid-glass p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: u.premium ? "rgba(255,193,7,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${u.premium ? "rgba(255,193,7,0.12)" : "rgba(255,255,255,0.06)"}` }}>
                          {u.premium ? <Crown size={14} className="text-amber-400/60" /> : <User size={14} className="text-white/30" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/80 text-xs font-semibold">{u.username}</span>
                            {u.premium && <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: "rgba(255,193,7,0.15)", color: "#ffc107" }}>PREMIUM</span>}
                          </div>
                          <span className="text-white/25 text-[10px] capitalize">{u.role} • {u.password}</span>
                        </div>
                      </div>
                      {config.admin.showDeleteUser && u.username !== currentUser.username && (
                        <button onClick={() => handleDeleteUser(u.username)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-center py-5 mt-2">
        <p className="text-white/12 text-[10px] tracking-wider">{config.site.copyright}</p>
      </div>
    </>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="animate-slide-up liquid-glass p-4 sm:p-5">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-white/40">{icon}</span>
          <h3 className="text-white/70 text-sm font-semibold">{title}</h3>
        </div>
        <div className="space-y-2.5">{children}</div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-white/35 text-[10px] font-semibold mb-1 uppercase tracking-wider">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="liquid-input text-xs" />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-white/35 text-[10px] font-semibold mb-1 uppercase tracking-wider">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="liquid-input text-xs resize-none" />
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <label className="block text-white/35 text-[10px] font-semibold mb-1 uppercase tracking-wider">{label}</label>
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="liquid-input text-xs" />
      </div>
      <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/10" style={{ background: value }} />
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
      <span className="text-white/50 text-xs">{label}</span>
      <button onClick={() => onChange(!value)} className="w-10 h-5 rounded-full relative transition-colors" style={{ background: value ? "rgba(52,199,89,0.4)" : "rgba(255,255,255,0.1)" }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: value ? "22px" : "2px" }} />
      </button>
    </div>
  );
}
