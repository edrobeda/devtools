import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ProfileOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORY_LABEL = {
  negotiate: { pt: 'Negociação', en: 'Negotiation' },
  content: { pt: 'Conteúdo / Entity', en: 'Content / Entity' },
  caching: { pt: 'Cache', en: 'Caching' },
  condition: { pt: 'Condicionais', en: 'Conditional' },
  cors: { pt: 'CORS', en: 'CORS' },
  auth: { pt: 'Autenticação', en: 'Authentication' },
  session: { pt: 'Cookies & Sessão', en: 'Cookies & Session' },
  security: { pt: 'Segurança', en: 'Security' },
  transport: { pt: 'Conexão & Transporte', en: 'Connection & Transport' },
  meta: { pt: 'Roteamento & Metadados', en: 'Routing & Metadata' },
}

const CATEGORY_COLOR = {
  negotiate: 'blue',
  content: 'cyan',
  caching: 'gold',
  condition: 'orange',
  cors: 'purple',
  auth: 'geekblue',
  session: 'magenta',
  security: 'green',
  transport: 'volcano',
  meta: 'red',
}

const DIR_LABEL = {
  req: { pt: 'Req', en: 'Req' },
  res: { pt: 'Res', en: 'Res' },
  both: { pt: 'Ambos', en: 'Both' },
}

const DIR_COLOR = { req: 'blue', res: 'green', both: 'magenta' }

// Cada item: dir = req (cliente → servidor) / res (servidor → cliente) / both.
const HEADERS = [
  { name: 'Accept', cat: 'negotiate', dir: 'req', example: 'Accept: application/json, text/plain;q=0.9, */*;q=0.1', pt: 'Quais media types o cliente aceita na resposta, com prioridade opcional por item via o fator q (0–1).', en: 'Which media types the client accepts in the response, with optional per-item priority via the q factor (0–1).' },
  { name: 'Accept-Encoding', cat: 'negotiate', dir: 'req', example: 'Accept-Encoding: gzip, deflate, br', pt: 'Codificações de conteúdo (compressão) aceitas — é o que permite o servidor responder com gzip/brotli.', en: 'Content codings (compression) the client accepts — what lets the server reply with gzip/brotli.' },
  { name: 'Accept-Language', cat: 'negotiate', dir: 'req', example: 'Accept-Language: pt-BR,pt;q=0.9,en;q=0.8', pt: 'Idiomas preferidos do cliente, com prioridade; o servidor pode localizar a resposta de acordo.', en: 'The client’s preferred languages, weighted; the server may localize the response accordingly.' },
  { name: 'Vary', cat: 'negotiate', dir: 'res', example: 'Vary: Accept-Encoding', pt: 'Lista os cabeçalhos de requisição que influenciam a seleção do recurso — um cache compartilhado só reutiliza a resposta se esses cabeçalhos batem.', en: 'Lists the request headers that influence the resource selection — a shared cache may only reuse a response when those headers match.' },
  { name: 'Accept-Ranges', cat: 'negotiate', dir: 'res', example: 'Accept-Ranges: bytes', pt: 'Anuncia que o servidor suporta requisições parciais (Range), permitindo resume de downloads.', en: 'Announces the server supports partial requests (Range), enabling download resumes.' },
  { name: 'Accept-Charset', cat: 'negotiate', dir: 'req', example: 'Accept-Charset: utf-8, iso-8859-1;q=0.5', pt: 'Charsets aceitáveis — raro na prática: quase todo tráfego moderno fixa UTF-8 no Content-Type.', en: 'Acceptable charsets — rare in practice; most modern traffic just relies on the Content-Type charset.' },

  { name: 'Content-Type', cat: 'content', dir: 'both', example: 'Content-Type: application/json; charset=utf-8', pt: 'Media type do corpo (e opcionalmente o charset). É o cabeçalho que define como o corpo é interpretado.', en: 'The media type of the body (and optionally the charset). Defines how the body is interpreted.' },
  { name: 'Content-Length', cat: 'content', dir: 'both', example: 'Content-Length: 348', pt: 'Tamanho do corpo em bytes. Em HTTP/1.1 sem chunked, é o que delimita o fim da mensagem.', en: 'Size of the body in bytes. In HTTP/1.1 without chunked, it delimits the end of the message.' },
  { name: 'Content-Encoding', cat: 'content', dir: 'both', example: 'Content-Encoding: gzip', pt: 'Codificação aplicada ao corpo pelo emissor (gzip, br, deflate). O receptor decodifica antes de usar.', en: 'Coding applied to the body by the sender (gzip, br, deflate). The receiver decodes before use.' },
  { name: 'Content-Language', cat: 'content', dir: 'both', example: 'Content-Language: pt-BR', pt: 'Idioma do público-alvo do corpo — auxilia cache e localização.', en: 'Intended audience language of the body — helps caching and localization.' },
  { name: 'Content-Location', cat: 'content', dir: 'res', example: 'Content-Location: /docs/2026/latest', pt: 'URL canônica do recurso retornado — útil quando a resposta veio de um endereço de conveniência/negociação.', en: 'Canonical URL of the returned resource — useful when the body came from a convenience/negotiated address.' },
  { name: 'Content-Range', cat: 'content', dir: 'res', example: 'Content-Range: bytes 0-1023/2048', pt: 'Numa resposta 206, indica qual trecho do recurso está sendo enviado (início-fim/total).', en: 'In a 206 Partial Content response, tells which range of the resource is being sent.' },
  { name: 'Content-Disposition', cat: 'content', dir: 'res', example: 'Content-Disposition: attachment; filename="relatorio.pdf"', pt: 'Diz se o corpo vai aparecer inline ou vira download, com sugestão de nome de arquivo.', en: 'Tells the browser to show the body inline or trigger a download, with a suggested filename.' },
  { name: 'Range', cat: 'content', dir: 'req', example: 'Range: bytes=0-1023', pt: 'Pede só um trecho do recurso; o servidor responde 206 com Content-Range quando suporta.', en: 'Asks for only part of the resource; the server replies 206 with Content-Range when supported.' },

  { name: 'Cache-Control', cat: 'caching', dir: 'both', example: 'Cache-Control: public, max-age=3600, must-revalidate', pt: 'O comando-central de cache: public/private, no-cache, no-store, max-age, s-maxage, must-revalidate, stale-while-revalidate…', en: 'The central caching directive: public/private, no-cache, no-store, max-age, s-maxage, must-revalidate, stale-while-revalidate…' },
  { name: 'Expires', cat: 'caching', dir: 'res', example: 'Expires: Wed, 21 Oct 2026 07:28:00 GMT', pt: 'Data de validade do HTTP/1.0 — é ignorada quando há Cache-Control com max-age.', en: 'HTTP/1.0 freshness date — ignored whenever Cache-Control has max-age.' },
  { name: 'Age', cat: 'caching', dir: 'res', example: 'Age: 3600', pt: 'Quantos segundos a representação passou num cache intermediário desde a origem.', en: 'How many seconds the representation has sat in an intermediate cache since the origin.' },
  { name: 'ETag', cat: 'caching', dir: 'res', example: 'ETag: "33a64df5-7734"', pt: 'Validador forte (opaco) do recurso — o cliente devolve em If-None-Match/If-Match pra revalidar.', en: 'Strong opaque validator of the resource — the client echoes it in If-None-Match/If-Match to revalidate.' },
  { name: 'Last-Modified', cat: 'caching', dir: 'res', example: 'Last-Modified: Sun, 09 Aug 2026 07:28:00 GMT', pt: 'Validador fraco por data — o parceiro de If-Modified-Since na revalidação.', en: 'A weak, date-based validator — the counterpart of If-Modified-Since for revalidation.' },

  { name: 'If-None-Match', cat: 'condition', dir: 'req', example: 'If-None-Match: "33a2df5-7734"', pt: '“Só responde se meu ETag não bateu”: a revalidação clássica de cache — devolve 304 quando o texto casa.', en: '“Only reply if my validator does not match”: the classic cache revalidation — returns 304 when it matches.' },
  { name: 'If-Match', cat: 'condition', dir: 'req', example: 'If-Match: "bfc0093a2b"', pt: 'Executa a operação só se o validador ainda for o mesmo — concorrência otimista em PUT/DELETE.', en: 'Run the request only if the validator still matches — optimistic concurrency on PUT/DELETE.' },
  { name: 'If-Modified-Since', cat: 'condition', dir: 'req', example: 'If-Modified-Since: Sun, 09 Aug 2026 07:28:00 GMT', pt: 'Revalidação por data: devolve 304 se o recurso não mudou desde a data informada.', en: 'Date-based revalidation: 304 if the resource has not changed since the given date.' },
  { name: 'If-Unmodified-Since', cat: 'condition', dir: 'req', example: 'If-Unmodified-Since: Sun, 09 Aug 2026 07:28:00 GMT', pt: 'Proteção contra sobreescrita: executa só se o recurso NÃO mudou desde a data.', en: 'Overwrite protection: only run if the resource has NOT changed since the date.' },
  { name: 'If-Range', cat: 'condition', dir: 'req', example: 'If-Range: "33a2df5-7734"', pt: 'Combina com Range: retoma o download só enquanto o validador for o mesmo; senão devolve o corpo inteiro.', en: 'Pairs with Range: resumes the download only while the validator is unchanged — otherwise the full body is returned.' },

  { name: 'Origin', cat: 'cors', dir: 'req', example: 'Origin: https://www.eventifylab.com', pt: 'Origem (esquema+host+porta) de onde parte a requisição cross-origin — o que dispara a engrenagem CORS.', en: 'The origin (scheme+host+port) sending the cross-origin request — what triggers CORS handling.' },
  { name: 'Access-Control-Allow-Origin', cat: 'cors', dir: 'res', example: 'Access-Control-Allow-Origin: https://app.eventifylab.com', pt: 'Quais origens o navegador pode liberar — origem exata (exigido quando há credenciais) ou * sem credenciais.', en: 'Which origins the browser may allow — an exact origin (required with credentials) or * without.' },
  { name: 'Access-Control-Allow-Methods', cat: 'cors', dir: 'res', example: 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE', pt: 'Métodos permitidos na requisição cross-origin.', en: 'Methods allowed on the cross-origin request.' },
  { name: 'Access-Control-Allow-Headers', cat: 'cors', dir: 'res', example: 'Access-Control-Allow-Headers: Content-Type, Authorization', pt: 'Cabeçalhos de requisição customizados que o navegador pode enviar.', en: 'Custom request headers the browser is allowed to send.' },
  { name: 'Access-Control-Expose-Headers', cat: 'cors', dir: 'res', example: 'Access-Control-Expose-Headers: X-Total-Count', pt: 'Quais cabeçalhos de resposta customizados o script pode ler.', en: 'Which custom response headers the script is allowed to read.' },
  { name: 'Access-Control-Allow-Credentials', cat: 'cors', dir: 'res', example: 'Access-Control-Allow-Credentials: true', pt: 'Habilita cookies/credentials — exige Allow-Origin de origem específica (nunca *).', en: 'Enables cookies/credentials — requires a specific Allow-Origin (never *).' },
  { name: 'Access-Control-Max-Age', cat: 'cors', dir: 'res', example: 'Access-Control-Max-Age: 600', pt: 'Por quanto tempo (segundos) o navegador pode reusar o resultado do preflight.', en: 'How long (seconds) the browser may reuse the preflight result.' },
  { name: 'Access-Control-Request-Method', cat: 'cors', dir: 'req', example: 'Access-Control-Request-Method: PUT', pt: 'No preflight OPTIONS, o método que o navegador pretende enviar de verdade.', en: 'In the preflight OPTIONS, the method the browser is about to actually use.' },
  { name: 'Access-Control-Request-Headers', cat: 'cors', dir: 'req', example: 'Access-Control-Request-Headers: authorization', pt: 'No preflight, a lista de cabeçalhos cross-origin planejados para o pedido real.', en: 'In the preflight, the planned custom headers of the actual request.' },

  { name: 'Authorization', cat: 'auth', dir: 'req', example: 'Authorization: Bearer eyJhbGciOi...', pt: 'Credencial de acesso — Bearer token, Basic base64(usuário:senha), Digest…', en: 'Access credential — Bearer token, Basic base64(user:pass), Digest…' },
  { name: 'WWW-Authenticate', cat: 'auth', dir: 'res', example: 'WWW-Authenticate: Basic realm="restricted"', pt: 'Acompanha o 401: avisa que o servidor exige autenticação e informa o esquema/desafio.', en: 'Paired with 401: tells the server requires authentication and the challenge scheme.' },
  { name: 'Proxy-Authorization', cat: 'auth', dir: 'req', example: 'Proxy-Authorization: Basic dXNlcjpwYXNz', pt: 'Credencial enviada a um proxy que exige autenticação (que responde 407).', en: 'Credential sent to a proxy that requires authentication (which answers 407).' },
  { name: 'Proxy-Authenticate', cat: 'auth', dir: 'res', example: 'Proxy-Authenticate: Basic realm="corp"', pt: 'Desafio de autenticação do proxy (acompanha o status 407).', en: 'Authentication challenge from a proxy (paired with status 407).' },

  { name: 'Set-Cookie', cat: 'session', dir: 'res', example: 'Set-Cookie: id=a3f2; Path=/; Secure; HttpOnly; SameSite=Lax', pt: 'Manda o navegador criar/atualizar um cookie — com os atributos Secure, HttpOnly e SameSite.', en: 'Orders the browser to set/update a cookie — with the Secure, HttpOnly and SameSite attributes.' },
  { name: 'Cookie', cat: 'session', dir: 'req', example: 'Cookie: id=a3f2; theme=dark', pt: 'O que o navegador devolve automaticamente dos cookies guardados para aquele domínio.', en: 'Cookies the browser automatically sends back for that domain.' },

  { name: 'Strict-Transport-Security', cat: 'security', dir: 'res', example: 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload', pt: 'Obriga o navegador a usar só HTTPS para aquele domínio por max-age segundos.', en: 'Forces the browser to use HTTPS-only for the domain for max-age seconds.' },
  { name: 'Content-Security-Policy', cat: 'security', dir: 'res', example: "Content-Security-Policy: default-src 'self'; img-src 'self' data:; script-src 'self'", pt: 'Restringe o que a página pode carregar/executar (origens de script, img, style…) — mitiga XSS.', en: 'Restricts what the page may load/execute (script, img, style…) — mitigates XSS.' },
  { name: 'X-Frame-Options', cat: 'security', dir: 'res', example: 'X-Frame-Options: DENY', pt: 'Evita clickjacking: bloqueia a página em frame/iframe (DENY ou SAMEORIGIN).', en: 'Prevents clickjacking: blocks the page inside a frame/iframe (DENY or SAMEORIGIN).' },
  { name: 'X-Content-Type-Options', cat: 'security', dir: 'res', example: 'X-Content-Type-Options: nosniff', pt: 'Impede o navegador de “adivinhar” o MIME (sniffing) e executar conteúdo do tipo errado.', en: 'Stops the browser from guessing the MIME type (sniffing) and executing the wrong content.' },
  { name: 'Referrer-Policy', cat: 'security', dir: 'res', example: 'Referrer-Policy: strict-origin-when-cross-origin', pt: 'Controla quanto da URL vaza no Referer quando o usuário navega para outro site.', en: 'Controls how much of the URL leaks into the Referer when leaving to another site.' },
  { name: 'Permissions-Policy', cat: 'security', dir: 'res', example: 'Permissions-Policy: camera=(), microphone=(), geolocation=()', pt: 'Desliga APIs de navegador por origem (câmera, mic, geolocalização…) sem pedir permissão.', en: 'Disables browser APIs per origin (camera, microphone, geolocation…) without permission prompts.' },
  { name: 'Cross-Origin-Opener-Policy', cat: 'security', dir: 'res', example: 'Cross-Origin-Opener-Policy: same-origin', pt: 'Isola a página de janelas de outras origens que a abriram — reforça o isolamento de processos.', en: 'Isolates the page from cross-origin openers — hardens process isolation.' },
  { name: 'Cross-Origin-Resource-Policy', cat: 'security', dir: 'res', example: 'Cross-Origin-Resource-Policy: same-origin', pt: 'Define quem pode embutir o recurso de outras origens (complementa o COOP).', en: 'Defines who may embed the resource cross-origin (complements COOP).' },
  { name: 'X-XSS-Protection', cat: 'security', dir: 'res', example: 'X-XSS-Protection: 0', pt: 'Deprecated: era o filtro de XSS do navegador; hoje se recomenda CSP de verdade.', en: 'Deprecated legacy XSS filter; the modern recommendation is a real CSP instead.' },

  { name: 'Connection', cat: 'transport', dir: 'both', example: 'Connection: keep-alive', pt: 'Controla a persistência da conexão em HTTP/1.1 (keep-alive/close) e tokens hop-by-hop.', en: 'Controls HTTP/1.1 connection persistence (keep-alive/close) and hop-by-hop tokens.' },
  { name: 'Keep-Alive', cat: 'transport', dir: 'both', example: 'Keep-Alive: timeout=5, max=1000', pt: 'Detalhes da conexão persistente: timeout de inatividade e máximo de requisições.', en: 'Persistent-connection details: idle timeout and max requests.' },
  { name: 'Transfer-Encoding', cat: 'transport', dir: 'both', example: 'Transfer-Encoding: chunked', pt: 'Emoldura o corpo em blocos (chunked) — usado quando o tamanho só é conhecido no final.', en: 'Frames the body in chunks — used when the size is only known at the end.' },
  { name: 'Upgrade', cat: 'transport', dir: 'req', example: 'Upgrade: websocket', pt: 'Pede troca de protocolo na conexão — a base do handshake de WebSocket.', en: 'Requests a protocol switch on the connection — the basis of the WebSocket handshake.' },
  { name: 'Upgrade-Insecure-Requests', cat: 'transport', dir: 'req', example: 'Upgrade-Insecure-Requests: 1', pt: 'Sinal do navegador de que prefere HTTPS — deixa o servidor redirecionar para a versão segura.', en: 'Browser signal that it prefers HTTPS — lets the server redirect to the secure version.' },

  { name: 'Host', cat: 'meta', dir: 'req', example: 'Host: devtools.eventifylab.com', pt: 'Domínio/porta de destino — obrigatório em HTTP/1.1; é o que permite vários sites no mesmo IP.', en: 'Target domain/port — mandatory in HTTP/1.1; what enables many sites on one IP.' },
  { name: 'Date', cat: 'meta', dir: 'both', example: 'Date: Sun, 09 Aug 2026 07:28:00 GMT', pt: 'Data/hora em que o servidor de origem enviou a mensagem — obrigatório em HTTP/1.1.', en: 'The date/time the origin sent the message — mandatory in HTTP/1.1.' },
  { name: 'User-Agent', cat: 'meta', dir: 'req', example: 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36', pt: 'Identifica o software do cliente (navegador, bot, curl…) que fez a requisição.', en: 'Identifies the client software (browser, bot, curl…) making the request.' },
  { name: 'Referer', cat: 'meta', dir: 'req', example: 'Referer: https://devtools.eventifylab.com/', pt: 'URL de onde a requisição partiu (o typo “Referer” é o nome oficial da spec).', en: 'The URL the request came from (the “Referer” typo is the official spec name).' },
  { name: 'From', cat: 'meta', dir: 'req', example: 'From: webmaster@eventifylab.com', pt: 'E-mail de contato de quem faz a requisição — mais usado por bots e crawlers, obrigatório pra bots bem-comportados.', en: 'Contact e-mail of the requester — mostly used by bots; required by well-behaved crawlers.' },
  { name: 'Location', cat: 'meta', dir: 'res', example: 'Location: /users/123', pt: 'O destino do redirecionamento (3xx) ou onde vive o recurso recém-criado (201).', en: 'Target of a redirect (3xx) or where a newly created resource lives (201).' },
  { name: 'Retry-After', cat: 'meta', dir: 'res', example: 'Retry-After: 120', pt: 'Quanto tempo esperar antes de tentar de novo — usado por 429 (rate limit) e 503.', en: 'How long to wait before retrying — used by 429 (rate limit) and 503.' },
  { name: 'Allow', cat: 'meta', dir: 'res', example: 'Allow: GET, HEAD, OPTIONS', pt: 'Métodos permitidos no recurso — acompanha o 405 Method Not Allowed.', en: 'Methods allowed on the resource — paired with 405 Method Not Allowed.' },
  { name: 'Server', cat: 'meta', dir: 'res', example: 'Server: nginx/1.24.3', pt: 'Identifica o software do servidor de origem; remover reduz a superfície de fingerprinting.', en: 'Identifies the origin server software; hiding it shrinks the fingerprinting surface.' },

  { name: 'X-Forwarded-For', cat: 'meta', dir: 'req', example: 'X-Forwarded-For: 203.0.113.10, 10.0.0.4', pt: 'Lista de IPs reais do cliente acumulada pelos proxies — de facto standard, só confiável se a cadeia for confiável.', en: 'De facto list of client IPs accumulated by proxies — trustworthy only when the forwarding chain is trusted.' },
  { name: 'X-Forwarded-Proto', cat: 'meta', dir: 'req', example: 'X-Forwarded-Proto: https', pt: 'O esquema original (http/https) da requisição antes de passar pelo proxy.', en: 'The original scheme (http/https) of the request before it hit the proxy.' },
  { name: 'X-Forwarded-Host', cat: 'meta', dir: 'req', example: 'X-Forwarded-Host: example.com', pt: 'O Host original da requisição quando o proxy reescreve o Host.', en: 'The original Host header when the proxy rewrote it.' },
  { name: 'Forwarded', cat: 'meta', dir: 'req', example: 'Forwarded: for=203.0.113.10;proto=https;by=203.0.113.43', pt: 'A versão padronizada (RFC 7239) do X-Forwarded-*, combinando for/proto/host.', en: 'The standardized (RFC 7239) version of X-Forwarded-*, combining for/proto/host.' },
  { name: 'X-Request-ID', cat: 'meta', dir: 'both', example: 'X-Request-ID: 4f0a9c2e-77b1-4d29-a5e311', pt: 'Identificador de rastreio que acompanha a requisição pelo backend inteiro (correlação de logs).', en: 'Trace identifier carried through the whole backend for log correlation.' },
]

const translations = {
  pt: {
    title: 'Cabeçalhos HTTP',
    intro: (
      <>
        Referência pesquisável dos cabeçalhos HTTP do dia a dia — o nome, o
        sentido (requisição/resposta), um valor de exemplo e o que ele faz.
        Complementa o <Text code>/references/http-methods</Text> (os métodos)
        e o <Text code>/references/http-status-codes</Text> (as respostas).
        Tudo client-side, nada sai do navegador.
      </>
    ),
    search: 'Buscar por nome, valor ou descrição...',
    all: 'Todos',
    empty: 'Nenhum cabeçalho encontrado com esse filtro.',
    legendReq: 'Req = enviado na requisição (cliente → servidor)',
    legendRes: 'Res = enviado na resposta (servidor → cliente)',
    legendBoth: 'Ambos = serve nos dois sentidos',
    tipTitle: 'Cabeçalhos trabalham em pares — e têm pegadinha',
    tipBody: (
      <>
        Boa parte disto só funciona <Text strong>em pares</Text>: o{' '}
        <Text code>ETag</Text> mandado pelo servidor volta como{' '}
        <Text code>If-None-Match</Text> na requisição seguinte (revalidação de
        cache → 304), e o <Text code>Set-Cookie</Text> da resposta vira{' '}
        <Text code>Cookie</Text> no próximo pedido. No CORS, o servidor precisa
        responder com <Text code>Access-Control-Allow-*</Text> coerentes tanto
        no preflight (<Text code>OPTIONS</Text>) quanto na resposta{' '}
        <Text strong>real</Text> — esquecer um dos dois derruba a chamada no
        navegador. E o prefixo <Text code>X-</Text>: cabeçalhos como{' '}
        <Text code>X-Forwarded-For</Text> são padrão <Text strong>de facto</Text>{' '}
        (usados na prática, não na spec) — valem quando a cadeia de proxies é
        confiável, nunca confie cegamente vinda da internet.
      </>
    ),
    copy: 'Copiar exemplo',
    copied: 'Valor copiado',
    copyList: 'Copiar lista filtrada (Markdown)',
    copiedList: 'Tabela Markdown copiada',
    copyError: 'Não foi possível copiar',
    results: (n) => `${n} ${n === 1 ? 'cabeçalho' : 'cabeçalhos'}`,
  },
  en: {
    title: 'HTTP Headers',
    intro: (
      <>
        A searchable reference of the everyday HTTP headers — the name, the
        direction (request/response), an example value and what it does.
        Complements <Text code>/references/http-methods</Text> (the methods)
        and <Text code>/references/http-status-codes</Text> (the responses).
        All client-side, nothing leaves the browser.
      </>
    ),
    search: 'Search by name, value or description...',
    all: 'All',
    empty: 'No header found with this filter.',
    legendReq: 'Req = sent in the request (client → server)',
    legendRes: 'Res = sent in the response (server → client)',
    legendBoth: 'Both = either direction',
    tipTitle: 'Headers work in pairs — and have gotchas',
    tipBody: (
      <>
        Much of this only works <Text strong>in pairs</Text>: the server’s{' '}
        <Text code>ETag</Text> comes back as <Text code>If-None-Match</Text>{' '}
        on the next request (cache revalidation → 304), and the{' '}
        <Text code>Set-Cookie</Text> turns into a <Text code>Cookie</Text> on
        the following one. With CORS, the server must reply with matching{' '}
        <Text code>Access-Control-Allow-*</Text> in both the preflight ({' '}
        <Text code>OPTIONS</Text>) response and the <Text strong>actual</Text>{' '}
        response — missing either breaks the call in the browser. And about
        the <Text code>X-</Text> prefix: headers such as{' '}
        <Text code>X-Forwarded-For</Text> are{' '}
        <Text strong>de facto</Text> standards (used in practice, not in the
        spec) — trust them only when the proxy chain is trusted.
      </>
    ),
    copy: 'Copy example',
    copied: 'Value copied',
    copyList: 'Copy filtered list (Markdown)',
    copiedList: 'Markdown table copied',
    copyError: 'Could not copy',
    results: (n) => `${n} ${n === 1 ? 'header' : 'headers'}`,
  },
}

export default function HttpHeadersPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return HEADERS.filter((h) => {
      if (category !== 'all' && h.cat !== category) return false
      if (!q) return true
      const hay = [
        h.name,
        h.example,
        lang === 'pt' ? h.pt : h.en,
        CATEGORY_LABEL[h.cat][lang],
      ]
        .map((s) => s.toLowerCase())
        .join(' ')
      return hay.includes(q)
    })
  }, [query, category, lang, normalized])

  const mdTable = useMemo(() => {
    const head = '| Header | Direction | Example | Description |\n|---|---|---|---|\n'
    const rows = filtered
      .map((h) => {
        const dir = DIR_LABEL[h.dir][lang]
        const desc = (lang === 'pt' ? h.pt : h.en).replace(/\|/g, '\\|')
        return `| \`${h.name}\` | ${dir} | \`${h.example.replace(/\|/g, '\\|')}\` | ${desc} |`
      })
      .join('\n')
    return head + rows
  }, [filtered, lang])

  async function copyItem(text, okMessage) {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(okMessage)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  function copyMarkdown() {
    copyItem(mdTable, t.copiedList)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<ProfileOutlined />} message={t.tipTitle} description={t.tipBody} />

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
          {Object.keys(CATEGORY_LABEL).map((cat) => (
            <Radio.Button key={cat} value={cat}>{CATEGORY_LABEL[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
        <Space wrap size={[4, 0]}>
          <Tag color={DIR_COLOR.req}>{t.legendReq}</Tag>
          <Tag color={DIR_COLOR.res}>{t.legendRes}</Tag>
          <Tag color={DIR_COLOR.both}>{t.legendBoth}</Tag>
        </Space>
      </Space>

      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text type="secondary">{t.results(filtered.length)}</Text>
        <Button size="small" icon={<CopyOutlined />} onClick={copyMarkdown} disabled={filtered.length === 0}>
          {t.copyList}
        </Button>
      </Space>

      <Card>
        <List
          dataSource={filtered}
          locale={{ emptyText: t.empty }}
          renderItem={(h) => (
            <List.Item
              key={h.name + h.pt}
              actions={[
                <Button
                  key="copy"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() =>
                    copyItem(`${h.name}: ${h.example}`, t.copied)
                  }
                >
                  {t.copy}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space wrap style={{ rowGap: 6 }}>
                    <Tag color={DIR_COLOR[h.dir]}>{DIR_LABEL[h.dir][lang]}</Tag>
                    <Tag color={CATEGORY_COLOR[h.cat]}>{CATEGORY_LABEL[h.cat][lang]}</Tag>
                    <Text code style={{ fontSize: 13 }}>{h.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>
                      {h.example}
                    </Text>
                  </Space>
                }
                description={(lang === 'pt' ? h.pt : h.en)}
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}