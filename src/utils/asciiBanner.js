// Gerador de banner ASCII estilo figlet — 100% client-side.
//
// Cada glifo é uma matriz 5×5 de caracteres onde '#' marca a "tinta" e ' '
// marca o vazio. Na renderização, '#' é substituído pelo caractere de
// preenchimento escolhido (o padrão é '#'), e os glifos são unidos com um
// espaçamento configurável. Suporta 26 letras, 10 dígitos e pontuação
// comum; qualquer caractere fora da tabela vira o glifo '?'.

const GLYPHS = {
  'A': ['.###.', '#...#', '#####', '#...#', '#...#'],
  'B': ['####.', '#...#', '####.', '#...#', '####.'],
  'C': ['.####', '#....', '#....', '#....', '.####'],
  'D': ['####.', '#...#', '#...#', '#...#', '####.'],
  'E': ['#####', '#....', '####.', '#....', '#####'],
  'F': ['#####', '#....', '####.', '#....', '#....'],
  'G': ['.####', '#....', '#..##', '#...#', '.###.'],
  'H': ['#...#', '#...#', '#####', '#...#', '#...#'],
  'I': ['#####', '..#..', '..#..', '..#..', '#####'],
  'J': ['..###', '...#.', '...#.', '#..#.', '.##..'],
  'K': ['#...#', '#..#.', '###..', '#..#.', '#...#'],
  'L': ['#....', '#....', '#....', '#....', '#####'],
  'M': ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
  'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#'],
  'O': ['.###.', '#...#', '#...#', '#...#', '.###.'],
  'P': ['####.', '#...#', '####.', '#....', '#....'],
  'Q': ['.###.', '#...#', '#...#', '#..##', '.####'],
  'R': ['####.', '#...#', '####.', '#..#.', '#...#'],
  'S': ['.####', '#....', '.###.', '....#', '####.'],
  'T': ['#####', '..#..', '..#..', '..#..', '..#..'],
  'U': ['#...#', '#...#', '#...#', '#...#', '.###.'],
  'V': ['#...#', '#...#', '#...#', '.#.#.', '..#..'],
  'W': ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
  'X': ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  'Y': ['#...#', '.#.#.', '..#..', '..#..', '..#..'],
  'Z': ['#####', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#..##', '#.#.#', '##..#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '#####'],
  '2': ['.###.', '#...#', '...#.', '..#..', '#####'],
  '3': ['####.', '....#', '.###.', '....#', '####.'],
  '4': ['#..#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '####.'],
  '6': ['.###.', '#....', '####.', '#...#', '.###.'],
  '7': ['#####', '...#.', '..#..', '.#...', '.#...'],
  '8': ['.###.', '#...#', '.###.', '#...#', '.###.'],
  '9': ['.###.', '#...#', '.####', '....#', '.###.'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
  '!': ['..#..', '..#..', '..#..', '.....', '..#..'],
  '"': ['#.#..', '#.#..', '.....', '.....', '.....'],
  '#': ['.#.#.', '#####', '.#.#.', '#####', '.#.#.'],
  '$': ['..#..', '.####', '#..#.', '.####', '..#..'],
  '%': ['#...#', '...#.', '..#..', '.#...', '#...#'],
  '&': ['.##..', '#.#..', '.##..', '#..#.', '##.#.'],
  "'": ['..#..', '..#..', '.....', '.....', '.....'],
  '(': ['..#..', '.#...', '#....', '.#...', '..#..'],
  ')': ['..#..', '...#.', '....#', '...#.', '..#..'],
  '*': ['.....', '#.#.#', '..#..', '.#.#.', '.....'],
  '+': ['.....', '..#..', '#####', '..#..', '.....'],
  ',': ['.....', '.....', '.....', '..#..', '.#...'],
  '-': ['.....', '.....', '#####', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '..#..'],
  '/': ['....#', '...#.', '..#..', '.#...', '#....'],
  ':': ['.....', '..#..', '.....', '..#..', '.....'],
  ';': ['.....', '..#..', '.....', '..#..', '.#...'],
  '<': ['....#', '...#.', '..#..', '...#.', '....#'],
  '=': ['.....', '#####', '.....', '#####', '.....'],
  '>': ['#....', '.#...', '..#..', '.#...', '#....'],
  '?': ['.###.', '#...#', '...#.', '.....', '..#..'],
  '@': ['.###.', '#.#.#', '#.#.#', '#.###', '.###.'],
  '[': ['.###.', '.#...', '.#...', '.#...', '.###.'],
  '\\': ['#....', '.#...', '..#..', '...#.', '....#'],
  ']': ['.###.', '...#.', '...#.', '...#.', '.###.'],
  '^': ['..#..', '.#.#.', '#...#', '.....', '.....'],
  '_': ['.....', '.....', '.....', '.....', '#####'],
  '`': ['.#...', '..#..', '.....', '.....', '.....'],
  '{': ['..###', '..#..', '.#...', '..#..', '..###'],
  '|': ['..#..', '..#..', '..#..', '..#..', '..#..'],
  '}': ['###..', '..#..', '...#.', '..#..', '###..'],
  '~': ['.....', '.##.#', '#.##.', '.....', '.....'],
}

const ROWS = 5

// Renderiza o texto como um banner de linhas de caracteres.
// options: { fill, spacing, scale, autoUpper }
//   - fill:      caractere de preenchimento (substitui o '#'). Padrão '#'.
//   - spacing:   colunas em branco entre glifos (0–3). Padrão 1.
//   - scale:     1 = tamanho normal, 2 = dobra largura e altura. Padrão 1.
//   - autoUpper: true converte o texto para maiúsculas antes de renderizar
//                (existe uma única caixa 5×5 no motor). Padrão true.
// Retorna um array de strings (linhas do banner).
export function renderBanner(text, options = {}) {
  const fill = options.fill || '#'
  const spacing = typeof options.spacing === 'number' ? Math.max(0, options.spacing) : 1
  const scale = Math.max(1, options.scale || 1)
  const autoUpper = options.autoUpper !== false

  const raw = String(text == null ? '' : text)
  if (!raw) return []

  // Nos glifos, '#' é a "tinta" e '.' é o vazio (mais fácil de escrever que
  // espaço literal). Aqui a tinta vira o caractere de preenchimento e o
  // vazio vira espaço, então a saída final só tem `fill` e espaços.
  const rows = []

  for (const line of raw.split('\n')) {
    const glyphs = [...line].map((c) => {
      const key = autoUpper ? c.toUpperCase() : c
      return GLYPHS[key] || GLYPHS['?']
    })
    for (let r = 0; r < ROWS; r++) {
      let row = ''
      glyphs.forEach((g, i) => {
        if (i > 0) row += ' '.repeat(spacing)
        row += g[r].replace(/#/g, fill).replace(/\./g, ' ')
      })
      rows.push(row)
    }
  }

  if (scale > 1) {
    const scaled = []
    for (const row of rows) {
      const wide = [...row].map((ch) => ch.repeat(scale)).join('')
      for (let k = 0; k < scale; k++) scaled.push(wide)
    }
    return scaled
  }
  return rows
}

// Largura (em colunas) da linha mais larga do banner.
export function bannerWidth(rows) {
  return rows.reduce((m, r) => Math.max(m, r.length), 0)
}

export function getEngineSource() {
  return [
    '// Banner ASCII estilo figlet — glifos 5×5, 100% client-side.',
    "// Cada glifo é 5 linhas de 5 colunas: '#' pinta, ' ' deixa vazio.",
    "const GLYPHS = { A: ['.###.', '#...#', '#####', '#...#', '#...#'], ... }",
    '',
    'export function renderBanner(text, { fill = \'#\', spacing = 1, scale = 1, autoUpper = true }) {',
    '  const rows = []',
    '  for (const line of String(text).split(\'\\n\')) {',
    '    const glyphs = [...line].map((c) => {',
    '      const k = autoUpper ? c.toUpperCase() : c',
    '      return GLYPHS[k] || GLYPHS[\'?\']   // caractere desconhecido vira ?',
    '    })',
    '    for (let r = 0; r < 5; r++) {              // 5 linhas por linha de texto',
    '      let row = \'\'',
    '      glyphs.forEach((g, i) => {',
    '        if (i > 0) row += \' \'.repeat(spacing)',
    '        row += g[r]',
    '      })',
    '      rows.push(row)',
    '    }',
    '  }',
    '  // scale > 1: repete cada coluna e cada linha (banner "dobrado")',
    '  return rows',
    '}',
  ].join('\n')
}