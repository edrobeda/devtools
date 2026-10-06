import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Button,
  Tag,
  Statistic,
  Row,
  Col,
  Alert,
  Empty,
  Collapse,
  message,
} from 'antd'
import {
  ContainerOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  CopyOutlined,
  CodeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ApartmentOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  analyzeDockerfile,
  SAMPLE_PT,
  SAMPLE_EN,
  ENGINE_SOURCE,
} from '../utils/dockerfileLayerExplorer'

const { Title, Paragraph, Text } = Typography
const { TextArea: AntdTextArea } = Input

// ─── Mapa visual de categorias ───────────────────────────────
const CATEGORY_COLOR = {
  base: 'blue',
  config: 'cyan',
  install: 'purple',
  meta: 'warning',
  security: 'red',
  start: 'green',
  legacy: 'default',
}

const CATEGORY_LABEL_PT = {
  base: 'base',
  config: 'config',
  install: 'install',
  meta: 'meta',
  security: 'segurança',
  start: 'start',
  legacy: 'legado',
}

const CATEGORY_LABEL_EN = {
  base: 'base',
  config: 'config',
  install: 'install',
  meta: 'meta',
  security: 'security',
  start: 'start',
  legacy: 'legacy',
}

const translations = {
  pt: {
    title: 'Explorador de Layers de Dockerfile',
    intro: (
      <>
        Cole um <Text code>Dockerfile</Text> e veja cada instrução virar um layer — com
        avisos sobre tudo que afeta tamanho de imagem, velocidade de build (cache de
        layers) e reprodutibilidade: <Text code>apt-get install</Text> sem{' '}
        <Text code>--no-install-recommends</Text>, <Text code>FROM</Text> sem tag,{' '}
        <Text code>COPY . .</Text> antes do install, <Text code>MAINTAINER</Text>{' '}
        deprecated, container rodando como root, etc. 100% client-side — nenhum dado sai
        do navegador.
      </>
    ),
    inputTitle: 'Dockerfile',
    inputPlaceholder: 'Cole aqui o conteúdo de um Dockerfile…',
    sample: 'Aplicar exemplo (multi-stage Node + nginx)',
    clear: 'Limpar',
    copy: 'Copiar resultado',
    copied: 'Copiado!',
    summaryTitle: 'Resumo',
    issuesTitle: 'Avisos',
    issuesEmpty: 'Nenhum aviso encontrado — o Dockerfile parece bem escrito.',
    issuesCollapse: 'Por severidade',
    howTitle: 'Como funciona',
    layersTitle: 'Layers',
    layersEmpty: 'Nenhuma instrução reconhecida. Cole um Dockerfile válido.',
    layersColLine: 'Linha',
    layersColStage: 'Stage',
    layersColInstr: 'Instrução',
    layersColArgs: 'Argumentos',
    layersColCat: 'Categoria',
    baseTitle: 'Imagem base',
    stagesTitle: 'Estágios do multi-stage',
    cacheTitle: 'Simulação de invalidação de cache',
    cacheHint:
      'Clique em um layer da tabela acima para ver quais layers seguintes precisariam ser reconstruídos se a instrução daquela linha mudar.',
    cacheNoChoice: 'Selecione um layer acima para ver o que é invalidado.',
    cacheInvalidatedFrom: 'Layers invalidados se esta linha mudar',
    cacheNoInvalidate: 'Nada é invalidado depois — é o último layer.',
    tableTitle: 'Tabela de layers',
    tableHint: 'Cada instrução do Dockerfile vira um layer no cache do Docker. Mudanças em qualquer layer invalidam todos os layers seguintes.',
    categoryLabels: CATEGORY_LABEL_PT,
    issueSeverity: { error: 'Erro', warning: 'Aviso', info: 'Info' },
    sourceTitle: 'Código-fonte do motor',
  },
  en: {
    title: 'Dockerfile Layer Explorer',
    intro: (
      <>
        Paste a <Text code>Dockerfile</Text> and see each instruction turned into a layer —
        with warnings for everything that affects image size, build speed (layer caching)
        and reproducibility: <Text code>apt-get install</Text> without{' '}
        <Text code>--no-install-recommends</Text>, <Text code>FROM</Text> without a tag,{' '}
        <Text code>COPY . .</Text> before install, deprecated <Text code>MAINTAINER</Text>,
        container running as root, etc. 100% client-side — nothing leaves the browser.
      </>
    ),
    inputTitle: 'Dockerfile',
    inputPlaceholder: 'Paste the contents of a Dockerfile here…',
    sample: 'Apply sample (multi-stage Node + nginx)',
    clear: 'Clear',
    copy: 'Copy result',
    copied: 'Copied!',
    summaryTitle: 'Summary',
    issuesTitle: 'Warnings',
    issuesEmpty: 'No warnings found — the Dockerfile looks clean.',
    issuesCollapse: 'By severity',
    howTitle: 'How it works',
    layersTitle: 'Layers',
    layersEmpty: 'No recognized instructions. Paste a valid Dockerfile.',
    layersColLine: 'Line',
    layersColStage: 'Stage',
    layersColInstr: 'Instruction',
    layersColArgs: 'Args',
    layersColCat: 'Category',
    baseTitle: 'Base image',
    stagesTitle: 'Multi-stage stages',
    cacheTitle: 'Cache invalidation simulation',
    cacheHint:
      'Click on a layer in the table above to see which downstream layers would have to be rebuilt if that line changes.',
    cacheNoChoice: 'Pick a layer above to see what gets invalidated.',
    cacheInvalidatedFrom: 'Layers invalidated if this line changes',
    cacheNoInvalidate: 'Nothing downstream — it is the last layer.',
    tableTitle: 'Layer table',
    tableHint: 'Each Dockerfile instruction is a layer in the Docker build cache. Any change in a layer invalidates every layer that comes after it.',
    categoryLabels: CATEGORY_LABEL_EN,
    issueSeverity: { error: 'Error', warning: 'Warning', info: 'Info' },
    sourceTitle: 'Engine source',
  },
}

// ── Ícones por severidade (reaproveitáveis) ──────────────────────
const SEVERITY_ICON = {
  error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  warning: <WarningOutlined style={{ color: '#faad14' }} />,
  info: <InfoCircleOutlined style={{ color: '#1677ff' }} />,
}

const SEVERITY_COLOR = {
  error: 'red',
  warning: 'orange',
  info: 'blue',
}

export default function DockerfileLayerExplorerPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [rawInput, setRawInput] = useState('')
  const [selectedLine, setSelectedLine] = useState(null)

  // Recalcula a análise em qualquer mudança do input. O `useMemo` aqui é
  // importante: rawInput muda a cada keystroke, e a análise cria um array
  // novo de layers + issues a cada chamada. Sem memo, o objeto seria
  // recriado em todo render mesmo com o mesmo conteúdo.
  const result = useMemo(() => analyzeDockerfile(rawInput), [rawInput])

  const handleSample = () => setRawInput(lang === 'pt' ? SAMPLE_PT : SAMPLE_EN)
  const handleClear = () => {
    setRawInput('')
    setSelectedLine(null)
  }

  const copy = async (text) => {
    if (!text) {
      message.warning('—')
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      message.success(t.copied)
    } catch (e) {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        message.success(t.copied)
      } catch {
        message.error(String(e))
      }
      document.body.removeChild(ta)
    }
  }

  // Issues agrupadas por severidade para o Collapse
  const issuesBySeverity = useMemo(() => {
    const groups = { error: [], warning: [], info: [] }
    result.issues.forEach((iss) => {
      if (groups[iss.severity]) groups[iss.severity].push(iss)
    })
    return groups
  }, [result.issues])

  // layers após a linha selecionada (invalidados)
  const invalidatedLayers = useMemo(() => {
    if (selectedLine === null) return []
    const i = result.layers.findIndex((l) => l.line === selectedLine)
    if (i === -1) return []
    return result.layers.slice(i)
  }, [result.layers, selectedLine])

  const handleSelectLine = (line) => {
    setSelectedLine(line === selectedLine ? null : line)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ContainerOutlined /> {t.title}
      </Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card
        title={t.inputTitle}
        extra={
          <Space>
            <Button icon={<ThunderboltOutlined />} onClick={handleSample}>
              {t.sample}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleClear}>
              {t.clear}
            </Button>
          </Space>
        }
      >
        <AntdTextArea
          value={rawInput}
          onChange={(e) => {
            setRawInput(e.target.value)
            setSelectedLine(null)
          }}
          placeholder={t.inputPlaceholder}
          autoSize={{ minRows: 10, maxRows: 30 }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Card>

      {result.layers.length === 0 ? (
        <Empty description={t.layersEmpty} />
      ) : (
        <>
          {/* ── Resumo ───────────────────────────────────────────── */}
          <Card title={t.summaryTitle}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="Layers (instruções)" value={result.summary.totalInstructions} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="Stages (FROM)" value={result.summary.totalStages} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="RUN" value={result.summary.totalRuns} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="COPY" value={result.summary.totalCopies} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="ADD" value={result.summary.totalAdds} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="ENV" value={result.summary.totalEnvs} />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                <strong style={{ marginRight: 6 }}>{t.baseTitle}:</strong>
                {result.summary.baseImages.map((img, i) => (
                  <Tag key={i} color="blue" style={{ marginRight: 6 }}>{img}</Tag>
                ))}
                {result.summary.stageAliases.length > 0 && (
                  <span style={{ marginLeft: 8 }}>
                    <strong style={{ marginRight: 6 }}>{t.stagesTitle}:</strong>
                    {result.summary.stageAliases.map((alias, i) => (
                      <Tag key={i} color="geekblue">{alias}</Tag>
                    ))}
                  </span>
                )}
                {!result.summary.hasUser && (
                  <Tag color="red" style={{ marginLeft: 8 }}>root (sem USER)</Tag>
                )}
              </Text>
            </div>
          </Card>

          {/* ── Issues ───────────────────────────────────────────── */}
          <Card title={<><WarningOutlined /> {t.issuesTitle} ({result.issues.length})</>}>
            {result.issues.length === 0 ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message={t.issuesEmpty}
              />
            ) : (
              <Collapse
                defaultActiveKey={['error', 'warning']}
                items={['error', 'warning', 'info']
                  .filter((sev) => issuesBySeverity[sev].length > 0)
                  .map((sev) => ({
                    key: sev,
                    label: (
                      <Space>
                        {SEVERITY_ICON[sev]}
                        <Text strong>
                          {t.issueSeverity[sev]} ({issuesBySeverity[sev].length})
                        </Text>
                      </Space>
                    ),
                    children: (
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {issuesBySeverity[sev].map((iss, i) => (
                          <Alert
                            key={i}
                            type={sev === 'error' ? 'error' : sev === 'warning' ? 'warning' : 'info'}
                            showIcon={false}
                            message={
                              <Space>
                                {SEVERITY_ICON[sev]}
                                <Text strong>{iss.title}</Text>
                                {iss.line !== null && (
                                  <Tag color={SEVERITY_COLOR[sev]} style={{ marginLeft: 4 }}>
                                    linha {iss.line}
                                  </Tag>
                                )}
                              </Space>
                            }
                            description={iss.detail}
                            style={{ padding: '8px 12px' }}
                          />
                        ))}
                      </Space>
                    ),
                  }))}
              />
            )}
          </Card>

          {/* ── Tabela de layers ─────────────────────────────────── */}
          <Card title={<><ApartmentOutlined /> {t.tableTitle}</>}>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              {t.tableHint}
            </Paragraph>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: '6px 8px', width: 60 }}>{t.layersColLine}</th>
                  <th style={{ padding: '6px 8px', width: 70 }}>{t.layersColStage}</th>
                  <th style={{ padding: '6px 8px', width: 130 }}>{t.layersColInstr}</th>
                  <th style={{ padding: '6px 8px' }}>{t.layersColArgs}</th>
                  <th style={{ padding: '6px 8px', width: 100 }}>{t.layersColCat}</th>
                </tr>
              </thead>
              <tbody>
                {result.layers.map((l, i) => {
                  const isSelected = selectedLine === l.line
                  const argsDisplay = l.instruction === 'FROM'
                    ? l.baseImage + (l.stageAlias ? ` AS ${l.stageAlias}` : '')
                    : l.args
                  const rowBg = isSelected ? '#e6f7ff' : 'transparent'
                  return (
                    <tr
                      key={i}
                      onClick={() => handleSelectLine(l.line)}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        background: rowBg,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '6px 8px', color: '#8c8c8c' }}>{l.line}</td>
                      <td style={{ padding: '6px 8px' }}>
                        <Tag color="default">{l.stage}</Tag>
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>
                          {l.instruction}
                        </Tag>
                      </td>
                      <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>
                        {argsDisplay}
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <Tag color={CATEGORY_COLOR[l.category]}>
                          {t.categoryLabels[l.category] || l.category}
                        </Tag>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          {/* ── Simulação de invalidação ─────────────────────────── */}
          <Card title={<><CodeOutlined /> {t.cacheTitle}</>}>
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              {t.cacheHint}
            </Paragraph>
            {selectedLine === null ? (
              <Alert type="info" showIcon message={t.cacheNoChoice} />
            ) : (
              <>
                  <Text strong>
                    {t.cacheInvalidatedFrom}: <Tag color="blue">linha {selectedLine}</Tag>
                  </Text>
                  <div style={{ marginTop: 12 }}>
                    {invalidatedLayers.length === 0 ? (
                      <Text type="secondary">{t.cacheNoInvalidate}</Text>
                    ) : (
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        {invalidatedLayers.map((l, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '6px 10px',
                              background: i === 0 ? '#fff1f0' : '#fffbe6',
                              borderRadius: 4,
                              fontSize: 13,
                            }}
                          >
                            <Space>
                              <Tag color="default">linha {l.line}</Tag>
                              <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>
                                {l.instruction}
                              </Tag>
                              <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                {l.instruction === 'FROM'
                                  ? l.baseImage + (l.stageAlias ? ` AS ${l.stageAlias}` : '')
                                  : l.args}
                              </Text>
                            </Space>
                          </div>
                        ))}
                      </Space>
                    )}
                  </div>
                </>
            )}
          </Card>

          {/* ── Como funciona ────────────────────────────────────── */}
          <Card title={<><CodeOutlined /> {t.howTitle}</>}>
            <Paragraph style={{ marginBottom: 0 }}>
              O motor 100% local (<Text code>dockerfileLayerExplorer.js</Text>) faz 4 coisas
              numa passada:
              <br />
              <br />
              1. <b>Pré-processa</b> o texto: remove comentários (<Text code>#</Text> como
              primeiro não-espaço) e une linhas com <Text code>\</Text> no fim (continuation),
              preservando o número de linha original.
              <br />
              <br />
              2. <b>Tokeniza</b> cada instrução: separa a keyword (<Text code>FROM</Text>,{' '}
              <Text code>RUN</Text>, <Text code>COPY</Text>, …) dos args. Suporta flags como
              <Text code>--chown=</Text>, <Text code>--from=</Text>, <Text code>--platform=</Text>.
              Para <Text code>FROM</Text>, extrai a imagem e o alias <Text code>AS name</Text>.
              <br />
              <br />
              3. <b>Categoriza</b> cada instrução em <Text code>base</Text>,{' '}
              <Text code>config</Text>, <Text code>install</Text>, <Text code>meta</Text>,{' '}
              <Text code>security</Text>, <Text code>start</Text> ou <Text code>legacy</Text> — a
              cor do badge na tabela.
              <br />
              <br />
              4. <b>Aplica heurísticas</b> em uma passada: detecta padrões que inflam a imagem
              (apt sem <Text code>--no-install-recommends</Text>, pip sem{' '}
              <Text code>--no-cache-dir</Text>, ADD em arquivos locais), quebram o cache (
              <Text code>COPY . .</Text> antes do install, <Text code>RUN apt-get update</Text>{' '}
              separado do install), reduzem reprodutibilidade (<Text code>FROM</Text> sem versão,{' '}
              <Text code>apt-get upgrade</Text>) ou indicam problemas de segurança (
              <Text code>MAINTAINER</Text>, <Text code>apt-key</Text>, container como root).
              <br />
              <br />
              O cache de layers do Docker é sequencial: cada layer é uma "fotografia" do
              filesystem após a instrução, e qualquer mudança invalida todos os layers
              seguintes — clique em qualquer linha da tabela para ver quais instruções precisam
              ser reconstruídas se ela mudar.
            </Paragraph>
          </Card>

          {/* ── Source do motor ──────────────────────────────────── */}
          <Card
            title={<><CodeOutlined /> {t.sourceTitle}</>}
            extra={
              <Button
                icon={<CopyOutlined />}
                onClick={() => copy(ENGINE_SOURCE)}
              >
                {t.copy}
              </Button>
            }
          >
              <pre
                style={{
                  background: '#fafafa',
                  padding: 16,
                  borderRadius: 8,
                  overflowX: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 12,
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #f0f0f0',
                  maxHeight: 400,
                }}
              >
                {ENGINE_SOURCE}
              </pre>
          </Card>
        </>
      )}
    </Space>
  )
}