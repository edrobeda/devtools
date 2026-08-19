// Decodificador de Assertion / Response SAML 2.0 — 100% client-side.
//
// Aceita como entrada:
//   1. O XML bruto do SAML (começa com "<");
//   2. A string base64 do SAML (o caso clássico do fluxo de SSO, no valor de
//      SAMLResponse= nos formulários de POST do IdP);
//   3. Um corpo de POST completo com "SAMLResponse=..." (com ou sem URL
//      encoding) — extraímos o valor do parâmetro.
//
// O parse é agnóstico de namespace (getElementsByTagNameNS com "*"), então
// funciona com prefixos (samlp/saml) ou sem namespace. Não faz verificação
// criptográfica da assinatura — isso exige a chave pública do IdP e fica
// fora do escopo de uma ferramenta client-side (o Signature é só extraído e
// exibido, com o certificado X.509 quando embutido).

const NS_ANY = '*'

function localName(el) {
  if (!el) return ''
  return el.localName || (el.nodeName || '').replace(/^.*:/, '')
}

function firstEl(el, name) {
  if (!el) return null
  return el.getElementsByTagNameNS(NS_ANY, name)[0] || null
}

function allEls(el, name) {
  if (!el) return []
  return Array.from(el.getElementsByTagNameNS(NS_ANY, name) || [])
}

function text(el) {
  if (!el) return ''
  return (el.textContent || '').trim()
}

function attr(el, name) {
  if (!el) return ''
  const v = el.getAttribute(name)
  return v == null ? '' : v.trim()
}

// Tenta interpretar uma string como base64 e devolver o XML decodificado.
// Retorna null se não parecer base64 ou se o decode não produzir XML.
function tryBase64(s) {
  let cleaned = String(s).replace(/\s+/g, '')
  if (!cleaned) return null
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) return null
  // Repõe o padding quando o emissor cortou os "=" finais.
  const mod = cleaned.length % 4
  if (mod === 2) cleaned += '=='
  else if (mod === 3) cleaned += '='
  try {
    const decoded = atob(cleaned)
    if (decoded.indexOf('<') !== -1 && /<\s*[A-Za-z_]/.test(decoded)) return decoded
  } catch (e) {
    return null
  }
  return null
}

// Normaliza a entrada do usuário em XML SAML (ou devolve o erro).
// Retorna { ok: true, xml } | { ok: false, error: 'empty' | 'invalid' }.
export function prepareInput(raw) {
  let s = String(raw || '').trim()
  if (!s) return { ok: false, error: 'empty' }

  // 1) Já é XML cru.
  if (s.startsWith('<')) return { ok: true, xml: s }

  // 2) Corpo de POST / querystring com SAMLResponse=... (o valor pode vir
  //    com URL-encoding, ex.: application/x-www-form-urlencoded).
  const m = s.match(/(?:^|[?&])SAMLResponse=([^&\s]+)/)
  if (m) {
    let value = m[1].trim()
    try {
      value = decodeURIComponent(value)
    } catch (e) {
      /* já estava decodificado */
    }
    const xml = tryBase64(value)
    if (xml) return { ok: true, xml }
    return { ok: false, error: 'invalid' }
  }

  // 3) Base64 direto.
  const direct = tryBase64(s)
  if (direct) return { ok: true, xml: direct }

  // 4) Base64 com URL-encoding (ex.: + vira %2B ao colar o body cru).
  try {
    const unencoded = decodeURIComponent(s)
    if (unencoded !== s) {
      const encoded = tryBase64(unencoded)
      if (encoded) return { ok: true, xml: encoded }
    }
  } catch (e) {
    /* entrada não é URL-encoded válido — segue para o erro */
  }

  return { ok: false, error: 'invalid' }
}

// Faz o parse do XML SAML e extrai os campos principais.
// Retorna { ok: false, error } ou { ok: true, ...dados }.
export function parseSaml(xmlText) {
  let doc
  try {
    doc = new DOMParser().parseFromString(xmlText, 'application/xml')
  } catch (e) {
    return { ok: false, error: 'xmlParse' }
  }
  if (!doc || !doc.documentElement || localName(doc.documentElement) === 'parsererror') {
    return { ok: false, error: 'xmlParse' }
  }

  const root = doc.documentElement
  const rootName = localName(root)
  if (!['Response', 'Assertion', 'LogoutResponse', 'ArtifactResponse'].includes(rootName)) {
    return { ok: false, error: 'notSaml' }
  }

  // Se o documento for um <Response>, a <Assertion> fica dentro dele. O
  // `<Issuer>` no nível do Response (quando presente) costuma ser do IdP.
  const assertion = rootName === 'Assertion' ? root : firstEl(root, 'Assertion') || root
  const responseIssuer = rootName === 'Assertion' ? '' : text(firstEl(root, 'Issuer'))

  const subjectEl = firstEl(assertion, 'Subject')
  const nameIdEl = firstEl(assertion, 'NameID')
  const subjectConfirmationEl = firstEl(assertion, 'SubjectConfirmation')
  const confDataEl = firstEl(assertion, 'SubjectConfirmationData')

  const conditionsEl = firstEl(assertion, 'Conditions')
  const authnEl = firstEl(assertion, 'AuthnStatement')

  const attributes = []
  allEls(assertion, 'Attribute').forEach((attEl) => {
    attributes.push({
      name: attr(attEl, 'Name'),
      nameFormat: attr(attEl, 'NameFormat'),
      friendlyName: attr(attEl, 'FriendlyName'),
      values: allEls(attEl, 'AttributeValue').map(text),
    })
  })

  return {
    ok: true,
    root: {
      name: rootName,
      id: attr(root, 'ID'),
      version: attr(root, 'Version'),
      issueInstant: attr(root, 'IssueInstant'),
      inResponseTo: attr(root, 'InResponseTo'),
      destination: attr(root, 'Destination'),
    },
    responseIssuer,
    issuer: text(firstEl(assertion, 'Issuer')) || responseIssuer,
    subject: {
      nameId: text(nameIdEl),
      nameIdFormat: attr(nameIdEl, 'Format'),
      nameIdQualifier: attr(nameIdEl, 'SPNameQualifier') || attr(nameIdEl, 'NameQualifier'),
      confirmationMethod: attr(subjectConfirmationEl, 'Method'),
      confirmationData: confDataEl
        ? {
            recipient: attr(confDataEl, 'Recipient'),
            notOnOrAfter: attr(confDataEl, 'NotOnOrAfter'),
            notBefore: attr(confDataEl, 'NotBefore'),
            inResponseTo: attr(confDataEl, 'InResponseTo'),
          }
        : null,
    },
    conditions: {
      notBefore: conditionsEl ? attr(conditionsEl, 'NotBefore') : '',
      notOnOrAfter: conditionsEl ? attr(conditionsEl, 'NotOnOrAfter') : '',
      audiences: conditionsEl ? allEls(conditionsEl, 'Audience').map(text) : [],
    },
    authn: authnEl
      ? {
          authnInstant: attr(authnEl, 'AuthnInstant'),
          sessionIndex: attr(authnEl, 'SessionIndex'),
          contextClassRef: text(firstEl(authnEl, 'AuthnContextClassRef')),
        }
      : null,
    attributes,
    signature: extractSignature(assertion),
  }
}

function extractSignature(assertion) {
  const sigEl = firstEl(assertion, 'Signature')
  if (!sigEl) return null
  return {
    algorithm: attr(firstEl(sigEl, 'SignatureMethod'), 'Algorithm'),
    digestAlgorithm: attr(firstEl(sigEl, 'DigestMethod'), 'Algorithm'),
    digestValue: text(firstEl(sigEl, 'DigestValue')),
    signatureValue: text(firstEl(sigEl, 'SignatureValue')),
    certificate: text(firstEl(sigEl, 'X509Certificate')),
  }
}

// Classifica a janela de validade do assertion.
// Retorna { status: 'valid'|'notYet'|'expired'|'unknown', notBefore, notOnOrAfter }.
export function validityStatus(notBefore, notOnOrAfter, now = new Date()) {
  const nb = notBefore ? new Date(notBefore) : null
  const noa = notOnOrAfter ? new Date(notOnOrAfter) : null
  const nbOk = nb && !Number.isNaN(nb.getTime())
  const noaOk = noa && !Number.isNaN(noa.getTime())
  if (nbOk && now < nb) return { status: 'notYet', notBefore: nb, notOnOrAfter: noaOk ? noa : null }
  if (noaOk && now > noa) return { status: 'expired', notBefore: nbOk ? nb : null, notOnOrAfter: noa }
  if (nbOk || noaOk) return { status: 'valid', notBefore: nbOk ? nb : null, notOnOrAfter: noaOk ? noa : null }
  return { status: 'unknown', notBefore: null, notOnOrAfter: null }
}

// Duração relativa simples em texto ("15 min", "2 h", "3 d"), neutra de
// idioma — a página monta a frase completa (ex.: "em 15 min" / "15 min ago").
export function relativeAmount(date, now = new Date()) {
  if (!date || Number.isNaN(date.getTime())) return '-'
  const diffMs = date.getTime() - now.getTime()
  const absMin = Math.max(0, Math.round(Math.abs(diffMs) / 60000))
  const absHours = Math.max(0, Math.round(Math.abs(diffMs) / 3600000))
  const absDays = Math.max(0, Math.round(Math.abs(diffMs) / 86400000))
  let amount = `${absMin} min`
  if (absHours >= 48) amount = `${absDays} d`
  else if (absHours >= 1) amount = `${absHours} h`
  return amount
}

export function getEngineSource() {
  return [
    '// SAML 2.0 — decode da Assertion/Response, agnóstico de namespace.',
    '// Entrada aceita: XML cru, base64 do XML, ou corpo POST com SAMLResponse=.',
    'const NS = "*"; // getElementsByTagNameNS casa com qualquer namespace',
    '',
    'function text(el) { return (el && el.textContent || "").trim() }',
    'function attr(el, name) { return el && el.getAttribute(name) || "" }',
    'function find(doc, name) { return doc.getElementsByTagNameNS(NS, name)[0] }',
    'function findAll(doc, name) { return Array.from(doc.getElementsByTagNameNS(NS, name) || []) }',
    '',
    'function tryBase64(s) {',
    '  s = String(s).replace(/\\s+/g, "");',
    '  // repõe padding; rejeita chars fora do alfabeto base64',
    '  const d = atob(s);',
    '  return d.indexOf("<") !== -1 ? d : null;',
    '}',
    '',
    'export function decode(raw) {',
    '  let xml = raw.startsWith("<") ? raw : tryBase64(raw);',
    '  const doc = new DOMParser().parseFromString(xml, "application/xml");',
    '  const root = doc.documentElement;',
    '  const assertion = root.localName === "Assertion" ? root : find(root, "Assertion");',
    '  return {',
    '    issuer: text(find(assertion, "Issuer")),',
    '    nameId: text(find(assertion, "NameID")),',
    '    audience: findAll(assertion, "Audience").map(text),',
    '    notBefore: attr(find(assertion, "Conditions"), "NotBefore"),',
    '    notOnOrAfter: attr(find(assertion, "Conditions"), "NotOnOrAfter"),',
    '    attributes: findAll(assertion, "Attribute").map((a) => ({',
    '      name: attr(a, "Name"),',
    '      values: findAll(a, "AttributeValue").map(text),',
    '    })),',
    '    signature: extractSignature(assertion),',
    '  };',
    '}',
    '',
    '// Validação temporal (NotBefore / NotOnOrAfter) vs agora:',
    '//   valid | notYet | expired | unknown.',
  ].join('\n')
}
