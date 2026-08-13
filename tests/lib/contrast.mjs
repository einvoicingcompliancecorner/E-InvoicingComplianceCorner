// contrast.mjs — the WCAG AA auditor, as a browser-side expression.
//
// Lives here rather than inside one test because it is worth pointing at
// any page this project ships: the ROI planner, a whitepaper, a design
// document. Every HTML deliverable has been hand-checked at some point;
// this is that check, written down once.
//
// Two things it gets right that the first version did not.
//
// ALPHA. bgOf() composites the whole ancestor chain honouring alpha,
// and so does the text colour. The first version walked up and took the
// first background it found, which read rgba(255,255,255,0.02) as opaque
// white and invented six failures. A tool that reports failures nobody
// can reproduce gets ignored inside a week.
//
// HIDDEN TEXT. Tooltips are display:none until hover, so they have no
// box to measure and a visibility-filtered audit skips them silently.
// They carry the sourcing — the text a sceptical reader squints at
// hardest — and they have been unreadable once already. They are audited
// by declared style instead.

export const AUDIT_EXPR = `(() => {
  const parse = (str) => {
    const n = (str.match(/[\\d.]+/g) || []).map(Number);
    return { r: n[0] || 0, g: n[1] || 0, b: n[2] || 0, a: n.length > 3 ? n[3] : 1 };
  };
  // src over dst, straight alpha. This is the part the first version got
  // wrong: an 0.02-alpha white over navy is navy, not white.
  const over = (src, dst) => [
    src.r * src.a + dst[0] * (1 - src.a),
    src.g * src.a + dst[1] * (1 - src.a),
    src.b * src.a + dst[2] * (1 - src.a),
  ];
  // The members shell's page background, used only if no opaque ancestor
  // is found at all (nothing above <html> to composite onto).
  const PAGE = [15, 26, 43];
  const bgOf = (el) => {
    const stack = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.a > 0) stack.push(c);
      if (c.a === 1) break;
    }
    let base = PAGE;
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };
  const lum = (c) => {
    const s = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  const ratio = (fg, bg) => {
    const l1 = lum(fg), l2 = lum(bg);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const ownText = (el) => [...el.childNodes]
    .filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();

  const audit = (nodes, { requireVisible }) => {
    const out = [];
    nodes.forEach((el) => {
      const txt = ownText(el);
      if (!txt || txt.length < 3) return;
      if (requireVisible && !el.getClientRects().length) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.opacity === "0") return;
      const bg = bgOf(el);
      const fg = over(parse(cs.color), bg);       // text alpha counts too
      const size = parseFloat(cs.fontSize);
      const bold = +cs.fontWeight >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      const r = ratio(fg, bg);
      if (r < need) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className) || "",
          size, bold, need, ratio: +r.toFixed(2),
          color: cs.color,
          bg: 'rgb(' + bg.map((v) => Math.round(v)).join(', ') + ')',
          text: txt.slice(0, 60),
        });
      }
    });
    return out;
  };

  return {
    // Everything on screen.
    visible: audit([...document.querySelectorAll("body *")], { requireVisible: true }),
    // Tooltips and evidence popovers are display:none until hover, so
    // they have no box to measure — audit them by declared style. They
    // carry the sourcing, which is the text a sceptical reader squints at
    // hardest, and they were unreadable once already (inherited uppercase
    // mono from their <label> parent).
    hidden: audit([...document.querySelectorAll(".tip, .tip *")], { requireVisible: false }),
    counts: {
      elements: document.querySelectorAll("body *").length,
      tips: document.querySelectorAll(".tip").length,
      markers: document.querySelectorAll(".hlp").length,
    },
  };
})()`;
