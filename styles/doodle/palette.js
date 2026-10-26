// palette.js: a pencil case on a lined notebook page. Three or four felt-tip markers (light, clean, see-through: a
// dark comes from going over the same place twice), a yellow highlighter, a black fineliner (PAL.ink) and a blue-black
// ballpoint (PAL.bic). An MV adds or replaces colours with "palette" in mv/mv.json. No pure black or white: PAL.ink for
// black, PAL.cream / PAL.paper for white.
const PAL = Object.assign({
  paper: '#F2F0EC', ink: '#16131D', bic: '#26224C', clay: '#FFA066', clayDk: '#EC7440', clayLt: '#FFC59E',
  night: '#2C3C86', indigo: '#6C82E4', rose: '#FF8DBA', ochre: '#FFC83A', sap: '#9FCD90',
  teal: '#62CDBF', violet: '#B39BE6', cream: '#F8F6F2', sky: '#A2E2FF', hilite: '#FFF23E'
}, MV.palette || {});
// the notebook: blue ruling every RULE units from RULE0, a double red margin at MARGIN, punched holes down the left
const RULE = 63, RULE0 = 32, MARGIN = 142, RULE_COL = '#9EBEE6', MARGIN_COL = '#F07C84', HOLES = { x: 47, y0: 93, dy: 154.5, r: 27.5 };
