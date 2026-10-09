# Status, 2026-10-09 (end of first overnight session)

The site is built and runs. Project folder: `C:\dev\portfolio_website` (moved out of OneDrive; its own git repo, branch `main`, 6 local commits, nothing pushed or deployed).

## Run it

```
cd C:\dev\portfolio_website
npm run dev          # http://localhost:3000   (add ?boot=skip to skip the intro)
npm run build        # passes
npm test             # 12 tests pass (snake logic, driving school, digit network, GitHub parser)
npm run lint         # clean
```

URL params: `?boot=skip`, `?res=lofi|broadcast|clean`, `?tier=1|2|3`, `?phosphor=green|amber`.

## What is built (against PLAN.md)

| Plan item | State |
|---|---|
| Design system (phosphor tokens, Geist + Geist Pixel, scanlines/grain/vignette/tube frame, DPR-aware scanline period) | Done |
| Boot: power-on line, boot log with real measured values, portrait resolving block to dot to relief, name resolving through the 5 pixel fonts, staged reveal, skip on any input, short replay per session | Done |
| Home: live halftone-relief portrait of Vishal (depth + matte from Depth Anything V2 and MODNet), tilt, press, click to rescan through halftone / ascii / line / block | Done |
| Work: 3D broadcast monitor showing a real capture of vmaxx.vercel.app, mono until hover then colour (the only colour on the site), whole slot is a link | Done |
| About: word-by-word scrub text on the left, facts column, full-body line-screen figure on the right | Done |
| Stack: ordered-dither orrery (skills as beads, hover both ways), GitHub contribution squares fetched daily | Done |
| Lab (a seventh section, not in the plan, between Stack and Experience). Driving school: draw a road and 120 small neural networks (8 inputs, 8 neurons, 2 outputs) learn to drive it by selection and mutation, with the leader's sensors and live brain on show; works with mouse or finger. Digit reader: draw a digit and a 784-64-10 network reads it live, every neuron drawn, each neuron's weights shown on hover; trained by `npm run train:digits` (plain JS, no ML library, 97.6% on the MNIST test set) | Done |
| Experience: three cards, each with a spinning extruded company logo (mono, colour on hover), upcoming entry dashed | Done |
| Contact: flowing halftone backdrop with pointer ripples, copy email, social rows, power switch (closes the screen, replays boot) | Done |
| Resolution dial (1-bit / Broadcast / Clean), keys 1-7 / [ ] / g / ?, on-screen display (the static burst on channel change was removed on request) | Done |
| Game dock `snake.deque` (self-playing BFS attract mode, real deque ops readout, unlocks green at 10 and amber at 25) | Done |
| Vishal's HalftoneTrail as the cursor (pasted component, verbatim) | Done, mounts after first mouse move, fine pointers only |
| Clean mode posters, OG image, favicon, metadata | Done |
| "Put yourself on screen": the visitor's camera replaces the hero portrait through the same halftone relief (opt-in, frames stay in the page) | Done |
| Native scrollbar hidden; a column of progress cells on the left edge shows and sets scroll position | Done |

## Not done (from PLAN.md), in priority order

1. **All `TODO(vishal)` content** (see below). `npm run check:content` fails until filled.
2. Pinned scroll sequences for Work and Experience (plan 4.2, 4.5). Experience is three cards instead.
3. Sound, screensaver, console signature, degauss (plan 5.6 / WP11).
4. `Person` structured data, sitemap, robots.
5. Lighthouse / real-device pass: only checked in headless Chrome with software GL (so fps numbers are meaningless). Needs a look on a real GPU, a phone, and Windows at 125% / 150% scaling for scanline moire.
6. Quality tiers do not yet step down automatically on frame-rate sag (tier is picked once from device hints).
7. Deploy to Vercel. Not done on purpose.

## Decisions I made without asking (all reversible)

- Moved the project from OneDrive to `C:\dev\portfolio_website` (copy; the originals in the OneDrive folder are untouched except a MOVED.txt pointer). Its git repo is separate from the one in your home folder.
- Portrait uses the mirror photo (`assets-src/mirror.png`), head and shoulders; the About figure uses the full-body photo. Hero is two columns: name stacked on the left, portrait on the right.
- Removed `cacheComponents` / `partialPrefetching` from the Next config template (not needed, and they break `Math.random` in client code).
- Text selection is switched off site-wide (asked for); the email still copies through its button.
- Disabled three React-compiler lint rules for the stage / arcade / theatre / lab / shell folders (they flag normal three.js uniform updates) and excluded the pasted trail component from lint so it stays exactly as pasted.
- "Shader lines": built the monochrome Shader Lines idea behind Contact (your second paste was the trail again).
- Pinned Work/Experience sections skipped to keep the visual result verified; everything shipped was screenshot-checked.

## Need from you (fills `src/content.ts`)

1. Experience: exact role titles, dates, 2-3 things done at each (with numbers if possible). Roles currently say "Intern", durations "2 months".
2. Higher-resolution company logos if you have them (`assets-src/logo-*.png`, then `node scripts/prep-logos.mjs`).
3. VMAXX: stack, repo URL, your part. If it embeds third-party streams, say so, so the copy can be framed safely.
4. Real skills lists, graduation year, CGPA if wanted.
5. Better portrait (front-lit, 1500 px+) if you have one: put it at `assets-src/portrait-full.png`, adjust the crops at the top of `scripts/prep-portrait.mjs`, run `npm run prep:portrait`.

Re-capture the monitor video anytime with `node scripts/capture-work.mjs`; regenerate Clean-mode posters with `node scripts/posters.mjs` (dev server running).
