const NAME_RE = /^\s*([^,()]+?),\s+([^,()]+?)(?:\s*\([^]*\)?)?\s*$/;

function tidy(name) {
  const m = NAME_RE.exec(name);
  if (!m) return null;
  const last = m[1].trim();
  const first = m[2].trim();
  if (!first || !last) return null;
  return first + " " + last;
}

function processText(node) {
  const text = node.nodeValue;
  if (!text || text.indexOf(",") === -1) return;
  const t = tidy(text);
  if (t && t !== text) node.nodeValue = t;
}

function processAttrs(el) {
  if (!el.getAttribute) return;
  for (const attr of ["aria-label", "title"]) {
    const v = el.getAttribute(attr);
    if (v && v.indexOf(",") !== -1) {
      const t = tidy(v);
      if (t && t !== v) el.setAttribute(attr, t);
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
}

function attach(root) {
  if (observed.has(root)) return;
  observed.add(root);
  walk(root);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") processText(m.target);
      else if (m.type === "attributes" && m.target.nodeType === 1) processAttrs(m.target);
      else m.addedNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) processText(node);
        else if (node.nodeType === Node.ELEMENT_NODE) walk(node);
      });
    }
  }).observe(root, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ["aria-label", "title"]
  });
}

attach(document.body || document.documentElement);

console.log("[Teams Name Tidy] loaded on", location.href);
