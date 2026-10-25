# The rules

What makes an MV look good, and what makes it look generated. Check the Storyboard against these before the Storyboard Gate, and every sheet you render against them (docs/review-loop.md). If the person asks for something they forbid, do what the person asks.

- [1. The medium is solid](#1-the-medium-is-solid)
- [2. No text, except a few Sound Words](#2-no-text-except-a-few-sound-words-and-the-lyrics-in-lyric-mode)
- [3. Something happens in every Shot](#3-something-happens-in-every-shot)
- [4. Timing: model the viewer](#4-timing-model-the-viewer)
- [5. Alive](#5-alive)
- [6. Every Seam has a transition](#6-every-seam-has-a-transition)
- [7. One piece](#7-one-piece)
- [Animation principles](#animation-principles)

## 1. The medium is solid

Draw only with the Style Profile's primitives (watercolour: `paint()`, `inkLine()`, `glow()`…) and keep every rule its STYLE.md sets, above all what the look forbids (watercolour: 3D rotation or perspective, plain p5 shapes, pure black or white). Whatever the style, Characters turn through drawn key views (the Character Contract), never a 3D projection.

## 2. No text, except a few Sound Words (and the lyrics, in lyric mode)

- **Show it, don't write it.** No captions, no titles, no labels on objects, no signs, no speech bubbles with words, no words on screens. The karaoke (when it's on) already carries the lyrics, under the picture.
- **A sign that repeats the lyric is the classic failure.** If the line is "I'm lost" and a Character holds a sign saying "I'm lost", the Shot has failed. Act it: look left, then right, the map upside down, a sweat drop.
- **Reactions are painted marks, never letters**: `!`, `?`, zzz, sweat, hearts, a bulb, a rain cloud (emotes).
- **Sound Words** are the only lettering inside the picture: a painted FOOM, CHOMP or SLAM, or a single word the moment needs (`sfx()`, `letter()`). A handful in the whole MV, each listed in the Storyboard.
- **Lyric mode** is the one exception: the sung words are the picture. The Storyboard lists which lines are painted in (`letter()`), and they act out what they say instead of sitting there as captions. Everything else in this rule still holds.

## 3. Something happens in every Shot

- **Every Shot needs an event:** something changes between its first frame and its last. What changes depends on the mode (GUIDE.md step 0): a Character wants something, finds something, tries, fails, reacts or gets it (narrative); the performance builds (performance); the light, colour, weather or form transforms (mood); the words arrive, act and leave (lyric). "Clawd stands in a meadow being cute" is not a Shot, and neither is a pretty landscape that only drifts.
- **One focal action at a time**, staged with a clear silhouette and nothing competing for attention, and above the karaoke band (`KARAOKE_TOP`) while a line is showing.
- **Cause, then reaction.** The reaction is often what the viewer remembers, so give it time.
- **Pay it off.** Whatever you set up gets resolved on screen, in that Shot or a later one.
- **Act the line, don't illustrate the word.** A Shot shows what the Lyric Line means (from the Lyric Reading), as an event, not a picture of one of its words.

## 4. Timing: model the viewer

You know what happens because you wrote the code. The viewer doesn't: they see it once, at full speed, for the first time, while listening to the song. **For every moment, ask what the viewer needs to understand and how long that will take them, and time it for that.**

- **Write the reads.** For each Shot, list in order what the viewer has to understand. Every read needs time for the eye to find it, time to understand it, and a moment to register before the next starts. Small, distant, fast or subtle things take longer. A moment that is over before the viewer understands it didn't happen.
- **One read at a time.** When two things happen at once, the viewer sees only one. Put a cause and its reaction in sequence.
- **Fast actions, slow meanings.** A motion can be very quick if it's anticipated, but what it means needs held time. That contrast between quick and held is what gives a film rhythm; everything at one brisk speed, with no holds, has none.
- **Lead the eye.** The viewer looks at whatever moves, is bright, is big or is being looked at. Get their eye to the right place before an important read.
- **The song sets the clock.** A Shot lasts as long as its line, and its picture starts with the line, not before or after it. Fit the reads to the line, not the line to the reads: if a line is too short for its idea, simplify the idea or carry it into the next Shot. Land hits on beats and big changes on bar starts.

## 5. Alive

- **Nothing is ever still.** Every emotion has its own idle motion, cameras drift or push, backgrounds stir, and the Style Profile's texture moves (watercolour: the linework boils). A frozen frame reads as a bug. But nothing jitters: a still thing changes only on boil frames (give each its own `boilSeed()`).
- **Faces act, they never snap.** Change moods with `ch.emotions()`, which does anticipation, a squint, a take and overshoot around every change.
- **Characters are big.** In a medium shot a Character stands about 15–20% of the frame's shorter side tall; in chorus and dance Shots the Lead fills about 40% of it. Tiny Characters are for wide establishing Shots only, never a tiny Character in a big empty landscape for the whole MV.
- **Everything moves on the beat.** Idles, bounces and dances all read the Beat Grid, so the whole film shares the song's pulse, drift and all.

## 6. Every Seam has a transition

- Into the first Shot, between every pair of Shots, and out of the last: never start on a hard frame, and never just stop.
- **Pick a transition that belongs to the story**, and don't default to the same one every time: a brush wipe, an iris or shaped iris, a whip pan with a smear, a match cut (the same shape or motion across the cut), a cut on action (finish the move in the next Shot), a camera move that carries through, a fade or push from paper.
- A plain cut is fine only when it's on action, on a beat, or a deliberate smash cut; hard cuts everywhere are a failure.
- **Changes inside a Shot are transitions too:** emotions go through `ch.emotions()`, turns through `ch.turn()`, and props arrive and leave on arcs, never popping in.

## 7. One piece

- **One world** with a colour arc across the song. **One thread**: a beginning, a middle and an end, with the Leads' emotional arc following it. Every Chapter a different world with nothing linking them is a pile of clips.
- **Rhyme the ending with the opening:** the same place, pose or motif, changed. Choruses rhyme with each other the same way.
- **Link Shots:** motion continues across cuts, screen direction stays consistent, props and characters carry over.

---

## Animation principles

Motion written as code comes out mechanical, because code moves every part at once, on the same curve, by the same amount. These principles fix that.

- **Anticipation.** Before a big move, a small move the opposite way: a crouch before a jump, a wind-up before a throw, a squint before a take. `jump()` and `ch.emotions()` build it in.
- **Squash and stretch.** Bodies squash on impact and stretch when they move fast, keeping their volume (`sq`).
- **Slow in, slow out.** Run every progress through an easing (`ease`, `easeIn`, `easeOut`, `backOut`); a plain `lerp` over time looks mechanical.
- **Weight.** Heavy things start and stop slowly and land with little bounce; light things snap, bounce and flutter.
- **Arcs.** Thrown props, hops, arm swings and head turns move on arcs (`arcPt`), not straight lines.
- **Overlapping action and follow-through.** The eyes lead, the body follows, and arms, hats, props and tails drag behind, overshoot and settle last (`spring`, `ring`, `backOut`).
- **Avoid twinning.** Give one arm the action and the other something smaller; offset timings, phases and seeds between Characters so a crowd doesn't bounce in unison.
- **Exaggeration.** Push poses, takes, squash and leans further than feels natural. In a short cartoon, subtle reads as nothing.
- **Strong key poses.** Each Shot's storytelling poses should read as stills before any motion goes between them.
- **Contact.** Feet stand on the ground, held things touch the hand, thrown things leave from it; a prop floating near a hand gives the drawing away.
- **Show the thought.** A Character notices, thinks, then acts, and the eyes move first.
- **Secondary action** supports the main one (a hat bobbing, an emote popping) but never competes with it.
