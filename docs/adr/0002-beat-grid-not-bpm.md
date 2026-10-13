# Drive rhythm from a Beat Grid, not a constant bpm

Base drives every idle, dance and beat hit from one `bpm` and an `offset`. The Template instead keeps the Song's actual beat and bar times as a Beat Grid, and every rhythm function reads the grid; a constant tempo is just an evenly spaced grid. Played and sung music drifts, speeds up, holds and changes metre, and with a single bpm the picture slides off the music within a minute, which is exactly where an MV is judged.

## Consequences

- Beat functions inherited from Base (`BEAT`, `bpOf`, `beatN`, `pulse`) change meaning from arithmetic on a tempo to lookups in the grid; Base code that assumes a fixed beat length must be rewritten, not just copied.
- The Song's analysis has to produce downbeats (bar starts), not only beats.
