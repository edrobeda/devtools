import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Segmented, Switch, Alert, Button, Tag, Collapse, message } from 'antd'
import { SwapOutlined, CopyOutlined, CheckOutlined, ClearOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { cssToJs, jsToCss } from '../utils/cssToJs'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

// Exemplo CSS→JS: regra tirada do DevTools/Figma — mistura px, cores,
// prefixo de vendor, propriedade custom, z-index e float.
const SAMPLE_CSS = `/*.card — copiado do DevTools/Figma */
.card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 14px;
  line-height: 1.5;
  color: rgba(0, 0, 0, 0.88);
  transition: box-shadow 0.2s ease;
  -webkit-mask-image: linear-gradient(black, transparent);
  --accent: #1677ff;
  position: relative;
  z-index: 2;
  float: none;
}`

// Exemplo JS→CSS: objeto de estilo do jeito que fica num componente React.
const SAMPLE_JS = `{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 16px',
  border: '1px solid #e8e8e8',
  borderRadius: 10,
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  fontSize: 14,
  lineHeight: 1.5,
  fontWeight: 600,
  opacity: 0.9,
  zIndex: 2,
  WebkitMaskImage: 'linear-gradient(black, transparent)',
  '--accent': '#1677ff',
}`

// Algoritmo, em resumo legível (o código completo vive em src/utils/cssToJs.js).
const SOURCE_SNIPPET = `// CSS → JS (styleKey + parseDeclarations + normalizeValue):
//   1. remove comentários /* */ respeitando strings;
//   2. se a entrada tem { ... }, colhe as declarações de dentro de cada
//      bloco (o texto de fora é seletor, é ignorado); sem chaves, trata
//      o texto todo como lista de declarações \`prop: value;\`;
//   3. chave: styleKey() cameliza — font-size->fontSize, float->cssFloat,
//      -webkit-*->Webkit*, -ms-*->ms*, --custom permanece igual;
//   4. valor: normalizeValue() — "14px" ou "0" viram número (React agrega
//      o px sozinho), "!important" é detectado e removido (a style prop
//      não aceita), o resto vira string.

// JS → CSS (cssProperty + jsToCss):
//   1. tira comentários // e /* */, envolve em { } se faltar;
//   2. divide os membros de nível superior por vírgula respeitando
//      strings e aninhamento — objeto/array aninhado é pulado;
//   3. chave: camelCase -> kebab-case (Webkit*->-webkit-*, ms*->-ms-*);
//   4. valor: número vira "Npx", exceto nas propriedades unitless do
//      React (zIndex, flex, opacity, fontWeight, lineHeight...).`

const translations = {
  pt: {
    title: 'Conversor CSS ↔ JS (style object)',
    intro: (
      <>
        Cola um trecho de CSS e vira o objeto de estilo do React (
        <Text code>style={"{...}"}</Text>) — ou o caminho inverso: cola o
        objeto e vira CSS de novo. A ponte que faltava entre o{' '}
        <Text code>css-formatter</Text> (que reformata o texto do CSS) e o seu
        código. 100% no navegador, nada sai daqui.
      </>
    ),
    modeCssToJs: 'CSS → JS',
    modeJsToCss: 'JS → CSS',
    inputLabel: 'Entrada',
    placeholderCss: `Cole suas declarações CSS ('prop: value;') ou uma regra inteira ('seletor { ... }')...`,
    placeholderJs: `Cole seu objeto de estilo JS (literal ou JSON) — ex.: { color: 'red', fontSize: 14 }...`,
    jsonKeys: 'Chaves com aspas (JSON-style)',
    exampleCss: 'Exemplo CSS',
    exampleJs: 'Exemplo objeto JS',
    clear: 'Limpar',
    resultTitle: 'Resultado',
    copy: 'Copiar',
    copied: 'Copiado!',
    emptyHint: 'Digite ou cole algo acima — a conversão roda na hora.',
    statsDecls: 'Declarações',
    statsImportant: '!important removidos',
    statsSkipped: 'Valores aninhados pulados',
    alertTitle: 'React style prop — as pegadinhas',
    alertBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            As chaves do estilo do React são <Text code>camelCase</Text>, não o
            kebab do CSS: <Text code>font-size</Text> → {''}
            <Text code>fontSize</Text>. Onde a lógica simples engana:{' '}
            <Text code>float</Text> → <Text code>cssFloat</Text> (palavra
            reservada do JS) e prefixos de vendor na capitalização do React:{' '}
            <Text code>-webkit-*</Text> → <Text code>Webkit*</Text>,{' '}
            <Text code>-ms-*</Text> → <Text code>ms*</Text>,{' '}
            <Text code>-moz-*</Text> → <Text code>Moz*</Text>,{' '}
            <Text code>-o-*</Text> → <Text code>O*</Text>.
          </li>
          <li>
            Números: o React adiciona <Text code>px</Text> sozinho, por isso{' '}
            <Text code>font-size: 14px</Text> vira <Text code>fontSize: 14</Text>{' '}
            (número). Outras unidades (<Text code>rem/em/%</Text>) continuam{' '}
            string. No caminho inverso, propriedades "unitless" do React —
            <Text code>z-index</Text>, <Text code>flex</Text>,{' '}
            <Text code>opacity</Text>, <Text code>font-weight</Text>,{' '}
            <Text code>line-height</Text> — não ganham <Text code>px</Text>.
          </li>
          <li>
            <Text code>!important</Text> não é aceito na <Text code>style</Text>{' '}
            prop: o conversor detecta e remove (entra no contador ao lado), e
            pra important de verdade o caminho é CSS Module/styled-components.
          </li>
          <li>
            Propriedades custom <Text code>--x</Text> passam como estão (o
            React 16.1+ suporta no style) — mas pseudo-classes, pseudo-
            elementos e seletores não têm tradução pra inline style; pra isso
            o caminho é CSS real.
          </li>
          <li>
            No sentido JS → CSS, objetos aninhados (ex.: breakpoints) são
            pulados e contados ("Valores aninhados pulados").
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Como funciona (algoritmo)',
  },
  en: {
    title: 'CSS ↔ JS Converter (style object)',
    intro: (
      <>
        Paste a snippet of CSS and turn it into a React style object (
        <Text code>style={"{...}"}</Text>) — or the other way around: paste the
        object and get CSS back. The missing bridge between the{' '}
        <Text code>css-formatter</Text> (which reformats CSS text) and your
        code. 100% in the browser, nothing leaves here.
      </>
    ),
    modeCssToJs: 'CSS → JS',
    modeJsToCss: 'JS → CSS',
    inputLabel: 'Input',
    placeholderCss: `Paste your CSS declarations ('prop: value;') or a whole rule ('selector { ... }')...`,
    placeholderJs: `Paste your JS style object (literal or JSON) — e.g. { color: 'red', fontSize: 14 }...`,
    jsonKeys: 'Quoted keys (JSON-style)',
    exampleCss: 'CSS sample',
    exampleJs: 'JS object sample',
    clear: 'Clear',
    resultTitle: 'Result',
    copy: 'Copy',
    copied: 'Copied!',
    emptyHint: 'Type or paste something above — conversion runs live.',
    statsDecls: 'Declarations',
    statsImportant: '!important removed',
    statsSkipped: 'Nested values skipped',
    alertTitle: 'React style prop — the gotchas',
    alertBody: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            React style keys are <Text code>camelCase</Text>, not CSS kebab:{' '}
            <Text code>font-size</Text> → <Text code>fontSize</Text>. Where the
            naive rule lies: <Text code>float</Text> → {''}
            <Text code>cssFloat</Text> (a JS reserved word), and vendor
            prefixes in React's capitalization:{' '}
            <Text code>-webkit-*</Text> → <Text code>Webkit*</Text>,{' '}
            <Text code>-ms-*</Text> → <Text code>ms*</Text>,{' '}
            <Text code>-moz-*</Text> → <Text code>Moz*</Text>,{' '}
            <Text code>-o-*</Text> → <Text code>O*</Text>.
          </li>
          <li>
            Numbers: React appends <Text code>px</Text> on its own, so{' '}
            <Text code>font-size: 14px</Text> becomes <Text code>fontSize: 14</Text>{' '}
            (a number). Other units (<Text code>rem/em/%</Text>) stay strings.
            Going backwards, React's "unitless" properties —{' '}
            <Text code>z-index</Text>, <Text code>flex</Text>,{' '}
            <Text code>opacity</Text>, <Text code>font-weight</Text>,{' '}
            <Text code>line-height</Text> — don't get <Text code>px</Text>.
          </li>
          <li>
            <Text code>!important</Text> is not allowed in the{' '}
            <Text code>style</Text> prop: the converter detects and strips it
            (counted next to the stats), and for real important you need CSS
            Modules/styled-components.
          </li>
          <li>
            Custom properties <Text code>--x</Text> pass through unchanged
            (React 16.1+ supports them in style) — but pseudo-classes,
            pseudo-elements and selectors have no inline-style equivalent; for
            those the answer is real CSS.
          </li>
          <li>
            Going JS → CSS, nested objects (e.g. breakpoints) are skipped and
            counted ("Nested values skipped").
          </li>
        </ul>
      </>
    ),
    sourceTitle: 'Under the hood (algorithm)',
  },
}

export default function CssToJsPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [messageApi, messageContextHolder] = message.useMessage()

  const [mode, setMode] = useState('csstojs')
  const [input, setInput] = useState(SAMPLE_CSS)
  const [quotedKeys, setQuotedKeys] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (!input.trim()) {
      return mode === 'csstojs'
        ? { output: '', count: 0, important: 0, skipped: 0 }
        : { output: '', count: 0, important: 0, skipped: 0 }
    }
    if (mode === 'csstojs') {
      const r = cssToJs(input, { quotedKeys })
      return { output: r.output, count: r.count, important: r.important, skipped: 0 }
    }
    const r = jsToCss(input)
    return { output: r.output, count: r.count, important: 0, skipped: r.skipped }
  }, [mode, input, quotedKeys])

  const examples =
    mode === 'csstojs'
      ? { label: t.exampleCss, value: SAMPLE_CSS }
      : { label: t.exampleJs, value: SAMPLE_JS }

  function handleCopy() {
    if (!result.output) return
    navigator.clipboard
      .writeText(result.output)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => messageApi.warning(t.emptyHint))
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SwapOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputLabel}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { label: t.modeCssToJs, value: 'csstojs' },
                { label: t.modeJsToCss, value: 'jstocss' },
              ]}
            />
            {mode === 'csstojs' && (
              <Space size={6}>
                <Switch size="small" checked={quotedKeys} onChange={setQuotedKeys} />
                <Text type="secondary" style={{ fontSize: 13 }}>{t.jsonKeys}</Text>
              </Space>
            )}
          </Space>
          <TextArea
            rows={12}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'csstojs' ? t.placeholderCss : t.placeholderJs}
            spellCheck={false}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
          <Space wrap>
            <Button
              icon={<ThunderboltOutlined />}
              size="small"
              onClick={() => setInput(examples.value)}
            >
              {examples.label}
            </Button>
            <Button
              danger
              size="small"
              icon={<ClearOutlined />}
              disabled={!input}
              onClick={() => setInput('')}
            >
              {t.clear}
            </Button>
          </Space>
        </Space>
      </Card>

      {result.output ? (
        <Card
          title={
            <Space size={12}>
              <span>{t.resultTitle}</span>
              <Tag color="blue">{t.statsDecls}: {result.count}</Tag>
              {result.important > 0 && (
                <Tag color="gold">{t.statsImportant}: {result.important}</Tag>
              )}
              {result.skipped > 0 && (
                <Tag color="orange">{t.statsSkipped}: {result.skipped}</Tag>
              )}
            </Space>
          }
          extra={
            <Button
              type="primary"
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <pre style={{
            margin: 0,
            overflowX: 'auto',
            maxHeight: 440,
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.6,
          }}>
            <code>{result.output}</code>
          </pre>
        </Card>
      ) : (
        <Text type="secondary">{t.emptyHint}</Text>
      )}

      <Alert type="info" showIcon message={t.alertTitle} description={t.alertBody} />

      <Collapse
        items={[
          {
            key: 'src',
            label: t.sourceTitle,
            children: <pre style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, background: '#f5f5f5', padding: 12, borderRadius: 6, overflowX: 'auto' }}>{SOURCE_SNIPPET}</pre>,
          },
        ]}
      />
    </Space>
  )
}