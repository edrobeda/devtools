// Gerador de tsconfig.json
// 100% client-side: monta o arquivo de configuração do TypeScript a partir
// de opções editáveis, sem nenhuma chamada de rede.

const DEFAULT_INCLUDE = ['src/**/*']
const DEFAULT_EXCLUDE = ['node_modules', 'dist', 'build']

export const TARGET_OPTIONS = [
  'ES5', 'ES6', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020',
  'ES2021', 'ES2022', 'ES2023', 'ESNext',
]

export const MODULE_OPTIONS = [
  'CommonJS', 'AMD', 'UMD', 'System', 'ES2015', 'ES2020', 'ES2022', 'ESNext',
  'Node16', 'NodeNext', 'None',
]

export const MODULE_RESOLUTION_OPTIONS = [
  'classic', 'node', 'Node16', 'NodeNext', 'bundler',
]

export const JSX_OPTIONS = [
  'preserve', 'react', 'react-jsx', 'react-jsxdev', 'react-native',
]

export const LIB_OPTIONS = [
  'ES5', 'ES6', 'ES2015', 'ES2016', 'ES2017', 'ES2018', 'ES2019', 'ES2020',
  'ES2021', 'ES2022', 'ES2023', 'ESNext', 'DOM', 'DOM.Iterable', 'WebWorker',
  'ScriptHost', 'DecoratorMetadata',
]

export const PRESETS = {
  default: {
    label: { pt: 'Recomendado', en: 'Recommended' },
    includeSchema: true,
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    jsx: 'preserve',
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    alwaysStrict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noImplicitReturns: false,
    noFallthroughCasesInSwitch: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true,
    declaration: false,
    declarationMap: false,
    sourceMap: true,
    outDir: './dist',
    rootDir: './src',
    baseUrl: '.',
    paths: '',
    resolveJsonModule: true,
    isolatedModules: true,
    verbatimModuleSyntax: false,
    noEmit: false,
    incremental: false,
    removeComments: false,
    preserveConstEnums: false,
    include: DEFAULT_INCLUDE,
    exclude: DEFAULT_EXCLUDE,
  },
  strict: {
    label: { pt: 'Estrito', en: 'Strict' },
    includeSchema: true,
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    jsx: 'preserve',
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    alwaysStrict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true,
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    outDir: './dist',
    rootDir: './src',
    baseUrl: '.',
    paths: '',
    resolveJsonModule: true,
    isolatedModules: true,
    verbatimModuleSyntax: true,
    noEmit: false,
    incremental: false,
    removeComments: false,
    preserveConstEnums: false,
    include: DEFAULT_INCLUDE,
    exclude: DEFAULT_EXCLUDE,
  },
  node: {
    label: { pt: 'Node.js', en: 'Node.js' },
    includeSchema: true,
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    lib: ['ES2022'],
    jsx: 'preserve',
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    alwaysStrict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noImplicitReturns: false,
    noFallthroughCasesInSwitch: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true,
    declaration: false,
    declarationMap: false,
    sourceMap: true,
    outDir: './dist',
    rootDir: './src',
    baseUrl: '.',
    paths: '',
    resolveJsonModule: true,
    isolatedModules: true,
    verbatimModuleSyntax: false,
    noEmit: false,
    incremental: false,
    removeComments: false,
    preserveConstEnums: false,
    include: DEFAULT_INCLUDE,
    exclude: DEFAULT_EXCLUDE,
  },
  react: {
    label: { pt: 'React / Vite', en: 'React / Vite' },
    includeSchema: true,
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    jsx: 'react-jsx',
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    alwaysStrict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noImplicitReturns: false,
    noFallthroughCasesInSwitch: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true,
    declaration: false,
    declarationMap: false,
    sourceMap: true,
    outDir: './dist',
    rootDir: './src',
    baseUrl: '.',
    paths: '{"@/*": ["./src/*"]}',
    resolveJsonModule: true,
    isolatedModules: true,
    verbatimModuleSyntax: false,
    noEmit: true,
    incremental: false,
    removeComments: false,
    preserveConstEnums: false,
    include: ['src'],
    exclude: DEFAULT_EXCLUDE,
  },
  next: {
    label: { pt: 'Next.js', en: 'Next.js' },
    includeSchema: true,
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    jsx: 'preserve',
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    alwaysStrict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noImplicitReturns: false,
    noFallthroughCasesInSwitch: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true,
    declaration: false,
    declarationMap: false,
    sourceMap: true,
    outDir: './.next',
    rootDir: '.',
    baseUrl: '.',
    paths: '{"@/*": ["./src/*"]}',
    resolveJsonModule: true,
    isolatedModules: true,
    verbatimModuleSyntax: false,
    noEmit: true,
    incremental: false,
    removeComments: false,
    preserveConstEnums: false,
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
    exclude: ['node_modules'],
  },
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    includeSchema: false,
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    lib: [],
    jsx: 'preserve',
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    strictPropertyInitialization: true,
    noImplicitThis: true,
    alwaysStrict: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    noImplicitReturns: false,
    noFallthroughCasesInSwitch: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    forceConsistentCasingInFileNames: true,
    skipLibCheck: true,
    declaration: false,
    declarationMap: false,
    sourceMap: false,
    outDir: '',
    rootDir: '',
    baseUrl: '',
    paths: '',
    resolveJsonModule: false,
    isolatedModules: false,
    verbatimModuleSyntax: false,
    noEmit: false,
    incremental: false,
    removeComments: false,
    preserveConstEnums: false,
    include: [],
    exclude: [],
  },
}

function pushString(out, key, value) {
  if (typeof value === 'string' && value.trim() !== '') {
    out[key] = value.trim()
  }
}

function pushArray(out, key, value) {
  if (Array.isArray(value) && value.length > 0) {
    out[key] = value
  }
}

export function buildTsconfig(options) {
  const opts = { ...DEFAULT_PRESET, ...options }
  const compilerOptions = {}
  const out = {}

  if (opts.includeSchema) {
    out.$schema = 'https://json.schemastore.org/tsconfig'
  }

  pushString(compilerOptions, 'target', opts.target)
  pushString(compilerOptions, 'module', opts.module)
  pushString(compilerOptions, 'moduleResolution', opts.moduleResolution)
  pushString(compilerOptions, 'jsx', opts.jsx)
  pushArray(compilerOptions, 'lib', opts.lib)

  // Strict family
  if (typeof opts.strict === 'boolean') compilerOptions.strict = opts.strict
  if (typeof opts.noImplicitAny === 'boolean') compilerOptions.noImplicitAny = opts.noImplicitAny
  if (typeof opts.strictNullChecks === 'boolean') compilerOptions.strictNullChecks = opts.strictNullChecks
  if (typeof opts.strictFunctionTypes === 'boolean') compilerOptions.strictFunctionTypes = opts.strictFunctionTypes
  if (typeof opts.strictBindCallApply === 'boolean') compilerOptions.strictBindCallApply = opts.strictBindCallApply
  if (typeof opts.strictPropertyInitialization === 'boolean') compilerOptions.strictPropertyInitialization = opts.strictPropertyInitialization
  if (typeof opts.noImplicitThis === 'boolean') compilerOptions.noImplicitThis = opts.noImplicitThis
  if (typeof opts.alwaysStrict === 'boolean') compilerOptions.alwaysStrict = opts.alwaysStrict

  // Checks
  if (typeof opts.noUnusedLocals === 'boolean') compilerOptions.noUnusedLocals = opts.noUnusedLocals
  if (typeof opts.noUnusedParameters === 'boolean') compilerOptions.noUnusedParameters = opts.noUnusedParameters
  if (typeof opts.noImplicitReturns === 'boolean') compilerOptions.noImplicitReturns = opts.noImplicitReturns
  if (typeof opts.noFallthroughCasesInSwitch === 'boolean') compilerOptions.noFallthroughCasesInSwitch = opts.noFallthroughCasesInSwitch

  // Module interop
  if (typeof opts.esModuleInterop === 'boolean') compilerOptions.esModuleInterop = opts.esModuleInterop
  if (typeof opts.allowSyntheticDefaultImports === 'boolean') compilerOptions.allowSyntheticDefaultImports = opts.allowSyntheticDefaultImports
  if (typeof opts.forceConsistentCasingInFileNames === 'boolean') compilerOptions.forceConsistentCasingInFileNames = opts.forceConsistentCasingInFileNames
  if (typeof opts.skipLibCheck === 'boolean') compilerOptions.skipLibCheck = opts.skipLibCheck
  if (typeof opts.resolveJsonModule === 'boolean') compilerOptions.resolveJsonModule = opts.resolveJsonModule
  if (typeof opts.isolatedModules === 'boolean') compilerOptions.isolatedModules = opts.isolatedModules
  if (typeof opts.verbatimModuleSyntax === 'boolean') compilerOptions.verbatimModuleSyntax = opts.verbatimModuleSyntax
  if (typeof opts.preserveConstEnums === 'boolean') compilerOptions.preserveConstEnums = opts.preserveConstEnums

  // Emit
  if (typeof opts.declaration === 'boolean') compilerOptions.declaration = opts.declaration
  if (typeof opts.declarationMap === 'boolean') compilerOptions.declarationMap = opts.declarationMap
  if (typeof opts.sourceMap === 'boolean') compilerOptions.sourceMap = opts.sourceMap
  if (typeof opts.noEmit === 'boolean') compilerOptions.noEmit = opts.noEmit
  if (typeof opts.incremental === 'boolean') compilerOptions.incremental = opts.incremental
  if (typeof opts.removeComments === 'boolean') compilerOptions.removeComments = opts.removeComments

  pushString(compilerOptions, 'outDir', opts.outDir)
  pushString(compilerOptions, 'rootDir', opts.rootDir)
  pushString(compilerOptions, 'baseUrl', opts.baseUrl)

  // paths é um objeto; tentamos parsear a string como JSON
  if (typeof opts.paths === 'string' && opts.paths.trim() !== '') {
    try {
      const parsed = JSON.parse(opts.paths)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        compilerOptions.paths = parsed
      }
    } catch {
      // string inválida: ignoramos silenciosamente
    }
  }

  if (Object.keys(compilerOptions).length > 0) {
    out.compilerOptions = compilerOptions
  }

  pushArray(out, 'include', opts.include)
  pushArray(out, 'exclude', opts.exclude)

  return JSON.stringify(out, null, 2)
}

const DEFAULT_PRESET = PRESETS.default
