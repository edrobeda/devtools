import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Tag,
  message,
  Checkbox,
  Divider,
} from 'antd'
import {
  MobileOutlined,
  CopyOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
  UndoOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  buildManifest,
  validateManifest,
  DEFAULTS,
  PRESETS,
  DISPLAYS,
  ORIENTATIONS,
  DIRS,
  PURPOSES,
  FORM_FACTORS,
  CATEGORIES,
} from '../utils/webAppManifest'

const { Title, Paragraph, Text } = Typography

const EMPTY_ICON = { src: '', sizes: '', type: '', purpose: 'any' }
const EMPTY_SCREENSHOT = { src: '', sizes: '', type: '', form_factor: 'wide', label: '' }
const EMPTY_SHORTCUT = { name: '', short_name: '', description: '', url: '', icons: [] }

const translations = {
  pt: {
    title: 'Gerador de Web App Manifest',
    intro:
      'Monta o arquivo manifest.json (ou .webmanifest) de uma PWA — nome, ícones, cores, atalhos, screenshots e categorias — pronto pra servir junto do <link rel="manifest">. Tudo acontece no navegador, nenhum dado sai daqui.',
    presets: 'Modelos de um clique',
    presetMinimal: 'PWA mínimo',
    presetDashboard: 'Dashboard / App',
    presetBlog: 'Blog / Conteúdo',
    reset: 'Restaurar',
    basicCard: '1 · Informações básicas',
    nameField: 'name',
    namePlaceholder: 'Nome completo do app',
    shortNameField: 'short_name',
    shortNamePlaceholder: 'Nome curto (até 12 caracteres)',
    descriptionField: 'description',
    descriptionPlaceholder: 'Descrição do app',
    startUrlField: 'start_url',
    startUrlPlaceholder: '/',
    scopeField: 'scope',
    scopePlaceholder: '/',
    idField: 'id',
    idPlaceholder: 'Identificador único da app',
    displayField: 'display',
    orientationField: 'orientation',
    langField: 'lang',
    langPlaceholder: 'pt-BR',
    dirField: 'dir',
    appearanceCard: '2 · Aparência',
    themeColorField: 'theme_color',
    backgroundColorField: 'background_color',
    iconsCard: '3 · Ícones',
    addIcon: 'Adicionar ícone',
    iconSrcColumn: 'src',
    iconSizesColumn: 'sizes',
    iconTypeColumn: 'type',
    iconPurposeColumn: 'purpose',
    iconSrcPlaceholder: '/icon-192.png',
    iconSizesPlaceholder: '192x192',
    iconTypePlaceholder: 'image/png',
    screenshotsCard: '4 · Screenshots',
    addScreenshot: 'Adicionar screenshot',
    screenshotSrcColumn: 'src',
    screenshotSizesColumn: 'sizes',
    screenshotTypeColumn: 'type',
    screenshotFormFactorColumn: 'form_factor',
    screenshotLabelColumn: 'label',
    shortcutsCard: '5 · Atalhos',
    addShortcut: 'Adicionar atalho',
    shortcutNameColumn: 'name',
    shortcutShortNameColumn: 'short_name',
    shortcutUrlColumn: 'url',
    shortcutDescriptionColumn: 'description',
    categoriesCard: '6 · Categorias e opções',
    categoriesField: 'categories',
    preferRelated: 'prefer_related_applications',
    outputCard: 'manifest.json gerado',
    copy: 'Copiar',
    copied: 'Manifest copiado!',
    download: 'Baixar .webmanifest',
    lineCount: (n) => `${n} linha${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    emptyOutput: '<!-- preencha pelo menos name e short_name -->',
    validationTitle: 'Campos obrigatórios pendentes',
    validationName: 'name é obrigatório',
    validationShortName: 'short_name é obrigatório',
    validationStartUrl: 'start_url é obrigatório',
    validationIconSrc: (i) => `Ícone ${i + 1}: src é obrigatório`,
    validationScreenshotSrc: (i) => `Screenshot ${i + 1}: src é obrigatório`,
    validationShortcutName: (i) => `Atalho ${i + 1}: name é obrigatório`,
    validationShortcutUrl: (i) => `Atalho ${i + 1}: url é obrigatório`,
    tipTitle: 'Dicas de Web App Manifest',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>name e short_name</Text> são obrigatórios para a instalação;
          o <Text code>short_name</Text> deve caber no launcher do sistema operacional.
        </li>
        <li>
          <Text strong>Ícones</Text> precisam de pelo menos 192×192 e 512×512 px para
          que o Chrome ofereça a opção "Instalar app".
        </li>
        <li>
          <Text strong>purpose: maskable</Text> deixa o ícone se adaptar a formatos de
          ícone do Android; o valor mais seguro é <Text code>any maskable</Text>.
        </li>
        <li>
          <Text strong>Screenshots</Text> com <Text code>form_factor</Text> ajudam as
          lojas (Google Play, Microsoft Store) e o instalador do Chrome a mostrar prévias.
        </li>
        <li>
          <Text strong>scope</Text> define até onde a PWA se comporta como app instalado;
          links fora do scope abrem no navegador.
        </li>
      </ul>
    ),
    sourceCol: 'Algoritmo-fonte',
    sourceBody:
      'buildManifest monta o objeto da spec W3C omitindo campos vazios, valida arrays (ícones, screenshots e atalhos precisam das chaves mínimas) e emite o JSON. validateManifest verifica name, short_name, start_url e srcs obrigatórios.',
  },
  en: {
    title: 'Web App Manifest Generator',
    intro:
      'Builds the manifest.json (or .webmanifest) file for a PWA — name, icons, colors, shortcuts, screenshots and categories — ready to serve alongside <link rel="manifest">. Everything happens in the browser; no data leaves this page.',
    presets: 'One-click templates',
    presetMinimal: 'Minimal PWA',
    presetDashboard: 'Dashboard / App',
    presetBlog: 'Blog / Content',
    reset: 'Reset',
    basicCard: '1 · Basic info',
    nameField: 'name',
    namePlaceholder: 'Full app name',
    shortNameField: 'short_name',
    shortNamePlaceholder: 'Short name (up to 12 chars)',
    descriptionField: 'description',
    descriptionPlaceholder: 'App description',
    startUrlField: 'start_url',
    startUrlPlaceholder: '/',
    scopeField: 'scope',
    scopePlaceholder: '/',
    idField: 'id',
    idPlaceholder: 'Unique app identifier',
    displayField: 'display',
    orientationField: 'orientation',
    langField: 'lang',
    langPlaceholder: 'en-US',
    dirField: 'dir',
    appearanceCard: '2 · Appearance',
    themeColorField: 'theme_color',
    backgroundColorField: 'background_color',
    iconsCard: '3 · Icons',
    addIcon: 'Add icon',
    iconSrcColumn: 'src',
    iconSizesColumn: 'sizes',
    iconTypeColumn: 'type',
    iconPurposeColumn: 'purpose',
    iconSrcPlaceholder: '/icon-192.png',
    iconSizesPlaceholder: '192x192',
    iconTypePlaceholder: 'image/png',
    screenshotsCard: '4 · Screenshots',
    addScreenshot: 'Add screenshot',
    screenshotSrcColumn: 'src',
    screenshotSizesColumn: 'sizes',
    screenshotTypeColumn: 'type',
    screenshotFormFactorColumn: 'form_factor',
    screenshotLabelColumn: 'label',
    shortcutsCard: '5 · Shortcuts',
    addShortcut: 'Add shortcut',
    shortcutNameColumn: 'name',
    shortcutShortNameColumn: 'short_name',
    shortcutUrlColumn: 'url',
    shortcutDescriptionColumn: 'description',
    categoriesCard: '6 · Categories & options',
    categoriesField: 'categories',
    preferRelated: 'prefer_related_applications',
    outputCard: 'Generated manifest.json',
    copy: 'Copy',
    copied: 'Manifest copied!',
    download: 'Download .webmanifest',
    lineCount: (n) => `${n} line${n === 1 ? '' : 's'}`,
    byteCount: (n) => `${n} bytes`,
    emptyOutput: '<!-- fill at least name and short_name -->',
    validationTitle: 'Required fields missing',
    validationName: 'name is required',
    validationShortName: 'short_name is required',
    validationStartUrl: 'start_url is required',
    validationIconSrc: (i) => `Icon ${i + 1}: src is required`,
    validationScreenshotSrc: (i) => `Screenshot ${i + 1}: src is required`,
    validationShortcutName: (i) => `Shortcut ${i + 1}: name is required`,
    validationShortcutUrl: (i) => `Shortcut ${i + 1}: url is required`,
    tipTitle: 'Web App Manifest tips',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>name and short_name</Text> are required for installation;
          <Text code>short_name</Text> must fit in the OS launcher.
        </li>
        <li>
          <Text strong>Icons</Text> need at least 192×192 and 512×512 px for Chrome
          to offer "Install app".
        </li>
        <li>
          <Text strong>purpose: maskable</Text> lets the icon adapt to Android
          adaptive shapes; the safest value is <Text code>any maskable</Text>.
        </li>
        <li>
          <Text strong>Screenshots</Text> with <Text code>form_factor</Text> help
          stores (Google Play, Microsoft Store) and the Chrome install dialog preview.
        </li>
        <li>
          <Text strong>scope</Text> defines where the installed PWA behaves like an app;
          out-of-scope links open in the browser.
        </li>
      </ul>
    ),
    sourceCol: 'Source code',
    sourceBody:
      'buildManifest assembles the W3C spec object, skips empty fields, validates arrays (icons, screenshots and shortcuts need their minimum keys) and emits JSON. validateManifest checks name, short_name, start_url and required srcs.',
  },
}

export default function WebAppManifestGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [form, setForm] = useState(DEFAULTS)
  const [pretty, setPretty] = useState(true)

  const patch = (p) => setForm((prev) => ({ ...prev, ...p }))
  const reset = () => setForm(DEFAULTS)

  const applyPreset = (key) => {
    const preset = PRESETS[key]
    if (preset) setForm(preset)
  }

  const json = useMemo(() => buildManifest(form, pretty), [form, pretty])
  const validation = useMemo(() => validateManifest(form), [form])
  const lineCount = json ? json.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([json]).size, [json])

  const updateArray = (field, index, value) => {
    setForm((prev) => {
      const next = [...prev[field]]
      next[index] = { ...next[index], ...value }
      return { ...prev, [field]: next }
    })
  }

  const addToArray = (field, empty) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], { ...empty }] }))
  }

  const removeFromArray = (field, index) => {
    setForm((prev) => {
      const next = [...prev[field]]
      next.splice(index, 1)
      return { ...prev, [field]: next }
    })
  }

  const moveInArray = (field, index, direction) => {
    setForm((prev) => {
      const next = [...prev[field]]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return { ...prev, [field]: next }
    })
  }

  const copyJson = () => {
    navigator.clipboard.writeText(json)
    message.success(t.copied)
  }

  const downloadJson = () => {
    const blob = new Blob([json], { type: 'application/manifest+json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manifest.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderError = (err) => {
    if (err.field === 'name') return t.validationName
    if (err.field === 'short_name') return t.validationShortName
    if (err.field === 'start_url') return t.validationStartUrl
    if (err.field === 'icons') return t.validationIconSrc(err.index)
    if (err.field === 'screenshots') return t.validationScreenshotSrc(err.index)
    if (err.field === 'shortcuts' && err.message.includes('url')) return t.validationShortcutUrl(err.index)
    if (err.field === 'shortcuts') return t.validationShortcutName(err.index)
    return err.message
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><MobileOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong>{t.presets}</Text>
        <Button size="small" icon={<UndoOutlined />} onClick={reset}>{t.reset}</Button>
      </Space>
      <Space wrap>
        {Object.entries(PRESETS).map(([key, p]) => (
          <Button key={key} size="small" onClick={() => applyPreset(key)}>{p.label[lang]}</Button>
        ))}
      </Space>

      <Card title={t.basicCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.nameField}</Text>}>
              <Input
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder={t.namePlaceholder}
                status={validation.some((e) => e.field === 'name') ? 'error' : ''}
              />
            </FormItem>
          </Col>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.shortNameField}</Text>}>
              <Input
                value={form.short_name}
                onChange={(e) => patch({ short_name: e.target.value })}
                placeholder={t.shortNamePlaceholder}
                status={validation.some((e) => e.field === 'short_name') ? 'error' : ''}
              />
            </FormItem>
          </Col>
          <Col xs={24}>
            <FormItem label={<Text code>{t.descriptionField}</Text>}>
              <Input.TextArea
                rows={2}
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                placeholder={t.descriptionPlaceholder}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormItem label={<Text code>{t.startUrlField}</Text>}>
              <Input
                value={form.start_url}
                onChange={(e) => patch({ start_url: e.target.value })}
                placeholder={t.startUrlPlaceholder}
                status={validation.some((e) => e.field === 'start_url') ? 'error' : ''}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormItem label={<Text code>{t.scopeField}</Text>}>
              <Input
                value={form.scope}
                onChange={(e) => patch({ scope: e.target.value })}
                placeholder={t.scopePlaceholder}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormItem label={<Text code>{t.idField}</Text>}>
              <Input
                value={form.id}
                onChange={(e) => patch({ id: e.target.value })}
                placeholder={t.idPlaceholder}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormItem label={<Text code>{t.displayField}</Text>}>
              <Select
                style={{ width: '100%' }}
                value={form.display}
                onChange={(v) => patch({ display: v })}
                options={DISPLAYS.map((d) => ({ value: d, label: d }))}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <FormItem label={<Text code>{t.orientationField}</Text>}>
              <Select
                style={{ width: '100%' }}
                value={form.orientation}
                onChange={(v) => patch({ orientation: v })}
                options={ORIENTATIONS.map((o) => ({ value: o, label: o }))}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <FormItem label={<Text code>{t.langField}</Text>}>
              <Input
                value={form.lang}
                onChange={(e) => patch({ lang: e.target.value })}
                placeholder={t.langPlaceholder}
              />
            </FormItem>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <FormItem label={<Text code>{t.dirField}</Text>}>
              <Select
                style={{ width: '100%' }}
                value={form.dir}
                onChange={(v) => patch({ dir: v })}
                options={DIRS.map((d) => ({ value: d, label: d }))}
              />
            </FormItem>
          </Col>
        </Row>
      </Card>

      <Card title={t.appearanceCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} sm={12}>
            <FormItem label={<Text code>{t.themeColorField}</Text>}>
              <Space>
                <input
                  type="color"
                  value={form.theme_color}
                  onChange={(e) => patch({ theme_color: e.target.value })}
                  style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                />
                <Input
                  value={form.theme_color}
                  onChange={(e) => patch({ theme_color: e.target.value })}
                  style={{ width: 120 }}
                />
              </Space>
            </FormItem>
          </Col>
          <Col xs={24} sm={12}>
            <FormItem label={<Text code>{t.backgroundColorField}</Text>}>
              <Space>
                <input
                  type="color"
                  value={form.background_color}
                  onChange={(e) => patch({ background_color: e.target.value })}
                  style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'none' }}
                />
                <Input
                  value={form.background_color}
                  onChange={(e) => patch({ background_color: e.target.value })}
                  style={{ width: 120 }}
                />
              </Space>
            </FormItem>
          </Col>
        </Row>
      </Card>

      <ArrayCard
        title={
          <Space>
            <MobileOutlined />
            {t.iconsCard}
            <Tag>{form.icons.length}</Tag>
          </Space>
        }
        addLabel={t.addIcon}
        onAdd={() => addToArray('icons', EMPTY_ICON)}
      >
        {form.icons.map((icon, i) => (
          <Row key={i} gutter={[12, 12]} align="middle">
            <Col xs={24} lg={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.iconSrcColumn}</Text>
              <Input
                value={icon.src}
                onChange={(e) => updateArray('icons', i, { src: e.target.value })}
                placeholder={t.iconSrcPlaceholder}
                status={validation.some((e) => e.field === 'icons' && e.index === i) ? 'error' : ''}
              />
            </Col>
            <Col xs={12} lg={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.iconSizesColumn}</Text>
              <Input
                value={icon.sizes}
                onChange={(e) => updateArray('icons', i, { sizes: e.target.value })}
                placeholder={t.iconSizesPlaceholder}
              />
            </Col>
            <Col xs={12} lg={5}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.iconTypeColumn}</Text>
              <Input
                value={icon.type}
                onChange={(e) => updateArray('icons', i, { type: e.target.value })}
                placeholder={t.iconTypePlaceholder}
              />
            </Col>
            <Col xs={20} lg={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.iconPurposeColumn}</Text>
              <Select
                style={{ width: '100%' }}
                value={icon.purpose || 'any'}
                onChange={(v) => updateArray('icons', i, { purpose: v })}
                options={PURPOSES.map((p) => ({ value: p, label: p }))}
              />
            </Col>
            <Col xs={4} lg={3}>
              <ArrayControls
                index={i}
                total={form.icons.length}
                onMove={(dir) => moveInArray('icons', i, dir)}
                onRemove={() => removeFromArray('icons', i)}
              />
            </Col>
          </Row>
        ))}
      </ArrayCard>

      <ArrayCard
        title={
          <Space>
            {t.screenshotsCard}
            <Tag>{form.screenshots.length}</Tag>
          </Space>
        }
        addLabel={t.addScreenshot}
        onAdd={() => addToArray('screenshots', EMPTY_SCREENSHOT)}
      >
        {form.screenshots.map((shot, i) => (
          <Row key={i} gutter={[12, 12]} align="middle">
            <Col xs={24} lg={8}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.screenshotSrcColumn}</Text>
              <Input
                value={shot.src}
                onChange={(e) => updateArray('screenshots', i, { src: e.target.value })}
                placeholder="/screenshots/wide.png"
                status={validation.some((e) => e.field === 'screenshots' && e.index === i) ? 'error' : ''}
              />
            </Col>
            <Col xs={12} lg={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.screenshotSizesColumn}</Text>
              <Input
                value={shot.sizes}
                onChange={(e) => updateArray('screenshots', i, { sizes: e.target.value })}
                placeholder="1280x720"
              />
            </Col>
            <Col xs={12} lg={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.screenshotTypeColumn}</Text>
              <Input
                value={shot.type}
                onChange={(e) => updateArray('screenshots', i, { type: e.target.value })}
                placeholder="image/png"
              />
            </Col>
            <Col xs={12} lg={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.screenshotFormFactorColumn}</Text>
              <Select
                style={{ width: '100%' }}
                value={shot.form_factor || 'wide'}
                onChange={(v) => updateArray('screenshots', i, { form_factor: v })}
                options={FORM_FACTORS.map((f) => ({ value: f, label: f }))}
              />
            </Col>
            <Col xs={8} lg={2}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.screenshotLabelColumn}</Text>
              <Input
                value={shot.label}
                onChange={(e) => updateArray('screenshots', i, { label: e.target.value })}
                placeholder="Desktop"
              />
            </Col>
            <Col xs={4} lg={2}>
              <ArrayControls
                index={i}
                total={form.screenshots.length}
                onMove={(dir) => moveInArray('screenshots', i, dir)}
                onRemove={() => removeFromArray('screenshots', i)}
              />
            </Col>
          </Row>
        ))}
      </ArrayCard>

      <ArrayCard
        title={
          <Space>
            {t.shortcutsCard}
            <Tag>{form.shortcuts.length}</Tag>
          </Space>
        }
        addLabel={t.addShortcut}
        onAdd={() => addToArray('shortcuts', EMPTY_SHORTCUT)}
      >
        {form.shortcuts.map((s, i) => (
          <Row key={i} gutter={[12, 12]} align="middle">
            <Col xs={24} sm={12} lg={5}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.shortcutNameColumn}</Text>
              <Input
                value={s.name}
                onChange={(e) => updateArray('shortcuts', i, { name: e.target.value })}
                placeholder="Novo pedido"
                status={validation.some((e) => e.field === 'shortcuts' && e.index === i) ? 'error' : ''}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.shortcutShortNameColumn}</Text>
              <Input
                value={s.short_name}
                onChange={(e) => updateArray('shortcuts', i, { short_name: e.target.value })}
                placeholder="Pedido"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.shortcutUrlColumn}</Text>
              <Input
                value={s.url}
                onChange={(e) => updateArray('shortcuts', i, { url: e.target.value })}
                placeholder="/pedidos/novo"
              />
            </Col>
            <Col xs={20} sm={12} lg={5}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t.shortcutDescriptionColumn}</Text>
              <Input
                value={s.description}
                onChange={(e) => updateArray('shortcuts', i, { description: e.target.value })}
                placeholder="Criar um novo pedido"
              />
            </Col>
            <Col xs={4} lg={4}>
              <ArrayControls
                index={i}
                total={form.shortcuts.length}
                onMove={(dir) => moveInArray('shortcuts', i, dir)}
                onRemove={() => removeFromArray('shortcuts', i)}
              />
            </Col>
          </Row>
        ))}
      </ArrayCard>

      <Card title={t.categoriesCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.categoriesField}</Text>}>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                value={form.categories}
                onChange={(v) => patch({ categories: v })}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                placeholder="utilities, productivity..."
              />
            </FormItem>
          </Col>
          <Col xs={24} lg={12}>
            <FormItem label={<Text code>{t.preferRelated}</Text>}>
              <Checkbox
                checked={form.prefer_related_applications}
                onChange={(e) => patch({ prefer_related_applications: e.target.checked })}
              >
                {t.preferRelated}
              </Checkbox>
            </FormItem>
          </Col>
        </Row>
      </Card>

      {validation.length > 0 && (
        <Alert
          type="error"
          showIcon
          message={t.validationTitle}
          description={validation.map((e, i) => (
            <div key={i}>{renderError(e)}</div>
          ))}
        />
      )}

      <Card
        title={t.outputCard}
        extra={
          <Space>
            <Checkbox checked={pretty} onChange={(e) => setPretty(e.target.checked)}>pretty print</Checkbox>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t.lineCount(lineCount)} · {t.byteCount(byteCount)}
            </Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copyJson}>{t.copy}</Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={downloadJson}>{t.download}</Button>
          </Space>
        }
      >
        <pre
          style={{
            margin: 0,
            overflowX: 'auto',
            background: '#0d1117',
            color: '#e6edf3',
            padding: 12,
            borderRadius: 8,
            maxHeight: 420,
            fontSize: 12.5,
            lineHeight: 1.6,
          }}
        >
          <code>{json || t.emptyOutput}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceCol,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 300 }}>
                  <code>{buildManifest.toString()}</code>
                </pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}

function FormItem({ label, children }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      {label}
      {children}
    </Space>
  )
}

function ArrayCard({ title, addLabel, onAdd, children }) {
  return (
    <Card
      title={title}
      extra={<Button size="small" icon={<PlusOutlined />} onClick={onAdd}>{addLabel}</Button>}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {children}
      </Space>
    </Card>
  )
}

function ArrayControls({ index, total, onMove, onRemove }) {
  return (
    <Space style={{ marginTop: 18 }}>
      <Button size="small" icon={<UpOutlined />} disabled={index === 0} onClick={() => onMove(-1)} />
      <Button size="small" icon={<DownOutlined />} disabled={index === total - 1} onClick={() => onMove(1)} />
      <Button size="small" danger icon={<DeleteOutlined />} onClick={onRemove} />
    </Space>
  )
}
