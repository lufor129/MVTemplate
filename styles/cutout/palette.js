// palette.js: the cut-out palette: coloured craft papers on kraft card, a little muted, as paper is. An MV adds or replaces
// colours with "palette" in mv/mv.json. No pure black or white: PAL.ink for black, PAL.cream for white.
const PAL = Object.assign({
  paper: '#DCC6A0', ink: '#2A2230', clay: '#D9734F', clayDk: '#A6492F', clayLt: '#EFA27F',
  night: '#232A55', indigo: '#34407E', rose: '#E07890', ochre: '#E9A93A', sap: '#6E9C55',
  teal: '#3A9590', violet: '#7A5CA0', cream: '#FBF3E2', sky: '#8DC1DE'
}, MV.palette || {});
