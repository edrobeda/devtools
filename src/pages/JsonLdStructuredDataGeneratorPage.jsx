import React, { useMemo, useState } from 'react'
import { Typography, Card, Space, Input, Select, Checkbox, Alert, Collapse, Row, Col, Button, message, Tag } from 'antd'
import { CopyOutlined, ApartmentOutlined, UndoOutlined, PlusOutlined, DeleteOutlined, ExperimentOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const AVAIL_OPTS = ['InStock', 'OutOfStock', 'PreOrder', 'BackOrder', 'SoldOut']
const MODE_OPTS = ['OfflineEventAttendanceMode', 'OnlineEventAttendanceMode', 'MixedEventAttendanceMode']

const splitLines = (s) => String(s || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
const splitCsv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean)
const trim = (s) => String(s || '').trim()
const num = (s) => {
  if (String(s).trim() === '') return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}

function offer(v, url) {
  const price = num(v.price)
  const currency = trim(v.currency)
  const availability = v.available ? `https://schema.org/${v.available}` : undefined
  if (price === undefined && !currency && !availability) return undefined
  return { '@type': 'Offer', price, priceCurrency: currency || undefined, availability, url: url || undefined }
}

function aggregateRating(v) {
  const ratingValue = num(v.ratingValue)
  const ratingCount = num(v.ratingCount)
  if (ratingValue === undefined || ratingCount === undefined) return undefined
  return { '@type': 'AggregateRating', ratingValue, ratingCount }
}

const TEMPLATES = [
  {
    key: 'website',
    labelKey: 'typeWebsite',
    fields: [
      { key: 'name', labelKey: 'fName', kind: 'text' },
      { key: 'url', labelKey: 'fUrl', kind: 'url' },
      { key: 'description', labelKey: 'fDesc', kind: 'textarea' },
      { key: 'searchUrl', labelKey: 'fSearchUrl', kind: 'url' },
    ],
    example: {
      name: 'DevTools',
      url: 'https://devtools.eventifylab.com/',
      description: 'Ferramentas internas de desenvolvimento: geradores, conversores, cheatsheets e padrões visuais.',
      searchUrl: 'https://devtools.eventifylab.com/busca?q={search_term_string}',
    },
    build: (v) => ({
      '@type': 'WebSite',
      name: trim(v.name),
      url: trim(v.url),
      description: trim(v.description),
      potentialAction: trim(v.searchUrl)
        ? {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: trim(v.searchUrl) },
            'query-input': 'required name=search_term_string',
          }
        : undefined,
    }),
  },
  {
    key: 'organization',
    labelKey: 'typeOrganization',
    fields: [
      { key: 'name', labelKey: 'fName', kind: 'text' },
      { key: 'url', labelKey: 'fUrl', kind: 'url' },
      { key: 'logo', labelKey: 'fLogo', kind: 'url' },
      { key: 'email', labelKey: 'fEmail', kind: 'text' },
      { key: 'phone', labelKey: 'fPhone', kind: 'text' },
      { key: 'address', labelKey: 'fAddr', kind: 'text' },
      { key: 'sameAs', labelKey: 'fSameAs', kind: 'textarea' },
    ],
    example: {
      name: 'Eventify Lab',
      url: 'https://eventifylab.com/',
      logo: 'https://eventifylab.com/logo.png',
      email: 'contato@eventifylab.com',
      phone: '+55 11 4002-8922',
      address: 'Av. Paulista, 1000, São Paulo - SP',
      sameAs: 'https://github.com/eventifylab\nhttps://www.linkedin.com/company/eventifylab',
    },
    build: (v) => ({
      '@type': 'Organization',
      name: trim(v.name),
      url: trim(v.url),
      logo: trim(v.logo),
      email: trim(v.email),
      telephone: trim(v.phone),
      address: trim(v.address) ? { '@type': 'PostalAddress', streetAddress: trim(v.address) } : undefined,
      sameAs: splitLines(v.sameAs),
    }),
  },
  {
    key: 'person',
    labelKey: 'typePerson',
    fields: [
      { key: 'name', labelKey: 'fName', kind: 'text' },
      { key: 'jobTitle', labelKey: 'fJobTitle', kind: 'text' },
      { key: 'url', labelKey: 'fUrl', kind: 'url' },
      { key: 'email', labelKey: 'fEmail', kind: 'text' },
      { key: 'image', labelKey: 'fImage', kind: 'url' },
      { key: 'worksFor', labelKey: 'fWorksFor', kind: 'text' },
      { key: 'sameAs', labelKey: 'fSameAs', kind: 'textarea' },
    ],
    example: {
      name: 'Maria Souza',
      jobTitle: 'Engenheira de Software',
      url: 'https://devtools.eventifylab.com/',
      email: 'maria@eventifylab.com',
      image: 'https://devtools.eventifylab.com/avatar.png',
      worksFor: 'Eventify Lab',
      sameAs: 'https://github.com/mariasouza',
    },
    build: (v) => ({
      '@type': 'Person',
      name: trim(v.name),
      jobTitle: trim(v.jobTitle),
      url: trim(v.url),
      image: trim(v.image),
      email: trim(v.email),
      sameAs: splitLines(v.sameAs),
      worksFor: trim(v.worksFor) ? { '@type': 'Organization', name: trim(v.worksFor) } : undefined,
    }),
  },
  {
    key: 'article',
    labelKey: 'typeArticle',
    fields: [
      { key: 'name', labelKey: 'fHeadline', kind: 'text' },
      { key: 'description', labelKey: 'fDesc', kind: 'textarea' },
      { key: 'url', labelKey: 'fUrl', kind: 'url' },
      { key: 'image', labelKey: 'fImage', kind: 'url' },
      { key: 'author', labelKey: 'fAuthor', kind: 'text' },
      { key: 'publisher', labelKey: 'fPublisher', kind: 'text' },
      { key: 'published', labelKey: 'fPublished', kind: 'date' },
      { key: 'modified', labelKey: 'fModified', kind: 'date' },
      { key: 'keywords', labelKey: 'fKeywords', kind: 'text' },
    ],
    example: {
      name: 'Entendendo Structured Data por dentro',
      description: 'Como o JSON-LD do schema.org transforma um link em um resultado rico nos buscadores.',
      url: 'https://blog.eventifylab.com/entendendo-structured-data',
      image: 'https://blog.eventifylab.com/assets/og.png',
      author: 'Maria Souza',
      publisher: 'Eventify Lab',
      published: '2026-09-12',
      modified: '2026-09-12',
      keywords: 'seo, json-ld, schema.org',
    },
    build: (v) => ({
      '@type': 'Article',
      headline: trim(v.name),
      description: trim(v.description),
      url: trim(v.url),
      image: trim(v.image),
      keywords: splitCsv(v.keywords),
      author: trim(v.author) ? { '@type': 'Person', name: trim(v.author) } : undefined,
      publisher: trim(v.publisher) ? { '@type': 'Organization', name: trim(v.publisher) } : undefined,
      datePublished: trim(v.published),
      dateModified: trim(v.modified),
      mainEntityOfPage: trim(v.url) ? { '@type': 'WebPage', '@id': trim(v.url) } : undefined,
    }),
  },
  {
    key: 'product',
    labelKey: 'typeProduct',
    fields: [
      { key: 'name', labelKey: 'fName', kind: 'text' },
      { key: 'description', labelKey: 'fDesc', kind: 'textarea' },
      { key: 'url', labelKey: 'fUrl', kind: 'url' },
      { key: 'image', labelKey: 'fImage', kind: 'url' },
      { key: 'sku', labelKey: 'fSku', kind: 'text' },
      { key: 'brand', labelKey: 'fBrand', kind: 'text' },
      { key: 'price', labelKey: 'fPrice', kind: 'number' },
      { key: 'currency', labelKey: 'fCurrency', kind: 'text' },
      { key: 'available', labelKey: 'fAvailable', kind: 'select', options: AVAIL_OPTS },
      { key: 'ratingValue', labelKey: 'fRatingValue', kind: 'number' },
      { key: 'ratingCount', labelKey: 'fRatingCount', kind: 'number' },
    ],
    example: {
      name: 'Teclado Mecânico RGB',
      description: 'Teclado mecânico com switches red e iluminação RGB por tecla.',
      url: 'https://shop.eventifylab.com/teclado-rgb',
      image: 'https://shop.eventifylab.com/assets/teclado.png',
      sku: 'KB-RGB-001',
      brand: 'EventifyKey',
      price: '499.90',
      currency: 'BRL',
      available: 'InStock',
      ratingValue: '4.7',
      ratingCount: '128',
    },
    build: (v) => ({
      '@type': 'Product',
      name: trim(v.name),
      description: trim(v.description),
      url: trim(v.url),
      image: trim(v.image),
      sku: trim(v.sku),
      brand: trim(v.brand) ? { '@type': 'Brand', name: trim(v.brand) } : undefined,
      offers: offer(v, trim(v.url)),
      aggregateRating: aggregateRating(v),
    }),
  },
  {
    key: 'event',
    labelKey: 'typeEvent',
    fields: [
      { key: 'name', labelKey: 'fName', kind: 'text' },
      { key: 'description', labelKey: 'fDesc', kind: 'textarea' },
      { key: 'url', labelKey: 'fUrl', kind: 'url' },
      { key: 'image', labelKey: 'fImage', kind: 'url' },
      { key: 'start', labelKey: 'fStart', kind: 'date' },
      { key: 'end', labelKey: 'fEnd', kind: 'date' },
      { key: 'mode', labelKey: 'fMode', kind: 'select', options: MODE_OPTS },
      { key: 'locName', labelKey: 'fLocName', kind: 'text' },
      { key: 'locAddr', labelKey: 'fLocAddr', kind: 'text' },
      { key: 'price', labelKey: 'fPrice', kind: 'number' },
      { key: 'currency', labelKey: 'fCurrency', kind: 'text' },
      { key: 'available', labelKey: 'fAvailable', kind: 'select', options: AVAIL_OPTS },
    ],
    example: {
      name: 'Tech Conference 2026',
      description: 'A conferência anual da comunidade.',
      url: 'https://events.eventifylab.com/tech2026',
      image: 'https://events.eventifylab.com/assets/banner.png',
      start: '2026-11-10T09:00:00-03:00',
      end: '2026-11-11T18:00:00-03:00',
      mode: 'MixedEventAttendanceMode',
      locName: 'Centro de Convenções',
      locAddr: 'Av. Paulista, 1000, São Paulo - SP',
      price: '299',
      currency: 'BRL',
      available: 'InStock',
    },
    build: (v) => ({
      '@type': 'Event',
      name: trim(v.name),
      description: trim(v.description),
      url: trim(v.url),
      image: trim(v.image),
      startDate: trim(v.start),
      endDate: trim(v.end),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: v.mode ? `https://schema.org/${v.mode}` : undefined,
      location: trim(v.locName) || trim(v.locAddr)
        ? {
            '@type': 'Place',
            name: trim(v.locName),
            address: trim(v.locAddr) ? { '@type': 'PostalAddress', streetAddress: trim(v.locAddr) } : undefined,
          }
        : undefined,
      offers: offer(v, trim(v.url)),
    }),
  },
  {
    key: 'faq',
    labelKey: 'typeFaq',
    fields: [],
    example: {},
    build: (v, faq) => ({
      '@type': 'FAQPage',
      mainEntity: faq
        .filter((f) => trim(f.q) || trim(f.a))
        .map((f) => ({
          '@type': 'Question',
          name: trim(f.q),
          acceptedAnswer: { '@type': 'Answer', text: trim(f.a) },
        })),
    }),
  },
  {
    key: 'breadcrumb',
    labelKey: 'typeBreadcrumb',
    fields: [],
    example: {},
    build: (v, faq, crumbs) => ({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs
        .filter((c) => trim(c.name) || trim(c.url))
        .map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: trim(c.name),
          item: trim(c.url),
        })),
    }),
  },
  {
    key: 'software',
    labelKey: 'typeSoftware',
    fields: [
      { key: 'name', labelKey: 'fName', kind: 'text' },
      { key: 'url', labelKey: 'fUrl', kind: 'url' },
      { key: 'description', labelKey: 'fDesc', kind: 'textarea' },
      { key: 'category', labelKey: 'fCategory', kind: 'text' },
      { key: 'os', labelKey: 'fOs', kind: 'text' },
      { key: 'price', labelKey: 'fPrice', kind: 'number' },
      { key: 'currency', labelKey: 'fCurrency', kind: 'text' },
      { key: 'ratingValue', labelKey: 'fRatingValue', kind: 'number' },
      { key: 'ratingCount', labelKey: 'fRatingCount', kind: 'number' },
    ],
    example: {
      name: 'DevTools Suite',
      url: 'https://devtools.eventifylab.com/',
      description: 'Um espaço genérico de ferramentas internas de desenvolvimento.',
      category: 'DeveloperApplication',
      os: 'Web',
      price: '0',
      currency: 'USD',
      ratingValue: '4.9',
      ratingCount: '2048',
    },
    build: (v) => ({
      '@type': 'SoftwareApplication',
      name: trim(v.name),
      url: trim(v.url),
      description: trim(v.description),
      applicationCategory: trim(v.category),
      operatingSystem: trim(v.os),
      offers: offer(v, trim(v.url)),
      aggregateRating: aggregateRating(v),
    }),
  },
  {
    key: 'business',
    labelKey: 'typeBusiness',
    fields: [
      { key: 'name', labelKey: 'fName', kind: 'text' },
      { key: 'url', labelKey: 'fUrl', kind: 'url' },
      { key: 'description', labelKey: 'fDesc', kind: 'textarea' },
      { key: 'image', labelKey: 'fImage', kind: 'url' },
      { key: 'phone', labelKey: 'fPhone', kind: 'text' },
      { key: 'address', labelKey: 'fAddr', kind: 'text' },
      { key: 'priceRange', labelKey: 'fPriceRange', kind: 'text' },
      { key: 'hours', labelKey: 'fHours', kind: 'text' },
      { key: 'lat', labelKey: 'fLat', kind: 'number' },
      { key: 'lng', labelKey: 'fLng', kind: 'number' },
    ],
    example: {
      name: 'Café do Dev',
      url: 'https://maps.eventifylab.com/cafe-do-dev',
      description: 'Cafeteria artesanal perto do escritório.',
      image: 'https://maps.eventifylab.com/assets/cafe.png',
      phone: '+55 11 4002-8922',
      address: 'Rua Augusta, 250, São Paulo - SP',
      priceRange: '$$',
      hours: 'Mo-Fr 08:00-19:00',
      lat: '-23.5557714',
      lng: '-46.6495833',
    },
    build: (v) => ({
      '@type': 'LocalBusiness',
      name: trim(v.name),
      url: trim(v.url),
      description: trim(v.description),
      image: trim(v.image),
      telephone: trim(v.phone),
      priceRange: trim(v.priceRange),
      openingHours: trim(v.hours) ? [trim(v.hours)] : undefined,
      address: trim(v.address) ? { '@type': 'PostalAddress', streetAddress: trim(v.address) } : undefined,
      geo: num(v.lat) !== undefined && num(v.lng) !== undefined
        ? { '@type': 'GeoCoordinates', latitude: num(v.lat), longitude: num(v.lng) }
        : undefined,
    }),
  },
]

function buildGraph(type, v, faq, crumbs) {
  const tpl = TEMPLATES.find((x) => x.key === type)
  const body = tpl ? tpl.build(v, faq, crumbs) : {}
  return { '@context': 'https://schema.org', ...body }
}

function collectTypes(obj, out) {
  if (Array.isArray(obj)) {
    obj.forEach((x) => collectTypes(x, out))
  } else if (obj && typeof obj === 'object') {
    if (obj['@type']) out.push(obj['@type'])
    Object.values(obj).forEach((x) => collectTypes(x, out))
  }
  return out
}

const translations = {
  pt: {
    title: 'Gerador de Structured Data (JSON-LD / schema.org)',
    intro:
      'Monte o script <script type="application/ld+json"> com dados estruturados do schema.org — WebSite, Organization, Article, Product, Event, FAQ, Breadcrumb e mais — pronto pra colar no <head> da página. 100% client-side, nada sai do navegador.',
    typeCard: '1 · Escolha o tipo de schema',
    formCard: '2 · Campos',
    optionsCard: '3 · Saída',
    wrapLabel: 'Embrulhar no script (recomendado)',
    minify: 'Minificar (1 linha)',
    output: 'JSON-LD gerado',
    copy: 'Copiar',
    copied: 'JSON-LD copiado!',
    example: 'Preencher exemplo',
    clear: 'Limpar campos',
    summary: 'Resumo do que foi gerado',
    summaryEmpty: 'Preencha algum campo para ver o resumo',
    keysCount: (n) => `${n} chaves no nível raiz`,
    lines: (n) => `${n} linhas`,
    bytes: (n) => `${n} bytes`,
    empty: '// escolha o tipo e preencha os campos',
    tipTitle: 'Como o JSON-LD se comporta',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>JSON-LD vive no <Text code>&lt;head&gt;</Text></Text>: cole o script gerado entre{' '}
          <Text code>&lt;head&gt;</Text>...<Text code>&lt;/head&gt;</Text> — buscadores (Google, Bing) leem sem
          executar nada. Valide no <Text strong>Rich Results Test</Text> do Google antes de publicar.
        </li>
        <li>
          <Text strong>Número nos campos numéricos</Text>: <Text code>price</Text>,{' '}
          <Text code>ratingValue</Text> e afins viram números na saída — o Google ignora strings onde espera
          Number.
        </li>
        <li>
          <Text strong>Datas em ISO 8601</Text>: use <Text code>2026-09-12</Text> ou{' '}
          <Text code>2026-09-12T09:00:00-03:00</Text> — evite formatos no estilo brasileiro.
        </li>
        <li>
          <Text strong>Campo vazio some da saída</Text>: o builder adiciona <Text code>Offer</Text>,{' '}
          <Text code>AggregateRating</Text>, <Text code>Person</Text> etc. apenas quando os campos deles têm
          valor.
        </li>
        <li>
          <Text strong>FAQPage destaca no Google</Text> e precisa de pergunta + resposta reais — páginas com FAQ
          "enxuto de texto" foram desqualificadas em mudança de diretriz de 2023.
        </li>
      </ul>
    ),
    sourceCol: 'Algoritmo-fonte',
    sourceBody:
      'Cada tipo de schema é um template com campos e um builder puro: o builder monta o objeto e o JSON.stringify(formato bonito/minificado) faz o resto. undefined some da serialização — é por isso que campo vazio não entra na saída.',
    typeWebsite: 'Site (WebSite)',
    typeOrganization: 'Organização (Organization)',
    typePerson: 'Pessoa (Person)',
    typeArticle: 'Artigo (Article)',
    typeProduct: 'Produto (Product)',
    typeEvent: 'Evento (Event)',
    typeFaq: 'Perguntas frequentes (FAQPage)',
    typeBreadcrumb: 'Trilha de navegação (BreadcrumbList)',
    typeSoftware: 'Aplicativo (SoftwareApplication)',
    typeBusiness: 'Negócio local (LocalBusiness)',
    fName: 'Nome',
    fUrl: 'URL',
    fDesc: 'Descrição',
    fImage: 'Imagem (URL)',
    fSearchUrl: 'URL de busca (target)',
    searchUrlHint: 'use {search_term_string} no lugar da query — ex.: /busca?q={search_term_string}',
    fLogo: 'Logo (URL)',
    fEmail: 'E-mail',
    fPhone: 'Telefone',
    fAddr: 'Endereço',
    fSameAs: 'Perfis sociais (um por linha)',
    fJobTitle: 'Cargo',
    fWorksFor: 'Empresa (worksFor)',
    fHeadline: 'Manchete (headline)',
    fAuthor: 'Autor',
    fPublisher: 'Publicador',
    fPublished: 'Publicado em',
    fModified: 'Modificado em',
    fKeywords: 'Palavras-chave (separadas por vírgula)',
    fSku: 'SKU',
    fBrand: 'Marca',
    fPrice: 'Preço',
    fCurrency: 'Moeda (ISO 4217)',
    fAvailable: 'Disponibilidade',
    fRatingValue: 'Nota média',
    fRatingCount: 'Qtd. de avaliações',
    fStart: 'Início (data/hora)',
    fEnd: 'Fim (data/hora)',
    fMode: 'Modo de participação',
    fLocName: 'Local (nome)',
    fLocAddr: 'Local (endereço)',
    fCategory: 'Categoria da aplicação',
    fOs: 'Sistema operacional',
    fPriceRange: 'Faixa de preço (ex.: $$)',
    fHours: 'Horário (ex.: "Mo-Fr 09:00-18:00")',
    fLat: 'Latitude',
    fLng: 'Longitude',
    faqCard: 'Perguntas e respostas (FAQPage)',
    faqQuestion: 'Pergunta',
    faqAnswer: 'Resposta',
    addFaq: 'Adicionar pergunta',
    remove: 'Remover',
    crumbCard: 'Itens da trilha (BreadcrumbList)',
    crumbName: 'Nome',
    crumbUrl: 'URL',
    addCrumb: 'Adicionar item',
  },
  en: {
    title: 'Structured Data Generator (JSON-LD / schema.org)',
    intro:
      'Assembles a schema.org JSON-LD <script> block — WebSite, Organization, Article, Product, Event, FAQ, Breadcrumb and more — ready to paste into the page <head>. 100% client-side, nothing leaves the browser.',
    typeCard: '1 · Pick the schema type',
    formCard: '2 · Fields',
    optionsCard: '3 · Output',
    wrapLabel: 'Wrap in <script> tag (recommended)',
    minify: 'Minify (single line)',
    output: 'Generated JSON-LD',
    copy: 'Copy',
    copied: 'JSON-LD copied!',
    example: 'Fill with sample data',
    clear: 'Clear fields',
    summary: 'Generated summary',
    summaryEmpty: 'Fill in a field to see the summary',
    keysCount: (n) => `${n} top-level keys`,
    lines: (n) => `${n} line${n === 1 ? '' : 's'}`,
    bytes: (n) => `${n} bytes`,
    empty: '// pick a type and fill the fields',
    tipTitle: 'How JSON-LD behaves',
    tipBody: (
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>
          <Text strong>JSON-LD lives in the <Text code>&lt;head&gt;</Text></Text>: paste the generated script
          between <Text code>&lt;head&gt;</Text> and <Text code>&lt;/head&gt;</Text> — search engines read it
          without executing anything. Validate with Google's <Text strong>Rich Results Test</Text> before going
          live.
        </li>
        <li>
          <Text strong>Numbers stay numbers</Text>: <Text code>price</Text>,{' '}
          <Text code>ratingValue</Text> and friends become JSON numbers — Google ignores strings where a Number
          is expected.
        </li>
        <li>
          <Text strong>Dates in ISO 8601</Text>: use <Text code>2026-09-12</Text> or{' '}
          <Text code>2026-09-12T09:00:00-03:00</Text> — avoid localized formats.
        </li>
        <li>
          <Text strong>Empty fields drop out</Text>: the builder only adds <Text code>Offer</Text>,{' '}
          <Text code>AggregateRating</Text>, <Text code>Person</Text> etc. when their fields have values.
        </li>
        <li>
          <Text strong>FAQPage gets rich results</Text> and requires real question/answer pairs — pages with
          thin FAQ content were de-qualified in the 2023 guideline change.
        </li>
      </ul>
    ),
    sourceCol: 'Source code',
    sourceBody:
      'Each schema type is a template with fields and a pure builder: the builder assembles the object and JSON.stringify (pretty/minified) does the rest. undefined disappears from serialization — that is why empty fields never reach the output.',
    typeWebsite: 'Website (WebSite)',
    typeOrganization: 'Organization (Organization)',
    typePerson: 'Person (Person)',
    typeArticle: 'Article (Article)',
    typeProduct: 'Product (Product)',
    typeEvent: 'Event (Event)',
    typeFaq: 'FAQ page (FAQPage)',
    typeBreadcrumb: 'Breadcrumb (BreadcrumbList)',
    typeSoftware: 'App (SoftwareApplication)',
    typeBusiness: 'Local Business (LocalBusiness)',
    fName: 'Name',
    fUrl: 'URL',
    fDesc: 'Description',
    fImage: 'Image (URL)',
    fSearchUrl: 'Search URL (target)',
    searchUrlHint: 'use {search_term_string} where the query goes — e.g. /search?q={search_term_string}',
    fLogo: 'Logo (URL)',
    fEmail: 'E-mail',
    fPhone: 'Telephone',
    fAddr: 'Address',
    fSameAs: 'Social profiles (one per line)',
    fJobTitle: 'Job title',
    fWorksFor: 'Employer (worksFor)',
    fHeadline: 'Headline',
    fAuthor: 'Author',
    fPublisher: 'Publisher',
    fPublished: 'Published at',
    fModified: 'Modified at',
    fKeywords: 'Keywords (comma separated)',
    fSku: 'SKU',
    fBrand: 'Brand',
    fPrice: 'Price',
    fCurrency: 'Currency (ISO 4217)',
    fAvailable: 'Availability',
    fRatingValue: 'Rating value',
    fRatingCount: 'Rating count',
    fStart: 'Start date/time',
    fEnd: 'End date/time',
    fMode: 'Attendance mode',
    fLocName: 'Venue (name)',
    fLocAddr: 'Venue (address)',
    fCategory: 'Application category',
    fOs: 'Operating system',
    fPriceRange: 'Price range (e.g. $$)',
    fHours: 'Opening hours (e.g. "Mo-Fr 09:00-18:00")',
    fLat: 'Latitude',
    fLng: 'Longitude',
    faqCard: 'Questions & answers (FAQPage)',
    faqQuestion: 'Question',
    faqAnswer: 'Answer',
    addFaq: 'Add question',
    remove: 'Remove',
    crumbCard: 'Breadcrumb items (BreadcrumbList)',
    crumbName: 'Name',
    crumbUrl: 'URL',
    addCrumb: 'Add item',
  },
}

export default function JsonLdStructuredDataGeneratorPage() {
  const { lang } = useLanguage()
  const t = translations[lang]

  const [type, setType] = useState('website')
  const [v, setV] = useState({ ...TEMPLATES[0].example })
  const [faq, setFaq] = useState([{ q: '', a: '' }])
  const [crumbs, setCrumbs] = useState([{ name: '', url: '' }])
  const [wrap, setWrap] = useState(true)
  const [minify, setMinify] = useState(false)

  const tpl = useMemo(() => TEMPLATES.find((x) => x.key === type) || TEMPLATES[0], [type])

  const patch = (p) => setV((prev) => ({ ...prev, ...p }))
  const selectType = (key) => {
    setType(key)
    const next = TEMPLATES.find((x) => x.key === key)
    setV(next ? { ...next.example } : {})
  }
  const fillExample = () => setV({ ...tpl.example })
  const clearFields = () => setV({})

  const updateFaq = (i, k, val) => setFaq((prev) => prev.map((row, j) => (j === i ? { ...row, [k]: val } : row)))
  const addFaq = () => setFaq((prev) => [...prev, { q: '', a: '' }])
  const removeFaq = (i) => setFaq((prev) => prev.filter((_, j) => j !== i))

  const updateCrumb = (i, k, val) => setCrumbs((prev) => prev.map((row, j) => (j === i ? { ...row, [k]: val } : row)))
  const addCrumb = () => setCrumbs((prev) => [...prev, { name: '', url: '' }])
  const removeCrumb = (i) => setCrumbs((prev) => prev.filter((_, j) => j !== i))

  const graph = useMemo(() => buildGraph(type, v, faq, crumbs), [type, v, faq, crumbs])
  const output = useMemo(() => {
    const raw = JSON.stringify(graph, null, minify ? 0 : 2) || ''
    return wrap ? `<script type="application/ld+json">\n${raw}\n</script>` : raw
  }, [graph, wrap, minify])

  const lineCount = output.length ? output.split('\n').length : 0
  const byteCount = useMemo(() => new Blob([output]).size, [output])
  const keysCount = Object.keys(graph).length

  const summaryTypes = useMemo(() => {
    const seen = []
    collectTypes(graph, seen)
    return [...new Set(seen)]
  }, [graph])

  const copy = () => {
    navigator.clipboard.writeText(output)
    message.success(t.copied)
  }

  const renderField = (f) => {
    const value = v[f.key] ?? ''
    switch (f.kind) {
      case 'textarea':
        return (
          <Input.TextArea rows={2} value={value} placeholder={t[f.labelKey]} onChange={(e) => patch({ [f.key]: e.target.value })} />
        )
      case 'url':
        return <Input value={value} placeholder="https://exemplo.com/" onChange={(e) => patch({ [f.key]: e.target.value })} />
      case 'number':
        return <Input value={value} type="text" inputMode="decimal" placeholder="0.00" onChange={(e) => patch({ [f.key]: e.target.value })} />
      case 'date':
        return <Input type="datetime-local" value={value} onChange={(e) => patch({ [f.key]: e.target.value })} />
      case 'select':
        return (
          <Select
            style={{ width: '100%' }}
            value={value || undefined}
            placeholder={t[f.labelKey]}
            allowClear
            options={f.options.map((o) => ({ value: o, label: o.replace('EventAttendanceMode', '') }))}
            onChange={(val) => patch({ [f.key]: val })}
          />
        )
      default:
        return <Input value={value} placeholder={t[f.labelKey]} onChange={(e) => patch({ [f.key]: e.target.value })} />
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}><ApartmentOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon message={t.tipTitle} description={t.tipBody} />

      <Card title={t.typeCard}>
        <Select style={{ width: '100%' }} value={type} onChange={selectType} options={TEMPLATES.map((x) => ({ value: x.key, label: t[x.labelKey] }))} />
      </Card>

      <Card
        title={t.formCard}
        extra={
          <Space>
            <Button size="small" icon={<ExperimentOutlined />} onClick={fillExample}>{t.example}</Button>
            <Button size="small" icon={<UndoOutlined />} onClick={clearFields}>{t.clear}</Button>
          </Space>
        }
      >
        {tpl.fields.length > 0 && (
          <Row gutter={[16, 12]}>
            {tpl.fields.map((f) => (
              <Col xs={24} md={f.kind === 'textarea' ? 24 : 12} key={f.key}>
                <Field label={<Text code>{t[f.labelKey]}</Text>} hint={f.key === 'searchUrl' ? t.searchUrlHint : null}>
                  {renderField(f)}
                </Field>
              </Col>
            ))}
          </Row>
        )}

        {type === 'faq' && (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <DividerText label={t.faqCard} />
            {faq.map((row, i) => (
              <Row gutter={8} key={i} align="middle">
                <Col xs={24} md={9}>
                  <Input value={row.q} placeholder={t.faqQuestion} onChange={(e) => updateFaq(i, 'q', e.target.value)} />
                </Col>
                <Col xs={24} md={13}>
                  <Input.TextArea rows={1} value={row.a} placeholder={t.faqAnswer} onChange={(e) => updateFaq(i, 'a', e.target.value)} />
                </Col>
                <Col xs={24} md={2}>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeFaq(i)} aria-label={t.remove} />
                </Col>
              </Row>
            ))}
            <Button size="small" icon={<PlusOutlined />} onClick={addFaq}>{t.addFaq}</Button>
          </Space>
        )}

        {type === 'breadcrumb' && (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <DividerText label={t.crumbCard} />
            {crumbs.map((row, i) => (
              <Row gutter={8} key={i} align="middle">
                <Col xs={24} md={9}>
                  <Input value={row.name} placeholder={t.crumbName} onChange={(e) => updateCrumb(i, 'name', e.target.value)} />
                </Col>
                <Col xs={24} md={13}>
                  <Input value={row.url} placeholder={t.crumbUrl} onChange={(e) => updateCrumb(i, 'url', e.target.value)} />
                </Col>
                <Col xs={24} md={2}>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeCrumb(i)} aria-label={t.remove} />
                </Col>
              </Row>
            ))}
            <Button size="small" icon={<PlusOutlined />} onClick={addCrumb}>{t.addCrumb}</Button>
          </Space>
        )}
      </Card>

      <Card title={t.optionsCard}>
        <Space direction="vertical" size={8}>
          <Checkbox checked={wrap} onChange={(e) => setWrap(e.target.checked)}>{t.wrapLabel}</Checkbox>
          <Checkbox checked={minify} onChange={(e) => setMinify(e.target.checked)}>{t.minify}</Checkbox>
        </Space>
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={15}>
          <Card title={t.output} extra={<Space size={8}>
            <Text type="secondary" style={{ fontSize: 12 }}>{t.lines(lineCount)} · {t.bytes(byteCount)}</Text>
            <Button size="small" icon={<CopyOutlined />} onClick={copy}>{t.copy}</Button>
          </Space>}>
            <pre style={{ margin: 0, overflowX: 'auto', background: '#0d1117', color: '#e6edf3', padding: 12, borderRadius: 8, maxHeight: 500, fontSize: 12.5, lineHeight: 1.6 }}>
              <code>{output || t.empty}</code>
            </pre>
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card title={t.summary} extra={<Text type="secondary" style={{ fontSize: 12 }}>{t.keysCount(keysCount)}</Text>}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12.5 }}>
                <Text code>@context</Text> · <Text code>https://schema.org</Text>
              </Text>
              <Space wrap>
                {summaryTypes.map((ty) => (
                  <Tag key={ty} color="blue">{ty}</Tag>
                ))}
              </Space>
              {summaryTypes.length === 1 && <Text type="secondary" style={{ fontSize: 12 }}>{t.summaryEmpty}</Text>}
            </Space>
          </Card>
        </Col>
      </Row>

      <Collapse
        items={[
          {
            key: 'source',
            label: t.sourceCol,
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph type="secondary">{t.sourceBody}</Paragraph>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 300 }}><code>{buildGraph.toString()}</code></pre>
                <pre style={{ margin: 0, overflowX: 'auto', maxHeight: 220 }}><code>{offer.toString()}</code></pre>
              </Space>
            ),
          },
        ]}
      />
    </Space>
  )
}

function Field({ label, hint, children }) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        {label}
        {hint ? <Text type="secondary" style={{ fontSize: 11 }}>{hint}</Text> : null}
      </Space>
      {children}
    </Space>
  )
}

function DividerText({ label }) {
  return (
    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
  )
}