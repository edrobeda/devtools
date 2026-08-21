export function generateEnvExample(entries) {
  const lines = [
    '# Environment variables example',
    '# Copy this file to .env and fill in your values',
    '',
  ]
  entries.forEach((e) => {
    if (e.description) {
      lines.push(`# ${e.description}`)
    }
    if (e.required === false) {
      lines.push(`# Optional`)
    }
    const val = e.example !== undefined ? e.example : (e.value || '')
    lines.push(`${e.key}=${val}`)
    lines.push('')
  })
  return lines.join('\n').trim() + '\n'
}

export function generateJsonSchema(entries) {
  const properties = {}
  const required = []
  entries.forEach((e) => {
    const prop = { type: 'string' }
    if (e.description) prop.description = e.description
    if (e.example !== undefined) prop.examples = [e.example]
    if (e.pattern) prop.pattern = e.pattern
    if (e.enum && e.enum.length) prop.enum = e.enum
    if (e.format) prop.format = e.format
    properties[e.key] = prop
    if (e.required !== false) required.push(e.key)
  })
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    additionalProperties: false,
    properties,
    required,
  }
}

export function generateTypescriptInterface(entries, interfaceName = 'EnvConfig') {
  const lines = [
    `export interface ${interfaceName} {`,
  ]
  entries.forEach((e) => {
    const desc = e.description ? `  /** ${e.description} */\n` : ''
    const optional = e.required === false ? '?' : ''
    const example = e.example !== undefined ? `  // Example: ${e.example}\n` : ''
    lines.push(`${desc}${example}  ${e.key}${optional}: string;`)
  })
  lines.push('}')
  return lines.join('\n')
}

export function generateZodSchema(entries, schemaName = 'envSchema') {
  const lines = [
    `import { z } from 'zod';`,
    ``,
    `export const ${schemaName} = z.object({`,
  ]
  entries.forEach((e) => {
    let validator = `z.string()`
    if (e.description) validator += `.describe(${JSON.stringify(e.description)})`
    if (e.pattern) validator += `.regex(/${e.pattern}/)`
    if (e.enum && e.enum.length) validator += `.enum(${JSON.stringify(e.enum)})`
    if (e.format === 'email') validator += `.email()`
    if (e.format === 'url') validator += `.url()`
    if (e.format === 'uuid') validator += `.uuid()`
    if (e.required === false) validator += `.optional()`
    const comment = e.example !== undefined ? `  // Example: ${e.example}` : ''
    lines.push(`  ${e.key}: ${validator},${comment}`)
  })
  lines.push('})')
  lines.push('')
  lines.push(`export type ${schemaName.replace(/Schema$/, '')} = z.infer<typeof ${schemaName}>;`)
  return lines.join('\n')
}

export function generateMarkdownDocs(entries) {
  const lines = [
    '# Environment Variables',
    '',
    '| Variable | Required | Description | Example |',
    '|----------|:--------:|-------------|---------|',
  ]
  entries.forEach((e) => {
    const req = e.required === false ? 'No' : 'Yes'
    const desc = e.description || ''
    const ex = e.example !== undefined ? `\`${e.example}\`` : ''
    lines.push(`| \`${e.key}\` | ${req} | ${desc} | ${ex} |`)
  })
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('## Usage')
  lines.push('')
  lines.push('Copy `.env.example` to `.env` and fill in your values:')
  lines.push('')
  lines.push('```bash')
  lines.push('cp .env.example .env')
  lines.push('```')
  return lines.join('\n')
}

export function generateValidationScript(entries, schemaName = 'envSchema') {
  const lines = [
    `#!/usr/bin/env node`,
    `// Auto-generated environment validation script`,
    `// Run with: node validate-env.js`,
    ``,
    `import { ${schemaName} } from './${schemaName.toLowerCase()}.js';`,
    `import { readFileSync } from 'fs';`,
    `import { parse } from 'dotenv';`,
    ``,
    `function loadEnv() {`,
    `  try {`,
    `    const content = readFileSync('.env', 'utf-8');`,
    `    return parse(content);`,
    `  } catch {`,
    `    return {};`,
    `  }`,
    `}`,
    ``,
    `const env = loadEnv();`,
    `const result = ${schemaName}.safeParse(env);`,
    ``,
    `if (!result.success) {`,
    `  console.error('❌ Invalid environment configuration:');`,
    `  result.error.issues.forEach((issue) => {`,
    `    console.error(\`  \${issue.path.join('.')}: \${issue.message}\`);`,
    `  });`,
    `  process.exit(1);`,
    `}`,
    ``,
    `console.log('✅ Environment configuration is valid');`,
    `// Access validated config as: result.data`,
  ]
  return lines.join('\n')
}

export function generateAllOutputs(entries) {
  return {
    envExample: generateEnvExample(entries),
    jsonSchema: JSON.stringify(generateJsonSchema(entries), null, 2),
    typescript: generateTypescriptInterface(entries),
    zod: generateZodSchema(entries),
    markdown: generateMarkdownDocs(entries),
    validationScript: generateValidationScript(entries),
  }
}