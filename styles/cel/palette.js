// palette.js: the cel palette, a little brighter than watercolour: flat cel paint reads best in clean colours. An MV adds
// or replaces colours with "palette" in mv/mv.json. No pure black or white: PAL.ink for black, PAL.cream / PAL.paper for white.
const PAL = Object.assign({
  paper: '#F6F0E3', ink: '#262033', clay: '#E07A55', clayDk: '#B04E33', clayLt: '#F6A886',
  night: '#1E2452', indigo: '#33418A', rose: '#EA7896', ochre: '#F0B03A', sap: '#6FA65A',
  teal: '#33A09A', violet: '#8060B0', cream: '#FFF7E6', sky: '#92CBEB'
}, MV.palette || {});
