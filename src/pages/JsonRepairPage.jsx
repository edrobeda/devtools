import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Input, Space, Button, Alert, message, Collapse, Tag } from 'antd'
import { FileTextOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SAMPLE = `{
  // Configuração do app
  "name": "meu-app",
  'version': '1.0.0',
  "dependencies": {
    "react": "^18.2.0",
    "antd": "^5.12.0",
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
  },
  "features": [true, false, undefined, NaN, Infinity],
  "empty": ,
}`

const translations = {
  pt: {
    title: 'Consertador de JSON',
    intro: (
      <>
        Cole um JSON quebrado — com vírgulas extras, aspas simples, chaves sem
        aspas, comentários, <Text code>undefined</Text>, <Text code>NaN</Text> etc.
        — e a ferramenta tenta consertar automaticamente. Tudo roda no navegador,
        nenhum dado sai daqui.
      </>
    ),
    inputLabel: 'JSON de entrada (pode estar quebrado)',
    inputPlaceholder: 'Cole aqui o JSON quebrado...',
    repair: 'Consertar JSON',
    outputLabel: 'JSON consertado',
    outputPlaceholder: 'O JSON consertado aparecerá aqui...',
    copy: 'Copiar resultado',
    copied: 'Copiado!',
    fixesApplied: 'Consertos aplicados',
    fixTrailingCommas: 'Vírgulas finais removidas',
    fixSingleQuotes: 'Aspas simples substituídas por duplas',
    fixComments: 'Comentários removidos',
    fixUnquotedKeys: 'Chaves sem aspas citadas',
    fixUnquotedValues: 'Valores sem aspas citados',
    fixSpecialValues: 'Valores especiais substituídos (NaN, Infinity, undefined)',
    fixEmptyValues: 'Valores vazios substituídos por null',
    fixBom: 'BOM (byte order mark) removido',
    fixNewlines: 'Quebras de linha CRLF normalizadas',
    successTitle: 'JSON consertado com sucesso!',
    alreadyValid: 'O JSON já é válido — nenhuma correção necessária.',
    errorTitle: 'Não foi possível consertar',
    errorDesc: 'O JSON tem erros que não puderam ser corrigidos automaticamente. Verifique a sintaxe manualmente.',
    sample: 'Exemplo',
    clear: 'Limpar',
    fixesTitle: 'O que este instrumento conserta',
    fixesDesc: 'Clique para expandir',
    helpTrailing: 'Objetos/arrays com vírgula antes do fechamento: { "a": 1, }',
    helpSingleQuotes: 'Strings com aspas simples em vez de duplas: { \'key\': \'value\' }',
    helpComments: 'Comentários de linha (// ...) e de bloco (/* ... */)',
    helpUnquotedKeys: 'Chaves sem aspas: { key: "value" }',
    helpUnquotedValues: 'Valores não-booleanos/null/numéricos sem aspas',
    helpSpecialValues: 'NaN, Infinity, -Infinity e undefined do JavaScript',
    helpEmptyValues: 'Valores ausentes antes de vírgula ou fechamento',
  },
  en: {
    title: 'JSON Repair Tool',
    intro: (
      <>
        Paste broken JSON — with trailing commas, single quotes, unquoted keys,
        comments, <Text code>undefined</Text>, <Text code>NaN</Text>,{' '}
        <Text code>Infinity</Text> etc. — and the tool tries to fix it automatically.
        Everything runs in the browser, no data leaves.
      </>
    ),
    inputLabel: 'Input JSON (may be broken)',
    inputPlaceholder: 'Paste broken JSON here...',
    repair: 'Repair JSON',
    outputLabel: 'Repaired JSON',
    outputPlaceholder: 'Repaired JSON will appear here...',
    copy: 'Copy result',
    copied: 'Copied!',
    fixesApplied: 'Fixes applied',
    fixTrailingCommas: 'Trailing commas removed',
    fixSingleQuotes: 'Single quotes replaced with double quotes',
    fixComments: 'Comments removed',
    fixUnquotedKeys: 'Unquoted keys quoted',
    fixUnquotedValues: 'Unquoted values quoted',
    fixSpecialValues: 'Special values replaced (NaN, Infinity, undefined)',
    fixEmptyValues: 'Empty values replaced with null',
    fixBom: 'BOM (byte order mark) removed',
    fixNewlines: 'CRLF newlines normalized',
    successTitle: 'JSON repaired successfully!',
    alreadyValid: 'The JSON is already valid — no fixes needed.',
    errorTitle: 'Could not repair',
    errorDesc: 'The JSON has errors that could not be automatically fixed. Check the syntax manually.',
    sample: 'Example',
    clear: 'Clear',
    fixesTitle: 'What this tool fixes',
    fixesDesc: 'Click to expand',
    helpTrailing: 'Objects/arrays with trailing comma before closing: { "a": 1, }',
    helpSingleQuotes: 'Strings with single quotes instead of double: { \'key\': \'value\' }',
    helpComments: 'Line comments (// ...) and block comments (/* ... */)',
    helpUnquotedKeys: 'Keys without quotes: { key: "value" }',
    helpUnquotedValues: 'Non-boolean/null/numeric values without quotes',
    helpSpecialValues: 'JavaScript NaN, Infinity, -Infinity and undefined',
    helpEmptyValues: 'Missing values before comma or closing bracket',
  },
}

function removeComments(str) {
  let result = ''
  let i = 0
  while (i < str.length) {
    if (str[i] === '"') {
      result += '"'
      i++
      while (i < str.length && str[i] !== '"') {
        if (str[i] === '\\') {
          result += str[i]
          i++
          if (i < str.length) {
            result += str[i]
            i++
          }
        } else {
          result += str[i]
          i++
        }
      }
      if (i < str.length) {
        result += str[i]
        i++
      }
    } else if (str[i] === "'" && !result.match(/:\s*$/)) {
      result += str[i]
      i++
    } else if (str[i] === '/' && i + 1 < str.length && str[i + 1] === '/') {
      while (i < str.length && str[i] !== '\n') i++
    } else if (str[i] === '/' && i + 1 < str.length && str[i + 1] === '*') {
      i += 2
      while (i < str.length && !(str[i] === '*' && i + 1 < str.length && str[i + 1] === '/')) i++
      i += 2
    } else {
      result += str[i]
      i++
    }
  }
  return result
}

function repairJson(input) {
  const fixes = []
  let s = input

  if (s.charCodeAt(0) === 0xFEFF) {
    s = s.slice(1)
    fixes.push('fixBom')
  }

  if (s.includes('\r\n')) {
    s = s.split('\r\n').join('\n')
    fixes.push('fixNewlines')
  }

  const hasComments = /\/\/|\/\*/.test(s)
  if (hasComments) {
    s = removeComments(s)
    fixes.push('fixComments')
  }

  const afterCommentCheck = s
  if (/(?:^|[{,]\s*)'[^']*'\s*:/.test(afterCommentCheck) || /'[^']*'\s*:/.test(afterCommentCheck)) {
    s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (match, inner) => {
      if (inner.includes('"')) return match
      return '"' + inner + '"'
    })
    fixes.push('fixSingleQuotes')
  }

  if (/,\s*[}\]]/.test(s)) {
    s = s.replace(/,\s*([}\]])/g, '$1')
    fixes.push('fixTrailingCommas')
  }

  if (/\bundefined\b/.test(s)) {
    s = s.replace(/\bundefined\b/g, 'null')
    fixes.push('fixSpecialValues')
  }

  if (/\bNaN\b/.test(s)) {
    s = s.replace(/\bNaN\b/g, 'null')
    if (!fixes.includes('fixSpecialValues')) fixes.push('fixSpecialValues')
  }

  if (/\bInfinity\b/.test(s)) {
    s = s.replace(/\bInfinity\b/g, 'null')
    if (!fixes.includes('fixSpecialValues')) fixes.push('fixSpecialValues')
  }

  if (/\b-Infinity\b/.test(s)) {
    s = s.replace(/\b-Infinity\b/g, 'null')
    if (!fixes.includes('fixSpecialValues')) fixes.push('fixSpecialValues')
  }

  try {
    JSON.parse(s)
    if (fixes.length > 0) {
      return { result: s, fixes, error: null }
    }
    return { result: null, fixes: [], error: null, alreadyValid: true }
  } catch (e) {
    // Try more aggressive fixes
  }

  let fixed = s.replace(/"?\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b"?\s*:/g, (match, key) => {
    if (key === 'true' || key === 'false' || key === 'null') return match
    return '"' + key + '":'
  })
  if (fixed !== s) {
    fixes.push('fixUnquotedKeys')
    s = fixed
  }

  s = s.replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*([,}\]])/g, (match, val, after) => {
    if (val === 'true' || val === 'false' || val === 'null') return match
    return ': "' + val + '"' + after
  })

  s = s.replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*$/gm, (match, val) => {
    if (val === 'true' || val === 'false' || val === 'null') return match
    return ': "' + val + '"'
  })

  if (s !== fixed && !fixes.includes('fixUnquotedValues')) {
    fixes.push('fixUnquotedValues')
  }

  s = s.replace(/:\s*,/g, ': null,')
  s = s.replace(/:\s*}/g, ': null}')
  s = s.replace(/:\s*]/g, ': null]')

  if (/:\s*,|:\s*[}\]]/.test(fixed !== s ? s : fixed)) {
    if (!fixes.includes('fixEmptyValues')) fixes.push('fixEmptyValues')
  }

  if (/,\s*[}\]]/.test(s)) {
    s = s.replace(/,\s*([}\]])/g, '$1')
    if (!fixes.includes('fixTrailingCommas')) fixes.push('fixTrailingCommas')
  }

  try {
    JSON.parse(s)
    return { result: s, fixes, error: null }
  } catch (e) {
    return { result: null, fixes, error: e.message }
  }
}

function JsonRepairPage() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [fixes, setFixes] = useState([])
  const [error, setError] = useState(null)
  const [alreadyValid, setAlreadyValid] = useState(false)

  const { lang } = useLanguage()
  const t = translations[lang]

  const handleRepair = useCallback(() => {
    if (!input.trim()) {
      message.warning(lang === 'pt' ? 'Cole um JSON primeiro' : 'Paste some JSON first')
      return
    }
    const { result, fixes: appliedFixes, error: repairError, alreadyValid: valid } = repairJson(input)
    setFixes(appliedFixes)
    setError(repairError)
    setAlreadyValid(!!valid)
    if (result) {
      try {
        const parsed = JSON.parse(result)
        setOutput(JSON.stringify(parsed, null, 2))
      } catch {
        setOutput(result)
      }
    } else if (valid) {
      try {
        const parsed = JSON.parse(input)
        setOutput(JSON.stringify(parsed, null, 2))
      } catch {
        setOutput('')
      }
    } else {
      setOutput('')
    }
  }, [input, lang])

  const handleCopy = useCallback(() => {
    if (output) {
      navigator.clipboard.writeText(output)
      message.success(t.copied)
    }
  }, [output, t.copied])

  const handleLoadSample = useCallback(() => {
    setInput(SAMPLE)
    setOutput('')
    setFixes([])
    setError(null)
    setAlreadyValid(false)
  }, [])

  const handleClear = useCallback(() => {
    setInput('')
    setOutput('')
    setFixes([])
    setError(null)
    setAlreadyValid(false)
  }, [])

  const fixLabels = useMemo(() => ({
    fixTrailingCommas: t.fixTrailingCommas,
    fixSingleQuotes: t.fixSingleQuotes,
    fixComments: t.fixComments,
    fixUnquotedKeys: t.fixUnquotedKeys,
    fixUnquotedValues: t.fixUnquotedValues,
    fixSpecialValues: t.fixSpecialValues,
    fixEmptyValues: t.fixEmptyValues,
    fixBom: t.fixBom,
    fixNewlines: t.fixNewlines,
  }), [t])

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={2}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        {t.title}
      </Title>
      <Paragraph>{t.intro}</Paragraph>

      <Space style={{ marginBottom: 12 }}>
        <Button size="small" onClick={handleLoadSample}>{t.sample}</Button>
        <Button size="small" onClick={handleClear}>{t.clear}</Button>
      </Space>

      <Card title={t.inputLabel} style={{ marginBottom: 16 }}>
        <TextArea
          rows={12}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.inputPlaceholder}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
      </Card>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Button type="primary" size="large" onClick={handleRepair}>
          {t.repair}
        </Button>
      </div>

      {fixes.length > 0 && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message={t.successTitle}
          description={
            <Space direction="vertical" size={4} style={{ marginTop: 8 }}>
              {fixes.map((f) => (
                <Tag key={f} color="green">{fixLabels[f] || f}</Tag>
              ))}
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {alreadyValid && (
        <Alert
          type="info"
          showIcon
          message={t.alreadyValid}
          style={{ marginBottom: 16 }}
        />
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          message={t.errorTitle}
          description={t.errorDesc}
          style={{ marginBottom: 16 }}
        />
      )}

      {output && (
        <Card
          title={t.outputLabel}
          extra={
            <Button icon={<CopyOutlined />} onClick={handleCopy} size="small">
              {t.copy}
            </Button>
          }
        >
          <pre style={{
            background: '#f6f8fa',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            maxHeight: 400,
            fontSize: 13,
            fontFamily: 'monospace',
            margin: 0,
          }}>
            {output}
          </pre>
        </Card>
      )}

      <Collapse style={{ marginTop: 24 }}>
        <Collapse.Panel header={t.fixesTitle} key="help">
          <Space direction="vertical" size={8}>
            <Paragraph><Text strong>1. {t.fixTrailingCommas}</Text><br /><Text code>{'{ "a": 1, }'}</Text> → <Text code>{'{ "a": 1 }'}</Text></Paragraph>
            <Paragraph><Text strong>2. {t.fixSingleQuotes}</Text><br /><Text code>{"{ 'key': 'value' }"}</Text> → <Text code>{'{ "key": "value" }'}</Text></Paragraph>
            <Paragraph><Text strong>3. {t.fixComments}</Text><br /><Text code>// comment</Text> and <Text code>{'/* comment */'}</Text> removed (state machine preserves strings)</Paragraph>
            <Paragraph><Text strong>4. {t.fixUnquotedKeys}</Text><br /><Text code>{'{ key: "value" }'}</Text> → <Text code>{'{ "key": "value" }'}</Text></Paragraph>
            <Paragraph><Text strong>5. {t.fixUnquotedValues}</Text><br /><Text code>{'{ "key": value }'}</Text> → <Text code>{'{ "key": "value" }'}</Text></Paragraph>
            <Paragraph><Text strong>6. {t.fixSpecialValues}</Text><br /><Text code>NaN, Infinity, undefined</Text> → <Text code>null</Text></Paragraph>
            <Paragraph><Text strong>7. {t.fixEmptyValues}</Text><br /><Text code>{'{ "key": , }'}</Text> → <Text code>{'{ "key": null }'}</Text></Paragraph>
          </Space>
        </Collapse.Panel>
      </Collapse>
    </div>
  )
}

export default JsonRepairPage
