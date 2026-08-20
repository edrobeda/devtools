// Xbox XPath Tester — motor de avaliação de XPath 1.0 100% no navegador.
//
// Estratégia: o próprio navegador já tem um avaliador XPath nativo
// (document.evaluate). O que este motor faz é conectar as pontas da forma
// robusta: parsear o XML com DOMParser, montar um resolver de namespaces a
// partir de pares prefixo=uri digitados pelo usuário, pedir o resultado em
// um tipo que funcione tanto pra expressões que retornam nós quanto pras que
// retornam escalar (count(), string(), boolean()), e destilar tudo em um
// objeto simples pra página renderizar. Nenhum dado sai do navegador.

const K_NUMBER = 1
const K_STRING = 2
const K_BOOLEAN = 3
const K_UNORDERED_ITERATOR = 4
const K_ORDERED_ITERATOR = 5
const K_UNORDERED_SNAPSHOT = 6
const K_ORDERED_SNAPSHOT = 7
const K_ANY_UNORDERED = 8
const K_FIRST_ORDERED = 9

// Normaliza o bloco de namespaces digitado pelo usuário.
// Aceita "prefixo=uri", "prefixo: uri" e "prefixo uri" — uma por linha.
// Devolve { map: {prefixo: uri}, errors: [msg] } com as linhas ignoradas.
export function parseNamespaceLines(text) {
  const map = {}
  const errors = []
  String(text || '')
    .split('\n')
    .forEach((raw, lineIdx) => {
      const line = raw.trim()
      if (!line || line.startsWith('#')) return
      const m = line.match(/^([A-Za-z_][\w.-]*)\s*[:=]\s*(.+)$/) || line.match(/^([A-Za-z_][\w.-]*)\s+(\S+.*)$/)
      if (!m) {
        errors.push({
          line: lineIdx + 1,
          text: line,
          code: 'badformat',
        })
        return
      }
      const prefix = m[1]
      const uri = m[2].trim().replace(/^["']|["']$/g, '')
      if (!uri) {
        errors.push({ line: lineIdx + 1, text: line, code: 'emptyuri' })
        return
      }
      map[prefix] = uri
    })
  return { map, errors }
}

// Monta a função de resolver de namespace que o document.evaluate espera.
export function buildResolver(prefixMap) {
  return (prefix) => (prefixMap[prefix] != null ? prefixMap[prefix] : null)
}

// Parseia XML com DOMParser. Devolve { ok: true, doc } ou
// { ok: false, error } (DOMParser não lança: ele embute um <parsererror>).
export function parseXml(xmlText) {
  const text = String(xmlText || '')
  if (!text.trim()) return { ok: false, error: 'empty' }
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const errNode = doc.querySelector('parsererror')
  if (errNode) {
    const snippet = (errNode.textContent || '').trim().split('\n')[0]
    return { ok: false, error: snippet }
  }
  return { ok: true, doc }
}

function isNodeResultType(t) {
  return (
    t === K_UNORDERED_ITERATOR ||
    t === K_ORDERED_ITERATOR ||
    t === K_UNORDERED_SNAPSHOT ||
    t === K_ORDERED_SNAPSHOT ||
    t === K_ANY_UNORDERED ||
    t === K_FIRST_ORDERED
  )
}

function collectNodes(result) {
  const nodes = []
  if (result.resultType === K_ORDERED_SNAPSHOT || result.resultType === K_UNORDERED_SNAPSHOT) {
    for (let i = 0; i < result.snapshotLength; i++) {
      const n = result.snapshotItem(i)
      if (n) nodes.push(n)
    }
  } else if (result.resultType === K_ORDERED_ITERATOR || result.resultType === K_UNORDERED_ITERATOR) {
    let n = result.iterateNext()
    while (n) {
      nodes.push(n)
      n = result.iterateNext()
    }
  } else if (result.resultType === K_FIRST_ORDERED) {
    if (result.singleNodeValue) nodes.push(result.singleNodeValue)
  }
  return nodes
}

// Serializa um nó DOM (XMLDocument) de volta pra string XML.
export function serializeNode(node) {
  if (!node) return ''
  try {
    if (node.nodeType === 1 || node.nodeType === 9) {
      return new XMLSerializer().serializeToString(node)
    }
    if (node.nodeType === 2) {
      return `${node.nodeName}="${node.nodeValue}"`
    }
    if (node.nodeType === 3 || node.nodeType === 4) {
      return node.nodeValue || ''
    }
    return node.nodeValue || `[${node.nodeName}]`
  } catch {
    return ''
  }
}

// Caminho em notação XPath aproximada pro nó (ajuda a localizar na árvore).
export function nodePath(node) {
  const parts = []
  let cur = node.nodeType === 2 ? node.ownerElement : node
  while (cur && cur.nodeType === 1) {
    const name = cur.nodeName
    const idx = xpathIndexWithinParent(cur)
    parts.unshift(idx === 1 ? `/${name}` : `/${name}[${idx}]`)
    cur = cur.parentNode
  }
  return (parts.length ? parts.join('') : '/') + (node.nodeType === 2 ? `/@${node.nodeName}` : '')
}

function xpathIndexWithinParent(node) {
  let count = 0
  let cur = node
  while (cur) {
    if (cur.nodeType === 1 && cur.nodeName === node.nodeName) count += 1
    cur = cur.previousSibling
  }
  return count
}

// Primeiro pedaço de texto de um nó (pra prévia da lista).
export function nodePreview(node) {
  if (node.nodeType === 2) return node.nodeValue || ''
  if (node.nodeType === 3 || node.nodeType === 4) return node.nodeValue || ''
  if (node.nodeType === 1) {
    const txt = (node.textContent || '').trim().replace(/\s+/g, ' ')
    return txt.length > 120 ? `${txt.slice(0, 120)}…` : txt
  }
  return ''
}

// Avalia a expressão XPath contra o doc. Os nós coletados são convertidos em
// objetos simples ({ path, xml, preview, nodeType, nodeName }) pra a página
// não depender do DOM na renderização. Devolve:
//   { ok: true, kind: 'nodes', count, nodes }
//   { ok: true, kind: 'scalar', value, scalarType }
//   { ok: false, error }
export function evaluateXpath(doc, xpath, resolver) {
  const expr = String(xpath || '').trim()
  if (!expr) return { ok: false, error: 'empty' }
  if (!doc) return { ok: false, error: 'noparse' }
  let result
  try {
    result = document.evaluate(expr, doc, resolver || null, XPathResult.ANY_TYPE, null)
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) }
  }
  if (result.resultType === K_NUMBER) {
    return { ok: true, kind: 'scalar', scalarType: 'number', value: result.numberValue }
  }
  if (result.resultType === K_STRING) {
    return { ok: true, kind: 'scalar', scalarType: 'string', value: result.stringValue }
  }
  if (result.resultType === K_BOOLEAN) {
    return { ok: true, kind: 'scalar', scalarType: 'boolean', value: result.booleanValue }
  }
  if (isNodeResultType(result.resultType)) {
    const nodes = collectNodes(result).map((n) => ({
      path: nodePath(n),
      xml: serializeNode(n),
      preview: nodePreview(n),
      nodeType: n.nodeType === 2 ? 'attribute' : n.nodeType === 3 || n.nodeType === 4 ? 'text' : 'element',
      nodeName: n.nodeName,
    }))
    return { ok: true, kind: 'nodes', count: nodes.length, nodes }
  }
  return { ok: false, error: `Tipo de resultado não suportado (${result.resultType})` }
}

export function getEngineSource() {
  return [
    '// Aproveita o avaliador XPath que o navegador já tem (document.evaluate),',
    '// conectando as pontas: parse do XML, resolver de namespaces e leitura',
    '// dos tipos de resultado (nós / string / número / booleano).',
    '',
    'const doc = new DOMParser().parseFromString(xml, "application/xml");',
    'const resolver = (p) => namespaces[p] || null;   // prefixo -> uri',
    '',
    'export function evaluateXpath(doc, expr, resolver) {',
    '  const result = document.evaluate(expr, doc, resolver,',
    '    XPathResult.ANY_TYPE, null);',
    '  switch (result.resultType) {',
    '    case XPathResult.NUMBER_TYPE:  return result.numberValue;',
    '    case XPathResult.STRING_TYPE:  return result.stringValue;',
    '    case XPathResult.BOOLEAN_TYPE: return result.booleanValue;',
    '    default: {',
    '      const nodes = [];',
    '      for (let i = 0; i < result.snapshotLength; i++)',
    '        nodes.push(result.snapshotItem(i));',
    '      return nodes;',
    '    }',
    '  }',
    '}',
    '',
    '// Expressões que retornam nós dão snapshot (ou iterator); escalares dão',
    '// os tipos acima. O snapshot só existe enquanto o resultado está vivo,',
    '// então a coleção é copiada imediatamente.',
  ].join('\n')
}

// Exemplos prontos pra página começar com conteúdo útil.
export const XPATH_SAMPLES = [
  {
    key: 'saml',
    label: 'SAML Assertion',
    xml: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"',
      '                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"',
      '                    ID="response-abc123" Version="2.0"',
      '                    IssueInstant="2026-08-19T14:32:00Z">',
      '  <saml:Issuer>https://idp.eventifylab.com</saml:Issuer>',
      '  <samlp:Status>',
      '    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>',
      '  </samlp:Status>',
      '  <saml:Assertion ID="assertion-def456" Version="2.0">',
      '    <saml:Issuer>https://idp.eventifylab.com</saml:Issuer>',
      '    <saml:Subject>',
      '      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">',
      '        joana@exemplo.com</saml:NameID>',
      '      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">',
      '        <saml:SubjectConfirmationData NotOnOrAfter="2026-08-19T14:42:00Z"',
      '          Recipient="https://app.eventifylab.com/acs"/>',
      '      </saml:SubjectConfirmation>',
      '    </saml:Subject>',
      '    <saml:AuthnStatement AuthnInstant="2026-08-19T14:30:00Z">',
      '      <saml:AuthnContext>',
      '        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password',
      '        </saml:AuthnContextClassRef>',
      '      </saml:AuthnContext>',
      '    </saml:AuthnStatement>',
      '    <saml:AttributeStatement>',
      '      <saml:Attribute Name="email"><saml:AttributeValue>joana@exemplo.com',
      '      </saml:AttributeValue></saml:Attribute>',
      '      <saml:Attribute Name="groups"><saml:AttributeValue>devtools',
      '      </saml:AttributeValue></saml:Attribute>',
      '    </saml:AttributeStatement>',
      '  </saml:Assertion>',
      '</samlp:Response>',
    ].join('\n'),
    ns: 'samlp=urn:oasis:names:tc:SAML:2.0:protocol\nsaml=urn:oasis:names:tc:SAML:2.0:assertion',
    xpath: '//saml:AttributeStatement/saml:Attribute/@Name',
  },
  {
    key: 'soap',
    label: 'SOAP Envelope',
    xml: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<soap:Envelope',
      '   xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"',
      '   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '   xmlns:xsd="http://www.w3.org/2001/XMLSchema">',
      '  <soap:Body>',
      '    <ListarPedidosResponse xmlns="http://temporada.dev/soap">',
      '      <Pedido>',
      '        <Id>1024</Id>',
      '        <Status>Enviado</Status>',
      '      </Pedido>',
      '      <Pedido>',
      '        <Id>2048</Id>',
      '        <Status>Pago</Status>',
      '      </Pedido>',
      '    </ListarPedidosResponse>',
      '  </soap:Body>',
      '</soap:Envelope>',
    ].join('\n'),
    ns: 'soap=http://schemas.xmlsoap.org/soap/envelope/',
    xpath: '//soap:Body//*[local-name()="Pedido"]/Id',
  },
  {
    key: 'config',
    label: 'Config XML',
    xml: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<configuration>',
      '  <server host="backend-01" port="8080" env="prod">',
      '    <timeout>30s</timeout>',
      '    <retries>3</retries>',
      '  </server>',
      '  <server host="backend-02" port="8080" env="prod">',
      '    <timeout>15s</timeout>',
      '    <retries>5</retries>',
      '  </server>',
      '  <database>',
      '    <url>postgres://…</url>',
      '    <pool>',
      '      <min>5</min>',
      '      <max>50</max>',
      '    </pool>',
      '  </database>',
      '</configuration>',
    ].join('\n'),
    ns: '',
    xpath: '//server[@env="prod"]/@host',
  },
  {
    key: 'rss',
    label: 'RSS Feed',
    xml: [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '  <channel>',
      '    <title>DevTools Blog</title>',
      '    <item>',
      '      <title>XPath no dia a dia</title>',
      '      <category>Ferramentas</category>',
      '      <pubDate>Tue, 19 Aug 2026</pubDate>',
      '    </item>',
      '    <item>',
      '      <title>Depuração de SAML</title>',
      '      <category>Segurança</category>',
      '      <pubDate>Mon, 18 Aug 2026</pubDate>',
      '    </item>',
      '  </channel>',
      '</rss>',
    ].join('\n'),
    ns: '',
    xpath: 'count(//item[category="Ferramentas"])',
  },
]