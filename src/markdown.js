// Plain Markdown export and import. One item per line:
//   - [ ] text <!-- id -->          active
//   - [ ] text <!-- id later -->    later
//   - [ ] text <!-- id cue -->      cue (kind only; [x] = dropped cue)
//   - [x] text <!-- id -->          done
// Lines that do not match (headings, blank lines) are ignored on import.

const LINE = /^- \[( |x|X)\] (.*?)\s*(?:<!--\s*([A-Za-z0-9_-]{1,64})(?:\s+(later|cue))?\s*-->)?\s*$/;
export const MAX_IMPORT = 20000; // items per file, so a huge file cannot freeze the page
export const HEADER = '<!-- dehazer-export v1 -->';

// Text must stay on one line and must not hold a comment marker.
function oneLine(text) {
  return String(text).replace(/\s*[\r\n]+\s*/g, ' ').replace(/<!--/g, '< !--').replace(/-->/g, '-- >').trim();
}

export function toMarkdown(items) {
  const lines = [...items].sort((a, b) => a.pos - b.pos).map((i) => {
    const box = i.state === 'done' ? 'x' : ' ';
    const tag = i.kind === 'cue' ? `${i.id} cue` : i.state === 'later' ? `${i.id} later` : i.id;
    return `- [${box}] ${oneLine(i.text)} <!-- ${tag} -->`;
  });
  return `# Dehazer\n${HEADER}\n\n${lines.join('\n')}${lines.length ? '\n' : ''}`;
}

// Ids and the "later" tag are read only from files that carry the export header.
// In any other Markdown a trailing comment is just part of nothing: the line is added as a new item.
export function parseMarkdown(md) {
  const out = [];
  const lines = String(md ?? '').split(/\r?\n/);
  // The header counts only in the first lines of the file (the preamble), never inside a code fence.
  const preamble = lines.slice(0, 5);
  const fence = preamble.findIndex((l) => /^(```|~~~)/.test(l.trim()));
  const native = (fence < 0 ? preamble : preamble.slice(0, fence)).some((l) => l.trim() === HEADER);
  let fenced = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (/^(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue; // example lists inside code blocks are not items
    const m = LINE.exec(line);
    if (!m || !m[2]) continue;
    const state = m[1] === ' ' ? (native && m[4] === 'later' ? 'later' : 'active') : 'done';
    const kind = native && m[4] === 'cue' ? 'cue' : 'task';
    out.push({ id: native ? m[3] || null : null, text: native ? m[2] : line.slice(6).trim(), state, kind });
    if (out.length > MAX_IMPORT) break; // one over the limit tells the caller the file is too big
  }
  return out;
}
