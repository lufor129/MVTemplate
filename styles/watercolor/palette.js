// palette.js: the watercolour palette. An MV adds or replaces colours with "palette" in mv/mv.json; pick a small
// palette per video and keep it soft. No pure black or white: PAL.ink for black, PAL.cream / PAL.paper for white.
const PAL = Object.assign({
  paper: '#F3EBDC', ink: '#2B2233', clay: '#D97757', clayDk: '#A84D33', clayLt: '#F2A283',
  night: '#1F2550', indigo: '#2F3C7A', rose: '#E27A92', ochre: '#E8AA38', sap: '#6E9F58',
  teal: '#3A9C98', violet: '#7B5CA8', cream: '#FFF5E2', sky: '#8EC3E6'
}, MV.palette || {});
