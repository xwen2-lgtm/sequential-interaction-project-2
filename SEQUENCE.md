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

## What changed from the studies

The physics constants, thresholds, timings, sound design and hint logic are copied from the studies.
Only the following changed so that they work as one experience:

- **One page, one audio engine.** The connected draft used three iframes. Here everything shares one stage, one `AudioContext` that the first tap unlocks, and one mute.
- **Money plays one round.** The study dealt a new pile after finishing; here finishing ends the step.
- **Bell on a counter.** The bell is drawn inside the counter scene, so it can be placed, scaled and moved. Its springs are in its own units, so they behave the same at any size.
- **Till opens and closes.** The study only had an open drawer. The drawer now rises from behind the counter top and sinks back at the end.
- **The bouquet.** The finished basket is redrawn as SVG from the same flower and basket art. That keeps it identical to the canvas version as it is carried over.
- **Per-step reset buttons removed**, as decided above.
- **Dead code dropped**: the unused puff particles in the flower study.

## Files

```
docs/
  index.html        page structure and the counter/till/bell drawing
  .nojekyll         tells GitHub Pages to serve the files as they are
  css/style.css     layout, light/dark colours, money and slot animations
  js/util.js        theme, tweening, shared flower/basket art
  js/audio.js       shared AudioContext and mute
  js/flowers.js     step 1 (Pick Flowers study)
  js/bell.js        step 2 (Ring The Bell study)
  js/money.js       step 3 (Collect Money study)
  js/shop.js        the counter: placements, till open/close
  js/sequence.js    the linear sequence, transitions, restart/replay
```

Everything is plain HTML, CSS and JavaScript, with no build step, libraries or network requests.
The scripts are ordinary `<script>` files (not modules), so `docs/index.html` also opens directly from disk.

## Publishing

In the repository on GitHub go to **Settings → Pages → Build and deployment**, choose
**Deploy from a branch**, branch **main**, folder **/docs**, and save. The prototype is then at
`https://xwen2-lgtm.github.io/sequential-interaction-project-2/`.
