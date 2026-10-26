# Making a new Style Profile

Read this when the Brief asks for a look no Style Profile has (GUIDE.md step 0). Make the new profile in this MV's copy, before the Song Check: first a target image the person approves, then the profile, coded toward it.

## A target image, before any code

A look described in words and coded straight away tends to come out as an existing profile with a new texture: the same colours, light and frame under different grain. A picture the person approves first settles what the look is, and gives every render something to be compared with.

Make it with an image model: GPT Image through the `codex-gpt-image` skill, or whatever image tool this session has. If there is none, say so and ask the person for pictures of the look instead; the one they pick is the target.

Paint the scene the `style-sample` loop paints, so the target and the Style Sample can be laid side by side. The prompt is that scene, then the medium:

```text
A single still frame (16:9) from a hand-made music video. The scene: open sky with a long soft cloud band across the
upper left; a sun at the upper right with its light around it; a far range of rolling hills and a nearer range in front
of it; flat ground filling the bottom quarter of the frame. Left of centre, the Character (Image 1) is in mid-jump,
surprised: arms up, mouth a small open oval, a small shadow on the ground below. A yellow "!" emote pops beside its head.
A rounded boulder sits on the ground at the right. The sound-effect word "POP!" bursts in the sky between the Character
and the sun. At the bottom centre a karaoke lyric line reads exactly "Paint me a little song 小小的歌", with
"Paint me a" highlighted as already sung.

Image 1 is ONLY the Character's model sheet: keep its shape and proportions, not its drawing style, outlines, colours
or background. It stays a flat 2D drawn character, never a 3D render. No logos, watermarks, signatures or other text.

THE MEDIUM: …
```

- **The medium** commits on every row of styles/README.md's "A look of its own": its own colours and values (not the template's sky blue, green hills and violet rock), its light, its lines and edges, its texture, its lettering (the karaoke and the Sound Word) and the whole frame (a border, a frame shape, the paper). End with what it must not look like, naming the nearest existing profiles.
- **References.** The person's pictures of the medium (`mv/refs/`) go in as further images, named as references for the medium. The Character goes in for its shape only: its Model Sheet, or a crop of the style-sample rendered in any profile.
- **Several looks.** When the person is choosing between looks, make one target for each and show them small, side by side, as the lineup does; a look that can't be told from the others there isn't one yet.

🚦 **Style Target** (GUIDE.md step 0). Change the prompt and make it again until the person approves. Save the approved image as `styles/<name>/target.jpg` (about 1280 px wide) and name it at the top of STYLE.md.

## The profile

Make it as [styles/README.md](../styles/README.md) describes: `styles/<name>/` with its `style.json`, a `STYLE.md` (the rules of the medium, its drawing API, its "Signature features" and a "What to check" list), its `target.jpg`, and scripts that define every global in that file's table, so the engine, the Characters and the Chapters draw with it unchanged.

Start from a copy of the profile closest to the look (`watercolor/` paints with p5.brush; `cel/`, `cutout/` and `pixel/` draw plain p5 shapes; `paper-theatre/` paints on a Canvas 2D and `doodle/` builds an SVG scene) and change everything styles/README.md lists under "A look of its own" toward the target, or it will look like the profile it came from. Begin with `PAL` and `tone()`: the scene and the Characters pass the template's colours, and the look turns them into the target's.

Leave out what the target shows but the profile doesn't own: scenery the scene doesn't draw (trees, flowers, a foreground: those are a Chapter's), a Character turned into a 3D box (it keeps its drawn key views), and what a Character decides for itself (its blush, its eyes).

## Check it

The engine's `style-sample` loop shows any profile off: a sky, hills, a hatched rock, a sun and its light, a Character acting and jumping (the Lead, or Clawd, when mv.json lists it in `characters`), an emote, a Sound Word, a brush wipe and the karaoke band. After each round, lay the target over the render at the same size and judge it at a glance and up close: is it the same look?

```bash
node engine/render.mjs --loop=style-sample --sheet=1.6 --cols=1 --w=1600 --out=out/check/style_t16.jpg
ffmpeg -loglevel error -y -i styles/<name>/target.jpg -i out/check/style_t16.jpg \
  -filter_complex "[0]scale=1600:-2[a];[1]scale=1600:-2[b];[a][b]vstack" out/check/vs_target.jpg   # target above, render below
node engine/render.mjs --loop=style-sample --sheet=0.5,1.6,2.75,3.5 --cols=2 --w=1600 --out=out/check/style_sample.jpg
node engine/lineup.mjs                     # the squint test: every profile, small, side by side → out/check/style_lineup.jpg
```

In the lineup, the new profile must be told from every other at a glance. If it can't, change more than the texture. Then take it, with `vs_target.jpg`, to the Style Sample Gate (GUIDE.md step 0).
