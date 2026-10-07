import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Upload,
  message,
  Alert,
  Empty,
  Table,
  Descriptions,
  Input,
  Spin,
} from 'antd'
import {
  FileZipOutlined,
  InboxOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileOutlined,
  FolderOutlined,
  SearchOutlined,
  EyeOutlined,
  CodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  parseZip,
  extractEntry,
  buildSampleZip,
  crc32,
  methodLabel,
  EXTRACTABLE_METHODS,
} from '../utils/zipInspector'
import engineSource from '../utils/zipInspector.js?raw'

const { Title, Paragraph, Text } = Typography
const { Dragger } = Upload

const MAX_FILE_BYTES = 64 * 1024 * 1024
const TEXT_PREVIEW_BYTES = 256 * 1024
const HEX_PREVIEW_BYTES = 4096
const IMAGE_BYTES_LIMIT = 8 * 1024 * 1024
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'])

const HOST_SYSTEMS = {
  0: 'MS-DOS/FAT',
  1: 'Amiga',
  2: 'OpenVMS',
  3: 'Unix',
  5: 'Macintosh',
  7: 'Macintosh',
  13: 'NTFS',
  19: 'NTFS',
}

const BLOCK_STYLE = {
  background: '#fafafa',
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  padding: 16,
  fontSize: 12,
  fontFamily: 'monospace',
  lineHeight: 1.5,
  margin: 0,
  overflowX: 'auto',
}

function fmtBytes(n) {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`
  if (n < 1024 * 1024 * 1024) return `${(n / 1048576).toFixed(1)} MiB`
  return `${(n / 1073741824).toFixed(2)} GiB`
}

function fmtDate(ms) {
  if (ms == null) return '—'
  const d = new Date(ms)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

function fmtRatio(r) {
  if (r == null) return '—'
  if (r >= 10) return `${Math.round(r)}×`
  return `${r.toFixed(1)}×`
}

function fmtCrc(n) {
  return (n >>> 0).toString(16).padStart(8, '0')
}

function extOf(name) {
  const base = name.split('/').pop() || ''
  const dot = base.lastIndexOf('.')
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : ''
}

function looksText(bytes) {
  if (bytes.length === 0) return true
  const cut = bytes.length > 16384 ? 16380 : bytes.length
  const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, cut))
  if (decoded.includes('�')) return false
  let control = 0
  for (let i = 0; i < decoded.length; i++) {
    const c = decoded.charCodeAt(i)
    if (c < 32 && c !== 9 && c !== 10 && c !== 13 && c !== 12 && c !== 8 && c !== 27) control++
  }
  return control / Math.max(1, decoded.length) < 0.01
}

function hexDump(bytes, limit) {
  const end = Math.min(bytes.length, limit)
  const lines = []
  for (let o = 0; o < end; o += 16) {
    const chunk = bytes.subarray(o, Math.min(o + 16, end))
    let hex = ''
    let ascii = ''
    for (let i = 0; i < 16; i++) {
      if (i < chunk.length) {
        hex += chunk[i].toString(16).padStart(2, '0')
        ascii += chunk[i] >= 32 && chunk[i] < 127 ? String.fromCharCode(chunk[i]) : '.'
      } else {
        hex += '  '
        ascii += ' '
      }
      hex += i === 7 ? '  ' : ' '
    }
    lines.push(`${o.toString(16).padStart(8, '0')}  ${hex} |${ascii}|`)
  }
  return lines.join('\n')
}

const translations = {
  pt: {
    title: 'Inspetor de ZIP',
    intro: (
      <>
        Abra um arquivo <Text code>.zip</Text> e veja o que tem dentro sem mandar nada pra lugar
        nenhum: o formato guarda o sumário no <b>fim</b> do arquivo, então o motor procura o{' '}
        <Text code>EOCD</Text>, lê o <Text code>diretório central</Text> e lista cada entrada com
        método de compressão, tamanhos, <Text code>CRC32</Text>, data e flags. Os avisos pegam
        zip-slip (<Text code>../</Text>), caminho absoluto, arquivo criptografado, nome duplicado e
        razão de compressão extrema (zip bomb). Clicando numa entrada o conteúdo é extraído no
        próprio navegador (<Text code>DecompressionStream</Text>) com conferência do CRC32 — preview
        de texto, imagem ou hex. Tudo local: o arquivo nunca sai da memória do navegador.
      </>
    ),
    uploadTitle: 'Arquivo ZIP',
    dropTitle: 'Arraste e solte um .zip aqui',
    dropHint: 'ou clique pra escolher — aceita qualquer ZIP válido',
    onlyBrowser: 'Arquivo lido na memória do navegador: nada é enviado pra servidor nenhum.',
    sampleNormal: 'Amostra saudável',
    sampleProblems: 'Amostra com problemas',
    tooBig: (mb) => `Arquivo maior que ${mb} MB — escolha um ZIP menor.`,
    summary: 'Resumo',
    changeFile: 'Trocar arquivo',
    fileLoaded: (n) => `Arquivo: ${n}`,
    statEntries: 'Entradas',
    statFiles: 'Arquivos',
    statDirs: 'Pastas',
    statCompressed: 'Comprimido',
    statUncompressed: 'Original',
    statRatio: 'Razão geral',
    statMethods: 'Métodos',
    statDates: 'Modificação (UTC)',
    statComment: 'Comentário',
    statZip64: 'ZIP64',
    yes: 'Sim',
    no: 'Não',
    parseErrorTitle: 'Não deu pra ler o ZIP',
    err: {
      'too-small': 'Arquivo pequeno demais pra ser um ZIP (mínimo de 22 bytes).',
      'no-eocd': 'Nenhuma assinatura de fim de arquivo ZIP (EOCD) encontrada — provavelmente não é um ZIP, ou ele está cortado.',
      'bad-central': 'O diretório central aponta pra fora do arquivo — ZIP corrompido ou truncado.',
      load: 'Não foi possível ler o arquivo.',
    },
    warningsTitle: 'Avisos',
    sevErrors: 'erros',
    sevWarnings: 'avisos',
    sevInfos: 'info',
    noWarnings: 'Nenhum aviso — o arquivo parece limpo.',
    codes: {
      'path-traversal': 'Path traversal (zip-slip)',
      'absolute-path': 'Caminho absoluto',
      'backslash-path': 'Caminho com contrabarra',
      encrypted: 'Entrada criptografada',
      'data-descriptor': 'Data descriptor (tamanhos no fim do dado)',
      'unsupported-method': 'Método de compressão não suportado aqui',
      'high-ratio': 'Razão de compressão suspeita',
      'bomb-ratio': 'Razão de compressão extrema (zip bomb)',
      'duplicate-name': 'Nome duplicado',
      'non-utf8-name': 'Nome possivelmente não-UTF-8',
      zip64: 'Arquivo ZIP64',
      'zip64-unparsed': 'Marcadores ZIP64 presentes mas ilegíveis',
      'empty-archive': 'Arquivo vazio (nenhuma entrada)',
      'truncated-central': 'Diretório central truncado',
      'bad-central-signature': 'Assinatura inválida no diretório central',
    },
    dupFirst: (n) => `primeira ocorrência na entrada ${n}`,
    entriesTitle: 'Entradas do diretório central',
    filterPlaceholder: 'Filtrar por nome…',
    colName: 'Nome',
    colMethod: 'Método',
    colCompressed: 'Comprimido',
    colUncompressed: 'Original',
    colRatio: 'Razão',
    colModified: 'Modificado',
    colCrc: 'CRC32',
    colFlags: 'Flags',
    colAction: 'Ação',
    view: 'Ver',
    emptyFilter: 'Nenhuma entrada corresponde ao filtro.',
    flagEnc: 'cripto',
    flagAnsi: 'ansi?',
    detailTitle: 'Detalhe da entrada',
    close: 'Fechar',
    dName: 'Caminho',
    dMethod: 'Método',
    dUncompressed: 'Tamanho original',
    dCompressed: 'Tamanho comprimido',
    dRatio: 'Razão',
    dCrc: 'CRC32',
    dModified: 'Modificado (UTC)',
    dOffset: 'Offset do header local',
    dVersion: 'Versão mínima',
    dHost: 'Criado por',
    dFlags: 'Flags (hex)',
    dComment: 'Comentário da entrada',
    dPerms: 'Permissões',
    permissions: (oct) => `permissões ${oct} (unix)`,
    previewTitle: 'Conteúdo',
    crcOk: 'CRC32 confere',
    crcBad: 'CRC32 divergente',
    kind: { text: 'Texto', image: 'Imagem', hex: 'Hex', empty: 'Arquivo vazio' },
    downloadEntry: 'Baixar entrada',
    emptyFile: 'Entrada sem conteúdo (0 bytes).',
    textLimit: (n) => `Mostrando os primeiros ${n} — o resto não cabe no preview.`,
    hexLimit: (n) => `Mostrando os primeiros ${n} do conteúdo.`,
    notExtractable: {
      'is-dir': 'Este caminho é um diretório — não tem conteúdo pra extrair.',
      encrypted: 'Entrada criptografada: o conteúdo só é legível com a senha.',
    },
    unsupportedMethod: (m) =>
      `Método "${m}" não é suportável pelo navegador — só store (0) e deflate (8).`,
    extractError: {
      'bad-local-header': 'O header local desta entrada é inválido ou aponta pra fora do arquivo.',
      'truncated-data': 'Os dados desta entrada estão truncados no arquivo.',
      'no-decompression-stream': 'Este navegador não oferece DecompressionStream pra inflate.',
      unknown: 'Falha ao extrair a entrada.',
    },
    howTitle: 'Como funciona',
    howBody: (
      <>
        O motor (<Text code>zipInspector.js</Text>) faz 5 passos, tudo no navegador:
        <br />
        <br />
        1. <b>Acha o EOCD</b> (<Text code>{'PK\\x05\\x06'}</Text>) caminhando de trás pra frente em
        duas
        passadas: a primeira exige que o tamanho do comentário feche exatamente com o fim do
        arquivo, a segunda aceita lixo depois do comentário.
        <br />
        2. <b>Lê o diretório central</b> — uma entrada por arquivo com nome, método, tamanhos,
        CRC32, data/hora DOS, flags, sistema hospedeiro e extra fields (<Text code>ZIP64</Text>,{' '}
        <Text code>0x5455</Text>/unix time). Se os contadores estiverem em <Text code>0xffff</Text>,
        desce pro EOCD64.
        <br />
        3. <b>Acende avisos</b> por entrada: <Text code>../</Text> e caminho absoluto (zip-slip,
        erro), criptografado, nome duplicado, razão <Text code>≥ 500×</Text> (zip bomb, erro) e{' '}
        <Text code>≥ 100×</Text> (aviso), método desconhecido, nome não-UTF-8 e backslash.
        <br />
        4. <b>Extrai sob demanda</b>: relê o header local apontado pelo diretório central, corta os{' '}
        <Text code>compressedSize</Text> bytes certos e infla com{' '}
        <Text code>DecompressionStream('deflate-raw')</Text> — depois confere o CRC32 calculado do
        conteúdo contra o CRC32 gravado no ZIP.
        <br />
        5. <b>Gerador de amostras</b>: <Text code>buildSampleZip()</Text> monta um ZIP válido em
        memória (com <Text code>CompressionStream</Text>), incluindo uma versão propositalmente
        ruim pra mostrar os avisos — sem binário versionado e sem upload.
      </>
    ),
    sourceTitle: 'Código-fonte do motor',
    sourceHint:
      'O mesmo arquivo que roda a página, importado como texto (import … ?raw) — parser do EOCD/diretório central, extra fields, avisos de segurança, extração via DecompressionStream e gerador das amostras.',
  },
  en: {
    title: 'ZIP Inspector',
    intro: (
      <>
        Open a <Text code>.zip</Text> file and see what is inside without sending it anywhere: the
        format stores its index at the <b>end</b> of the file, so the engine finds the{' '}
        <Text code>EOCD</Text>, reads the <Text code>central directory</Text> and lists every entry
        with compression method, sizes, <Text code>CRC32</Text>, date and flags. Warnings catch
        zip-slip (<Text code>../</Text>), absolute paths, encrypted entries, duplicate names and
        extreme compression ratios (zip bombs). Clicking an entry extracts the content in the
        browser itself (<Text code>DecompressionStream</Text>) with CRC32 verification — text, image
        or hex preview. Fully local: the file never leaves browser memory.
      </>
    ),
    uploadTitle: 'ZIP file',
    dropTitle: 'Drag & drop a .zip here',
    dropHint: 'or click to choose — any valid ZIP is accepted',
    onlyBrowser: 'File read in browser memory: nothing is sent to any server.',
    sampleNormal: 'Healthy sample',
    sampleProblems: 'Problem sample',
    tooBig: (mb) => `File larger than ${mb} MB — pick a smaller ZIP.`,
    summary: 'Summary',
    changeFile: 'Change file',
    fileLoaded: (n) => `File: ${n}`,
    statEntries: 'Entries',
    statFiles: 'Files',
    statDirs: 'Folders',
    statCompressed: 'Compressed',
    statUncompressed: 'Uncompressed',
    statRatio: 'Overall ratio',
    statMethods: 'Methods',
    statDates: 'Modified (UTC)',
    statComment: 'Comment',
    statZip64: 'ZIP64',
    yes: 'Yes',
    no: 'No',
    parseErrorTitle: 'Could not read the ZIP',
    err: {
      'too-small': 'File is too small to be a ZIP (minimum 22 bytes).',
      'no-eocd': 'No ZIP end-of-file signature (EOCD) found — probably not a ZIP, or it is truncated.',
      'bad-central': 'The central directory points outside the file — corrupted or truncated ZIP.',
      load: 'Could not read the file.',
    },
    warningsTitle: 'Warnings',
    sevErrors: 'errors',
    sevWarnings: 'warnings',
    sevInfos: 'info',
    noWarnings: 'No warnings — this archive looks clean.',
    codes: {
      'path-traversal': 'Path traversal (zip-slip)',
      'absolute-path': 'Absolute path',
      'backslash-path': 'Backslash path',
      encrypted: 'Encrypted entry',
      'data-descriptor': 'Data descriptor (sizes stored after the data)',
      'unsupported-method': 'Unsupported compression method',
      'high-ratio': 'Suspicious compression ratio',
      'bomb-ratio': 'Extreme compression ratio (zip bomb)',
      'duplicate-name': 'Duplicate name',
      'non-utf8-name': 'Possibly non-UTF-8 name',
      zip64: 'ZIP64 archive',
      'zip64-unparsed': 'ZIP64 markers present but unreadable',
      'empty-archive': 'Empty archive (no entries)',
      'truncated-central': 'Truncated central directory',
      'bad-central-signature': 'Invalid signature in the central directory',
    },
    dupFirst: (n) => `first seen at entry ${n}`,
    entriesTitle: 'Central directory entries',
    filterPlaceholder: 'Filter by name…',
    colName: 'Name',
    colMethod: 'Method',
    colCompressed: 'Compressed',
    colUncompressed: 'Uncompressed',
    colRatio: 'Ratio',
    colModified: 'Modified',
    colCrc: 'CRC32',
    colFlags: 'Flags',
    colAction: 'Action',
    view: 'View',
    emptyFilter: 'No entry matches the filter.',
    flagEnc: 'enc',
    flagAnsi: 'ansi?',
    detailTitle: 'Entry detail',
    close: 'Close',
    dName: 'Path',
    dMethod: 'Method',
    dUncompressed: 'Uncompressed size',
    dCompressed: 'Compressed size',
    dRatio: 'Ratio',
    dCrc: 'CRC32',
    dModified: 'Modified (UTC)',
    dOffset: 'Local header offset',
    dVersion: 'Minimum version',
    dHost: 'Made by',
    dFlags: 'Flags (hex)',
    dComment: 'Entry comment',
    dPerms: 'Permissions',
    permissions: (oct) => `${oct} permissions (unix)`,
    previewTitle: 'Content',
    crcOk: 'CRC32 matches',
    crcBad: 'CRC32 mismatch',
    kind: { text: 'Text', image: 'Image', hex: 'Hex', empty: 'Empty file' },
    downloadEntry: 'Download entry',
    emptyFile: 'Entry with no content (0 bytes).',
    textLimit: (n) => `Showing the first ${n} — the rest does not fit in the preview.`,
    hexLimit: (n) => `Showing the first ${n} of the content.`,
    notExtractable: {
      'is-dir': 'This path is a directory — there is nothing to extract.',
      encrypted: 'Encrypted entry: the content is only readable with the password.',
    },
    unsupportedMethod: (m) =>
      `Method "${m}" cannot be inflated in the browser — only store (0) and deflate (8) are supported.`,
    extractError: {
      'bad-local-header': 'This entry has an invalid local header or one pointing outside the file.',
      'truncated-data': 'This entry data is truncated in the file.',
      'no-decompression-stream': 'This browser does not provide DecompressionStream for inflation.',
      unknown: 'Failed to extract the entry.',
    },
    howTitle: 'How it works',
    howBody: (
      <>
        The engine (<Text code>zipInspector.js</Text>) does 5 steps, all in the browser:
        <br />
        <br />
        1. <b>Finds the EOCD</b> (<Text code>{'PK\\x05\\x06'}</Text>) walking backwards in two
        passes:
        the first requires the comment length to close exactly at the end of the file, the second
        tolerates trailing garbage.
        <br />
        2. <b>Reads the central directory</b> — one entry per file with name, method, sizes,
        CRC32, DOS date/time, flags, host system and extra fields (<Text code>ZIP64</Text>,{' '}
        <Text code>0x5455</Text>/unix time). When counters are <Text code>0xffff</Text>, it falls
        back to the ZIP64 EOCD.
        <br />
        3. <b>Raises warnings</b> per entry: <Text code>../</Text> and absolute paths (zip-slip,
        error), encrypted, duplicate name, ratio <Text code>≥ 500×</Text> (zip bomb, error) and{' '}
        <Text code>≥ 100×</Text> (warning), unknown method, non-UTF-8 name and backslashes.
        <br />
        4. <b>Extracts on demand</b>: re-reads the local header pointed by the central directory,
        slices exactly <Text code>compressedSize</Text> bytes and inflates with{' '}
        <Text code>DecompressionStream('deflate-raw')</Text> — then verifies the CRC32 computed
        from the content against the one stored in the ZIP.
        <br />
        5. <b>Sample builder</b>: <Text code>buildSampleZip()</Text> assembles a valid ZIP in
        memory (using <Text code>CompressionStream</Text>), including a deliberately broken one to
        show the warnings — no binary checked in, no upload.
      </>
    ),
    sourceTitle: 'Engine source code',
    sourceHint:
      'The very file that runs this page, imported as text (import … ?raw) — EOCD/central-directory parser, extra fields, security warnings, DecompressionStream extraction and the sample builder.',
  },
}

export default function ZipInspectorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [zipBytes, setZipBytes] = useState(null)
  const [fileMeta, setFileMeta] = useState(null)
  const [result, setResult] = useState(null)
  const [parseErrorCode, setParseErrorCode] = useState(null)
  const [selected, setSelected] = useState(null)
  const [preview, setPreview] = useState(null)
  const [filter, setFilter] = useState('')
  const [loadingSample, setLoadingSample] = useState(false)
  const imgUrlRef = useRef(null)

  useEffect(
    () => () => {
      if (imgUrlRef.current) URL.revokeObjectURL(imgUrlRef.current)
    },
    []
  )

  const revokeImage = useCallback(() => {
    if (imgUrlRef.current) {
      URL.revokeObjectURL(imgUrlRef.current)
      imgUrlRef.current = null
    }
  }, [])

  const loadBytes = useCallback((bytes, name) => {
    revokeImage()
    const res = parseZip(bytes)
    setZipBytes(bytes)
    setFileMeta({ name, size: bytes.length })
    setResult(res)
    setParseErrorCode(res.ok ? null : res.error)
    setSelected(null)
    setPreview(null)
    setFilter('')
  }, [revokeImage])

  const beforeUpload = useCallback(
    (file) => {
      if (file.size > MAX_FILE_BYTES) {
        message.warning(t.tooBig(64))
        return Upload.LIST_IGNORE
      }
      const reader = new FileReader()
      reader.onload = () => loadBytes(new Uint8Array(reader.result), file.name)
      reader.onerror = () => {
        setResult({ ok: false, error: 'load' })
        setParseErrorCode('load')
        setZipBytes(null)
        setFileMeta({ name: file.name, size: file.size })
      }
      reader.readAsArrayBuffer(file)
      return Upload.LIST_IGNORE
    },
    [loadBytes, t]
  )

  const loadSample = useCallback(
    async (kind) => {
      setLoadingSample(true)
      try {
        const bytes = await buildSampleZip(kind)
        loadBytes(bytes, kind === 'normal' ? 'amostra-saudavel.zip' : 'amostra-problemas.zip')
      } catch (e) {
        message.error(String(e && e.message ? e.message : e))
      } finally {
        setLoadingSample(false)
      }
    },
    [loadBytes]
  )

  const reset = useCallback(() => {
    revokeImage()
    setZipBytes(null)
    setFileMeta(null)
    setResult(null)
    setParseErrorCode(null)
    setSelected(null)
    setPreview(null)
    setFilter('')
  }, [revokeImage])

  const selectEntry = useCallback(
    async (index) => {
      if (!result || !result.ok || !zipBytes) return
      const entry = result.entries[index]
      revokeImage()
      setSelected(index)
      if (entry.isDir) {
        setPreview({ status: 'none', reason: 'is-dir' })
        return
      }
      if (entry.encrypted) {
        setPreview({ status: 'none', reason: 'encrypted' })
        return
      }
      if (!EXTRACTABLE_METHODS.has(entry.method)) {
        setPreview({ status: 'unsupported', method: methodLabel(entry.method) })
        return
      }
      setPreview({ status: 'loading' })
      try {
        const bytes = await extractEntry(zipBytes, entry)
        const crcOk = crc32(bytes) === entry.crc32
        const ext = extOf(entry.name)
        if (bytes.length === 0) {
          setPreview({ status: 'ok', bytes, crcOk, kind: 'empty', text: null, truncated: false })
          return
        }
        if (IMAGE_EXTS.has(ext) && bytes.length <= IMAGE_BYTES_LIMIT) {
          const mime =
            ext === 'svg'
              ? 'image/svg+xml'
              : ext === 'jpg'
                ? 'image/jpeg'
                : ext === 'ico'
                  ? 'image/x-icon'
                  : `image/${ext}`
          const imageUrl = URL.createObjectURL(new Blob([bytes], { type: mime }))
          imgUrlRef.current = imageUrl
          setPreview({ status: 'ok', bytes, crcOk, kind: 'image', imageUrl, text: null, truncated: false })
          return
        }
        if (looksText(bytes)) {
          const cut = bytes.length > TEXT_PREVIEW_BYTES ? TEXT_PREVIEW_BYTES : bytes.length
          const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, cut))
          setPreview({ status: 'ok', bytes, crcOk, kind: 'text', text, truncated: cut < bytes.length })
          return
        }
        setPreview({ status: 'ok', bytes, crcOk, kind: 'hex', text: null, truncated: false })
      } catch (e) {
        setPreview({ status: 'error', reason: e && e.message ? e.message : 'unknown' })
      }
    },
    [result, zipBytes, revokeImage]
  )

  const closeDetail = useCallback(() => {
    revokeImage()
    setSelected(null)
    setPreview(null)
  }, [revokeImage])

  const downloadEntry = useCallback(
    async (entry) => {
      if (!zipBytes) return
      try {
        const bytes = await extractEntry(zipBytes, entry)
        const url = URL.createObjectURL(new Blob([bytes]))
        const a = document.createElement('a')
        a.href = url
        a.download = (entry.name.split('/').pop() || entry.name.split('\\').pop() || 'entry').replace(
          /[\\/]/g,
          '_'
        )
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (e) {
        const code = e && e.message ? e.message : 'unknown'
        message.error(t.extractError[code] || t.extractError.unknown)
      }
    },
    [zipBytes, t]
  )

  const warningsByName = useMemo(() => {
    const m = new Map()
    if (!result || !result.ok) return m
    for (const w of result.warnings) {
      const name = w.ctx && w.ctx.name
      if (!name) continue
      if (!m.has(name)) m.set(name, [])
      m.get(name).push(w)
    }
    return m
  }, [result])

  const filteredEntries = useMemo(() => {
    if (!result || !result.ok) return []
    const q = filter.trim().toLowerCase()
    if (!q) return result.entries
    return result.entries.filter((e) => e.name.toLowerCase().includes(q))
  }, [result, filter])

  const severityCounts = useMemo(() => {
    const c = { error: 0, warning: 0, info: 0 }
    if (result && result.ok) {
      for (const w of result.warnings) c[w.severity] = (c[w.severity] || 0) + 1
    }
    return c
  }, [result])

  const isOk = Boolean(result && result.ok)
  const stats = isOk ? result.stats : null

  const renderWarningDetail = (w) => {
    const parts = []
    if (w.ctx.name) parts.push(w.ctx.name)
    if (w.ctx.ratio != null) parts.push(fmtRatio(w.ctx.ratio))
    if (w.ctx.method) parts.push(w.ctx.method)
    if (w.ctx.first != null) parts.push(t.dupFirst(w.ctx.first))
    if (w.ctx.index != null) parts.push(`#${w.ctx.index}`)
    return parts.join(' · ')
  }

  const columns = [
    {
      title: t.colName,
      key: 'name',
      minWidth: 240,
      render: (_, e) => {
        const ws = warningsByName.get(e.name) || []
        const worst = ws.some((w) => w.severity === 'error')
          ? 'red'
          : ws.some((w) => w.severity === 'warning')
            ? 'orange'
            : ws.length
              ? 'blue'
              : null
        return (
          <Space size={6} wrap>
            {e.isDir ? <FolderOutlined style={{ color: '#faad14' }} /> : <FileOutlined />}
            <Text style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
              {e.name}
            </Text>
            {worst && (
              <Tag color={worst} style={{ marginRight: 0 }}>
                {ws.length}
              </Tag>
            )}
          </Space>
        )
      },
    },
    {
      title: t.colMethod,
      key: 'method',
      width: 110,
      render: (_, e) => (
        <Tag color={e.method === 8 ? 'blue' : e.method === 0 ? 'default' : 'orange'}>
          {methodLabel(e.method)}
        </Tag>
      ),
    },
    {
      title: t.colCompressed,
      key: 'comp',
      width: 110,
      align: 'right',
      render: (_, e) => <Text style={{ fontSize: 12 }}>{fmtBytes(e.compressedSize)}</Text>,
    },
    {
      title: t.colUncompressed,
      key: 'uncomp',
      width: 110,
      align: 'right',
      render: (_, e) => <Text style={{ fontSize: 12 }}>{fmtBytes(e.uncompressedSize)}</Text>,
    },
    {
      title: t.colRatio,
      key: 'ratio',
      width: 80,
      align: 'right',
      render: (_, e) => {
        const color = e.ratio == null ? undefined : e.ratio >= 100 ? '#cf1322' : e.ratio >= 10 ? '#d46b08' : undefined
        return (
          <Text style={{ fontSize: 12, color }} strong={color === '#cf1322'}>
            {fmtRatio(e.ratio)}
          </Text>
        )
      },
    },
    {
      title: t.colModified,
      key: 'modified',
      width: 130,
      render: (_, e) => <Text style={{ fontSize: 12, color: '#8c8c8c' }}>{fmtDate(e.modified)}</Text>,
    },
    {
      title: t.colCrc,
      key: 'crc',
      width: 100,
      render: (_, e) =>
        e.isDir ? (
          '—'
        ) : (
          <Text code style={{ fontSize: 11 }}>
            {fmtCrc(e.crc32)}
          </Text>
        ),
    },
    {
      title: t.colFlags,
      key: 'flags',
      width: 150,
      render: (_, e) => {
        const tags = []
        if (e.encrypted) tags.push(<Tag color="red" key="enc">{t.flagEnc}</Tag>)
        if (e.dataDescriptor) tags.push(<Tag key="dd">dd</Tag>)
        if (e.utf8) tags.push(<Tag color="blue" key="u">utf8</Tag>)
        if (e.suspectEncoding) tags.push(<Tag color="orange" key="s">{t.flagAnsi}</Tag>)
        if (e.zip64) tags.push(<Tag key="z">zip64</Tag>)
        if (!tags.length) return '—'
        return <Space size={4} wrap>{tags}</Space>
      },
    },
    {
      title: t.colAction,
      key: 'action',
      width: 170,
      align: 'right',
      render: (_, e) => (
        <Space size={4}>
          <Button
            size="small"
            type={selected === e.index ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            disabled={e.isDir}
            onClick={() => selectEntry(e.index)}
          >
            {t.view}
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            disabled={e.isDir}
            onClick={() => downloadEntry(e)}
          />
        </Space>
      ),
    },
  ]

  const selectedEntry = isOk && selected != null ? result.entries[selected] : null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FileZipOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      {!zipBytes && (
        <Card
          title={t.uploadTitle}
          extra={
            <Space>
              <Button
                icon={<FileOutlined />}
                loading={loadingSample}
                onClick={() => loadSample('normal')}
              >
                {t.sampleNormal}
              </Button>
              <Button
                icon={<WarningOutlined />}
                loading={loadingSample}
                onClick={() => loadSample('problems')}
              >
                {t.sampleProblems}
              </Button>
            </Space>
          }
        >
          <Dragger
            accept=".zip,application/zip,application/x-zip-compressed"
            beforeUpload={beforeUpload}
            showUploadList={false}
            multiple={false}
            maxCount={1}
          >
            <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
              <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 16, fontWeight: 600 }}>
              {t.dropTitle}
            </p>
            <p className="ant-upload-hint" style={{ color: '#8c8c8c' }}>
              {t.dropHint}
            </p>
          </Dragger>
          <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0, fontSize: 12 }}>
            <Tag color="green" style={{ marginRight: 6 }}>
              100% local
            </Tag>{' '}
            {t.onlyBrowser}
          </Paragraph>
        </Card>
      )}

      {result && !result.ok && (
        <Card title={t.parseErrorTitle}>
          <Paragraph type="secondary" style={{ marginTop: -4, marginBottom: 12 }}>
            {fileMeta ? `${t.fileLoaded(fileMeta.name)} · ${fmtBytes(fileMeta.size)}` : ''}
          </Paragraph>
          <Alert
            type="error"
            showIcon
            message={t.err[parseErrorCode] || t.err.load}
            style={{ marginBottom: 16 }}
          />
          <Button icon={<ReloadOutlined />} onClick={reset}>
            {t.changeFile}
          </Button>
        </Card>
      )}

      {isOk && (
        <>
          <Card
            title={t.summary}
            extra={
              <Button icon={<ReloadOutlined />} onClick={reset}>
                {t.changeFile}
              </Button>
            }
          >
            <Paragraph type="secondary" style={{ marginTop: -4, marginBottom: 16 }}>
              {t.fileLoaded(fileMeta.name)} · {fmtBytes(fileMeta.size)}
            </Paragraph>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6} md={4}>
                <Statistic title={t.statEntries} value={stats.entryCount} />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Statistic title={t.statFiles} value={stats.fileCount} />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Statistic title={t.statDirs} value={stats.dirCount} />
              </Col>
              <Col xs={12} sm={6} md={5}>
                <Statistic title={t.statCompressed} value={fmtBytes(stats.totalCompressed)} />
              </Col>
              <Col xs={12} sm={8} md={5}>
                <Statistic title={t.statUncompressed} value={fmtBytes(stats.totalUncompressed)} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic
                  title={t.statRatio}
                  value={fmtRatio(stats.ratio)}
                  valueStyle={
                    stats.ratio != null && stats.ratio >= 100 ? { color: '#cf1322' } : undefined
                  }
                />
              </Col>
            </Row>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, md: 3 }}
              bordered
              style={{ marginTop: 16 }}
            >
              <Descriptions.Item label={t.statMethods}>
                <Space size={4} wrap>
                  {stats.methods.map((m) => (
                    <Tag
                      key={m.method}
                      color={m.method === 8 ? 'blue' : m.method === 0 ? 'default' : 'orange'}
                    >
                      {methodLabel(m.method)} ×{m.count}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={t.statDates}>
                {fmtDate(stats.minModified)} → {fmtDate(stats.maxModified)}
              </Descriptions.Item>
              <Descriptions.Item label={t.statComment}>
                {stats.comment ? (
                  <Text code style={{ wordBreak: 'break-all', fontSize: 12 }}>
                    {stats.comment}
                  </Text>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t.statZip64}>
                {stats.zip64 ? <Tag color="purple">{t.yes}</Tag> : t.no}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={t.warningsTitle}
            extra={
              <Space>
                <Tag color={severityCounts.error ? 'red' : 'default'}>
                  {severityCounts.error} {t.sevErrors}
                </Tag>
                <Tag color={severityCounts.warning ? 'orange' : 'default'}>
                  {severityCounts.warning} {t.sevWarnings}
                </Tag>
                <Tag color={severityCounts.info ? 'blue' : 'default'}>
                  {severityCounts.info} {t.sevInfos}
                </Tag>
              </Space>
            }
          >
            {result.warnings.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="success" style={{ fontSize: 13 }}>
                    {t.noWarnings}
                  </Text>
                }
              />
            ) : (
              result.warnings.map((w, i) => (
                <Alert
                  key={`${w.code}-${i}`}
                  type={w.severity === 'error' ? 'error' : w.severity === 'warning' ? 'warning' : 'info'}
                  showIcon
                  style={{ marginBottom: 8 }}
                  message={
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Text strong>{t.codes[w.code] || w.code}</Text>
                      {renderWarningDetail(w) && (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, wordBreak: 'break-all', fontWeight: 400 }}
                        >
                          {renderWarningDetail(w)}
                        </Text>
                      )}
                    </Space>
                  }
                />
              ))
            )}
          </Card>

          <Card
            title={t.entriesTitle}
            extra={
              <Input
                allowClear
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder={t.filterPlaceholder}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ width: 240 }}
              />
            }
          >
            <Table
              size="small"
              rowKey="index"
              columns={columns}
              dataSource={filteredEntries}
              scroll={{ x: 1060 }}
              locale={{ emptyText: filter ? t.emptyFilter : <Empty /> }}
              pagination={{
                pageSize: 25,
                showSizeChanger: false,
                showTotal: (range, total) => `${range[0]}–${range[1]} / ${total}`,
              }}
            />
          </Card>

          {selectedEntry && (
            <Card
              title={
                <Space>
                  <FileOutlined />
                  <Text strong style={{ fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all' }}>
                    {selectedEntry.name}
                  </Text>
                </Space>
              }
              extra={
                <Space>
                  <Tag>{t.detailTitle}</Tag>
                  <Button size="small" onClick={closeDetail}>
                    {t.close}
                  </Button>
                </Space>
              }
            >
              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2, md: 3 }}
                bordered
                style={{ marginBottom: 16 }}
              >
                <Descriptions.Item label={t.dName} span={{ xs: 1, sm: 2, md: 3 }}>
                  <Text code style={{ wordBreak: 'break-all' }}>
                    {selectedEntry.name}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.dMethod}>
                  {methodLabel(selectedEntry.method)} ({selectedEntry.method})
                </Descriptions.Item>
                <Descriptions.Item label={t.dUncompressed}>
                  {fmtBytes(selectedEntry.uncompressedSize)}
                </Descriptions.Item>
                <Descriptions.Item label={t.dCompressed}>
                  {fmtBytes(selectedEntry.compressedSize)}
                </Descriptions.Item>
                <Descriptions.Item label={t.dRatio}>
                  <Text
                    strong={selectedEntry.ratio != null && selectedEntry.ratio >= 100}
                    style={
                      selectedEntry.ratio != null && selectedEntry.ratio >= 100
                        ? { color: '#cf1322' }
                        : undefined
                    }
                  >
                    {fmtRatio(selectedEntry.ratio)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.dCrc}>
                  <Text code>{fmtCrc(selectedEntry.crc32)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.dModified}>
                  {fmtDate(selectedEntry.modified)}
                </Descriptions.Item>
                <Descriptions.Item label={t.dOffset}>
                  <Text code>{selectedEntry.localOffset}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.dVersion}>
                  0.{selectedEntry.versionNeeded}
                </Descriptions.Item>
                <Descriptions.Item label={t.dHost}>
                  {HOST_SYSTEMS[selectedEntry.hostSystem] || `#${selectedEntry.hostSystem}`}
                </Descriptions.Item>
                <Descriptions.Item label={t.dFlags}>
                  <Text code>0x{selectedEntry.flags.toString(16).padStart(4, '0')}</Text>
                </Descriptions.Item>
                <Descriptions.Item label={t.dPerms}>
                  {(selectedEntry.externalAttrs >>> 16) & 0o7777
                    ? t.permissions(((selectedEntry.externalAttrs >>> 16) & 0o7777).toString(8))
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label={t.dComment}>
                  {selectedEntry.comment ? (
                    <Text style={{ fontSize: 12 }}>{selectedEntry.comment}</Text>
                  ) : (
                    '—'
                  )}
                </Descriptions.Item>
              </Descriptions>

              {(warningsByName.get(selectedEntry.name) || []).map((w, i) => (
                <Alert
                  key={`${w.code}-${i}`}
                  type={w.severity === 'error' ? 'error' : w.severity === 'warning' ? 'warning' : 'info'}
                  showIcon
                  style={{ marginBottom: 8 }}
                  message={
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Text strong>{t.codes[w.code] || w.code}</Text>
                      {renderWarningDetail(w) && (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, wordBreak: 'break-all', fontWeight: 400 }}
                        >
                          {renderWarningDetail(w)}
                        </Text>
                      )}
                    </Space>
                  }
                />
              ))}

              <Paragraph type="secondary" style={{ marginBottom: 8, fontSize: 13 }}>
                {t.previewTitle}
              </Paragraph>

              {!preview || preview.status === 'loading' ? (
                <Spin />
              ) : preview.status === 'unsupported' ? (
                <Alert type="info" showIcon message={t.unsupportedMethod(preview.method)} />
              ) : preview.status === 'none' ? (
                <Alert
                  type="info"
                  showIcon
                  message={t.notExtractable[preview.reason] || preview.reason}
                />
              ) : preview.status === 'error' ? (
                <Alert
                  type="error"
                  showIcon
                  message={t.extractError[preview.reason] || t.extractError.unknown}
                />
              ) : preview.status === 'ok' ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Space wrap>
                    <Tag
                      icon={
                        preview.crcOk ? <CheckCircleOutlined /> : <CloseCircleOutlined />
                      }
                      color={preview.crcOk ? 'green' : 'red'}
                    >
                      {preview.crcOk ? t.crcOk : t.crcBad}
                    </Tag>
                    <Tag>{t.kind[preview.kind]}</Tag>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => downloadEntry(selectedEntry)}
                    >
                      {t.downloadEntry}
                    </Button>
                  </Space>

                  {preview.kind === 'image' && (
                    <img
                      src={preview.imageUrl}
                      alt={selectedEntry.name}
                      style={{
                        maxWidth: '100%',
                        maxHeight: 420,
                        background: '#fff',
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: 8,
                        objectFit: 'contain',
                      }}
                    />
                  )}

                  {preview.kind === 'text' && (
                    <>
                      <pre
                        data-testid="zip-text-preview"
                        style={{
                          ...BLOCK_STYLE,
                          maxHeight: 420,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                        }}
                      >
                        {preview.text}
                        {preview.truncated ? '\n…' : ''}
                      </pre>
                      {preview.truncated && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.textLimit(fmtBytes(TEXT_PREVIEW_BYTES))}
                        </Text>
                      )}
                    </>
                  )}

                  {preview.kind === 'hex' && (
                    <>
                      <pre data-testid="zip-hex-preview" style={{ ...BLOCK_STYLE, maxHeight: 420 }}>
                        {hexDump(preview.bytes, HEX_PREVIEW_BYTES)}
                      </pre>
                      {preview.bytes.length > HEX_PREVIEW_BYTES && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {t.hexLimit(fmtBytes(HEX_PREVIEW_BYTES))}
                        </Text>
                      )}
                    </>
                  )}

                  {preview.kind === 'empty' && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {t.emptyFile}
                    </Text>
                  )}
                </Space>
              ) : (
                <Spin />
              )}
            </Card>
          )}
        </>
      )}

      <Card title={<><CodeOutlined /> {t.howTitle}</>}>
        <Paragraph style={{ marginBottom: 0 }}>{t.howBody}</Paragraph>
      </Card>

      <Card title={<><CodeOutlined /> {t.sourceTitle}</>}>
        <Paragraph type="secondary" style={{ marginTop: 0 }}>
          {t.sourceHint}
        </Paragraph>
        <pre style={{ ...BLOCK_STYLE, maxHeight: 520, whiteSpace: 'pre-wrap' }}>{engineSource}</pre>
      </Card>
    </Space>
  )
}
