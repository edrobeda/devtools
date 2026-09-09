import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, Select, Checkbox, Button, Row, Col, message, Tag, Collapse } from 'antd'
import { SearchOutlined, CopyOutlined, CodeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Construtor de Comando grep',
    intro: (
      <>
        Monte um comando <Text code>grep</Text> (ou <Text code>rg</Text> — ripgrep)
        interativamente: preencha os campos, veja o comando gerado ao vivo
        e copie com um clique. Sem executar nada, sem dados saindo do
        navegador.
      </>
    ),
    patternLabel: 'Padrão de busca',
    patternPlaceholder: 'ex: erro|warning|TODO',
    fileLabel: 'Arquivo / glob',
    filePlaceholder: 'ex: src/**/*.tsx',
    invertMatch: 'Inverter match (-v)',
    ignoreCase: 'Ignorar caixa (-i)',
    wholeWord: 'Palavra inteira (-w)',
    lineNumbers: 'Mostrar números de linha (-n)',
    countOnly: 'Contar matches (-c)',
    showFilenames: 'Mostrar nome do arquivo (-l)',
    contextLines: 'Linhas de contexto (-C)',
    contextValue: 'Linhas',
    regexType: 'Tipo de regex',
    regexERE: 'ERE (-E)',
    regexPCRE: 'PCRE (-P)',
    regexFixed: 'Literal (-F)',
    maxDepth: 'Profundidade máxima (--max-depth)',
    includePattern: 'Incluir (-I)',
    includePlaceholder: 'ex: *.js',
    excludePattern: 'Excluir (-I)',
    excludePlaceholder: 'ex: node_modules',
    colorMode: 'Cores',
    colorAuto: 'Sempre (--color=auto)',
    colorAlways: 'Sempre (--color=always)',
    colorNever: 'Nunca (--color=never)',
    colorNone: 'Sem cor',
    useRipgrep: 'Usar ripgrep (rg) em vez de grep',
    resultTitle: 'Comando gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    descriptionLabel: 'Explicação',
    copyAll: 'Copiar comando',
    presetLabel: 'Predefinições rápidas',
    presets: {
      errorLog: 'Erros em logs',
      todoFixme: 'TODO/FIXME no projeto',
      caseIp: 'IPs no log',
      jsx: 'JSX/TSX com erros',
      largeFiles: 'Arquivos grandes',
      userEmail: 'E-mails no código',
    },
    emptyPattern: 'Digite um padrão para ver o comando.',
  },
  en: {
    title: 'grep Command Builder',
    intro: (
      <>
        Build a <Text code>grep</Text> (or <Text code>rg</Text> — ripgrep)
        command interactively: fill in the fields, see the command generated
        in real time, and copy with one click. Nothing is executed, no data
        leaves the browser.
      </>
    ),
    patternLabel: 'Search pattern',
    patternPlaceholder: 'e.g. error|warning|TODO',
    fileLabel: 'File / glob',
    filePlaceholder: 'e.g. src/**/*.tsx',
    invertMatch: 'Invert match (-v)',
    ignoreCase: 'Case insensitive (-i)',
    wholeWord: 'Whole word (-w)',
    lineNumbers: 'Show line numbers (-n)',
    countOnly: 'Count matches (-c)',
    showFilenames: 'Show filenames (-l)',
    contextLines: 'Context lines (-C)',
    contextValue: 'Lines',
    regexType: 'Regex type',
    regexERE: 'ERE (-E)',
    regexPCRE: 'PCRE (-P)',
    regexFixed: 'Fixed (-F)',
    maxDepth: 'Max depth (--max-depth)',
    includePattern: 'Include (-I)',
    includePlaceholder: 'e.g. *.js',
    excludePattern: 'Exclude (-I)',
    excludePlaceholder: 'e.g. node_modules',
    colorMode: 'Color',
    colorAuto: 'Auto (--color=auto)',
    colorAlways: 'Always (--color=always)',
    colorNever: 'Never (--color=never)',
    colorNone: 'No color',
    useRipgrep: 'Use ripgrep (rg) instead of grep',
    resultTitle: 'Generated command',
    copy: 'Copy',
    copied: 'Copied!',
    descriptionLabel: 'Explanation',
    copyAll: 'Copy command',
    presetLabel: 'Quick presets',
    presets: {
      errorLog: 'Errors in logs',
      todoFixme: 'TODO/FIXME in project',
      caseIp: 'IPs in log',
      jsx: 'JSX/TSX with errors',
      largeFiles: 'Large files',
      userEmail: 'E-mails in code',
    },
    emptyPattern: 'Type a pattern to see the command.',
  },
}

function shellEscape(s) {
  if (!s) return ''
  if (/^[a-zA-Z0-9._/\-*?{}\[\]~#@^+=:,]+$/.test(s)) return s
  return "'" + s.replace(/'/g, "'\\''") + "'"
}

function buildGrepCommand(opts, lang) {
  const t = translations[lang]
  const cmd = opts.useRipgrep ? 'rg' : 'grep'
  const flags = []

  if (opts.regexType === 'ERE') flags.push('-E')
  else if (opts.regexType === 'PCRE') flags.push('-P')
  else if (opts.regexType === 'Fixed') flags.push('-F')

  if (opts.ignoreCase) flags.push('-i')
  if (opts.invertMatch) flags.push('-v')
  if (opts.wholeWord) flags.push('-w')
  if (opts.lineNumbers) flags.push('-n')
  if (opts.countOnly) flags.push('-c')
  if (opts.showFilenames) flags.push('-l')
  if (opts.contextLines > 0) flags.push(`-C ${opts.contextLines}`)
  if (opts.maxDepth > 0) flags.push(`--max-depth ${opts.maxDepth}`)

  if (opts.colorMode !== 'none') {
    flags.push(`--color=${opts.colorMode}`)
  }

  const parts = [cmd, ...flags]

  if (opts.pattern) parts.push(shellEscape(opts.pattern))

  if (opts.include) parts.push(`--include=${shellEscape(opts.include)}`)
  if (opts.exclude) parts.push(`--exclude=${shellEscape(opts.exclude)}`)
  if (opts.file) parts.push(shellEscape(opts.file))

  return parts.join(' ')
}

function describeCommand(opts, lang) {
  const parts = []
  const cmd = opts.useRipgrep ? 'rg' : 'grep'

  parts.push(lang === 'pt' ? `Executa \`${cmd}\`` : `Runs \`${cmd}\``)

  if (opts.pattern) {
    parts.push(
      lang === 'pt'
        ? `com o padrão \`${opts.pattern}\``
        : `with the pattern \`${opts.pattern}\``
    )
  }

  const features = []
  if (opts.ignoreCase) features.push(lang === 'pt' ? 'ignorando caixa' : 'case insensitive')
  if (opts.invertMatch) features.push(lang === 'pt' ? 'inverte o match (mostra linhas que NÃO combinam)' : 'inverts the match (shows lines that do NOT match)')
  if (opts.wholeWord) features.push(lang === 'pt' ? 'só palavras inteiras' : 'whole words only')
  if (opts.lineNumbers) features.push(lang === 'pt' ? 'com número de linha' : 'with line numbers')
  if (opts.countOnly) features.push(lang === 'pt' ? 'conta matches (não mostra linhas)' : 'counts matches (does not show lines)')
  if (opts.showFilenames) features.push(lang === 'pt' ? 'mostra só nomes dos arquivos' : 'shows filenames only')
  if (opts.contextLines > 0) features.push(
    lang === 'pt'
      ? `${opts.contextLines} linha(s) de contexto antes e depois`
      : `${opts.contextLines} line(s) of context before and after`
  )
  if (opts.maxDepth > 0) features.push(
    lang === 'pt'
      ? `profundidade máxima ${opts.maxDepth}`
      : `max depth ${opts.maxDepth}`
  )
  if (opts.regexType === 'ERE') features.push(lang === 'pt' ? 'regex estendida (ERE)' : 'extended regex (ERE)')
  else if (opts.regexType === 'PCRE') features.push(lang === 'pt' ? 'regex PCRE (lookaheads etc.)' : 'PCRE regex (lookaheads etc.)')
  else if (opts.regexType === 'Fixed') features.push(lang === 'pt' ? 'string literal (sem regex)' : 'literal string (no regex)')

  if (features.length > 0) {
    parts.push(lang === 'pt' ? 'com' : 'with')
    parts.push(features.join(', '))
  }

  if (opts.file) {
    parts.push(
      lang === 'pt'
        ? `nos arquivos \`${opts.file}\``
        : `in files \`${opts.file}\``
    )
  }

  if (opts.include) {
    parts.push(
      lang === 'pt'
        ? `incluindo \`${opts.include}\``
        : `including \`${opts.include}\``
    )
  }
  if (opts.exclude) {
    parts.push(
      lang === 'pt'
        ? `excluindo \`${opts.exclude}\``
        : `excluding \`${opts.exclude}\``
    )
  }

  return parts.join(' ') + '.'
}

const PRESETS = {
  errorLog: (lang) => ({
    pattern: 'ERROR|FATAL|Exception',
    file: '*.log',
    ignoreCase: true,
    lineNumbers: true,
    colorMode: 'auto',
    useRipgrep: false,
    regexType: 'ERE',
  }),
  todoFixme: (lang) => ({
    pattern: 'TODO|FIXME|HACK|XXX',
    file: 'src/**/*.{js,ts,tsx,jsx}',
    lineNumbers: true,
    colorMode: 'auto',
    useRipgrep: false,
    regexType: 'ERE',
  }),
  caseIp: (lang) => ({
    pattern: '\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b',
    file: '/var/log/*.log',
    lineNumbers: true,
    colorMode: 'auto',
    useRipgrep: false,
    regexType: 'ERE',
  }),
  jsx: (lang) => ({
    pattern: 'TypeError|ReferenceError|SyntaxError',
    file: 'src/**/*.{tsx,jsx}',
    lineNumbers: true,
    contextLines: 2,
    colorMode: 'auto',
    useRipgrep: false,
    regexType: 'ERE',
  }),
  largeFiles: (lang) => ({
    pattern: '.',
    file: '.',
    showFilenames: true,
    colorMode: 'none',
    useRipgrep: false,
    regexType: 'ERE',
  }),
  userEmail: (lang) => ({
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    file: 'src/**/*.{js,ts,tsx,jsx,json}',
    lineNumbers: true,
    colorMode: 'auto',
    useRipgrep: false,
    regexType: 'ERE',
  }),
}

const DEFAULT_OPTS = {
  pattern: '',
  file: '',
  invertMatch: false,
  ignoreCase: false,
  wholeWord: false,
  lineNumbers: true,
  countOnly: false,
  showFilenames: false,
  contextLines: 0,
  regexType: 'ERE',
  maxDepth: 0,
  include: '',
  exclude: '',
  colorMode: 'auto',
  useRipgrep: false,
}

export default function GrepCommandBuilderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [opts, setOpts] = useState(DEFAULT_OPTS)

  const update = useCallback((key, val) => {
    setOpts((prev) => ({ ...prev, [key]: val }))
  }, [])

  const command = useMemo(() => {
    if (!opts.pattern) return ''
    return buildGrepCommand(opts, lang)
  }, [opts, lang])

  const description = useMemo(() => {
    if (!opts.pattern) return ''
    return describeCommand(opts, lang)
  }, [opts, lang])

  const handleCopy = useCallback(() => {
    if (!command) return
    navigator.clipboard.writeText(command).then(() => {
      message.success(t.copied)
    })
  }, [command, t.copied])

  const applyPreset = useCallback(
    (key) => {
      const preset = PRESETS[key]
      if (!preset) return
      setOpts({ ...DEFAULT_OPTS, ...preset(lang) })
    },
    [lang]
  )

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <SearchOutlined style={{ marginRight: 8 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Card title={t.presetLabel}>
        <Space wrap>
          {Object.keys(PRESETS).map((key) => (
            <Button key={key} size="small" onClick={() => applyPreset(key)}>
              {t.presets[key]}
            </Button>
          ))}
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t.patternLabel}</Text>
            <Input
              placeholder={t.patternPlaceholder}
              value={opts.pattern}
              onChange={(e) => update('pattern', e.target.value)}
              style={{ marginTop: 4 }}
              prefix={<SearchOutlined />}
            />
          </div>
          <div>
            <Text strong>{t.fileLabel}</Text>
            <Input
              placeholder={t.filePlaceholder}
              value={opts.file}
              onChange={(e) => update('file', e.target.value)}
              style={{ marginTop: 4 }}
              prefix={<FileTextOutlined />}
            />
          </div>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12} md={8}>
              <Checkbox checked={opts.useRipgrep} onChange={(e) => update('useRipgrep', e.target.checked)}>
                {t.useRipgrep}
              </Checkbox>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Checkbox checked={opts.ignoreCase} onChange={(e) => update('ignoreCase', e.target.checked)}>
                {t.ignoreCase}
              </Checkbox>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Checkbox checked={opts.invertMatch} onChange={(e) => update('invertMatch', e.target.checked)}>
                {t.invertMatch}
              </Checkbox>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Checkbox checked={opts.wholeWord} onChange={(e) => update('wholeWord', e.target.checked)}>
                {t.wholeWord}
              </Checkbox>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Checkbox checked={opts.lineNumbers} onChange={(e) => update('lineNumbers', e.target.checked)}>
                {t.lineNumbers}
              </Checkbox>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Checkbox checked={opts.countOnly} onChange={(e) => update('countOnly', e.target.checked)}>
                {t.countOnly}
              </Checkbox>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Checkbox checked={opts.showFilenames} onChange={(e) => update('showFilenames', e.target.checked)}>
                {t.showFilenames}
              </Checkbox>
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Text strong>{t.regexType}</Text>
              <Select
                value={opts.regexType}
                onChange={(val) => update('regexType', val)}
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { value: 'ERE', label: t.regexERE },
                  { value: 'PCRE', label: t.regexPCRE },
                  { value: 'Fixed', label: t.regexFixed },
                ]}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>{t.colorMode}</Text>
              <Select
                value={opts.colorMode}
                onChange={(val) => update('colorMode', val)}
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { value: 'auto', label: t.colorAuto },
                  { value: 'always', label: t.colorAlways },
                  { value: 'never', label: t.colorNever },
                  { value: 'none', label: t.colorNone },
                ]}
              />
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Text strong>{t.contextLines}</Text>
              <Select
                value={opts.contextLines}
                onChange={(val) => update('contextLines', val)}
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { value: 0, label: lang === 'pt' ? 'Nenhuma' : 'None' },
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>{t.maxDepth}</Text>
              <Select
                value={opts.maxDepth}
                onChange={(val) => update('maxDepth', val)}
                style={{ width: '100%', marginTop: 4 }}
                options={[
                  { value: 0, label: lang === 'pt' ? 'Sem limite' : 'No limit' },
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                ]}
              />
            </Col>
          </Row>

          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12}>
              <Text strong>{t.includePattern}</Text>
              <Input
                placeholder={t.includePlaceholder}
                value={opts.include}
                onChange={(e) => update('include', e.target.value)}
                style={{ marginTop: 4 }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Text strong>{t.excludePattern}</Text>
              <Input
                placeholder={t.excludePlaceholder}
                value={opts.exclude}
                onChange={(e) => update('exclude', e.target.value)}
                style={{ marginTop: 4 }}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      {command ? (
        <>
          <Card
            title={t.resultTitle}
            extra={
              <Button icon={<CopyOutlined />} onClick={handleCopy}>
                {t.copyAll}
              </Button>
            }
          >
            <pre
              style={{
                background: '#1e1e1e',
                color: '#d4d4d4',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 14,
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                margin: 0,
              }}
            >
              {command}
            </pre>
          </Card>

          <Card title={t.descriptionLabel}>
            <Paragraph style={{ margin: 0 }}>{description}</Paragraph>
          </Card>
        </>
      ) : (
        <Card>
          <Text type="secondary">{t.emptyPattern}</Text>
        </Card>
      )}
    </Space>
  )
}
