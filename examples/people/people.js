// people.js: three example people for person() (engine/body.js), as Design Options for one Lead: a chibi in a hoodie,
// a cartoon in an open jacket, a stylised figure in a dress. List it in mv.json ("characters":
// ["examples/people/people.js"]) and render the sheet that compares them:
//   node engine/render.mjs --loop=example-options --sheet=1.2 --cols=1 --w=1920 --out=out/check/example_options.jpg
// Each one is also a Character of its own (example-A, example-B, example-C), with a Model Sheet (example-A-sheet) and a
// check sheet (example-A-check). Copy a design into mv/characters/ to start a Lead from it.
const [exampleA, exampleB, exampleC] = personOptions('example', [
  { heads: 3, shape: 'round', skin: '#F2C9A6', hair: { style: 'curly', color: '#5A3422' }, eyes: { color: '#5A3A22', size: 1.1 },
    top: { kind: 'hoodie', color: '#6FA65A' }, bottom: { kind: 'pants', color: '#3A4470' }, shoes: { color: '#C2493E' } },
  { heads: 4.5, shape: 'square', skin: '#E2AE88', hair: { style: 'short', color: '#2B2233' }, nose: 'button',
    top: { kind: 'jacket', color: '#C24E3A', open: true, under: '#F4EEE2' }, bottom: { kind: 'pants', color: '#2E3448' } },
  { heads: 6, shape: 'tri', skin: '#F0CBA8', hair: { style: 'long', color: '#1E1A26', length: .6 }, eyes: { color: '#2F3A4A', lashes: .8 }, nose: 'line',
    top: { kind: 'dress', color: '#3A9C98' }, shoes: { color: '#2A2230' } },
]);
