export const MODES = ['proxy', 'static', 'spa', 'api', 'php', 'loadBalancer']

export const PRESETS = {
  proxy: {
    label: { pt: 'Reverse proxy (Node/Vite)', en: 'Reverse proxy (Node/Vite)' },
    domains: 'app.example.com',
    mode: 'proxy',
    backend: 'localhost:3000',
    root: '',
    location: '/',
    ssl: true,
    certPath: '/etc/letsencrypt/live/app.example.com/fullchain.pem',
    keyPath: '/etc/letsencrypt/live/app.example.com/privkey.pem',
    gzip: true,
    headers: true,
    basicAuth: false,
    authFile: '/etc/nginx/.htpasswd',
    caching: true,
    logAccess: true,
    logError: true,
    comments: true,
    extra: '',
  },
  static: {
    label: { pt: 'Site estático', en: 'Static site' },
    domains: 'site.example.com',
    mode: 'static',
    backend: '',
    root: '/var/www/html',
    location: '/',
    ssl: false,
    certPath: '/etc/letsencrypt/live/site.example.com/fullchain.pem',
    keyPath: '/etc/letsencrypt/live/site.example.com/privkey.pem',
    gzip: true,
    headers: true,
    basicAuth: false,
    authFile: '/etc/nginx/.htpasswd',
    caching: true,
    logAccess: true,
    logError: true,
    comments: true,
    extra: '',
  },
  spa: {
    label: { pt: 'SPA fallback (React/Vue)', en: 'SPA fallback (React/Vue)' },
    domains: 'spa.example.com',
    mode: 'spa',
    backend: '',
    root: '/var/www/html',
    location: '/',
    ssl: false,
    certPath: '/etc/letsencrypt/live/spa.example.com/fullchain.pem',
    keyPath: '/etc/letsencrypt/live/spa.example.com/privkey.pem',
    gzip: true,
    headers: true,
    basicAuth: false,
    authFile: '/etc/nginx/.htpasswd',
    caching: true,
    logAccess: true,
    logError: true,
    comments: true,
    extra: '',
  },
  api: {
    label: { pt: 'API com prefixo', en: 'API with prefix' },
    domains: 'api.example.com',
    mode: 'api',
    backend: 'localhost:8080',
    root: '',
    location: '/api/',
    ssl: true,
    certPath: '/etc/letsencrypt/live/api.example.com/fullchain.pem',
    keyPath: '/etc/letsencrypt/live/api.example.com/privkey.pem',
    gzip: true,
    headers: true,
    basicAuth: false,
    authFile: '/etc/nginx/.htpasswd',
    caching: false,
    logAccess: true,
    logError: true,
    comments: true,
    extra: '',
  },
  php: {
    label: { pt: 'PHP-FPM', en: 'PHP-FPM' },
    domains: 'php.example.com',
    mode: 'php',
    backend: 'unix:/var/run/php/php-fpm.sock',
    root: '/var/www/html',
    location: '/',
    ssl: false,
    certPath: '/etc/letsencrypt/live/php.example.com/fullchain.pem',
    keyPath: '/etc/letsencrypt/live/php.example.com/privkey.pem',
    gzip: true,
    headers: true,
    basicAuth: false,
    authFile: '/etc/nginx/.htpasswd',
    caching: true,
    logAccess: true,
    logError: true,
    comments: true,
    extra: '',
  },
  loadBalancer: {
    label: { pt: 'Load balancer (upstream)', en: 'Load balancer (upstream)' },
    domains: 'lb.example.com',
    mode: 'loadBalancer',
    backend: 'localhost:3001\nlocalhost:3002\nlocalhost:3003',
    root: '',
    location: '/',
    ssl: false,
    certPath: '/etc/letsencrypt/live/lb.example.com/fullchain.pem',
    keyPath: '/etc/letsencrypt/live/lb.example.com/privkey.pem',
    gzip: true,
    headers: true,
    basicAuth: false,
    authFile: '/etc/nginx/.htpasswd',
    caching: false,
    logAccess: true,
    logError: true,
    comments: true,
    extra: '',
  },
}

export const DEFAULTS = { ...PRESETS.proxy }

function needsBackend(mode) {
  return mode === 'proxy' || mode === 'api' || mode === 'php' || mode === 'loadBalancer'
}

function needsRoot(mode) {
  return mode === 'static' || mode === 'spa' || mode === 'php'
}

export function buildNginxConfig(o) {
  const lines = []
  const warnings = []
  const add = (s) => lines.push(s)
  const ind = '    '

  const domains = String(o.domains || '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (!domains.length) warnings.push('domains')
  const primaryDomain = domains[0] || 'example.com'

  const backend = String(o.backend || '').trim()
  if (needsBackend(o.mode) && !backend) warnings.push('backend')

  const root = String(o.root || '').trim()
  if (needsRoot(o.mode) && !root) warnings.push('root')

  const upstreamName = primaryDomain.replace(/[^a-zA-Z0-9_]/g, '_')

  if (o.mode === 'loadBalancer') {
    const backends = backend
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!backends.length) warnings.push('backend')
    add(`upstream ${upstreamName} {`)
    backends.forEach((b) => add(`${ind}server ${b};`))
    add('}')
    if (o.comments) add('')
  }

  add('server {')
  add(`${ind}listen 80;`)
  add(`${ind}listen [::]:80;`)

  if (o.ssl) {
    add(`${ind}listen 443 ssl http2;`)
    add(`${ind}listen [::]:443 ssl http2;`)
    add(`${ind}ssl_certificate ${o.certPath || `/etc/letsencrypt/live/${primaryDomain}/fullchain.pem`};`)
    add(`${ind}ssl_certificate_key ${o.keyPath || `/etc/letsencrypt/live/${primaryDomain}/privkey.pem`};`)
    if (o.comments) {
      add(`${ind}# redireciona HTTP para HTTPS`)
      add(`${ind}if ($scheme != "https") {`)
      add(`${ind}  return 301 https://$host$request_uri;`)
      add(`${ind}}`)
    } else {
      add(`${ind}if ($scheme != "https") {`)
      add(`${ind}  return 301 https://$host$request_uri;`)
      add(`${ind}}`)
    }
  }

  add(`${ind}server_name ${domains.length ? domains.join(' ') : '_'};`)

  if (o.logAccess) add(`${ind}access_log /var/log/nginx/${upstreamName}.access.log;`)
  if (o.logError) add(`${ind}error_log /var/log/nginx/${upstreamName}.error.log;`)

  if (o.gzip) {
    if (o.comments) add(`${ind}# compressão`)
    add(`${ind}gzip on;`)
    add(`${ind}gzip_vary on;`)
    add(`${ind}gzip_min_length 1024;`)
    add(`${ind}gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;`)
  }

  if (o.headers) {
    if (o.comments) add(`${ind}# headers de segurança`)
    add(`${ind}server_tokens off;`)
    add(`${ind}add_header X-Frame-Options "SAMEORIGIN" always;`)
    add(`${ind}add_header X-Content-Type-Options "nosniff" always;`)
    add(`${ind}add_header X-XSS-Protection "1; mode=block" always;`)
    add(`${ind}add_header Referrer-Policy "strict-origin-when-cross-origin" always;`)
  }

  if (o.basicAuth) {
    if (o.comments) add(`${ind}# autenticação básica`)
    add(`${ind}auth_basic "Restricted";`)
    add(`${ind}auth_basic_user_file ${o.authFile || '/etc/nginx/.htpasswd'};`)
  }

  if (needsRoot(o.mode) && root) {
    add(`${ind}root ${root};`)
    add(`${ind}index index.html index.htm${o.mode === 'php' ? ' index.php' : ''};`)
  }

  const loc = String(o.location || '/').trim() || '/'

  if (o.mode === 'proxy' || o.mode === 'api' || o.mode === 'loadBalancer') {
    const target = o.mode === 'loadBalancer' ? `http://${upstreamName}` : `http://${backend || 'localhost:3000'}`
    const locPrefix = o.mode === 'api' ? loc : loc
    if (o.comments) add(`${ind}# proxy reverso`)
    add(`${ind}location ${locPrefix} {`)
    add(`${ind}${ind}proxy_pass ${target}${o.mode === 'api' ? '' : ''};`)
    add(`${ind}${ind}proxy_http_version 1.1;`)
    add(`${ind}${ind}proxy_set_header Host $host;`)
    add(`${ind}${ind}proxy_set_header X-Real-IP $remote_addr;`)
    add(`${ind}${ind}proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`)
    add(`${ind}${ind}proxy_set_header X-Forwarded-Proto $scheme;`)
    if (o.mode === 'api') {
      add(`${ind}${ind}proxy_set_header Accept-Encoding "";`)
    }
    add(`${ind}}`)
  } else if (o.mode === 'static') {
    if (o.comments) add(`${ind}# arquivos estáticos`)
    add(`${ind}location ${loc} {`)
    add(`${ind}${ind}try_files $uri $uri/ =404;`)
    add(`${ind}}`)
  } else if (o.mode === 'spa') {
    if (o.comments) add(`${ind}# history API fallback`)
    add(`${ind}location ${loc} {`)
    add(`${ind}${ind}try_files $uri $uri/ /index.html;`)
    add(`${ind}}`)
  } else if (o.mode === 'php') {
    if (o.comments) add(`${ind}# requisições PHP`)
    add(`${ind}location ${loc} {`)
    add(`${ind}${ind}try_files $uri $uri/ /index.php?$query_string;`)
    add(`${ind}}`)
    add(`${ind}location ~ \\.php$ {`)
    add(`${ind}${ind}include snippets/fastcgi-php.conf;`)
    add(`${ind}${ind}fastcgi_pass ${backend || 'unix:/var/run/php/php-fpm.sock'};`)
    add(`${ind}}`)
  }

  if (o.caching) {
    if (o.comments) add(`${ind}# cache de assets`)
    add(`${ind}location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {`)
    add(`${ind}${ind}expires 1y;`)
    add(`${ind}${ind}add_header Cache-Control "public, immutable";`)
    add(`${ind}}`)
  }

  const extras = String(o.extra || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (extras.length) {
    if (o.comments) add(`${ind}# regras adicionais`)
    extras.forEach((s) => add(`${ind}${s}`))
  }

  add('}')

  return { text: lines.join('\n'), warnings, upstreamName }
}
