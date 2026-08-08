import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, FontSizeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORY_LABEL = {
  anchors: { pt: 'Âncoras', en: 'Anchors' },
  classes: { pt: 'Classes', en: 'Character classes' },
  quantifiers: { pt: 'Quantificadores', en: 'Quantifiers' },
  groups: { pt: 'Grupos & captura', en: 'Groups & capture' },
  backrefs: { pt: 'Retroreferências', en: 'Backreferences' },
  lookaround: { pt: 'Lookaround', en: 'Lookaround' },
  escapes: { pt: 'Escapes', en: 'Escapes' },
  flags: { pt: 'Flags', en: 'Flags' },
  recipes: { pt: 'Receitas prontas', en: 'Ready-made patterns' },
}

const CATEGORY_COLOR = {
  anchors: 'blue',
  classes: 'cyan',
  quantifiers: 'geekblue',
  groups: 'purple',
  backrefs: 'magenta',
  lookaround: 'volcano',
  escapes: 'orange',
  flags: 'gold',
  recipes: 'green',
}

// Cada item: token = sintaxe exibida, source = regex JS real pra colar,
// flags = flags sugeridas. example é um par pt/en com o que o padrão casa.
// Atenção: `\d` em JS string vira `d` — por isso tudo aqui vai com `\\`.
const ITEMS = [
  { cat: 'anchors', token: '^', source: '^abc', name: { pt: 'Início', en: 'Start' }, desc: { pt: 'Âncora de início: casa a posição no começo da string (ou de cada linha com a flag m).', en: 'Start anchor: matches the beginning of the string (or of each line with the m flag).' }, example: { pt: '^abc casa "abc" em "abcdef"', en: '^abc matches "abc" in "abcdef"' } },
  { cat: 'anchors', token: '$', source: 'abc$', name: { pt: 'Fim', en: 'End' }, desc: { pt: 'Âncora de fim: casa a posição no final da string (ou de cada linha com a flag m).', en: 'End anchor: matches at the end of the string (or of each line with the m flag).' }, example: { pt: 'abc$ casa "abc" em "xyzabc"', en: 'abc$ matches "abc" in "xyzabc"' } },
  { cat: 'anchors', token: '\\b', source: '\\bword\\b', name: { pt: 'Fronteira de palavra', en: 'Word boundary' }, desc: { pt: 'Posição entre um \\w e um não-\\w — isoila a palavra inteira.', en: 'Position between a \\w and a non-\\w — isolates the full word.' }, example: { pt: '\\bcat\\b casa "cat" mas não "cattery"', en: '\\bcat\\b matches "cat" but not "cattery"' } },
  { cat: 'anchors', token: '\\B', source: '\\Bcat', name: { pt: 'Não-fronteira', en: 'Non-boundary' }, desc: { pt: 'Posição que NÃO é fronteira de palavra (dentro de uma palavra).', en: 'A position that is NOT a word boundary (inside a word).' }, example: { pt: '\\Bcat casa "cat" dentro de "cattery"', en: '\\Bcat matches "cat" inside "cattery"' } },

  { cat: 'classes', token: '[abc]', source: '[abc]', name: { pt: 'Classe: um dos', en: 'Set: one of' }, desc: { pt: 'Casa qualquer UM dos caracteres listados.', en: 'Matches any one of the listed characters.' }, example: { pt: 'c[aiu]r casa "car", "cir", "cur"', en: 'c[aiu]r matches "car", "cir", "cur"' } },
  { cat: 'classes', token: '[^abc]', source: '[^abc]', name: { pt: 'Classe negada', en: 'Negated set' }, desc: { pt: 'Casa qualquer caractere EXCETO os listados.', en: 'Matches any character EXCEPT the listed ones.' }, example: { pt: '[^0-9] casa qualquer não-dígito', en: '[^0-9] matches any non-digit' } },
  { cat: 'classes', token: '[a-z]', source: '[a-z]', name: { pt: 'Intervalo', en: 'Range' }, desc: { pt: 'Casa um caractere dentro do intervalo (ordem Unicode).', en: 'Matches one character within the range (Unicode order).' }, example: { pt: '[a-z] casa minúsculas de a a z', en: '[a-z] matches lowercase a through z' } },
  { cat: 'classes', token: '.', source: '.', name: { pt: 'Qualquer caractere', en: 'Any character' }, desc: { pt: 'Casa qualquer caractere, exceto quebra de linha (inclusive com a flag s).', en: 'Matches any character except line break (including them with the s flag).' }, example: { pt: 'a.c casa "abc", "a1c"', en: 'a.c matches "abc", "a1c"' } },
  { cat: 'classes', token: '\\d', source: '\\d', name: { pt: 'Dígito', en: 'Digit' }, desc: { pt: 'Shorthand de [0-9].', en: 'Shorthand for [0-9].' }, example: { pt: '\\d+ pega os dígitos de "42 px"', en: '\\d+ grabs the digits in "42 px"' } },
  { cat: 'classes', token: '\\D', source: '\\D', name: { pt: 'Não-dígito', en: 'Non-digit' }, desc: { pt: 'Negação de \\d — [^0-9].', en: 'Negation of \\d — [^0-9].' }, example: { pt: '\\D casa letras e espaços', en: '\\D matches letters and spaces' } },
  { cat: 'classes', token: '\\w', source: '\\w', name: { pt: 'Palavra', en: 'Word char' }, desc: { pt: 'Letra, dígito ou sublinhado — [A-Za-z0-9_].', en: 'Letter, digit or underscore — [A-Za-z0-9_].' }, example: { pt: '\\w+ casa "abc" em "abc-xyz"', en: '\\w+ matches "abc" in "abc-xyz"' } },
  { cat: 'classes', token: '\\W', source: '\\W', name: { pt: 'Não-palavra', en: 'Non-word char' }, desc: { pt: 'Negação de \\w.', en: 'Negation of \\w.' }, example: { pt: '\\W casa "\\n"/"-"/espaço', en: '\\W matches "\\n"/"-"/space' } },
  { cat: 'classes', token: '\\s', source: '\\s', name: { pt: 'Espaço em branco', en: 'Whitespace' }, desc: { pt: 'Espaço, tab, nova linha — [\\t\\n\\r\\f\\v ].', en: 'Space, tab, newline — [\\t\\n\\r\\f\\v ].' }, example: { pt: 'a\\\\sb casa "a b"', en: 'a\\\\sb matches "a b"' } },
  { cat: 'classes', token: '\\S', source: '\\S', name: { pt: 'Não-espaço', en: 'Non-whitespace' }, desc: { pt: 'Negação de \\s.', en: 'Negation of \\s.' }, example: { pt: '\\S+ pega "abc" em " abc "', en: '\\S+ grabs "abc" in " abc "' } },

  { cat: 'quantifiers', token: 'a*', source: 'a*', name: { pt: 'Zero ou mais', en: 'Zero or more' }, desc: { pt: 'Repete o anterior 0 ou mais vezes (greedy).', en: 'Repeats the previous token 0 or more times (greedy).' }, example: { pt: 'colou* casa "colu", "colour"', en: 'colou* matches "colu", "colour"' } },
  { cat: 'quantifiers', token: 'a+', source: 'a+', name: { pt: 'Um ou mais', en: 'One or more' }, desc: { pt: 'Repete o anterior 1 ou mais vezes (greedy).', en: 'Repeats the previous token 1 or more times (greedy).' }, example: { pt: '\\d+ casa o número inteiro', en: '\\d+ matches the whole number' } },
  { cat: 'quantifiers', token: 'a?', source: 'colou?r', name: { pt: 'Zero ou um (opcional)', en: 'Zero or one (optional)' }, desc: { pt: 'Torna o anterior opcional.', en: 'Makes the previous token optional.' }, example: { pt: 'colou?r casa "color" e "colour"', en: 'colou?r matches "color", "colour"' } },
  { cat: 'quantifiers', token: 'a{3}', source: '\\d{3}', name: { pt: 'Exatamente N', en: 'Exactly N' }, desc: { pt: 'Exatamente N repetições.', en: 'Exactly N repetitions.' }, example: { pt: '\\d{3} casa "123" (não "12")', en: '\\d{3} matches "123" (not "12")' } },
  { cat: 'quantifiers', token: 'a{2,}', source: '\\d{2,}', name: { pt: 'N ou mais', en: 'N or more' }, desc: { pt: 'No mínimo N repetições.', en: 'At least N repetitions.' }, example: { pt: '\\d{2,} pega "42" de "42 px"', en: '\\d{2,} grabs "42" from "42 px"' } },
  { cat: 'quantifiers', token: 'a{2,4}', source: '\\d{2,4}', name: { pt: 'Entre N e M', en: 'Between N and M' }, desc: { pt: 'Entre N e M repetições, greedy.', en: 'Between N and M repetitions, greedy.' }, example: { pt: '\\d{2,4} pega "1234" de "12345"', en: '\\d{2,4} grabs "1234" of "12345"' } },
  { cat: 'quantifiers', token: 'a*?', source: '\\w+?', name: { pt: 'Lazy (mínimo)', en: 'Lazy (minimal)' }, desc: { pt: 'Quantificador seguido de ? para casar o MÍNIMO possível — combina bem com delimitar.', en: 'Quantifier followed by ? to match as FEW as possible — pairs well with delimiters.' }, example: { pt: '<.+?> casa "<b>" de "<b>oi"', en: '<.+?> matches "<b>" in "<b>hi"' } },
  { cat: 'quantifiers', token: 'a{3,4}?', source: '\\w{3,4}?', name: { pt: 'Range lazy', en: 'Lazy range' }, desc: { pt: 'Forma lazy do quantificador de intervalo.', en: 'Lazy form of the range quantifier.' }, example: { pt: 'a{2,4}? casa o mínimo de "aaaaa"', en: 'a{2,4}? matches the least in "aaaaa"' } },

  { cat: 'groups', token: '(abc)', source: '(abc)', name: { pt: 'Grupo de captura', en: 'Capturing group' }, desc: { pt: 'Agrupa e captura o trecho — acessível via match[1], $1 no replace.', en: 'Groups and captures the segment — reachable via match[1] or $1 in replace.' }, example: { pt: '/(\\w+)@(\\w+)/ captura user e domain', en: '/(\\w+)@(\\w+)/ captures user and domain' } },
  { cat: 'groups', token: '(?:abc)', source: '(?:abc)', name: { pt: 'Grupo não-capturante', en: 'Non-capturing group' }, desc: { pt: 'Agrupa sem reservar número de grupo — eficiente e evita poluir os índices.', en: 'Groups without reserving a group number — efficient, keeps indices clean.' }, example: { pt: '(?:ab)+ casa ababab sem captura', en: '(?:ab)+ matches ababab without capturing' } },
  { cat: 'groups', token: '(?<nome>abc)', source: '(?<year>\\d{4})', name: { pt: 'Grupo nomeado', en: 'Named group' }, desc: { pt: 'Captura com nome — acessível como match.groups.nome.', en: 'Captures under a name — reachable as match.groups.name.' }, example: { pt: '(?<year>\\d{4}) relata groups.year', en: '(?<year>\\d{4}) reports groups.year' } },
  { cat: 'groups', token: '(a|b)', source: '(a|b)', name: { pt: 'Alternância', en: 'Alternation' }, desc: { pt: 'Qualquer uma das alternativas — nos dois lados do |.', en: 'One of the alternatives on either side of |.' }, example: { pt: '(cat|dog) casa "cat" ou "dog"', en: '(cat|dog) matches "cat" or "dog"' } },

  { cat: 'backrefs', token: '\\1', source: '(\\w+) \\1', name: { pt: 'Retroreferência', en: 'Backreference' }, desc: { pt: 'Refere o texto capturado pelo grupo N dentro do próprio padrão.', en: 'Refers to the text captured by group N inside the pattern.' }, example: { pt: '(\\w+) \\1 casa "ana ana"', en: '(\\w+) \\1 matches "ana ana"' } },
  { cat: 'backrefs', token: '\\k<nome>', source: '(?<w>\\w+) \\k<w>', name: { pt: 'Backref nomeada', en: 'Named backreference' }, desc: { pt: 'Retroreferência ao grupo nomeado.', en: 'Backreference to a named group.' }, example: { pt: 'casa a palavra duplicada "foo foo"', en: 'matches the duplicated word "foo foo"' } },

  { cat: 'lookaround', token: 'x(?=y)', source: '\\d+(?=px)', name: { pt: 'Lookahead positivo', en: 'Positive lookahead' }, desc: { pt: 'Casa x somente se y o seguinte; estado não é consumido.', en: 'Matches x only if followed by y — nothing is consumed.' }, example: { pt: '\\d+(?=px) casa "10" de "10px"', en: '\\d+(?=px) matches "10" in "10px"' } },
  { cat: 'lookaround', token: 'x(?!y)', source: '\\d+(?!px)', name: { pt: 'Lookahead negativo', en: 'Negative lookahead' }, desc: { pt: 'Casa x somente se NÃO for seguido por y.', en: 'Matches x only if NOT followed by y.' }, example: { pt: '\\d+(?!px) ignora "10px"', en: '\\d+(?!px) skips "10px"' } },
  { cat: 'lookaround', token: '(?<=y)x', source: '(?<=R\\$)\\d+', name: { pt: 'Lookbehind positivo', en: 'Positive lookbehind' }, desc: { pt: 'Casa x somente se precedido por y.', en: 'Matches x only if preceded by y.' }, example: { pt: '(?<=R\\$)\\d+ casa "100" em "R$100"', en: '(?<=R\\$)\\d+ matches "100" in "R$100"' } },
  { cat: 'lookaround', token: '(?<!y)x', source: '(?<!R\\$)\\d+', name: { pt: 'Lookbehind negativo', en: 'Negative lookbehind' }, desc: { pt: 'Casa x somente se NÃO precedido por y.', en: 'Matches x only if NOT preceded by y.' }, example: { pt: 'pega o número que não vem de "R$"', en: 'grabs numbers not coming from "R$"' } },

  { cat: 'escapes', token: '\\n', source: '\\n', name: { pt: 'Nova linha', en: 'Newline' }, desc: { pt: 'Quebra de linha (LF).', en: 'Line feed (LF).' }, example: { pt: 'casa o "\\n" que separa linhas', en: 'matches the "\\n" between lines' } },
  { cat: 'escapes', token: '\\t', source: '\\t', name: { pt: 'Tabulação', en: 'Tab' }, desc: { pt: 'Caractere de tabulação.', en: 'Tab character.' }, example: { pt: 'casa o "\\t" de um TSV', en: 'matches the "\\t" in a TSV' } },
  { cat: 'escapes', token: '\\r', source: '\\r\\n', name: { pt: 'Retorno de carro', en: 'Carriage return' }, desc: { pt: 'CR — acompanha \\n pra casar CRLF (Windows).', en: 'CR — pairs with \\n to match CRLF (Windows).' }, example: { pt: 'casou "\\r\\n" no fim de linha Windows', en: 'matched "\\r\\n" at the end of a Windows line' } },
  { cat: 'escapes', token: '\\.', source: '\\.', name: { pt: 'Ponto literal', en: 'Literal dot' }, desc: { pt: 'Escapa o meta "." pra casar o ponto literal.', en: 'Escapes the "." meta to match a literal dot.' }, example: { pt: 'q\\.r casa "q.r"', en: 'q\\.r matches "q.r"' } },
  { cat: 'escapes', token: '\\\\', source: '\\\\', name: { pt: 'Barra literal', en: 'Literal backslash' }, desc: { pt: 'Duas barras casam UMA barra literal.', en: 'Two backslashes match ONE literal backslash.' }, example: { pt: 'c:\\ \\\\Users casa "C:\\\\Users"', en: 'c:\\\\Users matches "C:\\\\Users"' } },
  { cat: 'escapes', token: '\\x41', source: '\\x41', name: { pt: 'Hexadecimal (ASCII)', en: 'Hex (ASCII)' }, desc: { pt: 'Caractere pelo código hex (\x41 = A).', en: 'Character by hex code (\\x41 = A).' }, example: { pt: '\\x41 é a letra "A"', en: '\\x41 is the letter "A"' } },
  { cat: 'escapes', token: '\\u{}', source: '\\u{1F600}', name: { pt: 'Unicode code point', en: 'Unicode code point' }, desc: { pt: 'Caractere Unicode por code point — precisa da flag u.', en: 'Unicode character by code point — requires the u flag.' }, example: { pt: '\\u{1F600} casa "😀"', en: '\\u{1F600} matches "😀"' } },

  { cat: 'flags', token: 'g', source: '', flags: 'g', name: { pt: 'Global', en: 'Global' }, desc: { pt: 'Encontra todas as ocorrências, não só a primeira.', en: 'Finds every occurrence, not just the first.' }, example: { pt: '/a/g acha todos os "a"', en: '/a/g finds every "a"' } },
  { cat: 'flags', token: 'i', source: '', flags: 'i', name: { pt: 'Ignorar caixa', en: 'Ignore case' }, desc: { pt: 'Casa maiúsculas e minúsculas.', en: 'Matches upper and lowercase.' }, example: { pt: '/abc/i casa "ABC"', en: '/abc/i matches "ABC"' } },
  { cat: 'flags', token: 'm', source: '', flags: 'm', name: { pt: 'Multiline', en: 'Multiline' }, desc: { pt: 'Faz ^ e $ valerem por linha.', en: 'Makes ^ and $ match per line.' }, example: { pt: '/^oi/m casa "oi" em cada linha', en: '/^oi/m matches "oi" per line' } },
  { cat: 'flags', token: 's', source: '', flags: 's', name: { pt: 'DotAll', en: 'DotAll' }, desc: { pt: 'Faz o . casar nova linha também.', en: 'Makes . match newlines too.' }, example: { pt: '/a.b/s casa "a\\nb"', en: '/a.b/s matches "a\\nb"' } },
  { cat: 'flags', token: 'u', source: '', flags: 'u', name: { pt: 'Unicode', en: 'Unicode' }, desc: { pt: 'Modo unicode: \\u{...}, \\p{...} e astral correto.', en: 'Unicode mode: \\u{...}, \\p{...} and proper astral matching.' }, example: { pt: 'necessário pra \\u{1F600}', en: 'required for \\u{1F600}' } },
  { cat: 'flags', token: 'y', source: '', flags: 'y', name: { pt: 'Sticky', en: 'Sticky' }, desc: { pt: 'Ancora o casamento em lastIndex, sem varrer o resto.', en: 'Anchors matching at lastIndex without scanning.' }, example: { pt: 'usado em lexers/parsers manuais', en: 'used in hand-written lexers/parsers' } },

  { cat: 'recipes', token: '^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$', source: '^[\\w.+-]+@[\\w-]+\\.[\\w.-]+$', flags: 'i', name: { pt: 'E-mail', en: 'Email' }, desc: { pt: 'Validação pragmática de e-mail (não resolve o RFC 5322 completo).', en: 'Pragmatic email validation (not the full RFC 5322).' }, example: { pt: 'ana@ex.com, joao.silva@a.b.br', en: 'ana@ex.com, joao.silva@ex.br' } },
  { cat: 'recipes', token: '^\\d{4}-\\d{2}-\\d{2}$', source: '^\\d{4}-\\d{2}-\\d{2}$', name: { pt: 'Data ISO', en: 'ISO date' }, desc: { pt: 'AAAA-MM-DD — uso em APIs e filenames.', en: 'YYYY-MM-DD — used in APIs and filenames.' }, example: { pt: '2026-08-06', en: '2026-08-06' } },
  { cat: 'recipes', token: '^([01]\\d|2[0-3]):[0-5]\\d(:[0-5]\\d)?$', source: '^(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?$', name: { pt: 'Hora HH:MM[:SS]', en: 'Time HH:MM[:SS]' }, desc: { pt: 'Horário entre 00:00 e 23:59:59.', en: 'Clock time between 00:00 and 23:59:59.' }, example: { pt: '09:30 ou 23:59:59', en: '09:30 or 23:59:59' } },
  { cat: 'recipes', token: '^[A-Za-z][A-Za-z0-9+.-]*://[^\\s/$.?#].[^\\s]*$', source: '^[A-Za-z][A-Za-z0-9+.-]*:\\/\\/[^\\s]+$', name: { pt: 'URL', en: 'URL' }, desc: { pt: 'Esquema + domínio — versão leve; URLs reais têm host decode etc.', en: 'Scheme + rest — a light version for most cases.' }, example: { pt: 'https://devtools.eventifylab.com/', en: 'https://devtools.example.com/x' } },
  { cat: 'recipes', token: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', source: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', flags: 'i', name: { pt: 'UUID (v4 com hífens)', en: 'UUID (v4 dashed)' }, desc: { pt: 'Formato canônico de um identificador v4.', en: 'Canonical shape of a v4 identifier.' }, example: { pt: '123e4567-e89b-12d3-a456-426614174000', en: '123e4567-e89b-12d3-a456-426614174000' } },
  { cat: 'recipes', token: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$', source: '^\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}$', name: { pt: 'CPF', en: 'CPF' }, desc: { pt: 'Quantidade e formato; não valida dígitos verificadores (algoritmo próprio).', en: 'Shape only; check digits need the official algorithm.' }, example: { pt: '111.222.333-44', en: '111.222.333-44' } },
  { cat: 'recipes', token: '^\\d{2}\\.\\d{3}\\.\\d{3}\\/\\d{4}-\\d{2}$', source: '^\\d{2}\\.\\d{3}\\.\\d{3}\\/\\d{4}-\\d{2}$', name: { pt: 'CNPJ', en: 'CNPJ' }, desc: { pt: 'Pratica o formato; verificar dígitos separadamente.', en: 'Shape only; verify the check digits separately.' }, example: { pt: '12.345.678/0001-99', en: '12.345.678/0001-99' } },
  { cat: 'recipes', token: '^#([0-9a-fA-F]{3}){1,2}$', source: '^#(?:[0-9a-fA-F]{3}){1,2}$', name: { pt: 'Cor hexadecimal', en: 'Hex color' }, desc: { pt: 'Aceita #RGB ou #RRGGBB (caixa insensível).', en: 'Accepts #RGB or #RRGGBB, case-insensitive.' }, example: { pt: '#f00 ou #336699', en: '#f00 or #336699' } },
  { cat: 'recipes', token: '^[a-z0-9]+(?:-[a-z0-9]+)*$', source: '^[a-z0-9]+(?:-[a-z0-9]+)*$', name: { pt: 'Slug', en: 'Slug' }, desc: { pt: 'Slug de URL: minúsculas, dígitos e hífens simples.', en: 'URL slug: lowercase, digits, single hyphens.' }, example: { pt: 'meu-artigo-2026', en: 'my-article-2026' } },
  { cat: 'recipes', token: '^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$', source: '^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$', name: { pt: 'IPv4 (leve)', en: 'IPv4 (light)' }, desc: { pt: 'Agrupa octeto mas não valida 0-255 — serve pra filtro simples.', en: 'Matches the shape without 0-255 validation — simple filter.' }, example: { pt: '192.168.0.1', en: '192.168.0.1' } },
  { cat: 'recipes', token: '^[^\\s<>]+@[^\\s<>]+$', source: '^[^\\s<>]+@[^\\s<>]+$', name: { pt: 'E-mail simples no texto', en: 'Simple inline email' }, desc: { pt: 'Encontra e-mail no meio de texto, ignorando espaço e "<,>".', en: 'Finds emails inside text, ignoring spaces and "<,>".' }, example: { pt: 'casa "a@b.co" dentro de um texto', en: 'matches "a@b.co" inside text' } },
]

const translations = {
  pt: {
    title: 'Regex Cheat Sheet',
    intro: (
      <>
        Referência da sintaxe de expressões regulares em JavaScript — o token,
        o que ele casa e um exemplo de uso — mais um punhado de receitas
        prontas de padrões do dia a dia (e-mail, data, hora, URI, UUID, CPF,
        CNPJ, cor hex, slug...), cada uma com o pattern em JS e um{' '}
        <Text code>RegExp</Text> equivalente destacando as flags usadas.
        Complementa o <Text code>/tools/regex-tester</Text>: lá você testa
        um padrão ao vivo contra um texto; aqui você consulta a sintaxe e
        copia receitas prontas como <Text code>new RegExp(...)</Text> ou{' '}
        <Text code>/.../flags</Text>. Tudo client-side, nada sai do navegador.
      </>
    ),
    search: 'Buscar por token, nome, descrição ou exemplo...',
    all: 'Todas',
    empty: 'Nada encontrado com esse filtro.',
    tipTitle: 'Flavors de regex não são idênticos',
    tipBody: (
      <>
        A tabela segue o <Text code>RegExp</Text> do JavaScript. Cuidado ao
        levar um padrão pra outro flavor: Python usa{' '}
        <Text code>(?P&lt;nome&gt;...)</Text> pra grupo nomeado, PCRE exige{' '}
        <Text code>(?(...))</Text> pra condicionais, e lookbehind de tamanho
        variável é permitido aqui mas não em todas as engines. Quando for usar
        a receita em outra linguagem, teste no ambiente de destino.
      </>
    ),
    copyPattern: 'Copiar',
    copiedPattern: 'Copiado!',
    copyList: 'Copiar lista filtrada (Markdown)',
    copiedList: 'Tabela Markdown copiada',
    copyError: 'Não foi possível copiar',
    results: (n) => `${n} ${n === 1 ? 'item' : 'itens'}`,
  },
  en: {
    title: 'Regex Cheat Sheet',
    intro: (
      <>
        A reference to JavaScript regular expression syntax — the token, what
        it matches and a usage example — plus ready-made everyday patterns
        (email, date, time, URI, CPF, CNPJ, hex color...), each with the JS
        pattern and an equivalent <Text code>RegExp</Text> showing the flags.
        Complements the <Text>/tools/regex-tester</Text>: there you test a
        pattern against text; here you look up syntax and copy recipes as{' '}
        <Text code>new RegExp(...)</Text> or <Text code>/.../flags</Text>.
        Everything runs client-side.
      </>
    ),
    search: 'Search by token, name, description or example...',
    all: 'All',
    empty: 'Nothing found with this filter.',
    tipTitle: 'Regex flavors are not identical',
    tipBody: (
      <>
        This reference follows JavaScript&apos;s <Text code>RegExp</Text>. Be
        careful reusing a pattern elsewhere: Python uses{' '}
        <Text code>(?P&lt;name&gt;...)</Text> for named groups, PCRE needs{' '}
        <Text code>(?(...))</Text> for conditionals, and variable-length
        lookbehind is allowed here but not everywhere. Always re-test in the
        target environment.
      </>
    ),
    copyPattern: 'Copy',
    copiedPattern: 'Copied!',
    copyList: 'Copy filtered list (Markdown)',
    copiedList: 'Markdown table copied',
    copyError: 'Could not copy',
    results: (n) => `${n} ${n === 1 ? 'item' : 'items'}`,
  },
}

export default function RegexCheatSheetPage() {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [messageApi, messageContextHolder] = message.useMessage()

  const normalized = useCallback((s) => String(s).trim().toLowerCase(), [])

  const filtered = useMemo(() => {
    const q = normalized(query)
    return ITEMS.filter((item) => {
      if (category !== 'all' && item.cat !== category) return false
      if (!q) return true
      const hay = [
        item.token,
        item.name.pt,
        item.name.en,
        item.desc.pt,
        item.desc.en,
        item.example.pt,
        item.example.en,
        item.usage,
      ]
        .filter(Boolean)
        .map((s) => s.toLowerCase())
        .join(' ')
      return hay.includes(q)
    })
  }, [query, category, normalized])

  async function copyItem(text, okMessage) {
    try {
      await navigator.clipboard.writeText(text)
      messageApi.success(okMessage)
    } catch {
      messageApi.error(t.copyError)
    }
  }

  function toRegExpLiteral(item) {
    const body = item.source || item.token
    const flags = (item.flags || '').split('').sort().join('')
    return flags ? `/${body.replace(/\//g, '\\/')}/${flags}` : `/${body}/`
  }

  function toNewRegExp(item) {
    const body = item.source || item.token
    const flags = (item.flags || '').split('').sort().join('')
    return flags ? `new RegExp(${JSON.stringify(body)}, '${flags}')` : `new RegExp(${JSON.stringify(body)})`
  }

  function copyMarkdown() {
    const head = `| Sintaxe | Nome | O que faz |\n|---|---|---|\n`
    const rows = filtered
      .map((item) => `| \`${item.token.replace(/\|/g, '\\|')}\` | ${item.name[lang].replace(/\|/g, '\\|')} | ${item.desc[lang].replace(/\|/g, '\\|')} |`)
      .join('\n')
    copyItem(head + rows, t.copiedList)
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {messageContextHolder}
      <Title level={2}><ReadOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert type="info" showIcon icon={<FontSizeOutlined />} message={t.tipTitle} description={t.tipBody} />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.search}
        />
        <Radio.Group value={category} onChange={(e) => setCategory(e.target.value)} optionType="button">
          <Radio.Button value="all">{t.all}</Radio.Button>
          {Object.keys(CATEGORY_LABEL).map((cat) => (
            <Radio.Button key={cat} value={cat}>{CATEGORY_LABEL[cat][lang]}</Radio.Button>
          ))}
        </Radio.Group>
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
          renderItem={(item) => (
            <List.Item
              key={item.token + item.name.pt}
              actions={[
                <Button key="copy" size="small" icon={<CopyOutlined />} onClick={() => copyItem(toRegExpLiteral(item) + '\n' + toNewRegExp(item), t.copiedPattern)}>
                  {t.copyPattern}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space wrap style={{ rowGap: 6 }}>
                    <Tag color={CATEGORY_COLOR[item.cat]}>{CATEGORY_LABEL[item.cat][lang]}</Tag>
                    <Text code style={{ fontSize: 13, background: '#f5f5f5' }}>{item.token}</Text>
                    {item.flags && <Tag>/{item.flags}</Tag>}
                    <Text strong>{item.name[lang]}</Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary">{item.desc[lang]}</Text>
                    <Text style={{ fontSize: 12 }}>
                      <Text type="secondary">{lang === 'pt' ? 'Casa' : 'Matches'}: </Text>
                      <Text style={{ fontFamily: 'monospace' }}>{item.example[lang]}</Text>
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  )
}