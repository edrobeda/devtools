import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Radio,
  Switch,
  InputNumber,
  Row,
  Col,
  Statistic,
  Alert,
  Collapse,
  message,
} from 'antd'
import {
  FolderOpenOutlined,
  CopyOutlined,
  FileSearchOutlined,
  FolderOutlined,
  FileOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import useCopyToClipboard from '../hooks/useCopyToClipboard'
import {
  generateDirectoryTree,
  countNodes,
  scanDirectoryWithPicker,
} from '../utils/directoryTreeGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const DEFAULT_SAMPLE = `src
src/components
src/components/AppLayout.jsx
src/components/BugReportWidget.jsx
src/hooks/useCopyToClipboard.js
src/hooks/useLanguage.js
src/pages/HomePage.jsx
src/utils/directoryTreeGenerator.js
public/index.html
package.json
README.md`

const STYLE_OPTIONS = ['ascii', 'unicode', 'markdown', 'json', 'yaml']

const translations = {
  pt: {
    title: 'Gerador de Árvore de Diretórios',
    intro:
      'Cole uma lista de caminhos ou selecione um diretório local para gerar uma árvore visual no estilo comando tree. Útil para documentação, READMEs e revisões de estrutura de projeto.',
    selectDir: 'Selecionar diretório',
    selectDirHint: 'Funciona em navegadores que suportam File System Access API.',
    pathsPlaceholder: 'Cole caminhos aqui, um por linha...\nEx: src/components/Button.jsx',
    rootName: 'Nome da raiz',
    ignorePatterns: 'Ignorar padrões (glob)',
    ignoreHelp: 'Separe por vírgula ou nova linha. Ex: node_modules, .git, *.log',
    maxDepth: 'Profundidade máxima',
    dirsOnly: 'Apenas diretórios',
    outputStyle: 'Estilo de saída',
    preview: 'Preview',
    copy: 'Copiar',
    copied: 'Copiado!',
    directories: 'Diretórios',
    files: 'Arquivos',
    empty: 'Nenhum caminho fornecido.',
    fsUnsupported: 'Seu navegador não suporta seleção de diretório.',
    scanError: 'Erro ao escanear diretório',
    sourceTitle: 'Algoritmo de geração',
    sourceDesc: 'A lógica que transforma caminhos planos em árvore e renderiza em vários formatos.',
  },
  en: {
    title: 'Directory Tree Generator',
    intro:
      'Paste a list of paths or select a local directory to generate a visual tree like the tree command. Useful for documentation, READMEs, and project structure reviews.',
    selectDir: 'Select directory',
    selectDirHint: 'Works in browsers that support the File System Access API.',
    pathsPlaceholder: 'Paste paths here, one per line...\nEx: src/components/Button.jsx',
    rootName: 'Root name',
    ignorePatterns: 'Ignore patterns (glob)',
    ignoreHelp: 'Separate with commas or new lines. Ex: node_modules, .git, *.log',
    maxDepth: 'Max depth',
    dirsOnly: 'Directories only',
    outputStyle: 'Output style',
    preview: 'Preview',
    copy: 'Copy',
    copied: 'Copied!',
    directories: 'Directories',
    files: 'Files',
    empty: 'No paths provided.',
    fsUnsupported: 'Your browser does not support directory selection.',
    scanError: 'Error scanning directory',
    sourceTitle: 'Generation algorithm',
    sourceDesc: 'The logic that turns flat paths into a tree and renders it in several formats.',
  },
}

export default function DirectoryTreeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [pathsText, setPathsText] = useState(DEFAULT_SAMPLE)
  const [rootName, setRootName] = useState('project')
  const [ignorePatterns, setIgnorePatterns] = useState('node_modules\n.git\n*.log')
  const [maxDepth, setMaxDepth] = useState(10)
  const [dirsOnly, setDirsOnly] = useState(false)
  const [style, setStyle] = useState('ascii')
  const [copied, doCopy] = useCopyToClipboard(2000)

  const options = useMemo(
    () => ({
      rootName,
      ignorePatterns,
      maxDepth,
      dirsOnly,
      style,
    }),
    [rootName, ignorePatterns, maxDepth, dirsOnly, style]
  )

  const treeOutput = useMemo(() => {
    if (!pathsText.trim()) return t.empty
    return generateDirectoryTree(pathsText, options)
  }, [pathsText, options, t.empty])

  const stats = useMemo(() => {
    if (!pathsText.trim()) return { directories: 0, files: 0 }
    const tree = generateDirectoryTree(pathsText, { ...options, style: 'json' })
    try {
      return countNodes(JSON.parse(tree))
    } catch {
      return { directories: 0, files: 0 }
    }
  }, [pathsText, options, t.empty])

  async function handleSelectDirectory() {
    if (!('showDirectoryPicker' in window)) {
      message.warning(t.fsUnsupported)
      return
    }
    try {
      const paths = await scanDirectoryWithPicker()
      setPathsText(paths.join('\n'))
      if (paths.length > 0) {
        const firstParts = paths[0].split(/[\\/]/)
        if (firstParts[0]) setRootName(firstParts[0])
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      message.error(`${t.scanError}: ${err.message}`)
    }
  }

  function handleCopy() {
    doCopy(treeOutput)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <FolderOpenOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button icon={<FileSearchOutlined />} onClick={handleSelectDirectory}>
            {t.selectDir}
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t.selectDirHint}
          </Text>

          <TextArea
            rows={8}
            value={pathsText}
            onChange={(e) => setPathsText(e.target.value)}
            placeholder={t.pathsPlaceholder}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.rootName}</Text>
                <Input
                  value={rootName}
                  onChange={(e) => setRootName(e.target.value)}
                  placeholder={t.rootName}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.maxDepth}</Text>
                <InputNumber
                  min={1}
                  max={50}
                  value={maxDepth}
                  onChange={(value) => setMaxDepth(value || 1)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.outputStyle}</Text>
                <Radio.Group
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  {STYLE_OPTIONS.map((s) => (
                    <Radio.Button key={s} value={s}>
                      {s}
                    </Radio.Button>
                  ))}
                </Radio.Group>
              </Space>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={16}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.ignorePatterns}</Text>
                <TextArea
                  rows={2}
                  value={ignorePatterns}
                  onChange={(e) => setIgnorePatterns(e.target.value)}
                  placeholder={t.ignoreHelp}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.ignoreHelp}
                </Text>
              </Space>
            </Col>
            <Col xs={24} md={8}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>{t.dirsOnly}</Text>
                <Switch
                  checked={dirsOnly}
                  onChange={setDirsOnly}
                  checkedChildren={t.dirsOnly}
                  unCheckedChildren={t.dirsOnly}
                />
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card
        title={t.preview}
        extra={
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            {copied ? t.copied : t.copy}
          </Button>
        }
      >
        <Row gutter={[24, 24]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={8}>
            <Statistic
              title={t.directories}
              value={stats.directories}
              prefix={<FolderOutlined />}
            />
          </Col>
          <Col xs={12} sm={8}>
            <Statistic
              title={t.files}
              value={stats.files}
              prefix={<FileOutlined />}
            />
          </Col>
        </Row>
        <pre
          style={{
            margin: 0,
            padding: 16,
            background: '#f5f5f5',
            borderRadius: 8,
            overflowX: 'auto',
            minHeight: 120,
            fontFamily: 'monospace, monospace',
          }}
        >
          <code>{treeOutput}</code>
        </pre>
      </Card>

      <Alert
        type="info"
        showIcon
        message={t.selectDirHint}
      />

      <Collapse
        items={[
          {
            key: 'source',
            label: (
              <Space>
                <Text strong>{t.sourceTitle}</Text>
                <Text type="secondary">{t.sourceDesc}</Text>
              </Space>
            ),
            children: (
              <pre style={{ margin: 0, overflowX: 'auto' }}>
                <code>{SOURCE_CODE}</code>
              </pre>
            ),
          },
        ]}
      />
    </Space>
  )
}

const SOURCE_CODE = `function buildTree(paths, options) {
  const root = { name: options.rootName, type: 'directory', children: [] }

  for (const rawPath of paths) {
    const parts = normalizePath(rawPath).split('/').filter(Boolean)
    let current = root
    for (let i = 0; i < Math.min(parts.length, options.maxDepth); i++) {
      const name = parts[i]
      const relativePath = parts.slice(0, i + 1).join('/')
      const type = i === parts.length - 1 ? 'file' : 'directory'

      if (shouldIgnore(relativePath, name, type, options.ignorePatterns)) break
      if (options.dirsOnly && type === 'file') break

      let child = current.children.find((c) => c.name === name)
      if (!child) {
        child = { name, type, children: [] }
        current.children.push(child)
      }
      current = child
    }
  }

  // Diretórios primeiro, depois arquivos, ambos ordenados alfabeticamente
  sortTree(root)
  return root
}`
