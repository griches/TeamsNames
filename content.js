const NAME_RE = /^\s*(@?)([^,()]+?),\s+([^,()]+?)(?:\s*\([^]*\)?)?\s*$/;
const MENTION_SEL = '[itemtype*="Mention" i]';
// Transient/React-controlled UI we must never rewrite (it re-renders and loops).
const SKIP_SEL = '[role="listbox"],[role="menu"],[role="combobox"],[role="dialog"]';

function tidy(name) {
  const m = NAME_RE.exec(name);
  if (!m) return null;
  const at = m[1];
  const last = m[2].trim();
  const first = m[3].trim();
  if (!first || !last) return null;
  return at + first + " " + last;
}

function skip(el) {
  return !el || el.isContentEditable || (el.closest && !!el.closest(SKIP_SEL));
}

function processText(node) {
  const text = node.nodeValue;
  if (!text || text.indexOf(",") === -1) return;
  if (skip(node.parentElement)) return;
  const t = tidy(text);
  if (t && t !== text) node.nodeValue = t;
}

function processAttrs(el) {
  if (!el.getAttribute || skip(el)) return;
  for (const attr of ["aria-label", "title"]) {
    const v = el.getAttribute(attr);
    if (v && v.indexOf(",") !== -1) {
      const t = tidy(v);
      if (t && t !== v) el.setAttribute(attr, t);
    }
  }
}

function isMention(n) {
  return n && n.nodeType === 1 && n.matches && n.matches(MENTION_SEL);
}

function skipWs(node, dir) {
  let n = node[dir];
  while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n[dir];
  return n;
}

function handleMentions(root) {
  const spans = root.querySelectorAll ? root.querySelectorAll(MENTION_SEL) : [];
  for (const span of spans) {
    if (skip(span)) continue;
    if (isMention(skipWs(span, "previousSibling"))) continue; // not group start
    const group = [span];
    let n = skipWs(span, "nextSibling");
    while (isMention(n)) {
      group.push(n);
      n = skipWs(n, "nextSibling");
    }
    const full = group.map((g) => g.textContent).join(" ").replace(/\s+/g, " ").trim();
    const t = tidy(full);
    if (t && t !== full) {
      group[0].textContent = t;
      const last = group[group.length - 1];
      let cur = group[0].nextSibling;
      while (cur) {
        const next = cur.nextSibling;
        if (cur.nodeType === 3) cur.nodeValue = "";
        else if (cur.nodeType === 1) cur.textContent = "";
        if (cur === last) break;
        cur = next;
      }
    }
  }
}

const observed = new WeakSet();

function walk(root) {
  const walker = document.createTreeWalker(
    root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
  );
  let n = root;
  do {
    if (n.nodeType === Node.TEXT_NODE) processText(n);
    else if (n.nodeType === Node.ELEMENT_NODE) {
      processAttrs(n);
      if (n.shadowRoot) attach(n.shadowRoot);
    }
  } while ((n = walker.nextNode()));
  handleMentions(root);
}

let queued = false;
const pending = new Set();

function flush() {
  queued = false;
  const roots = [...pending];
  pending.clear();
  for (const node of roots) {
    if (!node.isConnected) continue;
    if (node.nodeType === Node.TEXT_NODE) {
      processText(node);
      if (node.parentElement) handleMentions(node.parentElement);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      walk(node);
      // Mentions are split across sibling spans, so also group from the parent.
      if (node.parentElement) handleMentions(node.parentElement);
    }
  }
}

function schedule(node) {
  pending.add(node);
  if (!queued) {
    queued = true;
    (window.requestIdleCallback || window.requestAnimationFrame || setTimeout)(flush);
  }
}

function attach(root) {
  if (observed.has(root)) return;
  observed.add(root);
  walk(root);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") schedule(m.target);
      else if (m.type === "attributes" && m.target.nodeType === 1) processAttrs(m.target);
      else m.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) schedule(node);
      });
    }
  }).observe(root, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ["aria-label", "title"]
  });
}

attach(document.body || document.documentElement);

console.log("[Teams Name Tidy] loaded on", location.href);
