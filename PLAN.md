# RASTER: build plan for Vishal Vivek's portfolio
n> Build status: see STATUS.md. The code lives in C:devportfolio_website. Deviations from this plan are listed there.

Plan version 1, written 2026-10-09. This file is the single source of truth for the build.
If something here is wrong or impossible, fix this file first, then the code.

---

## 0. Rules for every agent working from this plan

1. Read the whole plan once. Then do only the work package (WP) you were given in section 10. Do not redesign.
2. **Skills.** Load `.agents/skills/design-taste-frontend` and `.agents/skills/industrial-brutalist-ui` (use its "2.2 Tactical Telemetry and CRT Terminal" mode) as craft checklists. Where a skill disagrees with this plan, the plan wins. Known disagreements, already decided:
   - No hazard-red or neon accent. See 3.1.
   - GSAP is the only animation library. Do not add Motion / Framer Motion.
   - Ignore `gpt-taste`'s random layout picking, AIDA structure, bento grids and stock images. Layouts are fixed in section 4.
   - Ignore `imagegen-*`, `image-to-code` and `brandkit`. No generated images are used.
3. **Dependencies are a closed list** (6.1). Adding one needs a one-line reason in your hand-off note.
4. **Never invent facts about Vishal.** All copy and data live in `src/content.ts`. Unknown facts stay as the literal string `TODO(vishal)`.
5. **Look at your work.** Run `npm run shots` and open the PNGs before you say a WP is done.
6. **Stay small.** Each WP has a line budget. If you are far over it, you are building something the plan did not ask for.
7. **Never push, deploy, or publish** without Vishal saying so. Commit locally at the end of your WP on a branch named `wp/<number>-<name>`.
8. **Hand-off note** at the end of every WP, four lines: what was built, what was skipped and why, how it was verified, known issues.
9. Platform: Windows 11, Node 22.14, npm 10.9. npm scripts must be plain Node, with no bash-only syntax.

---

## 1. The idea

**The site is a cathode-ray tube, and everything on it resolves.**

A visitor does not load this page, they tune it in. The screen powers on, Vishal's face comes out of noise as coarse blocks, then finer blocks, then halftone dots, then a 3D relief that follows the cursor. Headlines arrive in pixel type and sharpen into clean type. A broadcast monitor finds the signal for his project. The visitor holds the resolution dial for the whole site.

The effect is also the message: Vishal takes things from a noisy idea to something resolved that people use.

### 1.1 Six principles (use these to settle any open question)

1. **One light source.** Everything visible is phosphor light on black, in one tint. No second hue anywhere in the interface.
2. **Only the work is in colour.** The single exception: the monitor in the Work section plays the project in full RGB once it is tuned. Colour therefore means "this is the thing I made".
3. **Two voices.** The machine speaks in pixel type (boot log, readouts, on-screen display, the game). Vishal speaks in clean sans type (name, headlines, sentences). Never mix them inside one sentence.
4. **Every readout is true.** If the screen says `160×200 dots`, `seed 04211`, `144 Hz` or `signal 82%`, that is the real value at that moment. No decorative numbers, no fake coordinates.
5. **Machine things step, physical things glide.** Type, states and overlays change instantly or in visible steps. Only the 3D objects and the scroll move smoothly.
6. **One entrance animation.** Resolving (pixel to sharp) is the only way content arrives. No fade-up on every block, no hover animation on every card.

### 1.2 What a visitor will remember

- Their own cursor pressing into a halftone relief of Vishal's face, like a pin-art toy.
- Turning the site's resolution down to 1-bit and back up.
- A reference monitor that finds the signal and blooms into the only colour on the page.
- A snake game in the corner that plays itself with breadth-first search until they take over.
- The power switch at the bottom that turns the tube off.

### 1.3 Choices made on purpose (do not "fix" these)

| Default this plan avoids | What we do instead, and why |
|---|---|
| Near-black with one bright accent | No accent at all. Colour is reserved for the work (principle 2). |
| Tracked-out caps label above every heading | No eyebrow labels. Section headings are one plain word. |
| `01 / 02 / 03` section markers as decoration | Channel numbers exist only where they work: keys 1 to 6 change channel, and the on-screen display shows the number for 1.6 s after a change. |
| Fake HUD data | Principle 4. |
| Fade-and-slide on every section | Principle 6. |
| A monospace font for "techy" labels | Geist Pixel, chosen because its five variants share one glyph grid, which is what makes the resolve effect possible (3.2). |
| A separate loading screen | The loader is the hero in its booting state. Nothing moves or jumps when it ends (4.1). |

---

## 2. Inputs needed from Vishal

None of these block Phase A. Until they arrive, `src/content.ts` holds `TODO(vishal)` and `npm run check:content` fails, which blocks the production deploy.

1. **Experience facts**, for each of Microsoft (incoming), Deep Terrain AI, and the third company (exact spelling needed, the brief says "innovsoltuio"): official company name, role title, start and end month, location or remote, two or three things you did with a number in each if you have one, and the stack.
2. **Education:** graduation year (the plan assumes 2028), CGPA if you want it shown, any certifications.
3. **Links:** GitHub, LinkedIn, X, LeetCode and/or Codeforces handles with problem count or rating, a public email address, résumé PDF.
4. **VMAXX:** stack, repository URL, where the catalogue and the video come from, two or three hard problems you solved, any usage numbers. If it embeds third-party streams, say so: the plan will then present it as a discovery interface and lead with the mood and quality filters, which is the safer framing in front of recruiters.
5. **Skills:** the real list for full-stack, AI/ML and foundations. The lists in 4.4 are placeholders.
6. **Portrait (optional but worth it):** the two photos in the repo work (`image copy.png` is the better one) but they are small. One front-lit photo at 1500 px or more, plain background, makes the hero noticeably sharper.
7. **Domain name**, if any.
8. **"Shader lines":** the second component you pasted was the halftone trail again. The plan assumes you meant the 21st.dev *Shader Lines* component and uses a monochrome version of that idea behind the Contact section (7.5). Say so if you meant something else.
9. **Two environment decisions** (see WP0): the project sits inside OneDrive, and its parent `C:\Users\visha` is itself a git repository.

---

## 3. Visual system

### 3.1 Colour

Everything is derived from one variable so the unlockable tints re-colour the whole site, WebGL included.

```css
:root {
  --void: #000000;       /* lit tube. True black, because the canvases add light onto it. */
  --phosphor: #EDEBDD;   /* the only light. Primary text and every emitted pixel. */
  --dim:   color-mix(in oklab, var(--phosphor) 58%, black);  /* secondary text, must stay >= 4.5:1 */
  --faint: color-mix(in oklab, var(--phosphor) 34%, black);  /* decoration and disabled, never body text */
  --rule:  color-mix(in oklab, var(--phosphor) 14%, black);  /* hairlines */
  --glass: color-mix(in oklab, var(--phosphor) 5%, black);   /* unlit glass: tube frame, panels */

  /* names the pasted halftone-trail component expects */
  --foreground: var(--phosphor);
  --background: var(--void);
}
html.ph-green { --phosphor: #B8F5C3; }   /* unlocked in the game, 5.4 */
html.ph-amber { --phosphor: #FFC66E; }
```

Rules:
- Interactive states use **inversion** (phosphor background, black text), applied instantly. No colour, no easing.
- `::selection` is inverted. Focus ring is a 1 px phosphor outline at 3 px offset.
- No gradients as decoration, no drop shadows, no translucency panels. The only glow is phosphor glow: `text-shadow: 0 0 0.6em color-mix(in oklab, var(--phosphor) 35%, transparent)` on display type, and bloom on the canvas.
- Phosphor tint is set with a **class on `<html>`**, not a data attribute. The pasted trail component only re-reads its colour when the `class` attribute changes.

### 3.2 Type

One superfamily, two voices. Install from the `geist` npm package via `next/font` (`geist/font/sans`, `geist/font/pixel`).

| Token | Family | Used for |
|---|---|---|
| `--font-human` | Geist Sans | Name, headings, body, buttons, links |
| `--font-machine` | Geist Pixel Square | Readouts, boot log, on-screen display, game text |
| `--font-dot` | Geist Pixel Circle | The `VV` mark and the big channel digit (it is a dot-matrix face, so it rhymes with the halftone) |
| resolve steps | Geist Pixel Line, Triangle, Circle, Grid, Square | Only inside the resolve effect |

Scale (fluid, set with `clamp`):

| Role | Size | Line height | Tracking | Weight |
|---|---|---|---|---|
| Name | `clamp(2.75rem, 10.9cqi, 13.5rem)` | 0.82 | -0.05em | 600, uppercase |
| Heading (h2) | `clamp(2.5rem, 6.5vw, 6rem)` | 0.95 | -0.035em | 500, sentence case |
| Lead | `clamp(1.25rem, 2vw, 1.75rem)` | 1.3 | -0.01em | 400 |
| Body | 1.0625rem | 1.55 | 0 | 400, max 68 characters per line |
| Machine | 0.8125rem | 1.4 | 0.02em | 400, sentence or lower case |
| Channel digit | 4rem | 1 | 0 | Pixel Circle |

Notes for the implementer:
- The name is uppercase because it is a title card. Nothing else is uppercase. Machine text is lower or sentence case (`drag to tilt, click to rescan`), never tracked-out capitals.
- Pixel fonts are only crisp at certain sizes. Test Geist Pixel at 12, 13, 14 and 16 px on a DPR 1 and a DPR 1.25 screen and pick the machine size where stems are even. Change the token if 13 px is not it.

**The resolve effect** (`src/components/TypeResolve.tsx`, 60 lines at most). The server renders the final text in Geist Sans, so it works without JavaScript and for screen readers. On first entry into the viewport: split into characters with GSAP SplitText, lock each character to its final measured width (`inline-block`), then step each character's `font-family` through Line, Triangle, Circle, Grid, Square, Sans at 60 ms per step, staggered 25 ms per character left to right. Afterwards call `revert()` so normal kerning returns. Used on the name during boot and on each section heading once. Nowhere else.

### 3.3 Layout

- 12 columns, 24 px gutter (16 px under 640 px). Page margin `clamp(16px, 3vw, 48px)`.
- Section padding `clamp(6rem, 14vw, 12rem)` top and bottom.
- Corner radius is 0 everywhere, with two physical exceptions: dots, and the corners of tube glass.
- Hairlines (`1px solid var(--rule)`) only where they separate real regions.
- **Corner brackets mean "live render window".** They appear on artifact slots (6.4) and nowhere else, so they carry information: inside these brackets you can drag and click.
- Use `min-height: 100dvh`, never `100vh` or `h-screen`.
- Breakpoints: 640, 1024, 1440. Pinned scroll sequences exist only at 1024 px and up with a fine pointer.

### 3.4 Screen surface (applies to DOM and canvas alike)

The global CRT treatment is **CSS, drawn above everything**, so text and 3D get exactly the same surface. There is no global post-processing shader for scanlines. This is deliberate: it removes any mismatch between DOM and canvas.

`src/components/shell/ScreenOverlay.tsx` renders one fixed, `pointer-events: none` element with these layers:

| Layer | How | Values |
|---|---|---|
| Scanlines | `repeating-linear-gradient` | Period 3 CSS px, 1 px dark line. Alpha `--scan-alpha: 0.11`. Inside artifact slots a second pass raises it to 0.22. |
| Grain | 128 px noise tile, `background-position` jumping on `steps(6)` every 0.6 s | Opacity 0.05, `mix-blend-mode: screen` |
| Vignette | `radial-gradient` | Transparent to 35% black at the corners |
| Tube frame | Inset element with `border-radius: 18px` and `box-shadow: 0 0 0 100vmax var(--glass)` | 8 px inset on desktop, none under 640 px |
| Static burst | The noise tile at higher opacity | Only during a channel change, 5.2 |

Two craft details that decide whether this looks expensive or cheap:
- **Fractional DPR.** Windows laptops run at 125% and 150%. A 3 px CSS period then lands on non-integer device pixels and the lines beat. On load and on resize, set `--scan-period` to `Math.round(3 * devicePixelRatio) / devicePixelRatio` px so the period is always a whole number of device pixels.
- **Moiré.** Every halftone cell size on the site must be a multiple of the scanline period (6 or 9 CSS px, or 12 in lo-fi). Dots then sit on the lines and read as "dots made of scanlines" rather than shimmer.

### 3.5 Motion rules

- Stepped: type changes, state changes, overlays, the on-screen display, the power animation. Use `steps(n)` or instant switches.
- Smooth: 3D objects (critically damped lerp, factor 0.08 to 0.12 per frame at 60 Hz, made frame-rate independent), and scroll (Lenis, `lerp: 0.1`).
- Scroll-linked motion scrubs uniforms. It never plays a timed animation that can fall out of sync.
- At most two pinned sequences on the page (Work, Experience), each adding at most 150vh of scroll.
- Reduced motion (OS setting, or the dial at "clean"): no grain animation, no static bursts, no pins, no resolve stepping (text is simply present), canvases render one frame and stop.
- Flash safety: static bursts are noise at 35% opacity for 180 ms, rate-limited to one per 600 ms.

### 3.6 Writing

Sentence case. Plain verbs. First person. Say what a thing is, not how impressive it is. Buttons say what happens (`See the work`, `Get in touch`, `Open VMAXX`, `Read the code`, `Copy email` then `Copied`). No arrows appended to links. An empty state says what is true and what comes next (see the empty channels in 4.2).

---

## 4. The page, channel by channel

One page, six sections. Sections are "channels" only in the navigation model: keys 1 to 6, the menu, and the on-screen display. Their visible names are plain.

| Key | Section id | Heading | Artifact (section 7) |
|---|---|---|---|
| 1 | `home` | Vishal Vivek | Relief: portrait |
| 2 | `work` | Work | Receiver |
| 3 | `about` | About | Relief: full figure |
| 4 | `stack` | Stack | Orrery, plus the algorithm theatre |
| 5 | `experience` | Experience | Strata |
| 6 | `contact` | Let's build something people use. | Lines, plus the power switch |

No case-study routes yet. With one project, a second route is a page nobody needs. Add `/work/[slug]` when there are three projects.

### 4.1 Home (and the boot sequence)

```
+------------------------------------------------------------------------------------+
| VV       Work  About  Stack  Experience  Contact          [dial]  sound   Résumé   |
|                                                                                    |
|  vv-bios 3.0                         . : o O O O o : .                             |
|  display 1920x1080 @ 144 Hz  ok    : o O O O O O O O o :                           |
|  adapter NVIDIA RTX ...      ok   o O O O O O O O O O O o                          |
|  (boot log, leaves after boot)    O O O O  face  O O O O                           |
|                                   O O O O O O O O O O O O                          |
|  V I S H A L                       o O O O O O O O O O o               V I V E K   |
|                                   o O O O O O O O O O O O o                        |
|  I build full-stack and         O O O O  shoulders  O O O O      160x200 dots      |
|  machine-learning products                                       mode 1 of 4       |
|  that people actually use.                                       drag to tilt,     |
|                                                                  click to rescan   |
|  [See the work] [Get in touch]                                                     |
|  Computer science, VIT Vellore            Joining Microsoft as an intern   [snake] |
+------------------------------------------------------------------------------------+
```

- The portrait slot is centred, 78dvh tall, 4:5. The name runs across the full width on one line and **crosses the portrait** at shoulder height. The gap between first and last name sits on the face. The name has `mix-blend-mode: difference`, so letters invert wherever they cross dots.
- Under 1024 px: portrait on top at 86vw wide, name on two lines overlapping the bottom fifth of the portrait, then the sentence, buttons and the two status lines stacked.
- The readouts beside the slot are live: dot grid size, current mode, and the hint.
- Two buttons, no more. No badges, no stats row, no logo strip.

**Boot sequence.** There is no separate loading screen. Boot is this section with most of it hidden, so nothing moves when it ends. Total 2.4 s on first visit. Any key, click, tap or scroll skips to the end state. On later visits in the same session only step 1 plays (0.4 s). With reduced motion, none of it plays.

| Time | What happens |
|---|---|
| 0.00 | Black. |
| 0.00 to 0.25 | Power on: `#screen` opens from a horizontal line using `clip-path: inset(49.9% 0)` to `inset(0)` in 6 steps. A one-frame bright beam (`mix-blend-mode: plus-lighter` overlay) sits on the line. |
| 0.25 to 1.30 | Boot log prints top left in machine voice. Each line is printed when its real event fires, at least 120 ms apart: viewport and measured refresh rate, GPU string (or `unknown`), fonts ready, portrait texture decoded. |
| 0.30 to 1.30 | Portrait resolves on a plain 2D canvas placed exactly over the slot: the photo is drawn at 4, 8, 16, 32, 64 then 160 columns with `image-rendering: pixelated`, four grey levels. About 30 lines, no three.js, so it starts before the 3D bundle arrives. |
| 1.30 | Hand-off to WebGL, which starts in block mode at the same grid, so the swap is invisible. If WebGL is not ready, the 2D canvas stays and the swap happens whenever it is. Boot never waits for WebGL. |
| 1.30 to 1.90 | Blocks become dots. Depth scale goes 0 to 1: the flat image inflates into a relief. From here the portrait follows the cursor. |
| 1.50 to 2.10 | The name resolves, left to right (3.2). |
| 2.10 to 2.40 | Sentence, buttons, status lines and nav appear in three opacity steps. Boot log clears. The halftone trail and the game dock mount. |

Scrolling out of Home scrubs the portrait's `uDissolve` from 0 to 1 over the last 60% of the section (dots shrink away by a noise threshold: signal lost).

### 4.2 Work

```
+------------------------------------------------------------------------------------+
|  Work                                                                              |
|                                                                                    |
|  [ +--------------------------------------+ ]    VMAXX                             |
|  [ |                                      | ]    A streaming front end that helps  |
|  [ |     broadcast monitor, 4:3 tube      | ]    you pick what to watch by mood,   |
|  [ |     playing the VMAXX capture        | ]    era and quality.                  |
|  [ |                                      | ]                                      |
|  [ +--------------------------------------+ ]    What it does   (list, see below)  |
|  [   o  o                      1 2 3      ]      Built with     TODO(vishal)       |
|  ch 1, vmaxx            signal 82%               My part        TODO(vishal)       |
|                                                                                    |
|  1 VMAXX    2 no signal    3 no signal           [Open VMAXX]  [Read the code]     |
+------------------------------------------------------------------------------------+
```

- Left, 7 columns: the Receiver slot (7.2). Right, 5 columns: the project as a definition list (`<dl>`), in human voice.
- Draft copy for "What it does", taken from the live site, for Vishal to edit: browse by mood (Chill and easy, Mind-bending, Pure adrenaline, Laugh out loud); filter by era and by quality tier (Verified bangers, Masterpieces, Hidden gems); a Surprise me pick; Top 10 this week and Continue watching; search, sign-in and a personal list.
- The whole slot is a real `<a href target="_blank" rel="noopener">` to the live site, so it works with a keyboard and without JavaScript.
- **States of the monitor.** Out of view: snow, mono. In view: it tunes in over 600 ms (snow fades, one vertical roll), still mono. Hover or keyboard focus: colour blooms in over 300 ms and the tally light turns red. This is the only colour on the site. On touch devices, being in view is enough for colour.
- **Channel row.** `content.projects` drives it. Channels with no project show snow in the monitor and the line `Nothing on this channel yet. The next project is being built.` Show exactly two empty channels. When a real project is added it fills the next channel with no code change. Left and right arrow keys change channel while the slot has focus; the dial on the monitor turns 30 degrees per channel.
- Pinned at 1024 px and up for 100vh of extra scroll: the first 40% tunes the monitor in, the rest reveals the definition list one row at a time (instant, stepped). Not pinned on smaller screens.

### 4.3 About

```
+------------------------------------------------------------------------------------+
|  [ ||||| ]     About                                                               |
|  [ ||||| ]                                                                         |
|  [ full  ]     I'm Vishal, a third-year computer science student at VIT Vellore.   |
|  [ body  ]     I like building things people end up using: the kind of project a   |
|  [ in    ]     stranger opens twice.                                               |
|  [ line  ]                                                                         |
|  [ screen]     (two more paragraphs)                                               |
|  [ ||||| ]                                                                         |
|  [ ||||| ]     Based in    Vellore, India        Studying   B.Tech CSE, VIT        |
|  96x250 lines  Next        Microsoft, intern     Into       DSA, TODO(vishal)      |
+------------------------------------------------------------------------------------+
```

- Left, 3 columns, sticky for the height of the section: the full-body photo as a Relief in line-screen mode (7.1). Same component as the hero portrait, different texture and default mode.
- Right: three paragraphs at Lead size. Words brighten from `--faint` to `--phosphor` as they cross the middle of the viewport (one scrubbed effect, the only motion in this section).
- Draft paragraphs for Vishal to rewrite in his own words:
  1. "I'm Vishal, a third-year computer science student at VIT Vellore. I like building things people end up using: the kind of project a stranger opens twice."
  2. "Most of my work sits where full-stack web meets machine learning. Fast interfaces in front, models and data behind them. I've interned at Deep Terrain AI and TODO(vishal), and I'm joining Microsoft as an intern next."
  3. "When I'm not shipping something, I'm usually working through data structures and algorithms. I enjoy the puzzle of it more than I probably should."
- Facts as a `<dl>` in two columns. Under 1024 px the figure becomes a 60vw band above the text and is not sticky.

### 4.4 Stack

```
+------------------------------------------------------------------------------------+
|  Stack                                                                             |
|                                                                                    |
|  Full-stack           AI and ML            Foundations      [      .-''-.       ]  |
|  TypeScript           Python               DSA              [   .-'  ()  '-.    ]  |
|  React, Next.js       PyTorch              C++              [  (  three rings ) ]  |
|  Node.js              ...                  ...              [   '-.  beads .-'  ]  |
|  PostgreSQL                                                 [      '-..-'       ]  |
|  (all TODO(vishal) until confirmed)                         seed 04211, drag, click|
|                                                                                    |
|  Algorithm theatre                                                                 |
|  [Quicksort] [Merge sort] [BFS] [A*]     play  step  shuffle   speed ------o--     |
|  [ 64 x 20 dot matrix, the algorithm really running                             ]  |
|  comparisons 412   swaps 133   O(n log n) average                                  |
+------------------------------------------------------------------------------------+
```

- Three plain lists, no bars, no percentages, no logos. Each skill is a `<button>` so hover and focus both work.
- The Orrery (7.3) has one ring per list and one bead per skill. Hover or focus a skill and its bead lights and its ring brightens. Hover near a bead and the matching skill inverts. Two-way, through `store.hoverSkill`.
- **Algorithm theatre** (`src/components/theatre/`, 300 lines at most, 2D canvas, no WebGL). It shows the interest in DSA by running the real thing rather than claiming it. A 64×20 dot matrix. Sorting: 64 columns of dots, the two compared columns inverted. Pathfinding: the visitor drags to paint walls, frontier is ring dots, the final path is solid dots. Each algorithm is a generator function that yields one frame per operation. Counters are real. Controls are native buttons and a native range input, styled.
- Education and certifications sit under the lists as two short rows.

### 4.5 Experience

```
+------------------------------------------------------------------------------------+
|  Experience                                                                        |
|  [ ============ scanline terrain, full width, 21:9, morphs per entry =========== ] |
|  seed 0x3fa2                                                                       |
|                                                                                    |
|  Upcoming   Microsoft            TODO(vishal) role          TODO(vishal) dates     |
|  ---------------------------------------------------------------------------------  |
|  TODO date  Deep Terrain AI      TODO(vishal) role                                 |
|             - TODO(vishal) what you did, with a number                             |
|  ---------------------------------------------------------------------------------  |
|  TODO date  TODO(vishal) company TODO(vishal) role                                 |
+------------------------------------------------------------------------------------+
```

- This is a real sequence, so dates lead each row. Newest first. The Microsoft row is marked `Upcoming` and drawn in outline (dashed hairline, `--dim` text) because it has not happened yet.
- The Strata terrain (7.4) is seeded from the company name, so each employer has its own landscape. The upcoming entry is a calm plane with one ridge rising, drawn with dashed lines.
- Pinned at 1024 px and up for 150vh: each third of the scroll activates one entry (inverted row, its bullets open, terrain morphs). Not pinned below that; rows are simply all open.
- Use company names as plain text. No logos or brand colours.

### 4.6 Contact

- A full-bleed Lines backdrop (7.5) behind one very large sentence, set at Name size on two or three lines: **Let's build something people use.**
- Under it: the email address at Heading size. Clicking copies it and the button text changes from `Copy email` to `Copied` for 2 s.
- Social links as full-width rows (GitHub, LinkedIn, X, LeetCode, Résumé), each with its handle right-aligned in machine voice. Hover inverts the row instantly.
- Footer line: `Vellore, India` with a live clock in `Asia/Kolkata`, and `Built by hand with three.js and GLSL.`
- **Power switch.** A real `<button>` labelled `Power`. Pressing it runs the boot power-on in reverse (the screen closes to a line, then a dot that lingers 400 ms), waits 600 ms on black, scrolls to top and boots again. With reduced motion it simply scrolls to top.

---

## 5. Things that are always there

### 5.1 Navigation and on-screen display

- Top bar: the `VV` mark in Pixel Circle, five links, the resolution dial, the sound toggle, a Résumé link. The current section's link is inverted.
- Under 1024 px the links move into a full-screen menu laid out like a teletext index: big Pixel Circle digit, section name, one line of description. The digits are the same keys 1 to 6.
- On-screen display: when the channel changes, the digit and the section name appear top right for 1.6 s, then vanish instantly. It has `aria-hidden`; the real announcement is the focus/scroll target.
- Keyboard: `1` to `6` go to a section, `[` and `]` turn the resolution dial, `m` toggles sound, `g` opens the game, `?` shows this list. Keys are ignored while focus is in an input or in the game.

### 5.2 Channel change

When the section crossing the middle of the viewport changes: set `store.channel`, show the on-screen display, fire one static burst (3.4). In reduced motion: only the display.

### 5.3 The resolution dial (the accessibility switch, promoted to a feature)

One control with three detents, stored in `localStorage`, reflected as a class on `<html>`.

| Detent | Class | What changes |
|---|---|---|
| 1-bit | `res-lofi` | `--font-human` becomes Geist Pixel Square. Scanline period 4 px, alpha 0.2. Artifacts double their cell size (each reads `store.res`). |
| Broadcast (default) | `res-broadcast` | Everything as specified in this plan. |
| Clean | `res-clean` | No overlays, no trail, no canvas: slots show their poster images. No motion. A fast, crisp, static page. |

`prefers-reduced-motion` or a missing WebGL2 context starts the site at Clean. If a reduced-motion visitor turns the dial up themselves, they get the surface and the artifacts, and the reduced-motion rules in 3.5 still apply. A static burst covers every detent change (not in reduced motion).

### 5.4 The game: `snake.deque`

"A pixelated game on the side." Fixed dock, bottom right, mounted after boot.

- **Docked:** a 112×84 px thumbnail in which the snake plays itself. Its attract mode is a real breadth-first search to the food. Label: `Play`.
- **Open:** a 320×288 panel. Not a modal; the page stays scrollable. The game takes arrow keys and WASD only while the panel has focus. Escape or clicking outside pauses and docks it.
- **Board:** 24×18 cells, 2D canvas, cells drawn as dots in `--phosphor`, scaled by a whole number with `image-rendering: pixelated`.
- **The joke, which is also the point:** the snake's body is a deque. A side readout prints the last four real operations, for example `push_front(12,7)` and `pop_back()`. In attract mode it also prints `bfs() 37 visited`.
- **Rules:** 8 moves per second, plus 1 per 5 food, capped at 14. Walls and self are fatal. Up to two queued turns per tick; reversing is ignored. Swipe on touch. Pauses when the tab is hidden.
- **Rewards:** score 10 unlocks the green phosphor, 25 unlocks amber. Unlocked tints appear as a small switch next to the dial. High score in `localStorage`.
- **Code:** pure logic in `src/components/arcade/snake.ts` (`step(state, input) -> state`, plus `bfs`), with `snake.test.ts`. The React shell draws and handles input. 280 lines total at most.

### 5.5 The cursor

- Use Vishal's `HalftoneTrail` component **verbatim** at `src/components/ui/halftone-trail.tsx`. Mount it once in a `position: fixed; inset: 0` wrapper above the content, with `mix-blend-mode: difference` on the wrapper so the dots invert over light areas.
- Props: `color="var(--phosphor)"`, `cellSize={Math.round(6 * Math.min(devicePixelRatio, 2))}` (the component measures cells in device pixels; this gives 6 CSS px, a multiple of the scanline period), `decay={0.965}`, `brushSize={0.045}`, `hoverBrushSize={0.012}`, `hoverOpacity={0.15}`.
- Mount only when `(hover: hover) and (pointer: fine)` matches, only after boot, and not at Clean. On touch screens the component would leave a permanent blob in the middle of the screen.
- Keep the native pointer. No custom cursor element: the trail is the cursor's personality, and a native pointer never lags. Artifact slots set `cursor: crosshair`.
- Do not run `shadcn init`. The component only needs the `@/components/ui` path and the `--foreground` variable, both of which exist. Run it the day a real shadcn component is added.

### 5.6 Later polish (WP11, build last, cut first)

- **Sound**, off by default, synthesised with WebAudio, no files: power thump, 90 ms band-passed noise on channel change, a 4 ms click on inversion, game blips. Master gain 0.15. 90 lines at most.
- **Screensaver:** after 45 s idle at Broadcast or 1-bit, the `VV` mark bounces around the screen. Any input ends it.
- **Console signature:** name, email, and one line admitting that the snake's attract mode is BFS.
- **Degauss:** the Konami code makes every artifact wobble for 600 ms.

---

## 6. Architecture

### 6.1 Stack and dependencies (closed list)

Versions are the latest as of 2026-10-09. Install these majors.

| Package | Version | Why it is here |
|---|---|---|
| `next`, `react`, `react-dom` | 16.4, 19.3 | App Router, static prerender, `next/font`, deploys to Vercel like Vishal's other work |
| `typescript`, `tailwindcss`, `@tailwindcss/postcss` | latest, 4.3 | Tokens in `@theme`, utilities for layout |
| `geist` | 1.7 | Geist Sans and the five Geist Pixel variants |
| `three` | 0.186 | WebGL2 renderer |
| `@react-three/fiber`, `@react-three/drei` | 9.8, 10.7 | One canvas; from drei only `RoundedBox` and `PerformanceMonitor` |
| `postprocessing`, `@react-three/postprocessing` | 6.39, 3.1 | Stock `Bloom` and `ChromaticAberration`, top tier only. No custom passes. |
| `gsap`, `@gsap/react` | 3.15 | The one clock, ScrollTrigger, SplitText |
| `lenis` | 1.3 | Smooth scroll |
| `zustand` | 5.0 | One small store, with `persist` |
| `@phosphor-icons/react` | latest | Social glyphs only |
| dev: `playwright`, `sharp`, `@huggingface/transformers`, `leva` | latest | Screenshots and capture, portrait preparation, depth and matte models, shader tuning behind `?tune` |

Explicitly not used: Motion, a UI kit, a CMS, a backend, an analytics SDK beyond one optional line of Vercel Analytics, WebGPU.

### 6.2 Files

```
PLAN.md
assets-src/                    raw photos (git-ignored): portrait-full.png, selfie.png
public/
  relief/portrait.png  figure.png        packed textures: R = luminance, G = depth, B = matte
  work/vmaxx/loop.mp4  poster.webp
  posters/<slot>.webp                    static image per slot, for Clean and before WebGL starts
  noise.png                              128 px tile
scripts/
  prep-portrait.mjs  capture-work.mjs  shots.mjs  check-content.mjs
src/
  content.ts                             all copy and data, typed
  app/ layout.tsx  page.tsx  globals.css
  lib/ store.ts  clock.ts  quality.ts
  components/
    ui/halftone-trail.tsx                pasted verbatim
    TypeResolve.tsx  Slot.tsx
    shell/   Nav.tsx  Osd.tsx  Dial.tsx  ScreenOverlay.tsx  Boot.tsx  Trail.tsx  Keys.tsx
    sections/ Home.tsx  Work.tsx  About.tsx  Stack.tsx  Experience.tsx  Contact.tsx
    arcade/  Arcade.tsx  snake.ts  snake.test.ts
    theatre/ Theatre.tsx  algorithms.ts  algorithms.test.ts
  stage/
    Stage.tsx                            the canvas, camera, slot groups, effects
    slots.ts  screens.glsl.ts  useSlotInput.ts
    artifacts/ Relief.tsx  Receiver.tsx  Orrery.tsx  Strata.tsx  Lines.tsx
```

Sections are server components. Anything that touches the pointer, scroll or WebGL is a small client leaf. `Stage` is loaded with `next/dynamic` and `ssr: false` from inside a client component, after first paint.

### 6.3 Layers

All fixed layers are direct children of `<body>`. `#screen` holds layers 0 to 40.

| z | Layer | Notes |
|---|---|---|
| 0 | Stage canvas | `position: fixed`, `pointer-events: none`, `aria-hidden` |
| 10 | Content | Normal document flow. Slots are transparent holes over the canvas. |
| 20 | Halftone trail | Fixed, `mix-blend-mode: difference` |
| 30 | Nav, on-screen display | Fixed |
| 40 | Game dock | Fixed |
| 60 | Screen overlay | Scanlines, grain, vignette, tube frame, static |

**Hard rule:** never put `transform`, `filter`, `perspective` or `contain: paint` on `#screen` or any ancestor of a fixed layer. Those properties re-anchor fixed children and the canvas will jump. The power animation uses `clip-path` for exactly this reason.

### 6.4 One clock, and slots

**One clock** (`src/lib/clock.ts`). GSAP's ticker is the only `requestAnimationFrame` loop on the page. In order, each tick: `lenis.raf(t)`, `ScrollTrigger.update()`, then `advance(t)` for the canvas (created with `frameloop="never"`). Scroll position, DOM and WebGL therefore always agree within the same frame. Skip `advance` when the tab is hidden or no slot is visible.

**Slots.** A slot is an ordinary `<div>` in the layout that reserves space for an artifact. The canvas draws the artifact exactly behind it.

```ts
// src/stage/slots.ts
export type SlotId = 'portrait' | 'receiver' | 'figure' | 'orrery' | 'strata' | 'lines';
export const slotEl = new Map<SlotId, HTMLElement>();
```

```tsx
// in a section
<Slot id="portrait" className="h-[78dvh] aspect-[4/5]" label="Halftone portrait of Vishal, drawn live">
  {/* machine-voice readouts, positioned at the slot corners */}
</Slot>
```

- `Slot.tsx` registers the element, draws the corner brackets, shows `public/posters/<id>.webp` as its background until the stage reports a first frame for that slot, and exposes `role="img"` with the label.
- The camera is a perspective camera at `z = 1000` with its field of view set so that one world unit equals one CSS pixel at `z = 0`: `fov = 2 * atan(viewportHeight / 2000)` (that is radians; three.js wants degrees). Recompute on resize.
- Every frame, for each slot, `Stage` reads `getBoundingClientRect()` and sets a group: position at the rectangle's centre, uniform scale `min(width, height)`, `visible` only if the rectangle is within 20% of the viewport.
- **Artifact contract.** An artifact is a component rendered inside that group. It is authored in a unit box (`x` and `y` from -0.5 to 0.5 along the slot's shorter side, positive `z` toward the viewer, depth within 0.5). It takes `{ tier: 1 | 2 | 3, lofi: boolean, aspect: number }`, where `aspect` is the slot's width divided by its height, so a non-square artifact can fill its slot. It gets pointer and drag state from `useSlotInput(id)`.
- **No raycasting.** `useSlotInput(id)` listens to pointer events on the slot's DOM element and returns refs: `pointer` (x and y in -0.5 to 0.5), `inside`, `drag` (accumulated rotation with inertia), and `clicks`. Artifacts turn these into uniforms. The canvas itself never receives events.

### 6.5 Store

```ts
// src/lib/store.ts
type Res = 'lofi' | 'broadcast' | 'clean';
type Phosphor = 'white' | 'green' | 'amber';

interface AppState {
  booted: boolean;
  channel: 1 | 2 | 3 | 4 | 5 | 6;
  res: Res;                  // persisted
  phosphor: Phosphor;        // persisted
  unlocked: Phosphor[];      // persisted, starts as ['white']
  sound: boolean;            // persisted, starts false
  tier: 0 | 1 | 2 | 3;       // 0 means no canvas
  reducedMotion: boolean;
  hoverSkill: string | null;
  project: number;           // active Work channel
  logEntry: number;          // active Experience row
}
```

`res` and `phosphor` are mirrored to classes on `<html>` by one subscriber. Continuous values (pointer, scroll progress, time) never go through React state; they live in refs and uniforms.

### 6.6 Quality tiers

`src/lib/quality.ts` picks a starting tier from `hardwareConcurrency`, `deviceMemory`, pointer type and `saveData`. drei's `PerformanceMonitor` steps down one tier when the frame rate sags, and never steps back up in the same visit.

| | Tier 3 | Tier 2 | Tier 1 | Tier 0 |
|---|---|---|---|---|
| Typical device | Desktop with a discrete GPU | Laptop, recent phone | Older phone | Dial at Clean, or no WebGL2 |
| DPR cap | 2 | 1.5 | 1 | none |
| Portrait grid | 160×200 | 120×150 | 80×100 | poster |
| Bloom and aberration | on | off (sprite halos only) | off | none |
| Monitor video | plays | plays | poster frame and snow | poster |
| Strata rows | 96 | 64 | 40 | poster |

### 6.7 Shared shader helpers

Artifacts screen themselves in their own materials. There is no global halftone pass. All of them import these from `src/stage/screens.glsl.ts` so the dot shapes match across the site. Use three's `ShaderMaterial` (WebGL2).

```glsl
// p is cell-local or gl_PointCoord, in 0..1. lum is 0..1.
float dotScreen(vec2 p, float lum) {            // area-true halftone dot
  float r = 0.47 * sqrt(clamp(lum, 0.0, 1.0));
  float d = length(p - 0.5);
  float aa = fwidth(d);
  return 1.0 - smoothstep(r - aa, r + aa, d);
}
float barScreen(vec2 p, float lum) {            // line screen, thickness follows tone
  float h = 0.5 * clamp(lum, 0.0, 1.0);
  float d = abs(p.y - 0.5);
  float aa = fwidth(d);
  return 1.0 - smoothstep(h - aa, h + aa, d);
}
float blockScreen(float lum) { return floor(clamp(lum, 0.0, 0.999) * 4.0) / 3.0; }   // 4 grey levels
float bayer4(vec2 fragCoord) {                  // ordered dither threshold, 0..1
  const int m[16] = int[16](0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);
  ivec2 i = ivec2(mod(fragCoord, 4.0));
  return (float(m[i.y * 4 + i.x]) + 0.5) / 16.0;
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
```

Shared uniforms object, referenced by every material: `uTime`, `uPhosphor` (read from the CSS variable, re-read when the `<html>` class changes), `uPixelRatio`.

### 6.8 URL parameters (for tuning and for repeatable screenshots)

`?boot=skip`, `?res=lofi|broadcast|clean`, `?tier=0..3`, `?ch=1..6`, `?seed=<n>`, `?phosphor=white|green|amber`, `?tune` (loads the leva panel, development only).

---

## 7. Artifact specifications

### 7.1 Relief (portrait and full figure). `Relief.tsx`, 260 lines at most

A photo as a field of points with real depth. One component, two uses.

- **Geometry:** `THREE.Points`, one point per grid cell, attribute `aCell`. The vertex shader samples the packed texture (R luminance, G depth, B matte), places the point on the grid, pushes it toward the viewer by `depth * uDepthScale` (0.18 of the unit box at full scale), and sets `gl_PointSize` to one cell in device pixels. Points where matte is under 0.1 are moved off-screen.
- **Modes** (fragment shader, per point sprite):

  | Mode | Name in readout | Shape |
  |---|---|---|
  | 0 | halftone | `dotScreen`, plus a soft halo for glow |
  | 1 | ascii | glyph from a 12-glyph atlas ordered by ink density, drawn at runtime into a canvas texture using Geist Pixel Square |
  | 2 | line | `barScreen`, full cell width so bars join into lines |
  | 3 | block | square, `blockScreen` brightness |

- **Uniforms:** `uTex`, `uGrid`, `uDepthScale`, `uModeA`, `uModeB`, `uScan`, `uPointer`, `uPress`, `uDissolve`, `uMorph` (0 is block, 1 is the current mode; used at boot).
- **Pointer:** tilt up to 8 degrees toward the pointer. Points within 0.12 of the pointer rise toward the viewer and grow 15% (`uPress` eases in and out with `inside`). The response is computed in the shader from the eased pointer position; there is no physics state.
- **Click, "rescan":** `uScan` runs 0 to 1 in 900 ms. Points above the scanline use `uModeB`, below use `uModeA`. When it finishes, A becomes B. Modes cycle 0, 1, 2, 3. The readout updates.
- **Lo-fi:** draw every second cell in each direction at double size (discard the others in the vertex shader).
- **Uses:** portrait, default mode 0, grid by tier. Full figure, default mode 2, grid 96×250, no tilt, click still rescans.
- **Placeholder:** until `prep-portrait` has run, load a generated radial-gradient texture so the component and the layout can be built first.

### 7.2 Receiver (the monitor in Work). `Receiver.tsx`, 280 lines at most

A broadcast reference monitor, in the spirit of a Sony PVM. A refined industrial object, not a cartoon television.

- **Body:** drei `RoundedBox`, about 1.0 × 0.8 × 0.7 of the unit box, matte near-black, one soft key light and one rim light, all greyscale. Inset bezel. Two small knobs and a channel dial bottom right. A tally light top right. Slight three-quarter angle; `drag` turns it up to 20 degrees either way and it eases back.
- **Tube:** a 4:3 plane bulged toward the viewer (`z = 0.03 * (1 - x*x - y*y)`), with a `ShaderMaterial`:
  - barrel-warped UVs (`k = 0.12`), black outside the image;
  - `VideoTexture` of `loop.mp4`, sampled at 240 visible lines (120 in lo-fi) with a dark gap between lines;
  - vertical RGB phosphor stripes, visible only once colour is on;
  - `uColor` 0 to 1: at 0 the image is luminance tinted with `uPhosphor`, at 1 it is full RGB;
  - `uStatic` 0 to 1 mixes in `hash12` snow, `uRoll` offsets the image vertically during tune-in;
  - a fresnel edge highlight and one soft rectangular reflection so it reads as glass.
- **Readouts:** `ch 1, vmaxx` and `signal NN%`, where NN is `100 * (1 - uStatic)`.
- **Video handling:** create the `<video muted loop playsInline>` only when the slot is within one viewport of the screen. Pause it when the slot is not visible. Tier 1 uses the poster frame.

### 7.3 Orrery (in Stack). `Orrery.tsx`, 220 lines at most

Three tilted rings around a core, drawn in 1-bit ordered dither.

- **Core:** icosphere, radius 0.16. **Rings:** three flat bands at radii 0.28, 0.36 and 0.44, one per skill group, each with its own tilt and speed taken from the seed. **Beads:** one small sphere per skill, spaced evenly on its ring.
- **Shading:** simple diffuse plus rim light to a luminance value, then `step(bayer4(gl_FragCoord.xy / block), lum)` with `block` of 2 device pixels (4 in lo-fi). Because the threshold is in screen space, the dither pattern stays still while the object turns.
- **Interaction:** drag rotates with inertia. Click re-seeds: tilts and phases ease to new values and the `seed` readout changes to the real new seed. `store.hoverSkill` lights a bead (solid white, 1.6× size) and brightens its ring. Hover detection is done in screen space: project bead positions, take the nearest within 16 px of the pointer. One DOM label follows the hovered bead.

### 7.4 Strata (in Experience). `Strata.tsx`, 160 lines at most

A terrain drawn as stacked scanlines, each ridge hiding the lines behind it.

- A plane with `rows × 256` vertices, height from fractal noise. The fragment shader draws a line where `fract(vUv.y * rows)` is near zero and opaque black everywhere else, so nearer ridges cover farther lines with no extra work. Camera looks down at about 35 degrees.
- Parameters per Experience entry: `seed` is a hash of the company name, plus `amplitude`, `frequency` and `ridge`. They ease to the active entry's values. Slow drift over time. `upcoming` entries use low amplitude, one rising ridge and dashed lines.
- The `seed 0x....` readout shows the real hash.

### 7.5 Lines (behind Contact). `Lines.tsx`, 90 lines at most

A monochrome take on the 21st.dev *Shader Lines* idea, rendered in our own canvas. Do not install that component: it loads a second copy of three.js from a CDN and opens another WebGL context.

- One quad filling the slot. UVs are quantised to a 6 px mosaic (12 in lo-fi). The shader sums eight to twelve vertical lines whose x positions wander on sines, each with a `1 / distance` glow, tinted `uPhosphor`. Pointer x shifts the phase.
- When the power switch is pressed, the lines converge to the centre before the screen closes.

---

## 8. Assets

### 8.1 Portrait: `npm run prep:portrait`

1. In WP0, move `image copy.png` to `assets-src/portrait-full.png` and `image.png` to `assets-src/selfie.png`. If Vishal supplies a better photo, it replaces `portrait-full.png`.
2. `scripts/prep-portrait.mjs` (120 lines at most), using `@huggingface/transformers` and `sharp`:
   - matte with the `background-removal` pipeline (MODNet, Apache-2.0);
   - depth with `depth-estimation` and `onnx-community/depth-anything-v2-small`;
   - two crops defined as constants at the top of the script: head and shoulders (4:5), and full figure;
   - luminance: greyscale, `clahe` for local contrast, levels so skin sits between 0.25 and 0.9, multiplied by the matte;
   - depth: normalised inside the matte, 2 px blur;
   - write `public/relief/portrait.png` (320×400) and `figure.png` (192×500), packed R, G, B. **PNG, not lossy WebP**, because lossy compression smears the channels into each other.
3. If either model costs more than half an hour to get running, cut the matte by hand in any image editor and use blurred luminance as depth. It is two images.

This is worth one sentence on the site ("Depth estimated with Depth Anything V2"), in the footer or the console signature. It is true and it fits an AI/ML portfolio.

### 8.2 VMAXX capture: `npm run capture:work`

`scripts/capture-work.mjs` opens the live site in Playwright at 1280×960, scrolls and hovers through the home page for 14 s while recording, then encodes `loop.mp4` (H.264, 640×480, no audio, 1.5 MB at most) and `poster.webp`. Encoding needs ffmpeg on the machine. The equally good manual route: Vishal records 15 s with any screen recorder and drops the file in.

### 8.3 Posters, noise, social image

- `npm run shots -- --posters` captures each slot at tier 3 into `public/posters/`. These are what Clean shows and what every slot shows before WebGL starts, so the layout never shifts.
- `public/noise.png`: generate once with a ten-line Node script, commit the file.
- `src/app/opengraph-image.png`: a 1200×630 capture of the hero. Plus a 32 px `VV` favicon in Pixel Circle.

---

## 9. Quality bars (the definition of done for the whole site)

**Performance**
- Largest contentful paint under 2.5 s on a throttled mobile profile. The hero sentence and name are server-rendered DOM.
- Layout shift under 0.02. Slots have fixed aspect ratios and posters.
- First-load JavaScript at most 200 KB gzipped. The stage chunk is lazy, at most 330 KB gzipped.
- First visit transfers at most 1.2 MB, video excluded.
- 60 frames per second at tier 3 on a discrete GPU, 50 or more at tier 2 on integrated graphics, with only visible slots rendering.
- Lighthouse mobile: performance 85 or higher, accessibility 95 or higher.

**Accessibility**
- Every piece of content is real DOM text. Canvases are `aria-hidden`; slots carry a text label.
- The whole site works with a keyboard alone, with a visible focus ring.
- Body and secondary text meet 4.5:1 in all three tints. Check `--dim` in each.
- Clean mode and reduced motion are complete experiences, not degraded ones.
- The game and the theatre never capture keys unless they have focus.

**Compatibility**
- Chrome, Edge, Firefox and Safari, current versions. Check at DPR 1, 1.25, 1.5 and 2, and at 1440, 1024 and 390 px wide.
- Safari: if `mix-blend-mode` over fixed canvases costs frames, drop the blend on the trail there.

**Search and sharing**
- Title `Vishal Vivek, full-stack and ML engineer`, a one-sentence description, the social image, `Person` structured data with the social links, `sitemap.xml`, `robots.txt`.

**Truth**
- `npm run check:content` passes: no `TODO(vishal)` left.

---

## 10. Work packages

Three phases. A and B are sequential, one agent. C is parallel, one agent per package, each owning its own files. D is sequential again.

**Checkpoints:** after A the site is a complete, good-looking static page and could ship. After B a test cube sits exactly behind every slot while scrolling. After C every artifact works alone. After D it is the site described above.

### Phase A: the static site

**WP0. Scaffold.** Budget: configuration only.
- Ask Vishal the two environment questions before installing anything:
  - The project lives inside OneDrive. `node_modules` and `.next` under OneDrive sync mean slow installs and file-lock errors. Recommended: move the project to `C:\dev\portfolio_website`. His decision.
  - `C:\Users\visha` is itself a git repository. Run `git init` inside the project folder so commits stay here. Confirm with `git rev-parse --show-toplevel`.
- `create-next-app` refuses a non-empty folder. Scaffold into `./_app` (TypeScript, Tailwind, ESLint, App Router, `src/`, alias `@/*`, npm), move everything up one level, delete `_app`.
- Install the dependencies in 6.1. Create the folders in 6.2 with empty stubs. Add scripts: `dev`, `build`, `lint`, `test` (`node --experimental-strip-types --test "src/**/*.test.ts"`), `shots`, `prep:portrait`, `capture:work`, `check:content`.
- `.gitignore`: `node_modules`, `.next`, `shots/`, `assets-src/`. Move the two photos (8.1).
- Done when: `npm run dev` shows a black page set in Geist, `npm run build` passes, the first commit is in the nested repository.

**WP1. Visual system and shell.** Budget 450 lines. Owns `globals.css`, `layout.tsx`, `lib/store.ts`, `shell/*` except `Boot.tsx`, `TypeResolve.tsx`, `Slot.tsx`, `ui/halftone-trail.tsx`.
- Tokens and type from section 3. `ScreenOverlay` with the DPR-aware scanline period. Nav, menu, on-screen display, dial with its three detents, keys, trail mount.
- Done when: a test page shows every type role; the dial visibly changes the page at each detent; scanlines are even at 100%, 125% and 150% Windows scaling (screenshot each); the trail follows the pointer and thins over links.

**WP2. Content and sections.** Budget 600 lines. Owns `content.ts`, `sections/*`, `page.tsx`, `scripts/check-content.mjs`, `scripts/shots.mjs`.
- Type the content schema, fill it with the draft copy from section 4 and `TODO(vishal)` for unknowns. Build all six sections to the wireframes with real semantic HTML (`<dl>`, `<ol>`, `<time>`, `<address>`). Slots are present with placeholder posters. No WebGL, no scroll effects yet.
- Done when: `shots` produces 18 screenshots (6 sections × 3 widths) and each matches its wireframe; the page reads correctly with CSS disabled; keyboard tab order is sensible; Lighthouse accessibility is 95 or higher.

### Phase B: the stage

**WP3. Stage core.** Budget 350 lines. Owns `lib/clock.ts`, `lib/quality.ts`, `stage/Stage.tsx`, `stage/slots.ts`, `stage/useSlotInput.ts`, `stage/screens.glsl.ts`, and a stub for each artifact that draws a wireframe unit box.
- The one clock, the canvas, the pixel-space camera, slot groups, visibility culling, tiers, shared uniforms, bloom at tier 3, URL parameters.
- Done when: at 1440, 1024 and 390 px, each stub box stays glued to its slot's brackets during fast scrolling (record a short video and check frame by frame); no rendering happens when no slot is visible (log draw calls); `?tier=0` shows posters and creates no WebGL context.
- After this WP, `Stage.tsx`, `slots.ts`, `store.ts`, `content.ts` and `globals.css` are frozen for Phase C. A Phase C agent may change only its own files.

### Phase C: in parallel

| WP | Builds | Owns | Done when |
|---|---|---|---|
| WP4 | Relief and the portrait script (7.1, 8.1) | `artifacts/Relief.tsx`, `scripts/prep-portrait.mjs`, `public/relief/*` | All four modes are legible as Vishal's face at tier 2; pointer press and tilt feel immediate; rescan cycles modes and the readout matches; lo-fi works; 60 fps with 32,000 points at tier 3 |
| WP5 | Receiver and the capture script (7.2, 8.2) | `artifacts/Receiver.tsx`, `scripts/capture-work.mjs`, `public/work/*` | It tunes in when scrolled to; colour appears only on hover or focus; the slot is a working link; the video is not requested until the section is near |
| WP6 | Orrery (7.3) | `artifacts/Orrery.tsx` | The dither pattern does not crawl while the object rotates; skill hover works in both directions; re-seed changes the readout |
| WP7 | Strata and Lines (7.4, 7.5) | `artifacts/Strata.tsx`, `artifacts/Lines.tsx` | Nearer ridges hide farther lines; each entry gives a visibly different terrain; the upcoming entry is dashed |
| WP8 | The game (5.4) | `arcade/*` | `npm test` passes for `step` and `bfs`; attract mode reaches food without dying for 60 s; keys do not leak to the page; swipe works on a phone; score 10 unlocks green |
| WP9 | Algorithm theatre (4.4) | `theatre/*` | `npm test` proves each sort yields a sorted array and each search yields a shortest path; counters match the operation count; painting walls works with mouse and touch |

### Phase D: choreography and finish

**WP10. Boot and scroll.** Budget 350 lines. Owns `shell/Boot.tsx`, and may now edit sections and `Stage.tsx`.
- The boot sequence exactly as timed in 4.1, including skip and the same-session shortcut. `TypeResolve` on the name and headings. Channel change (5.2). The Home dissolve, the Work pin, the About word scrub, the Experience pin. The power switch.
- Done when: a screen recording of first load matches the table in 4.1 within 100 ms per step; skipping at any moment leaves the page in a correct state; scrolling the whole page fast and slow never shows a slot without its artifact or poster; reduced motion shows none of it.

**WP11. Polish (5.6).** Budget 250 lines. Sound, screensaver, console signature, degauss. Cut any of these first if time runs out.

**WP12. Quality pass and release.** Owns nothing new.
- Measure every bar in section 9 and fix what fails. Generate posters, the social image and the favicon. Run `check:content`. Test on a real phone and on a laptop at 125% scaling.
- Deploy to Vercel **only when Vishal says so**, first as a preview.

---

## 11. Risks, and what to do about each

| Risk | Response |
|---|---|
| Scanlines, halftone and fractional DPR shimmer against each other | The integer scanline period and the "cell size is a multiple of the period" rule (3.4). Test at 125% scaling early, in WP1, not at the end. |
| Fixed layers jump during an animation | The hard rule in 6.3. `clip-path` only. |
| Canvas and DOM drift apart while scrolling | One clock (6.4). Never add a second `requestAnimationFrame` loop. |
| Slow phones | Tiers, visibility culling, posters. Tier 1 must be tested on a real mid-range phone. |
| The portrait source is low resolution | Grid capped at half the source resolution. A better photo is input 6. |
| Too much going on | Principles 5 and 6. When in doubt, remove motion rather than add it. |
| The page says something untrue about Vishal | `content.ts` and `check:content`. |
| The effects get in the way of a recruiter with 30 seconds | Boot is 2.4 s and skippable; the name, sentence and Work link are server-rendered; Clean mode is one click away. |

---

## 12. After launch (not in version 1)

- `/work/[slug]` case-study pages, at three projects.
- "Ask the machine": a small question-answering page about Vishal in machine voice, through an AI gateway with a hard spending cap.
- Pong against a tiny pre-trained policy network running in plain JavaScript.
- A shared pixel wall where each visitor leaves one dot (needs a key-value store).
- A printable `/cv` page styled as a teletext page.

---

## 13. References

**Vishal's three screenshots, and what each contributes**

| Screenshot | Take | Leave |
|---|---|---|
| Qronos (particle funnel behind a centred headline) | A full-bleed subject that passes behind and through large type | The logo strip, the pill buttons |
| Tessellate (ribbons around a glass sphere in a framed window) | The bracketed live window, truthful readouts such as `seed 04211`, "drag to rotate, click to reforge" | The split hero, the mixed serif |
| Agency site with a curved CRT (source not identified) | A photograph as a dot matrix inside curved glass, cream on true black, type that bleeds off the edge | Nothing |

**Technique, checked on 2026-10-09**
- Maxime Heckel, "The Art of Dithering and Retro Shading for the Web": ordered dither, quantisation, CRT cells. https://blog.maximeheckel.com/posts/the-art-of-dithering-and-retro-shading-web/
- "WebGL CRT Shader" on the gingerbeardman blog (January 2026): an open-source vintage-TV effect. The page would not load during planning, so read it before relying on it; it is the reference for the Receiver's tube shader. https://blog.gingerbeardman.com/2026/01/04/webgl-crt-shader/
- Codrops, dithering tutorials including "Animating 160,000 Cubes in Three.js to Visualize Dithering". https://tympanus.net/codrops/tag/dithering/
- 21st.dev, "Shader Lines" by Ali Imam, the source of the idea in 7.5. https://21st.dev/@designali-in/components/shader-lines
- Geist and Geist Pixel. https://vercel.com/font
- Depth Anything V2 small, ONNX. https://huggingface.co/onnx-community/depth-anything-v2-small
- Awwwards: "22.09.2000 - He Was Born" (CRT, three.js) and Reed Hollett's "Type Dither". https://www.awwwards.com/inspiration/fav-music-22-09-2000-he-was-born and https://www.awwwards.com/reed-hollett/

**Sites to study, from memory and not re-checked today.** Open each and take your own screenshots before borrowing anything.
- bruno-simon.com: a portfolio you play.
- henryheffernan.com: a 3D CRT desktop you operate.
- edh.dev: a terminal portfolio with a convincing CRT surface.
- igloo.inc and lusion.co: the standard for object rendering and scroll choreography.
- Lucas Pope's development log for *Return of the Obra Dinn*: why screen-space dither must be stabilised, which is the reason for the Orrery's fixed threshold.
