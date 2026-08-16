// Dados da referência OAuth2 / OpenID Connect.
// Mantido 100% client-side; nenhum token real passa por aqui.

export const CATEGORIES = [
  'grant',
  'endpoint',
  'token',
  'oidc',
  'security',
  'attack',
]

export const CATEGORY_COLOR = {
  grant: 'blue',
  endpoint: 'cyan',
  token: 'purple',
  oidc: 'geekblue',
  security: 'green',
  attack: 'red',
}

export const CATEGORY_LABEL = {
  grant: { pt: 'Fluxos (grant types)', en: 'Grant types' },
  endpoint: { pt: 'Endpoints & requisições', en: 'Endpoints & requests' },
  token: { pt: 'Tokens & metadados', en: 'Tokens & metadata' },
  oidc: { pt: 'OpenID Connect', en: 'OpenID Connect' },
  security: { pt: 'Boas práticas', en: 'Best practices' },
  attack: { pt: 'Riscos & mitigações', en: 'Threats & mitigations' },
}

export const ITEMS = [
  {
    cat: 'grant',
    code: `// Authorization Code (RFC 6749 §4.1)
// Ideal para aplicações server-side e SPAs confidenciais
GET /authorize?response_type=code
  &client_id=CLIENT_ID
  &redirect_uri=https://app.example.com/callback
  &scope=openid profile email
  &state=RANDOM_STATE
  &code_challenge=BASE64URL(SHA256(VERIFIER))
  &code_challenge_method=S256`,
    pt: 'Fluxo mais seguro e recomendado para aplicações web. O cliente recebe um código de uso único e o troca por tokens numa chamada server-side (ou numa SPA com PKCE). Suporta refresh tokens e não expõe tokens na URL.',
    en: 'The most secure and recommended flow for web applications. The client receives a single-use code and exchanges it for tokens in a server-side call (or in a SPA with PKCE). Supports refresh tokens and does not expose tokens in the URL.',
  },
  {
    cat: 'grant',
    code: `// Authorization Code + PKCE (RFC 7636)
// Obrigatório para mobile/SPA; recomendado para todos os clientes públicos
const verifier = randomString(43, 128);
const challenge = base64url(sha256(verifier));

// authorize: envia challenge
// token: envia verifier para provar que gerou o challenge`,
    pt: 'Proof Key for Code Exchange. O cliente gera um segredo (verifier), manda o hash (challenge) no authorize e o segredo original no token. Impede que um aplicativo malicioso intercepte o código e troque por tokens.',
    en: 'Proof Key for Code Exchange. The client generates a secret (verifier), sends its hash (challenge) in the authorize request and the original secret in the token request. Prevents a malicious app from intercepting the code and exchanging it for tokens.',
  },
  {
    cat: 'grant',
    code: `// Client Credentials (RFC 6749 §4.4)
// Para comunicação machine-to-machine (M2M)
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=CLIENT_ID
&client_secret=CLIENT_SECRET
&scope=api:read`,
    pt: 'Usado quando não há usuário final — serviços backend acessando APIs em nome deles mesmos. O client_secret deve ficar apenas no servidor. Tokens de curta duração e escopos mínimos são essenciais.',
    en: 'Used when there is no end user — backend services accessing APIs on their own behalf. The client_secret must stay on the server only. Short-lived tokens and minimal scopes are essential.',
  },
  {
    cat: 'grant',
    code: `// Device Authorization Grant (RFC 8628)
// Para TVs, impressoras e dispositivos com input limitado
POST /device_authorization
client_id=CLIENT_ID&scope=api:read

// Resposta:
{
  "device_code": "GmRhmhcxhwAz...",
  "user_code": "WDJB-MJHT",
  "verification_uri": "https://auth.example.com/activate",
  "interval": 5,
  "expires_in": 1800
}`,
    pt: 'O dispositivo mostra um código curto pro usuário digitar em outro aparelho. Enquanto isso, o dispositivo faz polling no endpoint de token até o usuário autorizar. Ótimo pra telas sem teclado confortável.',
    en: 'The device shows a short code for the user to type on another device. Meanwhile, the device polls the token endpoint until the user authorizes. Great for screens without a comfortable keyboard.',
  },
  {
    cat: 'grant',
    code: `// Refresh Token (RFC 6749 §6)
// Troca um refresh token por um novo access token
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=REFRESH_TOKEN
&client_id=CLIENT_ID
&scope=api:read`,
    pt: 'Permite obter novos access tokens sem pedir credenciais novamente. Deve ser armazenado com cuidado, ter vida longa mas revogável, e usar rotação (o servidor emite um novo refresh token a cada uso).',
    en: 'Allows obtaining new access tokens without asking for credentials again. Must be stored carefully, have a long but revocable lifetime, and use rotation (the server issues a new refresh token on every use).',
  },
  {
    cat: 'grant',
    code: `// Implicit Grant (RFC 6749 §4.2) — LEGADO
// Não usar em novas aplicações
GET /authorize?response_type=token
  &client_id=CLIENT_ID
  &redirect_uri=https://spa.example.com/callback
  &scope=api:read
  &state=RANDOM_STATE

// O access_token voltava direto no fragmento (#) da URL`,
    pt: 'Projetado para SPAs antigas, mas expõe o access token na URL e no histórico do navegador. Substituído pelo Authorization Code + PKCE. Mantido aqui só pra leitura de código legado.',
    en: 'Designed for old SPAs, but exposes the access token in the URL and browser history. Replaced by Authorization Code + PKCE. Kept here for reading legacy code only.',
  },
  {
    cat: 'grant',
    code: `// Resource Owner Password Credentials (RFC 6749 §4.3) — LEGADO
// Não usar em novas aplicações
POST /token
grant_type=password
&username=user@example.com
&password=secret
&client_id=CLIENT_ID`,
    pt: 'O cliente coleta login e senha do usuário e envia pro authorization server. Quebra o princípio de não expor credenciais a terceiros. Só aceitável em migrações confiáveis e deve ser substituído por redirect flows.',
    en: 'The client collects the user login and password and sends them to the authorization server. Breaks the principle of not exposing credentials to third parties. Only acceptable in trusted migrations and should be replaced by redirect flows.',
  },
  {
    cat: 'endpoint',
    code: `// Authorization Endpoint
GET /authorize?response_type=code
  &client_id=CLIENT_ID
  &redirect_uri=REDIRECT_URI
  &scope=SCOPE
  &state=STATE
  &code_challenge=CHALLENGE
  &code_challenge_method=S256`,
    pt: 'Endpoint onde o usuário interage com o authorization server. Deve usar HTTPS, validar redirect_uri e, em OIDC, incluir response_type=code e scope=openid. Retorna um authorization code (ou erro).',
    en: 'Endpoint where the user interacts with the authorization server. Must use HTTPS, validate redirect_uri and, in OIDC, include response_type=code and scope=openid. Returns an authorization code (or error).',
  },
  {
    cat: 'endpoint',
    code: `// Token Endpoint
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=REDIRECT_URI
&client_id=CLIENT_ID
&code_verifier=VERIFIER`,
    pt: 'Endpoint onde o cliente troca o authorization code por access/refresh/id tokens. Exige autenticação do cliente (client_secret ou client_assertion/JWT) para clientes confidenciais.',
    en: 'Endpoint where the client exchanges the authorization code for access/refresh/id tokens. Requires client authentication (client_secret or client_assertion/JWT) for confidential clients.',
  },
  {
    cat: 'endpoint',
    code: `// Introspection Endpoint (RFC 7662)
POST /introspect
Content-Type: application/x-www-form-urlencoded

 token=ACCESS_OR_REFRESH_TOKEN
&token_type_hint=access_token`,
    pt: 'Permite que um resource server pergunte ao authorization server se um token ainda é válido, quem é o subject, escopos e tempo de expiração. Útil quando o resource server não consegue validar JWTs localmente.',
    en: 'Allows a resource server to ask the authorization server whether a token is still valid, who the subject is, scopes and expiry time. Useful when the resource server cannot validate JWTs locally.',
  },
  {
    cat: 'endpoint',
    code: `// Revocation Endpoint (RFC 7009)
POST /revoke
Content-Type: application/x-www-form-urlencoded

 token=REFRESH_TOKEN
&token_type_hint=refresh_token`,
    pt: 'Usado para invalidar tokens ativos (logout parcial, roubo suspeito, revogação de sessão). Access tokens podem continuar funcionando até expirar, então TTLs curtos são recomendados.',
    en: 'Used to invalidate active tokens (partial logout, suspected theft, session revocation). Access tokens may keep working until expiry, so short TTLs are recommended.',
  },
  {
    cat: 'endpoint',
    code: `// UserInfo Endpoint (OpenID Connect)
GET /userinfo
Authorization: Bearer ACCESS_TOKEN

// Resposta:
{
  "sub": "auth0|123",
  "name": "Ana Silva",
  "email": "ana@example.com",
  "email_verified": true
}`,
    pt: 'Retorna claims do usuário autenticado. Exige um access token válido com escopoopenid. O resource server deve validar o token e respeitar os escopos solicitados.',
    en: 'Returns claims about the authenticated user. Requires a valid access token with the openid scope. The resource server must validate the token and respect the requested scopes.',
  },
  {
    cat: 'endpoint',
    code: `// OpenID Connect Discovery (RFC 8414)
GET /.well-known/openid-configuration

// Resposta:
{
  "issuer": "https://auth.example.com",
  "authorization_endpoint": "https://auth.example.com/authorize",
  "token_endpoint": "https://auth.example.com/token",
  "userinfo_endpoint": "https://auth.example.com/userinfo",
  "jwks_uri": "https://auth.example.com/.well-known/jwks.json",
  "scopes_supported": ["openid", "profile", "email"],
  "response_types_supported": ["code", "id_token"],
  "code_challenge_methods_supported": ["S256"]
}`,
    pt: 'Documento JSON que descreve os endpoints e recursos suportados pelo provedor OIDC. Clientes devem validar o issuer e buscar chaves públicas em JWKS_URI para verificar assinaturas de ID tokens.',
    en: 'JSON document describing the endpoints and features supported by the OIDC provider. Clients should validate the issuer and fetch public keys from JWKS_URI to verify ID token signatures.',
  },
  {
    cat: 'token',
    code: `// Access Token (opaque ou JWT)
// Exemplo de JWT:
{
  "header": { "alg": "RS256", "typ": "at+JWT" },
  "payload": {
    "sub": "auth0|123",
    "iss": "https://auth.example.com",
    "aud": "https://api.example.com",
    "exp": 1765432100,
    "iat": 1765431800,
    "scope": "read:orders write:profile",
    "jti": "unique-token-id"
  }
}`,
    pt: 'Credencial usada para acessar recursos protegidos. Pode ser opaco (um UUID checado no authorization server) ou um JWT auto-contido. Deve ter curta duração e escopos restritos.',
    en: 'Credential used to access protected resources. Can be opaque (a UUID checked by the authorization server) or a self-contained JWT. Should be short-lived and have restricted scopes.',
  },
  {
    cat: 'token',
    code: `// Refresh Token
{
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expires_in": 2592000
}

// Uso:
POST /token
grant_type=refresh_token&refresh_token=...`,
    pt: 'Token de longa duração usado apenas para obter novos access tokens. Não deve ser exposto ao frontend em aplicações públicas sem mecanismos como BFF (Backend-for-Frontend) ou cookies httpOnly.',
    en: 'Long-lived token used only to obtain new access tokens. Should not be exposed to the frontend in public applications without mechanisms such as BFF (Backend-for-Frontend) or httpOnly cookies.',
  },
  {
    cat: 'token',
    code: `// ID Token (OpenID Connect)
{
  "iss": "https://auth.example.com",
  "sub": "auth0|123",
  "aud": "CLIENT_ID",
  "exp": 1765432100,
  "iat": 1765431800,
  "nonce": "RANDOM_NONCE",
  "auth_time": 1765431700,
  "amr": ["pwd", "mfa"],
  "acr": "urn:mace:incommon:iap:silver"
}`,
    pt: 'JWT que prova que o usuário foi autenticado. Contém claims padronizadas como sub, iss, aud, exp, nonce e auth_time. Deve ser validado no cliente: assinatura, issuer, audience, expiração e nonce.',
    en: 'JWT that proves the user was authenticated. Contains standard claims such as sub, iss, aud, exp, nonce and auth_time. Must be validated by the client: signature, issuer, audience, expiry and nonce.',
  },
  {
    cat: 'token',
    code: `// scope — define o que o token pode acessar
scope=openid profile email read:orders

// Escopos comuns do OIDC:
// openid   → obrigatório para ID token
// profile  → name, family_name, given_name, etc.
// email    → email, email_verified
// address  → endereço postal
// phone    → phone_number, phone_number_verified`,
    pt: 'Lista de permissões que o usuário concedeu. Escopos OIDC começam com openid, profile, email etc.; escopos customizados costumam representar recursos da API (read:orders, api:write). Peça sempre o mínimo necessário.',
    en: 'List of permissions granted by the user. OIDC scopes start with openid, profile, email, etc.; custom scopes usually represent API resources (read:orders, api:write). Always request the minimum necessary.',
  },
  {
    cat: 'oidc',
    code: `// OIDC Authentication Request
GET /authorize?
  response_type=code
  &client_id=CLIENT_ID
  &redirect_uri=https://app.example.com/callback
  &scope=openid profile email
  &state=RANDOM_STATE
  &nonce=RANDOM_NONCE
  &code_challenge=CHALLENGE
  &code_challenge_method=S256`,
    pt: 'Pedido de autenticação OIDC. O escopo openid é obrigatório e informa ao servidor que você quer um ID token. nonce protege contra ataques de replay do ID token e deve ser validado pelo cliente.',
    en: 'OIDC authentication request. The openid scope is mandatory and tells the server you want an ID token. nonce protects against ID token replay attacks and must be validated by the client.',
  },
  {
    cat: 'oidc',
    code: `// ID Token validation checklist
1. Verify signature using JWKS from discovery
2. Check iss matches the provider's issuer
3. Check aud contains your client_id
4. Check exp > now and iat <= now + leeway
5. Verify nonce matches the value sent
6. If max_age was requested, validate auth_time
7. Reject tokens with alg=none`,
    pt: 'Checklist mínimo para confiar num ID token. Use uma biblioteca confiável (ex.: node-openid-client, oidc-client-ts, Auth0 SDK) e nunca ignore a assinatura ou o nonce.',
    en: 'Minimum checklist to trust an ID token. Use a trusted library (e.g. node-openid-client, oidc-client-ts, Auth0 SDK) and never ignore the signature or nonce.',
  },
  {
    cat: 'oidc',
    code: `// Logout endpoints (OIDC Session Management)
// RP-Initiated Logout (OIDC Front-Channel)
GET /oidc/logout?
  id_token_hint=ID_TOKEN
  &post_logout_redirect_uri=https://app.example.com/logged-out
  &state=RANDOM_STATE

// Back-Channel Logout (server-to-server)
POST /backchannel-logout
logout_token=LOGOUT_JWT`,
    pt: 'OIDC define formas de encerrar sessões. RP-Initiated Logout redireciona o usuário para o provedor. Back-Channel Logout notifica o client via servidor sem depender do navegador.',
    en: 'OIDC defines ways to end sessions. RP-Initiated Logout redirects the user to the provider. Back-Channel Logout notifies the client server-side without relying on the browser.',
  },
  {
    cat: 'security',
    code: `// state parameter — protege contra CSRF no fluxo redirect
const state = crypto.randomUUID();
sessionStorage.setItem('oauth_state', state);

// authorize: ...&state=STATE
// callback: compare state from URL with stored state
if (urlState !== storedState) throw new Error('CSRF');`,
    pt: 'Parâmetro aleatório que liga a requisição de autorização ao callback. Sem ele, um atacante pode forçar um usuário logado a associar uma conta maliciosa ou aceitar escopos indesejados.',
    en: 'Random parameter that binds the authorization request to the callback. Without it, an attacker can force a logged-in user to link a malicious account or accept unwanted scopes.',
  },
  {
    cat: 'security',
    code: `// Always use HTTPS and validate redirect_uri
// redirect_uri deve estar previamente cadastrado
// e combinado exatamente (path, query e fragment importam)
redirect_uri=https://app.example.com/callback`,
    pt: 'Todo tráfego OAuth2 deve ser HTTPS. A redirect_uri deve ser previamente registrada e comparada de forma exata (prefix match é perigoso). Uma URI mal validada permite roubar códigos de autorização.',
    en: 'All OAuth2 traffic must be HTTPS. The redirect_uri must be pre-registered and compared exactly (prefix matching is dangerous). A poorly validated URI allows authorization codes to be stolen.',
  },
  {
    cat: 'security',
    code: `// Short-lived tokens + rotation
access_token  → 5-15 minutos
refresh_token → 7-30 dias com rotação
id_token      → minutos

// A cada uso do refresh token, emita um novo par
token + refresh_token e invalide o antigo.`,
    pt: 'Tokens curtos limitam o dano em caso de vazamento. Rotação de refresh tokens detecta reutilização (quando um token já invalidado aparece novamente) e pode indicar roubo.',
    en: 'Short-lived tokens limit damage if leaked. Refresh token rotation detects reuse (when an already-invalidated token appears again) and may indicate theft.',
  },
  {
    cat: 'security',
    code: `// Confidential vs public clients
// Confidential: pode guardar segredo (backend, servidor)
client_secret + Authorization Code

// Public: não pode guardar segredo (SPA, mobile, desktop)
// Use Authorization Code + PKCE, sem client_secret
// Nunca armazene client_secret no frontend.`,
    pt: 'Clientes confidenciais rodam em servidores seguros e autenticam com client_secret. Clientes públicos não podem manter segredos, por isso PKCE é obrigatório. Secrets no frontend são considerados públicos.',
    en: 'Confidential clients run on secure servers and authenticate with client_secret. Public clients cannot keep secrets, so PKCE is mandatory. Secrets in the frontend are considered public.',
  },
  {
    cat: 'security',
    code: `// Scope minimization
// Peça apenas o necessário no momento do consentimento
scope=openid email

// Escalada de privilégios:
// - Não permita que o cliente peça escopos admin sem aprovação explícita
// - Separe escopos sensíveis em consentimentos específicos`,
    pt: 'Princípio do menor privilégio: solicite apenas os escopos que a funcionalidade atual precisa. Escopos administrativos ou sensíveis devem exigir aprovação explícita do usuário ou do administrador.',
    en: 'Principle of least privilege: request only the scopes the current feature needs. Administrative or sensitive scopes should require explicit user or admin approval.',
  },
  {
    cat: 'attack',
    code: `// Authorization Code Interception
// Cenário: app malicioso registra URL scheme/callback no mobile
// e intercepta o código.

// Mitigações:
// 1. PKCE obrigatório
// 2. redirect_uri exata e HTTPS
// 3. Verificação do estado`,
    pt: 'Em aplicativos mobile e SPAs, um código interceptado pode ser trocado por tokens. PKCE impede essa troca porque o atacante não possui o verifier. redirect_uri exata e state também reduzem a janela de ataque.',
    en: 'In mobile apps and SPAs, an intercepted code can be exchanged for tokens. PKCE prevents this exchange because the attacker does not have the verifier. Exact redirect_uri and state also reduce the attack surface.',
  },
  {
    cat: 'attack',
    code: `// CSRF / Session Fixation via redirect
// Atacante inicia fluxo OAuth e força vítima a concluir com state
// controlado pelo atacante.

// Mitigação: state aleatório e vinculado à sessão do usuário
const state = crypto.randomUUID();
// armazene no cookie httpOnly ou sessionStorage`,
    pt: 'Sem state, um atacante pode empurrar um usuário logado para o callback com um código atrelado à conta do atacante. state deve ser imprevisível e validado estritamente no retorno.',
    en: 'Without state, an attacker can push a logged-in user to the callback with a code tied to the attacker account. state must be unpredictable and strictly validated on return.',
  },
  {
    cat: 'attack',
    code: `// Token leakage (logs, browser history, referer)
// Access tokens nunca devem aparecer em:
// - URLs (query/fragment)
// - logs de servidor
// - histórico do navegador
// - referer para sites de terceiros

// Mitigações:
// - Use Authorization Code + PKCE
// - Armazene tokens em memória
// - Prefira cookies httpOnly para refresh tokens`,
    pt: 'Tokens em URLs ou logs vazam facilmente. Guarde tokens em memória quando possível; use cookies httpOnly/secure/sameSite para refresh tokens e evite passar tokens por parâmetros de URL.',
    en: 'Tokens in URLs or logs leak easily. Store tokens in memory when possible; use httpOnly/secure/sameSite cookies for refresh tokens and avoid passing tokens in URL parameters.',
  },
  {
    cat: 'attack',
    code: `// Open Redirect via redirect_uri
// Atacante altera redirect_uri para um domínio dele:
redirect_uri=https://evil.example.com/callback

// Mitigação:
// - Cadastre URIs exatas (não prefixes)
// - Valide scheme, host, path e port
// - Rejeite wildcards e localhost em produção`,
    pt: 'redirect_uri é o vetor mais comum de ataque OAuth. Aceitar qualquer subdomínio ou prefixo permite que códigos/tokens sejam enviados para domínios maliciosos. Cadastre e valide exatamente cada URI.',
    en: 'redirect_uri is the most common OAuth attack vector. Accepting arbitrary subdomains or prefixes allows codes/tokens to be sent to malicious domains. Register and validate each URI exactly.',
  },
]
