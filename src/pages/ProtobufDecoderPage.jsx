import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  InputNumber,
  Select,
  Segmented,
  Switch,
  Button,
  Tag,
  Alert,
  Collapse,
  Tree,
  Row,
  Col,
  Empty,
  Table,
  message,
} from 'antd'
import {
  ApartmentOutlined,
  CopyOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  WIRE_TYPES,
  MAX_FIELD_NUMBER,
  SAMPLES,
  parseInput,
  decodeMessage,
  pickInterpretation,
  encodeFields,
  grpcFrame,
  stripGrpcFrame,
  bytesToHex,
  bytesToBase64,
  downloadBytes,
} from '../utils/protobuf'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const MONO = {
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: 12,
}

const WIRE_COLORS = { 0: 'blue', 1: 'purple', 2: 'green', 3: 'orange', 4: 'orange', 5: 'cyan' }

const SOURCE_SNIPPET = `// o decodificador inteiro cabe em ~40 linhas — a chave é
// (numero_do_campo << 3) | wire_type, um varint por campo
function decodeVarint(bytes, pos, end) {
  let result = 0n, shift = 0n, i = pos
  while (i < end) {
    const b = bytes[i]
    result |= BigInt(b & 0x7f) << shift
    i++
    if ((b & 0x80) === 0) return { value: result, next: i }
    shift += 7n
    if (shift > 63n) return { error: 'varint-too-long' }
  }
  return { error: 'truncated-varint' }
}

function readField(bytes, pos, end) {
  const start = pos
  const key = decodeVarint(bytes, pos, end)
  const number = Number(key.value >> 3n)   // campo = chave >> 3
  const wireType = Number(key.value & 7n)  // tipo  = chave & 7

  if (wireType === 0) {                    // varint: 1 a 10 bytes
    const v = decodeVarint(bytes, key.next, end)
    return { number, wireType, varint: v.value, next: v.next }
  }
  if (wireType === 1 || wireType === 5) {  // fixed64 / fixed32
    const width = wireType === 1 ? 8 : 4
    return { number, wireType, fixed: bytes.slice(key.next, key.next + width), next: key.next + width }
  }
  if (wireType === 2) {                    // length-delimited
    const len = decodeVarint(bytes, key.next, end)
    const payload = bytes.slice(len.next, len.next + Number(len.value))
    return { number, wireType, payload, next: len.next + Number(len.value) }
  }
  return { error: 'unsupported-wire-type', offset: start }
}`

const translations = {
  pt: {
    title: 'Decodificador de Protobuf (wire format)',
    intro: (
      <>
        Cola os bytes de uma mensagem <Text strong>Protocol Buffers</Text> e vê a
        árvore de campos: número do campo, wire type, valor interpretado, offset e
        tamanho. Funciona no caminho inverso também — monte um payload campo a
        campo e veja o hex/Base64 resultante. Útil pra debugar gRPC, filas,
        EventBridge ou qualquer serviço que não devolva JSON. Sem o{' '}
        <Text code>.proto</Text> o tipo exato é uma heurística (string, mensagem
        aninhada ou packed repeated — a página mostra todas as leituras
        plausíveis). 100% no navegador.
      </>
    ),
    inputTitle: 'Entrada',
    inputPlaceholder: 'Cole os bytes em hex ou Base64...',
    hex: 'Hex',
    base64: 'Base64',
    clear: 'Limpar',
    samples: 'Exemplos',
    samplePessoa: 'Pessoa (simples)',
    samplePedido: 'Pedido (aninhado + packed)',
    sampleTelemetria: 'Telemetria (packed double)',
    sampleGrpc: 'Frame gRPC',
    grpcStrip: 'A entrada é um frame gRPC (remove os 5 bytes do cabeçalho)',
    resultTitle: 'Mensagem decodificada',
    noInput: 'Cole hex ou Base64 acima para decodificar.',
    parseError: 'Não deu pra ler a entrada',
    bytesCount: (n) => `${n} bytes`,
    fieldsCount: (n) => `${n} campos`,
    errorsTitle: 'Problemas encontrados',
    errors: {
      'invalid-wire-type': 'Wire type 6 ou 7 — não existe no protobuf (a partir do byte',
      'truncated-varint': 'Varint cortado no fim do payload',
      'varint-too-long': 'Varint com mais de 10 bytes',
      'truncated-fixed': 'Campo fixed32/fixed64 incompleto',
      'unterminated-group': 'Start group (3) sem end group (4) correspondente',
      'mismatched-end-group': 'End group com número diferente do start group',
      'unexpected-end-group': 'End group (4) sem start group (3)',
      'too-many-fields': 'Mensagem grande demais para analisar',
      'invalid-field': 'Campo inválido',
    },
    atOffset: (o) => `no offset ${o} (0x${o.toString(16)})`,
    trailing: (n) => `${n} bytes restantes não foram lidos como campo — provavelmente lixo ou o fim de um payload truncado.`,
    fieldWarnings: {
      'reserved-field-number': 'número de campo reservado (19000–19999)',
      'invalid-field-number': 'número de campo inválido',
      'truncated-length-delimited': 'o tamanho declarado é maior que os bytes disponíveis',
    },
    interpretTitle: 'Interpretação de length-delimited',
    modeAuto: 'Auto',
    modeText: 'Texto',
    modeMessage: 'Mensagem',
    modePacked: 'Packed',
    modeBytes: 'Bytes',
    int64: 'int64',
    sint64: 'sint64 (zigzag)',
    uint64: 'uint64',
    uint32: 'uint32',
    floatLbl: 'float',
    doubleLbl: 'double',
    keyLbl: 'chave',
    asString: 'string',
    asMessage: (n) => `mensagem (${n} campos)`,
    asPacked: (k, n) => `packed ${k} (${n} valores)`,
    asBytes: 'bytes',
    alsoMessage: 'também dá pra ler como mensagem',
    alsoText: 'também dá pra ler como texto',
    alsoPacked: (n) => `packed? (${n} valores)`,
    outTitle: 'Bytes de saída',
    hexOut: 'Hex',
    base64Out: 'Base64',
    grpcFrameTitle: 'Frame gRPC (5 bytes de cabeçalho + payload)',
    grpcCompressed: 'Payload comprimido (flag 1)',
    copy: 'Copiar',
    copied: 'Copiado!',
    download: 'Baixar .bin',
    encoderTitle: 'Codificar payload',
    encoderHelp: 'Monte a mensagem campo a campo e veja o hex/Base64 gerado. O botão de exemplo preenche um google.protobuf.Timestamp.',
    fieldNumber: 'Campo',
    wireType: 'Wire type',
    encoding: 'Leitura',
    value: 'Valor',
    addField: 'Adicionar campo',
    removeField: 'Remover',
    encoderExample: 'Exemplo: Timestamp',
    encoderError: 'Erro na codificação',
    encoderEmpty: 'Adicione ao menos um campo para gerar os bytes.',
    roundTrip: 'Round-trip (bytes gerados → decodificados de volta)',
    roundTripOk: (n) => `${n} campos relidos sem erro — os bytes gerados são válidos.`,
    roundTripBad: (n) => `${n} campos relidos, mas houve erro na leitura de volta.`,
    refTitle: 'Referência rápida: wire types',
    refIntro: 'O tipo do campo NÃO vai no payload — quem manda é o wire type do .proto. Sem o .proto, decodificar os bytes é uma dedução; a tabela abaixo é o mapa dessa dedução.',
    wireCol: 'Wire type',
    typesCol: 'Tipos do .proto',
    bitsCol: 'Como é lido',
    wireHow: {
      0: 'varint de 1 a 10 bytes',
      1: '8 bytes fixos (little-endian)',
      2: 'varint de tamanho + payload',
      3: 'marca de grupo (obsoleto)',
      4: 'fim de grupo (obsoleto)',
      5: '4 bytes fixos (little-endian)',
    },
    tipsTitle: 'Por que o payload não é o que você espera',
    tips: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <Text strong>proto3 não serializa valores padrão</Text>: zero, string
            vazia e false simplesmente não aparecem no payload — um campo
            ausente não é bug, é omissão proposital.
          </li>
          <li>
            <Text strong>O que vale é o número do campo</Text>, não o nome:
            renomear no .proto não muda nada nos bytes; mudar o número ou o tipo
            sim, e quebra a compatibilidade.
          </li>
          <li>
            <Text strong>Mensagem aninhada é ambígua</Text> sem o .proto: um
            length-delimited que não é texto pode ser submensagem ou um{' '}
            <Text code>repeated</Text> empacotado (packed). Por isso a página
            mostra as duas leituras.
          </li>
          <li>
            <Text strong>int32 negativo ocupa 10 bytes</Text> (sinal estendido em
            varint); <Text code>sint32</Text> usa zigzag e ocupa menos bytes —
            por isso ver um campo negativo como número enorme é normal.
          </li>
        </ul>
      </>
    ),
    howTitle: 'Como conseguir os bytes',
    howBody: (
      <>
        <pre style={{ margin: '8px 0' }}>
          <code>{`# grpcurl: a resposta crua em hex (sem o frame de 5 bytes)
grpcurl -plaintext -format=raw -d '{"nome":"Ana"}' localhost:50051 pkg.Servico/Chamar | xxd -p

# mesma coisa salvando num arquivo e decodificando sem .proto
grpcurl -plaintext -format=raw -d @req.json localhost:50051 pkg.Servico/Chamar > payload.bin
protoc --decode_raw < payload.bin

# em Go, os bytes crus de qualquer struct protobuf
b, _ := proto.Marshal(msg)
fmt.Printf("%x", b)`}</code>
        </pre>
        O frame do gRPC é sempre{' '}
        <Text strong>1 byte de flag + 4 bytes big-endian de tamanho</Text> —{' '}
        <Text code>00 00 00 00 23</Text> significa “não comprimido, 35 bytes”. Se
        os seus bytes começarem assim, ligue o switch acima para pular o
        cabeçalho, e use o botão de exemplo pra ver o round-trip.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody:
      'O motor completo está em src/utils/protobuf.js (decodificador, codificador, hex/base64 tolerante e frame gRPC). O trecho abaixo é o coração do decode — sem dependências, sem rede:',
  },
  en: {
    title: 'Protobuf Wire Format Decoder',
    intro: (
      <>
        Paste the bytes of a <Text strong>Protocol Buffers</Text> message and see
        the field tree: field number, wire type, interpreted value, offset and
        size. It also works the other way around — build a payload field by
        field and get the hex/Base64 back. Handy for debugging gRPC, queues,
        EventBridge or any service that does not return JSON. Without the{' '}
        <Text code>.proto</Text> the exact type is a heuristic (string, nested
        message or packed repeated — the page shows every plausible reading).
        100% in the browser.
      </>
    ),
    inputTitle: 'Input',
    inputPlaceholder: 'Paste the bytes as hex or Base64...',
    hex: 'Hex',
    base64: 'Base64',
    clear: 'Clear',
    samples: 'Samples',
    samplePessoa: 'Person (simple)',
    samplePedido: 'Order (nested + packed)',
    sampleTelemetria: 'Telemetry (packed double)',
    sampleGrpc: 'gRPC frame',
    grpcStrip: 'The input is a gRPC frame (strip the 5 header bytes)',
    resultTitle: 'Decoded message',
    noInput: 'Paste hex or Base64 above to decode.',
    parseError: 'Could not read the input',
    bytesCount: (n) => `${n} bytes`,
    fieldsCount: (n) => `${n} fields`,
    errorsTitle: 'Problems found',
    errors: {
      'invalid-wire-type': 'Wire type 6 or 7 — these do not exist in protobuf (at byte',
      'truncated-varint': 'Varint cut short at the end of the payload',
      'varint-too-long': 'Varint longer than 10 bytes',
      'truncated-fixed': 'Incomplete fixed32/fixed64 field',
      'unterminated-group': 'Start group (3) with no matching end group (4)',
      'mismatched-end-group': 'End group with a different number than its start group',
      'unexpected-end-group': 'End group (4) with no start group (3)',
      'too-many-fields': 'Message too large to analyze',
      'invalid-field': 'Invalid field',
    },
    atOffset: (o) => `at offset ${o} (0x${o.toString(16)})`,
    trailing: (n) => `${n} bytes left that were not read as a field — probably trailing garbage or a truncated payload.`,
    fieldWarnings: {
      'reserved-field-number': 'reserved field number (19000–19999)',
      'invalid-field-number': 'invalid field number',
      'truncated-length-delimited': 'declared length is bigger than the available bytes',
    },
    interpretTitle: 'Length-delimited interpretation',
    modeAuto: 'Auto',
    modeText: 'Text',
    modeMessage: 'Message',
    modePacked: 'Packed',
    modeBytes: 'Bytes',
    int64: 'int64',
    sint64: 'sint64 (zigzag)',
    uint64: 'uint64',
    uint32: 'uint32',
    floatLbl: 'float',
    doubleLbl: 'double',
    keyLbl: 'key',
    asString: 'string',
    asMessage: (n) => `message (${n} fields)`,
    asPacked: (k, n) => `packed ${k} (${n} values)`,
    asBytes: 'bytes',
    alsoMessage: 'also readable as a message',
    alsoText: 'also readable as text',
    alsoPacked: (n) => `packed? (${n} values)`,
    outTitle: 'Output bytes',
    hexOut: 'Hex',
    base64Out: 'Base64',
    grpcFrameTitle: 'gRPC frame (5 header bytes + payload)',
    grpcCompressed: 'Compressed payload (flag 1)',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download .bin',
    encoderTitle: 'Encode a payload',
    encoderHelp: 'Build the message field by field and see the hex/Base64 output. The sample button fills in a google.protobuf.Timestamp.',
    fieldNumber: 'Field',
    wireType: 'Wire type',
    encoding: 'Reading',
    value: 'Value',
    addField: 'Add field',
    removeField: 'Remove',
    encoderExample: 'Sample: Timestamp',
    encoderError: 'Encoding error',
    encoderEmpty: 'Add at least one field to generate bytes.',
    roundTrip: 'Round-trip (generated bytes → decoded again)',
    roundTripOk: (n) => `${n} fields read back with no error — the generated bytes are valid.`,
    roundTripBad: (n) => `${n} fields read back, but the re-read reported errors.`,
    refTitle: 'Quick reference: wire types',
    refIntro: 'The declared type is NOT in the payload — the .proto decides it through the wire type. Without the .proto, decoding bytes is a deduction; the table below is the map of that deduction.',
    wireCol: 'Wire type',
    typesCol: '.proto types',
    bitsCol: 'How it is read',
    wireHow: {
      0: 'varint of 1 to 10 bytes',
      1: '8 fixed bytes (little-endian)',
      2: 'length varint + payload',
      3: 'group start (obsolete)',
      4: 'group end (obsolete)',
      5: '4 fixed bytes (little-endian)',
    },
    tipsTitle: 'Why the payload is not what you expect',
    tips: (
      <>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li>
            <Text strong>proto3 does not serialize default values</Text>: zero,
            empty string and false are simply absent from the payload — a
            missing field is not a bug, it is a deliberate omission.
          </li>
          <li>
            <Text strong>The field number matters, not the name</Text>:
            renaming in the .proto changes nothing on the wire; changing the
            number or the type does, and breaks compatibility.
          </li>
          <li>
            <Text strong>A nested message is ambiguous</Text> without the
            .proto: a length-delimited that is not text can be a submessage or
            a packed repeated field — that is why the page shows both readings.
          </li>
          <li>
            <Text strong>A negative int32 takes 10 bytes</Text> (sign extended
            varint); <Text code>sint32</Text> uses zigzag and is shorter — so
            seeing negative values as huge numbers is normal.
          </li>
        </ul>
      </>
    ),
    howTitle: 'How to get the bytes',
    howBody: (
      <>
        <pre style={{ margin: '8px 0' }}>
          <code>{`# grpcurl: the raw response as hex (without the 5 byte frame)
grpcurl -plaintext -format=raw -d '{"nome":"Ana"}' localhost:50051 pkg.Service/Call | xxd -p

# same thing into a file, decoded with no .proto at all
grpcurl -plaintext -format=raw -d @req.json localhost:50051 pkg.Service/Call > payload.bin
protoc --decode_raw < payload.bin

# in Go, the raw bytes of any protobuf struct
b, _ := proto.Marshal(msg)
fmt.Printf("%x", b)`}</code>
        </pre>
        The gRPC frame is always a <Text strong>1 byte flag + 4 byte
        big-endian length</Text> — <Text code>00 00 00 00 23</Text> means
        “not compressed, 35 bytes”. If your bytes start like that, flip the
        switch above to skip the header, and use the sample button to see the
        round-trip.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody:
      'The full engine lives in src/utils/protobuf.js (decoder, encoder, tolerant hex/base64 and the gRPC frame). The snippet below is the heart of the decode — no dependencies, no network:',
  },
}

const ERR_STYLE = {
  background: '#fafafa',
  padding: 12,
  borderRadius: 8,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  margin: 0,
  ...MONO,
}

const ENCODINGS = {
  0: [
    { value: 'plain', label: 'int32 / int64 / enum / bool' },
    { value: 'zigzag32', label: 'sint32 (zigzag)' },
    { value: 'zigzag64', label: 'sint64 (zigzag)' },
  ],
  1: [
    { value: 'double', label: 'double' },
    { value: 'uint64', label: 'fixed64 / uint64' },
  ],
  2: [
    { value: 'text', label: 'string (UTF-8)' },
    { value: 'hex', label: 'bytes (hex)' },
    { value: 'base64', label: 'bytes (Base64)' },
  ],
  5: [
    { value: 'float', label: 'float' },
    { value: 'uint32', label: 'fixed32 / uint32' },
  ],
}

const TIMESTAMP_SAMPLE = [
  { id: 1, number: 1, wireType: 0, encoding: 'plain', value: '1700000000' },
  { id: 2, number: 2, wireType: 0, encoding: 'plain', value: '123456789' },
]

let rowId = 100
const nextId = () => {
  rowId += 1
  return rowId
}

// ─── Renderização da árvore de campos ────────────────────────────────────────

function shortList(values, t) {
  const shown = values.slice(0, 10).map((v) => v.toString()).join(', ')
  return values.length > 10 ? `${shown} … (+${values.length - 10})` : shown
}

function describeField(field, mode, t) {
  // devolve { main, detail, tags: [ReactNode], kind }
  if (field.wireType === 0) {
    return {
      kind: 'varint',
      main: `= ${field.varint}`,
      detail: `${t.int64} ${field.signed64} · ${t.sint64} ${field.zigzag}`,
      tags: [],
    }
  }
  if (field.wireType === 1) {
    return {
      kind: 'fixed64',
      main: `= ${field.fixed.double}`,
      detail: `${t.doubleLbl} ${field.fixed.double} · ${t.uint64} ${field.fixed.uint64}`,
      tags: [],
    }
  }
  if (field.wireType === 5) {
    return {
      kind: 'fixed32',
      main: `= ${field.fixed.float}`,
      detail: `${t.floatLbl} ${field.fixed.float} · ${t.uint32} ${field.fixed.uint32}`,
      tags: [],
    }
  }
  if (field.wireType === 3) {
    return {
      kind: 'group',
      main: `= { ${field.children ? field.children.length : 0} }`,
      detail: `${t.keyLbl} ${field.wireName}`,
      tags: [],
    }
  }

  const kind = pickInterpretation(field, mode)
  const payloadHex = bytesToHex(field.payload || new Uint8Array(0), ' ')
  const tags = []

  if (kind === 'text') {
    if (field.children) {
      tags.push(<Tag key="m" color="blue" style={{ fontSize: 10 }}>{t.alsoMessage}</Tag>)
    }
    return {
      kind,
      main: `= "${field.text}"`,
      detail: `${t.asString} · ${t.bytesCount(field.length)}`,
      tags,
    }
  }
  if (kind === 'message') {
    const n = field.children ? field.children.length : 0
    if (field.text) tags.push(<Tag key="s" color="blue" style={{ fontSize: 10 }}>{t.alsoText}</Tag>)
    return {
      kind,
      main: `= { ${n} }`,
      detail: `${t.asMessage(n)} · ${t.bytesCount(field.length)}`,
      tags,
    }
  }
  if (kind === 'packed') {
    const packed = field.packed.candidates[0]
    const decodes = (v) => (packed.kind === 'varint' ? (v >> 1n) ^ -(v & 1n) : v)
    return {
      kind,
      main: `= [${shortList(packed.values, t)}]`,
      detail:
        packed.kind === 'varint'
          ? `${t.asPacked('varint', packed.values.length)} · sint32 [${shortList(packed.values.map(decodes), t)}]`
          : t.asPacked(packed.kind, packed.values.length),
      tags: field.text ? [<Tag key="t" color="blue" style={{ fontSize: 10 }}>{t.alsoText}</Tag>] : [],
    }
  }

  if (field.packed && field.packed.candidates[0]) {
    tags.push(
      <Tag key="p" color="blue" style={{ fontSize: 10 }}>
        {t.alsoPacked(field.packed.candidates[0].values.length)}
      </Tag>
    )
  }
  if (field.text) {
    tags.push(<Tag key="t" color="blue" style={{ fontSize: 10 }}>{t.alsoText}</Tag>)
  }
  return {
    kind: 'bytes',
    main: `= ${payloadHex.length > 48 ? `${payloadHex.slice(0, 48)} …` : payloadHex || '(vazio)'}`,
    detail: `${t.asBytes} · ${t.bytesCount(field.length)}`,
    tags,
  }
}

function toTreeData(fields, mode, t, path = '') {
  return fields.map((field, i) => {
    const key = `${path}${i}`
    const info = describeField(field, mode, t)

    const warningTags = field.warnings
      .filter((w) => t.fieldWarnings[w])
      .map((w) => (
        <Tag key={w} color="volcano" style={{ fontSize: 10 }}>
          {t.fieldWarnings[w]}
        </Tag>
      ))

    const title = (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', ...MONO }}>
        <Tag color={WIRE_COLORS[field.wireType]} style={{ marginInlineEnd: 0, minWidth: 34, textAlign: 'center' }}>
          #{field.number}
        </Tag>
        <Text type="secondary" style={{ fontSize: 11 }}>{info.detail}</Text>
        <Text strong style={{ fontSize: 12 }}>{info.main}</Text>
        {info.tags}
        {warningTags}
        <Text type="secondary" style={{ fontSize: 10, opacity: 0.75 }}>
          @{field.offset} · {field.size} B
        </Text>
      </div>
    )

    const kids = info.kind === 'message' && field.children ? toTreeData(field.children, mode, t, `${key}.`) : null
    return { key, title, children: kids && kids.length > 0 ? kids : undefined }
  })
}

export default function ProtobufDecoderPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [format, setFormat] = useState('hex')
  const [input, setInput] = useState(SAMPLES[0].hex)
  const [stripFrame, setStripFrame] = useState(false)
  const [mode, setMode] = useState('auto')
  const [rows, setRows] = useState(TIMESTAMP_SAMPLE)

  const parsed = useMemo(() => parseInput(input, format), [input, format])

  const framed = useMemo(
    () => (parsed.bytes ? stripGrpcFrame(parsed.bytes) : null),
    [parsed.bytes]
  )
  const activeBytes = useMemo(() => {
    if (!parsed.bytes) return null
    return stripFrame && framed && framed.valid ? framed.payload : parsed.bytes
  }, [parsed.bytes, stripFrame, framed])

  const decoded = useMemo(
    () => (activeBytes ? decodeMessage(activeBytes) : null),
    [activeBytes]
  )
  const treeData = useMemo(
    () => (decoded ? toTreeData(decoded.fields, mode, t) : []),
    [decoded, mode, t]
  )
  // defaultExpandAll só se aplica na montagem da Tree — a key remonta a
  // árvore quando o payload ou a interpretação mudam, pra manter tudo
  // expandido como num decodificador de verdade.
  const treeKey = useMemo(
    () => `${mode}:${activeBytes ? activeBytes.length : 0}:${decoded ? decoded.fields.length : 0}:${decoded ? decoded.consumed : 0}`,
    [mode, activeBytes, decoded]
  )

  const encoded = useMemo(() => encodeFields(rows), [rows])
  const encodedDecoded = useMemo(
    () => (encoded.bytes ? decodeMessage(encoded.bytes) : null),
    [encoded.bytes]
  )
  const encodedTree = useMemo(
    () => (encodedDecoded ? toTreeData(encodedDecoded.fields, 'auto', t) : []),
    [encodedDecoded, t]
  )

  const copy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      message.success(t.copied)
    } catch {
      message.warning('Clipboard indisponível / Clipboard unavailable')
    }
  }

  const loadSample = (key) => {
    setFormat('hex')
    setStripFrame(false)
    if (key === 'grpc') {
      const hex = SAMPLES[0].hex
      setInput(bytesToHex(grpcFrame(parseInput(hex, 'hex').bytes)))
    } else {
      const sample = SAMPLES.find((s) => s.key === key)
      if (sample) setInput(sample.hex)
    }
  }

  const updateRow = (id, patch) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id))
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { id: nextId(), number: prev.length + 1, wireType: 2, encoding: 'text', value: '' },
    ])

  const wireTable = Object.keys(WIRE_TYPES).map((wt) => ({
    key: wt,
    wire: <Tag color={WIRE_COLORS[wt]} style={{ marginInlineEnd: 0 }}>{wt} — {WIRE_TYPES[wt].name}</Tag>,
    types: <Text code style={{ fontSize: 11 }}>{WIRE_TYPES[wt].proto}</Text>,
    how: t.wireHow[wt],
  }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApartmentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Segmented
                value={format}
                onChange={setFormat}
                options={[{ label: t.hex, value: 'hex' }, { label: t.base64, value: 'base64' }]}
              />
            </Col>
            <Col xs={24} md={12}>
              <Switch checked={stripFrame} onChange={setStripFrame} />{' '}
              <Text style={{ marginLeft: 8 }}>{t.grpcStrip}</Text>
            </Col>
          </Row>

          <TextArea
            rows={7}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            spellCheck={false}
            style={MONO}
          />

          <Space wrap>
            <Text strong>{t.samples}:</Text>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => loadSample('pessoa')}>{t.samplePessoa}</Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => loadSample('pedido')}>{t.samplePedido}</Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => loadSample('telemetria')}>{t.sampleTelemetria}</Button>
            <Button size="small" icon={<ThunderboltOutlined />} onClick={() => loadSample('grpc')}>{t.sampleGrpc}</Button>
            <Button size="small" icon={<ClearOutlined />} onClick={() => setInput('')}>{t.clear}</Button>
          </Space>

          {framed && framed.valid && !stripFrame && (
            <Alert
              type="info"
              showIcon
              message={`${t.grpcFrameTitle}: ${bytesToHex(parsed.bytes.slice(0, 5))}`}
              description={
                <Button size="small" onClick={() => setStripFrame(true)}>
                  {t.grpcStrip}
                </Button>
              }
            />
          )}
        </Space>
      </Card>

      <Card
        title={t.resultTitle}
        extra={
          decoded && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.bytesCount(activeBytes.length)} · {t.fieldsCount(decoded.fields.length)}
            </Text>
          )
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {parsed.error && <Alert type="error" showIcon message={t.parseError} description={parsed.error} />}
          {!parsed.error && !activeBytes && <Empty description={t.noInput} />}

          {decoded && (
            <>
              {decoded.errors.length > 0 && (
                <Alert
                  type="error"
                  showIcon
                  icon={<WarningOutlined />}
                  message={t.errorsTitle}
                  description={
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {decoded.errors.map((err, i) => (
                        <li key={i}>
                          {t.errors[err.code] || err.code}{' '}
                          <Text type="secondary">{t.atOffset(err.offset)}</Text>
                        </li>
                      ))}
                      {decoded.trailing > 0 && <li>{t.trailing(decoded.trailing)}</li>}
                    </ul>
                  }
                />
              )}

              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} md={14}>
                  <Text strong>{t.interpretTitle}</Text>
                </Col>
                <Col xs={24} md={10}>
                  <Segmented
                    size="small"
                    block
                    value={mode}
                    onChange={setMode}
                    options={[
                      { label: t.modeAuto, value: 'auto' },
                      { label: t.modeText, value: 'text' },
                      { label: t.modeMessage, value: 'message' },
                      { label: t.modePacked, value: 'packed' },
                      { label: t.modeBytes, value: 'bytes' },
                    ]}
                  />
                </Col>
              </Row>

              {decoded.fields.length === 0 ? (
                <Empty description={t.noInput} />
              ) : (
                <Tree
                  key={treeKey}
                  treeData={treeData}
                  defaultExpandAll
                  selectable={false}
                  showLine={false}
                  style={{ background: '#fafafa', padding: 8, borderRadius: 8 }}
                />
              )}
            </>
          )}
        </Space>
      </Card>

      {activeBytes && (
        <Card title={t.outTitle}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Space>
                <Text strong>{t.hexOut}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(bytesToHex(activeBytes))}>{t.copy}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadBytes(activeBytes, 'payload.bin')}>{t.download}</Button>
              </Space>
              <pre style={ERR_STYLE}>{bytesToHex(activeBytes)}</pre>
            </div>

            <div>
              <Space>
                <Text strong>{t.base64Out}</Text>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(bytesToBase64(activeBytes))}>{t.copy}</Button>
              </Space>
              <pre style={ERR_STYLE}>{bytesToBase64(activeBytes)}</pre>
            </div>

            <div>
              <Text strong>{t.grpcFrameTitle}</Text>
              <pre style={ERR_STYLE}>
                {bytesToHex(grpcFrame(activeBytes, false))}
                {'\n'}
                {bytesToHex(grpcFrame(activeBytes, true))}
                {'\n'}
                {bytesToBase64(grpcFrame(activeBytes, false))}
              </pre>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {t.grpcCompressed}
              </Text>
            </div>
          </Space>
        </Card>
      )}

      <Card title={t.encoderTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>{t.encoderHelp}</Paragraph>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map((row) => (
              <Row key={row.id} gutter={[8, 8]} align="middle">
                <Col xs={24} sm={6} md={4}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t.fieldNumber}</Text>
                  <InputNumber
                    min={1}
                    max={MAX_FIELD_NUMBER}
                    value={row.number}
                    onChange={(v) => updateRow(row.id, { number: v })}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} sm={18} md={8}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t.wireType}</Text>
                  <Select
                    value={row.wireType}
                    onChange={(v) => {
                      const encoding = ENCODINGS[v][0].value
                      updateRow(row.id, { wireType: v, encoding })
                    }}
                    options={Object.keys(ENCODINGS).map((wt) => ({
                      value: Number(wt),
                      label: `${wt} — ${WIRE_TYPES[wt].name}`,
                    }))}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t.encoding}</Text>
                  <Select
                    value={row.encoding}
                    onChange={(v) => updateRow(row.id, { encoding: v })}
                    options={ENCODINGS[row.wireType]}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={5}>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t.value}</Text>
                  <Input
                    value={row.value}
                    onChange={(e) => updateRow(row.id, { value: e.target.value })}
                    style={{ ...MONO }}
                  />
                </Col>
                <Col xs={24} md={1}>
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => removeRow(row.id)}
                    aria-label={t.removeField}
                  />
                </Col>
              </Row>
            ))}
          </div>

          <Space wrap>
            <Button icon={<PlusOutlined />} onClick={addRow}>{t.addField}</Button>
            <Button icon={<ThunderboltOutlined />} onClick={() => setRows(TIMESTAMP_SAMPLE.map((r) => ({ ...r })))}>
              {t.encoderExample}
            </Button>
          </Space>

          {encoded.error && <Alert type="error" showIcon message={t.encoderError} description={encoded.error} />}

          {!encoded.error && rows.length === 0 && <Alert type="info" showIcon message={t.encoderEmpty} />}

          {!encoded.error && encoded.bytes && encoded.bytes.length > 0 && (
            <>
              <div>
                <Space>
                  <Text strong>{t.hexOut}</Text>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(bytesToHex(encoded.bytes))}>{t.copy}</Button>
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadBytes(encoded.bytes, 'payload.bin')}>{t.download}</Button>
                </Space>
                <pre style={ERR_STYLE}>{bytesToHex(encoded.bytes)}</pre>
              </div>
              <div>
                <Space>
                  <Text strong>{t.base64Out}</Text>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copy(bytesToBase64(encoded.bytes))}>{t.copy}</Button>
                </Space>
                <pre style={ERR_STYLE}>{bytesToBase64(encoded.bytes)}</pre>
              </div>

              <Collapse>
                <Panel header={t.roundTrip} key="roundtrip">
                  <Alert
                    type={encodedDecoded && encodedDecoded.errors.length === 0 ? 'success' : 'warning'}
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={
                      encodedDecoded && encodedDecoded.errors.length === 0
                        ? t.roundTripOk(encodedDecoded.fields.length)
                        : t.roundTripBad(encodedDecoded ? encodedDecoded.fields.length : 0)
                    }
                  />
                  <Tree key="encoded" treeData={encodedTree} defaultExpandAll selectable={false} showLine={false} />
                </Panel>
              </Collapse>
            </>
          )}
        </Space>
      </Card>

      <Card title={t.refTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Paragraph type="secondary">{t.refIntro}</Paragraph>
          <Table
            size="small"
            pagination={false}
            columns={[
              { title: t.wireCol, dataIndex: 'wire', key: 'wire' },
              { title: t.typesCol, dataIndex: 'types', key: 'types' },
              { title: t.bitsCol, dataIndex: 'how', key: 'how' },
            ]}
            dataSource={wireTable}
          />
          <Alert type="warning" showIcon message={t.tipsTitle} description={t.tips} />
          <Alert type="info" showIcon message={t.howTitle} description={t.howBody} />
        </Space>
      </Card>

      <Collapse>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceBody}</Paragraph>
          <pre style={{ margin: 0, overflowX: 'auto', ...MONO }}>
            <code>{SOURCE_SNIPPET}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
