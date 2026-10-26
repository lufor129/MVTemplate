// palette.js: paper theatre: soft, muted, clean cardstock, as in a hand-made paper animation: pale powder-blue sky, sage
// and leaf greens, warm light stone grey, soft lavender-grey for far things, terracotta, and small accents of red and
// mustard yellow. An MV adds or replaces colours with "palette" in mv/mv.json. No pure black or white: PAL.ink is a
// dark warm grey (the printed detail: eyes, mouths, lettering), PAL.cream and PAL.paper are card.
const PAL = Object.assign({
  paper: '#EEE9DA', ink: '#4A4442', clay: '#E07A56', clayDk: '#C05A3B', clayLt: '#F3A787',
  night: '#3E4868', indigo: '#6E7CB0', rose: '#DE5B52', ochre: '#EFC757', sap: '#88BE58',
  teal: '#5FA597', violet: '#A8A3C0', cream: '#F5EFE4', sky: '#A3CEEA',
  brick: '#C63E32', gold: '#E8BE48', stone: '#C9C2B7', lavender: '#B2B4D2'
}, MV.palette || {});
