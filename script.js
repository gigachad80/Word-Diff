// ══════════════════════════════════════════════
// GLOBALS
// ══════════════════════════════════════════════
let curMode = 'word', curView = 'inline', lastDiff = null;
let navIdx = 0, changeEls = [];
let imgDataA = null, imgDataB = null, curImgView = 'diff';
let lastImgResult = null;

// ══════════════════════════════════════════════
// TAB SWITCH
// ══════════════════════════════════════════════
function switchTab(t) {
    document.getElementById('secText').style.display = t === 'text' ? '' : 'none';
    document.getElementById('secImg').style.display = t === 'img' ? '' : 'none';
    document.getElementById('tabText').classList.toggle('on', t === 'text');
    document.getElementById('tabImg').classList.toggle('on', t === 'img');
}

// ══════════════════════════════════════════════
// MODE / VIEW
// ══════════════════════════════════════════════
function setMode(m) {
    curMode = m;
    ['word', 'line', 'char'].forEach(x => {
        const id = 'm' + x.charAt(0).toUpperCase() + x.slice(1);
        document.getElementById(id).classList.toggle('on', x === m);
    });
    if (lastDiff) renderDiff(lastDiff);
}
function setView(v) {
    curView = v;
    document.getElementById('vInline').classList.toggle('on', v === 'inline');
    document.getElementById('vSbs').classList.toggle('on', v === 'sbs');
    if (lastDiff) renderDiff(lastDiff);
}
function onLangChange() { if (lastDiff) renderDiff(lastDiff); }

// ══════════════════════════════════════════════
// FILE / DRAG
// ══════════════════════════════════════════════
function loadFile(e, id) {
    const f = e.target.files[0]; if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    const extLangMap = { js: 'javascript', ts: 'typescript', py: 'python', go: 'go', rs: 'rust', c: 'c', cpp: 'cpp', java: 'java', sh: 'bash', bash: 'bash', css: 'css', html: 'markup', xml: 'markup', json: 'json', yml: 'yaml', yaml: 'yaml', sql: 'sql', md: 'markdown' };
    if (extLangMap[ext]) { document.getElementById('langSel').value = extLangMap[ext]; }

    // fix: need single reader
    const r = new FileReader();
    r.onload = ev => { document.getElementById(id).value = ev.target.result; onInput(); };
    r.readAsText(f);
    e.target.value = '';
}
function handleDrop(e, id) {
    e.preventDefault();
    const f = e.dataTransfer.files[0]; if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    const extLangMap = { js: 'javascript', ts: 'typescript', py: 'python', go: 'go', rs: 'rust', c: 'c', cpp: 'cpp', java: 'java', sh: 'bash', bash: 'bash', css: 'css', html: 'markup', xml: 'markup', json: 'json', yml: 'yaml', yaml: 'yaml', sql: 'sql', md: 'markdown' };
    if (extLangMap[ext]) document.getElementById('langSel').value = extLangMap[ext];
    const r = new FileReader();
    r.onload = ev => { document.getElementById(id).value = ev.target.result; onInput(); };
    r.readAsText(f);
}

function importFromURL(id) {
    const raw = prompt(
        'Paste a public URL to import:\n\n' +
        '• Google Drive: File > Share > "Anyone with link" > copy link\n' +
        '• OneDrive: Share > "Anyone" > copy link\n' +
        '• Dropbox: change ?dl=0 to ?dl=1 at end of URL\n' +
        '• GitHub: use raw.githubusercontent.com URL\n' +
        '• Any direct text file URL'
    );
    if (!raw || !raw.trim()) return;

    let url = raw.trim();

    // Google Drive transform: /file/d/FILE_ID/view -> direct download
    const gdMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (gdMatch) {
        url = `https://drive.google.com/uc?export=download&id=${gdMatch[1]}`;
    }

    // OneDrive transform: 1drv.ms or sharepoint share links
    // OneDrive public share links need server-side resolution — note this below
    const odMatch = url.match(/1drv\.ms|onedrive\.live\.com|sharepoint\.com/);
    if (odMatch) {
        showToast('OneDrive: use File > Download and paste the direct .txt URL instead', 4000);
        return;
    }

    // Dropbox: ensure dl=1
    if (url.includes('dropbox.com')) {
        url = url.replace('dl=0', 'dl=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    }

    showToast('Fetching…');
    fetch(url)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.text();
        })
        .then(text => {
            document.getElementById(id).value = text;
            onInput();
            showToast('Imported successfully');
        })
        .catch(err => {
            showToast('Failed: CORS blocked or invalid URL. Try a raw/direct link.', 4000);
        });
}

// ══════════════════════════════════════════════
// META COUNTERS
// ══════════════════════════════════════════════
function countText(t) {
    if (!t.trim()) return '—';
    return t.split('\n').length + 'L · ' + t.trim().split(/\s+/).filter(Boolean).length + 'W · ' + t.length + 'C';
}
function onInput() {
    document.getElementById('metaA').textContent = countText(document.getElementById('orig').value);
    document.getElementById('metaB').textContent = countText(document.getElementById('mod').value);
}

// ══════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function swapTexts() { const a = document.getElementById('orig'), b = document.getElementById('mod');[a.value, b.value] = [b.value, a.value]; onInput(); }
function clearAll() {
    document.getElementById('orig').value = ''; document.getElementById('mod').value = ''; onInput();
    document.getElementById('diffOut').innerHTML = '<div class="empty">Paste text in both panels<br><strong>then click Compare</strong></div>';
    document.getElementById('stBox').style.display = 'none'; document.getElementById('rh').style.display = 'none';
    document.getElementById('shareRow').style.display = 'none'; lastDiff = null;
}

function showToast(msg, dur = 2400) {
    const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), dur);
}
function copyResult() {
    if (!lastDiff) { showToast('Nothing to copy'); return; }
    const lines = lastDiff.map(d => {
        if (d.type === 'same') return '  ' + (d.text ?? '');
        if (d.type === 'add') return '+ ' + (d.text ?? '');
        if (d.type === 'del') return '- ' + (d.text ?? '');
        if (d.type === 'chg') return '~ ' + (d.orig ?? '') + ' → ' + (d.mod ?? '');
        return '';
    });
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Copied to clipboard'));
}

// ══════════════════════════════════════════════
// SHARE URL (base64 + URL hash, no server)
// ══════════════════════════════════════════════
function b64enc(s) { try { return btoa(unescape(encodeURIComponent(s))); } catch { return ''; } }
function b64dec(s) { try { return decodeURIComponent(escape(atob(s))); } catch { return ''; } }

function shareURL() {
    const a = document.getElementById('orig').value;
    const b = document.getElementById('mod').value;
    if (!a.trim() || !b.trim()) { showToast('Fill both panels first'); return; }
    const payload = JSON.stringify({ a, b, mode: curMode, lang: document.getElementById('langSel').value });
    const enc = b64enc(payload);
    if (enc.length > 200000) { showToast('Texts too large for URL sharing (>150KB)'); return; }
    const url = location.href.split('#')[0] + '#d=' + enc;
    document.getElementById('shareUrlTxt').textContent = url;
    document.getElementById('shareRow').style.display = 'flex';
}
function copyShareURL() {
    const url = document.getElementById('shareUrlTxt').textContent;
    navigator.clipboard.writeText(url).then(() => showToast('Share URL copied'));
}
function loadFromHash() {
    const hash = location.hash;
    if (!hash.startsWith('#d=')) return;
    try {
        const raw = b64dec(hash.slice(3));
        const { a, b, mode, lang } = JSON.parse(raw);
        document.getElementById('orig').value = a || '';
        document.getElementById('mod').value = b || '';
        if (mode) setMode(mode);
        if (lang) document.getElementById('langSel').value = lang;
        onInput();
        setTimeout(runCompare, 300);
        showToast('Loaded from shared link', 3000);
    } catch (e) { showToast('Could not load shared link'); }
}

function exportHTML() {
    if (!lastDiff) { showToast('Run a comparison first'); return; }
    const out = document.getElementById('diffOut').outerHTML;
    const stats = document.getElementById('stBox').outerHTML;
    const css = document.querySelector('style').textContent;
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>DeltaX Export</title><style>body{background:#07090f;color:#dde4f0;font-family:'IBM Plex Mono',monospace;padding:2rem}${css}</style></head><body>${stats}${out}</body></html>`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([full], { type: 'text/html' })); a.download = 'deltax-diff.html'; a.click();
    showToast('Exported');
}

// ══════════════════════════════════════════════
// LCS ALGORITHM
// ══════════════════════════════════════════════
function lcs(a, b) {
    const m = a.length, n = b.length;
    if (m === 0 && n === 0) return [];
    const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const r = []; let i = 0, j = 0;
    while (i < m && j < n) {
        if (a[i] === b[j]) { r.push({ type: 'same', val: a[i] }); i++; j++; }
        else if (dp[i + 1][j] >= dp[i][j + 1]) { r.push({ type: 'del', val: a[i] }); i++; }
        else { r.push({ type: 'add', val: b[j] }); j++; }
    }
    while (i < m) { r.push({ type: 'del', val: a[i] }); i++; }
    while (j < n) { r.push({ type: 'add', val: b[j] }); j++; }
    return r;
}

// ══════════════════════════════════════════════
// TOKENIZE
// ══════════════════════════════════════════════
function tokenize(text, mode, igWs, igCase) {
    let toks;
    if (mode === 'line') toks = text.split('\n');
    else if (mode === 'word') toks = text.match(/\S+|\s+/g) || [];
    else toks = text.split('');
    if (igWs && mode !== 'line') toks = toks.filter(t => t.trim() !== '');
    if (igCase) toks = toks.map(t => t.toLowerCase());
    return toks;
}

// ══════════════════════════════════════════════
// BUILD DIFF
// ══════════════════════════════════════════════
function buildDiff(origTxt, modTxt) {
    const igWs = document.getElementById('ignWs').checked;
    const igCase = document.getElementById('ignCase').checked;
    const mode = curMode;
    const oToks = tokenize(origTxt, mode, igWs, igCase);
    const mToks = tokenize(modTxt, mode, igWs, igCase);
    const oRaw = mode === 'line' ? origTxt.split('\n') : (mode === 'word' ? origTxt.match(/\S+|\s+/g) || [] : origTxt.split(''));
    const mRaw = mode === 'line' ? modTxt.split('\n') : (mode === 'word' ? modTxt.match(/\S+|\s+/g) || [] : modTxt.split(''));
    const oRawF = igWs && mode !== 'line' ? oRaw.filter(t => t.trim() !== '') : oRaw;
    const mRawF = igWs && mode !== 'line' ? mRaw.filter(t => t.trim() !== '') : mRaw;
    const MAX = 6000;
    let raw;
    if (oToks.length > MAX || mToks.length > MAX) {
        raw = zipDiff(oToks, oRawF, mToks, mRawF);
    } else {
        raw = lcs(oToks, mToks);
        let oi = 0, mi = 0;
        raw = raw.map(d => {
            if (d.type === 'same') { const r = { ...d, dv: oRawF[oi] }; oi++; mi++; return r; }
            if (d.type === 'del') { const r = { ...d, dv: oRawF[oi] }; oi++; return r; }
            const r = { ...d, dv: mRawF[mi] }; mi++; return r;
        });
    }
    return mode === 'line' ? groupLines(raw) : groupTokensIntoLines(raw, origTxt, modTxt, mode, igWs, igCase);
}

function zipDiff(oT, oR, mT, mR) {
    const len = Math.max(oT.length, mT.length), r = [];
    for (let i = 0; i < len; i++) {
        const o = oT[i], m = mT[i];
        if (o === undefined) r.push({ type: 'add', dv: mR[i] });
        else if (m === undefined) r.push({ type: 'del', dv: oR[i] });
        else if (o === m) r.push({ type: 'same', dv: oR[i] });
        else { r.push({ type: 'del', dv: oR[i] }); r.push({ type: 'add', dv: mR[i] }); }
    }
    return r;
}

function groupLines(raw) {
    const r = []; let i = 0;
    while (i < raw.length) {
        const d = raw[i];
        if (d.type === 'del' && raw[i + 1]?.type === 'add') { r.push({ type: 'chg', orig: d.dv, mod: raw[i + 1].dv }); i += 2; }
        else if (d.type === 'same') { r.push({ type: 'same', text: d.dv }); i++; }
        else if (d.type === 'add') { r.push({ type: 'add', text: d.dv }); i++; }
        else { r.push({ type: 'del', text: d.dv }); i++; }
    }
    return r;
}

function groupTokensIntoLines(raw, origTxt, modTxt, mode, igWs, igCase) {
    const oL = origTxt.split('\n'), mL = modTxt.split('\n');
    const maxL = Math.max(oL.length, mL.length), r = [];
    for (let l = 0; l < maxL; l++) {
        const ol = oL[l], ml = mL[l];
        if (ol === undefined) { r.push({ type: 'add', text: ml, tokens: null }); continue; }
        if (ml === undefined) { r.push({ type: 'del', text: ol, tokens: null }); continue; }
        if (ol === ml) { r.push({ type: 'same', text: ol, tokens: null }); continue; }
        const oT = mode === 'word' ? (ol.match(/\S+|\s+/g) || []) : ol.split('');
        const mT = mode === 'word' ? (ml.match(/\S+|\s+/g) || []) : ml.split('');
        const oN = oT.map(t => igCase ? t.toLowerCase() : t);
        const mN = mT.map(t => igCase ? t.toLowerCase() : t);
        let sub = oN.length + mN.length < 2000 ? lcs(oN, mN) : zipDiff(oN, oT, mN, mT);
        let oi = 0, mi = 0;
        sub = sub.map(d => {
            if (d.type === 'same') { const rv = { type: 'same', val: oT[oi] }; oi++; mi++; return rv; }
            if (d.type === 'del') { const rv = { type: 'del', val: oT[oi] }; oi++; return rv; }
            const rv = { type: 'add', val: mT[mi] }; mi++; return rv;
        });
        r.push({ type: 'chg', orig: ol, mod: ml, tokens: sub });
    }
    return r;
}

// ══════════════════════════════════════════════
// SYNTAX HIGHLIGHT via Prism
// ══════════════════════════════════════════════
function hlText(code) {
    const lang = document.getElementById('langSel').value;
    if (lang === 'none' || !Prism.languages[lang]) return esc(code);
    try { return Prism.highlight(code, Prism.languages[lang], lang); }
    catch { return esc(code); }
}

// ══════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════
const COLL = 5;

function renderDiff(diff) {
    const hideU = document.getElementById('hideUnch').checked;
    const out = document.getElementById('diffOut');
    out.innerHTML = curView === 'sbs' ? renderSBS(diff, hideU) : renderInline(diff, hideU);
    changeEls = Array.from(out.querySelectorAll('.a,.d,.c')).filter(el => el.classList.contains('dl') || el.classList.contains('sl2'));
    navIdx = 0; updateNav();
}

function renderInline(diff, hideU) {
    if (!diff.length) return '<div class="empty">No differences found!</div>';
    let html = '', srun = [], lnO = 0, lnM = 0;
    function flush() {
        if (!srun.length) return;
        if (hideU) { srun = []; return; }
        if (srun.length > COLL * 2) {
            srun.slice(0, 2).forEach(x => { html += iLine(x, 's'); });
            html += `<div class="dl col"><span class="colinfo">··· ${srun.length - 4} unchanged lines ···</span></div>`;
            srun.slice(-2).forEach(x => { html += iLine(x, 's'); });
        } else { srun.forEach(x => { html += iLine(x, 's'); }); }
        srun = [];
    }
    diff.forEach((d, i) => {
        if (d.type === 'same') { lnO++; lnM++; srun.push({ ...d, ln: lnO }); return; }
        if (d.type === 'add') { lnM++; flush(); html += iLine({ ...d, ln: lnM }, 'a'); return; }
        if (d.type === 'del') { lnO++; flush(); html += iLine({ ...d, ln: lnO }, 'd'); return; }
        if (d.type === 'chg') { lnO++; lnM++; flush(); html += iLine({ ...d, ln: lnO }, 'c'); return; }
    });
    flush();
    return html || '<div class="empty">No differences found!</div>';
}

function iLine(d, cls) {
    const sign = cls === 'a' ? '+' : cls === 'd' ? '−' : '~';
    let txt = '';
    if (cls === 's') txt = hlText(d.text ?? d.orig ?? '');
    else if (cls === 'a') txt = hlText(d.text ?? '');
    else if (cls === 'd') txt = hlText(d.text ?? '');
    else if (cls === 'c') {
        if (d.tokens) {
            txt = d.tokens.map(t => {
                if (t.type === 'same') return hlText(t.val ?? '');
                if (t.type === 'del') return `<span class="td">${hlText(t.val ?? '')}</span>`;
                return `<span class="ta">${hlText(t.val ?? '')}</span>`;
            }).join('');
        } else txt = `<span class="td">${hlText(d.orig ?? '')}</span> <span class="ta">${hlText(d.mod ?? '')}</span>`;
    }
    return `<div class="dl ${cls}"><span class="ln">${d.ln ?? ''}</span><span class="ds">${sign}</span><div class="dt">${txt}</div></div>`;
}

function renderSBS(diff, hideU) {
    if (!diff.length) return '<div class="empty">No differences found!</div>';
    const L = [], R = [];
    diff.forEach((d, i) => {
        const ln = i + 1;
        if (d.type === 'same') {
            if (hideU) return;
            L.push({ cls: 's', ln, txt: d.text ?? '', tokens: null, side: 'L' });
            R.push({ cls: 's', ln, txt: d.text ?? '', tokens: null, side: 'R' });
        } else if (d.type === 'add') {
            L.push({ cls: 'e', ln: '', txt: '', tokens: null, side: 'L' });
            R.push({ cls: 'a', ln, txt: d.text ?? '', tokens: null, side: 'R' });
        } else if (d.type === 'del') {
            L.push({ cls: 'd', ln, txt: d.text ?? '', tokens: null, side: 'L' });
            R.push({ cls: 'e', ln: '', txt: '', tokens: null, side: 'R' });
        } else {
            L.push({ cls: 'c', ln, txt: d.orig ?? '', tokens: d.tokens, side: 'L' });
            R.push({ cls: 'c', ln, txt: d.mod ?? '', tokens: d.tokens, side: 'R' });
        }
    });
    const maxR = Math.max(L.length, R.length);
    let lh = '', rh = '';
    for (let i = 0; i < maxR; i++) { lh += sbsRow(L[i]); rh += sbsRow(R[i]); }
    return `<div class="sbs"><div class="sp"><div class="sh L">− Original</div>${lh}</div><div class="sp"><div class="sh R">+ Modified</div>${rh}</div></div>`;
}

function sbsRow(d) {
    if (!d) return `<div class="sl2 e"><span class="ln"></span><div class="dt"></div></div>`;
    let txt = '';
    if (d.tokens) {
        if (d.side === 'L') txt = d.tokens.filter(t => t.type !== 'add').map(t => t.type === 'same' ? hlText(t.val ?? '') : `<span class="td">${hlText(t.val ?? '')}</span>`).join('');
        else txt = d.tokens.filter(t => t.type !== 'del').map(t => t.type === 'same' ? hlText(t.val ?? '') : `<span class="ta">${hlText(t.val ?? '')}</span>`).join('');
    } else {
        txt = hlText(d.txt);
    }
    return `<div class="sl2 ${d.cls}"><span class="ln">${d.ln}</span><div class="dt">${txt}</div></div>`;
}

// ══════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════
function computeStats(diff) {
    let s = 0, a = 0, d = 0, c = 0;
    diff.forEach(x => { if (x.type === 'same') s++; else if (x.type === 'add') a++; else if (x.type === 'del') d++; else c++; });
    const t = s + a + d + c, sim = t === 0 ? 100 : Math.round(s / t * 100);
    document.getElementById('stT').textContent = t;
    document.getElementById('stS').textContent = s;
    document.getElementById('stA').textContent = a;
    document.getElementById('stD').textContent = d;
    document.getElementById('stC').textContent = c;
    document.getElementById('simPct').textContent = sim + '%';
    document.getElementById('simF').style.width = sim + '%';
    document.getElementById('stBox').style.display = 'flex';
    document.getElementById('rh').style.display = 'flex';
    const ml = curMode === 'line' ? 'Line' : curMode === 'char' ? 'Char' : 'Word';
    const lang = document.getElementById('langSel').value;
    document.getElementById('rtitle').textContent = `${ml} Diff${lang !== 'none' ? ' · ' + lang : ''} — ${t} tokens`;
}

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function navDiff(dir) {
    if (!changeEls.length) return;
    navIdx = Math.max(0, Math.min(changeEls.length - 1, navIdx + dir));
    changeEls[navIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
    changeEls[navIdx].style.outline = '2px solid var(--acc)';
    setTimeout(() => { if (changeEls[navIdx]) changeEls[navIdx].style.outline = ''; }, 700);
    updateNav();
}
function updateNav() {
    const n = changeEls.length;
    document.getElementById('npos').textContent = n ? `${navIdx + 1}/${n}` : '0/0';
    document.getElementById('np').disabled = navIdx <= 0;
    document.getElementById('nn').disabled = navIdx >= n - 1;
}
function beautifyPanels() {
    const lang = document.getElementById('langSel').value;
    ['orig', 'mod'].forEach(id => {
        const ta = document.getElementById(id);
        let code = ta.value;
        if (!code.trim()) return;
        try {
            if (lang === 'json') {
                code = JSON.stringify(JSON.parse(code), null, 2);
            } else if (lang === 'markup') {
                // basic XML/HTML indent
                let indent = 0;
                code = code
                    .replace(/>\s*</g, '>\n<')
                    .split('\n')
                    .map(line => {
                        line = line.trim();
                        if (!line) return '';
                        if (line.match(/^<\/[^>]+>/)) indent = Math.max(0, indent - 1);
                        const out = '  '.repeat(indent) + line;
                        if (line.match(/^<[^\/!][^>]*[^\/]>$/) && !line.match(/<.*>.*<\/.*>/)) indent++;
                        return out;
                    })
                    .filter(Boolean)
                    .join('\n');
            } else if (lang === 'css') {
                code = code
                    .replace(/\s*{\s*/g, ' {\n  ')
                    .replace(/;\s*/g, ';\n  ')
                    .replace(/\s*}\s*/g, '\n}\n')
                    .replace(/,\s*/g, ',\n');
            } else if (['javascript', 'typescript'].includes(lang)) {
                // basic: normalize semicolons, braces spacing
                code = code
                    .replace(/\s*{\s*/g, ' {\n  ')
                    .replace(/;\s+/g, ';\n  ')
                    .replace(/\s*}\s*/g, '\n}\n');
            }
            // YAML, SQL, Python etc: no reliable client-side formatter, skip
        } catch (e) {
            showToast('Could not format — check syntax');
            return;
        }
        ta.value = code;
    });
    onInput();
    showToast('Formatted both panels');
}
// ══════════════════════════════════════════════
// MAIN COMPARE
// ══════════════════════════════════════════════
function runCompare() {
    const a = document.getElementById('orig').value;
    const b = document.getElementById('mod').value;
    if (!a.trim() || !b.trim()) { showToast('Please fill both panels'); return; }
    lastDiff = buildDiff(a, b);
    computeStats(lastDiff);
    renderDiff(lastDiff);
}

document.getElementById('hideUnch').addEventListener('change', () => { if (lastDiff) renderDiff(lastDiff); });

// ══════════════════════════════════════════════
// IMAGE DIFF
// ══════════════════════════════════════════════
function imgOver(e, side) { e.preventDefault(); document.getElementById('drop' + side).classList.add('over'); }
function imgLeave(side) { document.getElementById('drop' + side).classList.remove('over'); }

function imgDrop(e, side) {
    e.preventDefault(); imgLeave(side);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) imgReadFile(f, side);
}
function imgLoad(e, side) {
    const f = e.target.files[0]; if (f) imgReadFile(f, side); e.target.value = '';
}
function imgReadFile(file, side) {
    const reader = new FileReader();
    reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
            const drop = document.getElementById('drop' + side);
            drop.innerHTML = '';
            const im = document.createElement('img'); im.src = ev.target.result; drop.appendChild(im);
            // add remove btn
            const rb = document.createElement('button'); rb.className = 'btn'; rb.textContent = 'Remove'; rb.style.cssText = 'margin-top:.5rem;font-size:.7rem';
            rb.onclick = () => resetImgDrop(side); drop.appendChild(rb);
            if (side === 'A') imgDataA = img; else imgDataB = img;
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
}
function resetImgDrop(side) {
    const drop = document.getElementById('drop' + side);
    drop.innerHTML = `<input type="file" accept="image/*" onchange="imgLoad(event,'${side}')"><div class="ph"><strong>+</strong>Click or drag image here<br><span style="font-size:.72rem">PNG, JPG, WebP, GIF</span></div>`;
    if (side === 'A') imgDataA = null; else imgDataB = null;
}

function runImgDiff() {
    if (!imgDataA || !imgDataB) { showToast('Load both images first'); return; }
    const w = Math.max(imgDataA.width, imgDataB.width);
    const h = Math.max(imgDataA.height, imgDataB.height);
    const ca = document.createElement('canvas'), cb = document.createElement('canvas');
    ca.width = cb.width = w; ca.height = cb.height = h;
    const ctxA = ca.getContext('2d'), ctxB = cb.getContext('2d');
    ctxA.drawImage(imgDataA, 0, 0); ctxB.drawImage(imgDataB, 0, 0);
    const pdA = ctxA.getImageData(0, 0, w, h), pdB = ctxB.getImageData(0, 0, w, h);
    const out = new ImageData(w, h);
    let diffPx = 0;
    for (let i = 0; i < pdA.data.length; i += 4) {
        const dr = Math.abs(pdA.data[i] - pdB.data[i]);
        const dg = Math.abs(pdA.data[i + 1] - pdB.data[i + 1]);
        const db = Math.abs(pdA.data[i + 2] - pdB.data[i + 2]);
        const delta = (dr + dg + db) / 3;
        if (delta > 10) {
            diffPx++;
            out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 60; out.data[i + 3] = 200;
        } else {
            out.data[i] = pdA.data[i] * 0.3; out.data[i + 1] = pdA.data[i + 1] * 0.3; out.data[i + 2] = pdA.data[i + 2] * 0.3; out.data[i + 3] = pdA.data[i + 3];
        }
    }
    lastImgResult = { pdA, pdB, out, w, h, diffPx };
    document.getElementById('imgDimA').textContent = imgDataA.width + '×' + imgDataA.height + 'px';
    document.getElementById('imgDimB').textContent = imgDataB.width + '×' + imgDataB.height + 'px';
    const totalPx = w * h;
    const pct = (diffPx / totalPx * 100).toFixed(2);
    document.getElementById('imgDiffPx').textContent = diffPx.toLocaleString();
    document.getElementById('imgDiffPct').textContent = pct + '%';
    document.getElementById('imgSim').textContent = (100 - parseFloat(pct)).toFixed(2) + '%';
    document.getElementById('imgResult').style.display = 'block';
    setImgView('diff');
}

function setImgView(v) {
    curImgView = v;
    ['Diff', 'Blend', 'A', 'B'].forEach(x => document.getElementById('iv' + x).classList.toggle('on', x.toLowerCase() === v));
    if (!lastImgResult) return;
    const { pdA, pdB, out, w, h } = lastImgResult;
    const canvas = document.getElementById('imgCanvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (v === 'diff') {
        ctx.putImageData(out, 0, 0);
    } else if (v === 'blend') {
        const t1 = document.createElement('canvas'), t2 = document.createElement('canvas');
        t1.width = t2.width = w; t1.height = t2.height = h;
        t1.getContext('2d').putImageData(pdA, 0, 0);
        t2.getContext('2d').putImageData(pdB, 0, 0);
        ctx.globalAlpha = 0.5; ctx.drawImage(t1, 0, 0);
        ctx.globalAlpha = 0.5; ctx.drawImage(t2, 0, 0);
        ctx.globalAlpha = 1;
    } else if (v === 'a') {
        ctx.putImageData(pdA, 0, 0);
    } else {
        ctx.putImageData(pdB, 0, 0);
    }
}

// ══════════════════════════════════════════════
// INIT: load from URL hash if present
// ══════════════════════════════════════════════
onInput();
loadFromHash();
