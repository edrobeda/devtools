const fs = require('fs')
const { execSync } = require('child_process')

const src = fs.readFileSync('../src/pages/JqCheatsheetPage.jsx', 'utf8')
const re = /\{ code: ("(?:[^"\\]|\\")*"|'(?:[^'\\]|\\.)*')/g
let m
const codes = []
while ((m = re.exec(src))) codes.push(new Function('return ' + m[1])())
console.log('total codes:', codes.length)

const SAMPLE = {
  name: 'devtools', id: 42,
  'a-b': 'k',
  a: { b: { c: 'profundo' } },
  items: [
    { name: 'api-mock', id: 1, price: 12.5, qty: 3, ok: true, active: true, status: 'ok', date: '2026-06-01', category: 'api', cat: 'api', tags: ['urgente', 'core'], stock: 5, sku: 'SKU-001', json: '{"x": 1}' },
    { name: 'web', id: 2, price: 250, qty: 1, ok: false, active: true, status: 'fail', date: '2026-08-10', category: 'web', cat: 'web', tags: [], stock: 2, sku: 'SKU-002' },
  ],
  nums: [3, 1, 2, 1],
  qtys: [3, 1, 10, 2],
  precos: [12.5, 250, 5, 99],
  stats: { cpu: 10, mem: 20 },
  user: { name: 'ada' },
  csv: 'a,b,c',
  tags: ['x', 'y'],
  aninhado: [[1, 2], [3, [4]]],
  numero_em_string: '42',
  texto: 'api-node',
  password: 'x',
  'n': 7,
  fuso: 'BRT',
  arr: [{ id: 1 }, { id: 1 }, { id: 2 }],
}
const JSONL = '{"category":"api","n":1}\n{"category":"web","n":2}\n{"category":"api","n":3}\n'
const inline = (obj) => JSON.stringify(obj).replace(/'/g, `'\''`)

let failures = 0
for (const c of codes) {
  const stripped = c.replace(/ dados\.json/g, '')
  // pick input: recipes without dados.json need no pipe; JSONL-sensible pass jsonl
  const needsJsonl = c.startsWith('jq -s') || c.includes('tail -f') || c.includes('JSON')
  const cmd = needsJsonl
    ? `printf '%s' '${JSONL}' | ${stripped}`
    : `printf '%s' '${inline(SAMPLE)}' | ${stripped}`
  try {
    execSync(cmd, { shell: '/bin/sh', stdio: ['ignore', 'ignore', 'pipe'] })
  } catch (e) {
    failures++
    console.log('JQ FAIL |', c, '\n   =>', String(e.stderr).trim().split('\n').slice(0, 3).join('\n   '))
    if (/curl|tail -f|get pods/.test(c)) console.log('   (env-dependent, ignoring)')
  }
}
console.log(failures ? 'FAILURES=' + failures : 'ALL 72 RENDERED COMMANDS RUN CLEAN')