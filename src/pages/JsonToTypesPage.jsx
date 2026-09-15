import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Button, Alert, Tag, Switch, Tabs } from 'antd'
import { CodeOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLES = [
  {
    key: 'usuario',
    label: { pt: 'Usuário', en: 'User' },
    value: JSON.stringify(
      {
        id: 42,
        name: 'Alice',
        email: 'alice@example.com',
        active: true,
        tags: ['admin', 'beta'],
        meta: { created: '2024-01-01', visits: 3 },
      },
      null,
      2
    ),
  },
  {
    key: 'produtos',
    label: { pt: 'Lista de produtos', en: 'Products list' },
    value: JSON.stringify(
      [
        { sku: 'A-1', name: 'Teclado', price: 129.9, stock: 12 },
        { sku: 'B-2', name: 'Mouse', price: 49.9, stock: 0 },
      ],
      null,
      2
    ),
  },
  {
    key: 'aninhado',
    label: { pt: 'Payload aninhado', en: 'Nested payload' },
    value: JSON.stringify(
      {
        id: 'evt_01',
        type: 'payment',
        payload: {
          amount: 1000,
          currency: 'BRL',
          items: [{ id: 'i1', qty: 2 }],
        },
        received_at: '2026-01-01T10:00:00Z',
      },
      null,
      2
    ),
  },
]

function camelize(key) {
  return key
    .replace(/[\s_-]+([a-zA-Z0-9])/g, (_, c) => c.toUpperCase())
    .replace(/^[0-9_]+/, '')
}

function pascalCase(str) {
  const camel = camelize(str)
  return camel ? camel.charAt(0).toUpperCase() + camel.slice(1) : 'Root'
}

function singular(base) {
  const lower = base.toLowerCase()
  if (base.length > 3 && lower.endsWith('ies')) return base.slice(0, -3) + 'y'
  if (base.length > 2 && lower.endsWith('es')) return base.slice(0, -2)
  if (base.length > 2 && lower.endsWith('s')) return base.slice(0, -1)
  return base
}

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/
// Palavras reservadas do ECMAScript — em interfaces TS qualquer palavra
// reservada é permitida como nome de propriedade, então só entra aqui o que
// de fato quebraria a sintaxe se usado sem aspas (quase nada).
const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for',
  'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
  'while', 'with', 'yield', 'let', 'static', 'implements', 'package', 'private',
  'protected', 'public',
])

function isIdent(k) {
  return IDENT_RE.test(k) && !RESERVED.has(k)
}

function shapeSig(node) {
  if (node === null) return 'null'
  if (typeof node === 'boolean') return 'bool'
  if (typeof node === 'number') return 'num'
  if (typeof node === 'string') return 'str'
  if (Array.isArray(node)) {
    if (node.length === 0) return '[]'
    const sigs = node.map(shapeSig)
    return '[' + Array.from(new Set(sigs)).sort().join(',') + ']'
  }
  const keys = Object.keys(node).sort()
  return '{' + keys.map((k) => k + ':' + shapeSig(node[k])).join(',') + '}'
}



// ─── TypeScript ──────────────────────────────────────────────────────────
function genTypeScript(value, rootName, camelKeys) {
  const defs = []
  const used = new Set()
  const memo = new Map()
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value)
  const root = pascalCase(rootName || 'Root')
  if (!isObj) used.add(root)

  function uniqueName(base) {
    let n = base, i = 2
    while (used.has(n)) { n = base + i; i++ }
    used.add(n)
    return n
  }

  function elName(firstEl, base) {
    const p = pascalCase(base) || 'Root'
    const s = singular(p)
    return s && s !== p ? s : p + 'Item'
  }

  function typeOf(node, name) {
    if (node === null) return 'null'
    if (typeof node === 'boolean') return 'boolean'
    if (typeof node === 'string') return 'string'
    if (typeof node === 'number') return 'number'
    if (Array.isArray(node)) {
      if (node.length === 0) return 'unknown[]'
      const ts = []
      for (const el of node) {
        const t = typeOf(el, elName(el, name))
        if (!ts.includes(t)) ts.push(t)
      }
      return ts.length === 1 ? ts[0] + '[]' : '(' + ts.join(' | ') + ')[]'
    }
    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const n = uniqueName(pascalCase(name) || 'Root')
      memo.set(sig, n)
      const lines = Object.keys(node).map((k) => {
        const key = camelKeys ? camelize(k) : k
        const label = isIdent(key) ? key : JSON.stringify(key)
        return '  ' + label + ': ' + typeOf(node[k], pascalCase(k))
      })
      defs.push({ name: n, body: lines.join('\n') })
      return n
    }
    return 'any'
  }

  typeOf(value, root)

  const rootDef = isObj ? defs.find((d) => d.name === root) : null
  const others = defs.filter((d) => d.name !== root)
  let out = others.map((d) => `export interface ${d.name} {\n${d.body}\n}`).join('\n\n')
  if (isObj) {
    out = (out ? out + '\n\n' : '') + `export interface ${rootDef.name} {\n${rootDef.body}\n}`
  } else {
    out = (out ? out + '\n\n' : '') + `export type ${root} = ${typeOf(value, root)}`
  }
  return out + '\n'
}

// ─── Python ──────────────────────────────────────────────────────────────
function genPython(value, rootName, camelKeys) {
  const defs = []
  const used = new Set()
  const memo = new Map()
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value)
  const root = pascalCase(rootName || 'Root')
  if (!isObj) used.add(root)

  function uniqueName(base) {
    let n = base, i = 2
    while (used.has(n)) { n = base + i; i++ }
    used.add(n)
    return n
  }

  function elName(firstEl, base) {
    const p = pascalCase(base) || 'Root'
    const s = singular(p)
    return s && s !== p ? s : p + 'Item'
  }

  function pyType(node, name) {
    if (node === null) return 'None'
    if (typeof node === 'boolean') return 'bool'
    if (typeof node === 'number') return Number.isInteger(node) ? 'int' : 'float'
    if (typeof node === 'string') return 'str'
    if (Array.isArray(node)) {
      if (node.length === 0) return 'list[Any]'
      const inner = pyType(node[0], elName(node[0], name))
      return `list[${inner}]`
    }
    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const n = uniqueName(pascalCase(name) || 'Root')
      memo.set(sig, n)
      const lines = Object.keys(node).map((k) => {
        const key = camelKeys ? camelize(k) : k
        return '    ' + key + ': ' + pyType(node[k], pascalCase(k))
      })
      defs.push({ name: n, fields: lines.join('\n') })
      return n
    }
    return 'Any'
  }

  pyType(value, root)

  const imports = defs.length > 0 ? 'from dataclasses import dataclass\nfrom typing import Any\n\n' : 'from typing import Any\n\n'

  if (isObj) {
    const rootDef = defs.find((d) => d.name === root)
    const others = defs.filter((d) => d.name !== root)
    return imports +
      (others.length > 0 ? others.map((d) => `@dataclass\nclass ${d.name}:\n${d.fields}`).join('\n\n') + '\n\n' : '') +
      `@dataclass\nclass ${root}:\n${rootDef.fields}\n`
  }
  return imports + `# Root type: ${pyType(value, root)}\n` +
    (defs.length > 0 ? defs.map((d) => `@dataclass\nclass ${d.name}:\n${d.fields}`).join('\n\n') + '\n' : '')
}

// ─── Go ──────────────────────────────────────────────────────────────────
function genGo(value, rootName, camelKeys) {
  const defs = []
  const used = new Set()
  const memo = new Map()
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value)
  const root = pascalCase(rootName || 'Root')
  if (!isObj) used.add(root)

  function uniqueName(base) {
    let n = base, i = 2
    while (used.has(n)) { n = base + i; i++ }
    used.add(n)
    return n
  }

  function elName(firstEl, base) {
    const p = pascalCase(base) || 'Root'
    const s = singular(p)
    return s && s !== p ? s : p + 'Item'
  }

  function goType(node, name) {
    if (node === null) return 'interface{}'
    if (typeof node === 'boolean') return 'bool'
    if (typeof node === 'number') return Number.isInteger(node) ? 'int' : 'float64'
    if (typeof node === 'string') return 'string'
    if (Array.isArray(node)) {
      if (node.length === 0) return '[]interface{}'
      return '[]' + goType(node[0], elName(node[0], name))
    }
    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const n = uniqueName(pascalCase(name) || 'Root')
      memo.set(sig, n)
      const lines = Object.keys(node).map((k) => {
        const key = pascalCase(k)
        const jsonTag = camelKeys ? camelize(k) : k
        return '    ' + key + ' ' + goType(node[k], pascalCase(k)) + ' `json:"' + jsonTag + '"`'
      })
      defs.push({ name: n, fields: lines.join('\n') })
      return n
    }
    return 'interface{}'
  }

  goType(value, root)

  const bodies = defs.map((d) => `type ${d.name} struct {\n${d.fields}\n}`).join('\n\n')

  if (isObj) {
    const rootDef = defs.find((d) => d.name === root)
    const others = defs.filter((d) => d.name !== root)
    return (others.length > 0 ? others.map((d) => `type ${d.name} struct {\n${d.fields}\n}`).join('\n\n') + '\n\n' : '') + `type ${root} struct {\n${rootDef.fields}\n}\n`
  }
  return `// Root type: ${goType(value, root)}\n` + (bodies ? bodies + '\n' : '')
}

// ─── Rust ────────────────────────────────────────────────────────────────
function genRust(value, rootName, camelKeys) {
  const defs = []
  const used = new Set()
  const memo = new Map()
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value)
  const root = pascalCase(rootName || 'Root')
  if (!isObj) used.add(root)

  function uniqueName(base) {
    let n = base, i = 2
    while (used.has(n)) { n = base + i; i++ }
    used.add(n)
    return n
  }

  function elName(firstEl, base) {
    const p = pascalCase(base) || 'Root'
    const s = singular(p)
    return s && s !== p ? s : p + 'Item'
  }

  function rustType(node, name) {
    if (node === null) return 'Option<serde_json::Value>'
    if (typeof node === 'boolean') return 'bool'
    if (typeof node === 'number') return Number.isInteger(node) ? 'i64' : 'f64'
    if (typeof node === 'string') return 'String'
    if (Array.isArray(node)) {
      if (node.length === 0) return 'Vec<serde_json::Value>'
      return 'Vec<' + rustType(node[0], elName(node[0], name)) + '>'
    }
    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const n = uniqueName(pascalCase(name) || 'Root')
      memo.set(sig, n)
      const lines = Object.keys(node).map((k) => {
        const key = camelKeys ? camelize(k) : k
        return '    #[serde(rename = "' + k + '")]\n    pub ' + key + ': ' + rustType(node[k], pascalCase(k)) + ','
      })
      defs.push({ name: n, fields: lines.join('\n') })
      return n
    }
    return 'serde_json::Value'
  }

  rustType(value, root)

  const bodies = defs.map((d) => `#[derive(Debug, Deserialize, Serialize)]\npub struct ${d.name} {\n${d.fields}\n}`).join('\n\n')

  if (isObj) {
    const rootDef = defs.find((d) => d.name === root)
    const others = defs.filter((d) => d.name !== root)
    return 'use serde::{Deserialize, Serialize};\n\n' +
      (others.length > 0 ? others.map((d) => `#[derive(Debug, Deserialize, Serialize)]\npub struct ${d.name} {\n${d.fields}\n}`).join('\n\n') + '\n\n' : '') +
      `#[derive(Debug, Deserialize, Serialize)]\npub struct ${root} {\n${rootDef.fields}\n}\n`
  }
  return 'use serde::{Deserialize, Serialize};\n\n' + (bodies ? bodies + '\n' : `// Root type: ${rustType(value, root)}\n`)
}

// ─── Kotlin ──────────────────────────────────────────────────────────────
function genKotlin(value, rootName, camelKeys) {
  const defs = []
  const used = new Set()
  const memo = new Map()
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value)
  const root = pascalCase(rootName || 'Root')
  if (!isObj) used.add(root)

  function uniqueName(base) {
    let n = base, i = 2
    while (used.has(n)) { n = base + i; i++ }
    used.add(n)
    return n
  }

  function elName(firstEl, base) {
    const p = pascalCase(base) || 'Root'
    const s = singular(p)
    return s && s !== p ? s : p + 'Item'
  }

  function ktType(node, name) {
    if (node === null) return 'Any?'
    if (typeof node === 'boolean') return 'Boolean'
    if (typeof node === 'number') return Number.isInteger(node) ? 'Int' : 'Double'
    if (typeof node === 'string') return 'String'
    if (Array.isArray(node)) {
      if (node.length === 0) return 'List<Any?>'
      return 'List<' + ktType(node[0], elName(node[0], name)) + '>'
    }
    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const n = uniqueName(pascalCase(name) || 'Root')
      memo.set(sig, n)
      const lines = Object.keys(node).map((k) => {
        const key = camelKeys ? camelize(k) : k
        return '    val ' + key + ': ' + ktType(node[k], pascalCase(k))
      })
      defs.push({ name: n, fields: lines.join(',\n') })
      return n
    }
    return 'Any?'
  }

  ktType(value, root)

  const bodies = defs.map((d) => `data class ${d.name}(\n${d.fields}\n)`).join('\n\n')

  if (isObj) {
    const rootDef = defs.find((d) => d.name === root)
    const others = defs.filter((d) => d.name !== root)
    return (others.length > 0 ? others.map((d) => `data class ${d.name}(\n${d.fields}\n)`).join('\n\n') + '\n\n' : '') + `data class ${root}(\n${rootDef.fields}\n)\n`
  }
  return `// Root type: ${ktType(value, root)}\n` + (bodies ? bodies + '\n' : '')
}

// ─── C# ──────────────────────────────────────────────────────────────────
function genCSharp(value, rootName, camelKeys) {
  const defs = []
  const used = new Set()
  const memo = new Map()
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value)
  const root = pascalCase(rootName || 'Root')
  if (!isObj) used.add(root)

  function uniqueName(base) {
    let n = base, i = 2
    while (used.has(n)) { n = base + i; i++ }
    used.add(n)
    return n
  }

  function elName(firstEl, base) {
    const p = pascalCase(base) || 'Root'
    const s = singular(p)
    return s && s !== p ? s : p + 'Item'
  }

  function csType(node, name) {
    if (node === null) return 'object'
    if (typeof node === 'boolean') return 'bool'
    if (typeof node === 'number') return Number.isInteger(node) ? 'int' : 'double'
    if (typeof node === 'string') return 'string'
    if (Array.isArray(node)) {
      if (node.length === 0) return 'List<object>'
      return 'List<' + csType(node[0], elName(node[0], name)) + '>'
    }
    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const n = uniqueName(pascalCase(name) || 'Root')
      memo.set(sig, n)
      const lines = Object.keys(node).map((k) => {
        const key = pascalCase(k)
        return '    public ' + csType(node[k], pascalCase(k)) + ' ' + key + ' { get; set; }'
      })
      defs.push({ name: n, fields: lines.join('\n') })
      return n
    }
    return 'object'
  }

  csType(value, root)

  const bodies = defs.map((d) => `public class ${d.name}\n{\n${d.fields}\n}`).join('\n\n')

  if (isObj) {
    const rootDef = defs.find((d) => d.name === root)
    const others = defs.filter((d) => d.name !== root)
    return 'using System.Collections.Generic;\n\n' +
      (others.length > 0 ? others.map((d) => `public class ${d.name}\n{\n${d.fields}\n}`).join('\n\n') + '\n\n' : '') +
      `public class ${root}\n{\n${rootDef.fields}\n}\n`
  }
  return 'using System.Collections.Generic;\n\n' + (bodies ? bodies + '\n' : `// Root type: ${csType(value, root)}\n`)
}

// ─── Java ────────────────────────────────────────────────────────────────
function genJava(value, rootName, camelKeys) {
  const defs = []
  const used = new Set()
  const memo = new Map()
  const isObj = value !== null && typeof value === 'object' && !Array.isArray(value)
  const root = pascalCase(rootName || 'Root')
  if (!isObj) used.add(root)

  function uniqueName(base) {
    let n = base, i = 2
    while (used.has(n)) { n = base + i; i++ }
    used.add(n)
    return n
  }

  function elName(firstEl, base) {
    const p = pascalCase(base) || 'Root'
    const s = singular(p)
    return s && s !== p ? s : p + 'Item'
  }

  function javaType(node, name) {
    if (node === null) return 'Object'
    if (typeof node === 'boolean') return 'boolean'
    if (typeof node === 'number') return Number.isInteger(node) ? 'int' : 'double'
    if (typeof node === 'string') return 'String'
    if (Array.isArray(node)) {
      if (node.length === 0) return 'List<Object>'
      return 'List<' + javaType(node[0], elName(node[0], name)) + '>'
    }
    if (typeof node === 'object') {
      const sig = shapeSig(node)
      if (memo.has(sig)) return memo.get(sig)
      const n = uniqueName(pascalCase(name) || 'Root')
      memo.set(sig, n)
      const lines = Object.keys(node).map((k) => {
        const key = camelKeys ? camelize(k) : k
        return '    private ' + javaType(node[k], pascalCase(k)) + ' ' + key + ';'
      })
      defs.push({ name: n, fields: lines.join('\n') })
      return n
    }
    return 'Object'
  }

  javaType(value, root)

  const bodies = defs.map((d) => `public class ${d.name} {\n${d.fields}\n}`).join('\n\n')

  if (isObj) {
    const rootDef = defs.find((d) => d.name === root)
    const others = defs.filter((d) => d.name !== root)
    return 'import java.util.List;\n\n' +
      (others.length > 0 ? others.map((d) => `public class ${d.name} {\n${d.fields}\n}`).join('\n\n') + '\n\n' : '') +
      `public class ${root} {\n${rootDef.fields}\n}\n`
  }
  return 'import java.util.List;\n\n' + (bodies ? bodies + '\n' : `// Root type: ${javaType(value, root)}\n`)
}

const TRANSLATIONS = {
  pt: {
    title: 'JSON → Tipos Multi-Lingua',
    intro: (
      <>
        Cola um JSON de exemplo e gera definições de tipo em{' '}
        <Text code>TypeScript</Text>, <Text code>Python</Text>, <Text code>Go</Text>,{' '}
        <Text code>Rust</Text>, <Text code>Kotlin</Text>, <Text code>C#</Text> e{' '}
        <Text code>Java</Text>. Cada aba mostra o código gerado para a linguagem
        escolhida. Pronto pra colar no projeto. 100% local, nada sai do navegador.
      </>
    ),
    input: 'JSON de exemplo',
    sampleLabel: 'Exemplos:',
    rootName: 'Nome do tipo raiz',
    rootNamePlaceholder: 'Root',
    camelKeys: 'Converter chaves para camelCase (languages que suportam)',
    camelKeysHint: 'Aplica camelCase em chaves no TS, Kotlin e Java. Go/Rust/C# usam PascalCase.',
    resultTitle: 'Tipos gerados',
    emptyHint: 'Cole um JSON válido acima pra gerar os tipos.',
    invalidJson: 'JSON inválido — confira chaves, vírgulas e aspas.',
    copy: 'Copiar',
    copied: 'Copiado!',
    note: 'Nota',
    noteDesc: (
      <>
        Cada linguagem usa suas convenções de nomenclatura e tipos nativos.
        <Text code>null</Text> vira <Text code>any</Text> (TS),{' '}
        <Text code>None</Text> (Python), <Text code>interface{'{}'}</Text> (Go),{' '}
        <Text code>Option&lt;Value&gt;</Text> (Rust), <Text code>Any?</Text> (Kotlin),{' '}
        <Text code>object</Text> (C#), <Text code>Object</Text> (Java).
      </>
    ),
  },
  en: {
    title: 'JSON → Multi-Language Types',
    intro: (
      <>
        Paste sample JSON and generate type definitions in{' '}
        <Text code>TypeScript</Text>, <Text code>Python</Text>, <Text code>Go</Text>,{' '}
        <Text code>Rust</Text>, <Text code>Kotlin</Text>, <Text code>C#</Text>, and{' '}
        <Text code>Java</Text>. Each tab shows the code for the selected language.
        Ready to paste into your codebase. 100% local, nothing leaves the browser.
      </>
    ),
    input: 'Sample JSON',
    sampleLabel: 'Samples:',
    rootName: 'Root type name',
    rootNamePlaceholder: 'Root',
    camelKeys: 'Convert keys to camelCase (where supported)',
    camelKeysHint: 'Applies camelCase to keys in TS, Kotlin and Java. Go/Rust/C# use PascalCase.',
    resultTitle: 'Generated Types',
    emptyHint: 'Paste valid JSON above to generate types.',
    invalidJson: 'Invalid JSON — check braces, commas and quotes.',
    copy: 'Copy',
    copied: 'Copied!',
    note: 'Note',
    noteDesc: (
      <>
        Each language uses its own naming conventions and native types.
        <Text code>null</Text> becomes <Text code>any</Text> (TS),{' '}
        <Text code>None</Text> (Python), <Text code>interface{'{}'}</Text> (Go),{' '}
        <Text code>Option&lt;Value&gt;</Text> (Rust), <Text code>Any?</Text> (Kotlin),{' '}
        <Text code>object</Text> (C#), <Text code>Object</Text> (Java).
      </>
    ),
  },
}

export default function JsonToTypesPage() {
  const { lang } = useLanguage()
  const t = TRANSLATIONS[lang]
  const [input, setInput] = useState(SAMPLES[0].value)
  const [rootName, setRootName] = useState('Root')
  const [camelKeys, setCamelKeys] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('typescript')

  const parsed = useMemo(() => {
    if (!input.trim()) return { ok: false, error: 'empty' }
    try {
      return { ok: true, value: JSON.parse(input) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [input])

  const outputs = useMemo(() => {
    if (!parsed.ok) return {}
    const rn = rootName.trim() || 'Root'
    return {
      typescript: genTypeScript(parsed.value, rn, camelKeys),
      python: genPython(parsed.value, rn, camelKeys),
      go: genGo(parsed.value, rn, camelKeys),
      rust: genRust(parsed.value, rn, camelKeys),
      kotlin: genKotlin(parsed.value, rn, camelKeys),
      csharp: genCSharp(parsed.value, rn, camelKeys),
      java: genJava(parsed.value, rn, camelKeys),
    }
  }, [parsed, rootName, camelKeys])

  const LANGUAGES = [
    { key: 'typescript', label: 'TypeScript' },
    { key: 'python', label: 'Python' },
    { key: 'go', label: 'Go' },
    { key: 'rust', label: 'Rust' },
    { key: 'kotlin', label: 'Kotlin' },
    { key: 'csharp', label: 'C#' },
    { key: 'java', label: 'Java' },
  ]

  async function handleCopy() {
    const text = outputs[activeTab]
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const tabItems = LANGUAGES.map((lng) => ({
    key: lng.key,
    label: lng.label,
    children: parsed.ok && outputs[lng.key] ? (
      <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 13 }}>
        <code>{outputs[lng.key]}</code>
      </pre>
    ) : (
      <Alert
        type={parsed.error === 'empty' ? 'info' : 'error'}
        showIcon
        message={parsed.error === 'empty' ? t.emptyHint : t.invalidJson}
      />
    ),
  }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.input}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.sampleLabel}</Text>
            {SAMPLES.map((s) => (
              <Tag
                key={s.key}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => setInput(s.value)}
              >
                {s.label[lang]}
              </Tag>
            ))}
          </Space>
          <TextArea
            rows={9}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.input}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Space>
      </Card>

      <Card
        title={
          <Space size={8}>
            <span>{t.resultTitle}</span>
          </Space>
        }
        extra={
          parsed.ok && outputs[activeTab] ? (
            <Button
              type="primary"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? t.copied : t.copy}
            </Button>
          ) : null
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Text type="secondary">{t.rootName}</Text>
            <Input
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder={t.rootNamePlaceholder}
              style={{ width: 160 }}
            />
            <Switch checked={camelKeys} onChange={setCamelKeys} />
            <Text>{t.camelKeys}</Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>{t.camelKeysHint}</Text>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
          />
        </Space>
      </Card>

      <Alert type="info" showIcon message={t.note} description={t.noteDesc} />
    </Space>
  )
}
