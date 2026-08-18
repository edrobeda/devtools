const SECTIONS = {
  description: {
    key: 'description',
    name: { pt: 'Descrição', en: 'Description' },
    hint: {
      pt: 'O que esta PR faz? Por que ela existe?',
      en: 'What does this PR do? Why does it exist?',
    },
    placeholder: {
      pt: 'Descreva brevemente a mudança e a motivação.',
      en: 'Briefly describe the change and the motivation.',
    },
  },
  typeOfChange: {
    key: 'typeOfChange',
    name: { pt: 'Tipo de mudança', en: 'Type of change' },
    hint: {
      pt: 'Marque o tipo de mudança introduzida.',
      en: 'Check the type of change introduced.',
    },
    options: {
      pt: ['Bugfix', 'Feature', 'Melhoria', 'Refatoração', 'Documentação', 'Testes', 'Hotfix', 'Breaking change'],
      en: ['Bugfix', 'Feature', 'Improvement', 'Refactoring', 'Documentation', 'Tests', 'Hotfix', 'Breaking change'],
    },
  },
  relatedIssue: {
    key: 'relatedIssue',
    name: { pt: 'Issue relacionada', en: 'Related issue' },
    hint: {
      pt: 'Link ou referência da issue/ticket.',
      en: 'Link or reference to the issue/ticket.',
    },
    placeholder: {
      pt: 'Closes #123',
      en: 'Closes #123',
    },
  },
  changes: {
    key: 'changes',
    name: { pt: 'Principais alterações', en: 'Main changes' },
    hint: {
      pt: 'Liste o que foi modificado em tópicos.',
      en: 'List what was changed in bullet points.',
    },
    placeholder: {
      pt: '- Adiciona ...\n- Corrige ...\n- Remove ...',
      en: '- Adds ...\n- Fixes ...\n- Removes ...',
    },
  },
  testing: {
    key: 'testing',
    name: { pt: 'Como testar', en: 'How to test' },
    hint: {
      pt: 'Passos para validar a mudança.',
      en: 'Steps to validate the change.',
    },
    placeholder: {
      pt: '1. ...\n2. ...\n3. ...',
      en: '1. ...\n2. ...\n3. ...',
    },
  },
  checklist: {
    key: 'checklist',
    name: { pt: 'Checklist', en: 'Checklist' },
    hint: {
      pt: 'Itens de qualidade a verificar antes de mergear.',
      en: 'Quality items to check before merging.',
    },
    options: {
      pt: [
        'Código compila / build passa',
        'Testes foram adicionados ou atualizados',
        'Não há regressões visíveis',
        'Documentação foi atualizada',
        'Revisão de código foi feita',
      ],
      en: [
        'Code compiles / build passes',
        'Tests were added or updated',
        'No visible regressions',
        'Documentation was updated',
        'Code review was performed',
      ],
    },
  },
  screenshots: {
    key: 'screenshots',
    name: { pt: 'Screenshots / Evidências', en: 'Screenshots / Evidence' },
    hint: {
      pt: 'Adicione imagens, GIFs ou logs quando relevante.',
      en: 'Add images, GIFs or logs when relevant.',
    },
    placeholder: {
      pt: '<!-- Cole aqui imagens ou links -->',
      en: '<!-- Paste images or links here -->',
    },
  },
  breakingChanges: {
    key: 'breakingChanges',
    name: { pt: 'Breaking changes', en: 'Breaking changes' },
    hint: {
      pt: 'Descreva mudanças incompatíveis com versões anteriores.',
      en: 'Describe changes that are not backward compatible.',
    },
    placeholder: {
      pt: 'Nenhuma.\n<!-- ou descreva o impacto e migração -->',
      en: 'None.\n<!-- or describe impact and migration -->',
    },
  },
  notes: {
    key: 'notes',
    name: { pt: 'Notas adicionais', en: 'Additional notes' },
    hint: {
      pt: 'Observações para quem for revisar.',
      en: 'Notes for the reviewer.',
    },
    placeholder: {
      pt: 'Pontos de atenção, dependências pendentes, etc.',
      en: 'Things to watch out for, pending dependencies, etc.',
    },
  },
}

const PRESETS = {
  default: {
    name: { pt: 'Padrão', en: 'Default' },
    description: { pt: 'Template equilibrado para a maioria das PRs.', en: 'Balanced template for most PRs.' },
    sections: ['description', 'typeOfChange', 'relatedIssue', 'changes', 'testing', 'checklist', 'screenshots', 'notes'],
    selectedTypes: [],
    selectedChecklist: [],
  },
  feature: {
    name: { pt: 'Nova feature', en: 'New feature' },
    description: { pt: 'Focado em descrever uma nova funcionalidade.', en: 'Focused on describing a new feature.' },
    sections: ['description', 'typeOfChange', 'relatedIssue', 'changes', 'testing', 'checklist', 'screenshots', 'breakingChanges', 'notes'],
    selectedTypes: ['Feature'],
    selectedChecklist: [0, 1, 3],
  },
  bugfix: {
    name: { pt: 'Bugfix', en: 'Bugfix' },
    description: { pt: 'Para correções de bug com reprodução e validação.', en: 'For bug fixes with reproduction and validation.' },
    sections: ['description', 'relatedIssue', 'changes', 'testing', 'checklist', 'screenshots', 'notes'],
    selectedTypes: ['Bugfix'],
    selectedChecklist: [0, 1, 2],
  },
  hotfix: {
    name: { pt: 'Hotfix', en: 'Hotfix' },
    description: { pt: 'Template enxuto para correções urgentes.', en: 'Lean template for urgent fixes.' },
    sections: ['description', 'typeOfChange', 'relatedIssue', 'changes', 'testing', 'checklist', 'notes'],
    selectedTypes: ['Hotfix'],
    selectedChecklist: [0, 2, 4],
  },
  release: {
    name: { pt: 'Release', en: 'Release' },
    description: { pt: 'Para PRs de release com changelog e versão.', en: 'For release PRs with changelog and version.' },
    sections: ['description', 'changes', 'testing', 'checklist', 'breakingChanges', 'notes'],
    selectedTypes: [],
    selectedChecklist: [0, 1, 2, 3, 4],
  },
  docs: {
    name: { pt: 'Documentação', en: 'Documentation' },
    description: { pt: 'Para atualizações de README, docs ou comentários.', en: 'For README, docs or comments updates.' },
    sections: ['description', 'typeOfChange', 'relatedIssue', 'changes', 'checklist', 'screenshots', 'notes'],
    selectedTypes: ['Documentação'],
    selectedChecklist: [3, 4],
  },
  minimal: {
    name: { pt: 'Mínimo', en: 'Minimal' },
    description: { pt: 'Apenas o essencial.', en: 'Just the essentials.' },
    sections: ['description', 'changes', 'checklist'],
    selectedTypes: [],
    selectedChecklist: [0, 4],
  },
}

export function getSections(lang) {
  return Object.values(SECTIONS).map((section) => ({
    key: section.key,
    name: section.name[lang] || section.name.en,
    hint: section.hint[lang] || section.hint.en,
    placeholder: section.placeholder ? (section.placeholder[lang] || section.placeholder.en) : undefined,
    options: section.options ? (section.options[lang] || section.options.en) : undefined,
  }))
}

export function getPresets(lang) {
  return Object.entries(PRESETS).map(([key, preset]) => ({
    key,
    name: preset.name[lang] || preset.name.en,
    description: preset.description[lang] || preset.description.en,
    sections: preset.sections,
    selectedTypes: preset.selectedTypes,
    selectedChecklist: preset.selectedChecklist,
  }))
}

export function getDefaultConfig() {
  const preset = PRESETS.default
  return {
    selectedSections: [...preset.sections],
    typeOfChange: [...preset.selectedTypes],
    checklist: [...preset.selectedChecklist],
  }
}

export function buildTemplate(config, lang) {
  const { selectedSections, typeOfChange, checklist } = config
  const lines = []
  const sections = getSections(lang)

  selectedSections.forEach((sectionKey) => {
    const section = sections.find((s) => s.key === sectionKey)
    if (!section) return

    lines.push(`## ${section.name}`)
    lines.push('')

    if (sectionKey === 'typeOfChange' && section.options) {
      lines.push('<!--')
      lines.push(section.hint)
      lines.push('-->')
      lines.push('')
      section.options.forEach((option) => {
        const checked = typeOfChange.includes(option) ? 'x' : ' '
        lines.push(`- [${checked}] ${option}`)
      })
      lines.push('')
    } else if (sectionKey === 'checklist' && section.options) {
      lines.push('<!--')
      lines.push(section.hint)
      lines.push('-->')
      lines.push('')
      section.options.forEach((option, index) => {
        const checked = checklist.includes(index) ? 'x' : ' '
        lines.push(`- [${checked}] ${option}`)
      })
      lines.push('')
    } else {
      lines.push(section.placeholder || '')
      lines.push('')
    }
  })

  return lines.join('\n').trim()
}

export function getEngineSource() {
  return [
    "const SECTIONS = {",
    "  description: {",
    "    key: 'description',",
    "    name: { pt: 'Descrição', en: 'Description' },",
    "    hint: { pt: '...', en: '...' },",
    "    placeholder: { pt: '...', en: '...' },",
    "  },",
    "  // ... outras seções",
    "}",
    "",
    "export function buildTemplate(config, lang) {",
    "  const { selectedSections, typeOfChange, checklist } = config",
    "  const lines = []",
    "  const sections = getSections(lang)",
    "",
    "  selectedSections.forEach((sectionKey) => {",
    "    const section = sections.find((s) => s.key === sectionKey)",
    "    if (!section) return",
    "",
    "    lines.push('## ' + section.name)",
    "    lines.push('')",
    "",
    "    if (sectionKey === 'typeOfChange' && section.options) {",
    "      section.options.forEach((option) => {",
    "        const checked = typeOfChange.includes(option) ? 'x' : ' '",
    "        lines.push('- [' + checked + '] ' + option)",
    "      })",
    "      lines.push('')",
    "    } else if (sectionKey === 'checklist' && section.options) {",
    "      section.options.forEach((option, index) => {",
    "        const checked = checklist.includes(index) ? 'x' : ' '",
    "        lines.push('- [' + checked + '] ' + option)",
    "      })",
    "      lines.push('')",
    "    } else {",
    "      lines.push(section.placeholder || '')",
    "      lines.push('')",
    "    }",
    "  })",
    "",
    "  return lines.join('\\n').trim()",
    "}",
  ].join('\n')
}
