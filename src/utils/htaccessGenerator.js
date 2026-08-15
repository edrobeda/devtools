// Gerador de .htaccess 100% client-side
// Monta um arquivo Apache a partir de opções editáveis.

export const PRESETS = {
  spa: {
    label: { pt: 'SPA fallback (React/Vue/Angular)', en: 'SPA fallback (React/Vue/Angular)' },
    rewriteEngine: true,
    basePath: '/',
    spaFallback: true,
    httpsRedirect: false,
    wwwRedirect: 'none',
    compression: true,
    cacheAssets: false,
    cacheDays: 30,
    securityHeaders: true,
    hideServerInfo: true,
    disableDirectoryListing: true,
    passwordProtect: false,
    authName: 'Restricted Area',
    authUserFile: '/var/www/.htpasswd',
    customErrors: [{ code: '404', url: '/index.html' }],
    denyIps: '',
    extra: '',
  },
  https: {
    label: { pt: 'Redirect para HTTPS', en: 'HTTPS redirect' },
    rewriteEngine: true,
    basePath: '/',
    spaFallback: false,
    httpsRedirect: true,
    wwwRedirect: 'none',
    compression: true,
    cacheAssets: true,
    cacheDays: 30,
    securityHeaders: true,
    hideServerInfo: true,
    disableDirectoryListing: true,
    passwordProtect: false,
    authName: 'Restricted Area',
    authUserFile: '/var/www/.htpasswd',
    customErrors: [],
    denyIps: '',
    extra: '',
  },
  static: {
    label: { pt: 'Site estático (cache + compressão)', en: 'Static site (cache + compression)' },
    rewriteEngine: false,
    basePath: '/',
    spaFallback: false,
    httpsRedirect: false,
    wwwRedirect: 'none',
    compression: true,
    cacheAssets: true,
    cacheDays: 365,
    securityHeaders: false,
    hideServerInfo: true,
    disableDirectoryListing: true,
    passwordProtect: false,
    authName: 'Restricted Area',
    authUserFile: '/var/www/.htpasswd',
    customErrors: [{ code: '404', url: '/404.html' }],
    denyIps: '',
    extra: '',
  },
  security: {
    label: { pt: 'Hardering de segurança', en: 'Security hardening' },
    rewriteEngine: true,
    basePath: '/',
    spaFallback: false,
    httpsRedirect: true,
    wwwRedirect: 'none',
    compression: false,
    cacheAssets: false,
    cacheDays: 30,
    securityHeaders: true,
    hideServerInfo: true,
    disableDirectoryListing: true,
    passwordProtect: false,
    authName: 'Restricted Area',
    authUserFile: '/var/www/.htpasswd',
    customErrors: [{ code: '403', url: '/403.html' }, { code: '404', url: '/404.html' }],
    denyIps: '',
    extra: '',
  },
  minimal: {
    label: { pt: 'Mínimo', en: 'Minimal' },
    rewriteEngine: false,
    basePath: '/',
    spaFallback: false,
    httpsRedirect: false,
    wwwRedirect: 'none',
    compression: false,
    cacheAssets: false,
    cacheDays: 30,
    securityHeaders: false,
    hideServerInfo: true,
    disableDirectoryListing: true,
    passwordProtect: false,
    authName: 'Restricted Area',
    authUserFile: '/var/www/.htpasswd',
    customErrors: [],
    denyIps: '',
    extra: '',
  },
}

function trimLines(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function section(title) {
  return ['', `# --- ${title} ---`]
}

export function buildHtaccess(o) {
  const lines = []
  const warnings = []
  const add = (s) => lines.push(s)

  const basePath = String(o.basePath || '').trim() || '/'

  if (o.rewriteEngine) {
    add(...section('RewriteEngine'))
    add('RewriteEngine On')
    if (basePath !== '/') {
      add(`RewriteBase ${basePath}`)
    }
  }

  if (o.httpsRedirect && o.rewriteEngine) {
    add(...section('HTTPS redirect'))
    add('RewriteCond %{HTTPS} off')
    add('RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]')
  }

  if (o.wwwRedirect && o.wwwRedirect !== 'none' && o.rewriteEngine) {
    add(...section('www redirect'))
    if (o.wwwRedirect === 'to-www') {
      add('RewriteCond %{HTTP_HOST} !^www\\. [NC]')
      add('RewriteRule ^(.*)$ https://www.%{HTTP_HOST}%{REQUEST_URI} [L,R=301]')
    } else if (o.wwwRedirect === 'to-non-www') {
      add('RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]')
      add('RewriteRule ^(.*)$ https://%1%{REQUEST_URI} [L,R=301]')
    }
  }

  if (o.spaFallback && o.rewriteEngine) {
    add(...section('SPA fallback'))
    add('RewriteCond %{REQUEST_FILENAME} !-f')
    add('RewriteCond %{REQUEST_FILENAME} !-d')
    add('RewriteRule . /index.html [L]')
  }

  if (o.compression) {
    add(...section('Compression'))
    add('<IfModule mod_deflate.c>')
    add('  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css')
    add('  AddOutputFilterByType DEFLATE application/javascript application/json application/xml')
    add('  AddOutputFilterByType DEFLATE font/woff font/woff2')
    add('</IfModule>')
  }

  if (o.cacheAssets) {
    add(...section('Cache control'))
    const days = Number(o.cacheDays) || 30
    add('<IfModule mod_expires.c>')
    add('  ExpiresActive On')
    add(`  ExpiresDefault "access plus ${days} days"`)
    add('</IfModule>')
    add('<IfModule mod_headers.c>')
    add('  <FilesMatch "\\.(ico|pdf|flv|jpg|jpeg|png|gif|js|css|swf|woff|woff2)$">')
    add(`    Header set Cache-Control "public, max-age=${days * 86400}"`)
    add('  </FilesMatch>')
    add('</IfModule>')
  }

  if (o.securityHeaders) {
    add(...section('Security headers'))
    add('<IfModule mod_headers.c>')
    add('  Header always set X-Content-Type-Options "nosniff"')
    add('  Header always set X-Frame-Options "SAMEORIGIN"')
    add('  Header always set X-XSS-Protection "1; mode=block"')
    add('  Header always set Referrer-Policy "strict-origin-when-cross-origin"')
    add('  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"')
    add('</IfModule>')
  }

  if (o.hideServerInfo) {
    add(...section('Server info'))
    add('ServerSignature Off')
    add('ServerTokens Prod')
  }

  if (o.disableDirectoryListing) {
    add(...section('Directory listing'))
    add('Options -Indexes')
  }

  if (o.passwordProtect) {
    add(...section('Basic authentication'))
    const authName = String(o.authName || 'Restricted Area').trim()
    const authUserFile = String(o.authUserFile || '/var/www/.htpasswd').trim()
    if (!authName) warnings.push('authName')
    if (!authUserFile) warnings.push('authUserFile')
    add(`AuthType Basic`)
    add(`AuthName "${authName || 'Restricted Area'}"`)
    add(`AuthUserFile ${authUserFile || '/var/www/.htpasswd'}`)
    add(`Require valid-user`)
  }

  const errors = Array.isArray(o.customErrors) ? o.customErrors : []
  const validErrors = errors.filter((e) => e && String(e.code || '').trim() && String(e.url || '').trim())
  if (validErrors.length) {
    add(...section('Custom error pages'))
    for (const e of validErrors) {
      add(`ErrorDocument ${String(e.code).trim()} ${String(e.url).trim()}`)
    }
  }

  const ips = trimLines(o.denyIps || '')
  if (ips.length) {
    add(...section('IP deny'))
    add('<RequireAll>')
    add('  Require all granted')
    for (const ip of ips) {
      add(`  Require not ip ${ip}`)
    }
    add('</RequireAll>')
  }

  const extra = trimLines(o.extra || '')
  if (extra.length) {
    add(...section('Custom rules'))
    for (const line of extra) {
      add(line)
    }
  }

  if (!lines.length) {
    warnings.push('empty')
  }

  return {
    text: lines.join('\n'),
    warnings,
  }
}
