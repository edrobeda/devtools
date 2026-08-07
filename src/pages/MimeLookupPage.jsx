import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert } from 'antd'
import { ReadOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['application', 'audio', 'font', 'image', 'text', 'video', 'multipart']

const CATEGORY_COLOR = {
  application: 'purple',
  audio: 'cyan',
  font: 'geekblue',
  image: 'magenta',
  text: 'green',
  video: 'orange',
  multipart: 'gold',
}

const MIME_TYPES = [
  // application
  { mime: 'application/json', cat: 'application', ext: ['json'], pt: 'dados estruturados (APIs/web)', en: 'structured data (APIs/web)' },
  { mime: 'application/ld+json', cat: 'application', ext: ['jsonld'], pt: 'JSON-LD (dados ligados)', en: 'JSON-LD linked data' },
  { mime: 'application/xml', cat: 'application', ext: ['xml'], pt: 'XML genérico', en: 'generic XML' },
  { mime: 'application/javascript', cat: 'application', ext: ['js', 'mjs', 'cjs'], pt: 'código JavaScript (MIME canônico)', en: 'JavaScript code (canonical MIME)' },
  { mime: 'text/javascript', cat: 'text', ext: ['js', 'mjs', 'cjs'], pt: 'código JavaScript (o que o navegador executa)', en: 'JavaScript code (what browsers execute)' },
  { mime: 'application/ecmascript', cat: 'application', ext: ['es'], pt: 'código ECMAScript', en: 'ECMAScript code' },
  { mime: 'application/pdf', cat: 'application', ext: ['pdf'], pt: 'documento PDF', en: 'PDF document' },
  { mime: 'application/wasm', cat: 'application', ext: ['wasm'], pt: 'código WebAssembly binário', en: 'binary WebAssembly code' },
  { mime: 'application/octet-stream', cat: 'application', ext: ['bin', 'exe', 'dll', 'dat'], pt: 'dados binários genéricos (fallback)', en: 'generic binary data (fallback)' },
  { mime: 'application/zip', cat: 'application', ext: ['zip'], pt: 'arquivo ZIP comprimido', en: 'ZIP compressed archive' },
  { mime: 'application/gzip', cat: 'application', ext: ['gz'], pt: 'arquivo comprimido gzip', en: 'gzip compressed archive' },
  { mime: 'application/x-tar', cat: 'application', ext: ['tar'], pt: 'arquivo tar (sem compressão)', en: 'tar archive (uncompressed)' },
  { mime: 'application/x-7z-compressed', cat: 'application', ext: ['7z'], pt: 'arquivo 7-Zip', en: '7-Zip archive' },
  { mime: 'application/x-rar-compressed', cat: 'application', ext: ['rar'], pt: 'arquivo RAR', en: 'RAR archive' },
  { mime: 'application/x-bzip2', cat: 'application', ext: ['bz2'], pt: 'arquivo comprimido bzip2', en: 'bzip2 compressed archive' },
  { mime: 'application/x-xz', cat: 'application', ext: ['xz'], pt: 'arquivo comprimido xz', en: 'xz compressed archive' },
  { mime: 'application/x-sh', cat: 'application', ext: ['sh'], pt: 'script de shell', en: 'shell script' },
  { mime: 'application/x-httpd-php', cat: 'application', ext: ['php'], pt: 'script PHP', en: 'PHP source' },
  { mime: 'application/x-tex', cat: 'application', ext: ['tex'], pt: 'documento LaTeX', en: 'LaTeX source' },
  { mime: 'application/rtf', cat: 'application', ext: ['rtf'], pt: 'Rich Text Format', en: 'Rich Text Format' },
  { mime: 'application/sql', cat: 'application', ext: ['sql'], pt: 'script SQL', en: 'SQL script' },
  { mime: 'application/graphql', cat: 'application', ext: ['graphql'], pt: 'schema/language GraphQL', en: 'GraphQL schema/language' },
  { mime: 'application/rss+xml', cat: 'application', ext: ['rss'], pt: 'feed RSS', en: 'RSS feed' },
  { mime: 'application/atom+xml', cat: 'application', ext: ['atom'], pt: 'feed Atom', en: 'Atom feed' },
  { mime: 'application/xhtml+xml', cat: 'application', ext: ['xhtml'], pt: 'documento XHTML', en: 'XHTML document' },
  { mime: 'application/epub+zip', cat: 'application', ext: ['epub'], pt: 'e-book EPUB', en: 'EPUB e-book' },
  { mime: 'application/manifest+json', cat: 'application', ext: ['webmanifest'], pt: 'manifesto de app web (PWA)', en: 'web app manifest (PWA)' },
  { mime: 'application/x-www-form-urlencoded', cat: 'application', ext: [], pt: 'dados de formulário URL-encoded', en: 'URL-encoded form data' },
  { mime: 'application/vnd.ms-excel', cat: 'application', ext: ['xls'], pt: 'planilha Excel (.xls)', en: 'Excel spreadsheet (.xls)' },
  { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', cat: 'application', ext: ['xlsx'], pt: 'planilha Excel (.xlsx)', en: 'Excel spreadsheet (.xlsx)' },
  { mime: 'application/msword', cat: 'application', ext: ['doc'], pt: 'documento Word (.doc)', en: 'Word document (.doc)' },
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', cat: 'application', ext: ['docx'], pt: 'documento Word (.docx)', en: 'Word document (.docx)' },
  { mime: 'application/vnd.ms-powerpoint', cat: 'application', ext: ['ppt'], pt: 'apresentação PowerPoint (.ppt)', en: 'PowerPoint presentation (.ppt)' },
  { mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', cat: 'application', ext: ['pptx'], pt: 'apresentação PowerPoint (.pptx)', en: 'PowerPoint presentation (.pptx)' },
  { mime: 'application/vnd.apple.installer+xml', cat: 'application', ext: ['mpkg'], pt: 'instalador macOS Apple', en: 'Apple macOS installer' },
  { mime: 'application/vnd.ms-fontobject', cat: 'font', ext: ['eot'], pt: 'fonte EOT (IE legado)', en: 'EOT font (legacy IE)' },

  // audio
  { mime: 'audio/mpeg', cat: 'audio', ext: ['mp3'], pt: 'áudio MP3', en: 'MP3 audio' },
  { mime: 'audio/aac', cat: 'audio', ext: ['aac'], pt: 'áudio AAC', en: 'AAC audio' },
  { mime: 'audio/flac', cat: 'audio', ext: ['flac'], pt: 'áudio FLAC (sem perdas)', en: 'FLAC audio (lossless)' },
  { mime: 'audio/ogg', cat: 'audio', ext: ['ogg', 'oga'], pt: 'áudio Ogg', en: 'Ogg audio' },
  { mime: 'audio/opus', cat: 'audio', ext: ['opus'], pt: 'áudio Opus', en: 'Opus audio' },
  { mime: 'audio/wav', cat: 'audio', ext: ['wav'], pt: 'áudio WAV (PCM sem compressão)', en: 'WAV audio (uncompressed PCM)' },
  { mime: 'audio/x-wav', cat: 'audio', ext: ['wav'], pt: 'áudio WAV (compatibilidade)', en: 'WAV audio (compatibility)' },
  { mime: 'audio/webm', cat: 'audio', ext: ['weba'], pt: 'áudio WebM', en: 'WebM audio' },
  { mime: 'audio/mp4', cat: 'audio', ext: ['m4a', 'mp4'], pt: 'áudio MP4/AAC', en: 'MP4/AAC audio' },
  { mime: 'audio/x-m4a', cat: 'audio', ext: ['m4a'], pt: 'áudio MPEG-4 (.m4a)', en: 'MPEG-4 audio (.m4a)' },
  { mime: 'audio/midi', cat: 'audio', ext: ['mid', 'midi'], pt: 'áudio MIDI', en: 'MIDI audio' },
  { mime: 'audio/3gpp', cat: 'audio', ext: ['3gp', '3ga'], pt: 'áudio em container 3GPP', en: 'audio in 3GPP container' },

  // font
  { mime: 'font/ttf', cat: 'font', ext: ['ttf'], pt: 'fonte TrueType', en: 'TrueType font' },
  { mime: 'font/otf', cat: 'font', ext: ['otf'], pt: 'fonte OpenType', en: 'OpenType font' },
  { mime: 'font/woff', cat: 'font', ext: ['woff'], pt: 'fonte Web Open Font (v1)', en: 'Web Open Font (v1)' },
  { mime: 'font/woff2', cat: 'font', ext: ['woff2'], pt: 'fonte Web Open Font (v2, compacta)', en: 'Web Open Font (v2, compact)' },
  { mime: 'font/collection', cat: 'font', ext: ['ttc'], pt: 'coleção de fontes TrueType', en: 'TrueType font collection' },

  // image
  { mime: 'image/png', cat: 'image', ext: ['png'], pt: 'imagem PNG (sem perdas)', en: 'PNG image (lossless)' },
  { mime: 'image/jpeg', cat: 'image', ext: ['jpg', 'jpeg', 'jpe'], pt: 'imagem JPEG', en: 'JPEG image' },
  { mime: 'image/gif', cat: 'image', ext: ['gif'], pt: 'imagem GIF (animada)', en: 'GIF image (animated)' },
  { mime: 'image/webp', cat: 'image', ext: ['webp'], pt: 'imagem WebP', en: 'WebP image' },
  { mime: 'image/avif', cat: 'image', ext: ['avif'], pt: 'imagem AVIF', en: 'AVIF image' },
  { mime: 'image/apng', cat: 'image', ext: ['apng'], pt: 'PNG animado', en: 'animated PNG' },
  { mime: 'image/svg+xml', cat: 'image', ext: ['svg'], pt: 'vetorial SVG (XML)', en: 'vector SVG (XML)' },
  { mime: 'image/bmp', cat: 'image', ext: ['bmp'], pt: 'imagem bitmap BMP', en: 'BMP bitmap image' },
  { mime: 'image/tiff', cat: 'image', ext: ['tif', 'tiff'], pt: 'imagem TIFF', en: 'TIFF image' },
  { mime: 'image/heic', cat: 'image', ext: ['heic'], pt: 'imagem HEIC (alta eficiência)', en: 'HEIC high-efficiency image' },
  { mime: 'image/heif', cat: 'image', ext: ['heif'], pt: 'imagem HEIF', en: 'HEIF image' },
  { mime: 'image/x-icon', cat: 'image', ext: ['ico'], pt: 'favicon (ícone)', en: 'favicon (icon)' },
  { mime: 'image/vnd.microsoft.icon', cat: 'image', ext: ['ico'], pt: 'favicon (MIME IANA)', en: 'favicon (IANA MIME)' },
  { mime: 'image/x-tga', cat: 'image', ext: ['tga'], pt: 'imagem TGA', en: 'TGA image' },

  // text
  { mime: 'text/plain', cat: 'text', ext: ['txt', 'log', 'text'], pt: 'texto puro', en: 'plain text' },
  { mime: 'text/html', cat: 'text', ext: ['html', 'htm'], pt: 'página HTML', en: 'HTML page' },
  { mime: 'text/css', cat: 'text', ext: ['css'], pt: 'folha de estilo CSS', en: 'CSS stylesheet' },
  { mime: 'text/markdown', cat: 'text', ext: ['md', 'markdown'], pt: 'documento Markdown', en: 'Markdown document' },
  { mime: 'text/csv', cat: 'text', ext: ['csv'], pt: 'valores separados por vírgula', en: 'comma-separated values' },
  { mime: 'text/tab-separated-values', cat: 'text', ext: ['tsv'], pt: 'valores separados por tabulação', en: 'tab-separated values' },
  { mime: 'text/calendar', cat: 'text', ext: ['ics'], pt: 'calendário iCalendar', en: 'iCalendar' },
  { mime: 'text/xml', cat: 'text', ext: ['xml'], pt: 'XML como texto', en: 'XML as text' },
  { mime: 'text/yaml', cat: 'text', ext: ['yaml', 'yml'], pt: 'dados YAML', en: 'YAML data' },
  { mime: 'text/vtt', cat: 'text', ext: ['vtt'], pt: 'legendas WebVTT', en: 'WebVTT subtitles' },
  { mime: 'text/x-c', cat: 'text', ext: ['c', 'h'], pt: 'código-fonte C', en: 'C source code' },
  { mime: 'text/x-c++', cat: 'text', ext: ['cpp', 'cc', 'cxx', 'hpp'], pt: 'código-fonte C++', en: 'C++ source code' },
  { mime: 'text/x-java-source', cat: 'text', ext: ['java'], pt: 'código-fonte Java', en: 'Java source code' },
  { mime: 'text/x-python', cat: 'text', ext: ['py'], pt: 'código Python (não padronizado)', en: 'Python source (non-standard)' },
  { mime: 'text/x-shellscript', cat: 'text', ext: ['sh'], pt: 'script de shell', en: 'shell script' },

  // video
  { mime: 'video/mp4', cat: 'video', ext: ['mp4', 'm4v'], pt: 'vídeo MP4 (H.264)', en: 'MP4 video (H.264)' },
  { mime: 'video/webm', cat: 'video', ext: ['webm'], pt: 'vídeo WebM', en: 'WebM video' },
  { mime: 'video/ogg', cat: 'video', ext: ['ogv'], pt: 'vídeo Ogg', en: 'Ogg video' },
  { mime: 'video/quicktime', cat: 'video', ext: ['mov'], pt: 'vídeo QuickTime', en: 'QuickTime video' },
  { mime: 'video/x-matroska', cat: 'video', ext: ['mkv'], pt: 'vídeo Matroska', en: 'Matroska video' },
  { mime: 'video/x-msvideo', cat: 'video', ext: ['avi'], pt: 'vídeo AVI', en: 'AVI video' },
  { mime: 'video/mpeg', cat: 'video', ext: ['mpeg', 'mpg'], pt: 'vídeo MPEG', en: 'MPEG video' },
  { mime: 'video/mp2t', cat: 'video', ext: ['ts'], pt: 'fluxo de transmissão MPEG-TS', en: 'MPEG transport stream' },
  { mime: 'video/3gpp', cat: 'video', ext: ['3gp', '3gpp'], pt: 'vídeo 3GPP (mobile)', en: '3GPP video (mobile)' },
  { mime: 'video/x-flv', cat: 'video', ext: ['flv'], pt: 'fluxo Flash Video', en: 'Flash Video stream' },

  // multipart
  { mime: 'multipart/form-data', cat: 'multipart', ext: [], pt: 'formulário multipart (envio de arquivos)', en: 'multipart form (file upload)' },
  { mime: 'multipart/mixed', cat: 'multipart', ext: [], pt: 'partes de tipos diferentes no mesmo corpo', en: 'mixed parts in one body' },
  { mime: 'multipart/alternative', cat: 'multipart', ext: [], pt: 'mesmo conteúdo em formatos alternativos', en: 'same content in alternative formats' },
]

const labelOf = {
  application: { pt: 'Aplicação', en: 'Application' },
  audio: { pt: 'Áudio', en: 'Audio' },
  font: { pt: 'Fonte', en: 'Font' },
  image: { pt: 'Imagem', en: 'Image' },
  text: { pt: 'Texto', en: 'Text' },
  video: { pt: 'Vídeo', en: 'Video' },
  multipart: { pt: 'Multipart', en: 'Multipart' },
}

const translations = {
  pt: {
    title: 'Lookup de MIME Types',
    intro: (<>Referência pesquisável de tipos MIME (media types) — procure por extensão, tipo MIME ou categoria pra achar o tipo certo de usar em <Text code>Content-Type</Text>, <Text code>accept</Text> ou na detecção de arquivos.</>),
    search: 'Buscar tipo MIME, extensão ou descrição...',
    all: 'Todos',
    empty: 'Nenhum tipo encontrado. Tente outra busca ou categoria.',
    resultsOne: 'tipo encontrado',
    resultsMany: 'tipos encontrados',
    tipTitle: 'Como o Content-Type funciona',
    tipBody: (<>Um recurso é nomeado pela extensão, mas o que os servidores e o navegador usam diretamente é o cabeçalho <Text code>Content-Type</Text> (ou o atributo <Text code>type</Text> em <Text code>&lt;script&gt;</Text>/<Text code>&lt;link&gt;</Text>). Esta referência é o mapa inverso: dado um tipo ou uma extensão, você acha o outro lado. Alguns tipos têm mais de um alias — por exemplo, <Text code>.js</Text> é <Text code>text/javascript</Text> para o navegador (o único que ele usa e executa) e <Text code>application/javascript</Text> na spec.</>),
    ext: 'Extensões',
  },
  en: {
    title: 'MIME Types Lookup',
    intro: (<>A searchable MIME (media) types reference — look up by MIME type, extension or category to find the right value for <Text code>Content-Type</Text>, <Text code>accept</Text> or file detection.</>),
    search: 'Search MIME type, extension or description...',
    all: 'All',
    empty: 'No type found. Try a different search or category.',
    resultsOne: 'type found',
    resultsMany: 'types found',
    tipTitle: 'How Content-Type works',
    tipBody: (<>A resource is named by its extension, but what servers and the browser actually use is the <Text code>Content-Type</Text> header (or the <Text code>type</Text> attribute on <Text code>&lt;script&gt;</Text>/<Text code>&lt;link&gt;</Text>). This reference is the reverse map: given an extension or a MIME, find the other side. Some types have more than one alias — for example <Text code>.js</Text> is <Text code>text/javascript</Text> for browsers (only that one gets executed) and <Text code>application/javascript</Text> in the spec.</>),
    ext: 'Extensions',
  },
}

export default function MimeLookupPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query).replace(/^\./, '')
    return MIME_TYPES.filter((m) => {
      if (category !== 'all' && m.cat !== category) return false
      if (!q) return true
      return (
        m.mime.toLowerCase().includes(q) ||
        m.ext.some((e) => e.startsWith(q)) ||
        m[lang].toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="info"
        showIcon
        icon={<InboxOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>{labelOf[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Text type="secondary">
        {filtered.length} {resultLabel}
      </Text>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.mime}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap>
                  <Text code style={{ fontSize: 13 }}>{item.mime}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                </Space>
                <Text type="secondary">{item[lang]}</Text>
                {item.ext.length > 0 && (
                  <Space wrap size={[0, 4]}>
                    <Text type="secondary" style={{ marginRight: 4 }}>
                      {t.ext}:
                    </Text>
                    {item.ext.map((e) => (
                      <Tag key={e}>.{e}</Tag>
                    ))}
                  </Space>
                )}
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}