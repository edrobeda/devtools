// Gerador de arquivos de unidade systemd — 100% client-side.
// Monta .service, .timer, .socket, .target, .mount ou .automount a partir
// de campos de formulário, incluindo apenas diretivas preenchidas e emitindo
// avisos sobre campos obrigatórios vazios.

export const UNIT_TYPES = [
  { value: 'service', pt: 'Service (.service)', en: 'Service (.service)' },
  { value: 'timer', pt: 'Timer (.timer)', en: 'Timer (.timer)' },
  { value: 'socket', pt: 'Socket (.socket)', en: 'Socket (.socket)' },
  { value: 'target', pt: 'Target (.target)', en: 'Target (.target)' },
  { value: 'mount', pt: 'Mount (.mount)', en: 'Mount (.mount)' },
  { value: 'automount', pt: 'Automount (.automount)', en: 'Automount (.automount)' },
]

export const SERVICE_TYPES = [
  { value: '', label: { pt: 'padrão (simple)', en: 'default (simple)' } },
  { value: 'simple', label: { pt: 'simple', en: 'simple' } },
  { value: 'forking', label: { pt: 'forking', en: 'forking' } },
  { value: 'oneshot', label: { pt: 'oneshot', en: 'oneshot' } },
  { value: 'dbus', label: { pt: 'dbus', en: 'dbus' } },
  { value: 'notify', label: { pt: 'notify', en: 'notify' } },
  { value: 'idle', label: { pt: 'idle', en: 'idle' } },
]

export const RESTART_POLICIES = [
  { value: '', label: { pt: 'nenhum', en: 'none' } },
  { value: 'no', label: { pt: 'no', en: 'no' } },
  { value: 'on-success', label: { pt: 'on-success', en: 'on-success' } },
  { value: 'on-failure', label: { pt: 'on-failure', en: 'on-failure' } },
  { value: 'on-abnormal', label: { pt: 'on-abnormal', en: 'on-abnormal' } },
  { value: 'on-watchdog', label: { pt: 'on-watchdog', en: 'on-watchdog' } },
  { value: 'always', label: { pt: 'always', en: 'always' } },
]

export const PRESETS = {
  webapp: {
    label: { pt: 'App web (Node/Python)', en: 'Web app (Node/Python)' },
    unitType: 'service',
    unitName: 'myapp',
    description: 'My web application',
    documentation: 'https://example.com/docs',
    after: 'network.target',
    wants: '',
    requires: '',
    serviceType: '',
    execStart: '/usr/bin/node /opt/myapp/server.js',
    execReload: '/bin/kill -HUP $MAINPID',
    execStop: '',
    workingDirectory: '/opt/myapp',
    user: 'myapp',
    group: 'myapp',
    environment: 'NODE_ENV=production\nPORT=3000',
    environmentFile: '',
    restart: 'on-failure',
    restartSec: 5,
    startLimitIntervalSec: 60,
    startLimitBurst: 3,
    timeoutStartSec: '',
    timeoutStopSec: '',
    killSignal: '',
    standardOutput: 'journal',
    standardError: 'journal',
    syslogIdentifier: 'myapp',
    privateTmp: true,
    noNewPrivileges: true,
    protectSystem: 'strict',
    protectHome: true,
    wantedBy: 'multi-user.target',
    requiredBy: '',
    installAlso: '',
    timerOnCalendar: '',
    timerOnBootSec: '',
    timerOnUnitActiveSec: '',
    timerOnUnitInactiveSec: '',
    timerPersistent: false,
    timerAccuracySec: '',
    timerUnit: '',
    socketListenStream: '',
    socketListenDatagram: '',
    socketListenFIFO: '',
    socketMode: '',
    socketAccept: false,
    socketService: '',
    mountWhat: '',
    mountWhere: '',
    mountType: '',
    mountOptions: '',
    automountWhere: '',
  },
  backup: {
    label: { pt: 'Backup agendado (service + timer)', en: 'Scheduled backup (service + timer)' },
    unitType: 'service',
    unitName: 'backup',
    description: 'Daily backup job',
    documentation: '',
    after: 'network.target',
    wants: '',
    requires: '',
    serviceType: 'oneshot',
    execStart: '/opt/scripts/backup.sh',
    execReload: '',
    execStop: '',
    workingDirectory: '/opt/scripts',
    user: 'root',
    group: 'root',
    environment: '',
    environmentFile: '',
    restart: 'no',
    restartSec: '',
    startLimitIntervalSec: '',
    startLimitBurst: '',
    timeoutStartSec: '',
    timeoutStopSec: '',
    killSignal: '',
    standardOutput: 'journal',
    standardError: 'journal',
    syslogIdentifier: 'backup',
    privateTmp: false,
    noNewPrivileges: true,
    protectSystem: 'strict',
    protectHome: true,
    wantedBy: '',
    requiredBy: '',
    installAlso: 'backup.timer',
    timerOnCalendar: 'daily',
    timerOnBootSec: '',
    timerOnUnitActiveSec: '',
    timerOnUnitInactiveSec: '',
    timerPersistent: true,
    timerAccuracySec: '1h',
    timerUnit: '',
    socketListenStream: '',
    socketListenDatagram: '',
    socketListenFIFO: '',
    socketMode: '',
    socketAccept: false,
    socketService: '',
    mountWhat: '',
    mountWhere: '',
    mountType: '',
    mountOptions: '',
    automountWhere: '',
  },
  user: {
    label: { pt: 'Serviço de usuário', en: 'User service' },
    unitType: 'service',
    unitName: 'syncthing',
    description: 'Syncthing user service',
    documentation: '',
    after: 'network.target',
    wants: '',
    requires: '',
    serviceType: '',
    execStart: '/usr/bin/syncthing -no-browser',
    execReload: '',
    execStop: '',
    workingDirectory: '',
    user: '',
    group: '',
    environment: '',
    environmentFile: '',
    restart: 'on-failure',
    restartSec: 5,
    startLimitIntervalSec: '',
    startLimitBurst: '',
    timeoutStartSec: '',
    timeoutStopSec: '',
    killSignal: '',
    standardOutput: 'journal',
    standardError: 'journal',
    syslogIdentifier: 'syncthing',
    privateTmp: true,
    noNewPrivileges: true,
    protectSystem: '',
    protectHome: true,
    wantedBy: 'default.target',
    requiredBy: '',
    installAlso: '',
    timerOnCalendar: '',
    timerOnBootSec: '',
    timerOnUnitActiveSec: '',
    timerOnUnitInactiveSec: '',
    timerPersistent: false,
    timerAccuracySec: '',
    timerUnit: '',
    socketListenStream: '',
    socketListenDatagram: '',
    socketListenFIFO: '',
    socketMode: '',
    socketAccept: false,
    socketService: '',
    mountWhat: '',
    mountWhere: '',
    mountType: '',
    mountOptions: '',
    automountWhere: '',
  },
  socket: {
    label: { pt: 'Socket-activation', en: 'Socket activation' },
    unitType: 'socket',
    unitName: 'myapp',
    description: 'My app socket',
    documentation: '',
    after: 'network.target',
    wants: '',
    requires: '',
    serviceType: '',
    execStart: '',
    execReload: '',
    execStop: '',
    workingDirectory: '',
    user: '',
    group: '',
    environment: '',
    environmentFile: '',
    restart: '',
    restartSec: '',
    startLimitIntervalSec: '',
    startLimitBurst: '',
    timeoutStartSec: '',
    timeoutStopSec: '',
    killSignal: '',
    standardOutput: '',
    standardError: '',
    syslogIdentifier: '',
    privateTmp: false,
    noNewPrivileges: false,
    protectSystem: '',
    protectHome: false,
    wantedBy: 'sockets.target',
    requiredBy: '',
    installAlso: 'myapp.service',
    timerOnCalendar: '',
    timerOnBootSec: '',
    timerOnUnitActiveSec: '',
    timerOnUnitInactiveSec: '',
    timerPersistent: false,
    timerAccuracySec: '',
    timerUnit: '',
    socketListenStream: '127.0.0.1:8080',
    socketListenDatagram: '',
    socketListenFIFO: '',
    socketMode: '0666',
    socketAccept: false,
    socketService: '',
    mountWhat: '',
    mountWhere: '',
    mountType: '',
    mountOptions: '',
    automountWhere: '',
  },
  mount: {
    label: { pt: 'Mount (.mount)', en: 'Mount (.mount)' },
    unitType: 'mount',
    unitName: 'data',
    description: 'Mount data partition',
    documentation: '',
    after: 'local-fs.target',
    wants: '',
    requires: '',
    serviceType: '',
    execStart: '',
    execReload: '',
    execStop: '',
    workingDirectory: '',
    user: '',
    group: '',
    environment: '',
    environmentFile: '',
    restart: '',
    restartSec: '',
    startLimitIntervalSec: '',
    startLimitBurst: '',
    timeoutStartSec: '',
    timeoutStopSec: '',
    killSignal: '',
    standardOutput: '',
    standardError: '',
    syslogIdentifier: '',
    privateTmp: false,
    noNewPrivileges: false,
    protectSystem: '',
    protectHome: false,
    wantedBy: 'local-fs.target',
    requiredBy: '',
    installAlso: '',
    timerOnCalendar: '',
    timerOnBootSec: '',
    timerOnUnitActiveSec: '',
    timerOnUnitInactiveSec: '',
    timerPersistent: false,
    timerAccuracySec: '',
    timerUnit: '',
    socketListenStream: '',
    socketListenDatagram: '',
    socketListenFIFO: '',
    socketMode: '',
    socketAccept: false,
    socketService: '',
    mountWhat: '/dev/sdb1',
    mountWhere: '/mnt/data',
    mountType: 'ext4',
    mountOptions: 'defaults,noatime',
    automountWhere: '',
  },
}

export const DEFAULTS = { ...PRESETS.webapp }

function trim(s) {
  return String(s ?? '').trim()
}

function addLine(lines, key, value) {
  const v = trim(value)
  if (v === '') return
  lines.push(`${key}=${v}`)
}

function addBool(lines, key, value) {
  if (value) lines.push(`${key}=true`)
}

function addEnvLines(lines, raw) {
  const entries = raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const e of entries) {
    lines.push(`Environment=${e}`)
  }
}

export function validateUnit(o, t) {
  const warnings = []
  const name = trim(o.unitName)
  const desc = trim(o.description)
  if (!name) warnings.push(t.wUnitName || 'unitName')
  if (!desc) warnings.push(t.wDescription || 'description')

  const type = o.unitType
  if (type === 'service' && !trim(o.execStart)) {
    warnings.push(t.wExecStart || 'execStart')
  }
  if (type === 'timer' && !trim(o.timerOnCalendar) && !trim(o.timerOnBootSec) && !trim(o.timerOnUnitActiveSec) && !trim(o.timerOnUnitInactiveSec)) {
    warnings.push(t.wTimerTrigger || 'timerTrigger')
  }
  if (type === 'socket' && !trim(o.socketListenStream) && !trim(o.socketListenDatagram) && !trim(o.socketListenFIFO)) {
    warnings.push(t.wSocketListen || 'socketListen')
  }
  if (type === 'mount' && (!trim(o.mountWhat) || !trim(o.mountWhere))) {
    warnings.push(t.wMount || 'mountWhat/mountWhere')
  }
  if (type === 'automount' && !trim(o.automountWhere)) {
    warnings.push(t.wAutomount || 'automountWhere')
  }

  return warnings
}

export function buildUnit(o) {
  const lines = []
  const type = o.unitType

  // [Unit]
  lines.push('[Unit]')
  addLine(lines, 'Description', o.description)
  addLine(lines, 'Documentation', o.documentation)
  addLine(lines, 'After', o.after)
  addLine(lines, 'Wants', o.wants)
  addLine(lines, 'Requires', o.requires)

  if (type === 'service') {
    lines.push('[Service]')
    const st = trim(o.serviceType)
    if (st) addLine(lines, 'Type', st)
    addLine(lines, 'ExecStart', o.execStart)
    addLine(lines, 'ExecReload', o.execReload)
    addLine(lines, 'ExecStop', o.execStop)
    addLine(lines, 'WorkingDirectory', o.workingDirectory)
    addLine(lines, 'User', o.user)
    addLine(lines, 'Group', o.group)
    addEnvLines(lines, o.environment)
    addLine(lines, 'EnvironmentFile', o.environmentFile)
    const restart = trim(o.restart)
    if (restart) addLine(lines, 'Restart', restart)
    addLine(lines, 'RestartSec', o.restartSec)
    addLine(lines, 'StartLimitIntervalSec', o.startLimitIntervalSec)
    addLine(lines, 'StartLimitBurst', o.startLimitBurst)
    addLine(lines, 'TimeoutStartSec', o.timeoutStartSec)
    addLine(lines, 'TimeoutStopSec', o.timeoutStopSec)
    addLine(lines, 'KillSignal', o.killSignal)
    addLine(lines, 'StandardOutput', o.standardOutput)
    addLine(lines, 'StandardError', o.standardError)
    addLine(lines, 'SyslogIdentifier', o.syslogIdentifier)
    addBool(lines, 'PrivateTmp', o.privateTmp)
    addBool(lines, 'NoNewPrivileges', o.noNewPrivileges)
    addLine(lines, 'ProtectSystem', o.protectSystem)
    addBool(lines, 'ProtectHome', o.protectHome)
  }

  if (type === 'timer') {
    lines.push('[Timer]')
    addLine(lines, 'OnCalendar', o.timerOnCalendar)
    addLine(lines, 'OnBootSec', o.timerOnBootSec)
    addLine(lines, 'OnUnitActiveSec', o.timerOnUnitActiveSec)
    addLine(lines, 'OnUnitInactiveSec', o.timerOnUnitInactiveSec)
    addBool(lines, 'Persistent', o.timerPersistent)
    addLine(lines, 'AccuracySec', o.timerAccuracySec)
    addLine(lines, 'Unit', o.timerUnit)
  }

  if (type === 'socket') {
    lines.push('[Socket]')
    addLine(lines, 'ListenStream', o.socketListenStream)
    addLine(lines, 'ListenDatagram', o.socketListenDatagram)
    addLine(lines, 'ListenFIFO', o.socketListenFIFO)
    addLine(lines, 'SocketMode', o.socketMode)
    addBool(lines, 'Accept', o.socketAccept)
    addLine(lines, 'Service', o.socketService)
  }

  if (type === 'mount') {
    lines.push('[Mount]')
    addLine(lines, 'What', o.mountWhat)
    addLine(lines, 'Where', o.mountWhere)
    addLine(lines, 'Type', o.mountType)
    addLine(lines, 'Options', o.mountOptions)
  }

  if (type === 'automount') {
    lines.push('[Automount]')
    addLine(lines, 'Where', o.automountWhere)
  }

  // [Install]
  const hasInstall =
    trim(o.wantedBy) ||
    trim(o.requiredBy) ||
    trim(o.installAlso)
  if (hasInstall) {
    lines.push('[Install]')
    addLine(lines, 'WantedBy', o.wantedBy)
    addLine(lines, 'RequiredBy', o.requiredBy)
    addLine(lines, 'Also', o.installAlso)
  }

  return { text: lines.join('\n'), fileName: `${trim(o.unitName) || 'unit'}.${type}` }
}
