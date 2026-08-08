import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Checkbox, Table, Button, message, Alert, Tag, Divider } from 'antd'
import { CopyOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const translations = {
  pt: {
    title: 'Calculadora de Permissões (chmod)',
    intro: (
      <>
        Converte entre o modo octal (<Text code>755</Text>) e a notação
        simbólica (<Text code>rwxr-xr-x</Text>) das permissões POSIX de
        arquivos e pastas — incluindo os bits especiais{' '}
        <Text code>setuid</Text>, <Text code>setgid</Text> e{' '}
        <Text code>sticky</Text>. Marque os checkboxes ou digite o octal: os
        dois lados sincronizam na hora e o comando <Text code>chmod</Text>{' '}
        correspondente sai pronto pra copiar. 100% client-side.
      </>
    ),
    bitsTitle: 'Permissões',
    owner: 'Dono',
    group: 'Grupo',
    other: 'Outros',
    read: 'Leitura',
    write: 'Escrita',
    exec: 'Execução',
    specialLabel: 'Bits especiais',
    suidLabel: 'setuid',
    sgidLabel: 'setgid',
    stickyLabel: 'sticky',
    octalLabel: 'Modo octal',
    fileLabel: 'Arquivo / pasta',
    resultTitle: 'Resultado',
    numCmd: 'Comando numérico',
    symCmd: 'Comando simbólico',
    octal: 'Octal',
    lsStyle: 'Notação simbólica',
    copy: 'Copiar',
    copied: 'Copiado!',
    copyErr: 'Não foi possível copiar',
    filePlaceholder: 'arquivo-ou-pasta',
    octalPlaceholder: '755',
    invalidOctal: 'Octal inválido — use de 1 a 4 dígitos 0–7.',
    commonTitle: 'Modos comuns',
    commonHint: 'Clique em um modo para aplicá-lo.',
    descCol: 'Descrição',
    octalCol: 'Octal',
    lsCol: 'Notação simbólica',
    tipTitle: 'Como funciona',
    tipBody: (
      <>
        Cada grupo soma três bits: <Text code>r</Text>=4, <Text code>w</Text>
        =2, <Text code>x</Text>=1. Então <Text code>7</Text>=<Text code>rwx</Text>,{' '}
        <Text code>6</Text>=<Text code>rw-</Text>, <Text code>5</Text>=
        <Text code>r-x</Text>, <Text code>4</Text>=<Text code>r--</Text>. O
        quarto dígito (quando existe) ativa o bit especial: <Text code>4</Text>
        =setuid (roda como o dono), <Text code>2</Text>=setgid (herda o grupo),{' '}
        <Text code>1</Text>=sticky (só o dono remove, em diretórios). Quando o
        bit especial está ligado mas o <Text code>x</Text> correspondente não,
        a letra fica maiúscula no <Text code>ls</Text>: <Text code>S</Text> e{' '}
        <Text code>T</Text>.
      </>
    ),
    tipTitle2: 'Para descobrir o modo atual',
    tipBody2: (
      <>
        No terminal: <Text code>stat -c %a arquivo</Text> mostra o octal e{' '}
        <Text code>ls -l</Text> mostra a notação simbólica.
      </>
    ),
  },
  en: {
    title: 'File Permission Calculator (chmod)',
    intro: (
      <>
        Converts between octal (<Text code>755</Text>) and symbolic (
        <Text code>rwxr-xr-x</Text>) POSIX file/folder permissions — including
        the special <Text code>setuid</Text>, <Text code>setgid</Text> and{' '}
        <Text code>sticky</Text> bits. Toggle the checkboxes or type the octal:
        both sides stay in sync and the matching <Text code>chmod</Text> command
        is ready to copy. 100% client-side.
      </>
    ),
    bitsTitle: 'Permissions',
    owner: 'Owner',
    group: 'Group',
    other: 'Others',
    read: 'Read',
    write: 'Write',
    exec: 'Execute',
    specialLabel: 'Special bits',
    suidLabel: 'setuid',
    sgidLabel: 'setgid',
    stickyLabel: 'sticky',
    octalLabel: 'Octal mode',
    fileLabel: 'File / folder',
    resultTitle: 'Result',
    numCmd: 'Numeric command',
    symCmd: 'Symbolic command',
    octal: 'Octal',
    lsStyle: 'ls notation',
    copy: 'Copy',
    copied: 'Copied!',
    copyErr: 'Could not copy',
    filePlaceholder: 'file-or-folder',
    octalPlaceholder: '755',
    invalidOctal: 'Invalid octal — use 1 to 4 digits from 0 to 7.',
    commonTitle: 'Common modes',
    commonHint: 'Click a mode to apply it.',
    descCol: 'Description',
    octalCol: 'Octal',
    lsCol: 'Notation',
    tipTitle: 'How it works',
    tipBody: (
      <>
        Each group is the sum of three bits: <Text code>r</Text>=4,{' '}
        <Text code>w</Text>=2, <Text code>x</Text>=1. So <Text code>7</Text>=
        <Text code>rwx</Text>, <Text code>6</Text>=<Text code>rw-</Text>,{' '}
        <Text code>5</Text>=<Text code>r-x</Text>, <Text code>4</Text>=
        <Text code>r--</Text>. A fourth digit (when present) sets a special
        bit: <Text code>4</Text>=setuid (runs as owner), <Text code>2</Text>=
        setgid (inherits group), <Text code>1</Text>=sticky (only owner can
        delete, on directories). When a special bit is on without the matching{' '}
        <Text code>x</Text>, the letter is uppercase in <Text code>ls</Text>:{' '}
        <Text code>S</Text> and <Text code>T</Text>.
      </>
    ),
    tipTitle2: 'Find the current mode',
    tipBody2: (
      <>
        In the terminal, <Text code>stat -c %a file</Text> prints the octal
        form and <Text code>ls -l</Text> prints the symbolic one.
      </>
    ),
  },
}

const BIT_VALUES = [4, 2, 1]
const BIT_LETTERS = ['r', 'w', 'x']

// "4755" / "755" → { special, owner, group, other, digits } ou null se inválido
function parseOctal(str) {
  const s = String(str || '').trim()
  if (!/^[0-7]{1,4}$/.test(s)) return null
  const pad = s.padStart(4, '0')
  return {
    digits: s.length,
    special: Number(pad[0]),
    owner: Number(pad[1]),
    group: Number(pad[2]),
    other: Number(pad[3]),
  }
}

// dígito octal (0..7) → "rwx" com '-' para bits desligados
function groupToLetters(oct) {
  return BIT_VALUES
    .map((bit, i) => ((oct & bit) !== 0 ? BIT_LETTERS[i] : '-'))
    .join('')
}

// idem, porém com o bit de execução trocado pelo especial (s/S/t/T) quando
// `specialOn` estiver ligado: minúsculo se o x está ligado, maiúsculo senão.
// O grupo "outros" usa t/T (sticky).
function groupToLtrSpecial(oct, specialOn) {
  let out = ''
  for (let i = 0; i < 3; i++) {
    const on = (oct & BIT_VALUES[i]) !== 0
    if (i === 2 && specialOn) {
      if (on) out += specialOn === 2 ? 't' : 's'
      else out += specialOn === 2 ? 'T' : 'S'
    } else {
      out += on ? BIT_LETTERS[i] : '-'
    }
  }
  return out
}

// representação estilo `ls` para o modo (grupos + especiais)
function lsNotation(m) {
  if (!m) return ''
  const ownerSp = (m.special & 4) !== 0 ? 1 : 0
  const groupSp = (m.special & 2) !== 0 ? 1 : 0
  const otherSp = (m.special & 1) !== 0 ? 2 : 0
  return (
    groupToLtrSpecial(m.owner, ownerSp) +
    groupToLtrSpecial(m.group, groupSp) +
    groupToLtrSpecial(m.other, otherSp)
  )
}

// comando simbólico no estilo chmod u=rwx,g=rx,o=r [+u+s,+g+s,+o+t]
function symbolicCommandCmd(m, file) {
  let cmd = `chmod u=${groupToLetters(m.owner)},g=${groupToLetters(m.group)},o=${groupToLetters(m.other)}`
  if ((m.special & 4) !== 0) cmd += ',u+s'
  if ((m.special & 2) !== 0) cmd += ',g+s'
  if ((m.special & 1) !== 0) cmd += ',o+t'
  return `${cmd} ${file}`
}

function toOctal(m) {
  return `${m.special > 0 ? m.special : ''}${m.owner}${m.group}${m.other}`
}

const COMMON_MODES = [
  { octal: '400', ls: 'r--------', pt: 'Só o dono lê (chaves, .env)', en: 'Owner read-only (keys, .env)' },
  { octal: '600', ls: 'rw-------', pt: 'Dono lê/escreve (arquivos de senha)', en: 'Owner rw (password files)' },
  { octal: '640', ls: 'rw-r-----', pt: 'Dono rw, grupo lê', en: 'Owner rw, group read' },
  { octal: '644', ls: 'rw-r--r--', pt: 'Padrão de arquivos', en: 'Default for files' },
  { octal: '664', ls: 'rw-rw-r--', pt: 'Grupo também escreve', en: 'Group can also write' },
  { octal: '700', ls: 'rwx------', pt: 'Só o dono (pasta/script privado)', en: 'Owner only (private folder/script)' },
  { octal: '750', ls: 'rwxr-x---', pt: 'Pasta colaborativa', en: 'Collaborative folder' },
  { octal: '755', ls: 'rwxr-xr-x', pt: 'Padrão de pastas e executáveis', en: 'Default for folders/executables' },
  { octal: '775', ls: 'rwxrwxr-x', pt: 'Grupo com escrita', en: 'Group writable' },
  { octal: '777', ls: 'rwxrwxrwx', pt: 'Todo mundo (evite)', en: 'World-writable (avoid)' },
  { octal: '4755', ls: 'rwsr-xr-x', pt: 'setuid: roda como dono (ex.: /usr/bin/passwd)', en: 'setuid, runs as owner (e.g. passwd)' },
  { octal: '2775', ls: 'rwxrwsr-x', pt: 'setgid: herda grupo em pasta', en: 'setgid: group inherited on folder' },
  { octal: '1777', ls: 'rwxrwxrwt', pt: 'sticky: só o dono remove (ex.: /tmp)', en: 'sticky: only owner deletes (e.g. /tmp)' },
]

export default function ChmodCalculatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang] || translations.pt

  const [octalText, setOctalText] = useState('755')
  const [file, setFile] = useState('arquivo-ou-pasta')
  const [messageApi, messageContextHolder] = message.useMessage()

  const mode = useMemo(() => parseOctal(octalText), [octalText])

  function toggle(groupKey, letterIdx) {
    const base = mode ? { ...mode } : { special: 0, owner: 0, group: 0, other: 0 }
    const cur = base[groupKey]
    const bit = BIT_VALUES[letterIdx]
    base[groupKey] = (cur & bit) !== 0 ? cur - bit : cur + bit
    setOctalText(toOctal(base))
  }

  function toggleSpecial(value) {
    const base = mode ? { ...mode } : { special: 0, owner: 0, group: 0, other: 0 }
    base.special = (base.special & value) !== 0 ? base.special - value : base.special + value
    setOctalText(toOctal(base))
  }

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(t.copied)
    } catch {
      messageApi.error(t.copyErr)
    }
  }

  const groups = [
    { key: 'owner', label: t.owner },
    { key: 'group', label: t.group },
    { key: 'other', label: t.other },
  ]

  const specialBits = [
    { value: 4, label: t.suidLabel, color: 'volcano' },
    { value: 2, label: t.sgidLabel, color: 'gold' },
    { value: 1, label: t.stickyLabel, color: 'purple' },
  ]

  const symbolicCmd = mode ? symbolicCommandCmd(mode, file) : ''

  const tableColumns = [
    {
      title: t.octalCol,
      dataIndex: 'octal',
      key: 'octal',
      width: 80,
      render: (v) => <Text code strong style={{ fontSize: 13 }}>{v}</Text>,
    },
    {
      title: t.lsCol,
      dataIndex: 'ls',
      key: 'ls',
      width: 110,
      render: (v) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>,
    },
    { title: t.descCol, dataIndex: 'description', key: 'desc' },
  ]

  const commonData = COMMON_MODES.map((m) => ({
    ...m,
    description: m[lang] || m.pt,
  }))

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Space size="large" align="start" wrap>
        <Card title={t.bitsTitle} style={{ minWidth: 380 }}>
          <Space align="start" wrap>
            {groups.map((g) => (
              <div key={g.key} style={{ minWidth: 120 }}>
                <Text strong>{g.label}</Text>
                <div>
                  {BIT_LETTERS.map((letter, i) => (
                    <div key={letter} style={{ marginTop: 4 }}>
                      <Checkbox
                        checked={mode ? (mode[g.key] & BIT_VALUES[i]) !== 0 : false}
                        onChange={() => toggle(g.key, i)}
                      >
                        {letter}
                      </Checkbox>
                    </div>
                  ))}
                  <Text type="secondary" style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {mode ? groupToLetters(mode[g.key]) : '---'}
                  </Text>
                </div>
              </div>
            ))}
          </Space>

          <Divider style={{ margin: '12px 0' }} />

          <Text strong>{t.specialLabel}</Text>
          <div style={{ marginTop: 8 }}>
            {specialBits.map((sb) => (
              <Checkbox
                key={sb.value}
                checked={mode ? (mode.special & sb.value) !== 0 : false}
                onChange={() => toggleSpecial(sb.value)}
                style={{ marginRight: 12, marginBottom: 8 }}
              >
                <Tag color={sb.color} style={{ marginRight: 0 }}>{sb.label}</Tag>
              </Checkbox>
            ))}
          </div>
        </Card>

        <Card title={t.octalLabel} style={{ minWidth: 320 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              value={octalText}
              onChange={(e) => setOctalText(e.target.value)}
              placeholder={t.octalPlaceholder}
              style={{ fontFamily: 'monospace', width: 120 }}
            />
            <Input
              addonBefore={<Text type="secondary">{t.fileLabel}</Text>}
              value={file}
              onChange={(e) => setFile(e.target.value)}
              style={{ width: 260 }}
            />
            {mode ? (
              <Space direction="vertical" size="small" style={{ marginTop: 8 }}>
                <Paragraph type="secondary" style={{ marginBottom: 4 }}>
                  {t.lsStyle}:{' '}
                  <Text code style={{ fontSize: 14 }}>{lsNotation(mode)}</Text>
                </Paragraph>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(lsNotation(mode))}>
                  {t.copy}
                </Button>
              </Space>
            ) : (
              <Alert type="error" showIcon message={t.invalidOctal} />
            )}
          </Space>
        </Card>
      </Space>

      {mode && (
        <Card title={t.resultTitle}>
          <Space direction="vertical">
            <div>
              <Text strong>{t.numCmd}: </Text>
              <Text code style={{ fontSize: 13 }}>{`chmod ${toOctal(mode)} ${file}`}</Text>{' '}
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(`chmod ${toOctal(mode)} ${file}`)}>
                {t.copy}
              </Button>
            </div>
            <div>
              <Text strong>{t.symCmd}: </Text>
              <Text code style={{ fontSize: 13 }}>{symbolicCmd}</Text>{' '}
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(symbolicCmd)}>
                {t.copy}
              </Button>
            </div>
          </Space>
        </Card>
      )}

      <Card
        title={t.commonTitle}
        extra={<Text type="secondary">{t.commonHint}</Text>}
      >
        <Table
          rowKey="octal"
          columns={tableColumns}
          dataSource={commonData}
          size="small"
          pagination={false}
          onRow={(r) => ({
            style: { cursor: 'pointer' },
            onClick: () => setOctalText(String(r.octal)),
          })}
        />
      </Card>

      <Card title={t.tipTitle2}>
        <Paragraph style={{ marginBottom: 0 }}>{t.tipBody2}</Paragraph>
      </Card>
    </Space>
  )
}