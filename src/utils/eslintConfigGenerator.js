// Gerador de configuração ESLint
// 100% client-side: monta arquivos eslint.config.js (flat config) ou
// .eslintrc.json (legacy) sem nenhuma chamada de rede.

export const CONFIG_TYPES = [
  { value: 'flat', label: { pt: 'Flat config (eslint.config.js)', en: 'Flat config (eslint.config.js)' } },
  { value: 'legacy', label: { pt: 'Legacy (.eslintrc.json)', en: 'Legacy (.eslintrc.json)' } },
]

export const ENVIRONMENTS = [
  { value: 'browser', label: 'browser' },
  { value: 'node', label: 'node' },
  { value: 'commonjs', label: 'commonjs' },
  { value: 'es2021', label: 'es2021' },
  { value: 'es2022', label: 'es2022' },
  { value: 'es2023', label: 'es2023' },
  { value: 'es2024', label: 'es2024' },
  { value: 'jest', label: 'jest' },
  { value: 'mocha', label: 'mocha' },
]

export const EXTENDS_OPTIONS = [
  { value: 'eslint:recommended', label: 'eslint:recommended' },
  { value: 'plugin:@typescript-eslint/recommended', label: 'plugin:@typescript-eslint/recommended' },
  { value: 'plugin:@typescript-eslint/strict', label: 'plugin:@typescript-eslint/strict' },
  { value: 'plugin:react/recommended', label: 'plugin:react/recommended' },
  { value: 'plugin:react/jsx-runtime', label: 'plugin:react/jsx-runtime' },
  { value: 'plugin:react-hooks/recommended', label: 'plugin:react-hooks/recommended' },
  { value: 'plugin:jsx-a11y/recommended', label: 'plugin:jsx-a11y/recommended' },
  { value: 'plugin:import/recommended', label: 'plugin:import/recommended' },
  { value: 'plugin:import/typescript', label: 'plugin:import/typescript' },
  { value: 'plugin:prettier/recommended', label: 'plugin:prettier/recommended' },
  { value: 'airbnb', label: 'airbnb' },
  { value: 'airbnb-base', label: 'airbnb-base' },
  { value: 'standard', label: 'standard' },
]

export const PLUGINS_OPTIONS = [
  { value: '@typescript-eslint', label: '@typescript-eslint' },
  { value: 'react', label: 'react' },
  { value: 'react-hooks', label: 'react-hooks' },
  { value: 'jsx-a11y', label: 'jsx-a11y' },
  { value: 'import', label: 'import' },
  { value: 'prettier', label: 'prettier' },
  { value: 'simple-import-sort', label: 'simple-import-sort' },
  { value: 'unused-imports', label: 'unused-imports' },
  { value: 'promise', label: 'promise' },
  { value: 'sonarjs', label: 'sonarjs' },
]

export const PARSER_OPTIONS = [
  { value: '', label: { pt: 'Padrão (espree)', en: 'Default (espree)' } },
  { value: '@typescript-eslint/parser', label: '@typescript-eslint/parser' },
  { value: '@babel/eslint-parser', label: '@babel/eslint-parser' },
  { value: 'vue-eslint-parser', label: 'vue-eslint-parser' },
]

export const ECMA_VERSION_OPTIONS = [
  'latest', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', 5,
]

export const SOURCE_TYPE_OPTIONS = [
  { value: 'module', label: 'module' },
  { value: 'script', label: 'script' },
]

export const RULE_LEVELS = [
  { value: 'off', label: 'off' },
  { value: 'warn', label: 'warn' },
  { value: 'error', label: 'error' },
]

export const AVAILABLE_RULES = [
  { name: 'no-unused-vars', category: 'core' },
  { name: 'no-console', category: 'core' },
  { name: 'no-debugger', category: 'core' },
  { name: 'eqeqeq', category: 'core' },
  { name: 'curly', category: 'core' },
  { name: 'prefer-const', category: 'core' },
  { name: 'no-var', category: 'core' },
  { name: 'object-shorthand', category: 'core' },
  { name: 'arrow-body-style', category: 'core' },
  { name: 'no-duplicate-imports', category: 'core' },
  { name: 'no-shadow', category: 'core' },
  { name: 'no-param-reassign', category: 'core' },
  { name: '@typescript-eslint/no-unused-vars', category: 'ts' },
  { name: '@typescript-eslint/explicit-function-return-type', category: 'ts' },
  { name: '@typescript-eslint/no-explicit-any', category: 'ts' },
  { name: '@typescript-eslint/no-non-null-assertion', category: 'ts' },
  { name: 'react/prop-types', category: 'react' },
  { name: 'react/react-in-jsx-scope', category: 'react' },
  { name: 'react/jsx-uses-react', category: 'react' },
  { name: 'react/jsx-uses-vars', category: 'react' },
  { name: 'react-hooks/rules-of-hooks', category: 'react' },
  { name: 'react-hooks/exhaustive-deps', category: 'react' },
  { name: 'jsx-a11y/alt-text', category: 'a11y' },
  { name: 'jsx-a11y/anchor-is-valid', category: 'a11y' },
  { name: 'import/no-unresolved', category: 'import' },
  { name: 'import/order', category: 'import' },
  { name: 'simple-import-sort/imports', category: 'import' },
  { name: 'simple-import-sort/exports', category: 'import' },
  { name: 'unused-imports/no-unused-imports', category: 'import' },
  { name: 'prettier/prettier', category: 'prettier' },
  { name: 'promise/catch-or-return', category: 'promise' },
]

export const PRESETS = {
  recommended: {
    label: { pt: 'Recomendado', en: 'Recommended' },
    configType: 'flat',
    environments: ['browser', 'es2022'],
    extends: ['eslint:recommended'],
    plugins: [],
    parser: '',
    ecmaVersion: 'latest',
    sourceType: 'module',
    jsx: false,
    reactVersion: 'detect',
    rules: [
      { name: 'no-unused-vars', level: 'warn' },
      { name: 'no-console', level: 'warn' },
      { name: 'eqeqeq', level: 'error' },
      { name: 'prefer-const', level: 'error' },
    ],
    ignores: ['dist', 'build', 'node_modules', 'coverage'],
    lintFiles: ['src/**/*.{js,jsx}'],
  },
  typescript: {
    label: { pt: 'TypeScript', en: 'TypeScript' },
    configType: 'flat',
    environments: ['node', 'es2022'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    jsx: false,
    reactVersion: 'detect',
    rules: [
      { name: '@typescript-eslint/no-unused-vars', level: 'warn' },
      { name: '@typescript-eslint/no-explicit-any', level: 'warn' },
      { name: 'no-console', level: 'warn' },
    ],
    ignores: ['dist', 'build', 'node_modules', 'coverage'],
    lintFiles: ['src/**/*.{ts,tsx}'],
  },
  react: {
    label: { pt: 'React', en: 'React' },
    configType: 'flat',
    environments: ['browser', 'es2022'],
    extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended', 'plugin:jsx-a11y/recommended'],
    plugins: ['react', 'react-hooks', 'jsx-a11y'],
    parser: '',
    ecmaVersion: 'latest',
    sourceType: 'module',
    jsx: true,
    reactVersion: 'detect',
    rules: [
      { name: 'react/react-in-jsx-scope', level: 'off' },
      { name: 'react-hooks/rules-of-hooks', level: 'error' },
      { name: 'react-hooks/exhaustive-deps', level: 'warn' },
      { name: 'no-console', level: 'warn' },
    ],
    ignores: ['dist', 'build', 'node_modules', 'coverage'],
    lintFiles: ['src/**/*.{js,jsx}'],
  },
  reactTypescript: {
    label: { pt: 'React + TypeScript', en: 'React + TypeScript' },
    configType: 'flat',
    environments: ['browser', 'es2022'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
    plugins: ['@typescript-eslint', 'react', 'react-hooks'],
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    jsx: true,
    reactVersion: 'detect',
    rules: [
      { name: 'react/react-in-jsx-scope', level: 'off' },
      { name: 'react-hooks/rules-of-hooks', level: 'error' },
      { name: 'react-hooks/exhaustive-deps', level: 'warn' },
      { name: '@typescript-eslint/no-unused-vars', level: 'warn' },
      { name: '@typescript-eslint/no-explicit-any', level: 'warn' },
    ],
    ignores: ['dist', 'build', 'node_modules', 'coverage'],
    lintFiles: ['src/**/*.{ts,tsx}'],
  },
  node: {
    label: { pt: 'Node.js', en: 'Node.js' },
    configType: 'flat',
    environments: ['node', 'es2022', 'commonjs'],
    extends: ['eslint:recommended'],
    plugins: [],
    parser: '',
    ecmaVersion: 'latest',
    sourceType: 'script',
    jsx: false,
    reactVersion: 'detect',
    rules: [
      { name: 'no-console', level: 'off' },
      { name: 'no-unused-vars', level: 'warn' },
    ],
    ignores: ['dist', 'build', 'node_modules', 'coverage'],
    lintFiles: ['**/*.js'],
  },
  prettier: {
    label: { pt: 'Prettier', en: 'Prettier' },
    configType: 'flat',
    environments: ['browser', 'es2022'],
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    plugins: ['prettier'],
    parser: '',
    ecmaVersion: 'latest',
    sourceType: 'module',
    jsx: false,
    reactVersion: 'detect',
    rules: [
      { name: 'prettier/prettier', level: 'error' },
      { name: 'no-console', level: 'warn' },
    ],
    ignores: ['dist', 'build', 'node_modules', 'coverage'],
    lintFiles: ['src/**/*.{js,jsx}'],
  },
  strict: {
    label: { pt: 'Estrito', en: 'Strict' },
    configType: 'flat',
    environments: ['browser', 'es2022'],
    extends: ['eslint:recommended'],
    plugins: ['simple-import-sort', 'unused-imports'],
    parser: '',
    ecmaVersion: 'latest',
    sourceType: 'module',
    jsx: false,
    reactVersion: 'detect',
    rules: [
      { name: 'no-unused-vars', level: 'error' },
      { name: 'no-console', level: 'error' },
      { name: 'no-debugger', level: 'error' },
      { name: 'eqeqeq', level: 'error' },
      { name: 'curly', level: 'error' },
      { name: 'prefer-const', level: 'error' },
      { name: 'no-var', level: 'error' },
      { name: 'simple-import-sort/imports', level: 'error' },
      { name: 'simple-import-sort/exports', level: 'error' },
      { name: 'unused-imports/no-unused-imports', level: 'error' },
    ],
    ignores: ['dist', 'build', 'node_modules', 'coverage'],
    lintFiles: ['src/**/*.{js,jsx}'],
  },
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    configType: 'flat',
    environments: ['browser', 'es2022'],
    extends: [],
    plugins: [],
    parser: '',
    ecmaVersion: 'latest',
    sourceType: 'module',
    jsx: false,
    reactVersion: 'detect',
    rules: [],
    ignores: ['node_modules'],
    lintFiles: ['src/**/*.js'],
  },
}

function pushRule(outRules, rule) {
  if (!rule || !rule.name || !rule.level || rule.level === 'off') return
  outRules[rule.name] = rule.level
}

function buildRules(options) {
  const out = {}
  if (Array.isArray(options.rules)) {
    options.rules.forEach((r) => pushRule(out, r))
  }
  return out
}

function buildSettings(options) {
  const settings = {}
  const isReact =
    options.extends?.some((e) => e.includes('react')) ||
    options.plugins?.includes('react')

  if (isReact && options.reactVersion) {
    settings.react = { version: options.reactVersion }
  }

  if (options.extends?.some((e) => e.startsWith('plugin:import'))) {
    settings['import/resolver'] = { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } }
  }

  return Object.keys(settings).length > 0 ? settings : null
}

export function buildEslintConfig(options) {
  const opts = { ...PRESETS.recommended, ...options }
  const configType = opts.configType || 'flat'

  if (configType === 'legacy') {
    return buildLegacyConfig(opts)
  }
  return buildFlatConfig(opts)
}

function buildFlatConfig(options) {
  const configs = []
  const jsConfig = { name: 'Base JS config' }

  const env = Array.isArray(options.environments) ? options.environments : []
  if (env.includes('browser')) jsConfig.browser = true
  if (env.includes('node')) jsConfig.node = true
  if (env.includes('commonjs')) jsConfig.commonjs = true

  const languageOptions = { ecmaVersion: options.ecmaVersion || 'latest' }
  if (options.sourceType) languageOptions.sourceType = options.sourceType

  const globals = {}
  if (env.includes('es2021') || env.includes('es2022') || env.includes('es2023') || env.includes('es2024')) {
    globals.es2021 = true
  }
  if (Object.keys(globals).length > 0) {
    languageOptions.globals = globals
  }

  if (options.parser) {
    languageOptions.parser = options.parser
  }

  if (options.jsx) {
    languageOptions.parserOptions = { ecmaFeatures: { jsx: true } }
  }

  if (Object.keys(languageOptions).length > 0) {
    jsConfig.languageOptions = languageOptions
  }

  if (Array.isArray(options.extends) && options.extends.length > 0) {
    jsConfig.extends = options.extends
  }

  if (Array.isArray(options.plugins) && options.plugins.length > 0) {
    jsConfig.plugins = options.plugins
  }

  const rules = buildRules(options)
  if (Object.keys(rules).length > 0) {
    jsConfig.rules = rules
  }

  const settings = buildSettings(options)
  if (settings) {
    jsConfig.settings = settings
  }

  configs.push(jsConfig)

  const ignores = Array.isArray(options.ignores) ? options.ignores.filter(Boolean) : []
  if (ignores.length > 0) {
    configs.push({ name: 'Ignores', ignores })
  }

  const lintFiles = Array.isArray(options.lintFiles) ? options.lintFiles.filter(Boolean) : []
  if (lintFiles.length > 0 && configs[0]) {
    configs[0].files = lintFiles
  }

  let output = ''
  output += '/** @type {import("eslint").Linter.Config[]} */\n'
  output += 'export default [\n'
  configs.forEach((cfg) => {
    output += '  ' + JSON.stringify(cfg, null, 2).replace(/\n/g, '\n  ') + ',\n'
  })
  output += ']\n'

  return output
}

function buildLegacyConfig(options) {
  const out = {}

  const env = Array.isArray(options.environments) ? options.environments : []
  const envObj = {}
  env.forEach((e) => {
    if (e === 'browser' || e === 'node' || e === 'commonjs' || e === 'jest' || e === 'mocha') {
      envObj[e] = true
    } else if (e.startsWith('es')) {
      envObj[e] = true
    }
  })
  if (Object.keys(envObj).length > 0) {
    out.env = envObj
  }

  if (Array.isArray(options.extends) && options.extends.length > 0) {
    out.extends = options.extends
  }

  if (Array.isArray(options.plugins) && options.plugins.length > 0) {
    out.plugins = options.plugins
  }

  const parserOptions = {}
  if (options.ecmaVersion) parserOptions.ecmaVersion = options.ecmaVersion
  if (options.sourceType) parserOptions.sourceType = options.sourceType
  if (options.jsx) parserOptions.ecmaFeatures = { ...(parserOptions.ecmaFeatures || {}), jsx: true }
  if (options.parser) parserOptions.parser = options.parser
  if (Object.keys(parserOptions).length > 0) {
    out.parserOptions = parserOptions
  }

  if (options.parser && !parserOptions.parser) {
    out.parser = options.parser
  }

  const rules = buildRules(options)
  if (Object.keys(rules).length > 0) {
    out.rules = rules
  }

  const settings = buildSettings(options)
  if (settings) {
    out.settings = settings
  }

  if (options.rootDir) {
    out.root = true
  }

  return JSON.stringify(out, null, 2)
}
