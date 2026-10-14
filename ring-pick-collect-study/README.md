# Ring, Pick, Collect

Three single-gesture interaction studies: ring a service bell, pick flowers
into a basket, and sort money into a cash drawer. See `STUDY.md` for what
each one does and where it is implemented.

## Files

```
index.html                  launcher that links to the three scenes
studies/1-ring-bell.html     scene 1: ring the bell
studies/2-pick-flowers.html  scene 2: pick flowers
studies/3-collect-money.html scene 3: collect money
STUDY.md                     description of the study
```

## Running it

There are no dependencies and no build step. Each file in `studies/` is fully
self-contained.

- **Quickest:** double-click any `.html` file to open it in a browser.
- **Local server** (recommended, matches how it behaves when hosted):
  ```sh
  python3 -m http.server 8000
  # then open http://localhost:8000/
  ```
  or `npx serve .`
- **GitHub Pages:** commit this folder and open
  `https://<user>.github.io/<repo>/<folder>/`.

Sound starts after your first click or tap, because browsers block audio
until the page is interacted with. Turn the volume up.
