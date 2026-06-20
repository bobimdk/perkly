import { useEffect, useRef } from "react";
import { useI18n, type Lang } from "@/lib/i18n";
import { translateBatch } from "@/lib/translate.functions";

const SKIP_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "TEXTAREA",
  "INPUT",
  "SVG",
  "PATH",
  "CANVAS",
  "IFRAME",
]);

const ORIG_ATTR = "data-i18n-orig";
const LANG_ATTR = "data-i18n-lang";

// Skip strings that look purely numeric / symbolic / very short.
function isTranslatable(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (!/[A-Za-z]/.test(trimmed)) return false; // need letters
  return true;
}

function shouldSkipElement(el: Element | null): boolean {
  while (el) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (el.hasAttribute?.("data-no-translate")) return true;
    if (el.getAttribute?.("translate") === "no") return true;
    if (el.getAttribute?.("contenteditable") === "true") return true;
    el = el.parentElement;
  }
  return false;
}

function collectTextNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const text = node.nodeValue ?? "";
      if (!isTranslatable(text)) return NodeFilter.FILTER_REJECT;
      if (shouldSkipElement((node as Text).parentElement)) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) out.push(n as Text);
  return out;
}

// Per-lang in-memory + localStorage cache
function loadCache(lang: Lang): Map<string, string> {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = localStorage.getItem(`perkly.tr.${lang}`);
    if (!raw) return new Map();
    return new Map(Object.entries(JSON.parse(raw) as Record<string, string>));
  } catch {
    return new Map();
  }
}

function saveCache(lang: Lang, cache: Map<string, string>) {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, string> = {};
    cache.forEach((v, k) => (obj[k] = v));
    localStorage.setItem(`perkly.tr.${lang}`, JSON.stringify(obj));
  } catch {
    /* quota */
  }
}

export function AutoTranslate() {
  const { lang } = useI18n();
  const langRef = useRef<Lang>(lang);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<number | null>(null);

  useEffect(() => {
    langRef.current = lang;
    cacheRef.current = loadCache(lang);

    // 1) For every translatable text node, store original (once).
    //    Then either restore (en) or translate (other).
    const apply = (nodes: Text[]) => {
      const toTranslate: Text[] = [];
      const unique = new Set<string>();

      for (const node of nodes) {
        const parent = node.parentElement;
        if (!parent) continue;
        // Stash original on the parent (per text node index would be complex;
        // we instead stash on the text node via dataset proxy: use WeakMap)
        let orig = originals.get(node);
        if (orig === undefined) {
          orig = node.nodeValue ?? "";
          originals.set(node, orig);
        }
        if (lang === "en") {
          if (node.nodeValue !== orig) node.nodeValue = orig;
          continue;
        }
        const cached = cacheRef.current.get(orig);
        if (cached) {
          if (node.nodeValue !== cached) node.nodeValue = cached;
        } else {
          toTranslate.push(node);
          unique.add(orig);
        }
        // Mark parent lang for debugging
        if (parent.getAttribute(LANG_ATTR) !== lang) {
          parent.setAttribute(LANG_ATTR, lang);
        }
        // Mark original attribute (only first time, useful for inspection)
        if (!parent.hasAttribute(ORIG_ATTR) && orig.length < 80) {
          parent.setAttribute(ORIG_ATTR, orig);
        }
      }

      if (lang === "en" || unique.size === 0) return;

      // Queue and flush
      unique.forEach((u) => pendingRef.current.add(u));
      scheduleFlush(toTranslate);
    };

    const scheduleFlush = (nodes: Text[]) => {
      if (flushTimerRef.current != null) {
        window.clearTimeout(flushTimerRef.current);
      }
      flushTimerRef.current = window.setTimeout(() => {
        flushTimerRef.current = null;
        flush(nodes);
      }, 80);
    };

    const flush = async (knownNodes: Text[]) => {
      const targetLang = langRef.current;
      if (targetLang === "en") return;
      const batch = Array.from(pendingRef.current);
      pendingRef.current.clear();
      if (batch.length === 0) return;

      // Send in chunks of 60
      for (let i = 0; i < batch.length; i += 60) {
        const chunk = batch.slice(i, i + 60);
        try {
          const res = await translateBatch({ data: { lang: targetLang, texts: chunk } });
          const map = res.translations;
          for (const [src, tr] of Object.entries(map)) {
            cacheRef.current.set(src, tr);
          }
          saveCache(targetLang, cacheRef.current);

          // Re-apply to all currently observed nodes that match
          // (not just knownNodes — DOM may have changed)
          const allNodes = collectTextNodes(document.body);
          for (const node of allNodes) {
            const orig = originals.get(node) ?? node.nodeValue ?? "";
            if (langRef.current !== targetLang) break;
            const tr = cacheRef.current.get(orig);
            if (tr && node.nodeValue !== tr) {
              node.nodeValue = tr;
            }
          }
        } catch (err) {
          console.error("translate flush failed", err);
        }
      }
    };

    // Initial pass
    const initial = collectTextNodes(document.body);
    apply(initial);

    // Observe additions/changes
    const observer = new MutationObserver((mutations) => {
      const toProcess: Text[] = [];
      for (const m of mutations) {
        if (m.type === "childList") {
          m.addedNodes.forEach((added) => {
            if (added.nodeType === Node.TEXT_NODE) {
              if (
                isTranslatable((added as Text).nodeValue ?? "") &&
                !shouldSkipElement((added as Text).parentElement)
              ) {
                toProcess.push(added as Text);
              }
            } else if (added.nodeType === Node.ELEMENT_NODE) {
              toProcess.push(...collectTextNodes(added));
            }
          });
        } else if (m.type === "characterData") {
          const node = m.target as Text;
          // If we didn't set this value ourselves, treat it as new original
          const orig = originals.get(node);
          const current = node.nodeValue ?? "";
          if (orig === undefined || current !== orig) {
            // If current matches a known translation, skip
            if (!Array.from(cacheRef.current.values()).includes(current)) {
              originals.delete(node);
              if (isTranslatable(current)) toProcess.push(node);
            }
          }
        }
      }
      if (toProcess.length) apply(toProcess);
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (flushTimerRef.current != null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
    };
  }, [lang]);

  return null;
}

// Module-scope WeakMap of original text per text node
const originals: WeakMap<Text, string> = new WeakMap();
