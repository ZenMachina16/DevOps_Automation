import { useEffect, useRef } from 'react';

function detectLanguage(path) {
  if (!path) return 'text';
  const p = path.toLowerCase();
  if (p.endsWith('.yml') || p.endsWith('.yaml')) return 'yaml';
  if (p.endsWith('.md') || p.endsWith('readme')) return 'markdown';
  if (p.endsWith('dockerfile') || p === 'dockerfile') return 'dockerfile';
  return 'text';
}

function tokenizeDockerfile(line) {
  const tokens = [];
  const hashIndex = line.indexOf('#');
  const code = hashIndex >= 0 ? line.slice(0, hashIndex) : line;
  const comment = hashIndex >= 0 ? line.slice(hashIndex) : '';
  const m = code.match(/^(\s*)([A-Z]+)(\b)(.*)$/);
  if (m) {
    const [, ws, instr, , rest] = m;
    if (ws) tokens.push({ text: ws });
    tokens.push({ text: instr, color: '#4FC1FF' });
    if (rest) tokens.push({ text: rest });
  } else {
    tokens.push({ text: code });
  }
  if (comment) tokens.push({ text: comment, color: '#6A9955' });
  return tokens;
}

function tokenizeYaml(line) {
  const tokens = [];
  const hashIndex = line.indexOf('#');
  const content = hashIndex >= 0 ? line.slice(0, hashIndex) : line;
  const comment = hashIndex >= 0 ? line.slice(hashIndex) : '';
  const m = content.match(/^(\s*)(-\s*)?([^:\"]+?)\s*:(.*)$/);
  if (m) {
    const [, ws, dash, key, rest] = m;
    if (ws) tokens.push({ text: ws });
    if (dash) tokens.push({ text: dash, color: '#C586C0' });
    tokens.push({ text: key, color: '#4FC1FF' });
    tokens.push({ text: ':' });
    if (rest) tokens.push({ text: rest });
  } else {
    tokens.push({ text: content });
  }
  if (comment) tokens.push({ text: comment, color: '#6A9955' });
  return tokens;
}

function tokenizeMarkdown(line) {
  const tokens = [];
  const m = line.match(/^(\s*)(#+\s+)(.*)$/);
  if (m) {
    const [, ws, hashes, rest] = m;
    if (ws) tokens.push({ text: ws });
    tokens.push({ text: hashes, color: '#569CD6' });
    tokens.push({ text: rest });
    return tokens;
  }
  return [{ text: line }];
}

function tokenize(line, lang) {
  switch (lang) {
    case 'dockerfile':
      return tokenizeDockerfile(line);
    case 'yaml':
      return tokenizeYaml(line);
    case 'markdown':
      return tokenizeMarkdown(line);
    default:
      return [{ text: line }];
  }
}

export default function CodeCanvas({ content = '', path = '', minWidth = 1200, height = 520, font = '14px Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lang = detectLanguage(path);

    const ctx = canvas.getContext('2d');
    const theme = {
      editorBg: '#1e1e1e',
      gutterBg: '#252526',
      border: '#1f2a44',
      text: '#d4d4d4',
      lineNumber: '#858585',
    };

    // prepare text
    ctx.font = font;
    ctx.textBaseline = 'top';

    const lines = (content || '').split('\n');
    const lineHeight = 22;
    const padding = 12;
    const digits = Math.max(2, String(lines.length).length);
    const gutterWidth = Math.max(56, 10 + ctx.measureText('9'.repeat(digits)).width + 10);

    // compute dynamic width based on syntax token widths
    let maxTextWidth = 0;
    for (let i = 0; i < lines.length; i++) {
      const segs = tokenize(lines[i], lang);
      let w = 0;
      for (const seg of segs) w += ctx.measureText(seg.text).width;
      if (w > maxTextWidth) maxTextWidth = w;
    }
    const desiredWidth = Math.max(minWidth, Math.ceil(gutterWidth + padding + maxTextWidth + padding));
    const desiredHeight = Math.max(height, Math.ceil(padding * 2 + lines.length * lineHeight));
    canvas.width = desiredWidth;
    canvas.height = desiredHeight;

    // background after size set
    ctx.fillStyle = theme.editorBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // gutter
    ctx.fillStyle = theme.gutterBg;
    ctx.fillRect(0, 0, gutterWidth, canvas.height);

    // draw lines
    let y = padding;
    for (let i = 0; i < lines.length; i++) {
      const ln = i + 1;
      // line number
      ctx.fillStyle = theme.lineNumber;
      const num = String(ln).padStart(digits, ' ');
      ctx.fillText(num, padding, y);

      // line text with colors
      let x = gutterWidth + padding;
      const segs = tokenize(lines[i], lang);
      for (const seg of segs) {
        ctx.fillStyle = seg.color || theme.text;
        ctx.fillText(seg.text, x, y);
        x += ctx.measureText(seg.text).width;
      }
      y += lineHeight;
      if (y > canvas.height - padding) break;
    }
  }, [content, path, minWidth, height, font]);

  return (
    <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid #1f2a44', background: '#1e1e1e', maxWidth: '100%', height }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}


