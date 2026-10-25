# The review loop

You can't see motion by reading code. Render and look at every Shot, at three zoom levels (add `--mv=<dir>` when the MV isn't the template root):

```bash
node engine/render.mjs --sheet=23.1,23.8,24.5,25.2 --cols=4 --w=480 --out=out/check/a.jpg   # the shape of a Shot or Chapter
node engine/render.mjs --strip=24.1:24.6 --out=out/check/strip.jpg                          # EVERY frame of a moment
node engine/render.mjs --sheet=24.3 --crop=760,420,500,400 --w=500 --out=out/check/face.jpg  # full-resolution detail
node engine/render.mjs --strip=24.1:24.6 --crop-at=960,700,500,400 --out=out/check/feet.jpg  # detail that follows a WORLD point
node engine/render.mjs --clip=23:38.5 --out=out/check/chorus.mp4                             # a stretch with the song
```

Open each image with the Read tool and actually look at it. Check:

- **Read:** is each Shot's event clear from its sheet alone? Are the Characters big enough, and do they separate from the background? Is anything important under the karaoke band (above `KARAOKE_TOP` only)?
- **Timing:** render a Shot at a fixed step (every 0.1–0.15 s) and read it like a viewer: where are they looking, do they understand it yet? Count the frames each read gets (at mv.json's `fps`: 24 frames = 1 s by default). Does each line's picture start with the line?
- **Motion:** in strips, does every move have anticipation and follow-through? Any pops or snaps? Parts moving at different times? Anything at constant speed, or mirrored left and right?
- **Boil:** in a strip, still things change only on boil frames. Anything still that changes every frame needs its own `boilSeed()`.
- **Contacts:** feet on the ground, held things touching the hand, thrown things leaving from it.
- **Seams:** the first and last 0.5 s of every Shot. Does each open and close with its transition? Between Chapters, `--seams` shows the edge as the final will.
- **Refined, and continuous:** look at each Shot as a still and next to its neighbours: is it refined where the eye goes, and does it follow on from the last Shot?
- **Rules:** anything [rules.md](rules.md) forbids, above all lettering the Storyboard doesn't list, or a dead stretch.
- **Style:** the "What to check" list in the Style Profile's STYLE.md.

**Budget:** at least one sheet per Shot, a strip for every key motion and Seam, and a crop for every face that carries the story. Sheets cost about 0.1–2.5 s per frame: don't skip them.
