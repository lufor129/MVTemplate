// songcheck.js: the Song Check, a plain render of song.json to watch with the song (and a click on every beat) before
// any storyboarding: does each Lyric Line light up as it is sung, does the flash land on the beat, are the Sections
// where the song changes? Render it with: node engine/render.mjs --songcheck
// It draws with the 2D canvas, not paint: it's a measuring tool, not part of the MV.
function songCheck(t) {
  window.OVER_TEXT = c => {
    const bp = bpOf(t), bn = Math.floor(bp), k = Math.exp(-frac(bp) * 7), br = barOf(t);
    const onBar = Math.abs(t - nearestBar(t)) < BEAT * .5 && frac(bp) < .5;
    const S = sectionAt(t), L = lineAt(t);
    c.save();
    // the Section
    const kindCol = { intro: '#8EC3E6', verse: '#E8AA38', 'pre-chorus': '#E27A92', chorus: '#D97757', bridge: '#7B5CA8', interlude: '#3A9C98', outro: '#2F3C7A', hook: '#D97757' };
    if (S) { c.globalAlpha = .15; c.fillStyle = kindCol[S.section.kind] || '#6E9F58'; c.fillRect(0, 0, W, KARAOKE_TOP); c.globalAlpha = 1; }
    c.fillStyle = '#2B2233'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `700 ${W * .045}px system-ui, sans-serif`; c.fillText(S ? S.section.name : '—', W / 2, H * .1);
    c.font = `400 ${W * .018}px system-ui, sans-serif`; c.globalAlpha = .7;
    c.fillText(S ? `${S.section.kind} · ${S.section.start.toFixed(2)}–${S.section.end.toFixed(2)} s` : '', W / 2, H * .1 + W * .04);
    c.globalAlpha = 1;
    // the beat: a disc that flashes on every beat, bigger and warmer on bar starts
    const r = W * .06 * (1 + (onBar ? .7 : .35) * k), cx = W * .5, cy = H * .36;
    c.fillStyle = onBar ? `rgba(217,119,87,${.35 + .65 * k})` : `rgba(47,60,122,${.25 + .6 * k})`;
    c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
    c.fillStyle = '#FFF5E2'; c.font = `700 ${W * .03}px system-ui, sans-serif`;
    c.fillText(`${Math.floor(br) + 1}.${((bn % 4) + 4) % 4 + 1}`, cx, cy);
    c.fillStyle = '#2B2233'; c.font = `400 ${W * .016}px system-ui, sans-serif`;
    c.fillText(`bar.beat   ·   ${t.toFixed(2)} s   ·   ${SONG.bpm} bpm`, cx, cy + W * .095);
    // a strip from t-3 to t+6 s: beats, bars, lines (red = low confidence, check it), the playhead
    const x0 = W * .05, x1 = W * .95, y = H * .62, sx = s => x0 + (s - (t - 3)) / 9 * (x1 - x0);
    c.strokeStyle = '#2B2233';
    for (let n = Math.floor(bpOf(t - 3)); n <= bpOf(t + 6) + 1; n++) {
      const bt = beatAt(n), x = sx(bt); if (x < x0 || x > x1) continue;
      const isBar = BARS.some(d => Math.abs(d - bt) < .03);
      c.lineWidth = isBar ? 3 : 1.2; c.beginPath(); c.moveTo(x, y - (isBar ? 46 : 22)); c.lineTo(x, y); c.stroke();
    }
    for (const l of LINES) {
      if (l.end < t - 3 || l.start > t + 6) continue;
      const a = Math.max(x0, sx(l.start)), b = Math.min(x1, sx(l.end));
      c.fillStyle = l.confidence < .5 ? 'rgba(216,57,78,.75)' : 'rgba(58,156,152,.6)'; c.fillRect(a, y + 14, b - a, 30);
    }
    for (const s of SECTIONS) { const x = sx(s.start); if (x >= x0 && x <= x1) { c.fillStyle = '#7B5CA8'; c.fillRect(x - 2, y - 70, 4, 130); } }
    c.fillStyle = '#D8394E'; c.fillRect(sx(t) - 2, y - 80, 4, 140);
    // the current line's confidence
    if (L && L.line.confidence < .5) { c.fillStyle = '#D8394E'; c.font = `700 ${W * .02}px system-ui, sans-serif`; c.fillText(`⚠ line ${L.i + 1}: low confidence, is it on time?`, W / 2, y + 90); }
    c.restore();
  };
}
