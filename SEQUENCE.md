# Flower Shop: sequence prototype

One continuous, wordless interaction built from the three studies in
`ring-pick-collect-study/` (Ring The Bell, Pick Flowers, Collect Money).
The published site is in `docs/`.

## Decisions

| | |
|---|---|
| Concept | A visit to a flower shop: pick a bouquet, ring for service, pay at the till. |
| Starting state | A quiet, empty field with a slow pulsing ring. Tapping it starts the sound and reveals the first step. |
| Order | Pick → Ring → Collect. One linear path, no branches. |
| Unlocking | Each action becomes available only after the one before it is complete. |
| Ending | The till closes with a soft chime, and the bouquet and bell slide together on the counter. A replay button then appears. |
| Reset | No per-step resets. A restart button (top left) is always available, and the replay button appears at the end. Both return to the starting state. |
| Theme | Follows the system light/dark setting. The counter and till have a new dark palette; bills and coins keep their study colours. |
| Sound | One mute button (top right) for everything, remembered between visits. |

## The sequence

| Step | Gesture (from the study) | Feedback (from the study) | Complete when | Then |
|---|---|---|---|---|
| Begin | Tap anywhere | Rings spread from the tap point, the field fades in | First tap | Pick unlocks |
| 1. Pick | Press a flower and pull it up out of the grass | Flower lifts, leans and wobbles with the pull; a rising pentatonic pluck; it flies along an arc into the basket, which squashes and bounces | All 8 flowers are in the basket | After 1.1 s the basket of flowers is carried onto the shop counter while the field cross-fades to the counter |
| 2. Ring | Press the bell (or Enter/Space when it has focus) | Click and bright ding with a hammer rebound; the bell slides, tilts and shivers on springs | Rung at least once and its wobble has settled | The bell slides into the right corner of the counter and the till drawer rises from behind the counter |
| 3. Collect | Drag each bill and coin into its slot | Pick-up sound and the right slot lights; a wrong slot plays a low "nope" and the piece springs back; correct pieces stack with rising tones; idle hints after 0.9 s / 4.5 s; on finishing, the slots light in turn with a chime run and a sheen | All pieces (12–20, random) are in their slots | After the study's 3.2 s celebration, the ending |
| End | – | The drawer sinks shut (thud plus soft two-note chime), and the bouquet and bell move together | – | The replay button fades in |

## Flower controls (Pick step)

During the Pick step, a sliders button under the mute button opens a collapsible **Flower controls** panel.
Changes apply immediately and are remembered in the browser. The motion defaults reproduce the study; the colour defaults are the finished look (spring flowers on olive grass), and "Original (gray)" restores the study's look.

| Control | Range / options | Default |
|---|---|---|
| Flower size | 60–160 % | 100 % |
| Wind | on / off | off |
| Wind strength | 5–60 km/h (60 km/h leans flowers about 20°; gusts travel left to right) | 20 km/h |
| Wiggle | on / off | off |
| Wiggle amount | 1–15 ° | 5 ° |
| Wiggle speed | 0.5–4 Hz | 1.5 Hz |
| Grass | original gray, lime, yellow green, peacock, olive, apple green | olive green |
| Flowers | original gray; spring (light pink + butter yellow), summer (turquoise + bright magenta), fall (brown + light red), winter (light mint + pale lilac). Flowers alternate between the two colours, each with the other colour as its centre. | spring |
| Flight easing | Linear, Ease In, Ease Out, Ease In-Out (the study's curve), Spring/Bounce | Ease In-Out |
| Flight time | 300–2000 ms (plus the study's 0–150 ms random variation) | 900 ms |

- **Reset state:** new flowers in the grass and an empty basket; the settings stay.
- **Restore defaults:** puts every control back to the default.
- **Copy as prompt:** copies the current values as a short prompt you can paste into Claude.

The chosen colours carry over to the bouquet on the shop counter. With reduced motion turned on in the
system settings, the study's reduced-motion rules still apply: linear 0.3 s flights and gentler sway.
Code: `docs/js/settings.js` (the list of controls), `docs/js/panel.js` (the panel), `docs/js/flowers.js` (how they apply).

## Bell controls (Ring step)

During the Ring step, the same button position (under the mute button) opens a **Bell controls** panel.
While it is open you can ring the bell as often as you like without moving on; closing it continues to the till
(if the bell has been rung). Changes apply immediately and are remembered in the browser.

| Control | Range / options | Default |
|---|---|---|
| Volume | 0–150 % | 100 % |
| Sound mood | Original (service bell), Stinging, Happy, Sad, Dull, Bored, Cute | Original |
| Bell colour | original gray, green, purple, silver, gold, white | original gray |
| Metallic shine | on: the study's highlight plus a glint that sweeps the dome on each strike; off: flat colour | on |
| Swing size | 25–200 % of the study's swing | 100 % |
| Time to return to rest | 0.8–5 s (the study's bell settles in about 2.2 s) | 2.2 s |

The moods change the synthesized ding:
- **Stinging:** higher and piercing, with a detuned shimmer.
- **Happy:** a major chord, followed by a second note a major third up.
- **Sad:** low and minor; it sags in pitch and rings long.
- **Dull:** a muffled, short clunk.
- **Bored:** low and quiet, and sighs downward.
- **Cute:** a toy-like ping that springs up, with a small echo.

Time to rest changes only the damping, so the bell's swing frequency stays the same.
Reset state stops the bell and its sound and puts it at rest. Restore defaults and Copy as prompt work as in the flower panel.

## Table controls (Ring and Collect steps)

The shop background and counter finish can be changed from the **Shop** (first) and **Table** sections of the Ring step's panel ("Bell, table & shop controls"), and from a **Table controls** panel in the Collect step.

| Control | Options | Default |
|---|---|---|
| Shop background | plain, purple boutique, pink cottage, mint market, neutral cream | neutral cream |
| Table wood | original gray, cherry blossom, rosewood, maple, willow, oak, birch | oak |
| Tree-ring grain | on / off: wavy grain lines and ring knots drawn over the counter top, front and drawer panels (wood finishes only) | on |

Each wood has its own counter-top, cabinet and edge colours; in dark mode they are drawn 30% darker.
In the Collect panel, Reset state deals a fresh pile of money onto the counter.

The four shop backgrounds are flat, wordless SVGs in `docs/assets/backgrounds/`
(purple boutique, pink cottage, mint market, neutral cream). They are generated by
`tools/make_backgrounds.py`; edit that script and rerun it to change them. They are dimmed in dark mode.
The till drawer (body, compartments, labels and pull) takes matching colours from the chosen background;
with the plain background it keeps the study's grays.

## What changed from the studies

The physics constants, thresholds, timings, sound design and hint logic are copied from the studies.
Only the following changed so that they work as one experience:

- **One page, one audio engine.** The connected draft used three iframes. Here everything shares one stage, one `AudioContext` that the first tap unlocks, and one mute.
- **Money plays one round.** The study dealt a new pile after finishing; here finishing ends the step.
- **Bell on a counter.** The bell is drawn inside the counter scene, so it can be placed, scaled and moved. Its springs are in its own units, so they behave the same at any size.
- **Till opens and closes.** The study only had an open drawer. The drawer now rises from behind the counter top and sinks back at the end.
- **The bouquet.** The finished basket is redrawn as SVG from the same flower and basket art. That keeps it identical to the canvas version as it is carried over.
- **Per-step reset buttons removed**, as decided above.
- **Coloured money.** Each bill has a soft colour of its own ($1 sage green, $5 lilac, $20 apricot, $100 pale blue); the penny is copper and the dime silver. Always on.
- **Finished look by default.** Players see spring flowers on olive grass, the coloured bouquet in a wicker basket, the cream shop background, an oak counter and a till that matches the background, without choosing anything. The till always follows the background and has no control of its own.
- **Wicker basket.** The study's flat gray basket is now a traditional pale-brown woven basket, with a basket-weave body, a braided rim and a twisted handle. It is used in the field and in the bouquet on the counter, and is a little darker in dark mode.
- **Dead code dropped**: the unused puff particles in the flower study.

## Files

```
docs/
  index.html        page structure and the counter/till/bell drawing
  .nojekyll         tells GitHub Pages to serve the files as they are
  css/style.css     layout, light/dark colours, money and slot animations
  js/util.js        theme, tweening, shared flower/basket art
  js/audio.js       shared AudioContext and mute
  js/settings.js    flower, bell and table controls: lists, defaults, saved values, prompt text
  js/panel.js       the collapsible control panels
  js/flowers.js     step 1 (Pick Flowers study)
  js/bell.js        step 2 (Ring The Bell study)
  js/money.js       step 3 (Collect Money study)
  js/shop.js        the counter: placements, till open/close
  js/sequence.js    the linear sequence, transitions, restart/replay
  assets/backgrounds/  purple, pink, mint and cream shop backgrounds (SVG)
```

Everything is plain HTML, CSS and JavaScript, with no build step, libraries or network requests.
The scripts are ordinary `<script>` files (not modules), so `docs/index.html` also opens directly from disk.

## Publishing

In the repository on GitHub go to **Settings → Pages → Build and deployment**, choose
**Deploy from a branch**, branch **main**, folder **/docs**, and save. The prototype is then at
`https://xwen2-lgtm.github.io/sequential-interaction-project-2/`.
