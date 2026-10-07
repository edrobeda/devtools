import React, { useMemo, useState } from 'react'
import {
  Typography, Card, Space, Input, Button, Segmented, Tag, Alert,
  Statistic, Table, Collapse, message,
} from 'antd'
import {
  LockOutlined, CopyOutlined, ClearOutlined, CheckCircleOutlined,
  InfoCircleOutlined, WarningOutlined, CloseCircleOutlined,
} from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'
import { validateCsp, effectivePolicy, parsePolicies, parseDirectives } from '../utils/cspValidator'

const { Title, Paragraph, Text } = Typography

const SAMPLES = {
  weak: `Content-Security-Policy: default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval' data: http://cdn.exemplo.com; style-src 'unsafe-inline' http:; img-src * data:; object-src 'self'; frame-ancestors *; report-uri /csp-report`,
  strong: `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.exemplo.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests; report-to csp-endpoint`,
  meta: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'nonce-abcd1234'; style-src 'unsafe-inline'; frame-ancestors 'none'; report-uri /csp-report">`,
}

const BASELINE = `default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
report-to csp-endpoint`

// Mensagens dos achados, por código — o motor devolve { severity, code,
// directive, ctx } e a página traduz, mesmo padrão do validador de
// manifestos Kubernetes. Onde aparece {n} entra o ctx do achado.
const PROBLEMS = {
  empty: {
    pt: 'A política está vazia — nenhuma diretiva para validar.',
    en: 'The policy is empty — no directives to validate.',
  },
  multiPolicy: {
    pt: '{n} políticas foram detectadas: o navegador só carrega o recurso se ele passar em TODAS ao mesmo tempo (interseção — vale sempre a mais restritiva).',
    en: '{n} policies detected: the browser only loads a resource if it passes ALL of them at once (intersection — the most restrictive always wins).',
  },
  dupDirective: {
    pt: 'Diretiva repetida; o navegador honra apenas a primeira e ignora as demais.',
    en: 'Duplicate directive; the browser honors only the first and ignores the rest.',
  },
  unknownDirective: {
    pt: 'Diretiva desconhecida; navegadores modernos ignoram em silêncio (provável typo).',
    en: 'Unknown directive; modern browsers silently ignore it (likely a typo).',
  },
  directiveNoValues: {
    pt: 'Diretiva sem nenhuma fonte: lista vazia bloqueia tudo. Se não é a intenção, adicione as fontes permitidas.',
    en: 'Directive with no sources: an empty list blocks everything. If that is not intended, add the allowed sources.',
  },
  deprecatedDirective: {
    pt: 'Diretiva removida ou deprecada nas especificações atuais; navegadores modernos já não a aplicam.',
    en: 'Directive removed or deprecated in current specs; modern browsers no longer enforce it.',
  },
  reportUriDeprecated: {
    pt: 'report-uri está deprecado; prefira report-to, que envia os relatórios para a Reporting API.',
    en: 'report-uri is deprecated; prefer report-to, which sends reports to the Reporting API.',
  },
  unknownKeyword: {
    pt: 'Keyword desconhecida — confira o texto (as válidas são: self, none, unsafe-inline, unsafe-eval, strict-dynamic, unsafe-hashes, wasm-unsafe-eval, report-sample...).',
    en: 'Unknown keyword — check the spelling (valid ones: self, none, unsafe-inline, unsafe-eval, strict-dynamic, unsafe-hashes, wasm-unsafe-eval, report-sample...).',
  },
  invalidToken: {
    pt: 'Token de origem malformado (curinga no meio do host, aspas ou caracteres inválidos) — o navegador ignora ou rejeita a lista.',
    en: 'Malformed source token (wildcard in the middle of the host, quotes or invalid characters) — the browser ignores or rejects the list.',
  },
  unsafeInlineScript: {
    pt: 'script permite inline sem restrição: qualquer <script> injetado passa a valer (o XSS clássico). Migrar pra nonce ou hash.',
    en: 'script allows unrestricted inline: any injected <script> runs (classic XSS). Migrate to nonce or hash.',
  },
  unsafeInlineIgnored: {
    pt: "'unsafe-inline' convive com nonce/hash/strict-dynamic nesta diretiva; navegadores CSP3 o IGNORAM nesse caso — aqui ele só funciona como fallback pra navegadores antigos.",
    en: "'unsafe-inline' sits alongside nonce/hash/strict-dynamic in this directive; CSP3 browsers IGNORE it in that case — here it only works as a legacy fallback.",
  },
  unsafeInlineStyle: {
    pt: "'unsafe-inline' em estilos é comum e costuma ser aceitável, mas impede usar nonce/hash em style-src.",
    en: "'unsafe-inline' for styles is common and usually acceptable, but it blocks using nonce/hash in style-src.",
  },
  unsafeEval: {
    pt: "'unsafe-eval' libera eval() e new Function() — alvo direto de injeção de código.",
    en: "'unsafe-eval' enables eval() and new Function() — a direct target for code injection.",
  },
  dataScript: {
    pt: 'data: em script aceita script inline como data URI — quase sempre indesejado.',
    en: 'data: in script accepts inline scripts as data URIs — almost always undesirable.',
  },
  httpSource: {
    pt: 'Origem via HTTP puro: em página HTTPS o navegador bloqueia por mixed content, e em qualquer página é uma porta aberta em rede não confiável.',
    en: 'Plain HTTP source: on HTTPS pages the browser blocks it as mixed content, and on any page it is an open door on an untrusted network.',
  },
  wildcardScript: {
    pt: '* nesta diretiva de script: qualquer origem do mundo pode servir código pro seu site.',
    en: '* in this script directive: any origin in the world can serve code for your site.',
  },
  wildcardSensitive: {
    pt: '* numa diretiva de navegação: qualquer site pode embebedar, receber POST de formulário ou injetar um <base> — quase sempre é um bug, não uma escolha.',
    en: '* in a navigation directive: any site can embed the page, receive form POSTs or inject a <base> — almost always a bug, not a choice.',
  },
  wildcardOther: {
    pt: '* nesta diretiva permite qualquer origem (inclusive esquemas como http://).',
    en: '* in this directive allows any origin (including schemes like http://).',
  },
  wildcardSubdomain: {
    pt: 'Curinga de subdomínio: vale pra QUALQUER subdomínio, inclusive os esquecidos, desativados ou de terceiros.',
    en: 'Subdomain wildcard: applies to ANY subdomain, including forgotten, decommissioned or third-party ones.',
  },
  frameAncestorsBroad: {
    pt: 'Fonte ampla em frame-ancestors: qualquer site com esse esquema pode embebedar a sua página.',
    en: 'Broad source in frame-ancestors: any site using that scheme can embed your page.',
  },
  noneWithOthers: {
    pt: "'none' está acompanhado de outras fontes: nesse caso ele é ignorado e só as outras valem.",
    en: "'none' sits alongside other sources: in that case it is ignored and only the others count.",
  },
  strictDynamicHosts: {
    pt: "Com 'strict-dynamic', as fontes de hospedagem são IGNORADAS em navegadores CSP3 — elas sobrevivem só como fallback legado.",
    en: "With 'strict-dynamic', host sources are IGNORED by CSP3 browsers — they only survive as a legacy fallback.",
  },
  noDefaultSrc: {
    pt: 'Sem default-src, toda diretiva de fetch ausente fica sem restrição nenhuma (equivale a permitir tudo).',
    en: 'Without default-src, every missing fetch directive has no restriction at all (equivalent to allowing everything).',
  },
  missingObjectSrc: {
    pt: 'Sem object-src e sem default-src: plugins (<object>, <embed>, <applet>) ficam sem restrição. O recomendado é object-src none.',
    en: 'No object-src and no default-src: plugins (<object>, <embed>, <applet>) are unrestricted. The recommended setting is object-src none.',
  },
  missingObjectSrcFallback: {
    pt: "object-src ausente: a diretiva cai no default-src, que não contém 'none' — confirme que conteúdo de plugin é mesmo bloqueado.",
    en: "object-src missing: the directive falls back to default-src, which does not contain 'none' — make sure plugin content is actually blocked.",
  },
  objectSrcNotNone: {
    pt: 'object-src sem none — o valor atual é:',
    en: 'object-src without none — the current value is:',
  },
  noBaseUri: {
    pt: 'Sem base-uri — e essa diretiva NÃO cai no default-src: um <base> injetado redireciona links relativos e actions de formulário.',
    en: 'No base-uri — and this directive does NOT fall back to default-src: an injected <base> redirects relative links and form actions.',
  },
  noFormAction: {
    pt: 'Sem form-action — não cai no default-src: formulários podem postar pra qualquer destino.',
    en: 'No form-action — it does not fall back to default-src: forms can post anywhere.',
  },
  noFrameAncestors: {
    pt: "Sem frame-ancestors: qualquer site pode embebedar a sua página (clickjacking). Alternativa herdada: header X-Frame-Options.",
    en: 'No frame-ancestors: any site can embed your page (clickjacking). Legacy alternative: the X-Frame-Options header.',
  },
  noUpgrade: {
    pt: 'Sem upgrade-insecure-requests: links e recursos http:// não são elevados pra https automaticamente.',
    en: 'No upgrade-insecure-requests: http:// links and resources are not automatically upgraded to https.',
  },
  reportOnlyNoReport: {
    pt: 'Política Report-Only sem report-uri/report-to: ela não bloqueia nada e não reporta nada — não faz efeito prático nenhum.',
    en: 'Report-Only policy with no report-uri/report-to: it neither blocks nor reports anything — it has no practical effect.',
  },
  noReporting: {
    pt: 'Sem report-uri/report-to: violações acontecem em silêncio — nada chega ao painel de relatórios do navegador.',
    en: 'No report-uri/report-to: violations happen silently — nothing reaches the browser reporting panel.',
  },
  ttNoRequire: {
    pt: 'trusted-types definido mas sem require-trusted-types-for: as policies ficam disponíveis, mas nada é exigido dos sinks.',
    en: 'trusted-types defined but without require-trusted-types-for: policies are available, but nothing is required from sinks.',
  },
  ttNoPolicy: {
    pt: "require-trusted-types-for sem nenhuma trusted-types: todo sink de HTML é bloqueado — quase sempre quebra a página inteira.",
    en: 'require-trusted-types-for with no trusted-types at all: every HTML sink is blocked — it usually breaks the whole page.',
  },
  ttPermissive: {
    pt: 'trusted-types permissivo:',
    en: 'Permissive trusted-types:',
  },
  sandboxEmpty: {
    pt: 'sandbox sem tokens: a página roda com todas as restrições ao mesmo tempo (scripts, formulários e popups desligados).',
    en: 'sandbox with no tokens: the page runs with every restriction at once (scripts, forms and popups disabled).',
  },
  metaLimits: {
    pt: 'Política via <meta>: ela vale só pros recursos carregados DEPOIS da tag — não pega o que já foi iniciado antes nem afeta navegação.',
    en: 'Policy via <meta>: it only applies to resources loaded AFTER the tag — it misses anything already started and does not affect navigation.',
  },
  metaIgnored: {
    pt: 'Diretiva ignorada dentro de <meta> — só funciona enviada como header HTTP.',
    en: 'Directive ignored inside <meta> — it only works when sent as an HTTP header.',
  },
  metaNonce: {
    pt: 'nonce/hash não funciona em <meta> de propósito (senão o nonce apareceria no HTML e seria copiado pelo atacante).',
    en: 'nonce/hash does not work in <meta> on purpose (otherwise the nonce would appear in the HTML and be copied by the attacker).',
  },
}

const translations = {
  pt: {
    title: 'Validador de Content-Security-Policy',
    intro: (
      <>
        Cola um cabeçalho <Text code>Content-Security-Policy</Text> — o header
        completo, a versão <Text code>Report-Only</Text>, uma tag{' '}
        <Text code>&lt;meta http-equiv&gt;</Text> ou só a política cru — e a
        página decompõe as diretivas, classifica cada token de origem e aponta
        os problemas em 3 severidades: o que o navegador ignora, o que é
        armadilha e o que é só boa prática. Inclui a tabela de{' '}
        <Text code>default-src</Text> efetivo, mostrando o que cada diretiva
        realmente herda. Tudo roda no navegador: nada sai daqui.
      </>
    ),
    inputTitle: 'Política (CSP)',
    inputHint: 'Aceita header com prefixo, tag meta ou a política sem prefixo.',
    sampleWeak: 'Exemplo fraco',
    sampleStrong: 'Exemplo forte',
    sampleMeta: 'Exemplo <meta>',
    clear: 'Limpar',
    copyPolicy: 'Copiar política',
    copied: 'Copiado!',
    stMode: 'Modo',
    modeEnforced: 'Enforced (bloqueia)',
    modeReportOnly: 'Report-Only (só reporta)',
    sourceHeader: 'header HTTP',
    sourceMeta: 'tag <meta>',
    stPolicies: 'Políticas',
    stDirectives: 'Diretivas',
    stSources: 'Fontes',
    stError: 'Erros',
    stWarning: 'Avisos',
    stInfo: 'Infos',
    sevError: 'Erro',
    sevWarning: 'Aviso',
    sevInfo: 'Info',
    findingsTitle: 'Achados',
    filterAll: 'Todos',
    filterError: 'Erros',
    filterWarning: 'Avisos',
    filterInfo: 'Infos',
    okTitle: 'Nenhum achado nesta política',
    okBody:
      'Nenhuma regra deste validador disparou. Ainda assim, valide no navegador de verdade — por exemplo abrindo DevTools > Console e procurando mensagens de CSP — porque só ele é a autoridade sobre o que a política faz.',
    emptyInput: 'Cole uma política acima ou carregue um dos exemplos.',
    tableTitle: 'Política efetiva (fallback do default-src)',
    tableHint:
      'Cascata real de cada diretiva: o navegador consulta a própria diretiva; se ela não existe, sobe a cadeia (worker-src → child-src → script-src → default-src). base-uri, form-action e frame-ancestors NUNCA caem no default-src — se não estão declaradas, estão livres.',
    colDirective: 'Diretiva',
    colDeclared: 'Declarada',
    colOrigin: 'Origem dos valores',
    colEffective: 'Vale na prática',
    originOwn: 'própria',
    originFallback: (name) => `herda de ${name}`,
    originNone: 'sem restrição',
    originNoFallback: 'não cai no default-src',
    freeAll: 'LIVRE (tudo)',
    baselineTitle: 'Política base sugerida',
    baselineHint:
      "Ponto de partida pragmático: restritiva no essencial, com style-src 'unsafe-inline' (a migração mais chata de todas) e report-to pronto pra quando você configurar o Reporting API. Ajuste connect-src/img-src com as origens reais do seu app.",
    howTitle: 'Como funciona',
    how1: (
      <>
        <Text strong>1. Parsing.</Text> O texto vira política(s): prefixos{' '}
        <Text code>Content-Security-Policy:</Text> e{' '}
        <Text code>-Report-Only:</Text> separam cabeçalhos múltiplos, tag{' '}
        <Text code>&lt;meta&gt;</Text> é reconhecida (com entities decodificadas),
        e o corpo é dividido por <Text code>;</Text> em diretiva + valores.
      </>
    ),
    how2: (
      <>
        <Text strong>2. Classificação de tokens.</Text> Cada valor vira
        keyword (<Text code>'self'</Text>, <Text code>'unsafe-inline'</Text>...),
        nonce/hash, esquema (<Text code>data:</Text>, <Text code>http:</Text>),
        curinga (<Text code>*</Text>) ou host — e tokens malformados (curinga
        no meio do host, keyword com typo) viram erro.
      </>
    ),
    how3: (
      <>
        <Text strong>3. Regras.</Text> A lista de achados cobre segurança
        (inline/eval/data:/curinga), completude (diretivas ausentes e o fato
        de base-uri/form-action/frame-ancestors não herdarem do default-src),
        ciclos de vida (diretivas removidas das specs, report-uri deprecado),
        trusted-types, sandbox e as limitações específicas da tag{' '}
        <Text code>&lt;meta&gt;</Text>.
      </>
    ),
    how4: (
      <>
        <Text strong>4. Limites.</Text> É análise estática heurística,
        100% client-side: ela não executa a política, não verifica o nome do
        grupo em <Text code>report-to</Text> e não substitui um teste real
        (DevTools &gt; Console, ou o relatório de violações) — o navegador
        continua sendo a autoridade.
      </>
    ),
  },
  en: {
    title: 'Content-Security-Policy Validator',
    intro: (
      <>
        Paste a <Text code>Content-Security-Policy</Text> header — the full
        header, the <Text code>Report-Only</Text> version, an{' '}
        <Text code>&lt;meta http-equiv&gt;</Text> tag, or just the bare policy —
        and the page breaks the directives down, classifies every source token
        and flags the issues in 3 severities: what the browser ignores, what is
        a trap, and what is only best practice. It includes the effective{' '}
        <Text code>default-src</Text> table showing what each directive really
        inherits. Everything runs in the browser: nothing leaves here.
      </>
    ),
    inputTitle: 'Policy (CSP)',
    inputHint: 'Accepts a prefixed header, a meta tag, or the bare policy.',
    sampleWeak: 'Weak example',
    sampleStrong: 'Strong example',
    sampleMeta: '<meta> example',
    clear: 'Clear',
    copyPolicy: 'Copy policy',
    copied: 'Copied!',
    stMode: 'Mode',
    modeEnforced: 'Enforced (blocks)',
    modeReportOnly: 'Report-Only (reports only)',
    sourceHeader: 'HTTP header',
    sourceMeta: '<meta> tag',
    stPolicies: 'Policies',
    stDirectives: 'Directives',
    stSources: 'Sources',
    stError: 'Errors',
    stWarning: 'Warnings',
    stInfo: 'Infos',
    sevError: 'Error',
    sevWarning: 'Warning',
    sevInfo: 'Info',
    findingsTitle: 'Findings',
    filterAll: 'All',
    filterError: 'Errors',
    filterWarning: 'Warnings',
    filterInfo: 'Infos',
    okTitle: 'No findings in this policy',
    okBody:
      'None of this validator rules fired. Still, verify in a real browser — open DevTools > Console and look for CSP messages — because the browser is the authority on what the policy actually does.',
    emptyInput: 'Paste a policy above or load one of the examples.',
    tableTitle: 'Effective policy (default-src fallback)',
    tableHint:
      'The real cascade for each directive: the browser checks the directive itself; if it is missing, it walks the chain (worker-src → child-src → script-src → default-src). base-uri, form-action and frame-ancestors NEVER fall back to default-src — if they are not declared, they are unrestricted.',
    colDirective: 'Directive',
    colDeclared: 'Declared',
    colOrigin: 'Where values come from',
    colEffective: 'In effect',
    originOwn: 'own',
    originFallback: (name) => `inherits from ${name}`,
    originNone: 'unrestricted',
    originNoFallback: 'no default-src fallback',
    freeAll: 'FREE (everything)',
    baselineTitle: 'Suggested baseline policy',
    baselineHint:
      "A pragmatic starting point: restrictive where it matters, keeping style-src 'unsafe-inline' (the most annoying migration of all) and report-to ready for when you wire up the Reporting API. Adjust connect-src/img-src with your app's real origins.",
    howTitle: 'How it works',
    how1: (
      <>
        <Text strong>1. Parsing.</Text> The text becomes one or more policies:{' '}
        <Text code>Content-Security-Policy:</Text> and{' '}
        <Text code>-Report-Only:</Text> prefixes split multiple headers, an{' '}
        <Text code>&lt;meta&gt;</Text> tag is recognized (entities decoded), and
        the body is split on <Text code>;</Text> into directive + values.
      </>
    ),
    how2: (
      <>
        <Text strong>2. Token classification.</Text> Each value becomes a
        keyword (<Text code>'self'</Text>, <Text code>'unsafe-inline'</Text>...),
        a nonce/hash, a scheme (<Text code>data:</Text>,{' '}
        <Text code>http:</Text>), a wildcard (<Text code>*</Text>) or a host —
        and malformed tokens (wildcard mid-host, keyword typo) become errors.
      </>
    ),
    how3: (
      <>
        <Text strong>3. Rules.</Text> The findings cover security
        (inline/eval/data:/wildcards), completeness (missing directives and the
        fact that base-uri/form-action/frame-ancestors do not inherit from
        default-src), lifecycle (directives removed from the specs, deprecated
        report-uri), trusted-types, sandbox and the specific limitations of the{' '}
        <Text code>&lt;meta&gt;</Text> tag.
      </>
    ),
    how4: (
      <>
        <Text strong>4. Limits.</Text> This is heuristic static analysis,
        100% client-side: it does not execute the policy, cannot verify the
        group name in <Text code>report-to</Text> and does not replace a real
        test (DevTools > Console, or the violation report) — the browser
        remains the authority.
      </>
    ),
  },
}

const SEV_COLORS = { error: 'red', warning: 'orange', info: 'blue' }

export default function CspValidatorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [text, setText] = useState(SAMPLES.weak)
  const [filter, setFilter] = useState('all')

  const result = useMemo(() => validateCsp(text), [text])
  const { policies, findings, summary } = result

  const rows = useMemo(() => {
    if (policies.length === 0 || policies[0].body.trim() === '') return []
    const dirs = parseDirectives(policies[0].body)
    return effectivePolicy(dirs)
  }, [policies])

  const visible = useMemo(
    () => (filter === 'all' ? findings : findings.filter((f) => f.severity === filter)),
    [findings, filter],
  )

  const problemText = (f) => {
    const entry = PROBLEMS[f.code]
    const base = entry ? entry[lang] : f.code
    const withN = base.replace('{n}', f.ctx)
    if (f.ctx && f.ctx !== f.directive && f.code !== 'multiPolicy') {
      return `${withN} (${f.ctx})`
    }
    return withN
  }

  const sevLabel = (sev) =>
    sev === 'error' ? t.sevError : sev === 'warning' ? t.sevWarning : t.sevInfo

  function copyPolicy() {
    const flat = policies
      .flatMap((p) => parseDirectives(p.body))
      .map((d) => `${d.raw} ${d.values.join(' ')}`.trim())
      .join('; ')
    navigator.clipboard.writeText(flat)
    message.success(t.copied)
  }

  const modeLabel =
    summary.source === 'meta'
      ? t.sourceMeta
      : summary.mode === 'report-only'
        ? t.modeReportOnly
        : summary.mode === 'enforced'
          ? t.modeEnforced
          : t.sourceHeader

  const tableColumns = [
    {
      title: t.colDirective,
      dataIndex: 'name',
      key: 'name',
      render: (v) => <Text code>{v}</Text>,
    },
    {
      title: t.colDeclared,
      dataIndex: 'declared',
      key: 'declared',
      render: (v) =>
        v ? (
          <Space size={4} wrap>
            {v.map((tok, i) => (
              <Tag key={`${tok}-${i}`} style={{ fontFamily: 'monospace' }}>{tok}</Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: t.colOrigin,
      key: 'origin',
      render: (_, row) => {
        if (row.origin === 'own') return <Tag color="blue">{t.originOwn}</Tag>
        if (row.origin === 'fallback') return <Tag color="purple">{t.originFallback(row.originFrom)}</Tag>
        if (row.noFallback) return <Tag color="default">{t.originNoFallback}</Tag>
        return <Tag color="orange">{t.originNone}</Tag>
      },
    },
    {
      title: t.colEffective,
      key: 'effective',
      render: (_, row) => {
        if (row.free) return <Text type="danger" strong>{t.freeAll}</Text>
        return (
          <Space size={4} wrap>
            {row.effective.map((tok, i) => (
              <Tag key={`${tok}-${i}`} style={{ fontFamily: 'monospace' }}>{tok}</Tag>
            ))}
          </Space>
        )
      },
    },
  ]

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><LockOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Card>
        <Space wrap>
          <Button onClick={() => setText(SAMPLES.weak)}>{t.sampleWeak}</Button>
          <Button onClick={() => setText(SAMPLES.strong)}>{t.sampleStrong}</Button>
          <Button onClick={() => setText(SAMPLES.meta)}>{t.sampleMeta}</Button>
          <Button icon={<ClearOutlined />} onClick={() => setText('')}>{t.clear}</Button>
        </Space>
      </Card>

      <Card title={t.inputTitle} extra={<Button size="small" icon={<CopyOutlined />} onClick={copyPolicy} disabled={!text.trim()}>{t.copyPolicy}</Button>}>
        <Input.TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoSize={{ minRows: 4, maxRows: 10 }}
          style={{ fontFamily: 'monospace' }}
          placeholder={t.inputHint}
        />
      </Card>

      <Card>
        <Space size="large" wrap>
          <Statistic title={t.stMode} value={modeLabel} valueStyle={{ fontSize: 16 }} />
          <Statistic title={t.stPolicies} value={summary.policies} />
          <Statistic title={t.stDirectives} value={summary.directives} />
          <Statistic title={t.stSources} value={summary.sources} />
          <Statistic title={t.stError} value={summary.errors} valueStyle={{ color: summary.errors ? '#cf1322' : undefined }} />
          <Statistic title={t.stWarning} value={summary.warnings} valueStyle={{ color: summary.warnings ? '#d46b08' : undefined }} />
          <Statistic title={t.stInfo} value={summary.infos} valueStyle={{ color: summary.infos ? '#096dd9' : undefined }} />
        </Space>
      </Card>

      <Card
        title={t.findingsTitle}
        extra={
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { label: `${t.filterAll} (${findings.length})`, value: 'all' },
              { label: `${t.filterError} (${summary.errors})`, value: 'error' },
              { label: `${t.filterWarning} (${summary.warnings})`, value: 'warning' },
              { label: `${t.filterInfo} (${summary.infos})`, value: 'info' },
            ]}
          />
        }
      >
        {!text.trim() ? (
          <Alert type="info" showIcon message={t.emptyInput} />
        ) : visible.length === 0 ? (
          <Alert
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            message={t.okTitle}
            description={t.okBody}
          />
        ) : (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {visible.map((f, i) => (
              <Alert
                key={`${f.severity}-${f.code}-${f.directive}-${f.ctx}-${i}`}
                type={f.severity}
                showIcon
                icon={
                  f.severity === 'error' ? <CloseCircleOutlined /> :
                  f.severity === 'warning' ? <WarningOutlined /> :
                  <InfoCircleOutlined />
                }
                message={
                  <Space wrap size={6}>
                    <Tag color={SEV_COLORS[f.severity]} style={{ marginRight: 0 }}>
                      {sevLabel(f.severity)}
                    </Tag>
                    {f.directive && (
                      <Tag style={{ fontFamily: 'monospace', marginRight: 0 }}>{f.directive}</Tag>
                    )}
                    <span>{problemText(f)}</span>
                  </Space>
                }
              />
            ))}
          </Space>
        )}
      </Card>

      <Card title={t.tableTitle}>
        <Paragraph type="secondary" style={{ marginTop: 0 }}>{t.tableHint}</Paragraph>
        <Table
          dataSource={rows}
          rowKey="name"
          columns={tableColumns}
          pagination={false}
          size="small"
          scroll={{ x: true }}
        />
      </Card>

      <Card
        title={t.baselineTitle}
        extra={
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(BASELINE)
              message.success(t.copied)
            }}
          >
            {t.copyPolicy}
          </Button>
        }
      >
        <Paragraph type="secondary">{t.baselineHint}</Paragraph>
        <pre style={{ margin: 0, overflowX: 'auto' }}>
          <code>{BASELINE}</code>
        </pre>
      </Card>

      <Collapse
        items={[
          {
            key: 'how',
            label: t.howTitle,
            children: (
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Paragraph style={{ margin: 0 }}>{t.how1}</Paragraph>
                <Paragraph style={{ margin: 0 }}>{t.how2}</Paragraph>
                <Paragraph style={{ margin: 0 }}>{t.how3}</Paragraph>
                <Paragraph style={{ margin: 0 }}>{t.how4}</Paragraph>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}
