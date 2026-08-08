import React, { useState } from 'react'
import { Typography, Card, Space, Row, Col, Input, Button, Alert, Table, Tag, message } from 'antd'
import { CodeOutlined, CheckCircleOutlined, CloseCircleOutlined, PlayCircleOutlined, ClearOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import validateSchema from '../utils/jsonSchemaValidator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const SCHEMA_EXAMPLE = `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["id", "email", "tags"],
  "properties": {
    "id": { "type": "integer", "minimum": 1 },
    "email": { "type": "string", "format": "email" },
    "name": { "type": "string", "minLength": 2, "maxLength": 40 },
    "age": { "type": "integer", "minimum": 18 },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "uniqueItems": true,
      "minItems": 1
    },
    "metadata": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    },
    "status": { "enum": ["active", "inactive", "pending"] }
  },
  "additionalProperties": false
}`

const VALID_INPUT = `{
  "id": 42,
  "email": "ana@eventifylab.com",
  "name": "Ana",
  "age": 30,
  "tags": ["admin", "dev"],
  "metadata": { "department": "platform" },
  "status": "active"
}`

const INVALID_INPUT = `{
  "id": 0,
  "email": "email-sem-arroba",
  "name": "A",
  "age": 15,
  "tags": ["dev", "dev"],
  "status": "deleted",
  "extraField": true
}`

const SOURCE_SNIPPET = `// Validador de JSON Schema (subconjunto draft-07), sem dependências.
//
// O núcleo é uma função recursiva walk(schema, value, path, depth):
//   - type aceita união (["string","null"]) e percorre a árvore do valor;
//   - enum/const comparam por deepEqual (ordem de chaves ignorada);
//   - strings: minLength/maxLength/pattern (RegExp) + subset de format
//     (email, uri, date, ipv4, uuid...); format desconhecido é ignorado;
//   - números: minimum/maximum, exclusiveMinimum/exclusiveMaximum na
//     forma numeral do draft-07 e multipleOf por razão inteira;
//   - arrays: minItems/maxItems/uniqueItems (deepEqual), items objeto ou
//     tupla (com additionalItems:false) e contains;
//   - objetos: required, properties, patternProperties, min/maxProperties
//     e additionalProperties (false ou schema);
//   - combinações: anyOf/oneOf/allOf/not avaliam cada braço num checkpoint
//     de errors.length, desfazem se falhar e só registram no resultado
//     final quando a regra composta não é satisfeita;
//   - $ref: resolves referências LOCAIS ('#/definitions/...', '#/$defs/...')
//     caminhando de volta pela raiz do schema, com limiar de profundidade
//     para proibir águas circulares infinitas que travem a aba.
//
// Cada erro guarda { path: "$.user.email", code, params } — a página
// traduz o code para os dois idiomas montando a frase mensagem com params.
`

const translations = {
  pt: {
    title: 'Validador de JSON Schema',
    intro: (<>Cola um <Text code>schema</Text> e um <Text code>JSON</Text>, e o validador aponta todas as violações do documento contra o contrato — um subconjunto prático do draft-07, 100% client-side, nada sai do navegador. Complementa o <Text code>json-schema-generator</Text> (que cria o schema a partir de um exemplo) e o <Text code>json-formatter</Text> (que só checa sintaxe). Suporta <Text code>type</Text>, <Text code>enum</Text>/<Text code>const</Text>, <Text code>required</Text>, <Text code>properties</Text>, <Text code>patternProperties</Text>, <Text code>additionalProperties</Text>, <Text code>items</Text> (schema ou tupla), <Text code>minLength</Text>/<Text code>maxLength</Text>, <Text code>pattern</Text>, <Text code>format</Text>, limites numéricos, <Text code>multipleOf</Text>, <Text code>uniqueItems</Text>, <Text code>contains</Text>, <Text code>anyOf</Text>/<Text code>oneOf</Text>/<Text code>allOf</Text>/<Text code>not</Text> e <Text code>$ref</Text> local.</>),
    schemaLabel: 'Schema (JSON)',
    inputLabel: 'Instância (JSON a validar)',
    schemaPlaceholder: 'Cole o JSON Schema aqui...',
    inputPlaceholder: 'Cole o JSON que você quer validar...',
    validate: 'Validar',
    clear: 'Limpar',
    sampleValid: 'Exemplo válido',
    sampleInvalid: 'Exemplo inválido',
    validTitle: 'Documento válido',
    validDesc: 'O JSON está de acordo com o schema — nenhuma violação encontrada.',
    invalidTitle: 'Violações encontradas',
    invalidDesc: (n) => `${n} ${n === 1 ? 'erro' : 'erros'} no JSON contra o schema.`,
    tablePath: 'Caminho',
    tableError: 'Violação',
    osTitle: 'Como funciona (algoritmo)',
    copy: 'Copiar',
    copied: 'Copiado!',
    typeErr: (exp, got) => `tipo errado — esperado ${exp}, veio ${got}`,
    enumErr: () => 'valor fora dos valores permitidos do enum',
    constErr: () => 'valor diferente do const',
    minLengthErr: (n) => `menor que o mínimo de ${n} caracteres`,
    maxLengthErr: (n) => `maior que o máximo de ${n} caracteres`,
    patternErr: (p) => `não casa com o padrão /${p}/`,
    formatErr: (f) => `formato inválido (esperado ${f})`,
    minimumErr: (n) => `menor que o mínimo ${n}`,
    maximumErr: (n) => `maior que o máximo ${n}`,
    exclusiveMinimumErr: (n) => `precisa ser maior que ${n}`,
    exclusiveMaximumErr: (n) => `precisa ser menor que ${n}`,
    multipleOfErr: (n) => `não é múltiplo de ${n}`,
    minItemsErr: (n) => `array com menos de ${n} item(ns)`,
    maxItemsErr: (n) => `array com mais de ${n} item(ns)`,
    duplicateErr: () => 'itens duplicados no array (uniqueItems)',
    additionalItemsErr: () => 'item excedente além da tupla (additionalItems: false)',
    containsErr: () => 'nenhum item do array passa no contains',
    minPropertiesErr: (n) => `objeto com menos de ${n} propriedade(s)`,
    maxPropertiesErr: (n) => `objeto com mais de ${n} propriedade(s)`,
    requiredErr: (k) => `propriedade obrigatória ausente: ${k}`,
    additionalPropertiesErr: (k) => `propriedade extra não permitida: ${k}`,
    anyOfErr: () => 'não satisfaz nenhuma alternativa do anyOf',
    oneOfErr: (passes) => `oneOf: esperava 1 alternativa válida, veio ${passes}`,
    notErr: () => 'valor não deveria passar no schema (not)',
    badRefErr: (r) => `$ref não resolveu: ${r}`,
    falseSchemaErr: () => 'schema false — nada passa',
    genericErr: () => 'violação de schema',
  },
  en: {
    title: 'JSON Schema Validator',
    intro: (<>Paste a <Text code>schema</Text> and a <Text code>JSON</Text>, and the validator reports every violation of the document against the contract — a practical draft-07 subset, 100% client-side, nothing leaves the browser. Complements the <Text code>json-schema-generator</Text> (which creates a schema from an example) and the <Text code>json-formatter</Text> (syntax only). Supports <Text code>type</Text>, <Text code>enum</Text>/<Text code>const</Text>, <Text code>required</Text>, <Text code>properties</Text>, <Text code>patternProperties</Text>, <Text code>additionalProperties</Text>, <Text code>items</Text> (schema or tuple), <Text code>minLength</Text>/<Text code>maxLength</Text>, <Text code>pattern</Text>, <Text code>format</Text>, numeric bounds, <Text code>multipleOf</Text>, <Text code>uniqueItems</Text>, <Text code>contains</Text>, <Text code>anyOf</Text>/<Text code>oneOf</Text>/<Text code>allOf</Text>/<Text code>not</Text> and local <Text code>$ref</Text>.</>),
    schemaLabel: 'Schema (JSON)',
    inputLabel: 'Instance (JSON to validate)',
    schemaPlaceholder: 'Paste the JSON Schema here...',
    inputPlaceholder: 'Paste the JSON to validate here...',
    validate: 'Validate',
    clear: 'Clear',
    sampleValid: 'Valid sample',
    sampleInvalid: 'Invalid sample',
    validTitle: 'Document is valid',
    validDesc: 'The JSON matches the schema — no violations found.',
    invalidTitle: 'Violations found',
    invalidDesc: (n) => `${n} ${n === 1 ? 'error' : 'errors'} in the JSON against the schema.`,
    tablePath: 'Path',
    tableError: 'Violation',
    osTitle: 'How it works (algorithm)',
    copy: 'Copy',
    copied: 'Copied!',
    typeErr: (exp, got) => `wrong type — expected ${exp}, got ${got}`,
    enumErr: () => 'value not one of the allowed enum values',
    constErr: () => 'value differs from const',
    minLengthErr: (n) => `shorter than ${n} characters`,
    maxLengthErr: (n) => `longer than ${n} characters`,
    patternErr: (p) => `does not match pattern /${p}/`,
    formatErr: (f) => `invalid format (expected ${f})`,
    minimumErr: (n) => `less than minimum ${n}`,
    maximumErr: (n) => `greater than maximum ${n}`,
    exclusiveMinimumErr: (n) => `must be greater than ${n}`,
    exclusiveMaximumErr: (n) => `must be less than ${n}`,
    multipleOfErr: (n) => `not a multiple of ${n}`,
    minItemsErr: (n) => `array has fewer than ${n} item(s)`,
    maxItemsErr: (n) => `array has more than ${n} item(s)`,
    duplicateErr: () => 'duplicate items in the array (uniqueItems)',
    additionalItemsErr: () => 'extra item beyond the tuple (additionalItems: false)',
    containsErr: () => 'no item passes the contains check',
    minPropertiesErr: (n) => `object with fewer than ${n} propertie(s)`,
    maxPropertiesErr: (n) => `object with more than ${n} propertie(s)`,
    requiredErr: (k) => `missing required property: ${k}`,
    additionalPropertiesErr: (k) => `extra property not allowed: ${k}`,
    anyOfErr: () => 'does not satisfy any anyOf alternative',
    oneOfErr: (passes) => `oneOf expects exactly 1 match, got ${passes}`,
    notErr: () => 'value should not match under "not" constraint',
    badRefErr: (r) => `unresolved $ref: ${r}`,
    falseSchemaErr: () => 'false schema, nothing passes',
    genericErr: () => 'schema violation',
  },
}

function translateError(e, t) {
  const p = e.params || {}
  switch (e.code) {
    case 'type': return t.typeErr(p.expected, p.got)
    case 'enum': return t.enumErr()
    case 'const': return t.constErr()
    case 'min_length': return t.minLengthErr(p.n)
    case 'max_length': return t.maxLengthErr(p.n)
    case 'pattern': return t.patternErr(p.pattern)
    case 'format': return t.formatErr(p.format)
    case 'minimum': return t.minimumErr(p.n)
    case 'maximum': return t.maximumErr(p.n)
    case 'exclusive_minimum': return t.exclusiveMinimumErr(p.n)
    case 'exclusive_maximum': return t.exclusiveMaximumErr(p.n)
    case 'multiple_of': return t.multipleOfErr(p.n)
    case 'min_items': return t.minItemsErr(p.n)
    case 'max_items': return t.maxItemsErr(p.n)
    case 'duplicate': return t.duplicateErr()
    case 'additional_items': return t.additionalItemsErr()
    case 'contains': return t.containsErr()
    case 'min_properties': return t.minPropertiesErr(p.n)
    case 'max_properties': return t.maxPropertiesErr(p.n)
    case 'required': return t.requiredErr(p.key)
    case 'additional_properties': return t.additionalPropertiesErr(p.key)
    case 'anyOf': return t.anyOfErr()
    case 'oneOf': return t.oneOfErr(p.passes)
    case 'not': return t.notErr()
    case 'bad_ref': return t.badRefErr(p.ref)
    case 'false_schema': return t.falseSchemaErr()
    default: return t.genericErr()
  }
}

export default function JsonSchemaValidatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [schemaStr, setSchemaStr] = useState(SCHEMA_EXAMPLE)
  const [inputStr, setInputStr] = useState(INVALID_INPUT)
  const [result, setResult] = useState(null)
  const [parseErr, setParseErr] = useState(null)
  const [copied, setCopied] = useState(false)

  function validate() {
    setParseErr(null)
    try {
      const schema = JSON.parse(schemaStr)
      try {
        const input = JSON.parse(inputStr)
        setResult(validateSchema(schema, input))
      } catch (e) {
        setResult(null)
        setParseErr({ which: 'input', message: e.message })
      }
    } catch (e) {
      setResult(null)
      setParseErr({ which: 'schema', message: e.message })
    }
  }

  function setSample(kind) {
    setSchemaStr(SCHEMA_EXAMPLE)
    setInputStr(kind === 'valid' ? VALID_INPUT : INVALID_INPUT)
    setResult(null)
    setParseErr(null)
  }

  function clear() {
    setSchemaStr('')
    setInputStr('')
    setResult(null)
    setParseErr(null)
  }

  async function copyErrors() {
    if (!result || result.valid) return
    try {
      const text = result.errors.map((e) => `${e.path}: ${translateError(e, t)}\n`).join('')
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      message.warning(t.copy)
    }
  }

  const numErrors = result && !result.valid ? result.errors.length : 0

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card size="small" title={t.schemaLabel}>
            <TextArea
              rows={16}
              value={schemaStr}
              onChange={(e) => { setSchemaStr(e.target.value); setResult(null); setParseErr(null) }}
              placeholder={t.schemaPlaceholder}
              spellCheck={false}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card size="small" title={t.inputLabel}>
            <TextArea
              rows={16}
              value={inputStr}
              onChange={(e) => { setInputStr(e.target.value); setResult(null); setParseErr(null) }}
              placeholder={t.inputPlaceholder}
              spellCheck={false}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Card>
        </Col>
      </Row>

      <Space wrap>
        <Button type="primary" icon={<PlayCircleOutlined />} onClick={validate}>{t.validate}</Button>
        <Button icon={<CheckCircleOutlined />} onClick={() => setSample('valid')}>{t.sampleValid}</Button>
        <Button icon={<CloseCircleOutlined />} onClick={() => setSample('invalid')}>{t.sampleInvalid}</Button>
        <Button icon={<ClearOutlined />} onClick={clear}>{t.clear}</Button>
      </Space>

      {parseErr && (
        <Alert
          type="error"
          showIcon
          message={parseErr.which === 'schema' ? t.schemaLabel : t.inputLabel}
          description={<Text code>{parseErr.message}</Text>}
        />
      )}

      {result && result.valid && (
        <Alert type="success" showIcon message={t.validTitle} description={t.validDesc} />
      )}

      {result && !result.valid && (
        <Card
          size="small"
          title={`${t.invalidTitle} (${numErrors})`}
          extra={
            <Button
              size="small"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={copyErrors}
            >
              {copied ? t.copied : t.copy}
            </Button>
          }
        >
          <Alert type="error" showIcon message={t.invalidTitle} description={t.invalidDesc(numErrors)} style={{ marginBottom: 12 }} />
          <Table
            size="small"
            rowKey={(r, i) => i}
            dataSource={result.errors}
            pagination={false}
            columns={[
              { title: t.tablePath, dataIndex: 'path', width: 180, render: (v) => <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{v}</Tag> },
              { title: t.tableError, dataIndex: 'code', render: (_, e) => <Text>{translateError(e, t)}</Text> },
            ]}
            scroll={{ x: true }}
          />
        </Card>
      )}

      <Card size="small" title={t.soTitle}>
        <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 12 }}>
          <code>{SOURCE_SNIPPET}</code>
        </pre>
      </Card>
    </Space>
  )
}