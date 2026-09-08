import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, SendOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basic', 'data', 'headers', 'auth', 'files', 'output', 'recipes']

const CATEGORY_COLOR = {
  basic: 'blue',
  data: 'green',
  headers: 'cyan',
  auth: 'purple',
  files: 'volcano',
  output: 'gold',
  recipes: 'magenta',
}

const labelOf = {
  basic: { pt: 'Requisições básicas', en: 'Basic requests' },
  data: { pt: 'Enviar dados', en: 'Sending data' },
  headers: { pt: 'Cabeçalhos', en: 'Headers' },
  auth: { pt: 'Autenticação & TLS', en: 'Auth & TLS' },
  files: { pt: 'Upload & download', en: 'Upload & download' },
  output: { pt: 'Tratar a saída', en: 'Handling the output' },
  recipes: { pt: 'Receitas do dia a dia', en: 'Everyday recipes' },
}

const ITEMS = [
  // ─── Requisições básicas ───────────────────────────────────────────────
  { code: 'curl https://api.exemplo.com/items', cat: 'basic',
    pt: 'O básico: faz uma requisição GET e imprime o corpo da resposta no stdout. Quando a saída não é um terminal, o curl nem mostra barra de progresso.',
    en: 'The basics: performs a GET request and prints the response body to stdout. When the output is not a terminal, curl shows no progress bar at all.' },
  { code: 'curl -i https://api.exemplo.com/items', cat: 'basic',
    pt: '-i (include) mistura os cabeçalhos de resposta junto com o corpo na saída — o jeito rápido de ver status, Content-Type e cookies.',
    en: '-i (include) mixes the response headers with the body in the output — the quick way to see status, Content-Type and cookies.' },
  { code: 'curl -I https://api.exemplo.com/items', cat: 'basic',
    pt: '-I emite apenas os cabeçalhos (requisição HEAD) — ideal para conferir status, valores de cache (ETag/Last-Modified) e o tamanho anunciado de um arquivo sem baixar nada.',
    en: '-I emits only the response headers (HEAD request) — ideal to check the status, cache values (ETag/Last-Modified) and the advertised size of a file without downloading anything.' },
  { code: 'curl -s https://api.exemplo.com/items', cat: 'basic',
    pt: '-s (silent) esconde a barra de progresso E as mensagens de erro — o padrão quase sempre desejado em scripts e pipes, mas que também engole o erro: veja -sS na receita de health check.',
    en: '-s (silent) hides the progress bar AND the error messages — almost always wanted in scripts and pipes, but it also swallows errors: see -sS in the health check recipe.' },
  { code: 'curl -L https://exemplo.com', cat: 'basic',
    pt: '-L (location) segue redirecionamentos (301/302/303) até o destino final. Sem ele, o curl mostra o redirect no lugar do conteúdo — o "voltei vazio" mais comum de todos.',
    en: '-L (location) follows redirects (301/302/303) to the final destination. Without it, curl shows the redirect instead of the content — the most common "empty response" of all.' },
  { code: 'curl -v https://api.exemplo.com/items', cat: 'basic',
    pt: '-v (verbose) mostra a conversa inteira: versão do HTTP, handshake TLS e cada cabeçalho enviado/recebido. O modo para depurar "por que essa chamada não funciona?"',
    en: '-v (verbose) shows the whole conversation: HTTP version, TLS handshake and every header sent/received. The mode to debug "why is this call not working?"' },
  { code: 'curl -o repos.json https://api.github.com/repos/nodejs/node', cat: 'basic',
    pt: '-o troca o stdout por um arquivo no nome que você escolher. Combine com -s para downloads limpos, sem barra de progresso.',
    en: '-o switches stdout to a file under the name you choose. Combine it with -s for clean downloads, with no progress bar.' },
  { code: 'curl -O https://cdn.exemplo.com/pacote.zip', cat: 'basic',
    pt: '-O (maiúsculo) salva com o MESMO nome do arquivo remoto — o que vem após a última / da URL. Atalho para downloads rápidos.',
    en: '-O (uppercase) saves with the SAME name as the remote file — whatever comes after the last / of the URL. A shortcut for quick downloads.' },

  // ─── Enviar dados ──────────────────────────────────────────────────────
  { code: "curl -d 'nome=Joao&cidade=SP' https://api.exemplo.com/usuarios", cat: 'data',
    pt: '-d envia um POST com o corpo em application/x-www-form-urlencoded — o mesmo formato de um formulário HTML. O -d sozinho já vira POST automático: não precisa de -X.',
    en: '-d sends a POST with the body as application/x-www-form-urlencoded — the same format as an HTML form. -d alone already switches the method to POST: no -X needed.' },
  { code: "curl -H 'Content-Type: application/json' -d '{\"nome\":\"Joao\"}' https://api.exemplo.com/usuarios", cat: 'data',
    pt: 'JSON no POST: defina o Content-Type na mão (o -d sozinho não sabe que o corpo é JSON) e envie o objeto como string. As aspas simples protegem as aspas duplas do shell.',
    en: 'JSON over POST: set Content-Type by hand (-d alone does not know the body is JSON) and send the object as a string. Single quotes protect the double quotes from the shell.' },
  { code: 'curl --data-binary @payload.json https://api.exemplo.com/usuarios', cat: 'data',
    pt: 'O @ lê o corpo de um arquivo. O --data-binary preserva bytes exatos — sem cortar o newline final, como o -d faz.',
    en: 'The @ reads the body from a file. --data-binary preserves the exact bytes — no trimming of the trailing newline like -d does.' },
  { code: 'curl -d @- https://api.exemplo.com/usuarios <<< \'{"a": 1}\'', cat: 'data',
    pt: 'O hífen lê o corpo do stdin — monte pipelines onde outro comando gera o payload. Use --data-binary @- para preservar o corpo byte a byte.',
    en: 'The hyphen reads the body from stdin — build pipelines where another command generates the payload. Use --data-binary @- to keep the body byte-exact.' },
  { code: "curl -G --data-urlencode 'q=termo com espacos' https://api.exemplo.com/busca", cat: 'data',
    pt: '-G joga os dados na QUERY STRING em vez do corpo, e --data-urlencode escapa o valor corretamente (espaço vira %20). O jeito certo de montar GET com parâmetros sem se preocupar com encoding.',
    en: '-G throws the data into the QUERY STRING instead of the body, and --data-urlencode escapes the value properly (space becomes %20). The right way to build GETs with params without worrying about encoding.' },
  { code: "curl -F 'arquivo=@foto.png' https://api.exemplo.com/upload", cat: 'data',
    pt: '-F envia multipart/form-data — o formato de upload de arquivos dos navegadores. O @ marca um arquivo; sem o @, é apenas um campo de texto.',
    en: '-F sends multipart/form-data — the browser-style file upload format. The @ marks a file; without @, it is just a text field.' },
  { code: "curl -F 'nome=Joao' -F 'arquivo=@curriculo.pdf' https://api.exemplo.com/upload", cat: 'data',
    pt: 'Vários -F montam o multipart completo: campos de texto + arquivos na mesma requisição, na ordem em que aparecem.',
    en: 'Multiple -F build the full multipart: text fields + files in the same request, in the order they appear.' },

  // ─── Cabeçalhos ────────────────────────────────────────────────────────
  { code: "curl -H 'Authorization: Bearer seyJhbGciOi...' https://api.exemplo.com/privado", cat: 'headers',
    pt: '-H adiciona qualquer cabeçalho à requisição — o mais comum do dia a dia é o token no Authorization. Só um -H não muda o método.',
    en: '-H adds any header to the request — the most common is the token in Authorization. A -H alone does not change the method.' },
  { code: "curl -H 'Accept: application/json' https://api.exemplo.com/items", cat: 'headers',
    pt: 'Negocia o formato via Accept — muitos servidores devolvem JSON ou XML conforme este cabeçalho. Confira o Content-Type da resposta para confirmar.',
    en: 'Negotiates the format via Accept — many servers return JSON or XML depending on this header. Check Content-Type in the response to confirm.' },
  { code: "curl -A 'Mozilla/5.0 (X11; Linux x86_64)' https://exemplo.com", cat: 'headers',
    pt: '-A troca o User-Agent — para ver como um serviço se comporta com navegadores, bots de busca ou clientes mobile. (Bom senso: não personifique para burlar regras.)',
    en: '-A swaps the User-Agent — to see how a service behaves with browsers, search bots or mobile clients. (Common sense: do not impersonate to bypass rules.)' },
  { code: 'curl -e https://origem.com.br https://exemplo.com', cat: 'headers',
    pt: '-e (referer) define o cabeçalho Referer — o site de "onde você veio". Útil para testar bloqueios de hotlink e lógica de origem.',
    en: '-e (referer) sets the Referer header — the site of "where you came from". Useful to test hotlink blocks and origin logic.' },
  { code: "curl -b 'sessao=abc123' https://exemplo.com/meu-perfil", cat: 'headers',
    pt: '-b envia cookies como se o navegador tivesse recebido um Set-Cookie antes — é como "logar" numa sessão sem navegador.',
    en: '-b sends cookies as if the browser had received a Set-Cookie before — how to "log in" to a session without a browser.' },
  { code: 'curl -b cookies.txt -c cookies.txt https://exemplo.com', cat: 'headers',
    pt: 'O par clássico: -b LÊ os cookies do arquivo, -c GRAVA os que o servidor respondeu. Juntos mantêm a sessão "viva" entre chamadas.',
    en: 'The classic pair: -b READS cookies from the file, -c WRITES the ones the server responded with. Together they keep the session "alive" across calls.' },

  // ─── Autenticação & TLS ────────────────────────────────────────────────
  { code: 'curl -u usuario:senha https://api.exemplo.com/privado', cat: 'auth',
    pt: '-u envia HTTP Basic Auth (o cabeçalho Authorization Basic em base64). Cuidado: viaja codificado, não criptografado — sempre por cima de HTTPS.',
    en: '-u sends HTTP Basic Auth (a base64 Authorization header). Careful: it is only encoded, not encrypted — always over HTTPS.' },
  { code: 'curl -u usuario https://api.exemplo.com/privado', cat: 'auth',
    pt: 'Sem a senha no comando, o curl pede a senha interativamente (fica fora do histórico do terminal). Bom hábito quando a senha não pode aparecer no comando.',
    en: 'Without a password in the command, curl prompts for it interactively (kept out of the terminal history). Good habit when the password must not show up in the command.' },
  { code: "curl --oauth2-bearer 'seu-token' https://api.exemplo.com/privado", cat: 'auth',
    pt: 'O jeito explícito de mandar um bearer token OAuth2 — monta o Authorization: Bearer sem você digitar o -H na mão.',
    en: 'The explicit way to send an OAuth2 bearer token — builds the Authorization: Bearer without you typing the -H by hand.' },
  { code: 'curl -k https://servidor-interno.local', cat: 'auth',
    pt: '-k (insecure) ignora a validação do certificado TLS — só para laboratório e hosts internos sem cert válido. Em produção, corrija o certificado em vez de usar -k.',
    en: '-k (insecure) skips TLS certificate validation — labs and internal hosts without a valid cert only. In production, fix the certificate instead of using -k.' },
  { code: 'curl --cacert ca.pem https://api.corporativo.com', cat: 'auth',
    pt: 'Confia em um CA customizado (empresa, interno) fornecendo o certificado da autoridade — HTTPS válido sem depender dos CAs públicos do sistema.',
    en: 'Trusts a custom CA (corporate, internal) by providing the authority certificate — valid HTTPS without relying on the system\'s public CAs.' },
  { code: 'curl --cert cliente.pem --key cliente-chave.pem https://api.exemplo.com', cat: 'auth',
    pt: 'Autenticação mútua (mTLS): o servidor também valida você, via certificado de cliente e sua chave privada. Comum em APIs de bancos e serviços B2B.',
    en: 'Mutual TLS (mTLS): the server also validates you, via a client certificate and its private key. Common in banking and B2B APIs.' },

  // ─── Upload & download ─────────────────────────────────────────────────
  { code: 'curl -C - -O https://cdn.exemplo.com/pacote-grande.zip', cat: 'files',
    pt: '-C - retoma um download interrompido de onde parou — o cabeçalho Range é montado sozinho a partir do que já está no arquivo.',
    en: '-C - resumes an interrupted download from where it stopped — the Range header is built by itself from what is already on disk.' },
  { code: 'curl --limit-rate 500k -O https://cdn.exemplo.com/pacote.zip', cat: 'files',
    pt: 'Limita a velocidade do download (aqui 500 KB/s) — para não saturar a conexão enquanto outra coisa importante roda.',
    en: 'Limits the download speed (here 500 KB/s) — to avoid saturating the connection while something else important runs.' },
  { code: 'curl -T relatorio.pdf https://api.exemplo.com/documentos/', cat: 'files',
    pt: '-T faz upload PUT do arquivo para a URL — o verbo clássico de uploads e APIs REST de armazenamento.',
    en: '-T PUT-uploads the file to the URL — the classic verb for uploads and storage REST APIs.' },
  { code: 'curl -z 2026-01-01 -O https://cdn.exemplo.com/build-2026-01-05.tar.gz', cat: 'files',
    pt: '-z (time-cond) só baixa se o arquivo remoto for MAIS NOVO que a data dada (ou que um arquivo local): economiza rede quando o conteúdo não mudou.',
    en: '-z (time-cond) downloads only if the remote file is NEWER than the given date (or a local file): saves bandwidth when the content has not changed.' },
  { code: 'curl -D cabecalhos.txt -o corpo.json https://api.exemplo.com/items', cat: 'files',
    pt: 'Separa a resposta: -D grava só os cabeçalhos num arquivo e -o o corpo em outro — útil para debugar cookies, ETag e rate-limit sem poluir o corpo.',
    en: 'Splits the response: -D writes only the headers to a file and -o the body to another — handy for debugging cookies, ETag and rate-limit headers without polluting the body.' },

  // ─── Tratar a saída ────────────────────────────────────────────────────
  { code: "curl -s https://api.github.com/repos/nodejs/node | jq '.stargazers_count'", cat: 'output',
    pt: 'O combo eterno: o pipe do shell entrega a resposta JSON pro jq, que extrai o campo. API + jq é a "grep" dos serviços modernos.',
    en: 'The eternal combo: the shell pipe feeds the JSON response to jq, which extracts the field. API + jq is the "grep" of modern services.' },
  { code: "curl -s -o /dev/null -w '%{http_code}\\n' https://api.exemplo.com", cat: 'output',
    pt: 'Só o código HTTP: -o /dev/null descarta o corpo e -w imprime o status no final. O health check mais enxuto que existe — é como este site verifica se algo está no ar.',
    en: 'Just the HTTP status: -o /dev/null discards the body and -w prints the status at the end. The leanest health check there is — it is how this very site checks that something is up.' },
  { code: "curl -s -o /dev/null -w 'status: %{http_code} | tempo: %{time_total}s\\n' https://api.exemplo.com", cat: 'output',
    pt: '-w (write-out) imprime métricas pós-requisição — aqui o status e o tempo total. Há %{time_connect}, %{time_starttransfer}, %{size_download} e dezenas de outras.',
    en: '-w (write-out) prints post-request metrics — here the status and total time. There are %{time_connect}, %{time_starttransfer}, %{size_download} and dozens more.' },
  { code: 'curl -s --compressed https://api.exemplo.com/items', cat: 'output',
    pt: '--compressed anuncia Accept-Encoding: gzip, deflate, br e descomprime a resposta na hora — o payload pode chegar de 5 a 10x menor.',
    en: '--compressed advertises Accept-Encoding: gzip, deflate, br and decompresses the response on the spot — the payload can arrive 5-10x smaller.' },
  { code: 'curl -x http://proxy.intranet:8080 -s https://api.exemplo.com', cat: 'output',
    pt: '-x roda pela URL do proxy dada — essencial atrás de firewalls corporativos ou para testar como o tráfego sai por um intermediário.',
    en: '-x goes through the given proxy URL — essential behind corporate firewalls or to test how traffic exits through an intermediary.' },
  { code: 'curl -s https://api.exemplo.com/items | python3 -m json.tool', cat: 'output',
    pt: 'Sem jq na máquina? O módulo json da propria Python já faz um pretty-print de leitura — um "formatador de JSON" que existe em qualquer sistema com python3.',
    en: 'No jq on the machine? Python\'s built-in json module pretty-prints the output — a "JSON formatter" that exists on any system with python3.' },

  // ─── Receitas do dia a dia ─────────────────────────────────────────────
  { code: "curl -s -X POST https://api.exemplo.com/token -H 'Content-Type: application/json' -d '{\"user\":\"admin\",\"pass\":\"hunter2\"}' | jq -r '.access_token'", cat: 'recipes',
    pt: 'Login + extração: o POST devolve um JSON com o token e o jq arrasta só o campo. O padrão para montar sessões em scripts antes da próxima chamada.',
    en: 'Login + extraction: the POST returns a JSON with the token and jq pulls just the field. The pattern to build sessions in scripts before the next call.' },
  { code: 'curl -s -H "Authorization: Bearer $TOKEN" https://api.exemplo.com/me', cat: 'recipes',
    pt: 'Variável do shell no cabeçalho: com aspas duplas no -H, o $TOKEN é expandido pelo shell antes do curl ver. Aspas simples impediriam a expansão.',
    en: 'Shell variable in the header: with double quotes in -H, $TOKEN is expanded by the shell before curl sees it. Single quotes would block the expansion.' },
  { code: 'curl -s --retry 5 --retry-delay 3 --retry-all-errors -o pacote.zip https://cdn.exemplo.com/pacote.zip', cat: 'recipes',
    pt: 'Resiliência em um comando: --retry tenta de novo até N vezes, --retry-delay espera segundos entre tentativas e --retry-all-errors cobre também erros HTTP (5xx), além das falhas de rede.',
    en: 'Resilience in one command: --retry retries up to N times, --retry-delay waits seconds between attempts and --retry-all-errors also covers HTTP errors (5xx), not only network failures.' },
  { code: "curl -s --max-time 10 -o /dev/null -w '%{http_code}\\n' https://api.exemplo.com/health", cat: 'recipes',
    pt: 'Monitor com limite: --max-time corta a chamada em 10s (sem travar o script numa URL muda) e -w devolve o status para o seu check decidir.',
    en: 'Monitor with a deadline: --max-time kills the call at 10s (no hanging script on a dead URL) and -w returns the status for your check to decide.' },
  { code: "curl -so /dev/null -w '%{time_connect} %{time_starttransfer} %{time_total}\\n' https://api.exemplo.com", cat: 'recipes',
    pt: 'Diagnóstico de latência: tempo até conectar, até o primeiro byte e total — separa a rede do servidor. Se time_connect sobe, o problema é o caminho/roteador; se starttransfer sobe, é o servidor.',
    en: 'Latency diagnosis: time to connect, time to first byte and total — splits network from server. If time_connect rises, the issue is the path/router; if starttransfer rises, it is the server.' },
  { code: "curl -s -c cookies.txt https://exemplo.com/login -d 'usuario=x&senha=y' && curl -s -b cookies.txt https://exemplo.com/painel", cat: 'recipes',
    pt: 'Sessão em duas etapas: a primeira autentica e GRAVA o cookie (-c), a segunda usa o cookie (-b) para a área restrita — login sem navegador, tudo em um pipeline.',
    en: 'Two-step session: the first call authenticates and WRITES the cookie (-c), the second uses that cookie (-b) to reach the restricted area — browserless login, all in one pipeline.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de curl',
    intro: (
      <>
        O cliente HTTP do terminal — a mão universal para testar APIs, baixar
        arquivos, mandar dados e depurar chamadas que o navegador não mostra.
        Cada entrada traz o comando pronto para colar e o que ele faz. Todas
        as URLs abaixo são exemplos: troque pelo seu endpoint.
      </>
    ),
    search: 'Buscar por comando, opção ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'Pegadinhas que pegam todo mundo',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          O <Text code>{'-s'}</Text> esconde a barra de progresso{' '}
          <Text strong>e os erros</Text> — em scripts prefira{' '}
          <Text code>{'-sS'}</Text> (silencioso, mas mantém a mensagem de
          erro).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          Sem <Text code>{'-L'}</Text>, o curl{' '}
          <Text strong>não segue redirecionamentos</Text> (301/302): o
          "corpo vazio" que você vê é só o redirect.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>{'-X POST'}</Text>{' '}
          <Text strong>não monta corpo nem envia dados</Text> — quem vira
          POST automático são <Text code>{'-d'}</Text>,{' '}
          <Text code>{'-F'}</Text>, <Text code>{'-G'}</Text> ou{' '}
          <Text code>{'-T'}</Text>. E combinar <Text code>{'-X POST'}</Text>{' '}
          com <Text code>{'-d'}</Text> pode até derrubar o{' '}
          <Text code>{'Content-Type'}</Text> automático que o{' '}
          <Text code>{'-d'}</Text> montava.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>{'@arquivo'}</Text> lê o corpo do arquivo e{' '}
          <Text code>{'-'}</Text> lê do stdin. O <Text code>{'-d'}</Text>{' '}
          corta o newline final — para corpo byte a byte use{' '}
          <Text code>{'--data-binary'}</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          Payload com <Text code>{'$'}</Text>, aspas ou acentos graves:
          envolva em <Text strong>aspas simples</Text> no shell, senão o
          shell expande antes do curl ver. Ex.:{' '}
          <Text code>{'curl -d \'{"a":"$nao_expande"}\' https://...'}</Text>.
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar comando',
    copiedCode: 'Comando copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'curl Cheat Sheet',
    intro: (
      <>
        The terminal's HTTP client — the universal hand for testing APIs,
        downloading files, sending data and debugging calls the browser
        won't show. Each entry carries a copy-ready command and what it
        does. All URLs below are examples: swap in your own endpoint.
      </>
    ),
    search: 'Search by command, option or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'Gotchas that catch everyone',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>{'-s'}</Text> hides the progress bar{' '}
          <Text strong>and the errors</Text> — in scripts prefer{' '}
          <Text code>{'-sS'}</Text> (silent, but keeps the error message).
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          Without <Text code>{'-L'}</Text>, curl does{' '}
          <Text strong>not follow redirects</Text> (301/302): the "empty
          body" you see is just the redirect.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>{'-X POST'}</Text>{' '}
          <Text strong>does not build a body or send data</Text> — what flips
          the method are <Text code>{'-d'}</Text>, <Text code>{'-F'}</Text>,{' '}
          <Text code>{'-G'}</Text> or <Text code>{'-T'}</Text>. And combining{' '}
          <Text code>{'-X POST'}</Text> with <Text code>{'-d'}</Text> can even
          drop the automatic <Text code>{'Content-Type'}</Text> that{' '}
          <Text code>{'-d'}</Text> was setting.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text code>{'@file'}</Text> reads the body from a file and{' '}
          <Text code>{'-'}</Text> reads from stdin. The <Text code>{'-d'}</Text>{' '}
          trims the trailing newline — for byte-exact bodies use{' '}
          <Text code>{'--data-binary'}</Text>.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          Payloads with <Text code>{'$'}</Text>, quotes or backticks: wrap the
          payload in <Text strong>single quotes</Text> in the shell, otherwise
          the shell expands it before curl sees it. E.g.:{' '}
          <Text code>{'curl -d \'{"a":"$nao_expande"}\' https://...'}</Text>.
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy command',
    copiedCode: 'Command copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function CurlCheatsheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const catCounts = useMemo(() => {
    const counts = { all: ITEMS.length }
    for (const cat of CATEGORIES) {
      counts[cat] = ITEMS.filter((it) => it.cat === cat).length
    }
    return counts
  }, [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ITEMS.filter((it) => {
      if (category !== 'all' && it.cat !== category) return false
      if (!q) return true
      return (
        it.code.toLowerCase().includes(q) ||
        (it[lang] || '').toLowerCase().includes(q)
      )
    })
  }, [query, category, lang, normalized])

  const mdList = useMemo(() => {
    const header = '# curl (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```bash',
          it.code,
          '```',
          '',
          it[lang],
        ].join('\n')
      )
      .join('\n\n---\n\n')
    return header + body
  }, [filtered, lang])

  const copyCode = useCallback(
    async (code) => {
      try {
        await navigator.clipboard.writeText(code)
        messageApi.success(t.copiedCode)
      } catch {
        messageApi.error(t.copyError)
      }
    },
    [messageApi, t]
  )

  const copyMarkdown = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mdList)
      messageApi.success(t.copiedList)
    } catch {
      messageApi.error(t.copyError)
    }
  }, [mdList, messageApi, t])

  const resultLabel = filtered.length === 1 ? t.resultsOne : t.resultsMany

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<SendOutlined />}
        message={t.tipTitle}
        description={t.tipBody}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
          allowClear
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all} ({catCounts.all})</Radio.Button>
          {CATEGORIES.map((cat) => (
            <Radio.Button key={cat} value={cat}>
              {labelOf[cat][lang]} ({catCounts[cat]})
            </Radio.Button>
          ))}
        </Radio.Group>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: 8 }}>
        <Text type="secondary">
          {filtered.length} {resultLabel}
        </Text>
        {filtered.length > 0 && (
          <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown}>
            {t.copy}
          </Button>
        )}
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(item) => (
            <List.Item key={`${item.cat}-${item.code}`}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Tag color={CATEGORY_COLOR[item.cat]}>{labelOf[item.cat][lang]}</Tag>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    title={t.copyCode}
                    onClick={() => copyCode(item.code)}
                  />
                </Space>
                <pre
                  style={{
                    margin: 0,
                    padding: '8px 12px',
                    background: '#f5f5f5',
                    borderRadius: 6,
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: '#262626',
                  }}
                >
                  {item.code}
                </pre>
                <Text type="secondary">{item[lang]}</Text>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}