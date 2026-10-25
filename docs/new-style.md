# Making a new Style Profile

Read this when the Brief asks for a look no Style Profile has (GUIDE.md step 0). Make the new profile in this MV's copy, before the Song Check.

Make it as [styles/README.md](../styles/README.md) describes: `styles/<name>/` with its `style.json`, a `STYLE.md` (the rules of the medium, its drawing API, its "Signature features" and a "What to check" list) and scripts that define every global in that file's table, so the engine, the Characters and the Chapters draw with it unchanged.

Start from a copy of the profile closest to the look (`watercolor/` paints with p5.brush; `cel/`, `cutout/` and `pixel/` draw plain p5 shapes) and change what the look needs: not only the texture, but everything styles/README.md lists under "A look of its own" (how it tones colour, shades with the light, draws lines, moves, letters), or it will look like the profile it came from.

The engine's `style-sample` loop shows any profile off: a sky, hills, a hatched rock, a sun and its light, a Character acting and jumping (the Lead, or Clawd, when mv.json lists it in `characters`), an emote, a Sound Word, a brush wipe and the karaoke band. Render it and check it against the Signature features:

```bash
node engine/render.mjs --loop=style-sample --sheet=0.5,1.6,2.75,3.5 --cols=2 --w=1600 --out=out/check/style_sample.jpg
node engine/lineup.mjs                     # the squint test: every profile, small, side by side → out/check/style_lineup.jpg
```

In the lineup, the new profile must be told from every other at a glance. If it can't, change more than the texture. Then take it to the Style Sample Gate (GUIDE.md step 0).
