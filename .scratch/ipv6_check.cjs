const fs = require('fs')
const vm = require('vm')

const src = fs.readFileSync('/home/devtools-bot/devtools/src/pages/Ipv6ExplorerPage.jsx', 'utf8')

const start = src.indexOf('const FULL128')
const end = src.indexOf('const EXAMPLES = [')
if (start < 0 || end < 0) {
  console.error('could not locate core region')
  process.exit(1)
}
const core = src.slice(start, end)

const sandbox = {}
vm.createContext(sandbox)
vm.runInContext(core, sandbox)

const { parseIpv6, compressedForm, expandedForm, classify, groupsOf, toBigInt, v4Tail } = sandbox
const FULL128 = (1n << 128n) - 1n

let pass = 0
let fail = 0
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) { pass++ } else {
    fail++
    console.log('FAIL', label, '\n  got     ', JSON.stringify(actual), '\n  expected', JSON.stringify(expected))
  }
}

const g = (s) => parseIpv6(s).groups

// ── parse/format ──────────────────────────────
check('default /64 groups', g('2001:db8:85a3::8a2e:370:7334/64'), [
  0x2001, 0x0db8, 0x85a3, 0x0000, 0x0000, 0x8a2e, 0x0370, 0x7334,
])
check('prefix parsed', parseIpv6('2001:db8:85a3::8a2e:370:7334/64').prefix, 64)
check('::1', g('::1'), [0,0,0,0,0,0,0,1])
check('::', g('::'), [0,0,0,0,0,0,0,0])
check('uppercase', g('2001:DB8::1'), [0x2001,0x0db8,0,0,0,0,0,1])
check('full form', g('2001:0db8:0000:0000:0000:0000:0000:0001'), [0x2001,0x0db8,0,0,0,0,0,1])
check('embedded v4 mapped', g('::ffff:192.168.1.1'), [0,0,0,0,0,0xffff,0xc0a8,0x0101])
check('embedded v4 tail only', g('::ffff:1.2.3.4'), [0,0,0,0,0,0xffff,0x0102,0x0304])
check('embedded v4 full', g('0:0:0:0:0:ffff:10.0.0.1'), [0,0,0,0,0,0xffff,0x0a00,0x0001])
check('nat64 64:ff9b::7f00:1', g('64:ff9b::7f00:1'), [0x0064,0xff9b,0,0,0,0,0x7f00,0x0001])

// invalid
check('double :: invalid', parseIpv6('1::2::3'), null)
check('bad hex invalid', parseIpv6('2001:db8::gg'), null)
check('prefix too big invalid', parseIpv6('::1/129'), null)
check('prefix non-num invalid', parseIpv6('::1/xx'), null)
check('inner space invalid', parseIpv6('2001:db8::1 2'), null)
check('bare ipv4 invalid', parseIpv6('192.168.1.1'), null)
check('zone id invalid', parseIpv6('fe80::1%eth0'), null)
check('short groups invalid', parseIpv6('2001:db8'), null)
check('triple colon invalid', parseIpv6(':::'), null)

// ── compression RFC 5952 ──────────────────────
check('compressed default', compressedForm(g('2001:db8:85a3::8a2e:370:7334/64')), '2001:db8:85a3::8a2e:370:7334')
check('compressed ::1', compressedForm(g('::1')), '::1')
check('compressed ::', compressedForm(g('::')), '::')
check('compressed leading', compressedForm(g('::1:2:3:4:5:6:7')), '0:1:2:3:4:5:6:7')
check('compressed trailing', compressedForm(g('1:2:3:4:5:6:7::')), '1:2:3:4:5:6:7:0')
check('compressed mapped', compressedForm(g('::ffff:192.168.1.1')), '::ffff:c0a8:101')
check('compressed middle', compressedForm(g('1:2::8:9')), '1:2::8:9')
check('first run wins', compressedForm(g('1:0:0:2:0:0:0:3')), '1:0:0:2::3')
check('no run', compressedForm(g('1:2:3:4:5:6:7:8')), '1:2:3:4:5:6:7:8')
check('expanded default', expandedForm(g('2001:db8:85a3::8a2e:370:7334')), '2001:0db8:85a3:0000:0000:8a2e:0370:7334')

// ── classify ──────────────────────────────────
const ck = (addr, key) => check('classify ' + addr, classify(g(addr)).key, key)
ck('::', 'unspecified')
ck('::1', 'loopback')
ck('::ffff:192.168.1.1', 'ipv4Mapped')
ck('::abcd:1', 'ipv4Compatible')
ck('64:ff9b::7f00:1', 'nat64')
ck('2001:db8::20', 'documentation')
ck('ff02::1', 'multicast')
ck('fe80::a1b2', 'linkLocal')
ck('fec0::1', 'siteLocal')
ck('fc00::153', 'ula')
ck('2002:cb00:7100::1', 'sixToFour')
ck('2001:0000::4136:e378:8000:63bf', 'teredo')
ck('2001:2::1', 'benchmark')
ck('2001:4860:4860::8888', 'globalUnicast')
ck('2a00:1450::1', 'globalUnicast')

// ── multicast scope ───────────────────────────
check('multicast scope', classify(g('ff0e::1')).scope, 0xe)
check('multicast scope link', classify(g('ff02::1')).scope, 0x2)

// ── subnet math (BigInt) ──────────────────────
const def = parseIpv6('2001:db8:85a3::8a2e:370:7334/64')
const mask = FULL128 ^ ((1n << BigInt(128 - def.prefix)) - 1n)
const net = toBigInt(def.groups) & mask
check('network /64', compressedForm(groupsOf(net)), '2001:db8:85a3::')
check('last /64', compressedForm(groupsOf(net | (FULL128 ^ mask))), '2001:db8:85a3:0:ffff:ffff:ffff:ffff')

const d48 = parseIpv6('fe80::a1b2:3c4d:5e6f:1a9c/48')
const m48 = FULL128 ^ ((1n << BigInt(128 - d48.prefix)) - 1n)
const n48 = toBigInt(d48.groups) & m48
check('network /48 fe80', compressedForm(groupsOf(n48)), 'fe80::')
check('last /48 fe80', compressedForm(groupsOf(n48 | (FULL128 ^ m48))), 'fe80::ffff:ffff:ffff:ffff:ffff')

// full-width /32
const d32 = parseIpv6('2001:db8:aaaa:bbbb:cccc:dddd:eeee:ffff/32')
const m32 = FULL128 ^ ((1n << BigInt(128 - d32.prefix)) - 1n)
check('network /32', compressedForm(groupsOf(toBigInt(d32.groups) & m32)), '2001:db8::')

check('v4 tail mapped', v4Tail(g('::ffff:192.168.1.1')), '192.168.1.1')
check('v4 tail nat64', v4Tail(g('64:ff9b::7f00:1')), '127.0.0.1')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
