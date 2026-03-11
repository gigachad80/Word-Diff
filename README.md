
#  Word-Diff


#### Private **Text and image diff that runs entirely in your browser.**  No server. No account. No upload. One HTML file.
<div align="center">

![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-purple.svg)
![Platform](https://img.shields.io/badge/Platform-Browser%20%7C%20Offline-gray.svg)
![Development Time](https://img.shields.io/badge/Development%20Time-Approx%201%20hr%2020%20min-pink.svg)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/gigachad80/Word-Diff/issues)
[![Email](https://img.shields.io/badge/Email-pookielinuxuser%40tutamail.com-blue.svg?style=flat&logo=tutanota&logoColor=white)](mailto:pookielinuxuser@tutamail.com)


### 🌐 Live Demo 👉 [Live Demo]( https://gigachad80.github.io/Word-Diff)


</div>

## Table of Contents

- [What Makes It Different](#what-makes-it-different)
- [Live Demo](#live-demo)
- [Features at a Glance](#features-at-a-glance)
- [Syntax Highlighting Languages](#syntax-highlighting-languages)
- [How It Works](#how-it-works)
  - [Text Diff](#text-diff)
  - [Image Diff](#image-diff)
  - [Share via URL](#share-via-url)
  - [PDF Diff](#pdf-diff)
- [Size & Performance Limits](#size--performance-limits)
- [Deployment](#deployment)
- [Privacy](#privacy)
- [License](#license)



## What Makes It Different

| Feature | Word-Diff | diffchecker.com | Mergely |
|---------|-----------|-----------------|---------|
| **💰 Cost** | Forever free & open source | Free + $6–15/mo Pro | Free + $9/mo Pro |
| **🔒 Privacy** | 100% local, zero server | Web version may send data | Web version may send data |
| **✈️ Works offline** | Always | Desktop only ($49) | ❌ |
| **🎨 Syntax highlighting** | 16 languages, free | Pro only | ✅ |
| **🖼️ Image diff** | ✅ | Pro only | ❌ |
| **🔗 Share via URL** | Hash-based, no server | Server-stored | Server-stored |
| **📊 Similarity score** | ✅ | ❌ | ❌ |
| **📤 Export** | Self-contained HTML | PDF (Pro) | ❌ |
| **📦 Self-hostable** | Yes, one file | ❌ | Paid plan only |
| **🔀 Interactive merge** | ❌ | ❌ | ✅ |


## Live Demo

```
open index.html
```

 🌐 Live Demo 👉 [Live Demo](https://gigachad80.github.io/Word-Diff)

 Or
 
 Deploy to GitHub Pages in under 2 minutes . See [Deployment](#deployment).



## Features at a Glance

- **3 diff modes** - Word, Line, Character
- **2 view modes** - Inline unified and Side-by-Side
- **Syntax highlighting** - 16 languages via Prism.js, applied after diffing so you see both diff color and language color simultaneously
- **Image diff** - pixel-by-pixel canvas comparison with diff overlay, blend, and individual views
- **Share via URL** - both texts encoded into the URL hash, no server involved
- **File upload** - drag-and-drop or file picker, auto-detects language from extension
- **Ignore whitespace / Ignore case** - toggle before comparing
- **Changed-only mode** - hides unchanged lines
- **Navigation arrows** - jump between changes with a counter
- **Similarity score** - percentage bar showing how close the two texts are
- **Per-panel live counter** - lines / words / characters updated as you type
- **Export** - saves the rendered diff as a self-contained HTML file
- **Swap / Clear** - utility actions



## Syntax Highlighting Languages

| Language | Mode |
|----------|------|
| JavaScript | Full syntax |
| TypeScript | Full syntax |
| Python | Full syntax |
| **Go** | Full syntax |
| Rust | Full syntax |
| C | Full syntax |
| C++ | Full syntax |
| Java | Full syntax |
| Bash / Shell | Full syntax |
| CSS | Full syntax |
| HTML / XML | Markup |
| JSON | Full syntax |
| YAML | Full syntax |
| SQL | Full syntax |
| Markdown | Full syntax |

Language auto-detects from file extension on drag-and-drop (`.py` → Python, `.go` → Go, `.ts` → TypeScript, etc). Set manually from the dropdown otherwise. Plain text mode skips highlighting entirely.



## How It Works

### Text Diff

Word-Diff tokenizes both inputs into words, lines, or characters depending on the selected mode. It then runs an **LCS (Longest Common Subsequence)** algorithm - the same underlying algorithm used by `git diff` - which finds the minimum set of insertions and deletions that transforms one sequence into the other.

The result is grouped back into line-level records. Changed lines get a secondary token-level diff applied inline: deleted tokens are struck through in red, added tokens highlighted in green. Unchanged lines are dimmed and collapsed in groups when there are more than 10 in a row.

Syntax highlighting via Prism.js is applied per-line after diffing. The highlighted HTML is injected into the diff output, so both the diff color (which line changed) and the language color (what kind of token it is) are visible at the same time.

### Image Diff

1. Both images are drawn onto separate off-screen `<canvas>` elements sized to the larger of the two. Smaller images are padded with transparent pixels.
2. `ctx.getImageData()` extracts the raw RGBA pixel array from each canvas. Each pixel is 4 bytes: red, green, blue, alpha.
3. The two arrays are iterated in a single loop. For each pixel, the absolute difference of R, G, and B channels is averaged. Pixels with an average delta above 10 (on a 0–255 scale) are counted as different.
4. An output canvas is written: different pixels are painted red, unchanged pixels are rendered at 30% brightness to give context without distraction.
5. Stats calculated: total pixels, different pixel count, percentage different, similarity percentage.

Four view modes render to the same canvas by re-drawing from stored `ImageData` objects: diff overlay, 50/50 blend, image A only, image B only.

### Share via URL

1. Raw text from both panels, selected mode, and selected language are wrapped in a JSON object: `{ a, b, mode, lang }`.
2. The JSON string is encoded to base64 via `btoa()` after URI-encoding for Unicode safety.
3. The base64 string is appended to the current page URL as a hash fragment: `#d=<base64>`.

No network request is made. The URL is generated locally.

When someone opens the link, the page reads `location.hash`, strips `#d=`, decodes the base64 back to JSON, populates both panels, and auto-runs the comparison.

### PDF Diff

Not supported. Word-Diff does not process PDF files.

Workarounds:
- **Text-based PDF** - copy text out of the PDF, paste into Word-Diff as plain text.
- **Scanned or layout-sensitive PDF** - screenshot each page, use Word-Diff image diff per page.

True static PDF diff would require bundling PDF.js (~400KB), rendering pages to canvas, then running the image diff pipeline on each render. Technically possible, not currently implemented.



## Size & Performance Limits

| Limit | Value |
|-------|-------|
| **Text input size** | No limit (browser memory only) |
| **LCS algorithm cap** | 6,000 tokens - positional diff fallback above this |
| **Accurate diff - word mode** | ~50,000 characters |
| **Accurate diff - line mode** | ~6,000 lines |
| **Share URL - safe cross-browser** | ~700KB combined text |
| **Share URL - Chrome max** | ~2MB |
| **Share URL - Firefox reliable max** | ~65KB |
| **Image - safe limit** | 3,000×3,000px / under 8MB file size |
| **Image - hard limit** | Browser RAM (no code-level cap) |
| **PDF** | Not supported |

**LCS fallback explained:** Above 6,000 tokens, Word-Diff falls back to a positional zip diff - it compares token at index N in A against token at index N in B. This runs in O(n) time regardless of size, so it never freezes. It is less accurate than LCS for content where lines or words were inserted (which shifts all subsequent positions), but it handles large files without any browser slowdown.

**Image memory cost:** `width × height × 4 bytes × 3` (canvas A + canvas B + output canvas). A 4K image (3840×2160) costs approximately 100MB RAM. A 12MP photo costs approximately 150MB. Word-Diff applies no resolution downscaling before diffing.

**Share URL - no compression:** Base64 adds ~33% overhead. 1MB of raw combined text becomes ~1.35MB in the URL. No LZ-string or deflate compression is applied. Adding it would raise the practical ceiling 3–5x for typical code or prose.

**CORS on images:** Images must be loaded from your local filesystem via drag-and-drop or file picker. Cross-origin image URLs cannot be read by canvas without CORS headers - this is a browser security rule, not a Word-Diff limitation.



## Deployment

```bash

# Netlify / Vercel
# drag the file into the deploy UI - done

# local
open index.html
# or
python3 -m http.server 8080
```

No build step. No npm. No config. Prism.js and fonts load from CDN on first use. The diff engine and image processing work offline after that.

**Multiple simultaneous users on GitHub Pages:** no issue. Each visitor runs their own isolated copy in their own browser tab. No shared state, no backend, nothing to bottleneck. GitHub Pages has a 100GB/month bandwidth soft limit - essentially impossible to hit with a text tool.

> [!NOTE]
> **Offline vs Online - what actually works when?**
>
> Once the page is loaded in your browser, **all core features work with no internet:**
> diff engine, image diff, share URL generation, file upload, beautify, and export.
>
> Internet is only needed for:
> - **First load** - to fetch Prism.js (syntax highlighting) and Google Fonts from CDN
> - **URL import (🔗 button)** - fetching remote files always needs internet
> - **Reloading the page** if hosted on Vercel/Netlify/GitHub Pages
>
> Fonts fall back to `monospace` / `sans-serif` automatically if CDN is unreachable.
> Syntax highlighting silently falls back to plain text if Prism fails to load.

> [!TIP]
> **To make Word-Diff fully offline (no internet ever needed):**
>
> 1. Download the 4 Prism files from cdnjs - open each URL in your browser and Save As:
>    - `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css`
>    - `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js`
>    - All the `prism-*.min.js` language components you need
> 2. Save them next to `index.html` in a folder, e.g. `prism/`
> 3. In `index.html`, replace the CDN `<link>` and `<script>` tags with local paths:
>    ```html
>    <!-- BEFORE -->
>    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
>    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
>
>    <!-- AFTER -->
>    <link rel="stylesheet" href="prism/prism-tomorrow.min.css">
>    <script src="prism/prism.min.js"></script>
>    ```
> 4. Remove the two Google Fonts `<link>` tags at the top of `<head>` and replace the font variables in `:root`:
>    ```css
>    /* BEFORE */
>    --mono: 'IBM Plex Mono', monospace;
>    --sans: 'Space Grotesk', sans-serif;
>
>    /* AFTER */
>    --mono: 'Courier New', monospace;
>    --sans: system-ui, sans-serif;
>    ```
>
> After these 4 steps, `index.html` works by just double-clicking the file - no server, no internet ever needed.



## Privacy

Two external requests on first load: Google Fonts (Space Grotesk + IBM Plex Mono) and Prism.js from cdnjs. Neither receives your text or images. After those assets load, the page functions without any network access.

No text, no images, no diffs, no metadata leave your machine at any point. The Share URL feature encodes data into the URL hash fragment - hash fragments are never sent to servers by browsers.



## License

MIT
