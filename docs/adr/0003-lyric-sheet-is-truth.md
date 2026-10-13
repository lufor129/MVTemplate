# The Lyric Sheet is the only source of words; speech recognition only supplies times

The person's `lyric.txt` decides what each Lyric Line says and how the Song splits into Sections. Whisper (large-v3, run on the separated vocals) is used only to find when each line is sung, by aligning the Lyric Sheet to its word timestamps. Recognition on sung, mixed-language lyrics mishears and invents words, and those errors would otherwise flow into the Karaoke, the Lyric Reading and the Storyboard; the person already knows the words, so only the timing is unknown.

## Consequences

- An unmatched or low-confidence line is a timing problem to show at the Song Check Gate, never a reason to change its words.
- The aligner must cope with Chinese, Japanese, English and mixed lines (character-level for CJK, word-level for Latin script).
