// Gerador de configuração Vite — 100% client-side.
// Produz um arquivo vite.config.(js|ts|mjs|cjs) a partir das opções escolhidas.

export const FILE_TYPES = ['js', 'ts', 'mjs', 'cjs']

export const FRAMEWORKS = [
  { value: 'vanilla', label: { pt: 'Vanilla', en: 'Vanilla' } },
  { value: 'react', label: { pt: 'React', en: 'React' } },
  { value: 'vue', label: { pt: 'Vue', en: 'Vue' } },
  { value: 'svelte', label: { pt: 'Svelte', en: 'Svelte' } },
  { value: 'preact', label: { pt: 'Preact', en: 'Preact' } },
  { value: 'solid', label: { pt: 'Solid', en: 'Solid' } },
]

export const MINIFY_OPTIONS = ['esbuild', 'terser', false]

export const LOG_LEVEL_OPTIONS = ['info', 'warn', 'error', 'silent']

export const LIB_FORMAT_OPTIONS = ['es', 'cjs', 'umd', 'iife']

export const PLUGINS = [
  { value: '@vitejs/plugin-react', label: '@vitejs/plugin-react', importName: 'react' },
  { value: '@vitejs/plugin-react-swc', label: '@vitejs/plugin-react-swc', importName: 'react' },
  { value: '@vitejs/plugin-vue', label: '@vitejs/plugin-vue', importName: 'vue' },
  { value: '@sveltejs/vite-plugin-svelte', label: '@sveltejs/vite-plugin-svelte', importName: 'svelte' },
  { value: '@preact/preset-vite', label: '@preact/preset-vite', importName: 'preact' },
  { value: 'vite-plugin-solid', label: 'vite-plugin-solid', importName: 'solid' },
  { value: '@vitejs/plugin-legacy', label: '@vitejs/plugin-legacy', importName: 'legacy' },
  { value: 'vite-plugin-pwa', label: 'vite-plugin-pwa (VitePWA)', importName: 'VitePWA' },
  { value: 'vite-plugin-svgr', label: 'vite-plugin-svgr', importName: 'svgr' },
  { value: 'vite-plugin-compression', label: 'vite-plugin-compression', importName: 'compression' },
  { value: 'vite-plugin-inspect', label: 'vite-plugin-inspect', importName: 'Inspect' },
  { value: 'unocss/vite', label: 'UnoCSS', importName: 'UnoCSS' },
]

export const PRESETS = {
  react: {
    label: { pt: 'React App', en: 'React App' },
    fileType: 'ts',
    framework: 'react',
    plugins: ['@vitejs/plugin-react'],
    base: '/',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    port: 5173,
    open: false,
    proxy: '',
    hmr: true,
    alias: '{\n  "@/*": "./src/*"\n}',
    cssModules: false,
    cssDevSourcemap: true,
    postcss: false,
    optimizeDeps: '',
    define: '',
    envPrefix: 'VITE_',
    clearScreen: true,
    logLevel: 'info',
    libMode: false,
    libEntry: 'src/index.ts',
    libName: 'MyLib',
    libFileName: 'my-lib',
    libFormats: ['es', 'umd'],
  },
  vue: {
    label: { pt: 'Vue App', en: 'Vue App' },
    fileType: 'ts',
    framework: 'vue',
    plugins: ['@vitejs/plugin-vue'],
    base: '/',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    port: 5173,
    open: false,
    proxy: '',
    hmr: true,
    alias: '{\n  "@/*": "./src/*"\n}',
    cssModules: false,
    cssDevSourcemap: true,
    postcss: false,
    optimizeDeps: '',
    define: '',
    envPrefix: 'VITE_',
    clearScreen: true,
    logLevel: 'info',
    libMode: false,
    libEntry: 'src/index.ts',
    libName: 'MyLib',
    libFileName: 'my-lib',
    libFormats: ['es', 'umd'],
  },
  svelte: {
    label: { pt: 'Svelte App', en: 'Svelte App' },
    fileType: 'js',
    framework: 'svelte',
    plugins: ['@sveltejs/vite-plugin-svelte'],
    base: '/',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    port: 5173,
    open: false,
    proxy: '',
    hmr: true,
    alias: '{\n  "$lib/*": "./src/lib/*"\n}',
    cssModules: false,
    cssDevSourcemap: true,
    postcss: false,
    optimizeDeps: '',
    define: '',
    envPrefix: 'VITE_',
    clearScreen: true,
    logLevel: 'info',
    libMode: false,
    libEntry: 'src/index.ts',
    libName: 'MyLib',
    libFileName: 'my-lib',
    libFormats: ['es', 'umd'],
  },
  vanillaTs: {
    label: { pt: 'Vanilla TypeScript', en: 'Vanilla TypeScript' },
    fileType: 'ts',
    framework: 'vanilla',
    plugins: [],
    base: '/',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    port: 5173,
    open: false,
    proxy: '',
    hmr: true,
    alias: '',
    cssModules: false,
    cssDevSourcemap: true,
    postcss: false,
    optimizeDeps: '',
    define: '',
    envPrefix: 'VITE_',
    clearScreen: true,
    logLevel: 'info',
    libMode: false,
    libEntry: 'src/index.ts',
    libName: 'MyLib',
    libFileName: 'my-lib',
    libFormats: ['es', 'umd'],
  },
  library: {
    label: { pt: 'Biblioteca (lib mode)', en: 'Library (lib mode)' },
    fileType: 'ts',
    framework: 'vanilla',
    plugins: [],
    base: '/',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    port: 5173,
    open: false,
    proxy: '',
    hmr: true,
    alias: '',
    cssModules: false,
    cssDevSourcemap: false,
    postcss: false,
    optimizeDeps: '',
    define: '',
    envPrefix: 'VITE_',
    clearScreen: true,
    logLevel: 'info',
    libMode: true,
    libEntry: 'src/index.ts',
    libName: 'MyLib',
    libFileName: 'my-lib',
    libFormats: ['es', 'cjs'],
  },
  pwa: {
    label: { pt: 'PWA com Vite', en: 'Vite PWA' },
    fileType: 'ts',
    framework: 'react',
    plugins: ['@vitejs/plugin-react', 'vite-plugin-pwa'],
    base: '/',
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    port: 5173,
    open: false,
    proxy: '',
    hmr: true,
    alias: '{\n  "@/*": "./src/*"\n}',
    cssModules: false,
    cssDevSourcemap: true,
    postcss: false,
    optimizeDeps: '',
    define: '',
    envPrefix: 'VITE_',
    clearScreen: true,
    logLevel: 'info',
    libMode: false,
    libEntry: 'src/index.ts',
    libName: 'MyLib',
    libFileName: 'my-lib',
    libFormats: ['es', 'umd'],
  },
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    fileType: 'js',
    framework: 'vanilla',
    plugins: [],
    base: '/',
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    port: 5173,
    open: false,
    proxy: '',
    hmr: true,
    alias: '',
    cssModules: false,
    cssDevSourcemap: false,
    postcss: false,
    optimizeDeps: '',
    define: '',
    envPrefix: 'VITE_',
    clearScreen: true,
    logLevel: 'info',
    libMode: false,
    libEntry: 'src/index.ts',
    libName: 'MyLib',
    libFileName: 'my-lib',
    libFormats: ['es', 'umd'],
  },
}

function safeParseJson(value) {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

function collectImports(options) {
  const imports = []
  const pluginMap = new Map(PLUGINS.map((p) => [p.value, p]))

  if (options.plugins?.length) {
    options.plugins.forEach((value) => {
      const plugin = pluginMap.get(value)
      if (plugin) {
        imports.push({ name: plugin.importName, from: value })
      }
    })
  }

  // Desduplica por importName (mantém a primeira ocorrência)
  const seen = new Set()
  return imports.filter((imp) => {
    if (seen.has(imp.name)) return false
    seen.add(imp.name)
    return true
  })
}

function stringifyObject(obj, indent = 2) {
  return JSON.stringify(obj, null, indent)
}

function indent(text, spaces) {
  const pad = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line, idx) => (idx === 0 ? line : pad + line))
    .join('\n')
}

export function buildViteConfig(options) {
  const opts = { ...PRESETS.minimal, ...options }
  const imports = collectImports(opts)

  const lines = []
  lines.push("import { defineConfig } from 'vite'")
  imports.forEach((imp) => {
    lines.push(`import ${imp.name} from '${imp.from}'`)
  })
  lines.push('')
  lines.push('// https://vitejs.dev/config/')
  lines.push('export default defineConfig({')

  const fields = []

  if (opts.base && opts.base !== '/') {
    fields.push(`  base: ${JSON.stringify(opts.base)}`)
  }

  if (opts.envPrefix && opts.envPrefix !== 'VITE_') {
    fields.push(`  envPrefix: ${JSON.stringify(opts.envPrefix)}`)
  }

  if (opts.clearScreen === false) {
    fields.push('  clearScreen: false')
  }

  if (opts.logLevel && opts.logLevel !== 'info') {
    fields.push(`  logLevel: ${JSON.stringify(opts.logLevel)}`)
  }

  if (opts.define) {
    const define = safeParseJson(opts.define)
    if (define && Object.keys(define).length) {
      fields.push(`  define: ${stringifyObject(define, 2)}`)
    }
  }

  if (imports.length) {
    const callNames = imports.map((imp) => `${imp.name}()`)
    fields.push(`  plugins: [${callNames.join(', ')}]`)
  }

  const aliasObj = opts.alias ? safeParseJson(opts.alias) : null
  if (aliasObj && Object.keys(aliasObj).length) {
    fields.push(`  resolve: {\n    alias: ${indent(stringifyObject(aliasObj, 2), 4)}\n  }`)
  }

  const serverFields = []
  if (opts.port && Number(opts.port) !== 5173) {
    serverFields.push(`    port: ${Number(opts.port)}`)
  }
  if (opts.open) {
    serverFields.push('    open: true')
  }
  if (opts.hmr === false) {
    serverFields.push('    hmr: false')
  }
  if (opts.proxy) {
    const proxy = safeParseJson(opts.proxy)
    if (proxy && Object.keys(proxy).length) {
      serverFields.push(`    proxy: ${indent(stringifyObject(proxy, 2), 4)}`)
    }
  }
  if (serverFields.length) {
    fields.push(`  server: {\n${serverFields.join(',\n')}\n  }`)
  }

  const cssFields = []
  if (opts.cssModules) {
    cssFields.push('    modules: { localsConvention: "camelCaseOnly" }')
  }
  if (opts.cssDevSourcemap === false) {
    cssFields.push('    devSourcemap: false')
  }
  if (opts.postcss) {
    cssFields.push('    postcss: {}')
  }
  if (cssFields.length) {
    fields.push(`  css: {\n${cssFields.join(',\n')}\n  }`)
  }

  if (opts.optimizeDeps) {
    const deps = opts.optimizeDeps
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (deps.length) {
      fields.push(`  optimizeDeps: {\n    include: ${stringifyObject(deps)}\n  }`)
    }
  }

  const buildFields = []
  if (opts.outDir && opts.outDir !== 'dist') {
    buildFields.push(`    outDir: ${JSON.stringify(opts.outDir)}`)
  }
  if (opts.sourcemap) {
    buildFields.push('    sourcemap: true')
  }
  if (opts.minify === false || opts.minify === 'false') {
    buildFields.push('    minify: false')
  } else if (opts.minify && opts.minify !== 'esbuild') {
    buildFields.push(`    minify: ${JSON.stringify(opts.minify)}`)
  }

  if (opts.libMode) {
    const formats = Array.isArray(opts.libFormats) && opts.libFormats.length
      ? opts.libFormats
      : ['es', 'umd']
    buildFields.push(`    lib: {\n      entry: ${JSON.stringify(opts.libEntry || 'src/index.ts')},\n      name: ${JSON.stringify(opts.libName || 'MyLib')},\n      fileName: ${JSON.stringify(opts.libFileName || 'my-lib')},\n      formats: ${stringifyObject(formats)}\n    }`)
    if (!formats.includes('umd') && !formats.includes('iife')) {
      buildFields.push('    rollupOptions: {\n      output: {\n        // externalize peer dependencies here if needed\n      }\n    }')
    }
  }

  if (buildFields.length) {
    fields.push(`  build: {\n${buildFields.join(',\n')}\n  }`)
  }

  lines.push(fields.join(',\n'))
  lines.push('})')
  lines.push('')

  return lines.join('\n')
}
