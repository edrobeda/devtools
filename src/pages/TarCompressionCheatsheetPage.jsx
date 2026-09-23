import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { CompressOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basics', 'flags', 'compress', 'zip', 'advanced', 'inspect']

const CATEGORY_COLOR = {
  basics: 'blue',
  flags: 'green',
  compress: 'cyan',
  zip: 'gold',
  advanced: 'purple',
  inspect: 'volcano',
}

const labelOf = {
  basics: { pt: 'Básicas (criar, extrair, listar)', en: 'Basics (create, extract, list)' },
  flags: { pt: 'Flags mais usadas', en: 'Common flags' },
  compress: { pt: 'Ferramentas de compressão', en: 'Compression tools' },
  zip: { pt: 'zip & unzip', en: 'zip & unzip' },
  advanced: { pt: 'Avançado', en: 'Advanced' },
  inspect: { pt: 'Inspeção & integridade', en: 'Inspection & integrity' },
}

const COMMANDS = [
  // ─── Básicas (criar, extrair, listar) ───────────────────────────────────────
  { cmd: 'tar -cf site.tar site/', cat: 'basics', pt: 'Cria o arquivo SEM compressão (-c create, -f file): rápido, útil pra concatenar direto em fita/dd', en: 'Creates the archive WITHOUT compression (-c create, -f file): fast, useful to stream to tape/dd' },
  { cmd: 'tar -czf site.tar.gz site/', cat: 'basics', pt: "Cria + comprime com gzip (-z). O formato do dia a dia — 'tar czf' é o atalho mental", en: "Creates + gzip-compresses (-z). The everyday format — think 'tar czf' as the mantra" },
  { cmd: 'tar -czf /tmp/site.tgz -C /var/www site/', cat: 'basics', pt: '-C muda pra pasta antes de empacotar: os caminhos guardados viram RELATIVOS (extrai limpo em qualquer lugar)', en: '-C changes dir before packing: stored paths become RELATIVE (extracts cleanly anywhere)' },
  { cmd: 'tar -xzf site.tar.gz', cat: 'basics', pt: 'Extrai o .tar.gz na pasta atual (-x extract)', en: 'Extracts the .tar.gz into the current dir (-x extract)' },
  { cmd: 'tar -xzf site.tar.gz -C /srv/app', cat: 'basics', pt: 'Extrai direto dentro de uma pasta específica', en: 'Extracts straight into a specific directory' },
  { cmd: 'tar -tf site.tar.gz', cat: 'basics', pt: 'Lista o conteúdo SEM extrair nada (-t list)', en: 'Lists the contents WITHOUT extracting (-t list)' },
  { cmd: 'tar -tzf site.tar.gz | head', cat: 'basics', pt: 'Lista só os primeiros arquivos — prévia rápida sem gastar nada', en: 'Shows only the first entries — a quick peek at no cost' },
  { cmd: 'tar -xzf site.tar.gz build/index.html', cat: 'basics', pt: 'Extrai UMA entrada pelo caminho exato (sem barra inicial)', en: 'Extracts a SINGLE entry by its exact path (no leading slash)' },
  { cmd: 'tar -xzf site.tar.gz "build/*.html"', cat: 'basics', pt: 'Extrai por wildcard na forma exclusiva do GNU tar', en: 'Extracts by wildcard using GNU tar matching' },
  { cmd: 'tar --verbose --create --file=site.tar site/', cat: 'basics', pt: 'Forma longa, legível: o mesmo -cf escrito por extenso', en: 'The long form: the same -cf spelled out' },

  // ─── Flags mais usadas ──────────────────────────────────────────────────────
  { cmd: '-c  /  --create', cat: 'flags', pt: 'Cria um arquivo novo', en: 'Creates a new archive' },
  { cmd: '-x  /  --extract', cat: 'flags', pt: 'Extrai os arquivos do arquivo', en: 'Extracts files from the archive' },
  { cmd: '-t  /  --list', cat: 'flags', pt: 'Lista o conteúdo', en: 'Lists archive contents' },
  { cmd: '-f ARQUIVO', cat: 'flags', pt: "Nome do arquivo. SEM -f, o tar lê/escreve no stdin/stdout (a base dos pipes) — e 'tar' antes do nome é o erro nº1 de iniciante", en: 'Archive filename. WITHOUT -f, tar reads/writes stdin/stdout (the basis of pipes) — and forgetting it is rookie mistake #1' },
  { cmd: '-v  /  --verbose', cat: 'flags', pt: 'Mostra cada arquivo processado', en: 'Lists each file as it is processed' },
  { cmd: '-z', cat: 'flags', pt: 'gzip: compressão rápida, o padrão de facto', en: 'gzip: fast compression, the de-facto standard' },
  { cmd: '-j', cat: 'flags', pt: 'bzip2: compressão melhor que gzip, mais lenta', en: 'bzip2: better ratio than gzip, slower' },
  { cmd: '-J', cat: 'flags', pt: 'xz (LZMA2): melhor ratio mainstream, custo alto de CPU', en: 'xz (LZMA2): best mainstream ratio, heavy CPU cost' },
  { cmd: '-a  /  --auto-compress', cat: 'flags', pt: 'Escolhe a compressão pelo SUFIXO do arquivo (.gz→gzip, .xz→xz...)', en: 'Picks the compression from the file SUFFIX (.gz→gzip, .xz→xz, ...)' },
  { cmd: '-p  /  --preserve-permissions', cat: 'flags', pt: 'Restaura permissões originais na extração (raiz costuma já ter)', en: 'Restores original permissions on extraction (root usually has them anyway)' },
  { cmd: '-P', cat: 'flags', pt: 'Mantém caminhos ABSOLUTOS na extração (e tira o / na leitura)', en: 'Keeps ABSOLUTE paths when extracting (and strips / when reading)' },
  { cmd: '-C DIR', cat: 'flags', pt: 'Entra em DIR antes de adicionar/extrair — a chave dos backups limpos', en: 'Changes to DIR before adding/extracting — the key to clean backups' },
  { cmd: '-h', cat: 'flags', pt: 'Segue symlinks e guarda o DESTINO, não o link', en: 'Follows symlinks and stores the TARGET, not the link' },
  { cmd: '--remove-files', cat: 'flags', pt: 'Apaga o original depois de adicionar (vira um "move" pro arquivo)', en: 'Deletes the source after adding (turns it into a move into the archive)' },
  { cmd: '--one-file-system', cat: 'flags', pt: 'NÃO desce em outros filesystems (mount points) — clássico de backup de / completo', en: 'Does not descend into other filesystems (mounts) — the classic for full / backups' },
  { cmd: '--sparse', cat: 'flags', pt: 'Detecta buracos de arquivos esparsos (qemu-img, banco) e guarda só os blocos de dados', en: 'Detects holes in sparse files (qemu-img, databases) and stores only data blocks' },
  { cmd: '--numeric-owner', cat: 'flags', pt: 'Guarda UID/GID numérico em vez de nome — evita "unknown user" ao extrair em container', en: 'Stores numeric UID/GID instead of names — avoids "unknown user" when extracting in containers' },
  { cmd: '--warning=no-timestamp', cat: 'flags', pt: 'Silencia o "file changed as we read it" de logs/arquivos em escrita', en: 'Silences "file changed as we read it" from logs/files being written' },

  // ─── Ferramentas de compressão ──────────────────────────────────────────────
  { cmd: 'gzip -k arquivo.txt', cat: 'compress', pt: 'Comprime no lugar (arquivo.txt → arquivo.txt.gz); -k mantém o original', en: 'Compresses in place (arquivo.txt → arquivo.txt.gz); -k keeps the original' },
  { cmd: 'gzip -9 arquivo.txt', cat: 'compress', pt: 'Rácio máximo (mais lento); o default é -6, e -1 é o mais rápido', en: 'Best ratio (slowest); the default is -6, -1 is fastest' },
  { cmd: 'gunzip arquivo.txt.gz   # ou  gzip -d', cat: 'compress', pt: 'Descomprime de volta', en: 'Decompresses back to the original' },
  { cmd: 'zcat arquivo.txt.gz', cat: 'compress', pt: 'Joga o conteúdo descomprimido no stdout SEM criar arquivo (casamento perfeito com pipes)', en: 'Streams decompressed content to stdout WITHOUT creating a file (pipe-friendly)' },
  { cmd: 'zgrep -i erro app.log.gz', cat: 'compress', pt: 'grep direto num .gz sem extrair — a família zgrep/zless/zdiff/zcat', en: 'greps a .gz in place — the zgrep/zless/zdiff/zcat family' },
  { cmd: 'bzip2 -k site.sql  /  bunzip2 site.sql.bz2', cat: 'compress', pt: 'bzip2: maior compressão que gzip à custa de velocidade (-k = keep original)', en: 'bzip2: better ratio than gzip at the cost of speed (-k = keep original)' },
  { cmd: 'xz -9e app-1.0.tar', cat: 'compress', pt: 'xz com opções extremas: ratio máximo pra distribuir binário. unxz / xzcat pra desfazer', en: 'xz with extreme flags: maximum ratio for shipping binaries. unxz / xzcat to reverse' },
  { cmd: 'zstd -T0 backup.tar', cat: 'compress', pt: 'zstd: rápida como gzip e quase tãao comprimida como xz em níveis altos; zstdcat pra ler', en: 'zstd: gzip-like speed with near-xz ratios at high levels; zstdcat to read' },
  { cmd: '7z a app.7z app/   /   7z x app.7z', cat: 'compress', pt: 'p7zip (LZMA2): o melhor ratio geral; também lê zip, gzip, bzip2, rar', en: 'p7zip (LZMA2): the best overall ratio; also reads zip, gzip, bzip2, rar' },
  { cmd: 'gzip: rápido  |  bzip2: meio-termo  |  xz: melhor ratio  |  zstd: novo padrão', cat: 'compress', pt: 'Escolha: zstd pra moderno (velocidade+ratio), xz pra distribuir, gzip pra compatibilidade máxima', en: 'The pick: zstd for modern (speed+ratio), xz for shipping, gzip for max compatibility' },

  // ─── zip & unzip ────────────────────────────────────────────────────────────
  { cmd: 'zip -r release.zip dist/  assets/', cat: 'zip', pt: 'Compacta pasta(s) recursivamente (formato conversível com Windows/macOS)', en: 'Compresses folder(s) recursively (Windows/macOS-friendly)' },
  { cmd: 'zip -r -9 release.zip dist/', cat: 'zip', pt: '-9 força compressão máxima (default -6); use -0 só pra empacotar', en: '-9 forces maximum compression (default -6); use -0 just to bundle' },
  { cmd: 'unzip release.zip', cat: 'zip', pt: 'Extrai na pasta atual (preserva estrutura/permisões do zip)', en: 'Extracts into the current dir (preserves the zip structure)' },
  { cmd: 'unzip -l release.zip', cat: 'zip', pt: 'Lista o conteúdo sem extrair', en: 'Lists contents without extracting' },
  { cmd: 'unzip -t release.zip', cat: 'zip', pt: 'Testa a integridade de cada entrada (útil após download quebrado)', en: 'Tests every entry integrity (handy after a broken download)' },
  { cmd: 'unzip -o release.zip -d /srv/app', cat: 'zip', pt: '-o sobrescreve sem perguntar; -d define o destino', en: '-o overwrites without asking; -d sets the destination' },
  { cmd: "zip -e segredo.zip dados.zip", cat: 'zip', pt: 'Criptografa com senha (não é AES forte, mas evita leitura acidental)', en: 'Encrypts with a password (not strong AES, but avoids casual reading)' },
  { cmd: 'zip -d release.zip node_modules/bad/{x}.js', cat: 'zip', pt: 'Apaga uma entrada de dentro do zip sem recompactar tudo', en: 'Deletes an entry from inside the zip without re-archiving everything' },

  // ─── Avançado ───────────────────────────────────────────────────────────────
  { cmd: "tar -czf site.tgz --exclude='node_modules' --exclude='*.log' site/", cat: 'advanced', pt: 'Pula padrões durante o empacotamento', en: 'Skips patterns while archiving' },
  { cmd: 'tar -czf site.tgz --exclude-from=excludes.txt site/', cat: 'advanced', pt: 'Padrões de exclusão lidos de arquivo, um por linha', en: 'Exclusion patterns read from a file, one per line' },
  { cmd: 'tar -czf apps.tgz -T lista.txt', cat: 'advanced', pt: '-T (--files-from) empacota exatamente o que está listado no arquivo', en: '-T (--files-from) archives exactly what the file lists' },
  { cmd: 'tar -xzf app.tgz --strip-components=1', cat: 'advanced', pt: 'Extrai descartando o 1º nível de pasta (app-2.0/dist → dist)', en: 'Extracts dropping the first path level (app-2.0/dist → dist)' },
  { cmd: "tar -czf - site/ | ssh host 'cat > /tmp/site.tgz'", cat: 'advanced', pt: 'Streama o tar pelo ssh SEM criar arquivo local — -f - é o stdout/stdin', en: 'Streams the tar over ssh WITHOUT a local file — -f - is stdout/stdin' },
  { cmd: "ssh host 'tar -czf - /srv/data' | tar -xzf - -C ./download", cat: 'advanced', pt: 'Puxa um tar remoto direto pra pasta local, no mesmo pipe', en: 'Pulls a remote tar straight into a local folder, in one pipe' },
  { cmd: 'tar --listed-incremental=site.snar -czf full.tgz site/', cat: 'advanced', pt: 'Backup incremental GNU: o .snar lembra o que já foi salvo (GFS/level 0,1,2)', en: 'GNU incremental backup: the .snar remembers what was saved (GFS levels 0,1,2)' },
  { cmd: 'split -b 90m site.tgz site.part.', cat: 'advanced', pt: 'Fatura o arquivo em partes de 90 MB (megasplit para transferência)', en: 'Splits the file into 90 MB parts (megasplit for transfer)' },
  { cmd: 'cat site.part.* | tar -xzf -', cat: 'advanced', pt: 'Junta as partes de volta e extrai tudo no mesmo comando', en: 'Rejoins the parts and extracts in one command' },
  { cmd: 'tar -czf /backup/home.tgz --exclude=/home/*/.cache --one-file-system /home', cat: 'advanced', pt: "O backup 'clássico' de /home: sem caches, sem montagens separadas", en: "The classic /home backup: no caches, no other mounts" },

  // ─── Inspeção & integridade ─────────────────────────────────────────────────
  { cmd: 'file backup.tar.gz', cat: 'inspect', pt: 'Revela o formato real: gzip/bzip2/xz/zip e até se é tar por dentro', en: 'Reveals the real format: gzip/bzip2/xz/zip and even whether tar is inside' },
  { cmd: 'tar -tvzf site.tgz', cat: 'inspect', pt: 'Listagem detalhada: permissões, dono, tamanho e data de cada entrada', en: 'Detailed listing: perms, owner, size and date of every entry' },
  { cmd: 'tar -tzf site.tgz | wc -l', cat: 'inspect', pt: 'Conta quantas entradas o arquivo tem', en: 'Counts how many entries the archive holds' },
  { cmd: 'gzip -tv arquivo.gz', cat: 'inspect', pt: '-t testa a integridade do gzip (fala o tamanho original restaurado)', en: '-t tests gzip integrity (reports the restored original size)' },
  { cmd: 'unzip -t release.zip', cat: 'inspect', pt: 'Confere CRC de todas as entradas do zip um a um', en: 'Checks the CRC of every zip entry one by one' },
  { cmd: 'du -sh site.tgz && sha256sum site.tgz', cat: 'inspect', pt: 'Tamanho + hash: a dupla pra conferir download antes de extrair', en: 'Size + hash: the pair to verify a download before extracting' },
  { cmd: 'tar -xOf site.tgz etc/app.conf', cat: 'inspect', pt: '-O extrai a saída pro stdout — lê um arquivo de dentro SEM extrair nada', en: '-O dumps to stdout — reads one file from inside WITHOUT extracting' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de tar & Compactação',
    intro: (
      <>
        Referência pesquisável do <Text code>tar</Text> e das ferramentas de
        compressão do dia a dia: criar/extrair/listar, flags mais usadas,
        gzip / bzip2 / xz / zstd / 7z, <Text code>zip</Text> para interoperar
        com Windows/macOS, e truques avançados (excluir, stream por ssh,
        backups incrementais, fatiar arquivos). Complementa o{' '}
        <Text code>rsync-cheatsheet</Text> (sincronização) e o{' '}
        <Text code>ssh-cheatsheet</Text> — aqui o foco é empacotar e
        comprimir. Tudo 100% client-side, só texto de referência.
      </>
    ),
    tipTitle: 'O essencial antes de sair digitando',
    tipBody: (
      <>
        A ordem dos três primeiros flags é o macete de memória:{' '}
        <Text code>tar -czf</Text> cria comprimido,{' '}
        <Text code>tar -xzf</Text> extrai, <Text code>tar -tzf</Text> lista.
        O <Text code>-f</Text> vem antes do nome do arquivo (e sem{' '}
        <Text code>-f</Text> o tar fala com stdin/stdout, o que habilita os
        pipes com ssh). Guarde caminhos RELATIVOS: rode de fora com{' '}
        <Text code>tar -czf x.tgz -C /var/www site/</Text> em vez de
        empacotar caminho absoluto. O sufixo não manda no tar — a{" "}
        compressão é escolhida pela flag (<Text code>-z</Text> gzip,{' '}
        <Text code>-j</Text> bzip2, <Text code>-J</Text> xz,{' '}
        <Text code>-a</Text> auto pelo sufixo). Pra distribuir binário, xz/zstd
        dão o menor download; pra mover entre serviços, gzip é o mais
        compatível.
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
    title: 'tar & Compression Cheat Sheet',
    intro: (
      <>
        A searchable reference for <Text code>tar</Text> and everyday
        compression tools: create/extract/list, common flags, gzip / bzip2 /
        xz / zstd / 7z, <Text code>zip</Text> for Windows/macOS interop, and
        advanced tricks (excludes, ssh streaming, incremental backups, file
        splitting). Fills the gap next to{' '}
        <Text code>rsync-cheatsheet</Text> (syncing) and{' '}
        <Text code>ssh-cheatsheet</Text> — here the focus is bundling and
        compressing. 100% client-side, reference text only.
      </>
    ),
    tipTitle: 'The essentials before you start',
    tipBody: (
      <>
        The first three flags are the memory trick:{' '}
        <Text code>tar -czf</Text> creates compressed,{' '}
        <Text code>tar -xzf</Text> extracts, <Text code>tar -tzf</Text> lists.
        <Text code>-f</Text> comes before the filename (and without{' '}
        <Text code>-f</Text> tar talks to stdin/stdout — that is what enables
        ssh pipes). Store RELATIVE paths: run from outside with{' '}
        <Text code>tar -czf x.tgz -C /var/www site/</Text> instead of packing
        absolute paths. The suffix does not drive tar — compression is picked
        by the flag (<Text code>-z</Text> gzip, <Text code>-j</Text> bzip2,{' '}
        <Text code>-J</Text> xz, <Text code>-a</Text> auto by suffix). To
        ship binaries, xz/zstd give the smallest download; to move between
        services, gzip is the most compatible.
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

export default function TarCompressionCheatsheetPage() {
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
      <Title level={2}><CompressOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<CompressOutlined />} message={t.tipTitle} description={t.tipBody} />

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