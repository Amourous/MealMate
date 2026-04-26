/**
 * Converts mealmate_full_report.md → mealmate_full_report.html
 * Open the HTML in Chrome/Edge and use Ctrl+P → Save as PDF
 */

const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, 'mealmate_full_report.md');
const htmlPath = path.join(__dirname, 'mealmate_full_report.html');

const md = fs.readFileSync(mdPath, 'utf8');

// ── Minimal Markdown → HTML converter (no deps) ────────────────────────────

function mdToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inTable = false;
  let tableHeaderDone = false;
  let inBlockquote = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Fenced code blocks (skip for this doc — none present)

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      if (inTable) { html += '</tbody></table>\n'; inTable = false; tableHeaderDone = false; }
      html += '<hr>\n';
      continue;
    }

    // Table rows
    if (/^\|/.test(line)) {
      if (!inTable) { html += '<table>\n<thead>\n'; inTable = true; tableHeaderDone = false; }
      if (/^\|[-| :]+\|$/.test(line.trim())) {
        html += '</thead>\n<tbody>\n';
        tableHeaderDone = true;
        continue;
      }
      const tag = tableHeaderDone ? 'td' : 'th';
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      html += '<tr>' + cells.map(c => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>\n';
      continue;
    } else if (inTable) {
      html += '</tbody></table>\n';
      inTable = false;
      tableHeaderDone = false;
    }

    // Blockquote
    if (/^>/.test(line)) {
      if (!inBlockquote) { html += '<blockquote>\n'; inBlockquote = true; }
      html += `<p>${inline(line.replace(/^>\s*/, ''))}</p>\n`;
      continue;
    } else if (inBlockquote) {
      html += '</blockquote>\n';
      inBlockquote = false;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>\n`; continue; }

    // Unordered list
    if (/^[-*+]\s/.test(line)) { html += `<ul><li>${inline(line.replace(/^[-*+]\s/, ''))}</li></ul>\n`; continue; }

    // Ordered list  
    if (/^\d+\.\s/.test(line)) { html += `<ol><li>${inline(line.replace(/^\d+\.\s/, ''))}</li></ol>\n`; continue; }

    // Empty line
    if (line.trim() === '') { html += '<p></p>\n'; continue; }

    // Paragraph
    html += `<p>${inline(line)}</p>\n`;
  }

  if (inTable) html += '</tbody></table>\n';
  if (inBlockquote) html += '</blockquote>\n';

  // Merge consecutive <ul>/<ol> items
  html = html.replace(/<\/ul>\n<ul>/g, '');
  html = html.replace(/<\/ol>\n<ol>/g, '');

  return html;
}

function inline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/&/g, '&amp;')
    // undo over-escaping of already-correct chars
    .replace(/&amp;amp;/g, '&amp;')
    .replace(/✅/g, '✅')
    .replace(/—/g, '—');
}

// ── Build HTML document ─────────────────────────────────────────────────────

const body = mdToHtml(md);

const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MealMate — Full Project Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      font-size: 10.5pt;
      line-height: 1.75;
      color: #1a1a2e;
      background: #fff;
      padding: 0;
    }

    /* ── Page layout for print ── */
    @page {
      size: A4;
      margin: 22mm 20mm 22mm 20mm;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
      h1, h2, h3 { page-break-after: avoid; }
      table, figure { page-break-inside: avoid; }
      blockquote { page-break-inside: avoid; }
    }

    /* ── Screen container ── */
    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 48px 56px;
    }

    /* ── Headings ── */
    h1 {
      font-size: 22pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 10px;
      margin: 0 0 28px;
      letter-spacing: -0.5px;
    }
    h2 {
      font-size: 13.5pt;
      font-weight: 700;
      color: #1e293b;
      margin: 32px 0 10px;
      padding-left: 10px;
      border-left: 4px solid #4f46e5;
    }
    h3 {
      font-size: 11.5pt;
      font-weight: 600;
      color: #334155;
      margin: 20px 0 8px;
    }

    /* ── Paragraphs & text ── */
    p { margin: 6px 0 10px; }
    strong { font-weight: 600; color: #0f172a; }
    em { font-style: italic; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      font-family: 'JetBrains Mono', 'Consolas', monospace;
      font-size: 9pt;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 1px 5px;
      color: #0f172a;
    }

    /* ── Lists ── */
    ul, ol {
      padding-left: 22px;
      margin: 6px 0 10px;
    }
    li { margin: 3px 0; }

    /* ── HR ── */
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 24px 0;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 18px;
      font-size: 9.5pt;
    }
    th {
      background: #4f46e5;
      color: #fff;
      font-weight: 600;
      padding: 8px 12px;
      text-align: left;
    }
    td {
      padding: 7px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    tr:nth-child(even) td { background: #f8fafc; }

    /* ── Blockquote (demo credentials) ── */
    blockquote {
      border-left: 4px solid #4f46e5;
      background: #eef2ff;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin: 14px 0;
      color: #3730a3;
      font-size: 9.5pt;
    }
    blockquote p { margin: 0; }

    /* ── Print button ── */
    .print-btn {
      position: fixed;
      top: 18px;
      right: 24px;
      background: #4f46e5;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px 22px;
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(79,70,229,0.35);
      transition: background 0.2s;
      z-index: 100;
    }
    .print-btn:hover { background: #4338ca; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Save as PDF</button>
  <div class="page">
    ${body}
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, htmlDoc, 'utf8');
console.log('✅ Done! HTML file created:');
console.log('   ' + htmlPath);
console.log('');
console.log('👉 Open the file in Chrome or Edge, then press Ctrl+P and choose "Save as PDF".');
console.log('   Make sure to set margins to "None" or "Minimum" for best results.');
