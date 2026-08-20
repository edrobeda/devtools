import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Row,
  Col,
  Segmented,
  Switch,
  Alert,
  Collapse,
  Tag,
  Upload,
  message,
} from 'antd'
import {
  CodeOutlined,
  CopyOutlined,
  ClearOutlined,
  UploadOutlined,
  DownloadOutlined,
  SwapOutlined,
  FileTextOutlined,
  DeleteOutlined,
  SafetyOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  strToBytes,
  hexToBytes,
  createHexDump,
  toHexString,
  bytesToText,
  utf8DecodeErrors,
  byteStats,
  downloadBytes,
  downloadText,
  SAMPLES,
  SAMPLE_DUMP,
} from '../utils/hexDump'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const SOURCE_SNIPPET = `// gera o dump estilo xxd a partir de bytes
export function createHexDump(bytes, opts) {
  const { bytesPerLine = 16, group = 2, uppercase = false,
          showOffset = true, showAscii = true } = opts || {}

  const hexByte = (b) => {
    const s = b.toString(16).padStart(2, '0')
    return uppercase ? s.toUpperCase() : s
  }
  const groupsPerLine = Math.max(1, Math.ceil(bytesPerLine / Math.max(1, group)))
  const fullHexWidth = groupsPerLine * group * 2 + (groupsPerLine - 1)

  const lines = []
  for (let off = 0; off < bytes.length; off += bytesPerLine) {
    const chunk = bytes.slice(off, off + bytesPerLine)
    let hex = ''
    for (let g = 0; g < chunk.length; g += group) {
      if (g > 0) hex += ' '
      let s = ''
      for (let k = 0; k < group && g + k < chunk.length; k++) s += hexByte(chunk[g + k])
      hex += s
    }
    let line = showOffset ? off.toString(16).padStart(8, '0') + ': ' : ''
    line += hex.padEnd(fullHexWidth)
    if (showAscii) {
      let ascii = ''
      for (let k = 0; k < chunk.length; k++) {
        const c = chunk[k]
        ascii += (c >= 0x20 && c <= 0x7e) ? String.fromCharCode(c) : '.'
      }
      line += '  ' + ascii
    }
    lines.push(line)
  }
  return lines.join('\\n')
}`

const translations = {
  pt: {
    title: 'Hex Dump / xxd Viewer',
    intro: (
      <>
        Gere um hexdump estilo <Text code>xxd</Text> /{' '}
        <Text code>hexdump -C</Text> a partir de texto ou arquivo binário, e
        faça o caminho inverso — hex/dump <Text code>→</Text> texto (UTF-8 ou
        Latin-1). O parser reverso aceita hex puro, separadores, escapes{' '}
        <Text code>\x48</Text> / <Text code>0x48</Text> e até um dump inteiro
        colado com offsets e coluna ASCII. 100% no navegador.
      </>
    ),
    toHex: 'Texto → Hexdump',
    toText: 'Hexdump → Texto',
    inputTitle: 'Entrada',
    inputPlaceholder: 'Cole texto (modo hexdump) ou hex/um dump (modo reverso)...',
    loadFile: 'Carregar arquivo',
    removeFile: 'Remover arquivo',
    clear: 'Limpar',
    fileLoaded: 'Arquivo binário',
    sampleMultilang: 'Exemplo multilíngua',
    sampleJson: 'Exemplo JSON',
    sampleHttp: 'Exemplo HTTP',
    sampleDump: 'Exemplo de dump',
    optionsTitle: 'Opções do dump',
    bytesPerLine: 'Bytes por linha',
    group: 'Agrupar de',
    uppercase: 'Hex maiúsculo',
    showOffset: 'Mostrar offset',
    showAscii: 'Coluna ASCII',
    groupUnit: (n) => (n === 1 ? '1 byte' : `${n} bytes`),
    outputTitle: 'Saída',
    dumpLabel: 'Hexdump',
    hexOnlyLabel: 'Hex puro (sem offset/ascii)',
    decodedLabel: 'Texto decodificado',
    copy: 'Copiar',
    copied: 'Copiado!',
    downloadDump: 'Baixar dump (.txt)',
    downloadBytes: 'Baixar bytes (.bin)',
    downloadText: 'Baixar texto (.txt)',
    statsBytes: 'bytes',
    statsLines: 'linhas',
    printable: 'imprimíveis',
    utf8Ok: 'Válido como UTF-8',
    utf8Bad: (n) => `Inválido como UTF-8 (${n} sequências substituídas por �)`,
    encoding: 'Decodificação',
    errTitle: 'Hex inválido',
    errOdd: 'Número ímpar de dígitos hex (um byte = 2 dígitos).',
    errAt: (e) =>
      `Caractere "${e.char}" inesperado na linha ${e.line}, coluna ${e.col} (e ${e.count} no total).`,
    emptyInput: 'Digite algo na entrada para ver o hexdump.',
    emptyDecoded: 'Nada para decodificar ainda.',
    tipTitle: 'Dica',
    tipBody: (
      <>
        Use <Text code>xxd arquivo</Text> no terminal para conferir se o seu
        hexdump bate com o daqui. Os primeiros bytes de um arquivo costumam
        revelar o tipo (magic numbers): <Text code>FF D8 FF</Text> = JPEG,{' '}
        <Text code>89 50 4E 47</Text> = PNG, <Text code>50 4B</Text> = ZIP.
        Nenhum dado sai do navegador.
      </>
    ),
    howTitle: 'Como funciona',
    howBody: (
      <>
        Cada linha tem três partes: o <Text strong>offset</Text> (posição em
        hexadecimal, 8 dígitos), os <Text strong>bytes</Text> em hex separados
        em grupos de <Text code>group</Text> bytes, e a{' '}
        <Text strong>coluna ASCII</Text> à direita (caracteres imprimíveis
        0x20–0x7E, o resto vira <Text code>. </Text>). No caminho reverso, o
        parser descarta o prefixo de offset ({' '}
        <Text code>00000000:</Text> ) e qualquer coisa depois de 2+ espaços
        (a coluna ASCII), junta os dígitos hex restantes e converte dois a
        dois em bytes — por isso você pode colar um dump inteiro de volta.
      </>
    ),
    sourceTitle: 'Código-fonte',
    sourceBody: 'Motor 100% client-side em src/utils/hexDump.js: strToBytes usa TextEncoder (UTF-8), createHexDump monta cada linha com offset/grupos/ASCII, hexToBytes faz o parse reverso tolerante (offsets e coluna ASCII são ignorados) e bytesToText decodifica UTF-8 (com fallback e contagem de �) ou Latin-1.',
  },
  en: {
    title: 'Hex Dump / xxd Viewer',
    intro: (
      <>
        Generate an <Text code>xxd</Text> / <Text code>hexdump -C</Text>{' '}
        style hex dump from text or a binary file, and reverse it — hex/dump{' '}
        <Text code>→</Text> text (UTF-8 or Latin-1). The reverse parser
        accepts plain hex, separators, <Text code>\x48</Text> /{' '}
        <Text code>0x48</Text> escapes and even a full pasted dump with
        offsets and an ASCII column. 100% in the browser.
      </>
    ),
    toHex: 'Text → Hex dump',
    toText: 'Hex dump → Text',
    inputTitle: 'Input',
    inputPlaceholder: 'Paste text (dump mode) or hex/a dump (reverse mode)...',
    loadFile: 'Load file',
    removeFile: 'Remove file',
    clear: 'Clear',
    fileLoaded: 'Binary file',
    sampleMultilang: 'Multilingual sample',
    sampleJson: 'JSON sample',
    sampleHttp: 'HTTP sample',
    sampleDump: 'Dump sample',
    optionsTitle: 'Dump options',
    bytesPerLine: 'Bytes per line',
    group: 'Group by',
    uppercase: 'Uppercase hex',
    showOffset: 'Show offset',
    showAscii: 'ASCII column',
    groupUnit: (n) => (n === 1 ? '1 byte' : `${n} bytes`),
    outputTitle: 'Output',
    dumpLabel: 'Hex dump',
    hexOnlyLabel: 'Plain hex (no offset/ascii)',
    decodedLabel: 'Decoded text',
    copy: 'Copy',
    copied: 'Copied!',
    downloadDump: 'Download dump (.txt)',
    downloadBytes: 'Download bytes (.bin)',
    downloadText: 'Download text (.txt)',
    statsBytes: 'bytes',
    statsLines: 'lines',
    printable: 'printable',
    utf8Ok: 'Valid UTF-8',
    utf8Bad: (n) => `Invalid as UTF-8 (${n} sequences replaced with �)`,
    encoding: 'Decoding',
    errTitle: 'Invalid hex',
    errOdd: 'Odd number of hex digits (one byte = 2 digits).',
    errAt: (e) =>
      `Unexpected character "${e.char}" at line ${e.line}, column ${e.col} (${e.count} total).`,
    emptyInput: 'Type something in the input to see the hex dump.',
    emptyDecoded: 'Nothing to decode yet.',
    tipTitle: 'Tip',
    tipBody: (
      <>
        Use <Text code>xxd file</Text> in the terminal to cross-check your dump
        against this one. A file’s first bytes often reveal its type (magic
        numbers): <Text code>FF D8 FF</Text> = JPEG, <Text code>89 50 4E 47</Text>{' '}
        = PNG, <Text code>50 4B</Text> = ZIP. Nothing leaves the browser.
      </>
    ),
    howTitle: 'How it works',
    howBody: (
      <>
        Each line has three parts: the <Text strong>offset</Text> (position in
        hex, 8 digits), the <Text strong>bytes</Text> in hex grouped in{' '}
        <Text code>group</Text>-byte blocks, and the{' '}
        <Text strong>ASCII column</Text> on the right (printable 0x20–0x7E,
        everything else becomes <Text code>.</Text>). On the reverse path the
        parser drops the offset prefix ({' '} <Text code>00000000:</Text> )
        and anything after 2+ spaces (the ASCII column), joins the remaining
        hex digits and converts them two at a time into bytes — so you can
        paste a whole dump back in.
      </>
    ),
    sourceTitle: 'Source code',
    sourceBody: '100% client-side engine in src/utils/hexDump.js: strToBytes uses TextEncoder (UTF-8), createHexDump builds each line with offset/groups/ASCII, hexToBytes does the tolerant reverse parse (offsets and the ASCII column are ignored) and bytesToText decodes UTF-8 (with fallback and � count) or Latin-1.',
  },
}

const MONO = { fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace', fontSize: 12 }

export default function HexDumpPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [direction, setDirection] = useState('toHex')
  const [text, setText] = useState(SAMPLES.multilang)
  const [fileBytes, setFileBytes] = useState(null)
  const [fileName, setFileName] = useState('')

  const [bpl, setBpl] = useState(16)
  const [group, setGroup] = useState(2)
  const [uppercase, setUppercase] = useState(false)
  const [showOffset, setShowOffset] = useState(true)
  const [showAscii, setShowAscii] = useState(true)
  const [encoding, setEncoding] = useState('utf8')

  const fromFile = fileBytes != null

  const parsed = useMemo(() => {
    if (fromFile) return { bytes: fileBytes, error: null }
    if (direction === 'toHex') return { bytes: strToBytes(text), error: null }
    if (!text.trim()) return { bytes: null, error: null }
    return hexToBytes(text)
  }, [fromFile, fileBytes, direction, text])

  const bytes = parsed.bytes

  const dump = useMemo(
    () => (bytes ? createHexDump(bytes, { bytesPerLine: bpl, group, uppercase, showOffset, showAscii }) : ''),
    [bytes, bpl, group, uppercase, showOffset, showAscii]
  )

  const hexOnly = useMemo(
    () => (bytes ? toHexString(bytes, { sep: ' ', uppercase }) : ''),
    [bytes, uppercase]
  )

  const decoded = useMemo(
    () => (bytes && direction === 'toText' ? bytesToText(bytes, encoding) : ''),
    [bytes, direction, encoding]
  )

  const utf8 = useMemo(() => (bytes ? utf8DecodeErrors(bytes) : null), [bytes])
  const stats = useMemo(() => (bytes ? byteStats(bytes) : null), [bytes])

  const copy = async (value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      message.success(t.copied)
    } catch {
      message.warning('Clipboard unavailable / Clipboard indisponível')
    }
  }

  const handleFile = ({ file }) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setFileBytes(new Uint8Array(e.target.result))
      setFileName(file.name)
    }
    reader.onerror = () => message.error('Erro ao ler arquivo / Error reading file')
    reader.readAsArrayBuffer(file)
  }

  const loadSample = (key) => {
    setDirection(key === 'dump' ? 'toText' : 'toHex')
    setFileBytes(null)
    setText(key === 'dump' ? SAMPLE_DUMP : SAMPLES[key])
  }

  const clearAll = () => {
    setFileBytes(null)
    setText('')
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.inputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Segmented
            value={direction}
            onChange={setDirection}
            options={[
              { label: t.toHex, value: 'toHex' },
              { label: t.toText, value: 'toText' },
            ]}
          />

          <TextArea
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.inputPlaceholder}
            disabled={fromFile}
          />

          {fromFile && (
            <Alert
              type="info"
              showIcon
              message={t.fileLoaded}
              description={fileName}
              action={<Button icon={<DeleteOutlined />} onClick={() => setFileBytes(null)}>{t.removeFile}</Button>}
            />
          )}

          <Space wrap>
            <Upload beforeUpload={() => false} onChange={handleFile} showUploadList={false}>
              <Button icon={<UploadOutlined />}>{t.loadFile}</Button>
            </Upload>
            <Button icon={<FileTextOutlined />} onClick={() => loadSample('multilang')}>{t.sampleMultilang}</Button>
            <Button icon={<FileTextOutlined />} onClick={() => loadSample('json')}>{t.sampleJson}</Button>
            <Button icon={<SwapOutlined />} onClick={() => loadSample('http')}>{t.sampleHttp}</Button>
            <Button icon={<SwapOutlined />} onClick={() => loadSample('dump')}>{t.sampleDump}</Button>
            <Button icon={<ClearOutlined />} onClick={clearAll}>{t.clear}</Button>
          </Space>
        </Space>
      </Card>

      <Card title={t.optionsTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Text strong>{t.bytesPerLine}</Text>
              <div style={{ marginTop: 4 }}>
                <Segmented value={bpl} onChange={setBpl} options={[8, 16, 32]} />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Text strong>{t.group}</Text>
              <div style={{ marginTop: 4 }}>
                <Segmented
                  value={group}
                  onChange={setGroup}
                  options={[1, 2, 4].map((n) => ({ label: t.groupUnit(n), value: n }))}
                />
              </div>
            </Col>
            <Col xs={12} md={6}><Switch checked={uppercase} onChange={setUppercase} checkedChildren="Aa" unCheckedChildren="aa" /> <Text style={{ marginLeft: 8 }}>{t.uppercase}</Text></Col>
            <Col xs={12} md={6}><Switch checked={showOffset} onChange={setShowOffset} /> <Text style={{ marginLeft: 8 }}>{t.showOffset}</Text></Col>
            <Col xs={12} md={6}><Switch checked={showAscii} onChange={setShowAscii} /> <Text style={{ marginLeft: 8 }}>{t.showAscii}</Text></Col>
            {direction === 'toText' && (
              <Col xs={12} md={6}>
                <Text strong>{t.encoding}</Text>
                <div style={{ marginTop: 4 }}>
                  <Segmented value={encoding} onChange={setEncoding} options={['utf8', 'latin1']} />
                </div>
              </Col>
            )}
          </Row>
        </Space>
      </Card>

      <Card title={t.outputTitle}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {parsed.error && (
            <Alert
              type="error"
              showIcon
              message={t.errTitle}
              description={parsed.error.odd ? t.errOdd : t.errAt(parsed.error)}
            />
          )}

          {!bytes && !parsed.error && (
            <Alert type="info" showIcon message={direction === 'toHex' ? t.emptyInput : t.emptyDecoded} />
          )}

          {bytes && (
            <>
              {utf8 && !utf8.fatal && (
                <Alert type="success" showIcon icon={<SafetyOutlined />} message={t.utf8Ok} />
              )}
              {utf8 && utf8.fatal && (
                <Alert type="warning" showIcon message={t.utf8Bad(utf8.errors)} />
              )}

              {stats && (
                <Space wrap>
                  <Tag>{stats.bytes} {t.statsBytes}</Tag>
                  <Tag>{dump ? dump.split('\n').length : 0} {t.statsLines}</Tag>
                  <Tag>{Math.round(stats.printablePct)}% {t.printable}</Tag>
                </Space>
              )}

              <Text strong>{t.dumpLabel}</Text>
              <pre style={{ ...MONO, background: '#fafafa', padding: 12, borderRadius: 8, overflow: 'auto', whiteSpace: 'pre', margin: 0 }}>
                {dump || <Text type="secondary">{t.emptyInput}</Text>}
              </pre>
              <Space wrap>
                <Button icon={<CopyOutlined />} onClick={() => copy(dump)}>{t.copy}</Button>
                <Button icon={<DownloadOutlined />} onClick={() => downloadText(dump, 'hexdump.txt')}>{t.downloadDump}</Button>
                <Button icon={<DownloadOutlined />} onClick={() => downloadBytes(bytes, 'bytes.bin')}>{t.downloadBytes}</Button>
              </Space>

              {direction === 'toHex' && (
                <>
                  <Text strong>{t.hexOnlyLabel}</Text>
                  <pre style={{ ...MONO, background: '#fafafa', padding: 12, borderRadius: 8, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                    {hexOnly}
                  </pre>
                  <Button icon={<CopyOutlined />} onClick={() => copy(hexOnly)}>{t.copy}</Button>
                </>
              )}

              {direction === 'toText' && (
                <>
                  <Text strong>{t.decodedLabel}</Text>
                  <pre style={{ ...MONO, background: '#fafafa', padding: 12, borderRadius: 8, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                    {decoded}
                  </pre>
                  <Space wrap>
                    <Button icon={<CopyOutlined />} onClick={() => copy(decoded)}>{t.copy}</Button>
                    <Button icon={<DownloadOutlined />} onClick={() => downloadText(decoded, 'decoded.txt')}>{t.downloadText}</Button>
                  </Space>
                </>
              )}
            </>
          )}
        </Space>
      </Card>

      <Alert type="info" message={t.tipTitle} description={t.tipBody} />

      <Collapse>
        <Panel header={t.howTitle} key="how">
          <Paragraph>{t.howBody}</Paragraph>
        </Panel>
        <Panel header={t.sourceTitle} key="source">
          <Paragraph>{t.sourceBody}</Paragraph>
          <pre style={{ background: '#f6f6f6', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            <code>{SOURCE_SNIPPET}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}