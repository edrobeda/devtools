import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, SafetyCertificateOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['connect', 'keys', 'agent', 'config', 'tunnels', 'transfer', 'security']

const CATEGORY_COLOR = {
  connect: 'blue',
  keys: 'green',
  agent: 'cyan',
  config: 'gold',
  tunnels: 'purple',
  transfer: 'orange',
  security: 'volcano',
}

const labelOf = {
  connect: { pt: 'Conexão', en: 'Connecting' },
  keys: { pt: 'Chaves', en: 'Key pairs' },
  agent: { pt: 'Agent & ssh-add', en: 'Agent & ssh-add' },
  config: { pt: 'Configuração (~/.ssh/config)', en: 'Config (~/.ssh/config)' },
  tunnels: { pt: 'Túneis, encaminhamento & saltos', en: 'Tunnels, forwarding & jumps' },
  transfer: { pt: 'scp / rsync / sftp', en: 'scp / rsync / sftp' },
  security: { pt: 'Segurança & host keys', en: 'Security & host keys' },
}

const COMMANDS = [
  // ─── Conexão ────────────────────────────────────────────────────────────────
  { cmd: 'ssh usuario@servidor.com', cat: 'connect', pt: 'Conecta na máquina remota (porta 22)', en: 'Connects to the remote box (port 22)' },
  { cmd: 'ssh -p 2222 usuario@servidor.com', cat: 'connect', pt: 'Conecta numa porta diferente do padrão', en: 'Connects on a non-default port' },
  { cmd: 'ssh servidor.com -l usuario', cat: 'connect', pt: 'Forma alternativa: usuário com -l', en: 'Alternate form: user via -l' },
  { cmd: 'ssh -o ConnectTimeout=5 usuario@servidor.com', cat: 'connect', pt: 'Desiste após 5s sem resposta (script/firewall)', en: 'Gives up after 5s without a reply (scripts/firewalls)' },
  { cmd: 'ssh -v usuario@servidor.com', cat: 'connect', pt: 'Modo verboso — vê cada passo do handshake', en: 'Verbose mode — see every handshake step' },
  { cmd: 'ssh -q usuario@servidor.com comando', cat: 'connect', pt: 'Só o comando remoto, sem banners (quiet)', en: 'Run a remote command, no chatter (quiet)' },
  { cmd: 'ssh -t usuario@servidor.com sudo apt update', cat: 'connect', pt: '-t aloca um TTY (necessário pra sudo/curses remoto)', en: '-t allocates a TTY (needed for sudo/RFU scripts)' },
  { cmd: 'ssh usuario@servidor.com "comando; comando2"', cat: 'connect', pt: 'Executa vários comandos remotos e morre', en: 'Runs several remote commands and exits' },
  { cmd: 'exit  (ou Ctrl-D)', cat: 'connect', pt: 'Fecha a sessão SSH', en: 'Ends the SSH session' },

  // ─── Chaves ─────────────────────────────────────────────────────────────────
  { cmd: 'ssh-keygen -t ed25519', cat: 'keys', pt: 'Gera a chave moderna recomendada (ed25519)', en: 'Generates the recommended modern key (ed25519)' },
  { cmd: 'ssh-keygen -t rsa -b 4096', cat: 'keys', pt: 'RSA 4096 — pra sistemas legados/hoje seguro também', en: 'RSA 4096 — for legacy systems, still safe' },
  { cmd: 'ssh-keygen -t ed25519 -f ~/.ssh/github -C "voce@email.com"', cat: 'keys', pt: 'Chave nomeada com comentário (identifica a origem)', en: 'Named key with a comment (identifies the source)' },
  { cmd: 'ssh-keygen -p -f ~/.ssh/id_ed25519', cat: 'keys', pt: 'Troca ou remove a passphrase da chave', en: 'Changes or removes the key passphrase' },
  { cmd: 'ssh-keygen -y -f ~/.ssh/id_ed25519', cat: 'keys', pt: 'Deriva a chave PÚBLICA da privada (pra colar onde cabe)', en: 'Derives the PUBLIC key from the private one (to paste into a service)' },
  { cmd: 'cat ~/.ssh/id_ed25519.pub', cat: 'keys', pt: 'Mostra a chave pública (GitHub/GitLab/etc)', en: 'Shows the public key (GitHub/GitLab/etc)' },
  { cmd: 'ssh-copy-id -i ~/.ssh/id_ed25519.pub usuario@servidor.com', cat: 'keys', pt: 'Instala a chave no servidor (authorized_keys)', en: 'Installs the pubkey on the server (authorized_keys)' },
  { cmd: 'ssh -i ~/.ssh/chave_especial usuario@servidor.com', cat: 'keys', pt: 'Usa uma chave específica pra essa conexão', en: 'Uses a specific key for this connection' },
  { cmd: 'ssh-keyscan -t ed25519 servidor.com', cat: 'keys', pt: 'Baixa a host key pública de um servidor', en: 'Fetches a server public host key' },

  // ─── ssh-agent & ssh-add ────────────────────────────────────────────────────
  { cmd: 'eval "$(ssh-agent -s)"', cat: 'agent', pt: 'Inicia o agent em background (o eval exporta as env vars)', en: 'Starts the agent in the background (eval exports env vars)' },
  { cmd: 'ssh-add ~/.ssh/id_ed25519', cat: 'agent', pt: 'Carrega a chave no agent (pede a passphrase 1x)', en: 'Loads the key into the agent (asks passphrase once)' },
  { cmd: 'ssh-add -l', cat: 'agent', pt: 'Lista as chaves do agent (fingerprints)', en: 'Lists the loaded keys (fingerprints)' },
  { cmd: 'ssh-add -L', cat: 'agent', pt: 'Lista as chaves do agent NA VERSÃO pública', en: 'Lists the agent keys in PUBLIC form' },
  { cmd: 'ssh-add -d  /  ssh-add -D', cat: 'agent', pt: 'Remove uma chave / remove todas', en: 'Removes one key / clears all' },
  { cmd: 'ssh-add -t 3600 ~/.ssh/id_ed25519', cat: 'agent', pt: 'Chave com expiração (volatilidade de tty ephemeral)', en: 'Key with an expiry (short-lived agent session)' },
  { cmd: 'ssh -A usuario@bastiao', cat: 'agent', pt: 'Propaga o agent nesta conexão (logins seguintes iguais sem redigitar)', en: 'Forwards your agent onward (cascade logins stay passwordless)' },

  // ─── Configuração ~/.ssh/config ─────────────────────────────────────────────
  { cmd: 'man ssh_config', cat: 'config', pt: 'Manual completo das opções', en: 'Full manual of every option' },
  { cmd: 'Host github\n    HostName github.com\n    User git\n    IdentityFile ~/.ssh/github', cat: 'config', pt: 'Alias simples: `ssh github` conecta tudo pronto', en: 'Shortcut: `ssh github` connects fully configured' },
  { cmd: 'Host *\n    ServerAliveInterval 60\n    ServerAliveCountMax 2', cat: 'config', pt: 'Heartbeat evita sessão congelada por corte silencioso', en: 'Heartbeat keeps the session from freezing silently' },
  { cmd: 'Host interno*\n    ProxyJump usuario@bastiao.minhaempresa.com', cat: 'config', pt: 'Todo host `interno*` passa pelo bastião automaticamente', en: 'Every `interno*` host hops via the bastion' },
  { cmd: 'Host *\n    IdentityFile ~/.ssh/id_ed25519\n    IdentitiesOnly yes', cat: 'config', pt: 'Só testa as chaves listadas (evita o erro "Too many authentication failures")', en: 'Tries ONLY the listed keys (avoids the too-many-failures error)' },
  { cmd: 'Include ~/.ssh/config.d/*', cat: 'config', pt: 'Carrega configs separadas por projeto', en: 'Loads separate per-project configs' },

  // ─── Túneis, port forwarding & jump hosts ───────────────────────────────────
  { cmd: 'ssh -L 8080:localhost:3000 usuario@servidor.com', cat: 'tunnels', pt: 'Port LOCAL 8080 → porta local do servidor (3000)', en: 'Local 8080 → the server\u2019s local 3000' },
  { cmd: 'ssh -L 5432:db.internal:5432 usuario@bastiao', cat: 'tunnels', pt: 'Forward pra um host que SÓ o bastion enxerga', en: 'Forwards to a host only the bastion can reach' },
  { cmd: 'ssh -R 8080:localhost:80 usuario@servidor.com', cat: 'tunnels', pt: 'Remote: porta do servidor 8080 → seu localhost:80', en: 'Remote: server port 8080 → your local :80' },
  { cmd: 'ssh -D 1080 usuario@servidor.com', cat: 'tunnels', pt: 'SOCKS5 no 127.0.0.1:1080 — navegador “via remoto”', en: 'A SOCKS5 proxy on 127.0.0.1:1080 — browser through the remote' },
  { cmd: 'ssh -f -N -L 9000:localhost:9000 usuario@servidor.com', cat: 'tunnels', pt: '-f background + -N “só túnel, sem rodar comando”', en: '-f background + -N “pure tunnel, no command”' },
  { cmd: 'ssh -J usuario@bastiao usuario@interno.corp', cat: 'tunnels', pt: '-J pula por um bastião: conexão direta em um comando só', en: 'A single-hop through the bastion in one command' },

  // ─── Transferência ──────────────────────────────────────────────────────────
  { cmd: 'scp arquivo.zip usuario@servidor.com:~/', cat: 'transfer', pt: 'Envia arquivo pro home do servidor', en: 'Uploads a file to the server home' },
  { cmd: 'scp -r pasta/ usuario@servidor.com:~/', cat: 'transfer', pt: 'Copia diretório recursivamente', en: 'Copies a directory recursively' },
  { cmd: 'scp -P 2222 usuario@servidor.com:~/backup.sql .', cat: 'transfer', pt: 'Baixa pro disco local; -P é a porta do scp', en: 'Downloads to disk; -P is the scp port' },
  { cmd: 'rsync -avz --progress ./src usuario@servidor.com:~/app/', cat: 'transfer', pt: 'Sincroniza com compactação e barra de progresso', en: 'Syncs with compression and a progress bar' },
  { cmd: 'rsync -avz --delete usuario@servidor.com:~/app/ ./app/', cat: 'transfer', pt: 'Espelha: apaga no destino o que sumiu na origem', en: 'Mirrors: deletes remote extras' },
  { cmd: 'rsync -avz -e "ssh -p 2222" usuario@servidor.com:~/tmp ./', cat: 'transfer', pt: 'rsync por ssh com porta/pulo customizado via -e', en: 'rsync over a custom ssh port/jump via -e' },
  { cmd: 'sftp usuario@servidor.com', cat: 'transfer', pt: 'Sessão interativa estilo FTP (ls/get/put)', en: 'Interactive FTP-like session (ls/get/put)' },

  // ─── Segurança ──────────────────────────────────────────────────────────────
  { cmd: 'chmod 700 ~/.ssh && chmod 600 ~/.ssh/*', cat: 'security', pt: 'Permissões mínimas — SSH recusa chaves largas', en: 'Minimal perms — ssh refuses loose keys' },
  { cmd: 'ssh-keygen -lf ~/.ssh/id_ed25519.pub', cat: 'security', pt: 'Fingerprint SHA-256 da chave (pra comparar em conferências)', en: 'SHA-256 fingerprint of the key (to compare)' },
  { cmd: 'ssh-keyscan servidor.com', cat: 'security', pt: 'Baixa a host key pra verificar o servidor', en: 'Fetches the host key to verify the server' },
  { cmd: 'ssh-keygen -R servidor.com', cat: 'security', pt: 'Remove a entrada da known_hosts (host mudou de chave)', en: 'Drops the known_hosts entry (host key changed)' },
  { cmd: 'ssh -o StrictHostKeyChecking=accept-new servidor.com', cat: 'security', pt: 'Auto-aceita a primeira visita, cobra nas trocas', en: 'Auto-accepts first visit, warns on changes' },
  { cmd: 'sshd_config: PasswordAuthentication no, PermitRootLogin prohibit-password', cat: 'security', pt: 'Servidor: só chaves, sem root por senha', en: 'Server: keys only, no root-by-password' },
  { cmd: 'ssh-add -L > publicas.txt', cat: 'security', pt: 'Despeja as públicas carregadas no agent hoje', en: 'Dumps the public keys currently in the agent' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de SSH',
    intro: (
      <>
        Referência pesquisável do <Text code>ssh</Text> — acesso remoto,
        chaves <Text code>.pub</Text>, <Text code>ssh-agent</Text>,{' '}
        <Text code>scp</Text>/<Text code>rsync</Text>, túneis de porta e
        saltos por bastião. Tudo 100% client-side (só texto de referência).
      </>
    ),
    tipTitle: 'O essencial antes de sair digitando',
    tipBody: (
      <>
        O fluxo sem senha é: <Text code>ssh-keygen</Text> (gerar o par) →{' '}
        <Text code>ssh-copy-id</Text> (instalar a chave pública no servidor){' '}
        <Text code>ssh-add</Text> (botar a privada no agent pra não redigitar
        a passphrase a cada login). A pública é{" "}
        <Text code>cat ~/.ssh/id_ed25519.pub</Text>. Pegadinhas que pega todo
        mundo: permissão frouxa em <Text code>~/.ssh</Text> (SSH recusa a
        chave — <Text code>600</Text> no arquivo, <Text code>700</Text> na
        pasta), o erro “Too many authentication failures” quando o client fica
        tentando N chaves (arrumado com{' '}
        <Text code>IdentitiesOnly yes</Text>), o{' '}
        <Text code>known_hosts</Text> mudando de chave depois de um redeploy
        (limpe com <Text code>ssh-keygen -R</Text>; nunca desligue o
        StrictHostKeyChecking), e a leitura do túnel <Text code>-L</Text>:{' '}
        <Text code>porta_local:host_remoto:porta_remota</Text>.
      </>
    ),
    search: 'Buscar comando ou descrição...',
    all: 'Todos',
    empty: 'Nenhum comando encontrado. Tente outra busca ou categoria.',
    resultsOne: 'comando encontrado',
    resultsMany: 'comandos encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
  },
  en: {
    title: 'SSH Cheat Sheet',
    intro: (
      <>
        A searchable <Text code>ssh</Text> reference — remote access,{' '}
        <Text code>.pub</Text> keys, <Text code>ssh-agent</Text>,{' '}
        <Text code>scp</Text>/<Text code>rsync</Text>, port forwarding and
        jumps. 100% client-side (reference text only).
      </>
    ),
    tipTitle: 'The essentials before you start',
    tipBody: (
      <>
        The passwordless flow is: <Text code>ssh-keygen</Text> to generate the
        pair, <Text code>ssh-copy-id</Text> to install the public key on the
        server, and <Text code>ssh-add</Text> to keep the private key loaded
        in the agent (no retyping the passphrase). The public half is{' '}
        <Text code>cat ~/.ssh/id_ed25519.pub</Text>. Classic gotchas: loose{' '}
        <Text code>~/.ssh</Text> permissions (ssh refuses the key —{' '}
        <Text code>600</Text> file, <Text code>700</Text> dir), the “Too many
        authentication failures” error when it tries too many keys (fix:{' '}
        <Text code>IdentitiesOnly yes</Text>), the{' '}
        <Text code>known_hosts</Text> entry that changes after a redeploy
        (fix: <Text code>ssh-keygen -R</Text> — never disable
        StrictHostKeyChecking), and the <Text code>-L</Text> tunnel reading{' '}
        <Text code>local_port:remote_host:remote_port</Text>.
      </>
    ),
    search: 'Search a command or description...',
    all: 'All',
    empty: 'No commands found. Try another search or category.',
    resultsOne: 'command found',
    resultsMany: 'commands found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
  },
}

export default function SshCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return COMMANDS.filter((c) => {
      if (category !== 'all' && c.cat !== category) return false
      if (!q) return true
      return (
        c.cmd.toLowerCase().includes(q) ||
        (c[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [category, query, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Command | Category | Description |\n|---|---|---|\n'
    const rows = filtered.map((c) =>
      `| \`${c.cmd.replace(/\|/g, '\\|').replace(/\n/g, '\\n')}\` | ${labelOf[c.cat][lang]} | ${(c[lang] || '').replace(/\|/g, '\\|')} |`
    )
    return head + rows.join('\n')
  }, [filtered, lang])

  const copyText = useCallback(
    async (text, okMsg) => {
      try {
        await navigator.clipboard.writeText(text)
        messageApi.success(okMsg || t.copied)
      } catch {
        messageApi.error(t.copiedError || 'Error')
      }
    },
    [t, messageApi]
  )

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><SafetyCertificateOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<SafetyCertificateOutlined />} message={t.tipTitle} description={t.tipBody} />

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

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={() => copyText(mdTable)}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={item.cmd}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space wrap style={{ rowGap: 6 }}>
                  <Text code style={{ fontSize: 13 }}>{item.cmd}</Text>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyText(item.cmd)} />
                </Space>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}