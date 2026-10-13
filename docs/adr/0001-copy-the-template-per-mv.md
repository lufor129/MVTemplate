# Copy the Template once per MV, instead of sharing one engine

Each MV is a full copy of the Template (engine, Style Profiles, guide and its own work), not a folder inside one shared framework or a package it depends on. A finished MV must keep rendering exactly as it was approved, and Claude works best when everything it may read and change sits in one self-contained folder; the cost is that engine fixes made later have to be carried by hand into older MVs that want them.

## Considered Options

- One framework holding many MVs (`mvs/<name>/`): engine fixes reach every MV at once, but any engine change can silently alter an MV that was already approved.
- The Template as a dependency of each MV: the same drift problem, plus a version to pin and a boundary Claude has to respect.
