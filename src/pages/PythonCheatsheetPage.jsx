import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, ApartmentOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basics', 'strings', 'lists', 'dicts', 'control', 'functions', 'comprehensions', 'classes', 'files', 'async']

const CATEGORY_COLOR = {
  basics: 'blue',
  strings: 'cyan',
  lists: 'geekblue',
  dicts: 'purple',
  control: 'gold',
  functions: 'green',
  comprehensions: 'volcano',
  classes: 'magenta',
  files: 'orange',
  async: 'lime',
}

const labelOf = {
  basics: { pt: 'Variáveis & Tipos', en: 'Variables & Types' },
  strings: { pt: 'Strings & Texto', en: 'Strings & Text' },
  lists: { pt: 'Listas & Tuplas', en: 'Lists & Tuples' },
  dicts: { pt: 'Dicionários & Conjuntos', en: 'Dicts & Sets' },
  control: { pt: 'Controle de Fluxo', en: 'Control Flow' },
  functions: { pt: 'Funções', en: 'Functions' },
  comprehensions: { pt: 'Comprehensions & Geradores', en: 'Comprehensions & Generators' },
  classes: { pt: 'Classes & OOP', en: 'Classes & OOP' },
  files: { pt: 'Arquivos & Módulos', en: 'Files & Modules' },
  async: { pt: 'Async / await', en: 'Async / await' },
}

const ITEMS = [
  // ─── Variáveis & Tipos ─────────────────────────────────────────────────
  { code: 'x = 5\nnome = "Ada"\nativo = True', cat: 'basics',
    pt: 'Atribuição simples: Python é dinâmico — a variável ganha o tipo e o comportamento do valor no primeiro uso. Nada de declarar tipo antes.',
    en: 'Simple assignment: Python is dynamic — a variable takes on the type and behavior of the value on first use. Nothing is declared upfront.' },
  { code: 'idade: int\nnome: str = "Ada"', cat: 'basics',
    pt: 'Anotação de tipo: documenta a intenção para quem lê e para ferramentas (mypy/pyright). O interpretador NÃO valida nada disso em runtime.',
    en: 'Type annotation: documents intent for readers and tools (mypy/pyright). The interpreter does not enforce it at runtime.' },
  { code: 'a, b = b, a', cat: 'basics',
    pt: 'Unpacking (atribuição paralela): os dois lados se alinham um a um — troca duas variáveis em uma linha, sem temporária.',
    en: 'Unpacking aligns both sides one-to-one — swap two variables in one line, with no temporary.' },
  { code: 'valor = n if n >= 0 else -n', cat: 'basics',
    pt: 'Expressão condicional (ternário): devolve um dos dois valores em uma linha só, sem bloco.',
    en: 'Conditional expression (ternary): yields one of two values on a single line, no block needed.' },
  { code: 'nome = input("Digite seu nome: ")', cat: 'basics',
    pt: 'input() sempre devolve str — mesmo que o usuário digite 42. Converta com int(...)/float(...) antes de fazer qualquer conta.',
    en: 'input() always returns a str — even when the user types 42. Convert with int()/float() before doing any math.' },
  { code: 'if x is None:      # identidade\nif x == None:      # comparacao (evite)', cat: 'basics',
    pt: 'is checa identidade — o jeito certo de testar o sentinela None. == checa igualdade de valor e pode ser sobrescrito por objetos.',
    en: 'is tests identity — the right way to check the None sentinel. == tests value equality and can be overridden by custom objects.' },
  { code: 'n = int("42")\nf = float("3.14")\ns = str(1)', cat: 'basics',
    pt: 'Conversões explícitas entre os tipos básicos: int()/float()/str(). Valores inválidos estouram ValueError.',
    en: 'Explicit conversions between the base types: int()/float()/str(). Invalid input raises ValueError.' },

  // ─── Strings & Texto ────────────────────────────────────────────────────
  { code: 'f"Olá, {nome}! Você tem {30 + 5} anos."', cat: 'strings',
    pt: 'f-string: o formatador do dia a dia desde o Python 3.6 — interpola qualquer expressão entre {} direto no texto.',
    en: 'f-strings: the everyday formatter since Python 3.6 — interpolate any expression inside {} right in the text.' },
  { code: 'texto = "  Olá Mundo  "\ntexto.strip()\ntexto.lower()\ntexto.upper()', cat: 'strings',
    pt: 'Aparar as pontas (strip) e normalizar a caixa antes de comparar/validar — o combo que evita bugs com entrada de usuário.',
    en: 'Trim the edges with strip() and normalize case with lower()/upper() before comparing — the combo that avoids user-input bugs.' },
  { code: 'palavras = frase.split(", ")\njuncao = "-".join(palavras)', cat: 'strings',
    pt: 'split quebra a string em lista pelo separador; join junta a lista de volta com o separador. Cada um é o inverso do outro.',
    en: 'split breaks the string into a list on a separator; join brings a list back together with a separator. Each is the inverse of the other.' },
  { code: 'if url.startswith("https") and arquivo.endswith(".py"):', cat: 'strings',
    pt: 'startswith/endswith testam prefixo e sufixo sem regex — preferíveis a fatias manuais para esse tipo de checagem.',
    en: 'startswith/endswith test a prefix or suffix without a regex — prefer them over manual slicing for this kind of check.' },
  { code: 'if "chave" in texto:', cat: 'strings',
    pt: 'in testa substring direto (e também membro em lista, chave em dict, elemento em set). É o jeito idiomático, sem indexOf.',
    en: 'in tests substring membership directly (and membership in lists, dict keys and sets too). It is the idiomatic way, no indexOf.' },
  { code: 'num = "1234567890"\nparte = num[2:6]  # "3456"\nultimo = num[-1]   # "0"', cat: 'strings',
    pt: 'Slicing [inicio:fim] acessa um trecho, índice negativo conta do fim, e o fim é sempre exclusivo. Strings são imutáveis — a fatia sempre cria uma nova.',
    en: 'Slicing [start:end] grabs a range, negative indices count from the end, and the end is always exclusive. Strings are immutable, so a slice makes a new one.' },
  { code: 'texto.count("a")\npos = texto.find("a")  # -1 se não achar', cat: 'strings',
    pt: 'count conta ocorrências de substring; find devolve o índice ou -1 quando não existe (find não lança erro, diferente de index).',
    en: 'count counts substring occurrences; find returns the index or -1 when missing (find never raises, unlike index).' },
  { code: 'len("Olá")   # 3\nseparador = "-" * 40', cat: 'strings',
    pt: 'len() conta caracteres (e funciona em qualquer coleção); a multiplicação de string constrói repetições — um separador de 40 traços pronto.',
    en: 'len() counts characters (and works on any collection); and string multiplication builds repeats — a 40-dash separator in one go.' },

  // ─── Listas & Tuplas ────────────────────────────────────────────────────
  { code: 'lista = [1, 2, 3]\ntupla = (1, 2, 3)', cat: 'lists',
    pt: 'Lista é mutável (cresce, remove, altera); tupla é imutável, fixa e leve. Use tupla para dados que não devem mudar.',
    en: 'A list is mutable (grow, remove, change); a tuple is immutable, fixed and lightweight. Use tuples for data that must not change.' },
  { code: 'primeiro = lista[0]\nultimo = lista[-1]\nrestante = lista[1:]', cat: 'lists',
    pt: 'Primeiro item, último com índice negativo, e um slice do resto — corta para todo lado sem loops.',
    en: 'The first item, the last via a negative index, and everything-else with [1:] — slicing handles it without loops.' },
  { code: 'lista.append(4)      # um\nlista.extend([5, 6])   # vários', cat: 'lists',
    pt: 'append adiciona UM elemento; extend concatena uma sequência inteira. append de uma lista aninharia ela como um único item.',
    en: 'append adds a single element; extend merges a whole sequence. Calling append(inner_list) would nest it as one item.' },
  { code: 'ultimo = lista.pop()\nlista.remove(x)     # por valor\nlista = lista[:]', cat: 'lists',
    pt: 'pop remove e retorna o item (do fim), remove apaga a primeira ocorrência por valor, e uma fatia copia a lista.',
    en: 'pop removes and returns the last item, remove deletes the first match by value, and a slice copies the list.' },
  { code: 'if 5 in nums:', cat: 'lists',
    pt: 'in checa membro na lista (chave em dict, substring em str, elemento em set) — busca linear para lista, O(1) para set.',
    en: 'in tests membership in a list (keys in dicts, substrings in strings, elements in sets) — linear for a list, O(1) for a set.' },
  { code: 'ordenada = sorted(nums)    # lista nova nums\nnums.sort()               # ordena no lugar, retorna None', cat: 'lists',
    pt: 'sorted devolve uma nova lista ordenada; o método sort() ordena a original e retorna None — nunca faça x = x.sort(), você perde a lista.',
    en: 'sorted() returns a new ordered list; the sort() method sorts in place and returns None — never do x = x.sort(), you lose the list.' },
  { code: 'for i, valor in enumerate(frutas, start=1):\n    print(i, valor)', cat: 'lists',
    pt: 'enumerate devolve (índice, item) a cada volta, com start opcional — o atalho moderno de for i in range(len(x)).',
    en: 'enumerate yields (index, item) per iteration, with an optional start — the modern shortcut for for i in range(len(x)).' },
  { code: 'for nome, cidade in zip(nomes, cidades):\n    print(nome, cidade)', cat: 'lists',
    pt: 'zip emenda duas sequências em pares (funciona com dicts e strings também). Com tamanhos diferentes, para na menor.',
    en: 'zip pairs two sequences element by element (works for dicts and strings too). With different lengths it stops at the shortest.' },
  { code: 'for i in range(1, 11, 2):\n    print(i)   # 1 3 5 7 9', cat: 'lists',
    pt: 'range(inicio, fim, passo) gera números sem alocar a lista inteira. range(5) = 0..4; o fim é sempre exclusivo.',
    en: 'range(start, stop, step) yields numbers without materializing the list. range(5) is 0..4; stop is always exclusive.' },
  { code: 'maior = max(nums)\nmenor = min(nums)\ntotal = sum(nums)', cat: 'lists',
    pt: 'max/min/sum prontos para qualquer sequência numérica — one-liners que substituem loops de acumulação manual.',
    en: 'max/min/sum work on any numeric sequence — one-liners that replace hand-written accumulation loops.' },

  // ─── Dicionários & Conjuntos ────────────────────────────────────────────
  { code: 'usuario = {"nome": "Ada", "anos": 36}', cat: 'dicts',
    pt: 'Dicionário: mapeia chave para valor com hash e O(1) — a fonte de verdade para configs, query params e JSON parseado.',
    en: 'Dict: a key-value map with hashed keys and O(1) lookups — the go-to for configs, query params and parsed JSON.' },
  { code: 'nome = usuario["nome"]\npapel = usuario.get("papel", "visitante")', cat: 'dicts',
    pt: '[] levanta KeyError se a chave não existe; get() devolve o padrão (None por padrão). Leitura tolerante: get(). Chave obrigatória: [].',
    en: '[] raises KeyError when the key is missing; get() returns the fallback (None by default). Tolerant reads use get(); required keys use [].' },
  { code: 'if "nome" in usuario:', cat: 'dicts',
    pt: 'in checa CHAVE, não valor — a maneira correta de perguntar "essa chave existe?" sem try/except.',
    en: 'in checks KEYS, not values — the correct way to ask "does this key exist?" with no try/except.' },
  { code: 'for chave, valor in usuario.items():\n    print(chave, valor)', cat: 'dicts',
    pt: 'items() itera pares (chave, valor); keys() e values() entregam apenas um lado.',
    en: 'items() iterates (key, value) pairs; keys() and values() give just one side.' },
  { code: 'merge = {**a, **b}', cat: 'dicts',
    pt: 'Merge de dicionários com unpack: as chaves de b sobrescrevem as de a. Python 3.9+ ainda permite o operador | e o |=.',
    en: 'Merge dicts with unpacking: keys from b override the ones in a. Python 3.9+ also supports the | and |= operators.' },
  { code: 'd.setdefault("visitas", 0)\nd["visitas"] += 1', cat: 'dicts',
    pt: 'setdefault escreve o padrão só quando a chave ainda não existe — a forma idiomática de inicializar contadores sem if chave in d.',
    en: 'setdefault writes the default only when the key is missing — the idiomatic way to seed counters without checking membership first.' },
  { code: 'tags = {"py", "dev"}\ninterseccao = {"py", "go"} & tags\ndiferenca = {"py"} - tags', cat: 'dicts',
    pt: 'set remove duplicatas e tem operadores de conjunto: | união, & interseção, - diferença e ^ simétrico. in custa O(1).',
    en: 'A set dedupes and supports | union, & intersection, - difference and ^ symmetric difference. Membership costs O(1).' },
  { code: 'from collections import Counter\nfreq = Counter("banana")  # "a": 3, "n": 2, "b": 1', cat: 'dicts',
    pt: 'Counter é um dict de contagem feito para isso: + combina, most_common(k) devolve o ranking, sem loop de contagem manual.',
    en: 'Counter is a counting dict made for this: + combines, most_common(k) ranks the results, no hand-written tally loop.' },

  // ─── Controle de Fluxo ──────────────────────────────────────────────────
  { code: 'if tempo > 30:\n    gorjeta = 0.2\nelse:\n    gorjeta = 0.1', cat: 'control',
    pt: 'O bloco é definido pela INDENTAÇÃO (4 espaços pelo PEP 8) — não há chaves. Tabs e espaços precisam ser consistentes em cada arquivo.',
    en: 'Blocks are defined by INDENTATION (4 spaces per PEP 8) — no braces. Tabs and spaces must stay consistent within a file.' },
  { code: 'for fruta in frutas:\n    print(fruta)', cat: 'control',
    pt: 'for sempre itera sobre uma sequência — nunca sobre range(len(x)) quando dá para iterar os próprios valores.',
    en: 'for always iterates a sequence — never over range(len(x)) when you can iterate the values directly.' },
  { code: 'while tentativas < 3:\n    senha = input("Senha: ")\n    tentativas += 1', cat: 'control',
    pt: 'while roda enquanto a condição valer. Cuidado com loop infinito: atualize a condição dentro do corpo.',
    en: 'while runs as long as the condition holds. Watch for infinite loops: update the condition inside the body.' },
  { code: 'for n in nums:\n    if n == 0:\n        continue    # pula o resto do giro\n    if n < 0:\n        break        # sai do loop', cat: 'control',
    pt: 'continue volta ao topo do loop pulando o resto; break interrompe o loop por completo. Ambos valem só para o loop mais interno.',
    en: 'continue jumps to the next iteration; break exits the loop entirely. Both affect only the innermost loop.' },
  { code: 'try:\n    numero = int(texto)\nexcept ValueError as err:\n    print(f"inválido: {err}")\nelse:\n    print("parseou!")', cat: 'control',
    pt: 'try/except captura o erro com o tipo certo; else roda só se nada lançou, e finally sempre roda. Capture apenas o que sabe tratar.',
    en: 'try/except catches a specific error type; else runs only when nothing raised; finally always runs. Catch only what you can handle.' },
  { code: 'match status:\n    case 200:\n        print("ok")\n    case 404:\n        print("não encontrado")\n    case _:\n        print("outro")', cat: 'control',
    pt: 'match (Python 3.10+): switch de verdade com pattern matching em estruturas e valores. O _ é o caso coringa.',
    en: 'match (Python 3.10+) is a real switch with structural pattern matching. The _ branch is the wildcard.' },

  // ─── Funções ────────────────────────────────────────────────────────────
  { code: 'def saudacao(nome, pontuacao="!"):\n    return f"Olá, {nome}{pontuacao}"', cat: 'functions',
    pt: 'Parâmetros com valor default viram opcionais, e a chamada pode nomear argumentos (saudacao(nome="Ana")) — mais legível.',
    en: 'A parameter with a default becomes optional, and calls can name arguments (saudacao(nome="Ana")) for readability.' },
  { code: 'def total(*nums):\n    return sum(nums)\n\ntotal(1, 2, 3)  # 6', cat: 'functions',
    pt: '*args recebe qualquer número de argumentos posicionais como tupla — funções que naturalmente variam em quantidade.',
    en: '*args gathers all positional arguments into a tuple — for call sites that naturally vary in count.' },
  { code: 'def montar(**config):\n    print(config["host"])', cat: 'functions',
    pt: '**kwargs recebe os argumentos nomeados como dict — aceita opções extras sem listar cada parâmetro.',
    en: '**kwargs collects named arguments into a dict — take options forward without listing every parameter.' },
  { code: 'def configurar(a, *, modo="estrito"):', cat: 'functions',
    pt: 'O * separa posicionais de keyword-only: tudo depois dele só pode ser passado por nome — chamada posicional vira erro.',
    en: 'A bare * splits positionals from keyword-only: anything after it can only be passed by name — a positional call raises.' },
  { code: 'dobro = lambda x: x * 2\ndobro(21)  # 42', cat: 'functions',
    pt: 'lambda é a função de uma expressão só, prático como argumento one-off (key de sorted, map, filter).',
    en: 'A lambda is a one-expression function, handy as an inline callback (sorted key, map, filter).' },
  { code: 'sorted(usuarios, key=lambda u: u["idade"])\nfrases.sort(key=str.upper)', cat: 'functions',
    pt: 'O argumento key (não cmp) controla a ordenação: você passa uma função que extrai o valor de comparação de cada elemento.',
    en: 'The key argument (not cmp) drives sorting: pass a function that extracts the comparable value from each element.' },
  { code: 'from functools import lru_cache\n\n@lru_cache(maxsize=128)\ndef fib(n):\n    return n if n < 2 else fib(n - 1) + fib(n - 2)', cat: 'functions',
    pt: 'Decoradores embrulham e injetam comportamento. @lru_cache memoiza as chamadas — fib sai de O(2^n) para O(n) com um só decorator.',
    en: 'Decorators wrap and inject behavior. @lru_cache memoizes calls — fib drops from O(2^n) to O(n) with one decorator.' },

  // ─── Comprehensions & Geradores ─────────────────────────────────────────
  { code: 'quadrados = [x * x for x in range(10)]', cat: 'comprehensions',
    pt: 'List comprehension: nova lista construída em uma linha, com um for por trás. Preferida sobre map/filter para transformações simples.',
    en: 'List comprehension: a new list built in one line. Preferred over map for plain transformations.' },
  { code: 'pares = [n for n in nums if n % 2 == 0]', cat: 'comprehensions',
    pt: 'Um filtro if no fim — a versão declarativa do loop de 3 linhas com append condicional.',
    en: 'An if filter at the end — the declarative version of the three-line loop with a conditional append.' },
  { code: 'tags = [x if x else "sem-tag" for x in valores]', cat: 'comprehensions',
    pt: 'Um if/else no começo escolhe o valor a Mapear (transformação), diferente do if no fim que só filtra.',
    en: 'A ternary at the front picks which value is mapped (a transform), unlike the trailing if that only filters.' },
  { code: 'mai = {k.upper(): v for k, v in usuario.items()}', cat: 'comprehensions',
    pt: 'Dict comprehension: {chave: valor for ... } — transforma o dicionário inteiro sem listas intermediárias.',
    en: 'Dict comprehension: {key: value for ... } transforms the whole mapping without intermediate lists.' },
  { code: 'unicos = {c for c in "banana"}   # {"b", "a", "n"}', cat: 'comprehensions',
    pt: 'Set comprehension: deduplica no próprio nascimento e ainda aplica a transformação.',
    en: 'Set comprehension deduplicates while being built, and can still transform each value.' },
  { code: 'gen = (x * x for x in range(1000000))', cat: 'comprehensions',
    pt: 'Gerador: produz valores sob demanda SEM alocar a lista. Consumido uma vez — ideal para sequências enormes.',
    en: 'A generator produces values lazily with no list in memory. It is single-pass and great for huge sequences.' },
  { code: 'total = sum(n for n in nums if n >= 0)', cat: 'comprehensions',
    pt: 'Gerador passando direto para sum() sem [] — soma apenas os positivos sem construir intermediário algum.',
    en: 'Feed a generator straight into sum() with no [] — only the positives get summed, with zero intermediate structures.' },

  // ─── Classes & OOP ──────────────────────────────────────────────────────
  { code: 'class Retangulo:\n    def __init__(self, l, a):\n        self.largura = l\n        self.altura = a\n\n    def area(self):\n        return self.largura * self.altura', cat: 'classes',
    pt: 'Classe com __init__ (construtor) e métodos: self é sempre o primeiro parâmetro e guarda os atributos da instância.',
    en: 'A class with __init__ (constructor) and methods: self is always the first parameter and carries instance attributes.' },
  { code: 'from dataclasses import dataclass\n\n@dataclass\nclass Ponto:\n    x: int\n    y: int', cat: 'classes',
    pt: '@dataclass gera __init__, __repr__ e igualdade automaticamente a partir das anotações de tipo — a forma idiomática de classe de dados.',
    en: '@dataclass generates __init__, __repr__ and equality from the type annotations — the idiomatic data-class.' },
  { code: 'class PontoComCor(Ponto):\n    def __init__(self, x, y, cor):\n        super().__init__(x, y)\n        self.cor = cor', cat: 'classes',
    pt: 'Herança: a classe filha estende a base e chama super().__init__() para reutilizar a inicialização — não existe palavra-chave extends.',
    en: 'Inheritance: the subclass extends the base and calls super().__init__() to reuse setup — there is no extends keyword.' },
  { code: 'class Retangulo:\n    ...\n    @property\n    def area(self):\n        return self.largura * self.altura', cat: 'classes',
    pt: '@property transforma um método em atributo calculado — lê-se r.area, não r.area(). Mantém a API limpa ao virar computado.',
    en: '@property turns a method into a computed attribute — read r.area, not r.area(). Keeps the API clean for computed values.' },
  { code: '@classmethod\ndef from_dict(cls, d):\n    return cls(d["nome"])\n\n@staticmethod\ndef eh_zero(x):\n    return x == 0', cat: 'classes',
    pt: 'classmethod recebe a classe (cls:) para fábricas alternativas de instância; staticmethod não precisa do objeto nem da classe.',
    en: 'classmethod receives the class (cls:) for alternative constructors; staticmethod needs neither instance nor class.' },
  { code: 'if isinstance(obj, Retangulo):', cat: 'classes',
    pt: 'isinstance(x, T) respeita herança — uma subclasse também passa; type(x) == T não.',
    en: 'isinstance(x, T) respects inheritance — a subclass passes too; type(x) == T does not.' },
  { code: 'def __repr__(self):\n    return f"Pessoa({self.nome!r})"', cat: 'classes',
    pt: 'dunder __repr__ define como o objeto aparece no console/print de debug; __str__ é a versão legível para usuário.',
    en: '__repr__ controls the debug output; __str__ the user-facing one. Dunders like these customize the language protocol.' },

  // ─── Arquivos & Módulos ─────────────────────────────────────────────────
  { code: 'with open("dados.txt", encoding="utf-8") as arquivo:\n    conteudo = arquivo.read()', cat: 'files',
    pt: 'with gerencia o recurso: o arquivo fecha sozinho ao sair do bloco, mesmo em exceção. O jeito idiomático de ler, sem close manual.',
    en: 'with manages the file: it closes automatically even on exception — the idiomatic read, no manual close.' },
  { code: 'with open("saida.txt", "w", encoding="utf-8") as arquivo:\n    arquivo.write("Olá")', cat: 'files',
    pt: 'Modo "w" reescreve (destrói o conteúdo anterior); "a" acrescenta ao fim. encoding="utf-8" evita o mojibake de acentos entre plataformas.',
    en: '"w" overwrites (destroying previous content), "a" appends. Passing encoding="utf-8" avoids mojibake across platforms.' },
  { code: 'for linha in open("log.txt", encoding="utf-8"):\n    print(linha.strip())', cat: 'files',
    pt: 'O próprio open é iterável: percorre linha a linha sem carregar o arquivo inteiro — o jeito certo para arquivos grandes.',
    en: 'The open file is iterable — line by line without loading everything, just right for big logs.' },
  { code: 'import json\ndados = json.loads(texto)       # str -> dict\nsaida = json.dumps(dados, indent=2)  # dict -> str', cat: 'files',
    pt: 'json nativo: loads converte texto e dumps serializa, com indent=2 para o pretty print. A língua franca de toda API.',
    en: 'Built-in json: loads parses text, dumps serializes with indent=2 for pretty output. The lingua franca of every API.' },
  { code: 'import os\npasta = os.environ.get("HOME", "")', cat: 'files',
    pt: 'os.environ é um dict das variáveis de ambiente — o get() com padrão evita KeyError quando a variável não existe.',
    en: 'os.environ is a dict of environment variables — get() with a default avoids KeyError when a variable is unset.' },
  { code: 'from pathlib import Path\np = Path("relatorios/hoje.txt")\np.exists()\np.name     # "hoje.txt"\np.parent   # "relatorios"', cat: 'files',
    pt: 'Path é a API moderna de caminhos: separador / em qualquer SO e métodos completos (exists, mkdir, read_text...).',
    en: 'Path is the modern filesystem API: POSIX separators on every OS plus full methods (exists, mkdir, read_text...).' },
  { code: 'import math\nimport numpy as np\n\nmath.sqrt(16)   # 4.0', cat: 'files',
    pt: 'Import fornece o namespace e evita colisão de nomes; o alias as é padrão para as libs famosas (np, pd, plt).',
    en: 'Importing keeps a namespace so no name collisions, and the as alias is the convention for famous libs (np, pd, plt).' },
  { code: 'if __name__ == "__main__":\n    main()', cat: 'files',
    pt: 'Esse guard roda main() só quando o arquivo é executado como script — e não quando é importado como módulo.',
    en: 'This guard runs main() only when the file is executed as a script — not when imported as a module.' },
  { code: 'import sys\nprint(sys.argv)', cat: 'files',
    pt: 'sys.argv são os argumentos de linha de comando; argv[0] é o nome do script. Para CLI de verdade use argparse.',
    en: 'sys.argv holds the command-line arguments; argv[0] is the script name. For serious CLIs reach for argparse.' },

  // ─── Async / await ──────────────────────────────────────────────────────
  { code: 'import asyncio\n\nasync def baixar():\n    await asyncio.sleep(1)   # IO assíncrono\n    return "dados"', cat: 'async',
    pt: 'async def cria uma corrotina; await suspende numa operação assíncrona sem travar o loop. Modern Python roda via asyncio.run().',
    en: 'async def creates a coroutine; await suspends on an async operation without blocking. Modern Python runs it via asyncio.run().' },
  { code: 'import asyncio\n\nresultados = await asyncio.gather(f("a"), f("b"))', cat: 'async',
    pt: 'gather dispara as corrotinas em paralelo e espera todas completarem — o equivalente ao Promise.all do JS.',
    en: 'gather launches the coroutines concurrently and awaits all of them — the Python sibling of Promise.all in JS.' },
  { code: 'import asyncio\n\nasyncio.run(main())', cat: 'async',
    pt: 'asyncio.run é o ponto de entrada moderno: cria o loop, roda a corrotina até o fim e o fecha — sem loop manual.',
    en: 'asyncio.run() is the modern entry point: it creates the loop, runs the coroutine to completion and closes it.' },
  { code: 'async with aiohttp.ClientSession() as sessao:', cat: 'async',
    pt: 'async with usa o contexto assíncrono (abre/fecha recursos) e é a base para clientes HTTP eficientes.',
    en: 'async with opens an async context manager — the base for efficient async HTTP clients and streams.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de Python',
    intro: (
      <>
        Referência pesquisável do Python que você usa todo dia — tipos, listas,
        dicts, comprehensions, funções, classes, arquivos e async. Cada entrada
        traz o código pronto para colar e a descrição do que ele faz.
      </>
    ),
    search: 'Buscar por código, recurso ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'Pegadinhas que pegam todo mundo',
    tipBody: (
      <>
        A indentação define o bloco — Python não usa chaves; misturar tab e
        espaço quebra o arquivo com <Text code>IndentationError</Text>. Divisão:
        <Text code>/</Text> sempre devolve float (<Text code>5/2 = 2.5</Text>) e{' '}
        <Text code>//</Text> é piso (<Text code>-5//2 = -3</Text>).{' '}
        <Text code>sort()</Text> retorna <Text code>None</Text> (ordenando no
        lugar) — use <Text code>sorted()</Text> quando precisar de retorno.{' '}
        <Text code>d["chave"]</Text> levanta <Text code>KeyError</Text>;
        prefira <Text code>d.get()</Text>. Liste o sentinela <Text code>None</Text>{' '}
        com <Text code>is</Text>, never com <Text code>==</Text>. Booleans e o
        nulo são maiúsculos: <Text code>True</Text>/<Text code>False</Text>/
        <Text code>None</Text>. E cuidado com o
        parâmetro default mutável: <Text code>def f(x=[])</Text> reutiliza a
        MESMA lista em todas as chamadas — use <Text code>None</Text> e crie
        dentro.
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar código',
    copiedCode: 'Código copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'Python Cheat Sheet',
    intro: (
      <>
        A searchable reference for everyday Python — lists, dicts,
        comprehensions, functions, classes, files and async. Each entry has the
        code and a description of what it does.
      </>
    ),
    search: 'Search by code, feature or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'Gotchas that catch everyone',
    tipBody: (
      <>
        Indentation defines a block — Python has no braces, and mixing tabs and
        spaces breaks the file with an <Text code>IndentationError</Text>. Division:{' '}
        <Text code>/</Text> always returns a float (<Text code>5/2 = 2.5</Text>){' '}
        while <Text code>//</Text> floors (<Text code>-5//2 = -3</Text>).{' '}
        <Text code>sort()</Text> returns <Text code>None</Text> (sorting in
        place); use <Text code>sorted()</Text> when you need a return value.{' '}
        <Text code>d["key"]</Text> raises <Text code>KeyError</Text> — prefer{' '}
        <Text code>d.get()</Text>. Compare to <Text code>None</Text> with{' '}
        <Text code>is</Text>, never <Text code>==</Text>. Booleans and null are
        capitalized: <Text code>True</Text>/<Text code>False</Text>/
        <Text code>None</Text>. And watch the mutable default parameter:{' '}
        <Text code>def f(x=[])</Text> shares the SAME list across every call —
        use <Text code>None</Text> and create it inside.
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy code',
    copiedCode: 'Code copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function PythonCheatsheetPage() {
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
    const header = '# Python (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```python',
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
        icon={<ApartmentOutlined />}
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