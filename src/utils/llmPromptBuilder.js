/**
 * LLM Prompt Builder — 100% client-side.
 *
 * Monta prompts estruturados a partir de seções preenchidas pelo usuário,
 * seguindo o formato comum de persona/contexto/tarefa/exemplos/restrições/formato.
 * Inclui templates rápidos e uma estimativa simples de tokens.
 */

export const SECTIONS = [
  { key: 'role', labelPt: 'Papel / Persona', labelEn: 'Role / Persona', placeholderPt: 'ex.: você é um engenheiro sênior revisando código', placeholderEn: 'e.g., you are a senior engineer reviewing code' },
  { key: 'context', labelPt: 'Contexto', labelEn: 'Context', placeholderPt: 'Cole ou descreva o contexto necessário para a tarefa', placeholderEn: 'Paste or describe the context needed for the task' },
  { key: 'task', labelPt: 'Tarefa', labelEn: 'Task', placeholderPt: 'O que você quer que o modelo faça?', placeholderEn: 'What do you want the model to do?' },
  { key: 'examples', labelPt: 'Exemplos (few-shot)', labelEn: 'Examples (few-shot)', placeholderPt: 'Mostre exemplos de entrada e saída esperados', placeholderEn: 'Show expected input/output examples' },
  { key: 'constraints', labelPt: 'Restrições', labelEn: 'Constraints', placeholderPt: 'Liste limitações, regras ou o que evitar', placeholderEn: 'List limitations, rules or things to avoid' },
  { key: 'output', labelPt: 'Formato de saída', labelEn: 'Output format', placeholderPt: 'ex.: JSON, Markdown, tabela, lista numerada', placeholderEn: 'e.g., JSON, Markdown, table, numbered list' },
]

export const TEMPLATES = [
  {
    key: 'code-review',
    labelPt: 'Code review',
    labelEn: 'Code review',
    role: 'Você é um engenheiro de software sênior fazendo code review.',
    context: 'O código abaixo faz parte de uma aplicação web em React.',
    task: 'Analise o código, identifique bugs, problemas de performance, segurança e legibilidade, e sugira melhorias concretas.',
    examples: '',
    constraints: 'Não reescreva o código inteiro sem motivo. Use termos técnicos claros. Se houver risco de segurança, explique por quê.',
    output: 'Resposta em Markdown com seções: Problemas críticos, Melhorias sugeridas e Aprovado com ressalvas / Aprovado.',
  },
  {
    key: 'explain-code',
    labelPt: 'Explicar código',
    labelEn: 'Explain code',
    role: 'Você é um mentor técnico paciente e didático.',
    context: 'Trecho de código que precisa ser explicado para um desenvolvedor júnior.',
    task: 'Explique o que o código faz, linha a linha ou por blocos lógicos, e por que cada parte é necessária.',
    examples: '',
    constraints: 'Evite jargões desnecessários. Use analogias simples quando ajudar. Não suponha conhecimento avançado.',
    output: 'Markdown com uma visão geral curta e depois explicação detalhada por bloco.',
  },
  {
    key: 'generate-tests',
    labelPt: 'Gerar testes',
    labelEn: 'Generate tests',
    role: 'Você é um engenheiro de qualidade experiente.',
    context: 'Função ou componente que precisa de cobertura de testes.',
    task: 'Gere testes unitários cobrindo casos felizes, erros, valores limite e comportamentos assíncronos.',
    examples: '',
    constraints: 'Use apenas bibliotecas padrão ou as já citadas no contexto. Evite testes que dependam de estado externo.',
    output: 'Código dos testes pronto para copiar, com breve descrição de cada caso.',
  },
  {
    key: 'refactor',
    labelPt: 'Refatorar código',
    labelEn: 'Refactor code',
    role: 'Você é um especialista em código limpo e padrões de projeto.',
    context: 'Trecho de código que funciona, mas precisa ser melhorado.',
    task: 'Refatore o código para melhorar legibilidade, manutenibilidade e performance sem alterar o comportamento externo.',
    examples: '',
    constraints: 'Preserve a API pública. Não introduza dependências novas. Explique cada mudança importante.',
    output: 'Código refatorado seguido de lista de mudanças e o motivo de cada uma.',
  },
  {
    key: 'debug-error',
    labelPt: 'Debugar erro',
    labelEn: 'Debug error',
    role: 'Você é um engenheiro de suporte técnico especialista em investigar falhas.',
    context: 'Erro, stack trace ou comportamento inesperado observado em ambiente de desenvolvimento.',
    task: 'Identifique a causa provável do erro e proponha os próximos passos para confirmar e corrigir.',
    examples: '',
    constraints: 'Não afirme certezas sem evidências. Distinga hipóteses de conclusões. Sugira logs ou testes para validar.',
    output: 'Análise em Markdown: causa provável, próximos passos e correção sugerida.',
  },
  {
    key: 'readme',
    labelPt: 'Criar README',
    labelEn: 'Create README',
    role: 'Você é um technical writer que escreve READMEs objetivos.',
    context: 'Projeto de software cujo README precisa ser criado ou melhorado.',
    task: 'Escreva um README claro e completo para o projeto.',
    examples: '',
    constraints: 'Use emojis com moderação. Inclua instruções de instalação, uso, contribuição e licença quando fizer sentido.',
    output: 'Markdown pronto para colar no arquivo README.md.',
  },
  {
    key: 'email',
    labelPt: 'Escrever e-mail',
    labelEn: 'Write e-mail',
    role: 'Você é um assistente de comunicação profissional.',
    context: 'Situação que exige um e-mail formal ou semi-formal no ambiente de trabalho.',
    task: 'Escreva o corpo do e-mail de forma clara, educada e objetiva.',
    examples: '',
    constraints: 'Mantenha tom profissional. Evite linguagem excessivamente informal. Não invente dados que não foram fornecidos.',
    output: 'Texto do e-mail com assunto sugerido e corpo formatado.',
  },
]

function sectionTitle(label) {
  return `## ${label}\n`
}

export function buildPrompt(sections, lang) {
  const parts = []
  const order = ['role', 'context', 'task', 'examples', 'constraints', 'output']
  order.forEach((key) => {
    const section = SECTIONS.find((s) => s.key === key)
    const value = sections[key]
    if (value && String(value).trim()) {
      parts.push(`${sectionTitle(lang === 'pt' ? section.labelPt : section.labelEn)}${String(value).trim()}`)
    }
  })
  return parts.join('\n\n')
}

export function estimateTokens(text) {
  if (!text) return 0
  // Heurística rápida: ~4 caracteres por token para inglês/português misturado.
  // Limitada a uma estimativa conservadora.
  return Math.max(1, Math.ceil(text.length / 4))
}

export function applyTemplate(templateKey) {
  return TEMPLATES.find((t) => t.key === templateKey) || null
}

export const builderSource = `function buildPrompt(sections, lang) {
  const parts = []
  const order = ['role', 'context', 'task', 'examples', 'constraints', 'output']
  order.forEach((key) => {
    const section = SECTIONS.find((s) => s.key === key)
    const value = sections[key]
    if (value && String(value).trim()) {
      parts.push(\`## \${lang === 'pt' ? section.labelPt : section.labelEn}\n\${String(value).trim()}\`)
    }
  })
  return parts.join('\\n\\n')
}

export function estimateTokens(text) {
  if (!text) return 0
  // ~4 caracteres por token é uma heurística razoável para pt/en misturado.
  return Math.max(1, Math.ceil(text.length / 4))
}`
