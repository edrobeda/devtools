import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Button,
  Input,
  Select,
  Segmented,
  Checkbox,
  Tabs,
  Row,
  Col,
  Tag,
  Divider,
  message,
} from 'antd'
import {
  FileTextOutlined,
  FileMarkdownOutlined,
  CopyOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { markdownToHtml } from '../utils/markdownParser'
import {
  EMPTY_CONFIG,
  LICENSES,
  PACKAGE_MANAGERS,
  CODE_LANGS,
  TEMPLATE_PRESETS,
  buildReadme,
} from '../utils/readmeGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const MONO = { fontFamily: 'monospace' }

function cloneDefault() {
  return {
    ...EMPTY_CONFIG,
    sections: { ...EMPTY_CONFIG.sections },
    badges: { ...EMPTY_CONFIG.badges },
  }
}

const translations = {
  pt: {
    title: 'Gerador de README',
    intro: (
      <>
        Monte um <Text code>README.md</Text> completo preenchendo um formulário
        e veja o Markdown e o preview renderizado em tempo real. Sem conta, sem
        backend: tudo roda no seu navegador e nada é enviado pra lugar nenhum.
        Os badges usam shields.io (só viram imagem quando você colar o README
        no GitHub/GitLab).
      </>
    ),
    projectCard: 'Projeto',
    template: 'Modelo',
    templateMinimal: 'Mínimo',
    templateStandard: 'Padrão',
    templateLibrary: 'Biblioteca',
    templateOpensource: 'Open Source',
    outputLang: 'Idioma do README',
    name: 'Nome do projeto',
    namePh: 'ex.: devtools',
    tagline: 'Descrição curta',
    taglinePh: 'Uma linha explicando o que o projeto faz',
    repoUrl: 'URL do repositório',
    repoUrlPh: 'https://github.com/usuario/projeto',
    homepage: 'Site / demo (opcional)',
    homepagePh: 'https://meuprojeto.dev',
    author: 'Autor',
    authorPh: 'Seu nome',
    contact: 'Contato (opcional)',
    contactPh: 'email ou @usuario',
    license: 'Licença',
    pm: 'Gerenciador de pacotes',
    packageName: 'Nome do pacote (npm)',
    packageNamePh: 'ex.: devtools-cli',
    badgesTitle: 'Badges (shields.io)',
    badgeHintGh: 'Precisa de uma URL de repositório do GitHub.',
    badge: {
      build: 'Build (GitHub Actions)',
      license: 'Licença',
      npm: 'Versão npm',
      coverage: 'Cobertura',
      issues: 'Issues',
      prs: 'Pull Requests',
      stars: 'Stars',
      lastCommit: 'Último commit',
    },
    sectionsTitle: 'Seções do README',
    include: 'Incluir esta seção',
    usageLang: 'Linguagem do bloco de código',
    section: {
      features: 'Funcionalidades',
      stack: 'Stack',
      prerequisites: 'Pré-requisitos',
      install: 'Instalação',
      usage: 'Uso',
      structure: 'Estrutura do projeto',
      scripts: 'Scripts disponíveis',
      testing: 'Testes',
      roadmap: 'Roadmap',
      contributing: 'Contribuindo',
      license: 'Licença',
      author: 'Contato',
    },
    ph: {
      features: 'Uma funcionalidade por linha',
      stack: 'Uma tecnologia por linha',
      prerequisites: 'Node.js 20+\nDocker',
      install: 'Comandos extras no bloco de instalação (uma linha cada)',
      usage: '# cole aqui um exemplo de uso real',
      structure: 'src/\n  index.js\npackage.json',
      scripts: 'dev: inicia em modo watch\ntest: roda os testes',
      testing: 'npm test',
      roadmap: 'Uma ideia por linha',
      contributing:
        'Abra uma issue antes de um PR grande. Rode os testes antes de enviar.',
    },
    installNote: 'A clonagem, o `cd` e o `install` são gerados automaticamente.',
    previewTitle: 'Preview',
    readmeTitle: 'README.md',
    copy: 'Copiar Markdown',
    copied: 'Markdown copiado',
    download: 'Baixar README.md',
    reset: 'Limpar',
    resetConfirm: 'Formulário limpo',
    empty: 'Preencha o nome do projeto (ou qualquer campo) para o README aparecer aqui.',
  },
  en: {
    title: 'README Generator',
    intro: (
      <>
        Build a complete <Text code>README.md</Text> by filling in a form and
        watch the Markdown and the rendered preview update live. No account, no
        backend: everything runs in your browser and nothing is uploaded. Badges
        use shields.io (they only turn into images once you paste the README into
        GitHub/GitLab).
      </>
    ),
    projectCard: 'Project',
    template: 'Template',
    templateMinimal: 'Minimal',
    templateStandard: 'Standard',
    templateLibrary: 'Library',
    templateOpensource: 'Open Source',
    outputLang: 'README language',
    name: 'Project name',
    namePh: 'e.g. devtools',
    tagline: 'Short description',
    taglinePh: 'One line explaining what the project does',
    repoUrl: 'Repository URL',
    repoUrlPh: 'https://github.com/user/project',
    homepage: 'Site / demo (optional)',
    homepagePh: 'https://myproject.dev',
    author: 'Author',
    authorPh: 'Your name',
    contact: 'Contact (optional)',
    contactPh: 'email or @user',
    license: 'License',
    pm: 'Package manager',
    packageName: 'Package name (npm)',
    packageNamePh: 'e.g. devtools-cli',
    badgesTitle: 'Badges (shields.io)',
    badgeHintGh: 'Requires a GitHub repository URL.',
    badge: {
      build: 'Build (GitHub Actions)',
      license: 'License',
      npm: 'npm version',
      coverage: 'Coverage',
      issues: 'Issues',
      prs: 'Pull Requests',
      stars: 'Stars',
      lastCommit: 'Last commit',
    },
    sectionsTitle: 'README sections',
    include: 'Include this section',
    usageLang: 'Code block language',
    section: {
      features: 'Features',
      stack: 'Tech Stack',
      prerequisites: 'Prerequisites',
      install: 'Installation',
      usage: 'Usage',
      structure: 'Project Structure',
      scripts: 'Available Scripts',
      testing: 'Testing',
      roadmap: 'Roadmap',
      contributing: 'Contributing',
      license: 'License',
      author: 'Contact',
    },
    ph: {
      features: 'One feature per line',
      stack: 'One technology per line',
      prerequisites: 'Node.js 20+\nDocker',
      install: 'Extra commands inside the install block (one per line)',
      usage: '# paste a real usage example here',
      structure: 'src/\n  index.js\npackage.json',
      scripts: 'dev: start in watch mode\ntest: run the tests',
      testing: 'npm test',
      roadmap: 'One idea per line',
      contributing:
        'Open an issue before a large PR. Run the tests before submitting.',
    },
    installNote: 'The clone, `cd` and `install` commands are generated for you.',
    previewTitle: 'Preview',
    readmeTitle: 'README.md',
    copy: 'Copy Markdown',
    copied: 'Markdown copied',
    download: 'Download README.md',
    reset: 'Clear',
    resetConfirm: 'Form cleared',
    empty: 'Fill in the project name (or any field) to see the README here.',
  },
}

export default function ReadmeGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [cfg, setCfg] = useState(cloneDefault)

  const md = useMemo(() => buildReadme(cfg), [cfg])
  const html = useMemo(() => markdownToHtml(md), [md])

  const set = (key, value) => setCfg((c) => ({ ...c, [key]: value }))
  const setSection = (key, value) =>
    setCfg((c) => ({ ...c, sections: { ...c.sections, [key]: value } }))
  const setBadge = (key, value) =>
    setCfg((c) => ({ ...c, badges: { ...c.badges, [key]: value } }))

  function applyTemplate(key) {
    const preset = TEMPLATE_PRESETS[key]
    setCfg((c) => {
      const sections = { ...c.sections }
      Object.keys(sections).forEach((k) => {
        sections[k] = preset.sections.includes(k)
      })
      const badges = {}
      Object.keys(c.badges).forEach((k) => {
        badges[k] = preset.badges.includes(k)
      })
      return { ...c, template: key, sections, badges, usageLang: preset.usageLang }
    })
  }

  function handleCopy() {
    navigator.clipboard.writeText(md)
    message.success(t.copied)
  }

  function handleDownload() {
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'README.md'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleReset() {
    setCfg(cloneDefault())
    message.success(t.resetConfirm)
  }

  function sectionBody(key, control) {
    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Checkbox checked={cfg.sections[key]} onChange={(e) => setSection(key, e.target.checked)}>
          {t.include}
        </Checkbox>
        {cfg.sections[key] && control}
      </Space>
    )
  }

  const sections = [
    {
      key: 'features',
      children: sectionBody(
        'features',
        <TextArea rows={4} style={MONO} value={cfg.features} placeholder={t.ph.features} onChange={(e) => set('features', e.target.value)} />,
      ),
    },
    {
      key: 'stack',
      children: sectionBody(
        'stack',
        <TextArea rows={4} style={MONO} value={cfg.stack} placeholder={t.ph.stack} onChange={(e) => set('stack', e.target.value)} />,
      ),
    },
    {
      key: 'prerequisites',
      children: sectionBody(
        'prerequisites',
        <TextArea rows={4} style={MONO} value={cfg.prerequisites} placeholder={t.ph.prerequisites} onChange={(e) => set('prerequisites', e.target.value)} />,
      ),
    },
    {
      key: 'install',
      children: sectionBody(
        'install',
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text type="secondary">{t.installNote}</Text>
          <TextArea rows={3} style={MONO} value={cfg.install} placeholder={t.ph.install} onChange={(e) => set('install', e.target.value)} />
        </Space>,
      ),
    },
    {
      key: 'usage',
      children: sectionBody(
        'usage',
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Select
            value={cfg.usageLang}
            style={{ width: 180 }}
            onChange={(v) => set('usageLang', v)}
            options={CODE_LANGS.map((v) => ({ value: v, label: v }))}
          />
          <TextArea rows={5} style={MONO} value={cfg.usage} placeholder={t.ph.usage} onChange={(e) => set('usage', e.target.value)} />
        </Space>,
      ),
    },
    {
      key: 'structure',
      children: sectionBody(
        'structure',
        <TextArea rows={5} style={MONO} value={cfg.structure} placeholder={t.ph.structure} onChange={(e) => set('structure', e.target.value)} />,
      ),
    },
    {
      key: 'scripts',
      children: sectionBody(
        'scripts',
        <TextArea rows={4} style={MONO} value={cfg.scripts} placeholder={t.ph.scripts} onChange={(e) => set('scripts', e.target.value)} />,
      ),
    },
    {
      key: 'testing',
      children: sectionBody(
        'testing',
        <TextArea rows={3} style={MONO} value={cfg.testing} placeholder={t.ph.testing} onChange={(e) => set('testing', e.target.value)} />,
      ),
    },
    {
      key: 'roadmap',
      children: sectionBody(
        'roadmap',
        <TextArea rows={4} style={MONO} value={cfg.roadmap} placeholder={t.ph.roadmap} onChange={(e) => set('roadmap', e.target.value)} />,
      ),
    },
    {
      key: 'contributing',
      children: sectionBody(
        'contributing',
        <TextArea rows={4} value={cfg.contributing} placeholder={t.ph.contributing} onChange={(e) => set('contributing', e.target.value)} />,
      ),
    },
    {
      key: 'license',
      children: sectionBody('license', null),
    },
    {
      key: 'author',
      children: sectionBody('author', null),
    },
  ].map((s) => ({ ...s, label: t.section[s.key] }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><FileTextOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.projectCard}>
        <Row gutter={[16, 12]}>
          <Col xs={24} md={12}>
            <Text strong>{t.template}</Text>
            <div style={{ marginTop: 8 }}>
              <Segmented
                value={cfg.template}
                onChange={applyTemplate}
                options={[
                  { value: 'minimal', label: t.templateMinimal },
                  { value: 'standard', label: t.templateStandard },
                  { value: 'library', label: t.templateLibrary },
                  { value: 'opensource', label: t.templateOpensource },
                ]}
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Text strong>{t.outputLang}</Text>
            <div style={{ marginTop: 8 }}>
              <Segmented
                value={cfg.lang}
                onChange={(v) => set('lang', v)}
                options={[
                  { value: 'pt', label: 'PT' },
                  { value: 'en', label: 'EN' },
                  { value: 'es', label: 'ES' },
                ]}
              />
            </div>
          </Col>

          <Col xs={24} md={12}>
            <Text strong>{t.name}</Text>
            <Input style={{ marginTop: 8 }} value={cfg.name} placeholder={t.namePh} onChange={(e) => set('name', e.target.value)} />
          </Col>
          <Col xs={24} md={12}>
            <Text strong>{t.tagline}</Text>
            <Input style={{ marginTop: 8 }} value={cfg.tagline} placeholder={t.taglinePh} onChange={(e) => set('tagline', e.target.value)} />
          </Col>

          <Col xs={24} md={12}>
            <Text strong>{t.repoUrl}</Text>
            <Input style={{ marginTop: 8 }} value={cfg.repoUrl} placeholder={t.repoUrlPh} onChange={(e) => set('repoUrl', e.target.value)} />
          </Col>
          <Col xs={24} md={12}>
            <Text strong>{t.homepage}</Text>
            <Input style={{ marginTop: 8 }} value={cfg.homepage} placeholder={t.homepagePh} onChange={(e) => set('homepage', e.target.value)} />
          </Col>

          <Col xs={24} md={12}>
            <Text strong>{t.author}</Text>
            <Input style={{ marginTop: 8 }} value={cfg.author} placeholder={t.authorPh} onChange={(e) => set('author', e.target.value)} />
          </Col>
          <Col xs={24} md={12}>
            <Text strong>{t.contact}</Text>
            <Input style={{ marginTop: 8 }} value={cfg.contact} placeholder={t.contactPh} onChange={(e) => set('contact', e.target.value)} />
          </Col>

          <Col xs={24} md={8}>
            <Text strong>{t.license}</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={cfg.license}
              onChange={(v) => set('license', v)}
              options={LICENSES.map((v) => ({ value: v, label: v === 'none' ? '—' : v }))}
            />
          </Col>
          <Col xs={24} md={8}>
            <Text strong>{t.pm}</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={cfg.pm}
              onChange={(v) => set('pm', v)}
              options={Object.keys(PACKAGE_MANAGERS).map((v) => ({ value: v, label: v }))}
            />
          </Col>
          <Col xs={24} md={8}>
            <Text strong>{t.packageName}</Text>
            <Input style={{ marginTop: 8 }} value={cfg.packageName} placeholder={t.packageNamePh} onChange={(e) => set('packageName', e.target.value)} />
          </Col>
        </Row>

        <Divider style={{ margin: '16px 0' }} />

        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space wrap>
            <Text strong>{t.badgesTitle}</Text>
            <Tag color="default">shields.io</Tag>
          </Space>
          <Text type="secondary">{t.badgeHintGh}</Text>
          <Checkbox.Group
            style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}
            value={Object.keys(cfg.badges).filter((k) => cfg.badges[k])}
            onChange={(values) => {
              Object.keys(cfg.badges).forEach((k) => setBadge(k, values.includes(k)))
            }}
            options={Object.keys(cfg.badges).map((k) => ({ value: k, label: t.badge[k] }))}
          />
        </Space>
      </Card>

      <Card
        title={t.sectionsTitle}
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>{t.reset}</Button>}
      >
        <Tabs items={sections} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t.previewTitle} style={{ height: '100%' }}>
            {cfg.name || cfg.tagline ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <Text type="secondary">{t.empty}</Text>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={t.readmeTitle}
            extra={
              <Space>
                <Button size="small" icon={<CopyOutlined />} onClick={handleCopy}>{t.copy}</Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload}>{t.download}</Button>
              </Space>
            }
          >
            <pre style={{ margin: 0, maxHeight: 420, overflow: 'auto' }}>
              <code>{md}</code>
            </pre>
          </Card>
        </Col>
      </Row>
    </Space>
  )
}
