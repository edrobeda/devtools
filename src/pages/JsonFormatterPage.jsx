import React, { useState } from 'react'
import { Typography, Button, Descriptions } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import FormatterShell from '../components/FormatterShell'

const { Text } = Typography

const translations = {
  pt: {
    title: 'Formatador e Validador de JSON',
    intro: (
      <>
        Cola um JSON, formata com indentação ou minifica, e valida a sintaxe
        — tudo local via <Text code>JSON.parse</Text>/<Text code>JSON.stringify</Text>,
        nenhum dado sai do navegador.
      </>
    ),
    placeholder: 'Cole o JSON aqui, ex: {"nome": "teste", "ativo": true}',
    format: 'Formatar',
    minify: 'Minificar',
    invalidTitle: 'JSON inválido',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copiedMessage: 'Copiado',
    keys: 'Chaves',
    size: 'Tamanho',
  },
  en: {
    title: 'JSON Formatter & Validator',
    intro: (
      <>
        Paste a JSON, format it with indentation or minify it, and validate
        the syntax — all local via <Text code>JSON.parse</Text>/<Text code>JSON.stringify</Text>,
        no data leaves the browser.
      </>
    ),
    placeholder: 'Paste the JSON here, e.g.: {"name": "test", "active": true}',
    format: 'Format',
    minify: 'Minify',
    invalidTitle: 'Invalid JSON',
    resultTitle: 'Result',
    copy: 'Copy',
    copiedMessage: 'Copied',
    keys: 'Keys',
    size: 'Size',
  },
}

function countKeys(value) {
  if (Array.isArray(value)) {
    return value.reduce((acc, item) => acc + countKeys(item), 0)
  }
  if (value !== null && typeof value === 'object') {
    return Object.keys(value).reduce(
      (acc, key) => acc + 1 + countKeys(value[key]),
      0,
    )
  }
  return 0
}

export default function JsonFormatterPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  function parseInput() {
    if (!input.trim()) {
      setOutput('')
      setError(null)
      setStats(null)
      return null
    }
    try {
      const parsed = JSON.parse(input)
      setError(null)
      return parsed
    } catch (err) {
      setError(err.message)
      setOutput('')
      setStats(null)
      return undefined
    }
  }

  function handleFormat() {
    const parsed = parseInput()
    if (parsed === null || parsed === undefined) return
    const formatted = JSON.stringify(parsed, null, 2)
    setOutput(formatted)
    setStats({
      keys: countKeys(parsed),
      bytes: new TextEncoder().encode(formatted).length,
    })
  }

  function handleMinify() {
    const parsed = parseInput()
    if (parsed === null || parsed === undefined) return
    const minified = JSON.stringify(parsed)
    setOutput(minified)
    setStats({
      keys: countKeys(parsed),
      bytes: new TextEncoder().encode(minified).length,
    })
  }

  return (
    <FormatterShell
      icon={<FileTextOutlined />}
      title={t.title}
      intro={t.intro}
      input={input}
      onInputChange={(e) => setInput(e.target.value)}
      placeholder={t.placeholder}
      rows={10}
      inputLayout="plain"
      inputActionsWrap={false}
      actions={(
        <>
          <Button type="primary" onClick={handleFormat}>{t.format}</Button>
          <Button onClick={handleMinify}>{t.minify}</Button>
        </>
      )}
      error={error ? { title: t.invalidTitle, description: error } : null}
      output={output}
      outputTitle={t.resultTitle}
      stats={stats ? (
        <Descriptions size="small" column={2} style={{ marginBottom: 12 }}>
          <Descriptions.Item label={t.keys}>{stats.keys}</Descriptions.Item>
          <Descriptions.Item label={t.size}>{stats.bytes} bytes</Descriptions.Item>
        </Descriptions>
      ) : null}
      copyLabel={t.copy}
      copyMode="toast"
      copyToastText={t.copiedMessage}
      // A versao original renderizava `{output && (<Card/>)}`: sem saida o
      // React devolvia string vazia e o antd Space embrulhava isso num item
      // vazio (com o gap vertical no fim da pagina). `emptyHint=""` mantem
      // esse item -- com `hideEmptyHintOnError={false}` ele aparece
      // tambem quando ha erro.
      emptyHint=""
      hideEmptyHintOnError={false}
    />
  )
}
