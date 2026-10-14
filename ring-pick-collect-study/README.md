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
- **GitHub Pages:** see below.

## Putting it on GitHub

GitHub does **not** unpack `.zip` files, so upload the unzipped files, not
the `.zip` itself.

1. Unzip the download. You get a `ring-pick-collect-study` folder.
2. On the repo page, click **Add file → Upload files**.
3. Drag the **whole `ring-pick-collect-study` folder** (not the `.zip`) onto
   the page. GitHub keeps the folder structure, including `studies/`.
4. Click **Commit changes**.
5. If Pages is on (Settings → Pages → Deploy from a branch → `main`,
   `/ (root)`), the study opens at
   `https://<user>.github.io/<repo>/ring-pick-collect-study/` after a
   minute or so.

Sound starts after your first click or tap, because browsers block audio
until the page is interacted with. Turn the volume up.
