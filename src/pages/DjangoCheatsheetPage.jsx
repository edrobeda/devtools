import React, { useMemo, useState, useCallback } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message, Collapse } from 'antd'
import { CodeOutlined, SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = [
  'cli',
  'project',
  'models',
  'orm',
  'views',
  'templates',
  'forms',
  'admin',
  'auth',
  'drf',
  'tests',
  'gotchas',
]

const CATEGORY_COLOR = {
  cli: 'geekblue',
  project: 'purple',
  models: 'green',
  orm: 'cyan',
  views: 'blue',
  templates: 'gold',
  forms: 'magenta',
  admin: 'red',
  auth: 'volcano',
  drf: 'orange',
  tests: 'lime',
  gotchas: 'purple',
}

const labelOf = {
  cli: { pt: 'CLI & manage.py', en: 'CLI & manage.py' },
  project: { pt: 'Projeto, settings & rotas', en: 'Project, settings & routing' },
  models: { pt: 'Models & campos', en: 'Models & fields' },
  orm: { pt: 'ORM & Querysets', en: 'ORM & querysets' },
  views: { pt: 'Views (FBV & CBV)', en: 'Views (FBV & CBV)' },
  templates: { pt: 'Templates (DTL)', en: 'Templates (DTL)' },
  forms: { pt: 'Forms & validação', en: 'Forms & validation' },
  admin: { pt: 'Admin do Django', en: 'Django admin' },
  auth: { pt: 'Autenticação & usuários', en: 'Authentication & users' },
  drf: { pt: 'Django REST Framework', en: 'Django REST Framework' },
  tests: { pt: 'Testes', en: 'Testing' },
  gotchas: { pt: 'Gotchas & boas práticas', en: 'Gotchas & best practices' },
}

const COMMANDS = [
  // ─── CLI & manage.py ───────────────────────────────────────────────────────
  { cmd: 'django-admin startproject meusite .', cat: 'cli', pt: 'Cria o projeto na pasta atual (o ponto evita subpasta aninhada)', en: 'Creates the project in the current folder (the dot avoids a nested dir)' },
  { cmd: 'python manage.py startapp blog', cat: 'cli', pt: 'Cria um app (precisa ser adicionado em INSTALLED_APPS)', en: 'Creates an app (must be added to INSTALLED_APPS)' },
  { cmd: 'python manage.py runserver', cat: 'cli', pt: 'Servidor de dev em 127.0.0.1:8000 (recarrega sozinho)', en: 'Dev server on 127.0.0.1:8000 (auto-reloads)' },
  { cmd: 'python manage.py runserver 0.0.0.0:8000', cat: 'cli', pt: 'Exponhe o server na rede (para testes em máquinas/containers)', en: 'Exposes the server on the network (for VMs/containers)' },
  { cmd: 'python manage.py makemigrations blog', cat: 'cli', pt: 'Gera migrations a partir das mudanças nos models', en: 'Generates migrations from the model changes' },
  { cmd: 'python manage.py migrate', cat: 'cli', pt: 'Aplica as migrations no banco', en: 'Applies the migrations to the database' },
  { cmd: 'python manage.py showmigrations', cat: 'cli', pt: 'Migrations aplicadas/pendentes (marcadas com [X])', en: 'Applied/pending migrations (marked with [X])' },
  { cmd: 'python manage.py sqlmigrate blog 0001', cat: 'cli', pt: 'Mostra o SQL que a migration vai executar, sem rodar', en: 'Shows the SQL a migration will run, without running it' },
  { cmd: 'python manage.py check', cat: 'cli', pt: 'Valida a configuração e os models sem tocar no banco', en: 'Validates configuration and models without touching the DB' },
  { cmd: 'python manage.py shell', cat: 'cli', pt: 'Python interativo com o Django carregado (DB, models, settings)', en: 'Interactive Python with Django loaded (DB, models, settings)' },
  { cmd: 'python manage.py shell -c "User.objects.count()"', cat: 'cli', pt: 'Executa código inline sem entrar no shell interativo', en: 'Runs inline code without entering the interactive shell' },
  { cmd: 'python manage.py createsuperuser', cat: 'cli', pt: 'Cria um usuário superuser para o admin', en: 'Creates a superuser for the admin' },
  { cmd: 'python manage.py collectstatic', cat: 'cli', pt: 'Copia arquivos estáticos para STATIC_ROOT (necessário em produção)', en: 'Copies static files to STATIC_ROOT (required in production)' },
  { cmd: 'python manage.py test', cat: 'cli', pt: 'Roda a suíte de testes de todos os apps', en: 'Runs the whole test suite' },
  { cmd: 'python manage.py test blog -v 2', cat: 'cli', pt: 'Testes só do app blog com saída verbosa', en: 'Tests only for the blog app, verbose output' },
  { cmd: 'python manage.py dbshell', cat: 'cli', pt: 'Abre o client do banco configurado em DATABASES', en: 'Opens the configured database client' },
  { cmd: 'python manage.py dumpdata blog.Post --indent 2 > posts.json', cat: 'cli', pt: 'Exporta dados como fixture JSON', en: 'Exports data as a JSON fixture' },
  { cmd: 'python manage.py loaddata posts.json', cat: 'cli', pt: 'Importa uma fixture (cuidado: pode duplicar se já existir)', en: 'Loads a fixture (careful: can duplicate existing rows)' },
  { cmd: 'python manage.py flush', cat: 'cli', pt: 'Limpa todos os dados (mantém as tabelas e migrations)', en: 'Clears all data (keeps tables and migrations)' },
  { cmd: 'python manage.py migrate blog zero', cat: 'cli', pt: 'Desfaz todas as migrations do app blog', en: 'Rolls back every migration of the blog app' },

  // ─── Projeto, settings & rotas ────────────────────────────────────────────
  { cmd: "ALLOWED_HOSTS = ['devtools.eventifylab.com', 'localhost']", cat: 'project', pt: 'Hosts aceitos — sem isso, produção responde 400 Bad Request', en: 'Accepted hosts — without it production answers 400 Bad Request' },
  { cmd: "DEBUG = False", cat: 'project', pt: 'Nunca deixe True em produção: vaza stack traces e settings', en: 'Never True in production: it leaks stack traces and settings' },
  { cmd: "SECRET_KEY = os.environ['DJANGO_SECRET_KEY']", cat: 'project', pt: 'Sempre de env var — nunca no git', en: 'Always from an env var — never in git' },
  { cmd: "TIME_ZONE = 'America/Sao_Paulo'", cat: 'project', pt: 'Fuso da aplicação (as datas são guardadas em UTC quando USE_TZ=True)', en: 'Application timezone (dates are stored in UTC when USE_TZ=True)' },
  { cmd: 'USE_TZ = True', cat: 'project', pt: 'Guarda datas em UTC e converte na renderização — recomendado', en: 'Stores dates in UTC and converts when rendering — recommended' },
  { cmd: "LANGUAGE_CODE = 'pt-br'", cat: 'project', pt: 'Locale padrão (labels do admin, plurais etc.)', en: 'Default locale (admin labels, pluralization, etc.)' },
  { cmd: "DATABASES = {'default': {'ENGINE': 'django.db.backends.postgresql', 'NAME': 'app', 'USER': 'app', 'PASSWORD': 'x', 'HOST': 'db', 'PORT': '5432'}}", cat: 'project', pt: 'Conexão com Postgres (sqlite3 é o padrão de dev)', en: 'Postgres connection (sqlite3 is the dev default)' },
  { cmd: "AUTH_USER_MODEL = 'accounts.User'", cat: 'project', pt: 'User custom desde o início — antes da primeira migrate', en: 'Custom user from the start — before the first migrate' },
  { cmd: "STATIC_URL = 'static/'\nSTATICFILES_DIRS = [BASE_DIR / 'static']", cat: 'project', pt: 'Onde o collectstatic procura e onde serve em dev', en: 'Where collectstatic looks and where it serves in dev' },
  { cmd: "MEDIA_URL = 'media/'\nMEDIA_ROOT = BASE_DIR / 'media'", cat: 'project', pt: 'Para FileField/ImageField (uploads), fora do static', en: 'For FileField/ImageField (uploads), outside of static' },
  { cmd: "path('admin/', admin.site.urls)", cat: 'project', pt: 'Rota obrigatória do admin no urls.py do projeto', en: 'Required admin route in the project urls.py' },
  { cmd: "path('api/', include('blog.urls'))", cat: 'project', pt: 'Inclui as rotas de um app sob um prefixo', en: 'Includes an app rotas under a prefix' },
  { cmd: "path('posts/<int:pk>/', views.post_detail, name='post-detail')", cat: 'project', pt: 'Converter <int:pk> captura e converte para int (404 se não for)', en: 'The <int:pk> converter captures and casts to int (404 otherwise)' },
  { cmd: "re_path(r'^posts/(?P<slug>[-\\w]+)/$', views.post, name='post')", cat: 'project', pt: 'Regex clássica com grupo nomeado (alternativa ao converter)', en: 'Classic regex with a named group (instead of converters)' },
  { cmd: 'path converters: <str:> <int:> <slug:> <uuid:> <path:>', cat: 'project', pt: 'Converters prontos — <path:> pega barras, <uuid:> valida UUID', en: 'Built-in converters — <path:> matches slashes, <uuid:> validates UUIDs' },
  { cmd: "app_name = 'blog'\nreverse('blog:post-detail', kwargs={'pk': 1})", cat: 'project', pt: 'Namespaces: nomeia a app e gera URLs reversamente', en: 'Namespaces: name the app and reverse URLs by name' },
  { cmd: "path('posts/2026/', views.posts, name='posts-2026', kwargs={'ano': 2026})", cat: 'project', pt: 'kwargs extras fixos da rota, sem virem da URL', en: 'Extra fixed kwargs for the view, not from the URL' },
  { cmd: 'class HexConverter: ...\nregister_converter(HexConverter, \'hex\')', cat: 'project', pt: 'Converters customizados para padrões próprios de URL', en: 'Custom converters for your own URL patterns' },
  { cmd: "from django.urls import path\nurlpatterns = [path('', views.index)]", cat: 'project', pt: 'Estrutura mínima de um urls.py de app', en: 'Minimum structure of an app urls.py' },
  { cmd: "handler404 = 'blog.views.not_found'", cat: 'project', pt: 'View customizada para o erro 404', en: 'Custom view for the 404 error' },

  // ─── Models & campos ───────────────────────────────────────────────────────
  { cmd: 'from django.db import models\n\nclass Post(models.Model):\n    title = models.CharField(max_length=200)\n    body = models.TextField()\n    published = models.BooleanField(default=False)\n    created_at = models.DateTimeField(auto_now_add=True)', cat: 'models', pt: 'Model mínimo com CharField, TextField, BooleanField e timestamp', en: 'Minimal model with CharField, TextField, BooleanField and a timestamp' },
  { cmd: 'models.CharField(max_length=200)', cat: 'models', pt: 'String curta — max_length é obrigatório', en: 'Short string — max_length is required' },
  { cmd: 'models.TextField()', cat: 'models', pt: 'Texto longo, sem limite prático', en: 'Long free-form text' },
  { cmd: 'models.DecimalField(max_digits=10, decimal_places=2)', cat: 'models', pt: 'Decimal exato para dinheiro (nunca FloatField)', en: 'Exact decimal for money (never FloatField)' },
  { cmd: 'models.DateTimeField(auto_now_add=True)', cat: 'models', pt: 'Seta o timestamp apenas na criação', en: 'Sets the timestamp only on creation' },
  { cmd: 'models.DateTimeField(auto_now=True)', cat: 'models', pt: 'Atualiza o timestamp em todo save()', en: 'Updates the timestamp on every save()' },
  { cmd: 'models.UUIDField(default=uuid.uuid4, editable=False)', cat: 'models', pt: 'UUID como PK pública (evita enumerar ids)', en: 'UUID as a public PK (avoids enumerable ids)' },
  { cmd: 'models.JSONField(default=dict, blank=True)', cat: 'models', pt: 'JSON nativo do banco (dica: sempre default=dict)', en: 'Native DB JSON (tip: always default=dict)' },
  { cmd: "null=True", cat: 'models', pt: 'Permite NULL no banco (pra campos vazios de verdade)', en: 'Allows NULL in the database (for truly empty fields)' },
  { cmd: "blank=True", cat: 'models', pt: 'Permite vazio em formulários (é validação de form, não de banco)', en: 'Allows empty in forms (form validation, not DB)' },
  { cmd: "unique=True", cat: 'models', pt: 'Garante unicidade no banco (índice único)', en: 'Enforces uniqueness in the database (unique index)' },
  { cmd: "db_index=True", cat: 'models', pt: 'Cria índice para acelerar buscas por esse campo', en: 'Adds an index to speed up lookups' },
  { cmd: "default=0", cat: 'models', pt: 'Valor padrão usado na criação (na migração e no form)', en: 'Default value used on creation (migration and form)' },
  { cmd: "class Meta:\n    ordering = ['-created_at']", cat: 'models', pt: 'Order padrão dos querysets desse model', en: 'Default ordering for this model querysets' },
  { cmd: "class Meta:\n    constraints = [models.CheckConstraint(check=models.Q(age__gte=18), name='age_18_plus')]", cat: 'models', pt: 'CheckConstraint no banco (aqui, força idade >= 18)', en: 'A DB-level CheckConstraint (here, forcing age >= 18)' },
  { cmd: "from django.db import models\nclass Status(models.TextChoices):\n    DRAFT = 'draft', 'Rascunho'\n    PUBLISHED = 'pub', 'Publicado'", cat: 'models', pt: 'Enum de choices com label legível (valor, label)', en: 'Choices enum with readable labels (value, label)' },
  { cmd: "author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')", cat: 'models', pt: 'FK com cascade e related_name para o acesso reverso', en: 'FK with cascade and related_name for the reverse accessor' },
  { cmd: 'on_delete=models.SET_NULL / PROTECT / SET_DEFAULT / DO_NOTHING / CASCADE', cat: 'models', pt: 'Comportamento ao deletar a referência (CASCADE é o mais comum)', en: 'Behavior when the referenced row is deleted (CASCADE is the common one)' },
  { cmd: "tags = models.ManyToManyField(Tag, related_name='posts')", cat: 'models', pt: 'M2M simples (tabela de junção automática)', en: 'Plain M2M (automatic join table)' },
  { cmd: "class Membership(models.Model):\n    group = models.ForeignKey(Group, on_delete=models.CASCADE)\n    member = models.ForeignKey(Person, on_delete=models.CASCADE)\n    joined = models.DateField()", cat: 'models', pt: 'M2M com dados extras via tabela de junção explícita (through)', en: 'M2M with extra data via an explicit join table (through)' },
  { cmd: 'def __str__(self):\n    return self.title', cat: 'models', pt: 'Representação legível no admin, shell e logs', en: 'Readable representation in admin, shell and logs' },
  { cmd: 'def get_absolute_url(self):\n    from django.urls import reverse\n    return reverse(\'post-detail\', kwargs={\'pk\': self.pk})', cat: 'models', pt: 'Liga o model à sua URL (usado por redirect() e no admin)', en: 'Ties the model to its URL (used by redirect() and the admin)' },

  // ─── ORM & Querysets ──────────────────────────────────────────────────────
  { cmd: 'Post.objects.all()', cat: 'orm', pt: 'Todos os objetos (lazy — só executa quando é avaliado)', en: 'All objects (lazy — only runs when evaluated)' },
  { cmd: 'Post.objects.filter(status=Status.PUBLISHED, author_id=1)', cat: 'orm', pt: 'Filtra com AND entre os argumentos', en: 'Filters with AND between arguments' },
  { cmd: 'Post.objects.exclude(published=False)', cat: 'orm', pt: 'Exclui linhas que casam (NOT)', en: 'Excludes matching rows (NOT)' },
  { cmd: 'post = Post.objects.get(pk=1)', cat: 'orm', pt: 'Retorna uma única linha — lança DoesNotExist/MultipleObjectsReturned', en: 'Returns a single row — raises DoesNotExist/MultipleObjectsReturned' },
  { cmd: 'obj, created = Post.objects.get_or_create(slug=slug, defaults={\'title\': t})', cat: 'orm', pt: 'Busca ou cria atômicamente; created indica se criou', en: 'Fetch-or-create atomically; created tells if it created' },
  { cmd: 'Post.objects.filter(pk=1).update(views=F(\'views\') + 1)', cat: 'orm', pt: 'update() evita carregar objetos na memória', en: 'update() avoids loading objects into memory' },
  { cmd: 'Post.objects.filter(published=False).delete()', cat: 'orm', pt: 'Deleta em lote e retorna a contagem (com cascade)', en: 'Bulk deletes and returns the count (with cascades)' },
  { cmd: 'Post.objects.exists() / .count()', cat: 'orm', pt: 'Gatilhos baratos de existência/contagem', en: 'Cheap existence/count checks' },
  { cmd: 'Post.objects.first() / .last()', cat: 'orm', pt: 'Primeiro/último pela ordenação padrão do model', en: 'First/last by the model default ordering' },
  { cmd: 'Post.objects.filter(title__icontains=\'django\')', cat: 'orm', pt: 'Busca case-insensitive de substring', en: 'Case-insensitive substring search' },
  { cmd: 'Post.objects.filter(pk__in=[1, 2, 3])', cat: 'orm', pt: 'Dentro de uma lista (IN)', en: 'Member of a list (IN)' },
  { cmd: 'Post.objects.filter(created_at__range=(inicio, fim))', cat: 'orm', pt: 'Intervalo inclusivo entre duas datas', en: 'Inclusive range between two datetimes' },
  { cmd: 'field lookups: __exact __iexact __contains __icontains __startswith __endswith __in __gt __gte __lt __lte __range __isnull __regex __date', cat: 'orm', pt: 'Os lookups de campo que o ORM entende', en: 'The field lookups the ORM understands' },
  { cmd: 'Post.objects.order_by(\'-created_at\', \'id\')', cat: 'orm', pt: 'Ordena por campo(s); o - inverte', en: 'Orders by field(s); the minus reverses' },
  { cmd: 'Post.objects.order_by(\'?\')[:5]', cat: 'orm', pt: 'Ordem aleatória + slice — evite em tabelas grandes', en: 'Random order + slice — avoid on big tables' },
  { cmd: 'Post.objects.values(\'id\', \'title\')', cat: 'orm', pt: 'Dicionários em vez de objetos (mais leve p/ JSON)', en: 'Dictionaries instead of objects (lighter for JSON)' },
  { cmd: 'Post.objects.values_list(\'id\', flat=True)', cat: 'orm', pt: 'Lista plana de valores de uma coluna', en: 'Flat list of a single column values' },
  { cmd: 'Post.objects.distinct()', cat: 'orm', pt: 'Remove duplicatas (combinar com values())', en: 'Deduplicates (combine with values())' },
  { cmd: 'Post.objects.annotate(num_comments=Count(\'comments\'))', cat: 'orm', pt: 'Adiciona colunas agregadas por objeto (como um subselect)', en: 'Adds aggregate columns per object (like a subselect)' },
  { cmd: 'from django.db.models import Avg\nAvg_rating = Post.objects.aggregate(avg=Avg(\'rating\'))', cat: 'orm', pt: 'Agregação da tabela inteira (COUNT/SUM/AVG/MIN/MAX por grupo)', en: 'Whole-table aggregation (COUNT/SUM/AVG/MIN/MAX)' },
  { cmd: 'from django.db.models import F\nPost.objects.update(views=F(\'views\') + 1)', cat: 'orm', pt: 'F refere a outra coluna no banco — atualização atômica sem race', en: 'F refers to another column in the DB — atomic update, no race' },
  { cmd: 'from django.db.models import Q\nPost.objects.filter(Q(author=me) & ~Q(status=Status.DRAFT))', cat: 'orm', pt: 'Q compõe OR/AND/NOT no filter', en: 'Q composes OR/AND/NOT inside filter' },
  { cmd: 'Post.objects.select_related(\'author\')', cat: 'orm', pt: 'JOIN em FK/O2O — resolve o problema do N+1', en: 'JOIN on FKs/O2O — fixes the N+1 problem' },
  { cmd: 'Post.objects.prefetch_related(\'tags\')', cat: 'orm', pt: 'Pré-busca de M2M/reverso em query separada', en: 'Prefetches M2M/reverse in a separate query' },
  { cmd: 'Post.objects.filter(author__name__icontains=\'ana\')', cat: 'orm', pt: 'Atravessa relações com __ (join implícito)', en: 'Crosses relations with __ (implicit join)' },
  { cmd: 'from django.core.paginator import Paginator\npaginator = Paginator(Post.objects.all(), 10)', cat: 'orm', pt: 'Paginação pronta (page, has_next, page_range...)', en: 'Ready pagination (page, has_next, page_range...)' },
  { cmd: 'with transaction.atomic():\n    post = Post.objects.create(...)\n    log = Log.objects.create(post_id=post.pk)', cat: 'orm', pt: 'Bloco atômico: ou tudo commita, ou tudo é revertido', en: 'Atomic block: everything commits or rolls back' },
  { cmd: 'Post.objects.select_for_update().filter(id=1)', cat: 'orm', pt: 'Lock pessimista da linha até o fim da transação', en: 'Pessimistic row lock until the transaction ends' },
  { cmd: 'Post.objects.bulk_create([Post(title=f\'Post {i}\') for i in range(100)])', cat: 'orm', pt: 'Insere muitos de uma vez (1 query, sem save() individual)', en: 'Inserts many at once (1 query, no per-obj save())' },
  { cmd: 'Post.objects.filter(pk=1).only(\'title\')', cat: 'orm', pt: 'Carrega só colunas listadas (lazy loading das demais)', en: 'Loads only the listed columns (others load lazily)' },

  // ─── Views (FBV & CBV) ─────────────────────────────────────────────────────
  { cmd: 'def index(request):\n    posts = Post.objects.all()\n    return render(request, \'blog/index.html\', {\'posts\': posts})', cat: 'views', pt: 'Function-based view básica com render', en: 'Basic function-based view with render' },
  { cmd: 'from django.http import JsonResponse\nreturn JsonResponse({\'ok\': True})', cat: 'views', pt: 'Resposta JSON (serializa dicts) — para AJAX/APIs leves', en: 'JSON response (serializes dicts) — for AJAX/light APIs' },
  { cmd: 'from django.http import Http404\nraise Http404(\'Não existe\')', cat: 'views', pt: 'Lança o erro 404 com a view do handler404', en: 'Raises the 404 with the handler404 view' },
  { cmd: 'return redirect(\'blog:post-detail\', pk=id)', cat: 'views', pt: 'Redirect para uma rota nomeada (usa reverse por baixo)', en: 'Redirect to a named route (uses reverse under the hood)' },
  { cmd: 'request.method', cat: 'views', pt: 'Método HTTP: \'GET\', \'POST\'... — ramifique com if', en: 'HTTP method: \'GET\', \'POST\'... — branch with if' },
  { cmd: 'request.POST.get(\'titulo\', \'\')', cat: 'views', pt: 'Dado enviado em formulário POST (dict-style)', en: 'Data sent in a POST form (dict-style)' },
  { cmd: 'request.GET.get(\'q\', \'\')', cat: 'views', pt: 'Query string da URL (?q=...)', en: 'URL query string (?q=...)' },
  { cmd: 'request.FILES[\'imagem\']', cat: 'views', pt: 'Arquivos enviados (para FileField/ImageField)', en: 'Uploaded files (for FileField/ImageField)' },
  { cmd: 'request.user', cat: 'views', pt: 'Usuário logado (AnonUser se não autenticado)', en: 'The logged-in user (AnonUser if not authenticated)' },
  { cmd: 'from django.views.decorators.http import require_POST\n@require_POST\ndef criar(request): ...', cat: 'views', pt: 'Restringe o método — sem GET não cai aqui (405)', en: 'Restricts the method — non-POST gets a 405' },
  { cmd: 'from django.contrib.auth.decorators import login_required\n@login_required\ndef minha_visao(request): ...', cat: 'views', pt: 'Exige login (redireciona para LOGIN_URL)', en: 'Requires login (redirects to LOGIN_URL)' },
  { cmd: '{% csrf_token %}', cat: 'views', pt: 'Valida CSRF em forms POST — sem isso, 403 em views com @csrf_exempt não usado', en: 'Validates CSRF on POST forms — without it you get a 403' },
  { cmd: 'from django.views.generic import ListView\nclass PostList(ListView):\n    model = Post\n    paginate_by = 10', cat: 'views', pt: 'ListView genérica: lista paginada com template padrão', en: 'Generic ListView: paginated list with a default template' },
  { cmd: 'class PostDetail(DetailView):\n    model = Post', cat: 'views', pt: 'DetailView usa a PK da URL (post_detail.html)', en: 'DetailView uses the URL pk (context: post_detail.html)' },
  { cmd: 'class PostCreate(CreateView):\n    model = Post\n    fields = [\'title\', \'body\']\n    success_url = \'/\'', cat: 'views', pt: 'Form + POST + redirect prontos (template post_form.html)', en: 'Form + POST + redirect ready (template post_form.html)' },
  { cmd: 'class PostEdit(UpdateView):\n    model = Post\n    fields = [\'title\', \'body\']', cat: 'views', pt: 'Igual ao CreateView, mas pré-preenchido pelo objeto da URL', en: 'Like CreateView, but pre-filled from the URL object' },
  { cmd: 'def get_queryset(self):\n    return super().get_queryset().filter(author=self.request.user)', cat: 'views', pt: 'Override clássico: restringe o queryset da CBV ao usuário', en: 'Classic override: restricts the CBV queryset to the user' },
  { cmd: 'from django.shortcuts import get_object_or_404\npost = get_object_or_404(Post, pk=pk)', cat: 'views', pt: 'get() + Http404 num só (entry point das views)', en: 'get() + Http404 in one go (views entry point)' },
  { cmd: 'context_object_name = \'posts\'', cat: 'views', pt: 'Nome do objeto no template (senão usa object_list)', en: 'Object name in the template (otherwise object_list)' },

  // ─── Templates (DTL) ───────────────────────────────────────────────────────
  { cmd: '{{ post.title }}', cat: 'templates', pt: 'Interpolação de variável (atributos e dicionários com ponto)', en: 'Variable interpolation (attributes and dicts via dot)' },
  { cmd: "{{ post.title|default:'(sem título)' }}", cat: 'templates', pt: 'Filtro com valor padrão', en: 'Filter with a fallback value' },
  { cmd: "{{ post.created_at|date:'d/m/Y H:i' }}", cat: 'templates', pt: 'Formata data/hora no template (veja o Python strftime)', en: 'Formats a datetime in the template (cf. Python strftime)' },
  { cmd: '{{ texto|truncatechars:80 }}', cat: 'templates', pt: 'Corta a string em N caracteres com reticências', en: 'Truncates a string to N characters with ellipsis' },
  { cmd: '{{ preco|floatformat:2 }}', cat: 'templates', pt: 'Formata float (2 casas)', en: 'Formats a float (2 decimals)' },
  { cmd: '{{ lista|length }} / {{ obj|upper }} / {{ nome|title }}', cat: 'templates', pt: 'Filtros comuns: tamanho, maiúsculas, capitalização', en: 'Common filters: length, uppercase, titlecase' },
  { cmd: "{{ texto|linebreaksbr }}", cat: 'templates', pt: 'Converte quebras de linha em <br>', en: 'Turns newlines into <br>' },
  { cmd: '{{ html_duro|safe }}', cat: 'templates', pt: 'Marca o conteúdo como seguro (NÃO use em input de usuário — XSS)', en: 'Marks content as safe (do NOT use on user input — XSS)' },
  { cmd: '{% if post.published %}Publicado{% else %}Rascunho{% endif %}', cat: 'templates', pt: 'Condicional (if/elif/else)', en: 'Conditional (if/elif/else)' },
  { cmd: '{% for post in posts %}{{ post.title }}{% endfor %}', cat: 'templates', pt: 'Loop sobre uma lista/queryset', en: 'Loop over a list/queryset' },
  { cmd: '{% for post in posts %}{{ forloop.counter }} — {{ post.title }}{% empty %}Nada aqui{% endfor %}', cat: 'templates', pt: 'forloop.counter (1-indice) e o bloco {% empty %} quando vazio', en: 'forloop.counter (1-based) and the {% empty %} block when empty' },
  { cmd: "{% url 'blog:post-detail' post.pk %}", cat: 'templates', pt: 'Gera a URL de uma rota nomeada no template', en: 'Resolves a named route URL in the template' },
  { cmd: "{% static 'css/app.css' %}", cat: 'templates', pt: 'URL de arquivo estático (após {% load static %})', en: 'Static file URL (after {% load static %})' },
  { cmd: "{% extends 'base.html' %}", cat: 'templates', pt: 'Herança de template — os {% block %} preenchem o base', en: 'Template inheritance — {% block %}s fill the base' },
  { cmd: '{% block content %}...{% endblock %}', cat: 'templates', pt: 'Define um bloco substituível e/ou {{ block.super }} para estender', en: 'Defines an overridable block; {{ block.super }} extends it' },
  { cmd: "{% include 'blog/_form.html' %}", cat: 'templates', pt: 'Inclui um template parcial (com _ unção de convenção)', en: 'Includes a partial template (underscore-convention)' },
  { cmd: '{% comment %}texto ignorado{% endcomment %}', cat: 'templates', pt: 'Comentário que some do output', en: 'Comment that disappears from the output' },
  { cmd: "{% now 'Y-m-d' %}", cat: 'templates', pt: 'Data/hora atual formatada', en: 'Now-formatted datetime' },
  { cmd: '{% load filtros_personalizados %}', cat: 'templates', pt: 'Carrega template tags/filtros do app (templatetags/)', en: 'Loads custom template tags/filters (templatetags/)' },
  { cmd: "{{ post.body|slugify }}", cat: 'templates', pt: 'Gera um slug do texto (para URLs)', en: 'Slugifies the text (for URLs)' },

  // ─── Forms & validação ─────────────────────────────────────────────────────
  { cmd: 'from django import forms\nclass ContatoForm(forms.Form):\n    nome = forms.CharField(max_length=100)\n    email = forms.EmailField()', cat: 'forms', pt: 'Form declarativo com campos tipados', en: 'Declarative form with typed fields' },
  { cmd: "class PostForm(forms.ModelForm):\n    class Meta:\n        model = Post\n        fields = ['title', 'body', 'published']", cat: 'forms', pt: 'ModelForm: gera campos do model e valida com as constraints', en: 'ModelForm: builds fields from the model and validates constraints' },
  { cmd: "fields = '__all__'", cat: 'forms', pt: 'Todos os campos do model (ou liste explicitamente)', en: 'All model fields (or list them explicitly)' },
  { cmd: 'if form.is_valid():\n    post = form.save()\nelse:\n    print(form.errors)', cat: 'forms', pt: 'Validação + save padrão no POST', en: 'Validation + default save on POST' },
  { cmd: 'post = form.save(commit=False)\npost.author = request.user\npost.save()', cat: 'forms', pt: 'Preenche campos que não estão no form antes de salvar', en: 'Fills fields not in the form before saving' },
  { cmd: 'form.cleaned_data[\'titulo\']', cat: 'forms', pt: 'Dados limpos (conversão e validação já aplicadas)', en: 'Clean data (conversion and validation already applied)' },
  { cmd: "def clean_email(self):\n    email = self.cleaned_data['email']\n    if not email.endswith('@lab.com'):\n        raise forms.ValidationError('Domínio inválido')\n    return email", cat: 'forms', pt: 'Validação por campo: clean_<campo>()', en: 'Per-field validation: clean_<field>()' },
  { cmd: 'def clean(self):\n    if self.cleaned_data.get(\'a\') > self.cleaned_data.get(\'b\'):\n        raise forms.ValidationError(\'a deve ser menor que b\')', cat: 'forms', pt: 'Validação cruzando vários campos em clean()', en: 'Cross-field validation in clean()' },
  { cmd: "from django.core.validators import RegexValidator\ncelular = forms.CharField(validators=[RegexValidator(r'^\\+?\\d{10,15}$')])", cat: 'forms', pt: 'Validators reutilizáveis por campo', en: 'Reusable per-field validators' },
  { cmd: '{{ form.as_p }} / {{ form.as_table }} / {{ form.as_ul }}', cat: 'forms', pt: 'Renderização rápida do form inteiro (estilo base)', en: 'Quick whole-form rendering (base style)' },
  { cmd: "{{ form.title.errors }} {{ form.title }}", cat: 'forms', pt: 'Renderiza campo + erros manualmente (para controle fino)', en: 'Renders field + errors manually (fine control)' },
  { cmd: "widget=forms.Textarea(attrs={'rows': 5, 'placeholder': 'Digite...'})", cat: 'forms', pt: 'Troca o widget do campo e atributos HTML', en: 'Swaps the field widget and HTML attributes' },
  { cmd: "form = PostForm(request.POST, request.FILES)", cat: 'forms', pt: 'Form com arquivos: passe request.FILES também', en: 'Form with files: also pass request.FILES' },
  { cmd: 'from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm', cat: 'forms', pt: 'Forms prontos de auth: criar usuário, trocar senha...', en: 'Ready auth forms: create user, change password...' },

  // ─── Admin do Django ───────────────────────────────────────────────────────
  { cmd: '@admin.register(Post)\nclass PostAdmin(admin.ModelAdmin):\n    pass', cat: 'admin', pt: 'Registra o model no admin com o decorador', en: 'Registers the model in the admin with the decorator' },
  { cmd: 'list_display = (\'id\', \'title\', \'published\', \'author\', \'created_at\')', cat: 'admin', pt: 'Colunas visíveis na listagem', en: 'Columns shown in the list view' },
  { cmd: 'list_filter = (\'published\', \'created_at\')', cat: 'admin', pt: 'Filtros laterais por campo', en: 'Sidebar filters by field' },
  { cmd: 'search_fields = (\'title\', \'body\')', cat: 'admin', pt: 'Campo de busca (vira WHERE ILIKE)', en: 'Search box (becomes WHERE ILIKE)' },
  { cmd: "prepopulated_fields = {'slug': ('title',)}", cat: 'admin', pt: 'Preenche o slug automaticamente a partir do title', en: 'Auto-fills the slug from the title' },
  { cmd: "readonly_fields = ('created_at',)", cat: 'admin', pt: 'Campos só de leitura na edição', en: 'Read-only fields on the edit page' },
  { cmd: "exclude = ('slug',)", cat: 'admin', pt: 'Esconde campos do formulário de edição', en: 'Hides fields from the edit form' },
  { cmd: 'date_hierarchy = \'created_at\'', cat: 'admin', pt: 'Navegação por ano/mês/dia no topo da listagem', en: 'Year/month/day drill-down on top of the list' },
  { cmd: 'list_per_page = 50', cat: 'admin', pt: 'Quantos itens por página', en: 'Items per page' },
  { cmd: 'class FotoInline(admin.TabularInline):\n    model = Foto\n    extra = 1', cat: 'admin', pt: 'Edita relacionados inline dentro da página do parent', en: 'Edits related rows inline on the parent page' },
  { cmd: "@admin.action(description='Publicar selecionados')\ndef publicar(modeladmin, request, queryset):\n    queryset.update(published=True)", cat: 'admin', pt: 'Ação em massa na listagem (bulk action)', en: 'Bulk action on the list view' },
  { cmd: 'admin.site.site_header = \'Administração do DevTools\'', cat: 'admin', pt: 'Titulo do admin (site_header / site_title)', en: 'Admin title (site_header / site_title)' },
  { cmd: 'actions = [publicar]', cat: 'admin', pt: 'Habilita a ação custom definida acima', en: 'Enables the custom action defined above' },
  { cmd: "class PostAdmin(admin.ModelAdmin):\n    list_editable = ('published',)", cat: 'admin', pt: 'Edita campos direto na listagem (não pode estar em list_display_links)', en: 'Edit fields directly on the list (can\'t be list_display_links)' },

  // ─── Autenticação & usuários ───────────────────────────────────────────────
  { cmd: 'from django.contrib.auth import authenticate, login\ndef entrar(request):\n    user = authenticate(username=u, password=p)\n    login(request, user)', cat: 'auth', pt: 'Autentica (checa hash) e marca o usuário na sessão', en: 'Authenticates (checks the hash) and marks the user in the session' },
  { cmd: 'from django.contrib.auth import logout\nlogout(request)', cat: 'auth', pt: 'Encerra a sessão do usuário logado', en: 'Ends the logged-in user session' },
  { cmd: "from django.contrib.auth.mixins import LoginRequiredMixin\nclass MinhaView(LoginRequiredMixin, TemplateView): ...", cat: 'auth', pt: 'CBV que exige login (redireciona para login_url)', en: 'CBV requiring login (redirects to login_url)' },
  { cmd: "request.user.is_authenticated", cat: 'auth', pt: 'Checa se há usuário logado (em views e templates)', en: 'Checks for a logged-in user (views and templates)' },
  { cmd: "request.user.has_perm('blog.publish_post')", cat: 'auth', pt: 'Checa permissão específica do usuário', en: 'Checks a specific user permission' },
  { cmd: '@permission_required(\'blog.delete_post\')\ndef deletar(request, pk): ...', cat: 'auth', pt: 'Decorator para views restritas por permissão', en: 'Decorator for permission-restricted views' },
  { cmd: 'user.groups.all() / group.permissions.all()', cat: 'auth', pt: 'Groups de usuários e as permissões de cada grupo', en: 'User groups and per-group permissions' },
  { cmd: 'from django.contrib.auth.hashers import make_password, check_password\nmake_password(\'secreta\')', cat: 'auth', pt: 'Gera/verifica hash de senha (PBKDF2 por padrão)', en: 'Generates/verifies password hashes (PBKDF2 by default)' },
  { cmd: 'from django.contrib.auth.views import LoginView, LogoutView, PasswordResetView', cat: 'auth', pt: 'Views de auth prontas do Django', en: 'Ready-made Django auth views' },
  { cmd: "class User(AbstractUser):\n    pass\n# settings: AUTH_USER_MODEL = 'accounts.User'", cat: 'auth', pt: 'User custom: herda AbstractUser e cria a tabela própria', en: 'Custom user: inherit AbstractUser and get your own table' },
  { cmd: 'from django.contrib.auth.models import User\nUser.objects.create_user(\'ana\', password=\'x\')', cat: 'auth', pt: 'Nunca crie usuário com create() — create_user já aplica o hash', en: 'Never create users with create() — create_user hashes the password' },
  { cmd: 'request.user.get_full_name()', cat: 'auth', pt: 'Nome + sobrenome do usuário (primeiro_name + last_name)', en: 'First + last name (first_name + last_name)' },

  // ─── Django REST Framework ─────────────────────────────────────────────────
  { cmd: "INSTALLED_APPS += ['rest_framework']", cat: 'drf', pt: 'Primeiro passo: adicionar o DRF ao projeto', en: 'First step: add DRF to the project' },
  { cmd: 'class PostSerializer(serializers.ModelSerializer):\n    class Meta:\n        model = Post\n        fields = [\'id\', \'title\', \'body\', \'author\']', cat: 'drf', pt: 'Serializer a partir do model (serializa e valida)', en: 'Model-based serializer (serializes and validates)' },
  { cmd: "author_name = serializers.CharField(source='author.username', read_only=True)", cat: 'drf', pt: 'Campo de leitura extra puxado do relacionamento', en: 'Extra read-only field pulled from a relation' },
  { cmd: 'from rest_framework.decorators import api_view\n@api_view([\'GET\', \'POST\'])\ndef posts(request): ...', cat: 'drf', pt: 'View decorada com api_view (renderização/parsing do DRF)', en: 'View decorated with api_view (DRF rendering/parsing)' },
  { cmd: 'from rest_framework.generics import ListCreateAPIView\nclass PostList(ListCreateAPIView):\n    queryset = Post.objects.all()\n    serializer_class = PostSerializer', cat: 'drf', pt: 'GET (lista) + POST (criação) prontos', en: 'GET (list) + POST (create) out of the box' },
  { cmd: 'from rest_framework.generics import RetrieveUpdateDestroyAPIView', cat: 'drf', pt: 'GET/PUT/PATCH/DELETE de um objeto dado o pk da URL', en: 'GET/PUT/PATCH/DELETE for one object via URL pk' },
  { cmd: 'from rest_framework import viewsets\nclass PostViewSet(viewsets.ModelViewSet):\n    queryset = Post.objects.all()\n    serializer_class = PostSerializer', cat: 'drf', pt: 'ViewSet: todo o CRUD em uma classe', en: 'ViewSet: the whole CRUD in one class' },
  { cmd: 'from rest_framework.routers import DefaultRouter\nrouter = DefaultRouter()\nrouter.register(\'posts\', PostViewSet)\nurlpatterns += router.urls', cat: 'drf', pt: 'Roteador: gera /posts/ e /posts/{id}/ automaticamente', en: 'Router: generates /posts/ and /posts/{id}/ automatically' },
  { cmd: 'from rest_framework.response import Response\nfrom rest_framework import status\nreturn Response(data, status=status.HTTP_201_CREATED)', cat: 'drf', pt: 'Response explícito com status HTTP', en: 'Explicit Response with an HTTP status' },
  { cmd: 'from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny\npermission_classes = [IsAuthenticated]', cat: 'drf', pt: 'Controle de acesso por classe de permissão', en: 'Access control via permission classes' },
  { cmd: 'from rest_framework.authentication import TokenAuthentication\nauthentication_classes = [TokenAuthentication, SessionAuthentication]', cat: 'drf', pt: 'Auth por token (django-rest-framework authtoken) + sessão do admin', en: 'Token auth (DRF authtoken) + admin session auth' },
  { cmd: "@action(detail=False, methods=['post'])\ndef publish(self, request): ...", cat: 'drf', pt: 'Ação custom no ViewSet (/posts/publish/)', en: 'Custom ViewSet action (/posts/publish/)' },
  { cmd: "REST_FRAMEWORK = {'PAGE_SIZE': 20,\n  'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination'}", cat: 'drf', pt: 'Paginação global configurada no settings', en: 'Global pagination configured in settings' },
  { cmd: "REST_FRAMEWORK = {'DEFAULT_THROTTLE_RATES': {'anon': '100/hour', 'user': '1000/hour'}}", cat: 'drf', pt: 'Rate limiting do DRF (throttling)', en: 'DRF rate limiting (throttling)' },
  { cmd: 'REST_FRAMEWORK = {\n  \'DEFAULT_AUTHENTICATION_CLASSES\': (\n    \'rest_framework_simplejwt.authentication.JWTAuthentication\',\n  )\n}', cat: 'drf', pt: 'JWT com o pacote djangorestframework-simplejwt', en: 'JWT with the djangorestframework-simplejwt package' },

  // ─── Testes ────────────────────────────────────────────────────────────────
  { cmd: 'from django.test import TestCase\nfrom django.urls import reverse\nclass PostTestCase(TestCase):\n    def setUp(self):\n        self.post = Post.objects.create(title=\'X\')', cat: 'tests', pt: 'TestCase com setup padrão (banco de teste isolado)', en: 'TestCase with default setup (isolated test DB)' },
  { cmd: 'self.client.get(reverse(\'post-detail\', args=[self.post.pk]))', cat: 'tests', pt: 'Cliente de teste que navega como um navegador', en: 'Test client that navigates like a browser' },
  { cmd: 'self.client.post(\'/login/\', {\'username\': \'ana\', \'password\': \'x\'})', cat: 'tests', pt: 'POST de formulário no cliente de teste', en: 'POSTing a form through the test client' },
  { cmd: 'self.assertEqual(response.status_code, 200)', cat: 'tests', pt: 'Asserções padrão sobre a resposta', en: 'Standard assertions about the response' },
  { cmd: 'self.assertContains(response, \'Olá, mundo\')', cat: 'tests', pt: 'Verifica conteúdo renderizado na resposta (inclui template)', en: 'Checks rendered content in the response (incl. template)' },
  { cmd: 'self.assertRedirects(response, \'/login/\')', cat: 'tests', pt: 'A resposta foi um redirect para a URL X', en: 'The response redirected to URL X' },
  { cmd: 'self.assertTemplateUsed(response, \'blog/index.html\')', cat: 'tests', pt: 'O template renderizado foi o esperado', en: 'The rendered template was the expected one' },
  { cmd: 'from django.test import SimpleTestCase', cat: 'tests', pt: 'Teste SEM banco de dados (validações, helpers, templates)', en: 'Test WITHOUT the database (validators, helpers, templates)' },
  { cmd: '@classmethod\ndef setUpTestData(cls):\n    cls.post = Post.objects.create(...)', cat: 'tests', pt: 'Dados criados uma vez para toda a classe (mais rápido)', en: 'Data created once for the whole class (faster)' },
  { cmd: 'from rest_framework.test import APITestCase, APIClient\nself.client = APIClient()', cat: 'tests', pt: 'Cliente DRF para testar API com token/auth', en: 'DRF client for testing the API with token/auth' },
  { cmd: "self.client.force_login(user)", cat: 'tests', pt: 'Loga direto sem senha (evita testar o hash)', en: 'Logs in directly without a password (skips hashing)' },
  { cmd: 'python manage.py test --keepdb', cat: 'tests', pt: 'Reusa o banco de teste entre execuções (velocidade)', en: 'Reuses the test DB between runs (speed)' },

  // ─── Gotchas & boas práticas ───────────────────────────────────────────────
  { cmd: 'null=True vs blank=True', cat: 'gotchas', pt: 'null é do banco; blank é do form. String vazia usa blank, dados faltando usam null', en: 'null is the DB; blank is the form. Empty strings use blank, missing data use null' },
  { cmd: 'AUTH_USER_MODEL', cat: 'gotchas', pt: 'Defina seu User custom ANTES da primeira migrate — depois é cirurgia', en: 'Set your custom User BEFORE the first migrate — afterwards it\'s surgery' },
  { cmd: 'SECRET_KEY no git', cat: 'gotchas', pt: 'Nunca commite — use variável de ambiente', en: 'Never commit it — use an environment variable' },
  { cmd: 'Post.objects.get(pk=x)', cat: 'gotchas', pt: 'get() lança exceção se não houver 1 exato — use get_object_or_404 na web', en: 'get() raises if not exactly 1 — use get_object_or_404 on the web' },
  { cmd: 'QuerySets são lazy', cat: 'gotchas', pt: 'Filtrar não toca o banco; cuidado com DB hits acidentais em loops', en: 'Filtering doesn\'t hit the DB; watch accidental DB hits in loops' },
  { cmd: 'N+1: for post in posts: post.author', cat: 'gotchas', pt: 'Uma query por objeto — use select_related/prefetch_related', en: 'One query per object — use select_related/prefetch_related' },
  { cmd: 'DateTimeField(auto_now=True) vs auto_now_add=True', cat: 'gotchas', pt: 'auto_now atualiza a cada save; auto_now_add só na criação (use para created_at)', en: 'auto_now updates every save; auto_now_add only at creation (use for created_at)' },
  { cmd: '{{ html|safe }} / autoescape off', cat: 'gotchas', pt: 'Safe em dado de usuário = XSS. Escape sempre no resolvido.', en: 'Safe on user data = XSS. Always escape.' },
  { cmd: 'makemigrations ≠ migrate', cat: 'gotchas', pt: 'makemigrations cria o arquivo; migrate aplica. Esqueça um e o schema diverge.', en: 'makemigrations creates the file; migrate applies it. Forget one and the schema drifts.' },
  { cmd: "upload de arquivos em prod", cat: 'gotchas', pt: 'Nunca sirva media do dev server — configure nginx/Caddy + MEDIA_ROOT', en: 'Never serve media from the dev server — configure nginx/Caddy + MEDIA_ROOT' },
  { cmd: 'static em produção', cat: 'gotchas', pt: 'DEBUG=False não serve static: rode collectstatic e sirva pelo proxy', en: 'DEBUG=False does not serve static: run collectstatic and serve via the proxy' },
  { cmd: 'Migrations no código', cat: 'gotchas', pt: 'Migrations são código — commite junto com o model que a gerou', en: 'Migrations are code — commit them with the model that created them' },
  { cmd: 'from django.conf import settings', cat: 'gotchas', pt: 'Sempre importe settings assim (não importe o settings.py direto)', en: 'Always import settings this way (never import settings.py directly)' },
  { cmd: 'TIME_ZONE + USE_TZ', cat: 'gotchas', pt: 'USE_TZ=True guarda UTC e converte na render; sem isso, hora local crua', en: 'USE_TZ=True stores UTC and converts on render; otherwise raw local time' },
  { cmd: 'for p in Post.objects.all():\n    process(p)\n    count_by_author(p.author)', cat: 'gotchas', pt: 'Reavaliar um queryset e atravessar FK em loop causa N+1 — use select_related', en: 'Re-evaluating a queryset and walking FKs in a loop causes N+1 — use select_related' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Django',
    intro: (
      <>
        Referência pesquisável do framework web mais usado em Python, 100% no
        navegador. Cobre os comandos do <Text code>manage.py</Text> (startapp,
        makemigrations, migrate, shell, collectstatic), configuração de{' '}
        <Text code>settings.py</Text> e rotas com converters, models &
        campos (null/blank, choices, FKs, constraints), o ORM de{' '}
        <Text code>QuerySet</Text> (lookups, F/Q, annotate/aggregate,{' '}
        <Text code>select_related</Text> vs <Text code>prefetch_related</Text>),
        views por função e por classe (ListView, CreateView...), a linguagem de
        templates DTL ({'{% if %} / {% for %}'}, filtros, herança), forms &
        validação, o admin, autenticação, Django REST Framework (serializers,
        ViewSet, router, JWT), testes com o client de teste e os gotchas
        clássicos (N+1, user custom, queryset lazy, migrations). Tudo só
        texto — nada sai do navegador.
      </>
    ),
    tipTitle: 'Dicas rápidas',
    tipBody: (
      <>
        Sete o <Text code>AUTH_USER_MODEL</Text> custom antes da primeira
        migrate. Use <Text code>get_object_or_404</Text> nas views,{' '}
        <Text code>select_related/prefetch_related</Text> contra o problema
        N+1, <Text code>F()</Text> para incrementos atômicos e{' '}
        <Text code>Q</Text> para ORs. Lembre: <Text code>null</Text> é banco,{' '}
        <Text code>blank</Text> é form. <Text code>SECRET_KEY</Text> sempre em
        variável de ambiente e <Text code>DEBUG=False</Text> +{' '}
        <Text code>ALLOWED_HOSTS</Text> em produção.
      </>
    ),
    search: 'Buscar snippet ou descrição...',
    all: 'Todos',
    empty: 'Nenhum item encontrado. Tente outra busca ou categoria.',
    resultsOne: 'item encontrado',
    resultsMany: 'itens encontrados',
    copy: 'Copiar como Markdown',
    copied: 'Tabela Markdown copiada',
    copiedError: 'Não foi possível copiar',
    source: 'Fonte de dados (JSON)',
  },
  en: {
    title: 'Django Cheat Sheet',
    intro: (
      <>
        A searchable reference for the most popular Python web framework, 100%
        in the browser. Covers <Text code>manage.py</Text> commands (startapp,
        makemigrations, migrate, shell, collectstatic), <Text code>settings.py</Text>{' '}
        config and URL converters, models & fields (null/blank, choices, FKs,
        constraints), the <Text code>QuerySet</Text> ORM (lookups, F/Q,
        annotate/aggregate, <Text code>select_related</Text> vs{' '}
        <Text code>prefetch_related</Text>), function- and class-based views
        (ListView, CreateView...), the DTL template language
        ({'{% if %} / {% for %}'}, filters, inheritance), forms & validation, the
        admin, authentication, Django REST Framework (serializers, ViewSet,
        router, JWT), testing with the test client and the classic gotchas
        (N+1, custom user, lazy querysets, migrations). Text only — nothing
        leaves your browser.
      </>
    ),
    tipTitle: 'Quick tips',
    tipBody: (
      <>
        Set a custom <Text code>AUTH_USER_MODEL</Text> before the first
        migrate. Use <Text code>get_object_or_404</Text> in views,{' '}
        <Text code>select_related/prefetch_related</Text> against the N+1
        problem, <Text code>F()</Text> for atomic increments and <Text code>Q</Text>{' '}
        for ORs. Remember: <Text code>null</Text> is the DB,{' '}
        <Text code>blank</Text> is the form. <Text code>SECRET_KEY</Text> always
        from an env var and <Text code>DEBUG=False</Text> +{' '}
        <Text code>ALLOWED_HOSTS</Text> in production.
      </>
    ),
    search: 'Search a snippet or description...',
    all: 'All',
    empty: 'No matches found. Try another search or category.',
    resultsOne: 'item found',
    resultsMany: 'items found',
    copy: 'Copy as Markdown',
    copied: 'Markdown table copied',
    copiedError: 'Could not copy',
    source: 'Data source (JSON)',
  },
}

export default function DjangoCheatsheetPage() {
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
        (c[lang] || '').toLowerCase().includes(q) ||
        labelOf[c.cat][lang].toLowerCase().includes(q)
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
      <Title level={2}><CodeOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<CodeOutlined />} message={t.tipTitle} description={t.tipBody} />

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

      <Collapse items={[
        {
          key: 'source',
          label: t.source,
          children: (
            <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
              <code>{JSON.stringify(COMMANDS, null, 2)}</code>
            </pre>
          ),
        },
      ]} />
    </Space>
  )
}