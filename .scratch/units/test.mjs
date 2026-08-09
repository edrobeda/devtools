function toBase(v, u) { return v * u.factor + (u.offset || 0) }
function fromBase(b, u) { return (b - (u.offset || 0)) / u.factor }
function convert(v, from, to) { return fromBase(toBase(v, from), to) }
function format(n) {
  if (!Number.isFinite(n)) return ''
  const r = Number(n.toPrecision(12))
  if (r === Math.floor(r) && Math.abs(r) < 1e21) return String(r)
  const s = r.toPrecision(12)
  if (s.includes('e')) return s
  return s.replace(/\.?0+$/, '')
}
const C={factor:1,offset:273.15}, F={factor:5/9,offset:255.3722222222222}, K={factor:1,offset:0}
const mi={factor:1609.344}, km={factor:1e3}, m={factor:1}, ft={factor:0.3048}, inch={factor:0.0254}
const Kmh={factor:1/3.6}, mph={factor:0.44704}, kn={factor:1852/3600}
const GB={factor:1e9}, MiB={factor:1048576}, GiB={factor:1073741824}, B={factor:1}, PB={factor:1e15}
const L={factor:1}, m3={factor:1e3}, gal={factor:3.785411784}
const t={factor:1e3}, lb={factor:0.45359237}

const cases = [
  ['32F->C', convert(32,F,C), '0'],
  ['100C->K', convert(100,C,K), '373.15'],
  ['-40C->F', convert(-40,C,F), '-40'],
  ['1mi->km', convert(1,mi,km), '1.609344'],
  ['1km->mi', convert(1,km,mi), '0.621371192237'],
  ['1ft->m', convert(1,ft,m), '0.3048'],
  ['72mph->kmh', convert(72,mph,Kmh), '115.872768'],
  ['15kn->kmh', convert(15,kn,Kmh), '27.78'],
  ['1GB->MiB', convert(1,GB,MiB), '953.674316406'],
  ['500GB->GiB', convert(500,GB,GiB), '465.661287308'],
  ['1PB->GiB', convert(1,PB,GiB), '931322.574615'],
  ['1B->KB', convert(1,B,{factor:1e3}), '0.001'],
  ['1L->gal', convert(1,L,gal), '0.264172052358'],
  ['1m3->L', convert(1,m3,L), '1000'],
  ['1t->lb', convert(1,t,lb), '2204.62262185'],
  ['1in->m', convert(1,inch,m), '0.0254'],
  ['1kn->kmh exact', convert(1,kn,Kmh), '1.852'],
]
let fails = 0
const FMT = (n) => format(n)
for (const [name, num, want] of cases) {
  const got = FMT(num)
  if (got !== want) { fails++; console.log(`FAIL ${name}: got=${got} want=${want}`) }
}
console.log(fails ? `${fails} FAILURES` : 'ALL ' + cases.length + ' PASS')
