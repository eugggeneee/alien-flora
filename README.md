# Alien Flora

An illustrated atlas of 35 invasive and fast-spreading plants around Minsk. You can search the catalog, answer four questions to narrow down a species, and read what to do when you find one.

Live site: https://eugggeneee.github.io/alien-flora/

## Run it

Open `index.html` in a browser. There is nothing to install or build.

If you prefer a local server, run `python -m http.server` in this folder and open `http://localhost:8000`.

## What is inside

- `index.html` holds the page structure.
- `style.css` holds the styles, including the dark theme.
- `script.js` handles the catalog, the identifier and the dialogs. It also draws every plant illustration as SVG.
- `data.js` lists all 35 species.

## Add a plant

Copy one entry in `data.js` and change its fields. Use a short lowercase id with hyphens. The `bloom` field is the first and last flowering month, so `[6, 7]` means June to July. The illustration is generated from the plant's form and flower colour, so you do not need an image.

## Notes

The site makes no network requests. The species notes are an educational reference, so check official lists and local rules before you remove anything.
