import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, Segmented, Table, Tag, Button, Alert, Collapse, message } from 'antd'
import { ReadOutlined, SearchOutlined, CopyOutlined, FileTextOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const SIGNATURES = [
  // ─── Images ────────────────────────────────────────────────────────
  { hex: '89 50 4E 47 0D 0A 1A 0A', offset: 0, type: 'PNG', ext: '.png', cat: 'image', fileCmd: 'PNG image data' },
  { hex: 'FF D8 FF E0', offset: 0, type: 'JPEG (JFIF)', ext: '.jpg, .jpeg', cat: 'image', fileCmd: 'JPEG image data' },
  { hex: 'FF D8 FF E1', offset: 0, type: 'JPEG (Exif)', ext: '.jpg, .jpeg', cat: 'image', fileCmd: 'JPEG image data' },
  { hex: 'FF D8 FF DB', offset: 0, type: 'JPEG (DQT)', ext: '.jpg, .jpeg', cat: 'image', fileCmd: 'JPEG image data' },
  { hex: 'FF D8 FF EE', offset: 0, type: 'JPEG (Samsung)', ext: '.jpg', cat: 'image', fileCmd: 'JPEG image data' },
  { hex: '47 49 46 38 37 61', offset: 0, type: 'GIF87a', ext: '.gif', cat: 'image', fileCmd: 'GIF image data' },
  { hex: '47 49 46 38 39 61', offset: 0, type: 'GIF89a', ext: '.gif', cat: 'image', fileCmd: 'GIF image data' },
  { hex: '42 4D', offset: 0, type: 'BMP', ext: '.bmp', cat: 'image', fileCmd: 'BMP image data' },
  { hex: '49 49 2A 00', offset: 0, type: 'TIFF (Little-Endian)', ext: '.tif, .tiff', cat: 'image', fileCmd: 'TIFF image data' },
  { hex: '4D 4D 00 2A', offset: 0, type: 'TIFF (Big-Endian)', ext: '.tif, .tiff', cat: 'image', fileCmd: 'TIFF image data' },
  { hex: '52 49 46 46', offset: 0, type: 'RIFF container', ext: '(check offset 8)', cat: 'image', fileCmd: '', note: 'Check offset +8: WEBP=57 45 42 50, WAV=57 41 56 45, AVI=41 56 49 20' },
  { hex: '00 00 01 00', offset: 0, type: 'ICO', ext: '.ico', cat: 'image', fileCmd: 'icon' },
  { hex: '00 00 02 00', offset: 0, type: 'CUR', ext: '.cur', cat: 'image', fileCmd: 'cursor' },

  // ─── Audio / Video ────────────────────────────────────────────────
  { hex: '49 44 33', offset: 0, type: 'MP3 (ID3v2)', ext: '.mp3', cat: 'audio', fileCmd: 'Audio file, MP3' },
  { hex: 'FF FB', offset: 0, type: 'MP3 (MPEG1 Layer3)', ext: '.mp3', cat: 'audio', fileCmd: 'Audio file, MP3' },
  { hex: 'FF F3', offset: 0, type: 'MP3 (MPEG1 Layer3)', ext: '.mp3', cat: 'audio', fileCmd: 'Audio file, MP3' },
  { hex: 'FF F2', offset: 0, type: 'MP3 (MPEG2 Layer3)', ext: '.mp3', cat: 'audio', fileCmd: 'Audio file, MP3' },
  { hex: '66 4C 61 43', offset: 0, type: 'FLAC', ext: '.flac', cat: 'audio', fileCmd: 'FLAC audio data' },
  { hex: '4F 67 67 53', offset: 0, type: 'OGG container', ext: '.ogg', cat: 'audio', fileCmd: 'Ogg data' },
  { hex: '4D 54 68 64', offset: 0, type: 'MIDI', ext: '.mid, .midi', cat: 'audio', fileCmd: 'Standard MIDI data' },
  { hex: '1A 45 DF A3', offset: 0, type: 'EBML (MKV/WebM)', ext: '.mkv, .webm', cat: 'video', fileCmd: 'Matroska data' },
  { hex: '52 49 46 46', offset: 0, type: 'AVI', ext: '.avi', cat: 'video', fileCmd: 'RIFF (little-endian) data, AVI movie' },
  { hex: '47', offset: 0, type: 'MPEG-TS (sync byte)', ext: '.ts, .mts', cat: 'video', fileCmd: 'MPEG transport stream data' },

  // ─── Archives / Compression ──────────────────────────────────────
  { hex: '50 4B 03 04', offset: 0, type: 'ZIP / JAR / APK / DOCX', ext: '.zip, .jar, .apk', cat: 'archive', fileCmd: 'Zip archive data' },
  { hex: '50 4B 05 06', offset: 0, type: 'ZIP (empty archive)', ext: '.zip', cat: 'archive', fileCmd: 'Zip archive data' },
  { hex: '50 4B 07 08', offset: 0, type: 'ZIP (spanned)', ext: '.zip', cat: 'archive', fileCmd: 'Zip archive data' },
  { hex: '52 61 72 21 1A 07 00', offset: 0, type: 'RAR v4', ext: '.rar', cat: 'archive', fileCmd: 'RAR archive data' },
  { hex: '52 61 72 21 1A 07 01 00', offset: 0, type: 'RAR v5', ext: '.rar', cat: 'archive', fileCmd: 'RAR archive data' },
  { hex: '37 7A BC AF 27 1C', offset: 0, type: '7-Zip', ext: '.7z', cat: 'archive', fileCmd: '7-zip archive data' },
  { hex: '1F 8B 08', offset: 0, type: 'gzip', ext: '.gz', cat: 'archive', fileCmd: 'gzip compressed data' },
  { hex: '42 5A 68', offset: 0, type: 'bzip2', ext: '.bz2', cat: 'archive', fileCmd: 'bzip2 compressed data' },
  { hex: 'FD 37 7A 58 5A 00', offset: 0, type: 'XZ', ext: '.xz', cat: 'archive', fileCmd: 'XZ compressed data' },
  { hex: '28 B5 2F FD', offset: 0, type: 'Zstandard', ext: '.zst', cat: 'archive', fileCmd: 'Zstandard compressed data' },
  { hex: '04 22 4D 18', offset: 0, type: 'LZ4', ext: '.lz4', cat: 'archive', fileCmd: 'LZ4 compressed data' },
  { hex: '75 73 74 61 72', offset: 257, type: 'tar (ustar)', ext: '.tar', cat: 'archive', fileCmd: 'POSIX tar archive' },
  { hex: '78 9C', offset: 0, type: 'zlib (deflate)', ext: '', cat: 'archive', fileCmd: '' },
  { hex: '78 01', offset: 0, type: 'zlib (no compression)', ext: '', cat: 'archive', fileCmd: '' },
  { hex: '78 DA', offset: 0, type: 'zlib (best compression)', ext: '', cat: 'archive', fileCmd: '' },

  // ─── Documents ────────────────────────────────────────────────────
  { hex: '25 50 44 46', offset: 0, type: 'PDF', ext: '.pdf', cat: 'document', fileCmd: 'PDF document' },
  { hex: '7B 5C 72 74 66', offset: 0, type: 'RTF', ext: '.rtf', cat: 'document', fileCmd: 'Rich Text Format data' },
  { hex: '3C 3F 78 6D 6C', offset: 0, type: 'XML', ext: '.xml, .svg, .xhtml', cat: 'document', fileCmd: 'XML' },

  // ─── Executables / Code ──────────────────────────────────────────
  { hex: '7F 45 4C 46', offset: 0, type: 'ELF', ext: '.elf, .so, .bin', cat: 'executable', fileCmd: 'ELF' },
  { hex: 'FE ED FA CE', offset: 0, type: 'Mach-O 32-bit', ext: '.dylib, .o', cat: 'executable', fileCmd: 'Mach-O 32-bit' },
  { hex: 'FE ED FA CF', offset: 0, type: 'Mach-O 64-bit', ext: '.dylib, .o', cat: 'executable', fileCmd: 'Mach-O 64-bit' },
  { hex: 'CE FA ED FE', offset: 0, type: 'Mach-O 32-bit (LE)', ext: '.dylib, .o', cat: 'executable', fileCmd: 'Mach-O 32-bit' },
  { hex: 'CF FA ED FE', offset: 0, type: 'Mach-O 64-bit (LE)', ext: '.dylib, .o', cat: 'executable', fileCmd: 'Mach-O 64-bit' },
  { hex: 'CA FE BA BE', offset: 0, type: 'Mach-O Fat / Java class', ext: '.class, .dylib', cat: 'executable', fileCmd: 'Mach-O universal binary' },
  { hex: '4D 5A', offset: 0, type: 'PE (MZ header)', ext: '.exe, .dll', cat: 'executable', fileCmd: 'PE32' },
  { hex: '00 61 73 6D', offset: 0, type: 'WebAssembly', ext: '.wasm', cat: 'executable', fileCmd: 'WebAssembly' },

  // ─── Databases ────────────────────────────────────────────────────
  { hex: '53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33 00', offset: 0, type: 'SQLite 3', ext: '.sqlite, .db', cat: 'database', fileCmd: 'SQLite 3.x database' },
  { hex: '00 05 31 62', offset: 0, type: 'Berkeley DB 1.85', ext: '.db', cat: 'database', fileCmd: 'Berkeley DB' },
  { hex: '00 06 31 62', offset: 0, type: 'Berkeley DB 2.x', ext: '.db', cat: 'database', fileCmd: 'Berkeley DB' },

  // ─── Fonts ────────────────────────────────────────────────────────
  { hex: '00 01 00 00 00', offset: 0, type: 'TrueType', ext: '.ttf', cat: 'font', fileCmd: 'TrueType font data' },
  { hex: '4F 54 54 4F', offset: 0, type: 'OpenType (CFF)', ext: '.otf', cat: 'font', fileCmd: 'OpenType font data' },
  { hex: '74 74 63 66', offset: 0, type: 'TrueType Collection', ext: '.ttc', cat: 'font', fileCmd: 'TrueType Collection' },
  { hex: '77 4F 46 46', offset: 0, type: 'WOFF', ext: '.woff', cat: 'font', fileCmd: 'WOFF font data' },
  { hex: '77 4F 46 32', offset: 0, type: 'WOFF2', ext: '.woff2', cat: 'font', fileCmd: 'WOFF2 font data' },

  // ─── Network / Forensics ─────────────────────────────────────────
  { hex: 'D4 C3 B2 A1', offset: 0, type: 'pcap (LE)', ext: '.pcap', cat: 'forensic', fileCmd: 'pcap capture file' },
  { hex: 'A1 B2 C3 D4', offset: 0, type: 'pcap (BE)', ext: '.pcap', cat: 'forensic', fileCmd: 'pcap capture file' },
  { hex: '0A 0D 0D 0A', offset: 0, type: 'pcapng', ext: '.pcapng', cat: 'forensic', fileCmd: 'pcapng capture file' },
  { hex: '25 21 50 53', offset: 0, type: 'PostScript', ext: '.ps, .eps', cat: 'forensic', fileCmd: 'PostScript document' },
]

const CATEGORY_LABELS = {
  pt: {
    all: 'Todos',
    image: 'Imagens',
    audio: 'Áudio',
    video: 'Vídeo',
    archive: 'Arquivos / Compressão',
    document: 'Documentos',
    executable: 'Executáveis / Código',
    database: 'Bancos de Dados',
    font: 'Fontes',
    forensic: 'Rede / Forense',
  },
  en: {
    all: 'All',
    image: 'Images',
    audio: 'Audio',
    video: 'Video',
    archive: 'Archives',
    document: 'Documents',
    executable: 'Executables / Code',
    database: 'Databases',
    font: 'Fonts',
    forensic: 'Network / Forensics',
  },
}

const CAT_CATEGORIES = ['image', 'audio', 'video', 'archive', 'document', 'executable', 'database', 'font', 'forensic']

const translations = {
  pt: {
    title: 'Assinaturas de Arquivo (Magic Bytes)',
    intro: 'Referência rápida e pesquisável dos primeiros bytes que identificam tipos de arquivo. Cole bytes hex e veja o que o arquivo provavelmente é, ou busque na tabela por nome, extensão ou assinatura.',
    search: 'Buscar por nome, extensão, tipo ou hex...',
    empty: 'Nenhuma assinatura encontrada.',
    hex: 'Hex (bytes)',
    offset: 'Offset',
    type: 'Tipo',
    ext: 'Extensão',
    cmd: 'Comando file',
    note: 'Nota',
    found: 'assinaturas',
    identifyTitle: 'Identificar arquivo por bytes',
    identifyDesc: 'Cole os primeiros bytes de um arquivo em hexadecimal para identificar o tipo. Aceita separado por espaços (FF D8 FF), com prefixo 0x (0xFF 0xD8) ou sem separador (FFD8FF).',
    identifyPlaceholder: 'Ex: 89 50 4E 47 0D 0A 1A 0A  ou  FFD8FFE000104A464946',
    identifyBtn: 'Identificar',
    identifyClear: 'Limpar',
    identifyEmpty: 'Cole bytes hex para identificar.',
    identifyMatches: 'resultado(s)',
    identifyNone: 'Nenhuma correspondência encontrada. Tente mais bytes.',
    tipTitle: 'Como funciona',
    tipBody: 'O comando file do Linux lê os primeiros bytes (magic bytes) de um arquivo e compara com um banco de dados de assinaturas (/usr/share/misc/magic). Cada formato tem uma sequência única no início do arquivo. Para ver na prática, rode: file -b meu-arquivo.bin | xxd | head -5',
    copySource: 'Copiar tabela',
    copied: 'Copiado!',
    examplesTitle: 'Exemplos práticos:',
  },
  en: {
    title: 'File Signatures (Magic Bytes)',
    intro: 'Quick, searchable reference of the first bytes that identify file types. Paste hex bytes to see what the file probably is, or search the table by name, extension, or signature.',
    search: 'Search by name, extension, type, or hex...',
    empty: 'No signatures found.',
    hex: 'Hex (bytes)',
    offset: 'Offset',
    type: 'Type',
    ext: 'Extension',
    cmd: 'file command',
    note: 'Note',
    found: 'signatures',
    identifyTitle: 'Identify a file by its bytes',
    identifyDesc: 'Paste the first bytes of a file in hex to identify its type. Accepts space-separated (FF D8 FF), 0x-prefixed (0xFF 0xD8), or concatenated (FFD8FF) format.',
    identifyPlaceholder: 'Ex: 89 50 4E 47 0D 0A 1A 0A  or  FFD8FFE000104A464946',
    identifyBtn: 'Identify',
    identifyClear: 'Clear',
    identifyEmpty: 'Paste hex bytes to identify.',
    identifyMatches: 'result(s)',
    identifyNone: 'No matches found. Try more bytes.',
    tipTitle: 'How it works',
    tipBody: 'The Linux file command reads the first bytes (magic bytes) of a file and compares them against a database of signatures (/usr/share/misc/magic). Each format has a unique sequence at the start of the file. Try it: file -b my-file.bin | xxd | head -5',
    copySource: 'Copy table',
    copied: 'Copied!',
  },
}

function parseHexInput(raw) {
  const cleaned = raw.replace(/0x/gi, '').replace(/[^0-9a-fA-F\s]/g, '')
  if (!cleaned) return []
  const pairs = cleaned.match(/[0-9a-fA-F]{2}/g) || []
  return pairs.map((h) => parseInt(h, 16))
}

function matchSignatures(inputHex) {
  const bytes = parseHexInput(inputHex)
  if (bytes.length === 0) return []
  const matches = []
  for (const sig of SIGNATURES) {
    const sigBytes = parseHexInput(sig.hex)
    const offset = sig.offset || 0
    let ok = true
    for (let i = 0; i < sigBytes.length; i++) {
      if (offset + i >= bytes.length || bytes[offset + i] !== sigBytes[i]) {
        ok = false
        break
      }
    }
    if (ok) matches.push(sig)
  }
  return matches
}

export default function FileSignaturesPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [hexInput, setHexInput] = useState('')
  const [identifyResults, setIdentifyResults] = useState(null)

  const catLabels = CATEGORY_LABELS[lang]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SIGNATURES.filter((s) => {
      if (cat !== 'all' && s.cat !== cat) return false
      if (!q) return true
      return (
        s.type.toLowerCase().includes(q) ||
        s.ext.toLowerCase().includes(q) ||
        s.hex.toLowerCase().replace(/\s/g, '').includes(q.replace(/\s/g, '').replace(/0x/gi, '')) ||
        (s.fileCmd && s.fileCmd.toLowerCase().includes(q)) ||
        (s.note && s.note.toLowerCase().includes(q)) ||
        catLabels[s.cat].toLowerCase().includes(q)
      )
    })
  }, [query, cat, lang, catLabels])

  const handleIdentify = useCallback(() => {
    const results = matchSignatures(hexInput)
    setIdentifyResults(results.length > 0 ? results : '__none__')
  }, [hexInput])

  const handleClearIdentify = useCallback(() => {
    setHexInput('')
    setIdentifyResults(null)
  }, [])

  function copyTable() {
    const lines = filtered.map((s) => [s.hex, `+${s.offset}`, s.type, s.ext, s.fileCmd, s.note || ''].join('\t'))
    navigator.clipboard.writeText(lines.join('\n'))
    message.success(t.copied)
  }

  const columns = useMemo(() => [
    {
      title: t.hex,
      dataIndex: 'hex',
      key: 'hex',
      width: 200,
      render: (v) => <Text code style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{v}</Text>,
    },
    {
      title: t.offset,
      dataIndex: 'offset',
      key: 'offset',
      width: 60,
      align: 'center',
      render: (v) => <Text type={v === 0 ? undefined : 'secondary'} style={{ fontFamily: 'monospace' }}>{v === 0 ? '0' : `+${v}`}</Text>,
    },
    {
      title: t.type,
      dataIndex: 'type',
      key: 'type',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: t.ext,
      dataIndex: 'ext',
      key: 'ext',
      width: 160,
      render: (v) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: t.cmd,
      dataIndex: 'fileCmd',
      key: 'fileCmd',
      width: 200,
      render: (v) => v ? <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text> : null,
    },
  ], [t])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<FileTextOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Card title={t.identifyTitle} size="small">
        <Paragraph type="secondary" style={{ marginBottom: 12 }}>{t.identifyDesc}</Paragraph>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value={hexInput}
            onChange={(e) => { setHexInput(e.target.value); setIdentifyResults(null) }}
            placeholder={t.identifyPlaceholder}
            onPressEnter={handleIdentify}
            style={{ fontFamily: 'monospace' }}
          />
          <Button type="primary" onClick={handleIdentify}>{t.identifyBtn}</Button>
          <Button onClick={handleClearIdentify}>{t.identifyClear}</Button>
        </Space.Compact>
        {identifyResults !== null && (
          <div style={{ marginTop: 12 }}>
            {identifyResults === '__none__' ? (
              <Text type="warning">{t.identifyNone}</Text>
            ) : (
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text type="secondary">{identifyResults.length} {t.identifyMatches}</Text>
                {identifyResults.map((r, i) => (
                  <Card key={i} size="small" style={{ background: '#fafafa' }}>
                    <Space direction="vertical" size={2}>
                      <Space>
                        <Tag color="blue">{r.type}</Tag>
                        <Text code style={{ fontSize: 12 }}>{r.ext}</Text>
                      </Space>
                      <Text code style={{ fontSize: 11 }}>{r.hex}</Text>
                      {r.fileCmd && <Text type="secondary" style={{ fontSize: 12 }}>file: {r.fileCmd}</Text>}
                      {r.note && <Text type="secondary" style={{ fontSize: 12 }}>{r.note}</Text>}
                    </Space>
                  </Card>
                ))}
              </Space>
            )}
          </div>
        )}
      </Card>

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Segmented
          value={cat}
          onChange={(v) => setCat(v)}
          options={[
            { value: 'all', label: catLabels.all },
            ...CAT_CATEGORIES.map((c) => ({ value: c, label: catLabels[c] })),
          ]}
        />
      </Space>

      <Space wrap size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">{filtered.length} {t.found}</Text>
        <Button size="small" icon={<CopyOutlined />} onClick={copyTable} disabled={filtered.length === 0}>
          {t.copySource}
        </Button>
      </Space>

      <Card>
        <Table
          rowKey={(r) => `${r.hex}-${r.offset}-${r.type}`}
          columns={columns}
          dataSource={filtered}
          size="small"
          pagination={{ defaultPageSize: 25, showSizeChanger: true, pageSizeOptions: [15, 25, 50, 100] }}
          locale={{ emptyText: t.empty }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Collapse
        items={[
          {
            key: 'howto',
            label: t.tipTitle,
            children: (
              <Space direction="vertical" size="small">
                <Paragraph>{t.tipBody}</Paragraph>
                <Paragraph>
                  <Text strong>{lang === 'pt' ? 'Exemplos praticos:' : 'Practical examples:'}</Text>
                </Paragraph>
                <pre style={{ margin: 0, fontSize: 12, overflowX: 'auto' }}>
{`$ file -b mystery.bin | xxd | head -1
00000000: 8950 4e47 0d0a 1a0a ...    -> PNG

$ xxd -l 16 mystery.bin
00000000: ff d8 ff e0 00 10 4a 46 49 46 00 01 ... -> JPEG

$ head -c 4 mystery.pdf
%PDF                            -> PDF`}
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
