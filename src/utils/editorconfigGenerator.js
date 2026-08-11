// Gerador de .editorconfig
// 100% client-side: monta o arquivo de configuração do EditorConfig a partir
// de opções editáveis, sem nenhuma chamada de rede.

export const PRESETS = {
  generic: {
    label: { pt: 'Genérico', en: 'Generic' },
    root: true,
    indentStyle: 'space',
    indentSize: 2,
    tabWidth: '',
    endOfLine: 'lf',
    charset: 'utf-8',
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    maxLineLength: '',
    sections: [],
  },
  node: {
    label: { pt: 'Node.js', en: 'Node.js' },
    root: true,
    indentStyle: 'space',
    indentSize: 2,
    tabWidth: '',
    endOfLine: 'lf',
    charset: 'utf-8',
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    maxLineLength: '',
    sections: [
      { glob: 'package.json', indentSize: 2 },
      { glob: '*.md', trimTrailingWhitespace: false },
    ],
  },
  python: {
    label: { pt: 'Python', en: 'Python' },
    root: true,
    indentStyle: 'space',
    indentSize: 4,
    tabWidth: '',
    endOfLine: 'lf',
    charset: 'utf-8',
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    maxLineLength: '',
    sections: [
      { glob: '*.py', indentSize: 4 },
      { glob: '*.md', trimTrailingWhitespace: false },
    ],
  },
  web: {
    label: { pt: 'Web (HTML/CSS/JS)', en: 'Web (HTML/CSS/JS)' },
    root: true,
    indentStyle: 'space',
    indentSize: 2,
    tabWidth: '',
    endOfLine: 'lf',
    charset: 'utf-8',
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    maxLineLength: '',
    sections: [
      { glob: '*.{js,jsx,ts,tsx,json,css,scss,html,yml,yaml}', indentSize: 2 },
      { glob: '*.md', trimTrailingWhitespace: false },
    ],
  },
  go: {
    label: { pt: 'Go', en: 'Go' },
    root: true,
    indentStyle: 'tab',
    indentSize: '',
    tabWidth: 4,
    endOfLine: 'lf',
    charset: 'utf-8',
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    maxLineLength: '',
    sections: [
      { glob: '*.go', indentStyle: 'tab' },
      { glob: 'go.mod', indentStyle: 'tab' },
    ],
  },
  rust: {
    label: { pt: 'Rust', en: 'Rust' },
    root: true,
    indentStyle: 'space',
    indentSize: 4,
    tabWidth: '',
    endOfLine: 'lf',
    charset: 'utf-8',
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
    maxLineLength: '',
    sections: [
      { glob: '*.rs', indentSize: 4 },
      { glob: '*.md', trimTrailingWhitespace: false },
    ],
  },
}

function line(key, value) {
  if (value === '' || value == null) return ''
  return `${key} = ${value}`
}

export function buildEditorConfig(options) {
  const {
    root = true,
    indentStyle = 'space',
    indentSize = 2,
    tabWidth = '',
    endOfLine = 'lf',
    charset = 'utf-8',
    trimTrailingWhitespace = true,
    insertFinalNewline = true,
    maxLineLength = '',
    sections = [],
  } = options

  const lines = []

  if (root) lines.push('root = true')
  if (lines.length) lines.push('')

  lines.push('[*]')
  if (indentStyle) lines.push(line('indent_style', indentStyle))
  if (indentSize !== '' && indentSize != null) lines.push(line('indent_size', String(indentSize)))
  if (tabWidth !== '' && tabWidth != null) lines.push(line('tab_width', String(tabWidth)))
  if (endOfLine) lines.push(line('end_of_line', endOfLine))
  if (charset) lines.push(line('charset', charset))
  if (trimTrailingWhitespace !== '') {
    lines.push(line('trim_trailing_whitespace', String(trimTrailingWhitespace)))
  }
  if (insertFinalNewline !== '') {
    lines.push(line('insert_final_newline', String(insertFinalNewline)))
  }
  if (maxLineLength !== '' && maxLineLength != null) {
    lines.push(line('max_line_length', String(maxLineLength)))
  }

  for (const section of sections) {
    if (!section.glob) continue
    lines.push('')
    lines.push(`[${section.glob}]`)
    if (section.indentStyle) lines.push(line('indent_style', section.indentStyle))
    if (section.indentSize !== '' && section.indentSize != null) {
      lines.push(line('indent_size', String(section.indentSize)))
    }
    if (section.tabWidth !== '' && section.tabWidth != null) {
      lines.push(line('tab_width', String(section.tabWidth)))
    }
    if (section.endOfLine) lines.push(line('end_of_line', section.endOfLine))
    if (section.charset) lines.push(line('charset', section.charset))
    if (section.trimTrailingWhitespace !== '') {
      lines.push(line('trim_trailing_whitespace', String(section.trimTrailingWhitespace)))
    }
    if (section.insertFinalNewline !== '') {
      lines.push(line('insert_final_newline', String(section.insertFinalNewline)))
    }
    if (section.maxLineLength !== '' && section.maxLineLength != null) {
      lines.push(line('max_line_length', String(section.maxLineLength)))
    }
  }

  return lines.join('\n')
}
