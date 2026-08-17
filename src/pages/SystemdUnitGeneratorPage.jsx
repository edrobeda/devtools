import React, { useMemo, useState } from 'react'
import {
  Typography,
  Card,
  Space,
  Input,
  Select,
  Switch,
  Button,
  Alert,
  Collapse,
  Row,
  Col,
  Segmented,
  message,
} from 'antd'
import {
  ContainerOutlined,
  CopyOutlined,
  CheckOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import {
  PRESETS,
  DEFAULTS,
  UNIT_TYPES,
  SERVICE_TYPES,
  RESTART_POLICIES,
  buildUnit,
  validateUnit,
} from '../utils/systemdUnitGenerator'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { Panel } = Collapse

const translations = {
  pt: {
    title: 'Gerador de Unidade systemd',
    intro: (
      <>
        Monte arquivos de unidade systemd (<Text code>.service</Text>,{' '}
        <Text code>.timer</Text>, <Text code>.socket</Text>, <Text code>.target</Text>,{' '}
        <Text code>.mount</Text>, <Text code>.automount</Text>) com as diretivas mais usadas.
        Tudo no navegador — nenhuma configuração sai da máquina.
      </>
    ),
    presetsTitle: 'Modelo',
    presetsHint: 'Escolha um ponto de partida e edite à vontade.',
    unitSection: 'Unidade',
    unitTypeLabel: 'Tipo de unidade',
    unitNameLabel: 'Nome do arquivo (sem extensão)',
    unitNameHint: 'myapp, backup, syncthing',
    descriptionLabel: 'Description',
    documentationLabel: 'Documentation (URL)',
    afterLabel: 'After',
    afterHint: 'network.target',
    wantsLabel: 'Wants',
    requiresLabel: 'Requires',
    serviceSection: 'Service',
    serviceTypeLabel: 'Type',
    execStartLabel: 'ExecStart',
    execStartHint: '/usr/bin/node /opt/app/server.js',
    execReloadLabel: 'ExecReload',
    execStopLabel: 'ExecStop',
    workingDirectoryLabel: 'WorkingDirectory',
    userLabel: 'User',
    groupLabel: 'Group',
    environmentLabel: 'Environment',
    environmentHint: 'KEY=value (uma por linha)',
    environmentFileLabel: 'EnvironmentFile',
    restartLabel: 'Restart',
    restartSecLabel: 'RestartSec (s)',
    startLimitIntervalSecLabel: 'StartLimitIntervalSec (s)',
    startLimitBurstLabel: 'StartLimitBurst',
    timeoutStartSecLabel: 'TimeoutStartSec (s)',
    timeoutStopSecLabel: 'TimeoutStopSec (s)',
    killSignalLabel: 'KillSignal',
    standardOutputLabel: 'StandardOutput',
    standardErrorLabel: 'StandardError',
    syslogIdentifierLabel: 'SyslogIdentifier',
    securitySection: 'Segurança',
    privateTmpLabel: 'PrivateTmp',
    noNewPrivilegesLabel: 'NoNewPrivileges',
    protectSystemLabel: 'ProtectSystem',
    protectSystemOptions: [
      { value: '', label: 'padrão' },
      { value: 'strict', label: 'strict' },
      { value: 'full', label: 'full' },
      { value: 'no', label: 'no' },
    ],
    protectHomeLabel: 'ProtectHome',
    timerSection: 'Timer',
    timerOnCalendarLabel: 'OnCalendar',
    timerOnCalendarHint: 'daily, Mon..Fri, *-*-* 09:00:00',
    timerOnBootSecLabel: 'OnBootSec',
    timerOnUnitActiveSecLabel: 'OnUnitActiveSec',
    timerOnUnitInactiveSecLabel: 'OnUnitInactiveSec',
    timerPersistentLabel: 'Persistent',
    timerAccuracySecLabel: 'AccuracySec',
    timerUnitLabel: 'Unit (serviço a disparar)',
    socketSection: 'Socket',
    socketListenStreamLabel: 'ListenStream',
    socketListenDatagramLabel: 'ListenDatagram',
    socketListenFIFOLabel: 'ListenFIFO',
    socketModeLabel: 'SocketMode',
    socketAcceptLabel: 'Accept',
    socketServiceLabel: 'Service',
    mountSection: 'Mount',
    mountWhatLabel: 'What',
    mountWhereLabel: 'Where',
    mountTypeLabel: 'Type',
    mountOptionsLabel: 'Options',
    automountSection: 'Automount',
    automountWhereLabel: 'Where',
    installSection: 'Install',
    wantedByLabel: 'WantedBy',
    wantedByHint: 'multi-user.target',
    requiredByLabel: 'RequiredBy',
    installAlsoLabel: 'Also',
    outTitle: 'Arquivo gerado',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    download: 'Baixar',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'linha' : 'linhas'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Avisos — confira antes de usar:',
    warningsNone: 'Nenhum aviso. Salve em /etc/systemd/system/ e rode systemctl daemon-reload.',
    wUnitName: 'Nome do arquivo vazio.',
    wDescription: 'Description vazia.',
    wExecStart: 'ExecStart vazio para um service.',
    wTimerTrigger: 'Pelo menos um gatilho de timer é necessário (OnCalendar, OnBootSec...).',
    wSocketListen: 'Pelo menos um ListenStream / ListenDatagram / ListenFIFO é necessário.',
    wMount: 'What e Where são obrigatórios para mount.',
    wAutomount: 'Where é obrigatório para automount.',
    tipTitle: 'Dicas de uso',
    tipBody: (
      <>
        O arquivo deve ser salvo em <Text code>/etc/systemd/system/&lt;nome&gt;.&lt;tipo&gt;</Text> (ou{' '}
        <Text code>~/.config/systemd/user/</Text> para serviços de usuário). Depois de editar, recarregue:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>
          {'sudo systemctl daemon-reload\nsudo systemctl enable --now <nome>.<tipo>'}
        </pre>
        Use <Text code>systemd-analyze verify</Text> para validar a sintaxe antes de ativar.
      </>
    ),
    howTitle: 'Como funciona — algoritmo-fonte',
    howDesc: 'O builder monta as seções [Unit], [Service]/[Timer]/[Socket]/[Mount]/[Automount] e [Install] linha a linha, incluindo apenas diretivas preenchidas, e avisa sobre campos obrigatórios vazios.',
  },
  en: {
    title: 'systemd Unit Generator',
    intro: (
      <>
        Build systemd unit files (<Text code>.service</Text>, <Text code>.timer</Text>,{' '}
        <Text code>.socket</Text>, <Text code>.target</Text>, <Text code>.mount</Text>,{' '}
        <Text code>.automount</Text>) with the most common directives. All in the browser — no
        configuration leaves the machine.
      </>
    ),
    presetsTitle: 'Template',
    presetsHint: 'Pick a starting point and edit freely.',
    unitSection: 'Unit',
    unitTypeLabel: 'Unit type',
    unitNameLabel: 'File name (without extension)',
    unitNameHint: 'myapp, backup, syncthing',
    descriptionLabel: 'Description',
    documentationLabel: 'Documentation (URL)',
    afterLabel: 'After',
    afterHint: 'network.target',
    wantsLabel: 'Wants',
    requiresLabel: 'Requires',
    serviceSection: 'Service',
    serviceTypeLabel: 'Type',
    execStartLabel: 'ExecStart',
    execStartHint: '/usr/bin/node /opt/app/server.js',
    execReloadLabel: 'ExecReload',
    execStopLabel: 'ExecStop',
    workingDirectoryLabel: 'WorkingDirectory',
    userLabel: 'User',
    groupLabel: 'Group',
    environmentLabel: 'Environment',
    environmentHint: 'KEY=value (one per line)',
    environmentFileLabel: 'EnvironmentFile',
    restartLabel: 'Restart',
    restartSecLabel: 'RestartSec (s)',
    startLimitIntervalSecLabel: 'StartLimitIntervalSec (s)',
    startLimitBurstLabel: 'StartLimitBurst',
    timeoutStartSecLabel: 'TimeoutStartSec (s)',
    timeoutStopSecLabel: 'TimeoutStopSec (s)',
    killSignalLabel: 'KillSignal',
    standardOutputLabel: 'StandardOutput',
    standardErrorLabel: 'StandardError',
    syslogIdentifierLabel: 'SyslogIdentifier',
    securitySection: 'Security',
    privateTmpLabel: 'PrivateTmp',
    noNewPrivilegesLabel: 'NoNewPrivileges',
    protectSystemLabel: 'ProtectSystem',
    protectSystemOptions: [
      { value: '', label: 'default' },
      { value: 'strict', label: 'strict' },
      { value: 'full', label: 'full' },
      { value: 'no', label: 'no' },
    ],
    protectHomeLabel: 'ProtectHome',
    timerSection: 'Timer',
    timerOnCalendarLabel: 'OnCalendar',
    timerOnCalendarHint: 'daily, Mon..Fri, *-*-* 09:00:00',
    timerOnBootSecLabel: 'OnBootSec',
    timerOnUnitActiveSecLabel: 'OnUnitActiveSec',
    timerOnUnitInactiveSecLabel: 'OnUnitInactiveSec',
    timerPersistentLabel: 'Persistent',
    timerAccuracySecLabel: 'AccuracySec',
    timerUnitLabel: 'Unit (service to trigger)',
    socketSection: 'Socket',
    socketListenStreamLabel: 'ListenStream',
    socketListenDatagramLabel: 'ListenDatagram',
    socketListenFIFOLabel: 'ListenFIFO',
    socketModeLabel: 'SocketMode',
    socketAcceptLabel: 'Accept',
    socketServiceLabel: 'Service',
    mountSection: 'Mount',
    mountWhatLabel: 'What',
    mountWhereLabel: 'Where',
    mountTypeLabel: 'Type',
    mountOptionsLabel: 'Options',
    automountSection: 'Automount',
    automountWhereLabel: 'Where',
    installSection: 'Install',
    wantedByLabel: 'WantedBy',
    wantedByHint: 'multi-user.target',
    requiredByLabel: 'RequiredBy',
    installAlsoLabel: 'Also',
    outTitle: 'Generated file',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    download: 'Download',
    stats: (lines, bytes) => `${lines} ${lines === 1 ? 'line' : 'lines'} · ${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`,
    warningsTitle: 'Warnings — review before using:',
    warningsNone: 'No warnings. Save to /etc/systemd/system/ and run systemctl daemon-reload.',
    wUnitName: 'File name is empty.',
    wDescription: 'Description is empty.',
    wExecStart: 'ExecStart is empty for a service.',
    wTimerTrigger: 'At least one timer trigger is required (OnCalendar, OnBootSec...).',
    wSocketListen: 'At least one ListenStream / ListenDatagram / ListenFIFO is required.',
    wMount: 'What and Where are required for mount units.',
    wAutomount: 'Where is required for automount units.',
    tipTitle: 'Usage tips',
    tipBody: (
      <>
        Save the file to <Text code>/etc/systemd/system/&lt;name&gt;.&lt;type&gt;</Text> (or{' '}
        <Text code>~/.config/systemd/user/</Text> for user services). After editing, reload:
        <pre style={{ margin: '8px 0', fontSize: 12, lineHeight: 1.6 }}>
          {'sudo systemctl daemon-reload\nsudo systemctl enable --now <name>.<type>'}
        </pre>
        Use <Text code>systemd-analyze verify</Text> to validate syntax before enabling.
      </>
    ),
    howTitle: 'How it works — source code',
    howDesc: 'The builder assembles [Unit], [Service]/[Timer]/[Socket]/[Mount]/[Automount] and [Install] sections line by line, including only filled directives, and warns about missing required fields.',
  },
}

export default function SystemdUnitGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [options, setOptions] = useState(DEFAULTS)
  const [copied, setCopied] = useState(false)

  const setField = (key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const presetKeys = useMemo(() => Object.keys(PRESETS), [])
  const presetOptions = useMemo(
    () => presetKeys.map((k) => ({ label: PRESETS[k].label[lang], value: k })),
    [presetKeys, lang]
  )

  const unitTypeOptions = useMemo(
    () => UNIT_TYPES.map((u) => ({ label: u[lang], value: u.value })),
    [lang]
  )

  const serviceTypeOptions = useMemo(
    () => SERVICE_TYPES.map((s) => ({ label: s.label[lang], value: s.value })),
    [lang]
  )

  const restartOptions = useMemo(
    () => RESTART_POLICIES.map((r) => ({ label: r.label[lang], value: r.value })),
    [lang]
  )

  const protectSystemOptions = useMemo(
    () => t.protectSystemOptions,
    [t]
  )

  const output = useMemo(() => {
    const { text, fileName } = buildUnit(options)
    const warnings = validateUnit(options, t)
    const lines = text ? text.split('\n').length : 0
    const bytes = new TextEncoder().encode(text).length
    return { text, fileName, warnings, lines, bytes }
  }, [options, t])

  const copy = () => {
    navigator.clipboard.writeText(output.text).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => message.error(t.copyErr)
    )
  }

  const download = () => {
    const blob = new Blob([output.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = output.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const type = options.unitType
  const showService = type === 'service'
  const showTimer = type === 'timer'
  const showSocket = type === 'socket'
  const showMount = type === 'mount'
  const showAutomount = type === 'automount'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card title={t.presetsTitle}>
        <Paragraph type="secondary">{t.presetsHint}</Paragraph>
        <Segmented
          options={presetOptions}
          value={presetKeys.find((k) => PRESETS[k] === options) || 'custom'}
          onChange={(k) => setOptions({ ...PRESETS[k] })}
        />
      </Card>

      <Card title={t.unitSection}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.unitTypeLabel}</Text>
              <Select
                value={options.unitType}
                options={unitTypeOptions}
                onChange={(v) => setField('unitType', v)}
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.unitNameLabel}</Text>
              <Input
                value={options.unitName}
                onChange={(e) => setField('unitName', e.target.value)}
                placeholder={t.unitNameHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.descriptionLabel}</Text>
              <Input
                value={options.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.documentationLabel}</Text>
              <Input
                value={options.documentation}
                onChange={(e) => setField('documentation', e.target.value)}
              />
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.afterLabel}</Text>
              <Input
                value={options.after}
                onChange={(e) => setField('after', e.target.value)}
                placeholder={t.afterHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.wantsLabel}</Text>
              <Input
                value={options.wants}
                onChange={(e) => setField('wants', e.target.value)}
              />
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.requiresLabel}</Text>
              <Input
                value={options.requires}
                onChange={(e) => setField('requires', e.target.value)}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {showService && (
        <Card title={t.serviceSection}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.serviceTypeLabel}</Text>
                <Select
                  value={options.serviceType}
                  options={serviceTypeOptions}
                  onChange={(v) => setField('serviceType', v)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={16}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.execStartLabel}</Text>
                <Input
                  value={options.execStart}
                  onChange={(e) => setField('execStart', e.target.value)}
                  placeholder={t.execStartHint}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.execReloadLabel}</Text>
                <Input
                  value={options.execReload}
                  onChange={(e) => setField('execReload', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.execStopLabel}</Text>
                <Input
                  value={options.execStop}
                  onChange={(e) => setField('execStop', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.workingDirectoryLabel}</Text>
                <Input
                  value={options.workingDirectory}
                  onChange={(e) => setField('workingDirectory', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={6}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.userLabel}</Text>
                <Input
                  value={options.user}
                  onChange={(e) => setField('user', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={6}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.groupLabel}</Text>
                <Input
                  value={options.group}
                  onChange={(e) => setField('group', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.environmentLabel}</Text>
                <TextArea
                  rows={3}
                  value={options.environment}
                  onChange={(e) => setField('environment', e.target.value)}
                  placeholder={t.environmentHint}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.environmentFileLabel}</Text>
                <Input
                  value={options.environmentFile}
                  onChange={(e) => setField('environmentFile', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.restartLabel}</Text>
                <Select
                  value={options.restart}
                  options={restartOptions}
                  onChange={(v) => setField('restart', v)}
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.restartSecLabel}</Text>
                <Input
                  type="number"
                  min={0}
                  value={options.restartSec}
                  onChange={(e) => setField('restartSec', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.startLimitIntervalSecLabel}</Text>
                <Input
                  type="number"
                  min={0}
                  value={options.startLimitIntervalSec}
                  onChange={(e) => setField('startLimitIntervalSec', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.startLimitBurstLabel}</Text>
                <Input
                  type="number"
                  min={1}
                  value={options.startLimitBurst}
                  onChange={(e) => setField('startLimitBurst', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.timeoutStartSecLabel}</Text>
                <Input
                  type="number"
                  min={0}
                  value={options.timeoutStartSec}
                  onChange={(e) => setField('timeoutStartSec', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.timeoutStopSecLabel}</Text>
                <Input
                  type="number"
                  min={0}
                  value={options.timeoutStopSec}
                  onChange={(e) => setField('timeoutStopSec', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.killSignalLabel}</Text>
                <Input
                  value={options.killSignal}
                  onChange={(e) => setField('killSignal', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.standardOutputLabel}</Text>
                <Input
                  value={options.standardOutput}
                  onChange={(e) => setField('standardOutput', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.standardErrorLabel}</Text>
                <Input
                  value={options.standardError}
                  onChange={(e) => setField('standardError', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.syslogIdentifierLabel}</Text>
                <Input
                  value={options.syslogIdentifier}
                  onChange={(e) => setField('syslogIdentifier', e.target.value)}
                />
              </Space>
            </Col>
          </Row>

          <Card title={t.securitySection} size="small" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Space>
                  <Switch
                    checked={options.privateTmp}
                    onChange={(v) => setField('privateTmp', v)}
                  />
                  <Text>{t.privateTmpLabel}</Text>
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space>
                  <Switch
                    checked={options.noNewPrivileges}
                    onChange={(v) => setField('noNewPrivileges', v)}
                  />
                  <Text>{t.noNewPrivilegesLabel}</Text>
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space>
                  <Switch
                    checked={options.protectHome}
                    onChange={(v) => setField('protectHome', v)}
                  />
                  <Text>{t.protectHomeLabel}</Text>
                </Space>
              </Col>
              <Col xs={24} sm={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>{t.protectSystemLabel}</Text>
                  <Select
                    value={options.protectSystem}
                    options={protectSystemOptions}
                    onChange={(v) => setField('protectSystem', v)}
                    style={{ width: '100%' }}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </Card>
      )}

      {showTimer && (
        <Card title={t.timerSection}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.timerOnCalendarLabel}</Text>
                <Input
                  value={options.timerOnCalendar}
                  onChange={(e) => setField('timerOnCalendar', e.target.value)}
                  placeholder={t.timerOnCalendarHint}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.timerUnitLabel}</Text>
                <Input
                  value={options.timerUnit}
                  onChange={(e) => setField('timerUnit', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.timerOnBootSecLabel}</Text>
                <Input
                  value={options.timerOnBootSec}
                  onChange={(e) => setField('timerOnBootSec', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.timerOnUnitActiveSecLabel}</Text>
                <Input
                  value={options.timerOnUnitActiveSec}
                  onChange={(e) => setField('timerOnUnitActiveSec', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.timerOnUnitInactiveSecLabel}</Text>
                <Input
                  value={options.timerOnUnitInactiveSec}
                  onChange={(e) => setField('timerOnUnitInactiveSec', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.timerAccuracySecLabel}</Text>
                <Input
                  value={options.timerAccuracySec}
                  onChange={(e) => setField('timerAccuracySec', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space>
                <Switch
                  checked={options.timerPersistent}
                  onChange={(v) => setField('timerPersistent', v)}
                />
                <Text>{t.timerPersistentLabel}</Text>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {showSocket && (
        <Card title={t.socketSection}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.socketListenStreamLabel}</Text>
                <Input
                  value={options.socketListenStream}
                  onChange={(e) => setField('socketListenStream', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.socketListenDatagramLabel}</Text>
                <Input
                  value={options.socketListenDatagram}
                  onChange={(e) => setField('socketListenDatagram', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.socketListenFIFOLabel}</Text>
                <Input
                  value={options.socketListenFIFO}
                  onChange={(e) => setField('socketListenFIFO', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.socketModeLabel}</Text>
                <Input
                  value={options.socketMode}
                  onChange={(e) => setField('socketMode', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.socketServiceLabel}</Text>
                <Input
                  value={options.socketService}
                  onChange={(e) => setField('socketService', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={8}>
              <Space>
                <Switch
                  checked={options.socketAccept}
                  onChange={(v) => setField('socketAccept', v)}
                />
                <Text>{t.socketAcceptLabel}</Text>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {showMount && (
        <Card title={t.mountSection}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.mountWhatLabel}</Text>
                <Input
                  value={options.mountWhat}
                  onChange={(e) => setField('mountWhat', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.mountWhereLabel}</Text>
                <Input
                  value={options.mountWhere}
                  onChange={(e) => setField('mountWhere', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.mountTypeLabel}</Text>
                <Input
                  value={options.mountType}
                  onChange={(e) => setField('mountType', e.target.value)}
                />
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.mountOptionsLabel}</Text>
                <Input
                  value={options.mountOptions}
                  onChange={(e) => setField('mountOptions', e.target.value)}
                />
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {showAutomount && (
        <Card title={t.automountSection}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{t.automountWhereLabel}</Text>
                <Input
                  value={options.automountWhere}
                  onChange={(e) => setField('automountWhere', e.target.value)}
                />
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      <Card title={t.installSection}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.wantedByLabel}</Text>
              <Input
                value={options.wantedBy}
                onChange={(e) => setField('wantedBy', e.target.value)}
                placeholder={t.wantedByHint}
              />
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.requiredByLabel}</Text>
              <Input
                value={options.requiredBy}
                onChange={(e) => setField('requiredBy', e.target.value)}
              />
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{t.installAlsoLabel}</Text>
              <Input
                value={options.installAlso}
                onChange={(e) => setField('installAlso', e.target.value)}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            {t.outTitle}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {output.fileName}
            </Text>
          </Space>
        }
      >
        {output.warnings.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={t.warningsTitle}
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {output.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            }
            style={{ marginBottom: 16 }}
          />
        )}
        {output.warnings.length === 0 && (
          <Alert
            type="info"
            showIcon
            message={t.warningsNone}
            style={{ marginBottom: 16 }}
          />
        )}
        <TextArea
          readOnly
          value={output.text}
          rows={14}
          style={{ fontFamily: 'monospace', marginBottom: 12 }}
        />
        <Space wrap>
          <Button
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={copy}
          >
            {copied ? t.copied : t.copy}
          </Button>
          <Button icon={<DownloadOutlined />} onClick={download}>
            {t.download}
          </Button>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t.stats(output.lines, output.bytes)}
          </Text>
        </Space>
      </Card>

      <Card title={t.tipTitle}>
        <Paragraph style={{ marginBottom: 0 }}>{t.tipBody}</Paragraph>
      </Card>

      <Collapse>
        <Panel header={t.howTitle} key="source">
          <Paragraph>{t.howDesc}</Paragraph>
          <pre style={{ margin: 0, overflowX: 'auto' }}>
            <code>{buildUnit.toString() + '\n\n' + validateUnit.toString()}</code>
          </pre>
        </Panel>
      </Collapse>
    </Space>
  )
}
