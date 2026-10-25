# MVTemplate

A template for making a hand-made-looking music video with Claude: copy it once per music video, drop in a song and its lyrics, and Claude storyboards, builds, reviews and renders it.

## Language

### The production

**MV**:
One music video, made from one copy of this template, driven by one Song. A video with no music is an MV whose Song is silence.
_Avoid_: project, clip, film

**Gate**:
A point where making the MV stops until the person approves what is there. There are five: the Song Check, the Storyboard, the Leads' Model Sheets (skipped when the MV has no Leads), the first Chapter and the Rough Cut, plus a Style Sample first when the MV needs a new Style Profile.
_Avoid_: checkpoint, review step, milestone

**Brief**:
What the person settles before the Song is analysed, beyond their one sentence: the Mode, the format, Karaoke on or off, the Style Profile (always asked; a look no profile has means making a new one), and any references.
_Avoid_: spec, requirements, settings

**Mode**:
What kind of MV it is, which decides what counts as an event: narrative (Characters with a want), performance (someone performing the song), mood (a world that transforms, maybe with no Characters) or lyric (the sung words painted into the picture).
_Avoid_: genre, type, template

**Storyboard**:
The written plan of the whole MV, before any picture: its idea, Characters, Chapters, and every Shot with what happens, what the viewer must take in and when, and how each Seam is crossed.
_Avoid_: script, shot list, outline

**Chapter brief**:
What a Chapter subagent is given: the common brief (docs/chapter-brief.md) and its own `mv/briefs/cNN.md`, with its Shots, the exact contract for each Seam it shares and its Guests. Not the Brief, which is the person's.
_Avoid_: task, prompt, spec

**Log**:
`mv/LOG.md`: the MV's memory, kept as it happens: which steps have passed, every decision the person made (and turned down), and the Harvest candidates, so any session can pick the MV up.
_Avoid_: notes, journal, status

**Harvest**:
The last step: bringing what one MV taught (engine fixes, helpers, rules learned the hard way) back into the Template, item by item, as the person chooses.
_Avoid_: backport, merge, upstream

**Rough Cut**:
The whole MV rendered small and choppy (half size, half frame rate) with the Song, to judge rhythm and sync before the final render.
_Avoid_: preview, draft render, animatic

**Template**:
The reusable starting point that every MV is copied from: the engine, the guide and the example.
_Avoid_: framework, kit, base

### The song

**Song**:
The audio an MV is cut to, together with its tempo, first downbeat and Lyric Lines.
_Avoid_: track, music

**Lyric Line**:
One sung line of the Song, with the time it starts and ends.
_Avoid_: subtitle, caption

**Lyric Sheet**:
The lyrics as the person wrote them, marked into Sections. It is the only source of what is sung; listening only supplies the times.
_Avoid_: transcript

**Lyric Reading**:
What each Lyric Line means and which pictures it could become, including references and in-jokes looked up before storyboarding; open doubts go to the Storyboard Gate.
_Avoid_: interpretation, annotation

**Section**:
A named part of the Song (intro, verse, chorus, bridge, interlude, outro). Sung Sections come from the Lyric Sheet's marks; unsung ones are the gaps between them.
_Avoid_: part, segment

**Beat Grid**:
The Song's actual beats and bar starts as a list of times, so the picture follows a played tempo, not an assumed one. A constant tempo is just an even grid.
_Avoid_: bpm, tempo map, click

**Song Check**:
A rough render of the Song's analysis (Karaoke, beat flashes, Section names) with the audio, watched by the person to confirm the timings before any storyboarding.
_Avoid_: preview, sync test

**Karaoke**:
The optional on-screen display of the current Lyric Line, outside the painted picture; an MV switches it on or off.
_Avoid_: subtitles, lyrics overlay

### The picture

**Chapter**:
One setting of the MV, spanning one or more whole Sections; its edges always fall on Section edges. By default one Section is one Chapter.
_Avoid_: scene, act, part

**Shot**:
One continuous piece of picture inside a Chapter, from one cut to the next, in which something happens. Every Lyric Line gets at least one Shot, unsung stretches get Shots too, and a very short line may share a Shot with the next.
_Avoid_: scene, clip, cut

**Character**:
Someone who acts on screen, designed for one MV and drawn to the Character Contract.
_Avoid_: mascot, sprite, avatar

**Seam**:
The join between two Shots, or the very start or end of the MV. Every Seam has a transition chosen for it in the Storyboard, Chapter edges included; nothing is added automatically.
_Avoid_: cut, edit point, chapter break

**Sound Word**:
A painted sound effect (FOOM, CHOMP) or a single word the moment needs; the only lettering allowed inside the picture, used a handful of times per MV and listed in the Storyboard. In lyric Mode the sung words may be painted in too.
_Avoid_: caption, label, sign, title

**Lead**:
A Character who carries the story across Chapters. Leads are designed before any Chapter is built and approved on a Model Sheet. An MV may have none.
_Avoid_: main character, hero, protagonist

**Guest**:
A Character who first appears inside one Chapter and is designed by that Chapter; it may return later.
_Avoid_: extra, cameo, monster

**Model Sheet**:
A render of one Character's key views, every emotion and a turn, used to approve the Character before it acts.
_Avoid_: character sheet, turnaround

**Character Contract**:
What a Character must provide so the Acting Tools can drive it: its key views, its emotion table and a way to draw it in a pose.
_Avoid_: character interface, base class

**Acting Tools**:
The look-independent ways a Character performs: emotion changes, turns through key views, jumps, walks and settles.
_Avoid_: animation helpers, moves

**Style Profile**:
One complete look: its drawing primitives and palette, and how it tones every colour, shades with the light, draws lines, moves Characters and letters the karaoke, with its rules of what the look forbids.
_Avoid_: theme, skin, renderer
