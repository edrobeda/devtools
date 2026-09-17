import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { SyncOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basics', 'flags', 'remote', 'exclude', 'delete', 'advanced']

const CATEGORY_COLOR = {
  basics: 'blue',
  flags: 'green',
  remote: 'cyan',
  exclude: 'gold',
  delete: 'volcano',
  advanced: 'purple',
}

const labelOf = {
  basics: { pt: 'Básicas & barra final', en: 'Basics & trailing slash' },
  flags: { pt: 'Flags mais usadas', en: 'Common flags' },
  remote: { pt: 'Remoto & SSH', en: 'Remote & SSH' },
  exclude: { pt: 'Excluir & filtrar', en: 'Exclude & filter' },
  delete: { pt: 'Deletar & espelhar', en: 'Delete & mirror' },
  advanced: { pt: 'Avançado', en: 'Advanced' },
}

const COMMANDS = [
  // ─── Básicas & barra final ──────────────────────────────────────────────────
  { cmd: 'rsync -a origem/ destino/', cat: 'basics', pt: 'Copia o CONTEÚDO de origem/ para dentro de destino/ — a barra final muda o jogo', en: 'Copies the CONTENTS of src/ into dst/ — the trailing slash changes the game' },
  { cmd: 'rsync -a origem destino/', cat: 'basics', pt: 'Sem barra: copia a própria pasta origem para DENTRO de destino/', en: 'Without the slash: copies the folder itself INTO dst/' },
  { cmd: 'rsync -r origem/ destino/', cat: 'basics', pt: 'Recursivo "cru": cria pastas e copia, sem preservar metadados', en: 'Raw recursive: creates dirs and copies, no metadata preservation' },
  { cmd: '-a  =  -rlptgoD', cat: 'basics', pt: 'archive = recursivo, links, permissões, tempos, dono/grupo e devices', en: 'archive = recursive, links, perms, times, owner/group and devices' },
  { cmd: 'rsync -n -av origem/ destino/', cat: 'basics', pt: 'Ensaiar (dry-run): mostra o que faria sem tocar em nada', en: 'Rehearse: shows what would happen without touching anything' },
  { cmd: 'rsync -av origem/ destino/', cat: 'basics', pt: 'Verbose: lista cada arquivo transferido', en: 'Verbose: lists every transferred file' },
  { cmd: 'rsync -avz origem/ usuario@servidor:/srv/app/', cat: 'basics', pt: 'Envia compactando (rede lenta/remoto)', en: 'Sends with compression (slow/remote links)' },
  { cmd: 'rsync -avh --progress origem/ destino/', cat: 'basics', pt: 'Números legíveis + progresso por arquivo', en: 'Human-readable sizes + per-file progress' },

  // ─── Flags mais usadas ──────────────────────────────────────────────────────
  { cmd: '-v', cat: 'flags', pt: 'Verboso, lista o que está sendo copiado', en: 'Verbose, lists what is being copied' },
  { cmd: '-z', cat: 'flags', pt: 'Comprime os dados na transferência (custo de CPU)', en: 'Compresses data on the wire (CPU cost)' },
  { cmd: '-P', cat: 'flags', pt: 'Atalho de --partial + --progress numa tecla só', en: 'Shorthand for --partial + --progress in one flag' },
  { cmd: '--partial', cat: 'flags', pt: 'Mantém o arquivo parcial se a conexão cair (a próxima rodada retoma)', en: 'Keeps the partial file, so the next run resumes' },
  { cmd: '--progress', cat: 'flags', pt: 'Barra de progresso por arquivo + totais', en: 'Per-file progress bar plus overall stats' },
  { cmd: '-h', cat: 'flags', pt: 'Tamanhos legíveis (K/M/G)', en: 'Human-friendly units (K/M/G)' },
  { cmd: '--stats', cat: 'flags', pt: 'Resumo final: arquivos, bytes, velocidade, tempo', en: 'End summary: files, bytes, speed, elapsed time' },
  { cmd: '-u  /  --update', cat: 'flags', pt: 'Só sobrescreve se o destino for mais ANTIGO', en: 'Overwrites only when the destination is OLDER' },
  { cmd: '--ignore-times', cat: 'flags', pt: 'Reenvia tudo, mesmo com tamanho/hora iguais', en: 'Re-sends everything even if size/time match' },
  { cmd: '-c  /  --checksum', cat: 'flags', pt: 'Compara por checksum (cara) em vez de hora+tamanho', en: 'Compares by checksum (slow) instead of time+size' },
  { cmd: '-L', cat: 'flags', pt: 'Segue symlinks e copia o ALVO, não o link', en: 'Follows symlinks and copies the TARGET, not the link' },
  { cmd: '--size-only', cat: 'flags', pt: 'Compara só o tamanho (ignora hora — relógios dessincronizados)', en: 'Size-only comparison (ignores mtimes — skewed clocks)' },

  // ─── Remoto & SSH ───────────────────────────────────────────────────────────
  { cmd: 'rsync -avz ./ usuario@servidor:~/backup/', cat: 'remote', pt: 'Envia local → remoto via ssh', en: 'Uploads local → remote over ssh' },
  { cmd: 'rsync -avz usuario@servidor:~/backup/ ./', cat: 'remote', pt: 'Baixa remoto → local', en: 'Downloads remote → local' },
  { cmd: 'rsync -avz -e "ssh -p 2222" ./ usuario@servidor:~/', cat: 'remote', pt: 'Porta ssh diferente do padrão', en: 'Non-default ssh port' },
  { cmd: 'rsync -avz -e "ssh -i ~/.ssh/prod" ./ usuario@servidor:/srv/', cat: 'remote', pt: 'Chave/pem específica', en: 'Specific ssh key/pem' },
  { cmd: 'rsync -avz -e "ssh -J bastiao" ./ usuario@interno:~/', cat: 'remote', pt: 'Pula por um bastião (ProxyJump do ssh)', en: 'Jumps through a bastion (ssh ProxyJump)' },
  { cmd: 'rsync -avz usuario@servidor::modulo ./', cat: 'remote', pt: 'Daemon rsync (porta 873), módulo nomeado', en: 'rsync daemon (port 873), named module' },
  { cmd: 'rsync -avz rsync://servidor:8730/modulo ./', cat: 'remote', pt: 'Daemon por URL explícita com porta', en: 'Daemon by explicit URL and port' },
  { cmd: 'rsync --list-only usuario@servidor:~/dados/', cat: 'remote', pt: 'Lista o que a origem tem, sem transferir', en: 'Lists the remote listing without transferring' },
  { cmd: 'rsync -az usuario@servidor1:~/src/ usuario@servidor2:~/dst/', cat: 'remote', pt: 'Remoto → remoto passando pela sua máquina', en: 'Remote-to-remote (routes through your host)' },

  // ─── Excluir & filtrar ──────────────────────────────────────────────────────
  { cmd: "rsync -a --exclude='*.log' origem/ destino/", cat: 'exclude', pt: 'Pula arquivos que casam o padrão', en: 'Skips files matching the pattern' },
  { cmd: "rsync -a --exclude='node_modules/' origem/ destino/", cat: 'exclude', pt: 'Exclui uma PASTA (barra final só casa diretórios)', en: 'Excludes a DIRECTORY (slash matches dirs only)' },
  { cmd: 'rsync -a --exclude-from=lista.txt origem/ destino/', cat: 'exclude', pt: 'Padrões lidos de um arquivo, um por linha', en: 'Patterns read from a file, one per line' },
  { cmd: "rsync -a --include='src/' --exclude='*' origem/ destino/", cat: 'exclude', pt: 'Só o que casar no include — ordem importa: include primeiro', en: 'Keep only what matches the include — order matters: include first' },
  { cmd: "rsync -a --exclude='.git/' --exclude='*.map' --exclude='coverage/' origem/ destino/", cat: 'exclude', pt: 'Exemplo de deploy: sem .git, source maps nem coverage', en: 'Deploy example: no .git, source maps or coverage' },
  { cmd: "rsync -a --filter='- *.tmp' origem/ destino/", cat: 'exclude', pt: 'Regra genérica de include/exclude (o - nega)', en: 'Generic include/exclude rule (minus excludes)' },
  { cmd: 'rsync -a --prune-empty-dirs origem/ destino/', cat: 'exclude', pt: 'Remove na origem as pastas que ficaram vazias', en: 'Drops directories left empty at the source' },
  { cmd: 'rsync -a --delete-excluded origem/ destino/', cat: 'exclude', pt: 'Apaga no destino também o que foi EXCLUÍDO aqui', en: 'Deletes on the destination what was EXCLUDED here' },

  // ─── Deletar & espelhar ─────────────────────────────────────────────────────
  { cmd: 'rsync -a --delete origem/ destino/', cat: 'delete', pt: 'Espelha: apaga no destino o que sumiu na origem', en: 'Mirrors: deletes things gone from the source' },
  { cmd: '--delete-before', cat: 'delete', pt: 'Apaga ANTES de transferir (comportamento clássico)', en: 'Deletes BEFORE transferring (the classic behavior)' },
  { cmd: '--delete-during', cat: 'delete', pt: 'Apaga enquanto copia (comportamento atual)', en: 'Deletes WHILE copying (the current behavior)' },
  { cmd: '--delete-after', cat: 'delete', pt: 'Apaga DEPOIS de transferir (bom com --delayed-updates)', en: 'Deletes AFTER transferring (good with --delayed-updates)' },
  { cmd: '--delay-updates', cat: 'delete', pt: 'Escreve num temporário e move no fim — o arquivo nunca fica pela metade', en: 'Writes to a temp then renames — files are never half-written' },
  { cmd: '--force', cat: 'delete', pt: 'Apaga pastas não-vazias no destino quando a origem virou arquivo', en: 'Deletes non-empty dest dirs when the source became a file' },
  { cmd: 'rsync -an --delete origem/ destino/', cat: 'delete', pt: 'Ensaio do espelhamento: vê exatamente o que seria apagado', en: 'Dry-run the mirror: see exactly what would be deleted' },

  // ─── Avançado ───────────────────────────────────────────────────────────────
  { cmd: 'rsync -a --backup origem/ destino/', cat: 'advanced', pt: 'Guarda a versão antiga como arquivo~', en: 'Keeps the old version as file~' },
  { cmd: 'rsync -a --backup --backup-dir=backups/ origem/ destino/', cat: 'advanced', pt: 'Versões antigas numa pasta separada', en: 'Old versions into a dedicated folder' },
  { cmd: 'rsync -a --link-dest=../anterior origem/ destino/', cat: 'advanced', pt: 'Hard-links para o snapshot anterior: backups incrementais baratos', en: 'Hard-links to the previous snapshot: cheap incremental backups' },
  { cmd: 'rsync -a -H origem/ destino/', cat: 'advanced', pt: 'Preserva hard links entre arquivos', en: 'Preserves hard links between files' },
  { cmd: 'rsync -a --bwlimit=500 origem/ destino/', cat: 'advanced', pt: 'Limita a transferência a 500 KB/s', en: 'Caps the transfer at 500 KB/s' },
  { cmd: 'rsync -a --timeout=300 origem/ destino/', cat: 'advanced', pt: 'Desiste depois de 300s sem dados — evita hang', en: 'Gives up after 300s of silence — avoids hangs' },
  { cmd: 'rsync -a --inplace origem/ destino/', cat: 'advanced', pt: 'Escreve direto no arquivo final, sem temporário', en: 'Writes straight into the target file (no temp)' },
  { cmd: "rsync -a --max-size='100M' origem/ destino/", cat: 'advanced', pt: 'Pula arquivos maiores que o limite', en: 'Skips files above this size' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de rsync',
    intro: (
      <>
        Referência pesquisável do <Text code>rsync</Text> — a ferramenta de
        sincronização e deploy que só copia o que mudou: básicas da barra
        final, flags mais usadas, remoto via <Text code>ssh</Text> e daemon,
        exclusões & filtros, espelhamento com <Text code>--delete</Text> e
        truques avançados (backups, hard links, limite de banda). Tudo 100%
        client-side (só texto de referência) — complementa o{' '}
        <Text code>ssh-cheatsheet</Text>, que lista o <Text code>rsync</Text>{' '}
        só como ponte de transferência.
      </>
    ),
    tipTitle: 'O essencial antes de sair digitando',
    tipBody: (
      <>
        A barra final decide tudo: <Text code>rsync -a origem/ destino/</Text>{' '}
        copia o CONTEÚDO de <Text code>origem/</Text> para dentro de{' '}
        <Text code>destino/</Text>, enquanto <Text code>rsync -a origem destino/</Text>{' '}
        copia a própria pasta. <Text code>-a</Text> (archive) é{' '}
        <Text code>-rlptgoD</Text> — recursivo, symlinks, permissões, tempos,
        dono/grupo e devices; preservar dono/grupo no destino costuma exigir
        root do outro lado. <Text code>--delete</Text> só age em cópia
        recursiva e espelha o destino à origem: rode{' '}
        <Text code>-n</Text>/<Text code>--dry-run</Text> antes de usá-lo onde
        você se importa. Remoto é <Text code>usuario@host:caminho</Text> via
        ssh na porta 22; porta ou chave diferentes entram com{' '}
        <Text code>-e "ssh -p 2222"</Text> / <Text code>-e "ssh -i ~/.ssh/prod"</Text>.
        O formato <Text code>servidor::modulo</Text> é o daemon rsync da porta
        873 — misturar as duas sintaxes é o erro nº 1 de quem migra do scp.
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
    title: 'rsync Cheat Sheet',
    intro: (
      <>
        A searchable <Text code>rsync</Text> reference — the sync and deploy
        tool that only copies what changed: trailing-slash basics, common
        flags, remote over <Text code>ssh</Text> and daemon, excludes &
        filters, <Text code>--delete</Text> mirroring and advanced tricks
        (backups, hard links, bandwidth caps). 100% client-side (reference
        text only) — fills the gap left by <Text code>ssh-cheatsheet</Text>,
        which covers <Text code>rsync</Text> only as a transfer bridge.
      </>
    ),
    tipTitle: 'The essentials before you start',
    tipBody: (
      <>
        The trailing slash decides everything:{' '}
        <Text code>rsync -a src/ dst/</Text> copies the CONTENTS of{' '}
        <Text code>src/</Text> into <Text code>dst/</Text>, while{' '}
        <Text code>rsync -a src dst/</Text> copies the folder itself.{' '}
        <Text code>-a</Text> (archive) is <Text code>-rlptgoD</Text> —
        recursive, symlinks, permissions, times, owner/group and devices;
        preserving owner/group usually needs root on the destination.{' '}
        <Text code>--delete</Text> only applies to recursive copies, mirroring
        the destination to the source: hit <Text code>-n</Text>/
        <Text code>--dry-run</Text> before using it somewhere you care about.
        Remote is <Text code>user@host:path</Text> over ssh on port 22;
        custom ports or keys go through <Text code>-e "ssh -p 2222"</Text> /{' '}
        <Text code>-e "ssh -i ~/.ssh/prod"</Text>. The{' '}
        <Text code>server::module</Text> form is the rsync daemon on port 873
        — mixing both syntaxes is the #1 scp-migrator mistake.
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

export default function RsyncCheatsheetPage() {
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
      <Title level={2}><SyncOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<SyncOutlined />} message={t.tipTitle} description={t.tipBody} />

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