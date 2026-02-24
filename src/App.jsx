import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Wand2,
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
  Camera,
  Smartphone,
  Aperture,
  Mic,
  Lightbulb,
  Server,
  ShieldCheck,
  ListChecks,
  FileJson,
  FileCode2,
} from "lucide-react";
import { supabase } from "./supabaseClient";

const LS_KEY = "content_architect_v2_single_snapshot";

/* -----------------------------
   utils
------------------------------ */
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

/* -----------------------------
   Language policy
------------------------------ */
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

    teleprompter: "Teleprompter",
    openTeleprompter: "Teleprompter Mode",
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

    // Teleprompter overlay UI labels (must follow outputLanguage)
    exitToMain: "Ana ekrana dön",
    beat: "Beat",
    copy: "Kopyala",
    pace: "Tempo",
    tag: "Etiket",
    on: "Açık",
    off: "Kapalı",
    high: "Yüksek",
    normal: "Normal",
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
    exportXml: "Export XML",
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

    teleprompter: "Teleprompter",
    openTeleprompter: "Teleprompter Mode",
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

    // Teleprompter overlay UI labels (must follow outputLanguage)
    exitToMain: "Exit to Main",
    beat: "Beat",
    copy: "Copy",
    pace: "Pace",
    tag: "Tag",
    on: "On",
    off: "Off",
    high: "High",
    normal: "Normal",
  },
};

function uiLocaleFromInput(inputLanguage) {
  return inputLanguage === "Turkish" ? "tr" : "en";
}

// Teleprompter language is driven by OUTPUT language (not UI language)
function tpLocaleFromOutput(outputLanguage) {
  return outputLanguage === "Turkish" ? "tr" : "en";
}

/* -----------------------------
   Platform options (multi-select) — expanded
------------------------------ */
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

/* -----------------------------
   Preset engine (adapted)
------------------------------ */
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

/* -----------------------------
   Guidelines snippet loading (local, optional)
------------------------------ */
const FALLBACK_GUIDELINES = {
  LinkedIn: { platform: "LinkedIn", updatedAt: "fallback", specs: { notes: ["Professional tone", "Subtitles recommended", "Avoid overly aggressive claims"] } },
  Facebook: { platform: "Meta (Facebook)", updatedAt: "fallback", specs: { notes: ["Mobile-first", "Thumb-stopping first 2 seconds", "Clear CTA"] } },
  "Instagram Reels": { platform: "Instagram Reels", updatedAt: "fallback", specs: { notes: ["Mobile-first 9:16", "Hook in first 1–2 seconds", "On-screen captions"] } },
  TikTok: { platform: "TikTok", updatedAt: "fallback", specs: { notes: ["Fast hook", "Pattern interrupts", "Clear CTA"] } },
  "YouTube Shorts": { platform: "YouTube Shorts", updatedAt: "fallback", specs: { notes: ["Hook fast", "High retention pacing", "Subscribe CTA"] } },
  "YouTube Long": { platform: "YouTube Long", updatedAt: "fallback", specs: { notes: ["Stronger narrative", "Chapters optional", "Subscribe + next video CTA"] } },
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

/* -----------------------------
   Inventory (checkbox grid)
------------------------------ */
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

/* -----------------------------
   Scene parsing (Time Map fix)
------------------------------ */
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
    const line = raw.replace(/\t/g, "  ");
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

/* -----------------------------
   Tempo map (sentence-level) + SECTION TAGGING
------------------------------ */
function splitIntoSentences(text) {
  const t = normalizeNewlines(text).trim();
  if (!t) return [];
  return t
    .replace(/\n+/g, "\n")
    .split(/(?<=[.!?…])\s+|\n+/g)
    .map((x) => x.trim())
    .filter(Boolean);
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
  const soft = lower.includes("bence") || lower.includes("istersen") || lower.includes("gel");
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

/* -----------------------------
   Inventory-aware outputs
------------------------------ */
function buildNeedsList(inv, location) {
  const f = deriveInventoryFlags(inv);
  const needs = [];
  needs.push({
    id: uid(),
    category: "Light",
    have: f.hasLight ? "Yes" : "No",
    suggestion: f.hasLight
      ? "Key light 45° + background separation."
      : location === "indoor"
      ? "Use window light + bounce (white wall)."
      : "Shoot in shade (avoid harsh sun).",
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
    suggestion: inv.stabilization.length ? "Lock framing; use cuts." : "No stabilization: brace elbows, keep shots short.",
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
  const cameraTip = f.hasProCamera ? "Camera: lock WB, expose for skin." : f.hasPhone ? "Phone: 1x lens, lock exposure." : "Select capture gear.";
  const lightTip = f.hasLight ? `Light: ${inv.lights.filter((x) => x !== "None").join(" + ")}` : location === "indoor" ? "Light: window + bounce." : "Light: shade.";
  const stabTip = f.hasGimbal ? "Gimbal: slow moves." : inv.stabilization.includes("Tripod") ? "Tripod: lock framing." : "Handheld: elbows locked, short takes.";
  const audioTip = f.hasMic ? "Audio: use mic, avoid clipping." : f.hasAudio ? "Audio: phone mic, close distance." : "Audio: phone closer, reduce echo/wind.";

  const base = [
    { type: "Cutaway", text: "Insert a close-up of the key object / detail.", sec: 1.5 },
    { type: "Hands", text: "Insert hands demonstrating the action.", sec: 1.8 },
    { type: "POV", text: "Insert POV shot (reach / grab / use).", sec: 1.2 },
    { type: "Context", text: "Insert a quick establishing wide shot.", sec: 1.2 },
  ];

  const density = preset.primary === "Podcast" || preset.primary === "YouTube Long" ? 2 : preset.targetDurationSec <= 20 ? 2 : 3;

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

/* -----------------------------
   Timeline + XML export
------------------------------ */
function buildTimeline(tempoMap, bRoll, targetSec) {
  const aRoll = [];
  let t = 0;
  for (const s of tempoMap) {
    const start = +t.toFixed(1);
    const end = +(t + s.durationSec).toFixed(1);
    aRoll.push({ id: uid(), type: "aRoll", text: s.text, pace: s.pace, intensity: s.intensity, startSec: start, endSec: end });
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

  const a = timeline.tracks.aRoll
    .map((x) => `  <clip type="aRoll" start="${x.startSec}" end="${x.endSec}" pace="${x.pace}" intensity="${x.intensity}">${esc(x.text)}</clip>`)
    .join("\n");

  const b = timeline.tracks.bRoll
    .map((x) => `  <clip type="bRoll" start="${x.startSec}" end="${x.endSec}" shotType="${esc(x.shotType)}">${esc(x.instruction)}</clip>`)
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

/* -----------------------------
   AI prompt builders (EN commands always)
------------------------------ */
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
Hook:
<text>

Scene 1:
<text>

Transition:
<text>

Scene 2:
<text>

... (as needed)

CTA:
<text>

Important:
- Keep it shootable with the given inventory. If lights/mic are missing, adapt.
- Avoid mentioning gear that is not selected.
- Keep hook inside first ~${preset.hookWindowSec}s.
- Stay within ~${durationSec}s (approx).`;
}

function buildDraftUserMessage({ brief }) {
  return `BRIEF:
${brief || "(empty)"}

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

/* -----------------------------
   UI components
------------------------------ */
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

/* -----------------------------
   Teleprompter (TimeMap-driven)
------------------------------ */
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

  // IMPORTANT: tpKey is driven by OUTPUT language, not UI.
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

  // show more (no truncation in UI anymore)
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

function TeleprompterOverlay({ tpT, tpKey, preset, timeMap, onClose }) {
  const beats = Array.isArray(timeMap) ? timeMap : [];
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
    } catch {}
  }, [currentBeat]);

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
              {tpT.exitToMain}
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
      {/* TOP BAR */}
      <div style={panelStyle}>
        <div style={rowStyle}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", minWidth: 320, flex: "1 1 560px" }}>
            <span style={pill}>
              {tpT.teleprompter} · {preset?.primary || "—"} · {preset?.aspect || "—"}
            </span>

            <span style={{ ...pill, borderColor: `${sectionColor}55`, color: sectionColor }}>{sectionLabel}</span>

            <span style={pill}>
              {tpT.beat}: {beatIndex + 1}/{totalBeats} · <b>{currentBeat?.label || "—"}</b>
            </span>

            <span style={pill}>
              {formatMs(durationMs)} · {tpT.left}: <b>{formatMs(remainingMs)}</b>
            </span>

            <span style={pill}>
              {tpT.emotion}: <b>{emotionName}</b> · {tpT.intensity}: <b>%{emotionIntensity}</b>
            </span>

            {/* FIX: no truncation, allow wrapping */}
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
                {Array.isArray(currentBeat?.cues) && currentBeat.cues.length ? currentBeat.cues.join(" · ") : tpT.noCues}
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
              {tpT.mirror}: {mirror ? tpT.on : tpT.off}
            </button>
            <button style={btn} onClick={() => setShowCues((v) => !v)} title="D">
              {tpT.cues}: {showCues ? tpT.on : tpT.off}
            </button>
            <button style={btn} onClick={() => setHighContrast((v) => !v)} title="C">
              {tpT.contrast}: {highContrast ? tpT.high : tpT.normal}
            </button>

            <button style={btn} onClick={copyCurrentText}>
              {tpT.copy}
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
              {tpT.exitToMain}
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

      {/* PROMPTER */}
      <div style={prompterStyle}>
        {/* Pace/Tag line 200% bigger */}
        <div style={{ opacity: 0.78, fontSize: Math.round(68 * fontScale), marginBottom: 14 }}>
          {currentBeat?.label || "—"} · {formatMs(durationMs)} ·{" "}
          <span style={{ color: sectionColor, fontWeight: 900 }}>{sectionLabel}</span> · {tpT.pace}: {currentBeat?.pace || "—"} ·{" "}
          {tpT.tag}: {currentBeat?.intensityTag || "—"}
        </div>

        {/* flowing text color by starting character */}
        <div style={{ fontWeight: 900, color: flowTextColor || "inherit" }}>{currentBeat?.text || ""}</div>
      </div>
    </div>
  );
}

/* -----------------------------
   Auth-gated App (FIX: stable hook order)
------------------------------ */
export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session || null);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setAuthLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (authLoading) {
    return (
      <div style={{ padding: 24, color: "white", fontFamily: "ui-sans-serif, system-ui" }}>
        Loading...
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  return <AuthedApp />;
}

/* -----------------------------
   Main App (authed)
------------------------------ */
function AuthedApp() {
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

  const uiKey = uiLocaleFromInput(state.uiLanguage);
  const t = UI_LOCALES[uiKey];

  const displayLang = state.outputLanguage || state.uiLanguage;

  // Teleprompter locale must follow OUTPUT language
  const tpKey = tpLocaleFromOutput(displayLang);
  const tpT = UI_LOCALES[tpKey];

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
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        state,
        provider,
        model,
        temperature,
        sidebarOpen,
      })
    );
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

  // Teleprompter time-map uses tpKey (output language)
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
    const payload = {
      state,
      ai: { provider, model, temperature },
      derived: { preset, guideline, scenes, tempoMap, needsList, directorCards, bRoll, timeline },
    };
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
      return;
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok || !data?.ok) {
      throw new Error(data?.error || "Generate failed");
    }
    return (data.text || "").trim();
  }

  async function generateDraft() {
    setIsGenerating(true);
    try {
      const text = await callGenerate({ mode: "draft" });
      setState((s) => ({ ...s, script: text }));
      showToast(t.generated);
    } catch (e) {
      showToast(String(e.message || e));
    } finally {
      setIsGenerating(false);
    }
  }

  async function reviseScript() {
    if (!state.script.trim()) {
      showToast(t.noScript);
      return;
    }
    setIsRevising(true);
    try {
      const text = await callGenerate({ mode: "revise" });
      setState((s) => ({ ...s, script: text }));
      showToast(t.revised);
    } catch (e) {
      showToast(String(e.message || e));
    } finally {
      setIsRevising(false);
    }
  }

  const timeMapContainerRef = useRef(null);
  const [timeMapShowAll, setTimeMapShowAll] = useState(true);

  return (
    <div className="app-shell">
      {teleprompterOpen && (
        <TeleprompterOverlay
          tpT={tpT}
          tpKey={tpKey}
          preset={preset}
          timeMap={teleTimeMap}
          onClose={() => setTeleprompterOpen(false)}
        />
      )}

      <div className="topbar">
        <div className="brand">
          <span className="brand-badge">
            <Sparkles size={18} />
            {t.appTitle}
          </span>
          <span className="subtle">{t.subtitle}</span>
        </div>

        <div className="row">
          <button className="btn btn-green" onClick={() => setTeleprompterOpen(true)} disabled={!tempoMap.length}>
            <Film size={16} /> {t.openTeleprompter}
          </button>

          <button
            className="btn"
            onClick={async () => {
              try {
                await supabase.auth.signOut();
              } catch {}
            }}
            title="Sign out"
          >
            Logout
          </button>

          <button className="btn" onClick={() => setSidebarOpen((v) => !v)}>
            {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            {sidebarOpen ? t.hide : t.show}
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
        {/* LEFT */}
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

          {/* Core controls */}
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
                <select value={state.uiLanguage} onChange={(e) => setState((s) => ({ ...s, uiLanguage: e.target.value }))}>
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

          {/* AI settings */}
          <div className="card" style={{ marginBottom: 12 }}>
            <SectionTitle icon={<Server size={18} />} title="AI" right={<Badge>{provider}/{model}</Badge>} />
            <div className="row">
              <div className="field">
                <label>Provider</label>
                <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>

              <div className="field">
                <label>Model</label>
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. gpt-4o-mini" />
                <div className="small">Keep it in sync with your server/provider.</div>
              </div>

              <div className="field" style={{ minWidth: 260 }}>
                <label>Temperature</label>
                <div className="row">
                  <input className="slider" type="range" min={0} max={1} step={0.05} value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
                  <Badge>{temperature.toFixed(2)}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines snippet */}
          <div className="card" style={{ marginBottom: 12 }}>
            <SectionTitle icon={<ListChecks size={18} />} title={t.guideline} right={<Badge>{guideline?.updatedAt || "—"}</Badge>} />
            <div className="small">
              {guideline?.platform || preset.primary} • {(guideline?.specs?.notes || []).slice(0, 6).join(" • ") || "—"}
            </div>
          </div>

          {/* Inventory grid */}
          <div className="card" style={{ marginBottom: 12 }}>
            <SectionTitle icon={<Smartphone size={18} />} title={t.inventory} right={<Badge tone="blue">Checkbox Grid</Badge>} />

            <div className="inv-grid">
              <div className="inv-col">
                <div className="inv-title">
                  <Camera size={16} /> Capture
                </div>
                {INV.capture.map((x) => (
                  <label key={x} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.capture.includes(x)}
                      onChange={() => setState((s) => ({ ...s, inventory: { ...s.inventory, capture: toggle(s.inventory.capture, x) } }))}
                    />
                    <span>{x}</span>
                  </label>
                ))}
              </div>

              <div className="inv-col">
                <div className="inv-title">
                  <Aperture size={16} /> Lenses
                </div>
                {INV.lenses.map((x) => (
                  <label key={x} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.lenses.includes(x)}
                      onChange={() => setState((s) => ({ ...s, inventory: { ...s.inventory, lenses: toggle(s.inventory.lenses, x) } }))}
                    />
                    <span>{x}</span>
                  </label>
                ))}
              </div>

              <div className="inv-col">
                <div className="inv-title">
                  <Lightbulb size={16} /> Lights
                </div>
                {INV.lights.map((x) => (
                  <label key={x} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.lights.includes(x)}
                      onChange={() => setState((s) => ({ ...s, inventory: { ...s.inventory, lights: setNoneRule(s.inventory.lights, x) } }))}
                    />
                    <span>{x}</span>
                  </label>
                ))}
              </div>

              <div className="inv-col">
                <div className="inv-title">
                  <Mic size={16} /> Audio
                </div>
                {INV.audio.map((x) => (
                  <label key={x} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.audio.includes(x)}
                      onChange={() => setState((s) => ({ ...s, inventory: { ...s.inventory, audio: setNoneRule(s.inventory.audio, x) } }))}
                    />
                    <span>{x}</span>
                  </label>
                ))}
              </div>

              <div className="inv-col">
                <div className="inv-title">
                  <Settings size={16} /> Stabilization
                </div>
                {INV.stabilization.map((x) => (
                  <label key={x} className="inv-row">
                    <input
                      type="checkbox"
                      checked={state.inventory.stabilization.includes(x)}
                      onChange={() =>
                        setState((s) => ({ ...s, inventory: { ...s.inventory, stabilization: toggle(s.inventory.stabilization, x) } }))
                      }
                    />
                    <span>{x}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="small" style={{ marginTop: 8 }}>
              {invText}
            </div>
          </div>

          {/* AI Buttons BETWEEN Inventory and Script */}
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

          {/* Script editor */}
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

          {/* Time Map */}
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
              <div
                ref={timeMapContainerRef}
                className="time-map"
                style={{
                  maxHeight: 420,
                  overflowY: "auto",
                }}
              >
                {(timeMapShowAll ? tempoMap : tempoMap.slice(0, 12)).map((s) => (
                  <div key={s.id} className="time-row">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div className="row">
                        <Badge tone="blue">#{s.idx}</Badge>
                        <Badge>Pace: {s.pace}</Badge>
                        <Badge tone={s.intensity === "emphatic" ? "green" : s.intensity === "soft" ? "warn" : "default"}>Intensity: {s.intensity}</Badge>
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

        {/* RIGHT */}
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

          {/* Needs list */}
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

          {/* Director touch */}
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

          {/* B-roll beat list */}
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

      {/* Minimal extra CSS for chips + inventory grid */}
      <style>{`
        .chip{
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.92);
          padding: 8px 10px;
          border-radius: 999px;
          font-weight: 800;
          cursor: pointer;
        }
        .chip:hover{ background: rgba(255,255,255,0.06); }
        .chip-on{
          border-color: rgba(0,122,255,0.45);
          background: rgba(0,122,255,0.14);
          color: #cfe7ff;
        }
        .inv-grid{
          display:grid;
          grid-template-columns: repeat(5, minmax(0,1fr));
          gap: 12px;
          margin-top: 10px;
        }
        @media (max-width: 980px){
          .inv-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
        .inv-col{
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 10px;
        }
        .inv-title{
          display:flex; align-items:center; gap:8px;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .inv-row{
          display:flex; align-items:center; gap:8px;
          padding: 6px 2px;
          color: rgba(255,255,255,0.92);
        }
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

/* -----------------------------
   Auth Screen (Supabase)
------------------------------ */
function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Signup OK. Please check your email (if confirmation is enabled), then login.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMsg("Login OK.");
      }
    } catch (err) {
      setMsg(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0b0c",
        color: "#f5f5f7",
        padding: 20,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: 18,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </div>
        <div style={{ opacity: 0.8, fontSize: 13, marginBottom: 14 }}>
          Content-Architect access is limited to registered users.
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
            }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6)"
            type="password"
            required
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
            }}
          />

          <button
            disabled={busy}
            type="submit"
            style={{
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.10)",
              color: "inherit",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {busy ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.85)",
              cursor: "pointer",
              fontWeight: 900,
              padding: 0,
            }}
          >
            {mode === "login" ? "Create an account" : "I already have an account"}
          </button>

          <button
            type="button"
            onClick={async () => {
              setMsg("");
              await supabase.auth.signOut();
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              fontWeight: 800,
              padding: 0,
            }}
            title="Sign out"
          >
            Sign out
          </button>
        </div>

        {msg ? <div style={{ marginTop: 12, fontSize: 13, opacity: 0.9 }}>{msg}</div> : null}
      </div>
    </div>
  );
}
