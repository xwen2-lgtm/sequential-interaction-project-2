# Study: Ring, Pick, Collect

## What the study does

The study has three small single-gesture scenes. Each one is a complete,
self-contained HTML page with no text instructions: the objects themselves
show what to do. They are numbered in the order they are meant to be
experienced:

1. **Ring the bell** (`studies/1-ring-bell.html`): tap a service bell and it
   dings, jolts and wobbles back to rest.
2. **Pick flowers** (`studies/2-pick-flowers.html`): pull eight flowers up out
   of the grass and they fly into a basket.
3. **Collect money** (`studies/3-collect-money.html`): drag loose bills and
   coins off a counter into the matching slots of an open cash drawer.

All three use the same visual language: grayscale only, a single object or
scene on an empty field, one small round reset button, and sound synthesized
in the browser with Web Audio. Nothing is loaded from the network. Each scene
can be a step in a connected sequence (for example: arrive at a shop → gather
something → pay or get paid).

Line numbers below refer to the files exactly as exported.

---

## 1. Ring the bell — `studies/1-ring-bell.html`

### Visual and interactive components
| Component | What it is | Where |
|---|---|---|
| Bell | Inline SVG: base bar, dome, highlight arc, plunger (`#swing`, `#btn`), wrapped in `<button id="ring">` | lines 98–114 |
| Hit area | Transparent `rect.hit`; only this area takes the pointer | line 101; CSS 66–67 |
| Reset button | Round 44px button, bottom right; dim (`data-live="0"`) at rest, full opacity while the bell is moving | lines 116–121; CSS 74–95 |
| Theme | Grayscale tokens on `:root`, with a dark variant through `prefers-color-scheme` or `data-theme` | lines 5–35 |

### User actions → feedback → states
- **Press the bell** (pointer down on the hit area, or Enter/Space on the
  focused button) runs `ring()` (lines 255–270):
  - Sound: `strike(1)` (lines 218–250) plays a short noise click plus seven
    inharmonic sine partials at about 2350 Hz through a compressor. A softer
    `strike(0.4)` follows 62 ms later as the hammer rebound.
  - Motion: three damped springs (slide `x`, tilt `th`, plunger `p`) are
    kicked, plus a fast decaying metallic shake (lines 134–178). `frame()`
    integrates them every animation frame.
  - The reset button lights up (`setLive(true)`).
- Pointer presses ring on contact (`pointerdown`, line 288). The button's
  `click` handler only reacts to keyboard activation (`e.detail === 0`,
  line 292), so one tap never rings twice.
- Rapid repeated taps add more momentum; the springs accumulate.
- **Settles:** once every spring falls under a threshold, the loop stops and
  the reset button dims again (lines 168–175).
- **Reset** (`reset()`, lines 272–286) stops the motion, zeros every spring
  and fades out any ringing sound by swapping in a fresh audio bus.

**States:** `idle` (no animation loop running, reset dim) ↔ `ringing`
(loop running, reset lit).

---

## 2. Pick flowers — `studies/2-pick-flowers.html`

### Visual and interactive components
| Component | What it is | Where |
|---|---|---|
| Canvas stage | One full-bleed `<canvas>`, redrawn every frame | lines 73–74, 516–525 |
| Grass field | Tiled grass SVG, clipped to a rounded rectangle | drawing at 442–452 |
| Flowers (8) | Four-petal flower SVG drawn as an image, with a ground shadow | assets at 113–120; placement in `makeFlowers()` 194–214 |
| Basket | Basket SVG; flowers that land fan out into it as a bouquet | assets at 129–136; slots in `slotParam`/`slotAnchor` 217–233 |
| Reset button | Round button: top right in landscape, bottom right in portrait; spins on click | lines 75–77; CSS 47–70 |
| Responsive layout | Landscape puts grass left and basket right; portrait puts grass on top and basket below | `computeLayout()` 163–188 |
| Theme | Grayscale palettes `PAL.light` / `PAL.dark`; the SVG images are rebuilt when the theme changes | lines 106–111, 145–160 |

### User actions → feedback → states
- **Press a flower** (`pointerdown`, lines 311–320): finds the flower under
  the pointer (`hitTest`, 247–259) and captures the pointer.
- **Drag upward** (`pointermove`, 321–334): the flower enters the `pulling`
  state once the pointer has moved up 4px. It lifts out of the ground, leans
  toward a sideways drag and wobbles harder the further it is pulled, all
  through spring physics in `update()` (383–393). Its shadow shrinks.
- **Pulled far enough** (pull ≥ 100%), or **released** past 55%, or flicked
  up quickly past 12% (`endPointer`, 335–343), calls `pluck()` (297–305):
  - Sound: a soft rising pluck that climbs one pentatonic step for each
    flower picked (`pluckSound`, 272–295).
  - The flower flies along a curved Bézier path into its basket slot
    (`update()` 394–408), shrinking and swaying.
  - When it lands (`land()`, 369–377), the basket squashes and bounces
    (`bob`/`bobV` spring, drawn at 491–498).
- **Released too early:** the flower springs back into the ground with a
  small wobble (`release()`, 306–309).
- **Reset** (`reset()`, 347–354) scatters a new random set of eight flowers
  and spins the reset icon.

**Flower states:** `ground` → (`pulling` while dragged) → `fly` → `basket`.
A `done` flag is set when all eight are in the basket (line 374) but nothing
reacts to it yet. That makes it a natural hook for moving to the next scene.

---

## 3. Collect money — `studies/3-collect-money.html`

### Visual and interactive components
| Component | What it is | Where |
|---|---|---|
| Scene | One `<svg id="scene">` with viewBox 900×850 | lines 121–233 |
| Counter | Static SVG counter top and cabinet front | lines 157–193 |
| Cash drawer | Open till with six labeled compartments: $1, $5, $20, $100, Pennies, Dimes | lines 195–225; slot data `SLOTS` 342–349 |
| Loose pieces | 2–3 of each bill and 3–4 of each coin, shuffled and scattered on the counter | `makeRound()` 352–374; art in `billArt`/`coinArt` 377–409 |
| Slot lights | A halo and fill for each compartment: `hot` while its piece is dragged, `hint` pulse, `pop` flash on landing | lines 68–78; built in `init()` 456–463 |
| Buttons | Sound toggle (`#sound`, `aria-pressed`) and Reset (`#reset`), top right | lines 105–119; CSS 28–45 |
| Completion sheen | A white sweep across the drawer once everything is sorted | lines 86–94, 230 |

### User actions → feedback → states
- **Idle:** loose pieces "breathe" with a soft glow, staggered one after
  another (CSS 55, 59–62).
- **Hint:** after 0.9 s at the start, or 4.5 s without progress, one
  remaining piece and its target slot pulse (`showHint`, 492–499).
- **Pick up a piece** (`pointerdown`, 513–532): the piece scales up a little,
  gets a lifted shadow, moves to the top layer, and its correct slot lights
  up (`hot`). Sound: a paper rustle for a bill, a small click for a coin.
- **Drag** (`pointermove`, 534–540): the piece follows the pointer, kept
  inside the scene.
- **Drop** (`release`, 542–564):
  - **On the correct slot** (with 28px of tolerance) → `land()` (569–590):
    the piece snaps onto a neat stack in the slot with a small overshoot, a
    landing sound plays (bill thud plus tone, or coin chime, pitched up the
    pentatonic scale as the stack grows), and the slot flashes (`pop`).
  - **On a wrong slot** → a low falling "nope" tone, and the piece springs
    back to where it was picked up.
  - **Anywhere else** → the piece settles where it was dropped.
- **All pieces sorted** → `complete()` (592–605): the slots light up one by
  one with a rising arpeggio, a shimmer sound plays, and the sheen sweeps the
  drawer. After 3.2 s the pile fades out, and at 3.8 s a fresh random round
  arrives with a whoosh (`init(true)`).
- **Reset** (line 607) starts a new round right away. **Sound toggle**
  (608–613) mutes or unmutes and remembers the choice in `localStorage`
  (`cm-muted`).

**Piece states:** `idle` → `hint` (optional) → `drag` → `landed`, or back
to `idle`.
**Round states:** `playing` → `done` (celebration) → `clearing` → new round.

---

## Shared behavior and accessibility
- **Reduced motion:** all three honor `prefers-reduced-motion`. Springs are
  damped or shortened, and hint and idle animations are removed.
- **Audio:** each page creates its `AudioContext` on the first press, as
  browsers require, so the first gesture both unlocks sound and acts.
- **Input:** Pointer Events everywhere, so mouse, touch and pen all work.
  `touch-action: none` / `manipulation` stops the page from scrolling
  mid-gesture.
- **Keyboard:** the bell can be rung with the keyboard. Flowers and money are
  pointer-only; only their buttons are keyboard focusable.
- **Dark mode:** the bell and flowers follow the system theme. Collect money
  is light only.

## Dependencies and assets
- **No external dependencies.** No libraries, frameworks, fonts, images or
  network requests. Every graphic is inline SVG, SVG strings made in
  JavaScript, or canvas drawing, and every sound is synthesized with the Web
  Audio API.
- **Fonts:** the system UI font, plus `Georgia, serif` for the money labels,
  with fallbacks.
- **Browser:** any current Chrome, Edge, Safari or Firefox. Uses Pointer
  Events, Web Audio, `ResizeObserver`, `requestAnimationFrame` and SVG
  filters.

## Notes for connecting the scenes
- Each page runs in its own closure (IIFE) with its own global IDs (`#reset`
  appears in all three). To merge them into one page, put each scene in its
  own container or `<iframe>`, or give the IDs scene-specific names.
- Natural "finished" signals to hook into for moving to the next scene:
  - **Bell:** the end of `ring()`, or the moment it settles (`setLive(false)`
    in `frame()`).
  - **Flowers:** `done = true` in `land()` (line 375).
  - **Money:** `complete()` (line 592). It currently starts a new round
    automatically after 3.8 s; replace that `init(true)` call to move on
    instead.
- Unused leftovers in the code, harmless: `spawnPuff()` and the puff
  renderer in the flowers page (nothing ever creates puffs), and a `.bk`
  CSS rule in the money page.
