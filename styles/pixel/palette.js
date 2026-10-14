// palette.js: the pixel palette, bright like an old game's. The pixel grid snaps every colour on screen to these, plus a
// shade and a light of each, so an MV that adds colours with "palette" in mv/mv.json adds them to the grid's palette
// too. No pure black or white: PAL.ink for black, PAL.cream for white.
const PAL = Object.assign({
  paper: '#EFE4CB', ink: '#1F1A2B', clay: '#E0703F', clayDk: '#A2452B', clayLt: '#F5A57A',
  night: '#1D2B53', indigo: '#29366F', rose: '#FF77A8', ochre: '#FFB21C', sap: '#5FA448',
  teal: '#2A9D8F', violet: '#7E57A6', cream: '#FFF6E0', sky: '#7EC8F0'
}, MV.palette || {});
