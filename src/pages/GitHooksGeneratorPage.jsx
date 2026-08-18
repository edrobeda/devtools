import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Segmented,
  Checkbox,
  Button,
  Input,
  InputNumber,
  Switch,
  message,
  Collapse,
  Alert,
} from 'antd'
import {
  FileTextOutlined,
  CopyOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildScript,
  getChecksForHook,
  getDefaultConfig,
  getEngineSource,
  getHookDefaultConfig,
  getHooks,
  getPresets,
} from '../utils/gitHooksGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const translations = {
  pt: {
    title: 'Gerador de Git Hooks',
    intro: (
      <>
        Monte scripts <Text code>bash</Text> prontos para os hooks do Git —{' '}
        <Text code>pre-commit</Text>, <Text code>prepare-commit-msg</Text>,{' '}
        <Text code>commit-msg</Text> e <Text code>pre-push</Text>. Escolha o hook,
        as checagens e as opções e copie o script — tudo no navegador, nenhum dado sai.
      </>
    ),
    installTitle: 'Como instalar',
    installText: (
      <>
        Selecione o hook e copie o script para{' '}
        <Text code>.git/hooks/&lt;nome-do-hook&gt;</Text> e torne executável com{' '}
        <Text code>chmod +x .git/hooks/&lt;nome&gt;</Text>. Alternativa: versionar os
        scripts (ex.: em <Text code>.githooks/</Text>) e apontar{' '}
        <Text code>git config core.hooksPath .githooks</Text> para o time inteiro usar
        os mesmos hooks.
      </>
    ),
    hook: 'Hook',
    presets: 'Presets',
    checks: 'Checagens do pre-commit',
    checksHint: 'Selecione quais validações o script deve rodar nos arquivos staged.',
    options: 'Opções',
    lintCommand: 'Comando de lint',
    lintCommandHint: 'Rode nos arquivos staged de código (eslint, flake8, cargo clippy...).',
    formatCommand: 'Comando de format check',
    formatCommandHint: 'Modo --check do formatador (prettier, black, gofmt...).',
    testCommand: 'Comando de testes',
    maxMB: 'Tamanho máximo (MB)',
    maxMBHint: 'Arquivos maiores que isso bloqueiam o commit.',
    blockedFiles: 'Arquivos bloqueados (um por linha)',
    blockedFilesHint: 'Globs comparados com o basename do arquivo (ex.: .env*, *.pem, id_rsa).',
    enforceConventional: 'Exigir Conventional Commits',
    minLength: 'Tamanho mínimo do assunto',
    maxLength: 'Tamanho máximo do assunto',
    blockWip: 'Bloquear commits WIP/draft',
    conventionalPrefix: 'Adicionar prefixo do Conventional Commits pelo branch',
    appendIssue: 'Anexar (#número) pelo fim do branch',
    runTests: 'Rodar testes antes do push',
    runLint: 'Rodar lint antes do push',
    blockProtectedBranches: 'Bloquear push direto para main/master',
    output: 'Preview do script',
    stats: (lines, bytes) => `${lines} linhas · ${bytes} bytes`,
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar script',
    source: 'Código-fonte do motor',
    noChecks: 'Este hook não usa checagens selecionáveis — use as opções abaixo para configurar.',
  },
  en: {
    title: 'Git Hooks Generator',
    intro: (
      <>
        Build ready <Text code>bash</Text> scripts for Git hooks —{' '}
        <Text code>pre-commit</Text>, <Text code>prepare-commit-msg</Text>,{' '}
        <Text code>commit-msg</Text> and <Text code>pre-push</Text>. Pick the hook,
        the checks and the options, then copy the script — all in the browser, no data leaves.
      </>
    ),
    installTitle: 'How to install',
    installText: (
      <>
        Pick the hook and copy the script to{' '}
        <Text code>.git/hooks/&lt;hook-name&gt;</Text> and make it executable with{' '}
        <Text code>chmod +x .git/hooks/&lt;name&gt;</Text>. Alternative: version your
        scripts (e.g.: in <Text code>.githooks/</Text>) and point{' '}
        <Text code>git config core.hooksPath .githooks</Text> so the whole team uses
        the same hooks.
      </>
    ),
    hook: 'Hook',
    presets: 'Presets',
    checks: 'Pre-commit checks',
    checksHint: 'Select which validations the script should run on staged files.',
    options: 'Options',
    lintCommand: 'Lint command',
    lintCommandHint: 'Run on staged code files (eslint, flake8, cargo clippy...).',
    formatCommand: 'Format check command',
    formatCommandHint: 'The formatter in --check mode (prettier, black, gofmt...).',
    testCommand: 'Test command',
    maxMB: 'Max size (MB)',
    maxMBHint: 'Files larger than this block the commit.',
    blockedFiles: 'Blocked files (one per line)',
    blockedFilesHint: 'Globs matched against the file basename (e.g.: .env*, *.pem, id_rsa).',
    enforceConventional: 'Require Conventional Commits',
    minLength: 'Min subject length',
    maxLength: 'Max subject length',
    blockWip: 'Block WIP/draft commits',
    conventionalPrefix: 'Add Conventional Commits prefix from the branch',
    appendIssue: 'Append (#number) from the end of the branch',
    runTests: 'Run tests before pushing',
    runLint: 'Run lint before pushing',
    blockProtectedBranches: 'Block direct push to main/master',
    output: 'Script preview',
    stats: (lines, bytes) => `${lines} lines · ${bytes} bytes`,
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download script',
    source: 'Engine source code',
    noChecks: 'This hook does not use selectable checks — use the options below to configure it.',
  },
}

export default function GitHooksGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [config, setConfig] = useState(getDefaultConfig)

  const hooks = useMemo(() => getHooks(lang), [lang])
  const presets = useMemo(() => getPresets(lang), [lang])
  const checks = useMemo(() => getChecksForHook(config.hook, lang), [config.hook, lang])
  const output = useMemo(() => buildScript(config, lang), [config, lang])

  function setHook(value) {
    setConfig(getHookDefaultConfig(value))
  }

  function applyPreset(preset) {
    setConfig({
      ...getHookDefaultConfig(preset.config.hook),
      checks: [...preset.config.checks],
    })
  }

  function setOption(key, value) {
    setConfig((prev) => ({ ...prev, options: { ...prev.options, [key]: value } }))
  }

  function toggleCheck(key) {
    setConfig((prev) => {
      const has = prev.checks.includes(key)
      return {
        ...prev,
        checks: has ? prev.checks.filter((c) => c !== key) : [...prev.checks, key],
      }
    })
  }

  function handleCopy() {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  function handleDownload() {
    const blob = new Blob([output], { type: 'text/x-shellscript;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = config.hook
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => {
    const lines = output ? output.split('\n').length : 0
    const bytes = new Blob([output]).size
    return t.stats(lines, bytes)
  }, [output, t])

  const activeHook = hooks.find((h) => h.value === config.hook)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FileTextOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert message={t.installTitle} description={t.installText} type="info" showIcon />

      <Card title={t.hook}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Segmented
            block
            value={config.hook}
            onChange={setHook}
            options={hooks.map((h) => ({
              label: h.name,
              value: h.value,
            }))}
          />
          {activeHook && <Text type="secondary">{activeHook.desc}</Text>}
        </Space>
      </Card>

      <Card title={t.presets}>
        <Space wrap>
          {presets.map((preset) => (
            <Button key={preset.key} onClick={() => applyPreset(preset)}>
              {preset.name}
            </Button>
          ))}
        </Space>
      </Card>

      {config.hook === 'pre-commit' ? (
        <Card title={t.checks}>
          <Paragraph type="secondary">{t.checksHint}</Paragraph>
          <Checkbox.Group
            value={config.checks}
            onChange={(values) => setConfig((prev) => ({ ...prev, checks: values }))}
            options={checks.map((c) => ({
              label: (
                <span>
                  <strong>{c.name}</strong>
                  <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)' }}>
                    {c.desc}
                  </div>
                </span>
              ),
              value: c.key,
            }))}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          />
        </Card>
      ) : (
        <Paragraph type="secondary">{t.noChecks}</Paragraph>
      )}

      <Card title={t.options}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {config.hook === 'pre-commit' && config.checks.includes('lint') && (
            <div>
              <Text strong>{t.lintCommand}</Text>
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 6 }}>
                {t.lintCommandHint}
              </Paragraph>
              <Input
                value={config.options.lintCommand}
                onChange={(e) => setOption('lintCommand', e.target.value)}
              />
            </div>
          )}

          {config.hook === 'pre-commit' && config.checks.includes('formatCheck') && (
            <div>
              <Text strong>{t.formatCommand}</Text>
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 6 }}>
                {t.formatCommandHint}
              </Paragraph>
              <Input
                value={config.options.formatCommand}
                onChange={(e) => setOption('formatCommand', e.target.value)}
              />
            </div>
          )}

          {config.hook === 'pre-commit' && config.checks.includes('largeFiles') && (
            <div>
              <Text strong>{t.maxMB}</Text>
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 6 }}>
                {t.maxMBHint}
              </Paragraph>
              <InputNumber
                min={1}
                max={1024}
                value={config.options.maxMB}
                onChange={(v) => setOption('maxMB', v)}
              />
            </div>
          )}

          {config.hook === 'pre-commit' && config.checks.includes('blacklist') && (
            <div>
              <Text strong>{t.blockedFiles}</Text>
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 6 }}>
                {t.blockedFilesHint}
              </Paragraph>
              <TextArea
                rows={5}
                value={config.options.blockedFiles}
                onChange={(e) => setOption('blockedFiles', e.target.value)}
              />
            </div>
          )}

          {config.hook === 'commit-msg' && (
            <>
              <Space>
                <Switch
                  checked={config.options.enforceConventional}
                  onChange={(v) => setOption('enforceConventional', v)}
                />
                <Text>{t.enforceConventional}</Text>
              </Space>
              <Space>
                <Text>{t.minLength}</Text>
                <InputNumber
                  min={0}
                  max={500}
                  value={config.options.minLength}
                  onChange={(v) => setOption('minLength', v)}
                />
                <Text>{t.maxLength}</Text>
                <InputNumber
                  min={1}
                  max={500}
                  value={config.options.maxLength}
                  onChange={(v) => setOption('maxLength', v)}
                />
              </Space>
              <Space>
                <Switch
                  checked={config.options.blockWip}
                  onChange={(v) => setOption('blockWip', v)}
                />
                <Text>{t.blockWip}</Text>
              </Space>
            </>
          )}

          {config.hook === 'prepare-commit-msg' && (
            <>
              <Space>
                <Switch
                  checked={config.options.conventionalPrefix}
                  onChange={(v) => setOption('conventionalPrefix', v)}
                />
                <Text>{t.conventionalPrefix}</Text>
              </Space>
              <Space>
                <Switch
                  checked={config.options.appendIssue}
                  onChange={(v) => setOption('appendIssue', v)}
                />
                <Text>{t.appendIssue}</Text>
              </Space>
            </>
          )}

          {config.hook === 'pre-push' && (
            <>
              <Space>
                <Switch
                  checked={config.options.runTests}
                  onChange={(v) => setOption('runTests', v)}
                />
                <Text>{t.runTests}</Text>
              </Space>
              {config.options.runTests && (
                <Input
                  value={config.options.testCommand}
                  onChange={(e) => setOption('testCommand', e.target.value)}
                />
              )}
              <Space>
                <Switch
                  checked={config.options.runLint}
                  onChange={(v) => setOption('runLint', v)}
                />
                <Text>{t.runLint}</Text>
              </Space>
              {config.options.runLint && (
                <Input
                  value={config.options.lintCommand}
                  onChange={(e) => setOption('lintCommand', e.target.value)}
                />
              )}
              <Space>
                <Switch
                  checked={config.options.blockProtectedBranches}
                  onChange={(v) => setOption('blockProtectedBranches', v)}
                />
                <Text>{t.blockProtectedBranches}</Text>
              </Space>
            </>
          )}
        </Space>
      </Card>

      <Card
        title={t.output}
        extra={
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {stats}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>
              {t.copy}
            </Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload}>
              {t.download}
            </Button>
          </Space>
        }
      >
        <pre
          style={{
            margin: 0,
            overflowX: 'auto',
            maxHeight: 480,
            overflowY: 'auto',
            whiteSpace: 'pre',
          }}
        >
          <code>{output}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.source,
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{getEngineSource()}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}