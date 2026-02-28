import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";
import {
  Sparkles,
  ClipboardCopy,
  Trash2,
  Upload,
  Settings,
  Film,
  Video,
  AlertTriangle,
  Gauge,
  BookOpen,
  RefreshCcw,
  Save,
  PanelRightClose,
  PanelRightOpen,
  Server,
  ShieldCheck,
  FileJson,
  FileCode2,
  LogIn,
  LogOut,
  UserPlus,
  KeyRound,
  // ✅ FIX: icons used in Inventory section
  Camera,
  Aperture,
  Lightbulb,
  Mic,
  Smartphone,
} from "lucide-react";

const LS_KEY = "content_architect_v2_single_snapshot";
const LS_PENDING_PROFILE = "ca_pending_profile_v1";

/* ----------------------------- utils ------------------------------ */
function uid() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function normalizeNewlines(s) {
  return (s || "").replace(/\r\n/g, "\n");
}
function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
function downloadText(filename, text, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function wordCount(s) {
  const t = (s || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

/* ----------------------------- Language policy ------------------------------ */
const UI_LOCALES = {
  tr: {
    appTitle: "Content-Architect v2",
    subtitle: "• Platform presets • Inventory-aware • Time Map • JSON/XML • Revise",
    hide: "Sidebar Gizle",
    show: "Sidebar Göster",
    reset: "Sıfırla",
    snapshot: "Snapshot",
    serverOk: "Server OK",
    serverOff: "Server OFF",
    keysServerOnly: "Key sadece server’da",
    platform: "Platform",
    goal: "Amaç",
    contentType: "İçerik Türü",
    duration: "Süre",
    tempo: "Tempo",
    inputLang: "Input Language (UI dili)",
    outputLang: "Output Language (çıktı dili)",
    inventory: "Inventory",
    script: "Script",
    generate: "AI Draft",
    revise: "AI Revize",
    timeMap: "Time Map",
    exportJson: "JSON Export",
    importJson: "JSON Import",
    exportXml: "XML Export",
    presets: "Preset",
    guideline: "Platform Guideline Snippet",
    noScript: "Önce script üret ya da yapıştır.",
    revised: "Revise tamam.",
    generated: "Draft üretildi.",
    copied: "Kopyalandı.",
    imported: "Import tamam.",
    downloaded: "İndirildi.",
    resetConfirm: "Her şeyi sıfırlamak istediğine emin misin?",
    noteOptional: "Revise notu (opsiyonel)",
    notePlaceholder: "Örn: LinkedIn için daha profesyonel, daha kısa hook, daha güçlü CTA",
    platformSelectHelp: "Platform multi-select (preset + guideline snippet seçimi için).",
    outputRule: "Her üretimde çıktı dili zorlanır.",
    timeMapFix: "Sadece 'Scene X:' veya 'Sahne X:' sahne sayılır. Transition/B-roll sayılmaz.",
    aspectRatio: "Aspect Ratio",
    teleprompter: "TP",
    openTeleprompter: "TP",
    downloadTpTxt: "TP TXT İndir",
    downloadTpJson: "TP JSON İndir",
    mirror: "Mirror",
    cues: "Cues",
    contrast: "Contrast",
    play: "Play",
    pause: "Pause",
    prev: "Prev",
    next: "Next",
    fullscreen: "Fullscreen",
    exitFs: "Exit FS",
    speedLocked: "Hız kilitli. Süre/tempo Time Map’ten gelir.",
    emotion: "Duygu",
    intensity: "Yoğunluk",
    left: "Kalan",
    shortcuts:
      "Kısayollar: Space(play/pause) · ←/→ (beat) · M (mirror) · D (cues) · C (contrast) · +/- (font) · Esc (çık)",
    noCues: "Cue yok",
    noTimeMap: "Time Map yok. Önce script üret.",
    account: "Hesap",
    app: "Uygulama",
    guest: "Misafir",
    login: "Giriş",
    logout: "Çıkış",
    accessRequired: "Erişim gerekli",
    accessLogin: "Giriş yap",
    accessPaid: "Üyelik gerekli",
    accessCredits: "Kredi gerekli",
    authTitle: "Hesap",
    signIn: "Giriş Yap",
    signUp: "Kayıt Ol",
    resetPw: "Şifre Sıfırla",
    email: "Email",
    password: "Şifre",
    firstName: "Ad",
    lastName: "Soyad",
    gender: "Cinsiyet (opsiyonel)",
    genderPrefer: "Belirtmek istemiyorum",
    genderMale: "Erkek",
    genderFemale: "Kadın",
    birthYear: "Doğum yılı",
    createAccount: "Hesap Oluştur",
    haveAccount: "Zaten hesabın var mı?",
    needAccount: "Hesabın yok mu?",
    sendReset: "Reset linki gönder",
    resetSent: "Reset maili gönderildi.",
    checkInboxConfirm: "Onay mailini kontrol et (confirmation gerekli).",
    signedIn: "Giriş başarılı.",
    signedOut: "Çıkış yapıldı.",
    wrongCreds: "Giriş başarısız. Email/şifreyi kontrol et.",
    rateLimited: "Çok sık denendi. Lütfen biraz bekleyip tekrar dene.",
    confirmRequired: "Email onayı gerekli. Lütfen mailbox’ını kontrol et.",
  },
  en: {
    appTitle: "Content-Architect v2",
    subtitle: "• Platform presets • Inventory-aware • Time Map • JSON/XML • Revise",
    hide: "Hide Sidebar",
    show: "Show Sidebar",
    reset: "Reset",
    snapshot: "Snapshot",
    serverOk: "Server OK",
    serverOff: "Server OFF",
    keysServerOnly: "Keys in server only",
    platform: "Platform",
    goal: "Goal",
    contentType: "Content Type",
    duration: "Duration",
    tempo: "Tempo",
    inputLang: "Input Language (drives UI)",
    outputLang: "Output Language (output)",
    inventory: "Inventory",
    script: "Script",
    generate: "AI Draft",
    revise: "AI Revise",
    timeMap: "Time Map",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    exportXml: "XML Export",
    presets: "Preset",
    guideline: "Platform Guideline Snippet",
    noScript: "Generate or paste a script first.",
    revised: "Revised.",
    generated: "Draft generated.",
    copied: "Copied.",
    imported: "Import done.",
    downloaded: "Downloaded.",
    resetConfirm: "Are you sure you want to reset everything?",
    noteOptional: "Revise note (optional)",
    notePlaceholder: "e.g. More professional for LinkedIn, shorter hook, stronger CTA",
    platformSelectHelp: "Platform multi-select (used for presets + guideline snippet injection).",
    outputRule: "Return language is forced on every generation.",
    timeMapFix: "Only 'Scene X:' or 'Sahne X:' counts as scene. Transition/B-roll do not.",
    aspectRatio: "Aspect Ratio",
    teleprompter: "TP",
    openTeleprompter: "TP",
    downloadTpTxt: "Download TP TXT",
    downloadTpJson: "Download TP JSON",
    mirror: "Mirror",
    cues: "Cues",
    contrast: "Contrast",
    play: "Play",
    pause: "Pause",
    prev: "Prev",
    next: "Next",
    fullscreen: "Fullscreen",
    exitFs: "Exit FS",
    speedLocked: "Speed is locked. Timing is driven by Time Map.",
    emotion: "Emotion",
    intensity: "Intensity",
    left: "Left",
    shortcuts:
      "Shortcuts: Space(play/pause) · ←/→ (beat) · M (mirror) · D (cues) · C (contrast) · +/- (font) · Esc (exit)",
    noCues: "No cues",
    noTimeMap: "No Time Map. Generate a script first.",
    account: "Account",
    app: "App",
    guest: "Guest",
    login: "Login",
    logout: "Logout",
    accessRequired: "Access required",
    accessLogin: "Please login",
    accessPaid: "Paid plan required",
    accessCredits: "Credits required",
    authTitle: "Account",
    signIn: "Sign in",
    signUp: "Sign up",
    resetPw: "Reset password",
    email: "Email",
    password: "Password",
    firstName: "First name",
    lastName: "Last name",
    gender: "Gender (optional)",
    genderPrefer: "Prefer not to say",
    genderMale: "Male",
    genderFemale: "Female",
    birthYear: "Birth year",
    createAccount: "Create account",
    haveAccount: "Already have an account?",
    needAccount: "Need an account?",
    sendReset: "Send reset link",
    resetSent: "Reset email sent.",
    checkInboxConfirm: "Check your inbox to confirm your email (confirmation required).",
    signedIn: "Signed in.",
    signedOut: "Signed out.",
    wrongCreds: "Sign-in failed. Check email/password.",
    rateLimited: "Too many requests. Please wait and try again.",
    confirmRequired: "Email confirmation required. Please check your inbox.",
  },
};

function uiLocaleFromInput(inputLanguage) {
  return inputLanguage === "Turkish" ? "tr" : "en";
}
function tpLocaleFromOutput(outputLanguage) {
  return outputLanguage === "Turkish" ? "tr" : "en";
}

/* ----------------------------- Platform options (multi-select) ------------------------------ */
const PLATFORM_OPTIONS = [
  "Instagram Reels",
  "TikTok",
  "YouTube Shorts",
  "YouTube Long",
  "LinkedIn",
  "Facebook",
  "Promo",
  "Landing",
  "Podcast",
];
const ASPECT_OPTIONS = ["9:16", "4:5", "1:1", "16:9"];

/* ----------------------------- Preset engine ------------------------------ */
function derivePreset(platforms, durationSec, tempoPreset, aspectRatioSelected) {
  const p = new Set(platforms);
  const primary =
    (p.has("Instagram Reels") && "Instagram Reels") ||
    (p.has("TikTok") && "TikTok") ||
    (p.has("YouTube Shorts") && "YouTube Shorts") ||
    (p.has("YouTube Long") && "YouTube Long") ||
    (p.has("LinkedIn") && "LinkedIn") ||
    (p.has("Facebook") && "Facebook") ||
    (p.has("Promo") && "Promo") ||
    (p.has("Landing") && "Landing") ||
    (p.has("Podcast") && "Podcast") ||
    "Promo";

  const base = {
    primary,
    aspect: aspectRatioSelected || "9:16",
    pacing: tempoPreset,
    ctaStyle: "comment",
    captionStyle: "short",
    hookWindowSec: 1.5,
  };

  if (primary === "LinkedIn") {
    base.ctaStyle = "comment or follow";
    base.captionStyle = "professional";
    base.hookWindowSec = 2.0;
  } else if (primary === "Facebook") {
    base.ctaStyle = "click or message";
    base.captionStyle = "friendly";
    base.hookWindowSec = 1.8;
  } else if (primary === "Landing") {
    base.ctaStyle = "click / sign up";
    base.captionStyle = "benefit-led";
    base.hookWindowSec = 2.0;
  } else if (primary === "Podcast") {
    base.ctaStyle = "subscribe";
    base.captionStyle = "timestamp-led";
    base.hookWindowSec = 3.0;
  } else if (primary === "YouTube Long") {
    base.ctaStyle = "subscribe";
    base.captionStyle = "chapter-friendly";
    base.hookWindowSec = 5.0;
  } else if (primary === "YouTube Shorts") {
    base.ctaStyle = "subscribe";
    base.captionStyle = "short punchy";
    base.hookWindowSec = 1.5;
  } else if (primary === "TikTok") {
    base.ctaStyle = "comment / follow";
    base.captionStyle = "short punchy";
    base.hookWindowSec = 1.2;
  } else if (primary === "Instagram Reels") {
    base.ctaStyle = "comment / follow";
    base.captionStyle = "short punchy";
    base.hookWindowSec = 1.5;
  } else {
    base.ctaStyle = "buy now";
    base.captionStyle = "short punchy";
    base.hookWindowSec = 1.5;
  }

  base.targetDurationSec = durationSec;
  base.structureHint =
    durationSec <= 20
      ? "Hook + 2 scenes + CTA"
      : durationSec <= 45
      ? "Hook + 3-4 scenes + CTA"
      : primary === "Podcast" || primary === "YouTube Long"
      ? "Hook + long-form beats + CTA"
      : "Hook + 4-6 scenes + CTA";

  return base;
}

/* ----------------------------- Guidelines snippet loading ------------------------------ */
const FALLBACK_GUIDELINES = {
  LinkedIn: {
    platform: "LinkedIn",
    updatedAt: "fallback",
    specs: { notes: ["Professional tone", "Subtitles recommended", "Avoid overly aggressive claims"] },
  },
  Facebook: {
    platform: "Meta (Facebook)",
    updatedAt: "fallback",
    specs: { notes: ["Mobile-first", "Thumb-stopping first 2 seconds", "Clear CTA"] },
  },
  "Instagram Reels": {
    platform: "Instagram Reels",
    updatedAt: "fallback",
    specs: { notes: ["Mobile-first 9:16", "Hook in first 1–2 seconds", "On-screen captions"] },
  },
  TikTok: {
    platform: "TikTok",
    updatedAt: "fallback",
    specs: { notes: ["Fast hook", "Pattern interrupts", "Clear CTA"] },
  },
  "YouTube Shorts": {
    platform: "YouTube Shorts",
    updatedAt: "fallback",
    specs: { notes: ["Hook fast", "High retention pacing", "Subscribe CTA"] },
  },
  "YouTube Long": {
    platform: "YouTube Long",
    updatedAt: "fallback",
    specs: { notes: ["Stronger narrative", "Chapters optional", "Subscribe + next video CTA"] },
  },
  Promo: { platform: "Promo", updatedAt: "fallback", specs: { notes: ["Benefit first", "Fast pacing", "Strong CTA"] } },
  Landing: { platform: "Landing", updatedAt: "fallback", specs: { notes: ["Clarity > hype", "Show offer early", "One CTA"] } },
  Podcast: { platform: "Podcast", updatedAt: "fallback", specs: { notes: ["Conversational", "Chapters/timestamps", "Audio clarity"] } },
};

async function loadGuideline(platformPrimary) {
  const name = String(platformPrimary || "").toLowerCase();
  const map = {
    linkedin: "linkedin",
    facebook: "meta",
    promo: "promo",
    landing: "landing",
    podcast: "youtube",
    "instagram reels": "instagram",
    tiktok: "tiktok",
    "youtube shorts": "youtube",
    "youtube long": "youtube",
  };

  const file = map[name];
  if (!file) return FALLBACK_GUIDELINES[platformPrimary] || null;

  try {
    const r = await fetch(`/guidelines/${file}.json`, { cache: "no-store" });
    if (!r.ok) throw new Error("no file");
    const data = await r.json();
    return data;
  } catch {
    return FALLBACK_GUIDELINES[platformPrimary] || null;
  }
}

/* ----------------------------- Inventory ------------------------------ */
const INV = {
  capture: ["Phone", "Pro Camera"],
  lenses: ["Wide", "Standard", "Tele"],
  lights: ["Window Light", "Ring Light", "Softbox", "RGB", "None"],
  audio: ["Phone Mic", "Lavalier", "Shotgun", "None"],
  stabilization: ["Tripod", "Gimbal", "Handheld"],
};

function toggle(arr, v) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}
function setNoneRule(arr, v) {
  const next = toggle(arr, v);
  if (v === "None" && next.includes("None")) return ["None"];
  if (v !== "None" && next.includes("None")) return next.filter((x) => x !== "None");
  return next;
}
function deriveInventoryFlags(inv) {
  const hasPhone = inv.capture.includes("Phone");
  const hasProCamera = inv.capture.includes("Pro Camera");
  const hasLight = inv.lights.length && !inv.lights.includes("None");
  const hasAudio = inv.audio.length && !inv.audio.includes("None");
  const hasMic = hasAudio && !inv.audio.includes("Phone Mic");
  const hasTripod = inv.stabilization.includes("Tripod");
  const hasGimbal = inv.stabilization.includes("Gimbal");
  return { hasPhone, hasProCamera, hasLight, hasAudio, hasMic, hasTripod, hasGimbal };
}

function inventorySummaryText(inv, location) {
  const esc = (a) => (a && a.length ? a.join(", ") : "—");
  return `Capture: ${esc(inv.capture)} | Lenses: ${esc(inv.lenses)} | Lights: ${esc(inv.lights)} | Audio: ${esc(inv.audio)} | Stabilization: ${esc(
    inv.stabilization
  )} | Location: ${location}`;
}

/* ----------------------------- Scene parsing ------------------------------ */
function splitScenesStrict(scriptText) {
  const t = normalizeNewlines(scriptText).trim();
  if (!t) return [];
  const lines = t.split("\n");

  const isSceneHeader = (line) => {
    const l = line.trim();
    return /^Sahne\s*\d+\s*:/i.test(l) || /^Scene\s*\d+\s*:/i.test(l);
  };

  const blocks = [];
  let cur = null;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, " ");
    if (isSceneHeader(line)) {
      if (cur) blocks.push(cur);
      cur = { id: uid(), title: line.trim(), content: "" };
    } else {
      if (!cur) continue;
      cur.content += (cur.content ? "\n" : "") + line;
    }
  }
  if (cur) blocks.push(cur);

  return blocks.map((b, i) => ({ ...b, order: i + 1, content: b.content.trim() }));
}

/* ----------------------------- Tempo map + SECTION TAGGING ------------------------------ */
function splitIntoSentences(text) {
  const t = normalizeNewlines(text).trim();
  if (!t) return [];

  // Split by newlines first
  const chunks = t.split(/\n+/g).map((x) => x.trim()).filter(Boolean);

  const out = [];
  for (const chunk of chunks) {
    // Safe sentence splitting without lookbehind
    let buf = "";
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];
      buf += ch;
      if (ch === "." || ch === "!" || ch === "?" || ch === "…") {
        const s = buf.trim();
        if (s) out.push(s);
        buf = "";
      }
    }
    const rest = buf.trim();
    if (rest) out.push(rest);
  }
  return out;
}

function detectPace(sentence) {
  const s = sentence.toLowerCase();
  const wc = wordCount(sentence);

  const hasUrgency =
    s.includes("hemen") ||
    s.includes("şimdi") ||
    s.includes("3 saniy") ||
    s.includes("dont scroll") ||
    s.includes("don’t scroll") ||
    s.includes("bekle") ||
    s.includes("stop") ||
    s.includes("scroll");

  const manyShort = wc <= 7;
  const veryLong = wc >= 18;

  if (hasUrgency || manyShort) return "fast";
  if (veryLong) return "slow";
  return "medium";
}

function detectIntensity(sentence) {
  const lower = sentence.toLowerCase();

  const emph =
    sentence.includes("!") ||
    /[A-ZÇĞİÖŞÜ]{3,}/.test(sentence) ||
    lower.includes("kesin") ||
    lower.includes("inan") ||
    lower.includes("şok") ||
    lower.includes("asla") ||
    lower.includes("mutlaka");

  const soft =
    lower.includes("bence") ||
    lower.includes("istersen") ||
    lower.includes("gel") ||
    lower.includes("ister misin") ||
    lower.includes("dilersen");

  if (emph) return "emphatic";
  if (soft) return "soft";
  return "neutral";
}

function estimateSeconds(words, pace, tempoPreset = "balanced") {
  let wps = pace === "fast" ? 3.0 : pace === "slow" ? 1.8 : 2.3;
  if (tempoPreset === "fast_aggressive") wps *= 1.15;
  if (tempoPreset === "calm_cinematic") wps *= 0.9;
  return +(words / wps).toFixed(1);
}

function detectSectionHeader(line) {
  const l = String(line || "").trim();
  if (!l) return null;

  if (/^hook\s*:/i.test(l)) return { type: "hook", label: "Hook" };
  if (/^cta\s*:/i.test(l)) return { type: "cta", label: "CTA" };
  if (/^transition\s*:/i.test(l)) return { type: "transition", label: "Transition" };

  const sceneMatch = l.match(/^(scene|sahne)\s*(\d+)\s*:/i);
  if (sceneMatch) {
    const n = sceneMatch[2] || "";
    return { type: "scene", label: `Scene ${n}` };
  }

  return null;
}

function buildTempoMap(scriptText, tempoPreset) {
  const text = normalizeNewlines(scriptText || "").trim();
  if (!text) return [];

  const lines = text.split("\n");
  let currentSection = { type: "unknown", label: "—" };

  const out = [];
  let globalIdx = 1;
  let buffer = [];

  function flushBuffer() {
    if (!buffer.length) return;

    const chunk = buffer.join(" ").replace(/\s+/g, " ").trim();
    buffer = [];
    if (!chunk) return;

    const sentences = splitIntoSentences(chunk);
    for (const sent of sentences) {
      const pace = detectPace(sent);
      const intensity = detectIntensity(sent);
      const wc = wordCount(sent);
      const durationSec = estimateSeconds(wc, pace, tempoPreset);

      out.push({
        id: uid(),
        idx: globalIdx++,
        text: sent,
        pace,
        intensity,
        wc,
        durationSec,
        sectionType: currentSection.type,
        sectionLabel: currentSection.label,
      });
    }
  }

  for (const rawLine of lines) {
    const line = (rawLine || "").trim();
    const header = detectSectionHeader(line);

    if (header) {
      flushBuffer();
      currentSection = header;

      // ✅ "Hook: ..." gibi aynı satırdaki metni yakala
      const after = line.split(":").slice(1).join(":").trim();
      if (after) buffer.push(after);

      continue;
    }

    if (!line) {
      flushBuffer();
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();
  return out;
}

/* ----------------------------- Inventory-aware outputs ------------------------------ */
function buildNeedsList(inv, location) {
  const f = deriveInventoryFlags(inv);
  const needs = [];

  needs.push({
    id: uid(),
    category: "Light",
    have: f.hasLight ? "Yes" : "No",
    suggestion: f.hasLight ? "Key light 45° + background separation." : location === "indoor" ? "Use window light + bounce (white wall)." : "Shoot in shade (avoid harsh sun).",
  });

  needs.push({
    id: uid(),
    category: "Audio",
    have: f.hasAudio ? "Yes" : "No",
    suggestion: f.hasAudio ? "Set levels low, avoid clipping." : "No mic: bring phone closer (40–60cm), reduce echo/wind.",
  });

  needs.push({
    id: uid(),
    category: "Stabilization",
    have: inv.stabilization.length ? "Yes" : "No",
    suggestion: inv.stabilization.length ? "Lock framing; use cuts." : "No stabilization: brace elbows, keep takes short.",
  });

  return needs;
}

function buildDirectorTouch(inv, preset, location) {
  const f = deriveInventoryFlags(inv);
  const cards = [];

  cards.push({
    title: `🎛️ Preset • ${preset.primary}`,
    tag: "Platform",
    items: [
      `Aspect: ${preset.aspect}`,
      `Hook window: first ~${preset.hookWindowSec}s`,
      `CTA style: ${preset.ctaStyle}`,
      `Caption: ${preset.captionStyle}`,
      `Structure: ${preset.structureHint}`,
    ],
  });

  cards.push({
    title: "📦 Inventory Summary",
    tag: "Inventory-aware",
    items: [
      f.hasPhone ? "Phone available." : "No phone selected (consider enabling Phone).",
      f.hasProCamera ? "Pro camera available." : "No pro camera selected.",
      f.hasLight ? "Lights available." : location === "indoor" ? "No light: use window + bounce." : "No light: shoot in shade.",
      f.hasAudio ? "Audio gear available." : "No audio gear: phone closer, reduce echo/wind.",
      inv.stabilization.includes("Tripod") ? "Tripod: stable talking head." : "No tripod: keep takes short.",
      inv.stabilization.includes("Gimbal") ? "Gimbal: slow moves only." : "Gimbal not required for A-roll.",
    ],
  });

  return cards;
}

function buildBRollBeatList(scenes, inv, preset, location) {
  const f = deriveInventoryFlags(inv);

  const cameraTip = f.hasProCamera
    ? "Camera: lock WB, expose for skin."
    : f.hasPhone
    ? "Phone: 1x lens, lock exposure."
    : "Select capture gear.";

  const lightTip = f.hasLight
    ? `Light: ${inv.lights.filter((x) => x !== "None").join(" + ")}`
    : location === "indoor"
    ? "Light: window + bounce."
    : "Light: shade.";

  const stabTip = f.hasGimbal
    ? "Gimbal: slow moves."
    : inv.stabilization.includes("Tripod")
    ? "Tripod: lock framing."
    : "Handheld: elbows locked, short takes.";

  const audioTip = f.hasMic
    ? "Audio: use mic, avoid clipping."
    : f.hasAudio
    ? "Audio: phone mic, close distance."
    : "Audio: phone closer, reduce echo/wind.";

  const base = [
    { type: "Cutaway", text: "Insert a close-up of the key object / detail.", sec: 1.5 },
    { type: "Hands", text: "Insert hands demonstrating the action.", sec: 1.8 },
    { type: "POV", text: "Insert POV shot (reach / grab / use).", sec: 1.2 },
    { type: "Context", text: "Insert a quick establishing wide shot.", sec: 1.2 },
  ];

  const density =
    preset.primary === "Podcast" || preset.primary === "YouTube Long"
      ? 2
      : preset.targetDurationSec <= 20
      ? 2
      : 3;

  const out = [];
  for (const sc of scenes) {
    const picks = base.slice(0, density);
    picks.forEach((p, i) => {
      out.push({
        id: uid(),
        sceneId: sc.id,
        sceneTitle: sc.title,
        order: i + 1,
        shotType: p.type,
        durationSec: p.sec,
        instruction: `${p.text} • ${cameraTip} • ${lightTip} • ${stabTip} • ${audioTip}`,
      });
    });
  }
  return out;
}

/* ----------------------------- Timeline + XML export ------------------------------ */
function buildTimeline(tempoMap, bRoll, targetSec) {
  const aRoll = [];
  let t = 0;

  for (const s of tempoMap) {
    const start = +t.toFixed(1);
    const end = +(t + s.durationSec).toFixed(1);
    aRoll.push({
      id: uid(),
      type: "aRoll",
      text: s.text,
      pace: s.pace,
      intensity: s.intensity,
      startSec: start,
      endSec: end,
    });
    t = end;
  }

  const bTrack = [];
  let bi = 0;
  const pickEvery = 2;

  for (let i = 0; i < aRoll.length; i++) {
    if (i % pickEvery === 0 && bRoll[bi]) {
      const seg = aRoll[i];
      const dur = bRoll[bi].durationSec;
      const start = seg.startSec;
      const end = +(start + dur).toFixed(1);

      bTrack.push({
        id: uid(),
        type: "bRoll",
        startSec: start,
        endSec: end,
        shotType: bRoll[bi].shotType,
        instruction: bRoll[bi].instruction,
        linkedTo: seg.id,
      });

      bi++;
    }
  }

  const total = aRoll.length ? aRoll[aRoll.length - 1].endSec : 0;

  return {
    tracks: { aRoll, bRoll: bTrack },
    totalDurationSec: total,
    targetDurationSec: targetSec,
    deltaSec: +(total - targetSec).toFixed(1),
  };
}

function timelineToXml(timeline) {
  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const a = (timeline.tracks.aRoll || [])
    .map(
      (x) =>
        `<clip type="aRoll" start="${x.startSec}" end="${x.endSec}" pace="${x.pace}" intensity="${x.intensity}">${esc(
          x.text
        )}</clip>`
    )
    .join("\n");

  const b = (timeline.tracks.bRoll || [])
    .map(
      (x) =>
        `<clip type="bRoll" start="${x.startSec}" end="${x.endSec}" shotType="${esc(x.shotType)}">${esc(
          x.instruction
        )}</clip>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<timeline total="${timeline.totalDurationSec}" target="${timeline.targetDurationSec}">
  <aRoll>
${a}
  </aRoll>
  <bRoll>
${b}
  </bRoll>
</timeline>`;
}

/* ----------------------------- AI prompt builders (EN commands always) ------------------------------ */
function buildSystemPrompt({
  displayLang,
  platforms,
  preset,
  goal,
  contentType,
  tempoPreset,
  inventoryText,
  durationSec,
  guidelineSnippet,
}) {
  const guidelineNotes = guidelineSnippet?.specs?.notes ? guidelineSnippet.specs.notes.join(" | ") : "";

  return `You are an expert video scriptwriter and editor.

You MUST follow these rules:
- Command language: English (always)
- Output language: ${displayLang} (return the entire response in ${displayLang}; do not mix languages)
- Platforms selected: ${platforms.join(", ") || "(none)"} (primary preset: ${preset.primary})
- Platform preset: aspect=${preset.aspect}, hookWindow=${preset.hookWindowSec}s, CTA=${preset.ctaStyle}, caption=${preset.captionStyle}, structure=${preset.structureHint}
- Goal: ${goal}
- Content type: ${contentType}
- Tempo preset: ${tempoPreset}
- Target duration: ~${durationSec} seconds
- Inventory constraints (what can be filmed): ${inventoryText}

Official-ish guideline snippet (use as constraints, do not invent new specs):
- ${guidelineSnippet?.platform || preset.primary} • updatedAt=${guidelineSnippet?.updatedAt || "—"}
- Notes: ${guidelineNotes || "(none)"}

Output format STRICT:
Hook: <text>
Scene 1: <text>
Transition: <text>
Scene 2: <text>
... (as needed)
CTA: <text>

Important:
- Keep it shootable with the given inventory. If lights/mic are missing, adapt.
- Avoid mentioning gear that is not selected.
- Keep hook inside first ~${preset.hookWindowSec}s.
- Stay within ~${durationSec}s (approx).`;
}

function buildDraftUserMessage({ brief }) {
  return `BRIEF: ${brief || "(empty)"}
Generate a complete script now.`;
}

function buildReviseUserMessage({ currentScript, reviseNote, brief }) {
  return `TASK: Revise and optimize the script.

USER REVISE NOTE (optional):
${reviseNote || "(none)"}

BRIEF (for alignment):
${brief || "(empty)"}

CURRENT SCRIPT TO REVISE:
${currentScript}

Hard rules:
- Keep the same section labels: Hook, Scene 1/2/3..., Transition, CTA
- Optimize pacing, clarity, platform fit, and duration
- Keep it shootable with the inventory constraints
- Return the entire response in the output language.`;
}

/* ----------------------------- UI components ------------------------------ */
function Chip({ active, onClick, children }) {
  return (
    <button className={"chip " + (active ? "chip-on" : "")} onClick={onClick} type="button" aria-pressed={active}>
      {children}
    </button>
  );
}
function Badge({ children, tone = "default" }) {
  return <span className={"badge " + (tone !== "default" ? `badge-${tone}` : "")}>{children}</span>;
}
function SectionTitle({ icon, title, right }) {
  return (
    <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
      <div className="row" style={{ gap: 8 }}>
        {icon}
        <span style={{ fontWeight: 900 }}>{title}</span>
      </div>
      {right}
    </div>
  );
}

/* ----------------------------- Teleprompter (TimeMap-driven) ------------------------------ */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function formatMs(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}
function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}
function deriveEmotionFromTempoRow(row, preset) {
  const intensity = row?.intensity || "neutral";
  const pace = row?.pace || "medium";
  let name = "Neutral";
  let base = 0.55;

  if (intensity === "emphatic") {
    name = preset?.primary === "LinkedIn" ? "Authoritative" : "Hype";
    base = 0.82;
  } else if (intensity === "soft") {
    name = "Warm";
    base = 0.48;
  } else {
    name = "Neutral";
    base = 0.58;
  }

  if (pace === "fast") base += 0.08;
  if (pace === "slow") base -= 0.1;
  if (preset?.pacing === "fast_aggressive") base += 0.06;
  if (preset?.pacing === "calm_cinematic") base -= 0.06;

  return { name, intensity: clamp01(base) };
}

function deriveDirectorCues(row, tpKey, preset) {
  const pace = row?.pace || "medium";
  const intensity = row?.intensity || "neutral";
  const cues = [];
  const isTR = tpKey === "tr";

  if (isTR) {
    if (pace === "fast") cues.push("Hızlı gir", "Nefesi kısa tut");
    if (pace === "slow") cues.push("Yavaşlat", "Net artikülasyon");
    if (pace === "medium") cues.push("Dengeli tempo");
    if (intensity === "emphatic") cues.push("Vurguyu artır", "Göz teması", "Ana kelimede dur");
    if (intensity === "soft") cues.push("Daha samimi ton", "Yumuşak bitir");
    if (intensity === "neutral") cues.push("Temiz & anlaşılır");
    if (preset?.primary === "YouTube Long") cues.push("Daha hikaye anlatır gibi");
    if (preset?.primary === "TikTok" || preset?.primary === "Instagram Reels") cues.push("Pattern interrupt hissi");
  } else {
    if (pace === "fast") cues.push("Punchy entry", "Short breaths");
    if (pace === "slow") cues.push("Slow down", "Clear articulation");
    if (pace === "medium") cues.push("Balanced pace");
    if (intensity === "emphatic") cues.push("Increase emphasis", "Eye contact", "Pause on keywords");
    if (intensity === "soft") cues.push("Warmer tone", "Soft landing");
    if (intensity === "neutral") cues.push("Clean & clear");
    if (preset?.primary === "YouTube Long") cues.push("More narrative delivery");
    if (preset?.primary === "TikTok" || preset?.primary === "Instagram Reels") cues.push("Pattern interrupt feel");
  }

  return cues.slice(0, 10);
}

// Section label colors
const SECTION_COLORS = {
  hook: "#ff4d6d",
  scene: "#6ae4ff",
  transition: "#b197fc",
  cta: "#69db7c",
  unknown: "#e9ecef",
};

// Flow text color based on starting character: " -> green, * -> blue
function getFlowTextColor(text) {
  const s = String(text || "");
  const trimmed = s.replace(/^\s+/, "");
  if (trimmed.startsWith('"')) return "#69db7c";
  if (trimmed.startsWith("*")) return "#4dabf7";
  return null;
}

function buildTeleprompterTimeMap(tempoMap, preset, tpKey) {
  return (tempoMap || []).map((row) => {
    const durMs = Math.max(300, Math.round((row.durationSec || 0) * 1000));
    const emotion = deriveEmotionFromTempoRow(row, preset);
    const cues = deriveDirectorCues(row, tpKey, preset);
    const sectionType = row.sectionType || "unknown";
    const sectionLabel = row.sectionLabel || "—";

    return {
      id: row.id,
      label: `#${row.idx}`,
      idx: row.idx,
      durationMs: durMs,
      text: row.text || "",
      pace: row.pace,
      intensityTag: row.intensity,
      emotion,
      cues,
      sectionType,
      sectionLabel,
    };
  });
}

function TeleprompterOverlay({ tpT, tpKey: _tpKey, preset, timeMap, projectContext, onClose }) {
  const beats = useMemo(() => (Array.isArray(timeMap) ? timeMap : []), [timeMap]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const [mirror, setMirror] = useState(false);
  const [showCues, setShowCues] = useState(true);
  const [highContrast, setHighContrast] = useState(true);
  const [fontScale, setFontScale] = useState(1.0);

  const rafRef = useRef(null);
  const startTsRef = useRef(null);
  const elapsedBeforeRef = useRef(0);
  const [elapsedMs, setElapsedMs] = useState(0);

  const currentBeat = beats[beatIndex] || null;
  const totalBeats = beats.length;
  const durationMs = currentBeat?.durationMs ?? 0;
  const remainingMs = Math.max(0, durationMs - elapsedMs);
  const progress = durationMs > 0 ? clamp01(elapsedMs / durationMs) : 0;

  const stop = useCallback(() => {
    setIsPlaying(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startTsRef.current = null;
    elapsedBeforeRef.current = elapsedMs;
  }, [elapsedMs]);

  const resetBeatTimer = useCallback(() => {
    setElapsedMs(0);
    elapsedBeforeRef.current = 0;
    startTsRef.current = null;
  }, []);

  const goToBeat = useCallback(
    (idx) => {
      const next = Math.max(0, Math.min(totalBeats - 1, idx));
      setBeatIndex(next);
      resetBeatTimer();
    },
    [resetBeatTimer, totalBeats]
  );

  const nextBeat = useCallback(() => {
    if (beatIndex < totalBeats - 1) goToBeat(beatIndex + 1);
    else stop();
  }, [beatIndex, totalBeats, goToBeat, stop]);

  const prevBeat = useCallback(() => {
    if (beatIndex > 0) goToBeat(beatIndex - 1);
    else resetBeatTimer();
  }, [beatIndex, goToBeat, resetBeatTimer]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => {
      const next = !p;
      if (!next) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        elapsedBeforeRef.current = elapsedMs;
        startTsRef.current = null;
      } else {
        elapsedBeforeRef.current = elapsedMs;
        startTsRef.current = null;
      }
      return next;
    });
  }, [elapsedMs]);

  useEffect(() => {
    if (!isPlaying || !currentBeat) return;

    const tick = (ts) => {
      if (startTsRef.current == null) startTsRef.current = ts;
      const delta = ts - startTsRef.current;
      const nextElapsed = Math.min(durationMs, elapsedBeforeRef.current + delta);
      setElapsedMs(nextElapsed);

      if (nextElapsed >= durationMs) {
        elapsedBeforeRef.current = 0;
        startTsRef.current = null;
        setElapsedMs(0);
        setBeatIndex((i) => {
          const ni = i + 1;
          if (ni >= totalBeats) {
            setIsPlaying(false);
            return i;
          }
          return ni;
        });
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, currentBeat, durationMs, totalBeats]);

  useEffect(() => {
    elapsedBeforeRef.current = 0;
    startTsRef.current = null;
    setElapsedMs(0);
  }, [beatIndex]);

  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }, []);

  const copyCurrentText = useCallback(async () => {
    const text = (currentBeat?.text || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Intentionally ignore clipboard errors in unsupported contexts.
    }
  }, [currentBeat]);

  function formatSeconds(ms = 0) {
    const sec = Math.max(0, ms / 1000);
    return Number.isInteger(sec) ? String(sec) : sec.toFixed(1);
  }

  function getOrientationText(aspect) {
    if (aspect === "9:16") return "dikey (telefonu portre tut)";
    if (aspect === "16:9") return "yatay (telefonu landscape tut)";
    if (aspect === "1:1") return "kare kadraj (telefonu sabit ve merkezde tut)";
    return "platforma uygun kadraj";
  }

  function getVoiceDirection(beat) {
    const pace = String(beat?.pace || "").toLowerCase();
    if (pace.includes("fast")) return "hızlı ve enerjik, cümle sonlarında net vurgu yap";
    if (pace.includes("slow") || pace.includes("calm")) return "sakin ve güven veren, her cümleden sonra kısa nefes bırak";
    if (pace.includes("aggressive")) return "yüksek enerji, güçlü vurgu ve daha kısa duraklarla konuş";
    return "dengeli hızda, anlaşılır ve ritmik konuş";
  }

  function getCameraDirection(beat, aspect) {
    const section = beat?.sectionType || "unknown";
    const orientation = getOrientationText(aspect);
    if (section === "hook") return `ilk 1-2 saniyede yakın plan ile başla, göz teması güçlü olsun, ${orientation}`;
    if (section === "proof") return `orta plan + sabit çekim kullan, ürün/delil anlarında kısa cut-in ekle, ${orientation}`;
    if (section === "cta") return `hafif yakınlaşma yap, kameraya direkt bakarak çağrıyı net ver, ${orientation}`;
    return `omuz üstü ile yakın plan arasında kal, kadrajı sabit tut, ${orientation}`;
  }

  function getLightingDirection(beat) {
    const intensity = clamp01(beat?.emotion?.intensity ?? 0.5);
    if (intensity >= 0.75) return "yüksek kontrast key light + hafif rim light, arka planı temiz tut";
    if (intensity <= 0.35) return "yumuşak key light, gölgeleri azalt, daha sakin bir atmosfer kur";
    return "denge ışığı kullan: yumuşak key + hafif fill ile doğal görünüm";
  }

  function getEffectDirection(beat) {
    const cues = Array.isArray(beat?.cues) ? beat.cues.filter(Boolean) : [];
    if (!cues.length) return "ek efekt zorunlu değil; ana odak konuşma ve yüz ifadesi";
    return `şu cue/effect notlarını uygula: ${cues.join(" | ")}`;
  }

  function buildBeatCommandPack(beat, index) {
    const seconds = formatSeconds(beat?.durationMs || 0);
    const emotionName = beat?.emotion?.name || "neutral";
    const emotionIntensity = Math.round(clamp01(beat?.emotion?.intensity ?? 0.5) * 100);
    const orientationText = getOrientationText(preset?.aspect);
    const sectionLabel = beat?.sectionLabel || beat?.sectionType || "scene";
    const cueText = Array.isArray(beat?.cues) && beat.cues.length ? beat.cues.join(", ") : "none";
    const ultraRealisticPrompt =
      `Ultra-realistic commercial video shot, ${orientationText}, platform-ready composition for ${preset?.primary || "social media"}. ` +
      `Scene ${index + 1} (${sectionLabel}), duration ${seconds}s, pacing ${beat?.pace || "balanced"}, emotion ${emotionName} at ${emotionIntensity}% intensity. ` +
      `AI influencer maintains natural eye contact, precise lip sync, subtle micro-expressions, realistic skin texture, and physically accurate lighting. ` +
      `Camera direction: ${getCameraDirection(beat, preset?.aspect)}. ` +
      `Lighting direction: ${getLightingDirection(beat)}. ` +
      `Effects/B-roll notes: ${cueText}. ` +
      `Voice direction: ${getVoiceDirection(beat)}. ` +
      `Mandatory spoken line: "${(beat?.text || "").trim()}". ` +
      `Final output must look like a real smartphone/cinema hybrid capture, no cartoon look, no waxy skin, no deformed hands, no text artifacts.`;

    return {
      beat: index + 1,
      durationSeconds: Number(seconds),
      sayText: (beat?.text || "").trim(),
      ultraRealisticPrompt,
      directorCommands: [
        `Bu bölümü yaklaşık ${seconds} saniyede tamamla; ritim: ${beat?.pace || "balanced"}.`,
        `Duygu tonu: ${emotionName}, yoğunluk: %${emotionIntensity}.`,
        `Ses kullanımı: ${getVoiceDirection(beat)}.`,
        `Kamera/telefon yönlendirmesi: ${getCameraDirection(beat, preset?.aspect)}.`,
        `Işık yönlendirmesi: ${getLightingDirection(beat)}.`,
        `Efekt/B-roll yönlendirmesi: ${getEffectDirection(beat)}.`,
      ],
    };
  }

  function downloadTpText() {
    const platforms = Array.isArray(projectContext?.platforms) ? projectContext.platforms.join(", ") : "-";
    const globalPack = [
      "AI Influencer Production Pack",
      `Platform: ${preset?.primary || "-"}`,
      `Multi-platform: ${platforms}`,
      `Aspect: ${preset?.aspect || "-"}`,
      `Goal: ${projectContext?.goal || "-"}`,
      `Content Type: ${projectContext?.contentType || "-"}`,
      `Tone: ${projectContext?.tone || "-"}`,
      `Beats: ${beats.length}`,
      `ExportedAt: ${new Date().toISOString()}`,
      "",
      "[Character Prompt]",
      "Marka için güven veren, profesyonel ama samimi bir AI influencer persona kullan.",
      "Yüz ifadesi canlı olsun, kamera ile doğrudan bağ kur, her cümlede niyet net olsun.",
      "",
      "[Voice Prompt]",
      "Türkçe akıcı telaffuz, kelime sonlarını yutma, vurgu noktalarını belirginleştir.",
      "Her beat süresine sadık kal; hızlı beatlerde enerjiyi yükselt, sakin beatlerde yumuşat.",
      "",
      "[Execution Rule]",
      "Aşağıdaki her beat'te yazan 'directorCommands' satırlarını birebir uygulayarak çekim üret.",
      "",
    ];

    const header = [
      ...globalPack,
      "",
    ];

    const body = beats
      .map((b, i) => {
        const pack = buildBeatCommandPack(b, i);
        const cues = Array.isArray(b?.cues) && b.cues.length ? b.cues.join(" | ") : "-";
        return [
          `Beat ${i + 1}/${beats.length}`,
          `Label: ${b?.label || "-"}`,
          `Duration: ${formatMs(b?.durationMs || 0)}`,
          `Section: ${b?.sectionLabel || "-"}`,
          `Emotion: ${b?.emotion?.name || "-"} (${Math.round(clamp01(b?.emotion?.intensity ?? 0.5) * 100)}%)`,
          `Cues: ${cues}`,
          `Ultra-Realistic Prompt:`,
          `${pack.ultraRealisticPrompt}`,
          "Director Commands:",
          ...pack.directorCommands.map((line, idx) => `${idx + 1}. ${line}`),
          `Text:`,
          `${b?.text || ""}`,
          "",
        ].join("\n");
      })
      .join("\n");

    downloadText("content-architect-v2.teleprompter.production-pack.txt", `${header.join("\n")}${body}`);
  }

  function downloadTpJson() {
    const platforms = Array.isArray(projectContext?.platforms) ? projectContext.platforms : [];
    const payload = {
      meta: {
        version: "content-architect-v2",
        exportedAt: new Date().toISOString(),
        platform: preset?.primary || null,
        aspect: preset?.aspect || null,
        beats: beats.length,
      },
      productionBlueprint: {
        objective: projectContext?.goal || null,
        contentType: projectContext?.contentType || null,
        tone: projectContext?.tone || null,
        platforms,
        characterPrompt:
          "Profesyonel, güven veren ve ikna gücü yüksek bir AI influencer olarak konuş. Kamera ile güçlü göz teması kur.",
        voicePrompt:
          "Net artikülasyon, beat süresine sadık ritim, önemli kelimelerde vurgu, CTA cümlelerinde kararlı ton.",
        lightingPrompt:
          "Yüzü temiz gösteren key/fill dengesi, ürün veya mesaj odaklı sahnelerde dikkat dağıtmayan arka plan.",
      },
      teleprompter: beats.map((b, i) => {
        const pack = buildBeatCommandPack(b, i);
        return {
          index: i + 1,
          label: b?.label || "",
          durationMs: b?.durationMs || 0,
          durationSeconds: pack.durationSeconds,
          text: b?.text || "",
          sayText: pack.sayText,
          cues: Array.isArray(b?.cues) ? b.cues : [],
          pace: b?.pace || null,
          intensityTag: b?.intensityTag || null,
          sectionType: b?.sectionType || null,
          sectionLabel: b?.sectionLabel || null,
          emotion: {
            name: b?.emotion?.name || null,
            intensity: clamp01(b?.emotion?.intensity ?? 0.5),
          },
          ultraRealisticPrompt: pack.ultraRealisticPrompt,
          directorCommands: pack.directorCommands,
        };
      }),
    };

    downloadText(
      "content-architect-v2.teleprompter.production-pack.json",
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stop();
        onClose?.();
        return;
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextBeat();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevBeat();
      } else if (e.key.toLowerCase() === "m") {
        setMirror((v) => !v);
      } else if (e.key.toLowerCase() === "d") {
        setShowCues((v) => !v);
      } else if (e.key.toLowerCase() === "c") {
        setHighContrast((v) => !v);
      } else if (e.key === "+" || e.key === "=") {
        setFontScale((v) => Math.min(1.6, Math.round((v + 0.1) * 10) / 10));
      } else if (e.key === "-" || e.key === "_") {
        setFontScale((v) => Math.max(0.8, Math.round((v - 0.1) * 10) / 10));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePlay, nextBeat, prevBeat, onClose, stop]);

  const rootStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: highContrast ? "#0b0b0c" : "#111113",
    color: highContrast ? "#f5f5f7" : "#e8e8ee",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  };

  const panelStyle = {
    position: "sticky",
    top: 0,
    zIndex: 10,
    backdropFilter: "blur(10px)",
    background: highContrast ? "rgba(11,11,12,0.82)" : "rgba(17,17,19,0.82)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const rowStyle = {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    flexWrap: "wrap",
  };

  const btn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
  };

  const pill = {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 13,
    fontWeight: 800,
  };

  const prompterStyle = {
    transform: mirror ? "scaleX(-1)" : "none",
    lineHeight: 1.25,
    fontSize: `${Math.round(34 * fontScale)}px`,
    letterSpacing: "0.2px",
    maxWidth: "980px",
    margin: "0 auto",
    padding: "28px 20px 40px",
    textAlign: "center",
    wordBreak: "break-word",
  };

  if (!beats.length) {
    return (
      <div style={rootStyle}>
        <div style={{ padding: 18 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>{tpT.teleprompter}</div>
          <div style={{ opacity: 0.85 }}>{tpT.noTimeMap}</div>
          <div style={{ marginTop: 12 }}>
            <button style={btn} onClick={onClose}>
              Exit to Main
            </button>
          </div>
        </div>
      </div>
    );
  }

  const emotionName = currentBeat?.emotion?.name || "—";
  const emotionIntensity = Math.round(clamp01(currentBeat?.emotion?.intensity ?? 0.5) * 100);

  const sectionType = currentBeat?.sectionType || "unknown";
  const sectionLabel = currentBeat?.sectionLabel || "—";
  const sectionColor = SECTION_COLORS[sectionType] || SECTION_COLORS.unknown;

  const flowTextColor = getFlowTextColor(currentBeat?.text);

  return (
    <div style={rootStyle}>
      <div style={panelStyle}>
        <div style={rowStyle}>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
              minWidth: 320,
              flex: "1 1 560px",
            }}
          >
            <span style={pill}>
              {tpT.teleprompter} · {preset?.primary || "—"} · {preset?.aspect || "—"}
            </span>

            <span style={{ ...pill, borderColor: `${sectionColor}55`, color: sectionColor }}>{sectionLabel}</span>

            <span style={pill}>
              Beat: {beatIndex + 1}/{totalBeats} · <b style={{ fontWeight: 950 }}>{currentBeat?.label || "—"}</b>
            </span>

            <span style={pill}>
              {formatMs(durationMs)} · {tpT.left}: <b style={{ fontWeight: 950 }}>{formatMs(remainingMs)}</b>
            </span>

            <span style={pill}>
              {tpT.emotion}: <b style={{ fontWeight: 950 }}>{emotionName}</b> · {tpT.intensity}:{" "}
              <b style={{ fontWeight: 950 }}>%{emotionIntensity}</b>
            </span>

            {showCues && (
              <span
                style={{
                  ...pill,
                  flex: "1 1 560px",
                  borderRadius: 14,
                  whiteSpace: "normal",
                  overflow: "visible",
                  textOverflow: "unset",
                  lineHeight: 1.25,
                }}
              >
                🎬{" "}
                {Array.isArray(currentBeat?.cues) && currentBeat.cues.length
                  ? currentBeat.cues.join(" · ")
                  : tpT.noCues}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button style={btn} onClick={prevBeat} title="←">
              {tpT.prev}
            </button>
            <button style={btn} onClick={togglePlay} title="Space">
              {isPlaying ? tpT.pause : tpT.play}
            </button>
            <button style={btn} onClick={nextBeat} title="→">
              {tpT.next}
            </button>
            <button style={btn} onClick={() => setMirror((v) => !v)} title="M">
              {tpT.mirror}: {mirror ? "On" : "Off"}
            </button>
            <button style={btn} onClick={() => setShowCues((v) => !v)} title="D">
              {tpT.cues}: {showCues ? "On" : "Off"}
            </button>
            <button style={btn} onClick={() => setHighContrast((v) => !v)} title="C">
              {tpT.contrast}: {highContrast ? "High" : "Normal"}
            </button>
            <button style={btn} onClick={copyCurrentText}>
              Copy
            </button>
            <button style={btn} onClick={downloadTpText}>
              {tpT.downloadTpTxt}
            </button>
            <button style={btn} onClick={downloadTpJson}>
              {tpT.downloadTpJson}
            </button>
            <button style={btn} onClick={requestFullscreen}>
              {tpT.fullscreen}
            </button>
            <button style={btn} onClick={exitFullscreen}>
              {tpT.exitFs}
            </button>
            <button
              style={{ ...btn, borderColor: "rgba(255,255,255,0.22)" }}
              onClick={() => {
                stop();
                onClose?.();
              }}
            >
              Exit to Main
            </button>
          </div>
        </div>

        <div style={{ height: 6, background: "rgba(255,255,255,0.08)" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.round(progress * 100)}%`,
              background: "rgba(255,255,255,0.75)",
              transition: prefersReducedMotion() ? "none" : "width 80ms linear",
            }}
          />
        </div>

        <div style={{ padding: "6px 12px 10px", display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{tpT.shortcuts}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>{tpT.speedLocked}</div>
        </div>
      </div>

      <div style={prompterStyle}>
        <div style={{ opacity: 0.78, fontSize: Math.round(32 * fontScale), marginBottom: 14 }}>
          {currentBeat?.label || "—"} · {formatMs(durationMs)} ·{" "}
          <span style={{ color: sectionColor, fontWeight: 900 }}>{sectionLabel}</span> · Pace: {currentBeat?.pace || "—"} · Tag:{" "}
          {currentBeat?.intensityTag || "—"}
        </div>
        <div style={{ fontWeight: 900, color: flowTextColor || "inherit" }}>{currentBeat?.text || ""}</div>
      </div>
    </div>
  );
}

/* ----------------------------- Auth modal (Password login + Signup profile fields) ------------------------------ */
function AuthModal({ t, open, onClose, onSignedIn }) {
  const [tab, setTab] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("prefer_not");
  const [birthYear, setBirthYear] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setMsg("");
    setBusy(false);
  }, [open]);

  if (!open) return null;

  const wrapStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 10000, // ✅ avoid TP overlay collision
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    padding: 14,
  };

  const cardStyle = {
    width: "min(720px, 100%)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(18,18,20,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
    color: "rgba(255,255,255,0.94)",
    overflow: "hidden",
  };

  const headerStyle = {
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const bodyStyle = { padding: 16, display: "grid", gap: 12 };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "inherit",
    outline: "none",
    fontWeight: 800,
  };

  const btn = {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 900,
  };

  const btnPrimary = { ...btn, borderColor: "rgba(0,122,255,0.50)", background: "rgba(0,122,255,0.18)" };

  const tabBtn = (active) => ({
    ...btn,
    padding: "8px 10px",
    borderRadius: 999,
    background: active ? "rgba(0,122,255,0.18)" : "rgba(255,255,255,0.05)",
    borderColor: active ? "rgba(0,122,255,0.50)" : "rgba(255,255,255,0.10)",
  });

  const parseSupabaseAuthError = (e) => {
    const s = String(e?.message || e || "");
    const lower = s.toLowerCase();
    if (lower.includes("rate limit") || lower.includes("too many")) return t.rateLimited;
    if (lower.includes("invalid login") || lower.includes("invalid") || lower.includes("credentials")) return t.wrongCreds;
    return s || "Auth error";
  };

  async function handleSignIn() {
    setBusy(true);
    setMsg("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;

      const user = data?.user || null;
      if (user && !user.email_confirmed_at && !user.confirmed_at) {
        setMsg(t.confirmRequired);
        return;
      }

      setMsg(t.signedIn);
      onSignedIn?.();
      onClose?.();
    } catch (e) {
      setMsg(parseSupabaseAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp() {
    setBusy(true);
    setMsg("");
    try {
      const by = Number(birthYear);
      if (!email.trim() || !password) {
        setMsg("Missing email/password");
        return;
      }
      if (birthYear && (Number.isNaN(by) || by < 1900 || by > new Date().getFullYear())) {
        setMsg("Invalid birth year");
        return;
      }

      localStorage.setItem(
        LS_PENDING_PROFILE,
        JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender: gender === "prefer_not" ? null : gender,
          birth_year: birthYear ? by : null,
          createdAt: new Date().toISOString(),
        })
      );

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;

      setMsg(t.checkInboxConfirm);
    } catch (e) {
      setMsg(parseSupabaseAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setBusy(true);
    setMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin });
      if (error) throw error;
      setMsg(t.resetSent);
    } catch (e) {
      setMsg(parseSupabaseAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={wrapStyle} onMouseDown={onClose}>
      <div style={cardStyle} onMouseDown={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <KeyRound size={18} />
            </span>

            <div style={{ display: "grid" }}>
              <div style={{ fontWeight: 950 }}>{t.authTitle}</div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Email + Password · Confirm required</div>
            </div>
          </div>

          <button style={btn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <button style={tabBtn(tab === "signin")} onClick={() => setTab("signin")}>
            <LogIn size={16} /> {t.signIn}
          </button>
          <button style={tabBtn(tab === "signup")} onClick={() => setTab("signup")}>
            <UserPlus size={16} /> {t.signUp}
          </button>
          <button style={tabBtn(tab === "reset")} onClick={() => setTab("reset")}>
            <KeyRound size={16} /> {t.resetPw}
          </button>
        </div>

        <div style={bodyStyle}>
          <div style={{ display: "grid", gap: 8 }}>
            <label style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>{t.email}</label>
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" />
          </div>

          {(tab === "signin" || tab === "signup") && (
            <div style={{ display: "grid", gap: 8 }}>
              <label style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>{t.password}</label>
              <input
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
              />
            </div>
          )}

          {tab === "signup" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>{t.firstName}</label>
                  <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>{t.lastName}</label>
                  <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>{t.gender}</label>
                  <select style={inputStyle} value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="prefer_not">{t.genderPrefer}</option>
                    <option value="male">{t.genderMale}</option>
                    <option value="female">{t.genderFemale}</option>
                  </select>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ fontSize: 12, opacity: 0.85, fontWeight: 900 }}>{t.birthYear}</label>
                  <input style={inputStyle} value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="e.g. 1981" />
                </div>
              </div>

              <div style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.35 }}>
                We’ll store these details in your profile after email confirmation + first sign-in.
              </div>
            </>
          )}

          {msg && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.05)",
                fontWeight: 800,
              }}
            >
              {msg}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button style={btn} onClick={onClose} disabled={busy}>
              Cancel
            </button>

            {tab === "signin" && (
              <button style={btnPrimary} onClick={handleSignIn} disabled={busy}>
                {busy ? "..." : t.signIn}
              </button>
            )}

            {tab === "signup" && (
              <button style={btnPrimary} onClick={handleSignUp} disabled={busy}>
                {busy ? "..." : t.createAccount}
              </button>
            )}

            {tab === "reset" && (
              <button style={btnPrimary} onClick={handleReset} disabled={busy}>
                {busy ? "..." : t.sendReset}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Router Top Nav (premium) ------------------------------ */
function TopNav({ t, authUser, profile, onOpenAuth, onLogout }) {
  const loc = useLocation();
  const isActive = (path) => (loc.pathname === path ? "nav-on" : "");
  const credits = Number(profile?.credits ?? 0);
  const paid = !!profile?.is_paid;

  return (
    <div className="topnav">
      <div className="topnav-left">
        <Link className={"navlink " + isActive("/")} to="/">
          {t.app}
        </Link>
        <Link className={"navlink " + isActive("/account")} to="/account">
          {t.account}
        </Link>

        <span className="navmeta">
          <span className="dot" />
          {authUser ? (
            <>
              {authUser.email} • Paid: {paid ? "✅" : "—"} • Credits: {credits}
            </>
          ) : (
            <>{t.guest}</>
          )}
        </span>
      </div>

      <div className="topnav-right">
        {authUser ? (
          <button className="btn" onClick={onLogout}>
            <LogOut size={16} /> {t.logout}
          </button>
        ) : (
          <button className="btn" onClick={onOpenAuth}>
            <LogIn size={16} /> {t.login}
          </button>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Premium Account Dashboard ------------------------------ */
function AccountPage({ t, authUser, profile, refreshProfile }) {
  const paid = !!profile?.is_paid;
  const credits = profile?.credits ?? 0;
  const plan = profile?.plan || "free";

  const shell = { maxWidth: 1080, margin: "18px auto 60px", padding: "0 14px" };
  const hero = {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
    padding: "18px 18px",
  };
  const grid = { display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginTop: 14 };
  const card = { borderRadius: 18, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)", padding: 16 };
  const pill = (tone) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background:
      tone === "good" ? "rgba(81,207,102,0.14)" : tone === "warn" ? "rgba(255,193,7,0.12)" : "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 900,
    fontSize: 12,
  });
  const bigNum = { fontSize: 44, fontWeight: 950, letterSpacing: "-0.02em", marginTop: 10 };
  const small = { fontSize: 12, opacity: 0.78, fontWeight: 800, lineHeight: 1.35 };

  return (
    <div style={shell}>
      <div style={hero}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 950, fontSize: 18 }}>{t.account}</div>
            <div style={small}>Premium dashboard · Credits & plan</div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill(paid ? "good" : "warn")}>
              Plan: <b style={{ fontWeight: 950 }}>{plan}</b>
            </span>
            <span style={pill(paid ? "good" : "warn")}>
              Paid: <b style={{ fontWeight: 950 }}>{paid ? "Yes" : "No"}</b>
            </span>
            <button className="btn btn-ghost" onClick={refreshProfile}>
              Refresh
            </button>
          </div>
        </div>

        {!authUser ? (
          <div style={{ marginTop: 12, ...small }}>Not logged in.</div>
        ) : (
          <div style={grid}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={small}>Credits</div>
                  <div style={bigNum}>{credits}</div>
                </div>

                <div style={{ minWidth: 240 }}>
                  <div style={small}>Email</div>
                  <div style={{ fontWeight: 900, marginTop: 8 }}>{authUser.email}</div>
                  <div style={{ marginTop: 6, ...small, maxWidth: 520, overflow: "hidden", textOverflow: "ellipsis" }}>
                    User ID: {authUser.id}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                <div style={{ ...small }}>
                  Note: Secure credit enforcement should be finalized server-side (atomic decrement via DB RPC). Current UI displays live values from profile.
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 950, marginBottom: 8 }}>Usage analytics (next)</div>
              <div style={small}>
                In the next step we’ll add:
                <ul style={{ margin: "8px 0 0 18px" }}>
                  <li>Credits usage timeline</li>
                  <li>Draft vs revise counts</li>
                  <li>Top platforms / content types</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------- Main App (editor) ------------------------------ */
function MainApp({ t, authUser, profile, refreshProfile, onUILanguageChange }) {
  const [state, setState] = useState(() => ({
    platforms: ["LinkedIn"],
    uiLanguage: "Turkish",
    outputLanguage: "Turkish",
    aspectRatio: "9:16",
    inventory: {
      capture: ["Phone"],
      lenses: ["Standard"],
      lights: ["Window Light"],
      audio: ["Phone Mic"],
      stabilization: ["Tripod"],
    },
    durationSec: 45,
    goal: "Sales",
    tone: "Balanced",
    contentType: "Product Review",
    tempoPreset: "balanced",
    brief: "",
    script: "",
  }));

  // ✅ TP language derived from outputLanguage (not hard-coded)
  const tpKey = useMemo(() => tpLocaleFromOutput(state.outputLanguage), [state.outputLanguage]);
  const tpT = UI_LOCALES[tpKey];

  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [teleprompterOpen, setTeleprompterOpen] = useState(false);

  const [serverHealth, setServerHealth] = useState(null);
  const [guideline, setGuideline] = useState(null);

  const [scenes, setScenes] = useState([]);
  const [tempoMap, setTempoMap] = useState([]);
  const [needsList, setNeedsList] = useState([]);
  const [directorCards, setDirectorCards] = useState([]);
  const [bRoll, setBRoll] = useState([]);
  const [timeline, setTimeline] = useState(null);

  const [reviseNote, setReviseNote] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);

  const fileInputRef = useRef(null);

  const displayLang = state.outputLanguage || state.uiLanguage;

  const preset = useMemo(
    () => derivePreset(state.platforms, state.durationSec, state.tempoPreset, state.aspectRatio),
    [state.platforms, state.durationSec, state.tempoPreset, state.aspectRatio]
  );

  const invText = useMemo(() => inventorySummaryText(state.inventory, "indoor"), [state.inventory]);

  const kpis = useMemo(() => {
    const wc = wordCount(state.script);
    const sentences = splitIntoSentences(state.script).length;
    return { wc, sentences };
  }, [state.script]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = safeJsonParse(raw);
    if (!data) return;

    if (data.state) setState(data.state);
    if (data.provider) setProvider(data.provider);
    if (data.model) setModel(data.model);
    if (typeof data.temperature === "number") setTemperature(data.temperature);
    if (typeof data.sidebarOpen === "boolean") setSidebarOpen(data.sidebarOpen);
  }, []);

  useEffect(() => {
    // ✅ snapshot store
    localStorage.setItem(LS_KEY, JSON.stringify({ state, provider, model, temperature, sidebarOpen }));
  }, [state, provider, model, temperature, sidebarOpen]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/health");
        const data = await r.json();
        setServerHealth(data);
      } catch {
        setServerHealth({ ok: false });
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const g = await loadGuideline(preset.primary);
      setGuideline(g);
    })();
  }, [preset.primary]);

  useEffect(() => {
    if (!state.script.trim()) {
      setScenes([]);
      setTempoMap([]);
      setNeedsList([]);
      setDirectorCards([]);
      setBRoll([]);
      setTimeline(null);
      return;
    }

    const sc = splitScenesStrict(state.script);
    const tm = buildTempoMap(state.script, state.tempoPreset);
    const needs = buildNeedsList(state.inventory, "indoor");
    const dt = buildDirectorTouch(state.inventory, preset, "indoor");
    const br = buildBRollBeatList(sc, state.inventory, preset, "indoor");
    const tl = buildTimeline(tm, br, state.durationSec);

    setScenes(sc);
    setTempoMap(tm);
    setNeedsList(needs);
    setDirectorCards(dt);
    setBRoll(br);
    setTimeline(tl);
  }, [state.script, state.inventory, state.tempoPreset, state.durationSec, preset]);

  const teleTimeMap = useMemo(() => buildTeleprompterTimeMap(tempoMap, preset, tpKey), [tempoMap, preset, tpKey]);

  function resetAll() {
    if (!confirm(t.resetConfirm)) return;
    localStorage.removeItem(LS_KEY);

    setState({
      platforms: ["LinkedIn"],
      uiLanguage: "Turkish",
      outputLanguage: "Turkish",
      aspectRatio: "9:16",
      inventory: {
        capture: ["Phone"],
        lenses: ["Standard"],
        lights: ["Window Light"],
        audio: ["Phone Mic"],
        stabilization: ["Tripod"],
      },
      durationSec: 45,
      goal: "Sales",
      tone: "Balanced",
      contentType: "Product Review",
      tempoPreset: "balanced",
      brief: "",
      script: "",
    });

    setProvider("openai");
    setModel("gpt-4o-mini");
    setTemperature(0.7);
    setReviseNote("");
    showToast(t.downloaded);
  }

  function exportProjectJson() {
    const payload = {
      meta: { version: "content-architect-v2", exportedAt: new Date().toISOString() },
      state,
      ai: { provider, model, temperature },
      derived: { preset, guideline, scenes, tempoMap, needsList, directorCards, bRoll, timeline },
    };
    downloadText("content-architect-v2.project.json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    showToast(t.downloaded);
  }

  async function copyProjectJson() {
    const payload = { state, ai: { provider, model, temperature }, derived: { preset, guideline, scenes, tempoMap, needsList, directorCards, bRoll, timeline } };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    showToast(t.copied);
  }

  async function importProjectJson(file) {
    const text = await file.text();
    const data = safeJsonParse(text);
    if (!data) return;

    if (data.state) setState(data.state);
    if (data.ai?.provider) setProvider(data.ai.provider);
    if (data.ai?.model) setModel(data.ai.model);
    if (typeof data.ai?.temperature === "number") setTemperature(data.ai.temperature);

    showToast(t.imported);
  }

  function exportTimelineXml() {
    if (!timeline) return;
    downloadText("content-architect-v2.timeline.xml", timelineToXml(timeline), "application/xml;charset=utf-8");
    showToast(t.downloaded);
  }

  async function callGenerate({ mode }) {
    const hasScript = state.script.trim();
    if (mode === "revise" && !hasScript) {
      showToast(t.noScript);
      return "";
    }

    const system = buildSystemPrompt({
      displayLang,
      platforms: state.platforms,
      preset,
      goal: state.goal,
      contentType: state.contentType,
      tempoPreset: state.tempoPreset,
      inventoryText: invText,
      durationSec: state.durationSec,
      guidelineSnippet: guideline,
    });

    const user =
      mode === "revise"
        ? buildReviseUserMessage({ currentScript: state.script, reviseNote, brief: state.brief })
        : buildDraftUserMessage({ brief: state.brief });

    const session = (await supabase.auth.getSession())?.data?.session || null;
    const accessToken = session?.access_token || "";

    const payload = {
      provider,
      model,
      temperature,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    };

    const r = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok || !data?.ok) throw new Error(data?.error || "Generate failed");
    return (data.text || "").trim();
  }

  function ensureAccess() {
    if (!authUser) {
      showToast(`${t.accessRequired}: ${t.accessLogin}`);
      return false;
    }
    if (!profile?.is_paid) {
      showToast(`${t.accessRequired}: ${t.accessPaid}`);
      return false;
    }
    if ((profile?.credits ?? 0) <= 0) {
      showToast(`${t.accessRequired}: ${t.accessCredits}`);
      return false;
    }
    return true;
  }

  async function generateDraft() {
    if (!ensureAccess()) return;
    setIsGenerating(true);
    try {
      const text = await callGenerate({ mode: "draft" });
      setState((s) => ({ ...s, script: text }));
      showToast(t.generated);
      refreshProfile?.();
    } catch (e) {
      showToast(String(e?.message || e));
    } finally {
      setIsGenerating(false);
    }
  }

  async function reviseScript() {
    if (!ensureAccess()) return;
    if (!state.script.trim()) {
      showToast(t.noScript);
      return;
    }

    setIsRevising(true);
    try {
      const text = await callGenerate({ mode: "revise" });
      setState((s) => ({ ...s, script: text }));
      showToast(t.revised);
      refreshProfile?.();
    } catch (e) {
      showToast(String(e?.message || e));
    } finally {
      setIsRevising(false);
    }
  }

  const [timeMapShowAll, setTimeMapShowAll] = useState(true);

  return (
    <div className="app-shell">
      {teleprompterOpen && (
        <TeleprompterOverlay
          tpT={tpT}
          tpKey={tpKey}
          preset={preset}
          timeMap={teleTimeMap}
          projectContext={{
            platforms: state.platforms,
            goal: state.goal,
            contentType: state.contentType,
            tone: state.tone,
          }}
          onClose={() => setTeleprompterOpen(false)}
        />
      )}

      <div className="topbar">
        <div className="brand">
          <span className="brand-badge">
            <Sparkles size={18} /> {t.appTitle}
          </span>
          <span className="subtle">{t.subtitle}</span>
        </div>

        <div className="row">
          <button className="btn btn-green" onClick={() => setTeleprompterOpen(true)} disabled={!tempoMap.length}>
            <Film size={16} /> {t.openTeleprompter}
          </button>

          <button className="btn" onClick={() => setSidebarOpen((v) => !v)}>
            {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />} {sidebarOpen ? t.hide : t.show}
          </button>

          <button className="btn btn-ghost" onClick={() => showToast(t.snapshot)}>
            <Save size={16} /> {t.snapshot}
          </button>

          <button className="btn btn-danger" onClick={resetAll}>
            <Trash2 size={16} /> {t.reset}
          </button>
        </div>
      </div>

      <div className="editor-grid">
        {/* LEFT PANEL */}
        <div className="panel">
          <div className="step-indicator">
            <div className="info-tag">{t.outputRule}</div>

            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="row">
                <Badge tone="blue">
                  <BookOpen size={14} /> {preset.primary}
                </Badge>
                <Badge>
                  <Gauge size={14} /> {state.tone}
                </Badge>
                <Badge>{state.contentType}</Badge>
                <Badge>
                  {state.uiLanguage} → {displayLang}
                </Badge>
                <Badge>{state.aspectRatio}</Badge>
              </div>
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <Badge>
                <ShieldCheck size={14} /> {t.keysServerOnly}
              </Badge>
              <Badge>
                <Server size={14} /> {serverHealth?.ok ? t.serverOk : t.serverOff}
              </Badge>
              <Badge>
                OpenAI: {serverHealth?.providers?.openai ? "✅" : "—"} • Anthropic: {serverHealth?.providers?.anthropic ? "✅" : "—"} • Gemini:{" "}
                {serverHealth?.providers?.gemini ? "✅" : "—"}
              </Badge>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <SectionTitle icon={<Settings size={18} />} title="Core" right={<Badge tone="blue">{t.presets}</Badge>} />

            <div className="row">
              <div className="field" style={{ minWidth: 360 }}>
                <label>
                  {t.platform} — <span className="small">{t.platformSelectHelp}</span>
                </label>

                <div className="row" style={{ gap: 8 }}>
                  {PLATFORM_OPTIONS.map((p) => (
                    <Chip
                      key={p}
                      active={state.platforms.includes(p)}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          platforms: s.platforms.includes(p) ? s.platforms.filter((x) => x !== p) : [...s.platforms, p],
                        }))
                      }
                    >
                      {p}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>{t.aspectRatio}</label>
                <select value={state.aspectRatio} onChange={(e) => setState((s) => ({ ...s, aspectRatio: e.target.value }))}>
                  {ASPECT_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>{t.goal}</label>
                <select value={state.goal} onChange={(e) => setState((s) => ({ ...s, goal: e.target.value }))}>
                  <option>Sales</option>
                  <option>Leads</option>
                  <option>Traffic</option>
                  <option>Brand</option>
                  <option>Education</option>
                  <option>Authority</option>
                </select>
              </div>

              <div className="field">
                <label>{t.contentType}</label>
                <select value={state.contentType} onChange={(e) => setState((s) => ({ ...s, contentType: e.target.value }))}>
                  <option>Product Review</option>
                  <option>Education / Tutorial</option>
                  <option>Unboxing</option>
                  <option>Promo Video</option>
                  <option>Landing Video</option>
                  <option>Podcast Clip</option>
                  <option>Storytime</option>
                </select>
              </div>

              <div className="field">
                <label>{t.duration} (sec)</label>
                <input
                  type="text"
                  value={state.durationSec}
                  onChange={(e) => setState((s) => ({ ...s, durationSec: clamp(Number(e.target.value) || 0, 5, 7200) }))}
                  placeholder="e.g. 45"
                />
                <div className="small">{preset.structureHint}</div>
              </div>

              <div className="field">
                <label>{t.tempo}</label>
                <select value={state.tempoPreset} onChange={(e) => setState((s) => ({ ...s, tempoPreset: e.target.value }))}>
                  <option value="fast_aggressive">Fast / Aggressive</option>
                  <option value="balanced">Balanced</option>
                  <option value="calm_cinematic">Calm / Cinematic</option>
                </select>
              </div>

              <div className="field">
                <label>{t.inputLang}</label>
                <select
                  value={state.uiLanguage}
                  onChange={(e) => {
                    const v = e.target.value;
                    setState((s) => ({ ...s, uiLanguage: v }));
                    onUILanguageChange?.(v);
                  }}
                >
                  <option>Turkish</option>
                  <option>English</option>
                  <option>German</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>Italian</option>
                  <option>Arabic</option>
                </select>
              </div>

              <div className="field">
                <label>{t.outputLang}</label>
                <select value={state.outputLanguage} onChange={(e) => setState((s) => ({ ...s, outputLanguage: e.target.value }))}>
                  <option>Turkish</option>
                  <option>English</option>
                  <option>German</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>Italian</option>
                  <option>Arabic</option>
                </select>
              </div>
            </div>

            <div className="hr" />

            <div className="row">
              <div className="field" style={{ minWidth: 520, width: "100%" }}>
                <label>Brief</label>
                <textarea
                  rows={5}
                  value={state.brief}
                  onChange={(e) => setState((s) => ({ ...s, brief: e.target.value }))}
                  placeholder="1-2 sentences: what is this video about?"
                  style={{ minHeight: "unset", resize: "vertical" }}
                />
              </div>

              <div className="field" style={{ minWidth: 420, flex: 1 }}>
                <label>{t.noteOptional}</label>
                <input value={reviseNote} onChange={(e) => setReviseNote(e.target.value)} placeholder={t.notePlaceholder} />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <SectionTitle icon={<Camera size={18} />} title={t.inventory} right={<Badge tone="blue">{invText}</Badge>} />

            <div className="inv-grid">
              {/* Capture */}
              <div className="inv-col">
                <div className="inv-title">
                  <Camera size={16} /> Capture
                </div>
                {INV.capture.map((v) => (
                  <div key={v} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.capture.includes(v)}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          inventory: { ...s.inventory, capture: toggle(s.inventory.capture, v) },
                        }))
                      }
                    />
                    <span>{v}</span>
                  </div>
                ))}
              </div>

              {/* Lenses */}
              <div className="inv-col">
                <div className="inv-title">
                  <Aperture size={16} /> Lenses
                </div>
                {INV.lenses.map((v) => (
                  <div key={v} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.lenses.includes(v)}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          inventory: { ...s.inventory, lenses: toggle(s.inventory.lenses, v) },
                        }))
                      }
                    />
                    <span>{v}</span>
                  </div>
                ))}
              </div>

              {/* Lights (None rule) */}
              <div className="inv-col">
                <div className="inv-title">
                  <Lightbulb size={16} /> Lights
                </div>
                {INV.lights.map((v) => (
                  <div key={v} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.lights.includes(v)}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          inventory: { ...s.inventory, lights: setNoneRule(s.inventory.lights, v) },
                        }))
                      }
                    />
                    <span>{v}</span>
                  </div>
                ))}
              </div>

              {/* Audio (None rule) */}
              <div className="inv-col">
                <div className="inv-title">
                  <Mic size={16} /> Audio
                </div>
                {INV.audio.map((v) => (
                  <div key={v} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.audio.includes(v)}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          inventory: { ...s.inventory, audio: setNoneRule(s.inventory.audio, v) },
                        }))
                      }
                    />
                    <span>{v}</span>
                  </div>
                ))}
              </div>

              {/* Stabilization */}
              <div className="inv-col">
                <div className="inv-title">
                  <Smartphone size={16} /> Stabilization
                </div>
                {INV.stabilization.map((v) => (
                  <div key={v} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.stabilization.includes(v)}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          inventory: { ...s.inventory, stabilization: toggle(s.inventory.stabilization, v) },
                        }))
                      }
                    />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="small" style={{ marginTop: 10, opacity: 0.85 }}>
              Inventory changes instantly affect Director Touch, Needs List, B-roll beats, and the AI prompt constraints.
            </div>
          </div>

          <div className="row" style={{ justifyContent: "space-between", margin: "10px 0 12px" }}>
            <button className="btn btn-green" onClick={generateDraft} disabled={isGenerating || isRevising}>
              <Server size={16} /> {isGenerating ? "..." : t.generate}
            </button>

            <button className="btn btn-green" onClick={reviseScript} disabled={isGenerating || isRevising || !state.script.trim()}>
              <RefreshCcw size={16} /> {isRevising ? "..." : t.revise}
            </button>

            <div className="row">
              <button className="btn" onClick={copyProjectJson} disabled={!state.script.trim()}>
                <ClipboardCopy size={16} /> Copy JSON
              </button>

              <button className="btn" onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} /> {t.importJson}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) await importProjectJson(f);
                  e.target.value = "";
                }}
              />

              <button className="btn btn-green" onClick={exportProjectJson}>
                <FileJson size={16} /> {t.exportJson}
              </button>

              <button className="btn" onClick={exportTimelineXml} disabled={!timeline}>
                <FileCode2 size={16} /> {t.exportXml}
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <SectionTitle
              icon={<BookOpen size={18} />}
              title={t.script}
              right={
                <div className="row">
                  <Badge>Words: {kpis.wc}</Badge>
                  <Badge>Sentences: {kpis.sentences}</Badge>
                </div>
              }
            />
            <textarea
              value={state.script}
              onChange={(e) => setState((s) => ({ ...s, script: e.target.value }))}
              placeholder="Hook / Scene 1 / Transition / Scene 2 / CTA ..."
            />
          </div>

          <div className="card">
            <SectionTitle
              icon={<Film size={18} />}
              title={t.timeMap}
              right={
                <div className="row">
                  <Badge tone="blue">{t.timeMapFix}</Badge>
                  <button className="btn btn-ghost" onClick={() => setTimeMapShowAll((v) => !v)}>
                    {timeMapShowAll ? "Show less" : "Show all"}
                  </button>
                </div>
              }
            />

            {!tempoMap.length ? (
              <div className="small">{t.noScript}</div>
            ) : (
              <div className="time-map" style={{ maxHeight: 420, overflowY: "auto" }}>
                {(timeMapShowAll ? tempoMap : tempoMap.slice(0, 12)).map((s) => (
                  <div key={s.id} className="time-row">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div className="row">
                        <Badge tone="blue">#{s.idx}</Badge>
                        <Badge>Pace: {s.pace}</Badge>
                        <Badge tone={s.intensity === "emphatic" ? "green" : s.intensity === "soft" ? "warn" : "default"}>
                          Intensity: {s.intensity}
                        </Badge>
                      </div>
                      <Badge>{s.durationSec}s</Badge>
                    </div>

                    <div style={{ marginTop: 6 }}>{s.text}</div>
                    <div className="small" style={{ marginTop: 6, opacity: 0.8 }}>
                      Section: {s.sectionLabel || "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {timeline && (
              <div className="row" style={{ justifyContent: "space-between", marginTop: 10 }}>
                <Badge>
                  Total: {timeline.totalDurationSec}s (Target {timeline.targetDurationSec}s) • Δ {timeline.deltaSec > 0 ? "+" : ""}
                  {timeline.deltaSec}s
                </Badge>
                <Badge>
                  A-Roll: {timeline.tracks.aRoll.length} • B-Roll: {timeline.tracks.bRoll.length}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL / SIDEBAR */}
        <div className={"panel " + (sidebarOpen ? "" : "sidebar-collapsed")}>
          <div className="step-indicator">
            <div className="info-tag">Inventory-aware outputs</div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <Badge>
                <Settings size={14} /> Sidebar
              </Badge>
              <Badge tone="blue">{preset.primary}</Badge>
            </div>
          </div>

          <div className="info-tag">Needs List</div>
          <div className="card" style={{ marginBottom: 12 }}>
            <ul className="card-items">
              {needsList.map((n) => (
                <li key={n.id}>
                  <b>{n.category}:</b> {n.have} — <span className="small">{n.suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="info-tag">Director Touch</div>
          <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
            {directorCards.map((c, idx) => (
              <div key={idx} className="card">
                <div className="card-title">
                  <span>{c.title}</span>
                  <Badge>{c.tag}</Badge>
                </div>
                <ul className="card-items">
                  {c.items.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="info-tag">B-roll beat list</div>
          {!bRoll.length ? (
            <div className="small">{t.noScript}</div>
          ) : (
            <div className="broll-list" style={{ maxHeight: 520, overflowY: "auto" }}>
              {bRoll.map((b) => (
                <div key={b.id} className="b-roll-card">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <Badge tone="green">
                      <Video size={14} /> {b.shotType}
                    </Badge>
                    <Badge>{b.durationSec}s</Badge>
                  </div>

                  <div style={{ marginTop: 8, fontWeight: 900 }}>{b.sceneTitle}</div>
                  <div className="small" style={{ marginTop: 6 }}>
                    {b.instruction}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="hr" />

          <div className="info-tag">Quick note</div>
          <div className="card">
            <div className="row" style={{ gap: 8 }}>
              <AlertTriangle size={16} />
              <b>Scene parsing</b>
            </div>
            <div className="small" style={{ marginTop: 8 }}>
              {t.timeMapFix}
            </div>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <style>{`
        .topnav{
          position: sticky;
          top: 0;
          z-index: 9998;
          display:flex;
          justify-content: space-between;
          align-items:center;
          gap: 12px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(16,16,18,0.78);
          backdrop-filter: blur(10px);
        }
        .topnav-left{ display:flex; align-items:center; gap: 12px; flex-wrap: wrap; }
        .topnav-right{ display:flex; align-items:center; gap: 10px; }
        .navlink{
          text-decoration:none;
          color: rgba(255,255,255,0.92);
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
        }
        .navlink:hover{ background: rgba(255,255,255,0.06); }
        .nav-on{ border-color: rgba(0,122,255,0.45); background: rgba(0,122,255,0.14); color: #cfe7ff; }
        .navmeta{
          opacity: 0.85;
          font-size: 12px;
          font-weight: 900;
          display:flex;
          align-items:center;
          gap: 8px;
          padding: 0 6px;
        }
        .dot{ width: 6px; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.65); display:inline-block; }

        /* Minimal shared styles (your existing CSS can override these) */
        .row{ display:flex; align-items:center; gap: 10px; flex-wrap: wrap; }
        .btn{
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.92);
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 900;
        }
        .btn:hover{ background: rgba(255,255,255,0.08); }
        .btn-ghost{ background: rgba(255,255,255,0.04); }
        .btn-danger{ border-color: rgba(255, 99, 99, 0.35); }
        .btn-green{ border-color: rgba(81,207,102,0.35); }

        .badge{
          display:inline-flex;
          align-items:center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.92);
          font-size: 12px;
          font-weight: 900;
          white-space: nowrap;
        }
        .badge-blue{ border-color: rgba(0,122,255,0.45); background: rgba(0,122,255,0.14); color: #cfe7ff; }
        .badge-green{ border-color: rgba(81,207,102,0.45); background: rgba(81,207,102,0.14); }
        .badge-warn{ border-color: rgba(255,193,7,0.45); background: rgba(255,193,7,0.12); }

        .chip{
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.92);
          padding: 8px 10px;
          border-radius: 999px;
          font-weight: 900;
          cursor: pointer;
        }
        .chip:hover{ background: rgba(255,255,255,0.06); }
        .chip-on{ border-color: rgba(0,122,255,0.45); background: rgba(0,122,255,0.14); color: #cfe7ff; }

        .inv-grid{ display:grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 12px; margin-top: 10px; }
        @media (max-width: 980px){ .inv-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
        .inv-col{ border: 1px solid rgba(255,255,255,0.10); background: rgba(255,255,255,0.03); border-radius: 12px; padding: 10px; }
        .inv-title{ display:flex; align-items:center; gap:8px; font-weight: 950; margin-bottom: 8px; }
        .inv-row{ display:flex; align-items:center; gap:8px; padding: 6px 2px; color: rgba(255,255,255,0.92); font-weight: 800; }

        .time-map .time-row{
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 10px;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
}

/* ----------------------------- Root Router App ------------------------------ */
export default function App() {
  const [uiLanguage, setUiLanguage] = useState("Turkish");
  const uiKey = uiLocaleFromInput(uiLanguage);
  const t = UI_LOCALES[uiKey];

  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const refreshProfile = useCallback(async () => {
    const { data: ud, error: uerr } = await supabase.auth.getUser();
    if (uerr) console.error("getUser error:", uerr);
    const u = ud?.user || null;
    setAuthUser(u);

    if (!u) {
      setProfile(null);
      return;
    }

    // Primary: profiles.id = auth user id
    let { data, error } = await supabase
      .from("profiles")
      .select("id,is_paid,plan,credits,first_name,last_name,gender,birth_year")
      .eq("id", u.id)
      .maybeSingle();

    // Fallback (some schemas use user_id)
    if (!data && !error) {
      const fb = await supabase
        .from("profiles")
        .select("id,is_paid,plan,credits,first_name,last_name,gender,birth_year")
        .eq("user_id", u.id)
        .maybeSingle();

      if (fb?.data) data = fb.data;
      if (fb?.error) error = fb.error;
    }

    if (error) {
      console.error("profiles select error:", error);
      // ✅ do NOT wipe profile on transient error (avoid showing 0)
      return;
    }

    if (!data) {
      console.warn("profiles row NOT FOUND for user:", u.id);
      setProfile(null);
      return;
    }

    setProfile(data);

    // Pending profile apply (UPDATE only — never upsert to avoid resetting credits)
    try {
      const pendingRaw = localStorage.getItem(LS_PENDING_PROFILE);
      const pending = pendingRaw ? safeJsonParse(pendingRaw) : null;

      if (pending && u?.id) {
        const patch = {
          first_name: pending.first_name || null,
          last_name: pending.last_name || null,
          gender: pending.gender || null,
          birth_year: pending.birth_year || null,
        };

        await supabase.from("profiles").update(patch).eq("id", u.id);
        localStorage.removeItem(LS_PENDING_PROFILE);

        const { data: data2, error: e2 } = await supabase
          .from("profiles")
          .select("id,is_paid,plan,credits,first_name,last_name,gender,birth_year")
          .eq("id", u.id)
          .maybeSingle();

        if (!e2) setProfile(data2 || data);
        else console.error("profiles reselect error:", e2);
      }
    } catch (e) {
      console.error("pending profile apply error:", e);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, [refreshProfile]);

  async function signOut() {
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
  }

  return (
    <Router>
      <TopNav
        t={t}
        authUser={authUser}
        profile={profile}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={signOut}
      />

      <AuthModal t={t} open={authOpen} onClose={() => setAuthOpen(false)} onSignedIn={refreshProfile} />

      <Routes>
        <Route
          path="/"
          element={
            <MainApp
              t={t}
              authUser={authUser}
              profile={profile}
              refreshProfile={refreshProfile}
              onUILanguageChange={(v) => setUiLanguage(v)}
            />
          }
        />
        <Route path="/account" element={<AccountPage t={t} authUser={authUser} profile={profile} refreshProfile={refreshProfile} />} />
      </Routes>
    </Router>
  );
}
