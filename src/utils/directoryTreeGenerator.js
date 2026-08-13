/**
 * Gera árvores de diretórios a partir de uma lista de caminhos.
 * 100% client-side — não envia nada para rede.
 */

const SEP = /[\\/]/

function normalizePath(p) {
  return p.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/$/, '')
}

function splitPath(p) {
  return normalizePath(p)
    .split('/')
    .filter(Boolean)
}

function globToRegex(pattern) {
  let re = ''
  let i = 0
  while (i < pattern.length) {
    const c = pattern[i]
    if (c === '*' && pattern[i + 1] === '*') {
      if (pattern[i + 2] === '/') {
        re += '(?:.*/)?'
        i += 3
        continue
      }
      re += '.*'
      i += 2
      continue
    }
    if (c === '*') {
      re += '[^/]*'
    } else if (c === '?') {
      re += '[^/]'
    } else if (c === '.') {
      re += '\\.'
    } else {
      re += c
    }
    i += 1
  }
  return new RegExp(`^${re}$`)
}

function compilePatterns(patternsText) {
  if (!patternsText) return []
  return patternsText
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((pattern) => {
      const isDirPattern = pattern.endsWith('/')
      const clean = isDirPattern ? pattern.slice(0, -1) : pattern
      return {
        raw: pattern,
        clean,
        isDirPattern,
        hasSlash: clean.includes('/'),
        regex: globToRegex(clean),
      }
    })
}

export function shouldIgnore(relativePath, name, type, compiledPatterns) {
  if (!compiledPatterns.length) return false
  for (const p of compiledPatterns) {
    if (p.isDirPattern) {
      if (type !== 'directory') continue
      if (p.regex.test(name)) return true
      continue
    }
    if (p.hasSlash) {
      if (p.regex.test(relativePath)) return true
      continue
    }
    if (p.regex.test(name)) return true
  }
  return false
}

function buildTree(paths, options = {}) {
  const {
    rootName = 'project',
    ignorePatterns = '',
    maxDepth = Infinity,
    dirsOnly = false,
  } = options

  const compiled = compilePatterns(ignorePatterns)
  const root = { name: rootName, type: 'directory', path: '', children: [], depth: 0 }

  for (const rawPath of paths) {
    const trimmed = rawPath.trim()
    if (!trimmed) continue
    const parts = splitPath(trimmed)
    if (!parts.length) continue

    let current = root
    const limit = Math.min(parts.length, maxDepth)

    for (let i = 0; i < limit; i++) {
      const name = parts[i]
      const relativePath = parts.slice(0, i + 1).join('/')
      const isLastPart = i === parts.length - 1
      const type = isLastPart && !trimmed.endsWith('/') ? 'file' : 'directory'

      if (shouldIgnore(relativePath, name, type, compiled)) {
        break
      }

      if (dirsOnly && type === 'file') {
        break
      }

      let child = current.children.find((c) => c.name === name)
      if (!child) {
        child = { name, type, path: relativePath, children: [], depth: i + 1 }
        current.children.push(child)
      } else if (type === 'directory' && child.type === 'file') {
        child.type = 'directory'
      }
      current = child
    }
  }

  sortTree(root)
  return root
}

function sortTree(node) {
  if (!node.children) return
  node.children.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name)
    return a.type === 'directory' ? -1 : 1
  })
  node.children.forEach(sortTree)
}

function renderAscii(node, prefix = '', isLast = true, result = []) {
  if (node.depth > 0) {
    const connector = isLast ? '└── ' : '├── '
    result.push(`${prefix}${connector}${node.name}`)
  } else {
    result.push(node.name)
  }

  if (node.children) {
    const count = node.children.length
    node.children.forEach((child, index) => {
      const childPrefix = node.depth > 0
        ? `${prefix}${isLast ? '    ' : '│   '}`
        : ''
      renderAscii(child, childPrefix, index === count - 1, result)
    })
  }
  return result
}

function renderUnicode(node, prefix = '', isLast = true, result = []) {
  if (node.depth > 0) {
    const connector = isLast ? '└── ' : '├── '
    result.push(`${prefix}${connector}${node.name}`)
  } else {
    result.push(node.name)
  }

  if (node.children) {
    const count = node.children.length
    node.children.forEach((child, index) => {
      const childPrefix = node.depth > 0
        ? `${prefix}${isLast ? '    ' : '│   '}`
        : ''
      renderUnicode(child, childPrefix, index === count - 1, result)
    })
  }
  return result
}

function renderMarkdown(node, indent = 0, result = []) {
  if (node.depth > 0) {
    result.push(`${'  '.repeat(indent - 1)}- ${node.name}`)
  } else {
    result.push(`- ${node.name}`)
  }
  if (node.children) {
    node.children.forEach((child) => renderMarkdown(child, indent + 1, result))
  }
  return result
}

function renderJson(node) {
  const out = { name: node.name, type: node.type }
  if (node.children && node.children.length) {
    out.children = node.children.map(renderJson)
  }
  return out
}

function renderYaml(node, indent = 0, result = []) {
  const pad = '  '.repeat(indent)
  if (node.depth === 0) {
    result.push(`${pad}name: ${node.name}`)
    result.push(`${pad}type: ${node.type}`)
    if (node.children && node.children.length) {
      result.push(`${pad}children:`)
      node.children.forEach((child) => renderYaml(child, indent + 1, result))
    }
  } else {
    result.push(`${pad}- name: ${node.name}`)
    result.push(`${pad}  type: ${node.type}`)
    if (node.children && node.children.length) {
      result.push(`${pad}  children:`)
      node.children.forEach((child) => renderYaml(child, indent + 2, result))
    }
  }
  return result
}

export function generateDirectoryTree(input, options = {}) {
  const paths = typeof input === 'string' ? input.split(/\r?\n/) : input
  const tree = buildTree(paths, options)

  const style = options.style || 'ascii'
  switch (style) {
    case 'unicode':
      return renderUnicode(tree).join('\n')
    case 'markdown':
      return renderMarkdown(tree).join('\n')
    case 'json':
      return JSON.stringify(renderJson(tree), null, 2)
    case 'yaml':
      return renderYaml(tree).join('\n')
    case 'ascii':
    default:
      return renderAscii(tree).join('\n')
  }
}

export function countNodes(node) {
  if (!node.children || !node.children.length) return { directories: node.type === 'directory' ? 1 : 0, files: node.type === 'file' ? 1 : 0 }
  let dirs = node.type === 'directory' ? 1 : 0
  let files = 0
  node.children.forEach((child) => {
    const c = countNodes(child)
    dirs += c.directories
    files += c.files
  })
  return { directories: dirs, files }
}

/**
 * Escaneia um diretório local usando a File System Access API.
 * Retorna um array de caminhos relativos. Em navegadores sem suporte,
 * lança um erro amigável.
 */
export async function scanDirectoryWithPicker() {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API não é suportada neste navegador.')
  }
  const dirHandle = await window.showDirectoryPicker()
  const paths = []

  async function walk(handle, path, depth) {
    const entries = []
    for await (const [name, childHandle] of handle.entries()) {
      entries.push({ name, childHandle })
    }
    entries.sort((a, b) => a.name.localeCompare(b.name))

    for (const { name, childHandle } of entries) {
      const childPath = path ? `${path}/${name}` : name
      paths.push(childPath)
      if (childHandle.kind === 'directory') {
        await walk(childHandle, childPath, depth + 1)
      }
    }
  }

  await walk(dirHandle, '', 0)
  return paths
}
