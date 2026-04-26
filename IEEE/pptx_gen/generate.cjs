'use strict';
const PptxGenJS = require('pptxgenjs');
const path = require('path');

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 inches

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '0F172A', bg2:    '1E293B', bg3:    '162032',
  accent:  '4F46E5', accent2:'818CF8', accent3:'C7D2FE',
  text:    'F8FAFC', sub:    '94A3B8', muted:  '64748B',
  green:   '10B981', greenBg:'064E3B',
  yellow:  'F59E0B', red:    'EF4444',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function base(pptx, noBar) {
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  if (!noBar) {
    s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:13.33, h:0.07, fill:{color:C.accent}, line:{color:C.accent} });
  }
  return s;
}
function rect(s, pptx, x, y, w, h, color, r) {
  const opts = { x, y, w, h, fill:{color}, line:{color} };
  if (r) opts.rectRadius = r;
  s.addShape(r ? pptx.ShapeType.roundRect : pptx.ShapeType.rect, opts);
}
function txt(s, str, x, y, w, h, opts={}) {
  s.addText(str, { x, y, w, h, fontFace:'Calibri', wrap:true, valign:'top', color:C.text, fontSize:14, ...opts });
}
function tag(s, str, x=0.5, y=0.1) {
  txt(s, str, x, y, 6, 0.28, { fontSize:10, bold:true, color:C.accent2 });
}
function heading(s, str, y=0.42) {
  txt(s, str, 0.5, y, 12.33, 0.8, { fontSize:26, bold:true, color:C.text });
}
function divider(s, y, x=0.5, w=12.33) {
  s.addShape(pptx.ShapeType.rect, { x, y, w, h:0.02, fill:{color:C.bg2}, line:{color:C.bg2} });
}
function pill(s, pptx, label, x, y, w=2.6, bg=C.accent) {
  rect(s, pptx, x, y, w, 0.38, bg, 0.12);
  txt(s, label, x, y, w, 0.38, { fontSize:11, bold:true, align:'center', valign:'middle', color:C.text });
}
function card(s, pptx, x, y, w, h, title, body, titleColor=C.accent2) {
  rect(s, pptx, x, y, w, h, C.bg2, 0.1);
  txt(s, title, x+0.18, y+0.14, w-0.36, 0.38, { fontSize:13, bold:true, color:titleColor });
  txt(s, body,  x+0.18, y+0.55, w-0.36, h-0.7, { fontSize:11, color:C.sub, lineSpacingMultiple:1.2 });
}

// ── SLIDE 1 — Title ───────────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  // Left accent stripe
  s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:0.18, h:7.5, fill:{color:C.accent}, line:{color:C.accent} });
  // Decorative circles
  s.addShape(pptx.ShapeType.ellipse, { x:9.8, y:3.2, w:5.5, h:5.5, fill:{color:C.bg2}, line:{color:C.bg2} });
  s.addShape(pptx.ShapeType.ellipse, { x:10.8, y:4.0, w:4.0, h:4.0, fill:{color:'2D2B8F'}, line:{color:'2D2B8F'} });
  // Title
  txt(s, 'MealMate', 0.55, 1.1, 9, 2.0, { fontSize:76, bold:true, color:C.text });
  // Underline
  s.addShape(pptx.ShapeType.rect, { x:0.55, y:3.15, w:4.5, h:0.07, fill:{color:C.accent}, line:{color:C.accent} });
  // Subtitle
  txt(s, 'AI-Powered Meal Planning & Smart Grocery Management', 0.55, 3.35, 9.5, 0.7, { fontSize:19, color:C.accent2 });
  txt(s, 'Omar ElSayed  •  April 2026  •  Software Engineering Project', 0.55, 4.15, 9, 0.4, { fontSize:13, color:C.sub });
  // Live badge
  rect(s, pptx, 0.55, 4.75, 2.8, 0.5, C.greenBg, 0.1);
  txt(s, '● LIVE DEPLOYMENT', 0.55, 4.75, 2.8, 0.5, { fontSize:12, bold:true, color:C.green, align:'center', valign:'middle' });
  txt(s, 'mealmate-835.pages.dev', 3.55, 4.82, 5, 0.36, { fontSize:12, color:C.sub });
}

// ── SLIDE 2 — The Problem ─────────────────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'THE CHALLENGE');
  heading(s, 'Household Meal Planning is Broken');
  divider(s, 1.28);
  const problems = [
    ['🗑️  Food Waste',      'UN estimates 1.05B tonnes of food wasted globally per year — households responsible for ~60% of it.'],
    ['💸  Overspending',    'Unplanned grocery shopping leads to over-purchasing, duplicate buying, and inflated weekly bills.'],
    ['⏱️  Time Lost',       'Juggling recipe sites, notes apps, and spreadsheets creates daily friction that discourages planning.'],
    ['📦  No Inventory View','Households routinely buy ingredients they already own because there is no unified pantry tracking.'],
  ];
  problems.forEach(([title, body], i) => {
    const x = i < 2 ? 0.4 : 6.87;
    const y = i % 2 === 0 ? 1.45 : 3.65;
    card(s, pptx, x, y, 6.2, 1.9, title, body, C.accent2);
  });
}

// ── SLIDE 3 — Our Solution ────────────────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'THE SOLUTION');
  heading(s, 'One Platform. The Full Food Lifecycle.');
  divider(s, 1.28);
  txt(s,
    'MealMate integrates every step — from recipe discovery to pantry tracking — into a single cohesive workflow, ' +
    'powered by edge AI and serverless computing, with zero cost to the end user.',
    0.5, 1.38, 12.33, 0.8, { fontSize:13, color:C.sub, lineSpacingMultiple:1.3 });
  const features = [
    ['🔗  AI Recipe Scraper', 'Paste any URL. Jina AI + Llama 3.3 70B extracts and normalises every ingredient automatically.'],
    ['📅  Weekly Meal Planner','Drag recipes into a 7-day grid. Serving sizes adjust dynamically.'],
    ['🛒  Smart Grocery List', 'Ingredients are merged, converted, and deducted from pantry stock automatically.'],
    ['🏪  Pantry Manager',     'Tracks existing stock and performs partial deductions down to the gram or millilitre.'],
    ['💰  Budget Tracker',     'Real-time cost overview updates live as meals are added or removed.'],
    ['🌐  Dietary Filters',    'Vegan, Vegetarian, Gluten-Free, High-Protein — personalised in one click.'],
  ];
  features.forEach(([title, body], i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    card(s, pptx, 0.4 + col * 4.3, 2.3 + row * 2.1, 4.05, 1.92, title, body);
  });
}

// ── SLIDE 4 — How It Works ────────────────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'ARCHITECTURE');
  heading(s, 'Serverless Edge Architecture');
  divider(s, 1.28);
  const steps = [
    ['1', 'User pastes a recipe URL into the React 18 SPA'],
    ['2', 'Cloudflare Edge Worker receives the request instantly'],
    ['3', 'Jina AI strips the webpage down to clean Markdown'],
    ['4', 'Llama 3.3 70B parses it into a typed JSON schema'],
    ['5', 'Data is stored in Supabase (PostgreSQL) via RLS-protected REST'],
    ['6', 'Planner, Grocery Engine & Pantry Manager query data in real-time'],
  ];
  steps.forEach(([num, desc], i) => {
    const y = 1.45 + i * 0.93;
    rect(s, pptx, 0.4, y, 0.55, 0.65, C.accent, 0.08);
    txt(s, num, 0.4, y, 0.55, 0.65, { fontSize:16, bold:true, align:'center', valign:'middle' });
    rect(s, pptx, 1.1, y+0.14, 11.0, 0.02, C.bg2);
    txt(s, desc, 1.25, y+0.02, 11.6, 0.6, { fontSize:13, color: i%2===0 ? C.text : C.sub });
    if (i < steps.length-1) {
      txt(s, '↓', 0.53, y+0.65, 0.35, 0.28, { fontSize:14, color:C.muted, align:'center' });
    }
  });
}

// ── SLIDE 5 — Technology Stack ────────────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'TECHNOLOGY');
  heading(s, 'Technology Stack');
  divider(s, 1.28);
  const rows = [
    [{ text:'Layer', options:{bold:true, color:C.text} }, { text:'Technology', options:{bold:true, color:C.text} }, { text:'Purpose', options:{bold:true, color:C.text} }],
    ['Frontend',    'React 18 + Vite 5 + Vanilla CSS',                   'Concurrent rendering, HMR, tree-shaken bundles'],
    ['Edge Compute','Cloudflare Workers (V8 Isolates)',                   'Globally distributed serverless backend — zero cold starts'],
    ['AI / LLM',   'Cloudflare Workers AI — Llama 3.3 70B',              'Deterministic recipe parsing engine'],
    ['Pre-processor','Jina AI Reader API',                               'HTML → clean Markdown before LLM ingestion'],
    ['Database',   'Supabase (PostgreSQL) + RLS',                        'Relational data, row-level security, REST layer'],
    ['Hosting',    'Cloudflare Pages',                                   'CDN-delivered SPA with CI/CD on every git push'],
    ['Testing',    'Jest + Supertest + Vitest + Postman',                '3-layer test strategy — 100% pass rate'],
  ];
  const tableRows = rows.map((r, i) => {
    if (i === 0) return r;
    return r.map((cell, ci) => ({
      text: cell,
      options: { color: ci === 0 ? C.accent2 : ci === 1 ? C.text : C.sub, fontSize:11 }
    }));
  });
  s.addTable(tableRows, {
    x:0.4, y:1.42, w:12.53,
    colW:[2.2, 4.0, 6.33],
    rowH:0.52,
    fill:{ color:C.bg2 },
    border:{ type:'solid', color:C.bg, pt:2 },
    fontFace:'Calibri',
    align:'left',
    valign:'middle',
    color:C.sub,
    fontSize:11,
    autoPage:false,
    firstRowAsHeader:true,
    colFill:[ {color:C.bg2} ],
    thead:{ fill:{color:C.accent}, color:C.text, bold:true, fontSize:12 },
  });
}

// ── SLIDE 6 — AI Pipeline ─────────────────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'NOVEL TECHNOLOGY');
  heading(s, 'The AI Recipe Scraper Pipeline');
  divider(s, 1.28);
  // Step boxes
  const steps = [
    { label:'Any Recipe URL', sub:'User pastes any link — no special format required', color:C.bg2 },
    { label:'Jina AI', sub:'Renders page, strips ads & scripts → outputs clean Markdown', color:'1E3A5F' },
    { label:'Llama 3.3 70B', sub:'Parses Markdown using a strict JSON schema system prompt', color:'2D1B69' },
    { label:'Typed JSON', sub:'{ ingredient, quantity, unit } — fully computable data', color:C.greenBg },
  ];
  const arrows = ['→','→','→'];
  steps.forEach(({ label, sub, color }, i) => {
    const x = 0.38 + i * 3.26;
    rect(s, pptx, x, 1.55, 2.9, 2.2, color, 0.12);
    txt(s, label, x+0.15, 1.75, 2.6, 0.55, { fontSize:14, bold:true, color:C.text, align:'center' });
    txt(s, sub,   x+0.15, 2.35, 2.6, 1.1,  { fontSize:10, color:C.sub,  align:'center', lineSpacingMultiple:1.25 });
    if (i < 3) txt(s, '→', x+2.9, 2.45, 0.36, 0.5, { fontSize:22, color:C.accent, align:'center' });
  });
  // Key insight box
  rect(s, pptx, 0.4, 4.0, 12.53, 1.3, '1A1040', 0.12);
  txt(s, '💡 Key Innovation', 0.7, 4.08, 4, 0.38, { fontSize:13, bold:true, color:C.accent2 });
  txt(s,
    'Unlike traditional scrapers that break on every website redesign, this pipeline uses the LLM as a semantic understanding layer. ' +
    'A string like "two 15oz cans of black beans, drained" becomes quantity:30, unit:"oz", ingredient:"black beans" — ' +
    'perfectly computable data, every time, on any website.',
    0.7, 4.45, 12.1, 0.75, { fontSize:11, color:C.sub, lineSpacingMultiple:1.2 });
}

// ── SLIDE 7 — Key Metrics ─────────────────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'VALIDATION');
  heading(s, 'Performance & Test Results');
  divider(s, 1.28);
  const metrics = [
    ['100%', 'Postman API\nTest Pass Rate', C.green],
    ['<200ms', 'API Response\nLatency', C.accent2],
    ['100%', 'JSON Schema\nCompliance', C.green],
    ['<200MB', 'Docker\nImage Size', C.accent2],
    ['0', 'Data Integrity\nErrors', C.green],
    ['€0', 'Total\nProject Budget', C.yellow],
  ];
  metrics.forEach(([val, label, color], i) => {
    const x = 0.38 + (i % 3) * 4.26;
    const y = i < 3 ? 1.45 : 4.2;
    rect(s, pptx, x, y, 3.9, 2.45, C.bg2, 0.14);
    txt(s, val,   x+0.2, y+0.35, 3.5, 1.0, { fontSize:42, bold:true, color, align:'center' });
    txt(s, label, x+0.2, y+1.45, 3.5, 0.85, { fontSize:13, color:C.sub, align:'center', lineSpacingMultiple:1.25 });
  });
}

// ── SLIDE 8 — Sustainability & SDGs ───────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'IMPACT');
  heading(s, 'Sustainability & SDG Alignment');
  divider(s, 1.28);
  const pillars = [
    ['🌱 Environmental', 'Pantry Manager + deduction algorithm directly reduces household food waste — one of the largest contributors to global carbon emissions.', C.green],
    ['🤝 Social', 'Dietary filters (Vegan, Vegetarian, Gluten-Free, High-Protein) democratise health-conscious nutrition planning at zero cost.', C.accent2],
    ['💰 Economic', 'Real-time budget tracker prevents overspending. Free-tier infrastructure means the tool is accessible to all income levels.', C.yellow],
  ];
  pillars.forEach(([title, body, color], i) => {
    const x = 0.38 + i * 4.26;
    rect(s, pptx, x, 1.45, 3.9, 2.5, C.bg2, 0.12);
    s.addShape(pptx.ShapeType.rect, { x, y:1.45, w:3.9, h:0.07, fill:{color}, line:{color} });
    txt(s, title, x+0.18, 1.6,  3.54, 0.5,  { fontSize:14, bold:true, color });
    txt(s, body,  x+0.18, 2.15, 3.54, 1.65, { fontSize:11, color:C.sub, lineSpacingMultiple:1.25 });
  });
  // SDG table
  const sdgRows = [
    [{ text:'SDG', options:{bold:true,color:C.text} }, { text:'Goal', options:{bold:true,color:C.text} }, { text:'How MealMate Contributes', options:{bold:true,color:C.text} }],
    [{ text:'SDG 1', options:{color:C.yellow} }, 'No Poverty',              'Reduces grocery spending for budget-constrained households'],
    [{ text:'SDG 2', options:{color:C.yellow} }, 'Zero Hunger',             'Promotes efficient, intentional food consumption'],
    [{ text:'SDG 3', options:{color:C.yellow} }, 'Good Health',             'Supports dietary-specific meal planning'],
    [{ text:'SDG 12',options:{color:C.yellow} }, 'Responsible Consumption', 'Reduces waste via pantry tracking & accurate shopping lists'],
  ];
  s.addTable(sdgRows, {
    x:0.38, y:4.1, w:12.55, colW:[1.3,2.8,8.45], rowH:0.47,
    fill:{color:C.bg2}, border:{type:'solid',color:C.bg,pt:2},
    fontFace:'Calibri', valign:'middle', color:C.sub, fontSize:11,
    thead:{ fill:{color:C.bg3}, color:C.text, bold:true, fontSize:11 },
  });
}

// ── SLIDE 9 — Milestones ──────────────────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'PROJECT STATUS');
  heading(s, 'Key Milestones Achieved');
  divider(s, 1.28);
  const items = [
    'Requirements & Architecture Baseline — MoSCoW priorities, UML diagrams before any code was written',
    'Secure Authentication Layer — JWT-based login verified with full Postman test collection',
    'Core Features Complete — Planner, Grocery Engine, Pantry Manager, Budget Tracker all implemented',
    'AI Scraper Deployed — Jina AI + Llama 3.3 70B pipeline live on Cloudflare Edge Workers',
    'Database Migration — Local SQLite → Supabase (PostgreSQL) with zero data loss',
    'Public Deployment — Live at mealmate-835.pages.dev with working demo account',
    'Testing Complete — 3-layer strategy (Jest + Supertest + Vitest + Postman) — 100% pass rate',
  ];
  items.forEach((item, i) => {
    const y = 1.45 + i * 0.82;
    rect(s, pptx, 0.4, y+0.08, 0.5, 0.5, C.accent, 0.06);
    txt(s, '✓', 0.4, y+0.08, 0.5, 0.5, { fontSize:16, bold:true, align:'center', valign:'middle' });
    txt(s, item, 1.1, y+0.1, 11.73, 0.5, { fontSize:12, color: i%2===0 ? C.text : C.sub });
  });
}

// ── SLIDE 10 — Future Vision ──────────────────────────────────────────────────
{
  const s = base(pptx);
  tag(s, 'ROADMAP');
  heading(s, 'Future Vision');
  divider(s, 1.28);
  const years = [
    ['Year 1',  C.accent,  [
      'React Native mobile app',
      'Community recipe library',
      '1,000 active users via university outreach',
      'Structured usability pilot study',
    ]],
    ['Year 2',  C.green,   [
      'Nutritional analysis API integration',
      'AI-generated personalized meal suggestions',
      'Grocery retailer API price feeds',
      'Premium freemium tier launch',
    ]],
    ['Year 3',  C.yellow,  [
      'Household group accounts',
      'B2B API for wellness platforms',
      'Full GDPR compliance audit',
      'Major grocery retailer partnerships',
    ]],
  ];
  years.forEach(([yr, color, bullets], i) => {
    const x = 0.38 + i * 4.26;
    rect(s, pptx, x, 1.45, 3.9, 5.6, C.bg2, 0.12);
    s.addShape(pptx.ShapeType.rect, { x, y:1.45, w:3.9, h:0.07, fill:{color}, line:{color} });
    txt(s, yr, x+0.18, 1.6, 3.54, 0.5, { fontSize:18, bold:true, color });
    bullets.forEach((b, j) => {
      txt(s, `• ${b}`, x+0.18, 2.25+j*0.88, 3.54, 0.75, { fontSize:12, color:C.sub, lineSpacingMultiple:1.2 });
    });
  });
}

// ── SLIDE 11 — Thank You ──────────────────────────────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: C.bg };
  s.addShape(pptx.ShapeType.rect, { x:0, y:0, w:13.33, h:0.07, fill:{color:C.accent}, line:{color:C.accent} });
  s.addShape(pptx.ShapeType.rect, { x:0, y:7.43, w:13.33, h:0.07, fill:{color:C.accent}, line:{color:C.accent} });
  // Decorative circles
  s.addShape(pptx.ShapeType.ellipse, { x:-1, y:4.5, w:5, h:5, fill:{color:C.bg2}, line:{color:C.bg2} });
  s.addShape(pptx.ShapeType.ellipse, { x:10, y:-0.5, w:5, h:5, fill:{color:'1A1855'}, line:{color:'1A1855'} });
  txt(s, 'Thank You', 1.5, 1.5, 10.33, 1.8, { fontSize:64, bold:true, color:C.text, align:'center' });
  s.addShape(pptx.ShapeType.rect, { x:4.5, y:3.3, w:4.33, h:0.06, fill:{color:C.accent}, line:{color:C.accent} });
  txt(s, 'Questions & Discussion', 1.5, 3.5, 10.33, 0.6, { fontSize:20, color:C.accent2, align:'center' });
  txt(s, 'Omar ElSayed  •  Software Engineering Project  •  April 2026', 1.5, 4.25, 10.33, 0.5, { fontSize:13, color:C.sub, align:'center' });
  // Demo box
  rect(s, pptx, 3.5, 5.05, 6.33, 1.4, C.bg2, 0.14);
  txt(s, '🌐  Live Demo', 3.5, 5.18, 6.33, 0.45, { fontSize:14, bold:true, color:C.accent2, align:'center' });
  txt(s, 'mealmate-835.pages.dev', 3.5, 5.6, 6.33, 0.4, { fontSize:13, color:C.text, align:'center' });
  txt(s, 'demo@mealmate.com  /  Demo1234!', 3.5, 5.98, 6.33, 0.35, { fontSize:11, color:C.sub, align:'center' });
}

// ── Write file ────────────────────────────────────────────────────────────────
const out = path.join(__dirname, '..', 'MealMate_Presentation.pptx');
pptx.writeFile({ fileName: out }).then(() => {
  console.log('✅ Done!');
  console.log('   ' + out);
}).catch(e => {
  console.error('❌ Error:', e.message);
});
