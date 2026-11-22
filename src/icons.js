// Small inline line icons and the mascot. Built with createElementNS: no innerHTML, no packages, no CDN.
// Icons are decoration (aria-hidden). Text labels always stay next to them.
const NS = 'http://www.w3.org/2000/svg';
const PATHS = {
  cue: ['M9 18h6', 'M10 21h4', 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z'],
  now: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  next: ['M5 12h14', 'M13 6l6 6-6 6'],
  tools: ['M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z'],
  settings: ['M4 7h10', 'M18 7h2', 'M4 17h2', 'M10 17h10', 'M16 5v4', 'M8 15v4'],
};

function svg(doc, size, box) {
  const el = doc.createElementNS(NS, 'svg');
  el.setAttribute('viewBox', box); el.setAttribute('width', size); el.setAttribute('height', size);
  el.setAttribute('aria-hidden', 'true'); el.setAttribute('focusable', 'false');
  el.setAttribute('fill', 'none'); el.setAttribute('stroke', 'currentColor');
  el.setAttribute('stroke-width', '2'); el.setAttribute('stroke-linecap', 'round'); el.setAttribute('stroke-linejoin', 'round');
  el.setAttribute('class', 'icon');
  return el;
}
const path = (doc, d) => { const p = doc.createElementNS(NS, 'path'); p.setAttribute('d', d); return p; };

export function icon(doc, name) {
  const el = svg(doc, 20, '0 0 24 24');
  for (const d of PATHS[name] ?? []) el.append(path(doc, d));
  return el;
}

// "Cloud clearing": a soft cloud with a small sun behind it and a calm face.
export function mascot(doc) {
  const el = svg(doc, 36, '0 0 36 36');
  el.setAttribute('class', 'icon mascot');
  el.append(
    path(doc, 'M24 12a5 5 0 0 1 5 5'), path(doc, 'M26 6v2'), path(doc, 'M31 9l-1.4 1.4'), path(doc, 'M33 14h-2'),
    path(doc, 'M10 29a6 6 0 0 1-.6-12 8 8 0 0 1 15.2-1.4A6.5 6.5 0 0 1 25 29z'),
    path(doc, 'M14 23h.01'), path(doc, 'M20 23h.01'), path(doc, 'M15 26q2 1.6 4 0'),
  );
  return el;
}
