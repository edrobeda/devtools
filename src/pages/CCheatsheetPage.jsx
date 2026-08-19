import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined, ContainerOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['compile', 'basics', 'ptr', 'str', 'struct', 'preproc', 'stdlib', 'io', 'concur', 'gotchas']

const CATEGORY_COLOR = {
  compile: 'blue',
  basics: 'cyan',
  ptr: 'geekblue',
  str: 'purple',
  struct: 'green',
  preproc: 'gold',
  stdlib: 'magenta',
  io: 'volcano',
  concur: 'orange',
  gotchas: 'red',
}

const labelOf = {
  compile: { pt: 'Compilação & build', en: 'Compilation & build' },
  basics: { pt: 'Básicos & tipos', en: 'Basics & types' },
  ptr: { pt: 'Ponteiros & memória', en: 'Pointers & memory' },
  str: { pt: 'Strings & char', en: 'Strings & char' },
  struct: { pt: 'Structs, unions & bitfields', en: 'Structs, unions & bitfields' },
  preproc: { pt: 'Pré-processador', en: 'Preprocessor' },
  stdlib: { pt: 'Biblioteca padrão', en: 'Standard library' },
  io: { pt: 'I/O de arquivos', en: 'File I/O' },
  concur: { pt: 'Concorrência & sistema', en: 'Concurrency & system' },
  gotchas: { pt: 'Gotchas', en: 'Gotchas' },
}

const ITEMS = [
  // ─── Compilação & build ──────────────────────────────────────────────
  { code: 'gcc main.c -o app', cat: 'compile',
    pt: 'Compila e linka `main.c` num executável `app`. Sem `-o`, sai um `a.out` no diretório.',
    en: 'Compiles and links `main.c` into an executable `app`. Without `-o`, you get an `a.out` in the directory.' },
  { code: 'gcc -Wall -Wextra -std=c11 -pedantic main.c -o app', cat: 'compile',
    pt: 'Warnings completos + padrão explícito. O combo que transforma o compilador num linter.',
    en: 'Full warnings + explicit standard. The combo that turns the compiler into a linter.' },
  { code: 'clang main.c -o app', cat: 'compile',
    pt: 'Clang, o compilador do LLVM: segue o C standard de forma rígida e tem diagnóstico colorido e preciso.',
    en: 'Clang, the LLVM compiler: strict about the C standard with colorful, precise diagnostics.' },
  { code: 'gcc -O2 -g main.c -o app', cat: 'compile',
    pt: '`-O2` otimiza (agora `-O0` desce bem mais rápido); `-g` grava símbolos de debug pro gdb.',
    en: '`-O2` optimizes (-O0 builds much faster); `-g` writes debug symbols for gdb.' },
  { code: 'gcc main.c util.c -o app', cat: 'compile',
    pt: 'Compila e linka vários arquivos `.c` de uma vez. Pra projetos pequenos resolve; grandes usam make.',
    en: 'Compiles and links several `.c` files at once. Fine for small projects; larger ones use make.' },
  { code: 'gcc -c main.c', cat: 'compile',
    pt: 'Compila só até o objeto `main.o`, sem linkar. A base de builds incrementais: recompila só o que mudou.',
    en: 'Compiles only to the `main.o` object, no linking. The foundation of incremental builds: recompile only what changed.' },
  { code: 'gcc main.o util.o -o app', cat: 'compile',
    pt: 'Linka objetos já compilados num executável final.',
    en: 'Links already-compiled objects into the final executable.' },
  { code: 'gcc -I ./include -L ./lib -lmylib main.c -o app', cat: 'compile',
    pt: '`-I` adiciona pastas de headers, `-L` pastas de bibliotecas e `-l` linka (`-lmylib` = libmylib.so).',
    en: '`-I` adds header dirs, `-L` library dirs, and `-l` links (`-lmylib` = libmylib.so).' },
  { code: 'gcc -DDEBUG -dM -E main.c | grep DEBUG', cat: 'compile',
    pt: '`-D` define macro na linha de comando; `-dM -E` lista as macros visíveis no ponto de pré-processamento.',
    en: '`-D` defines a macro on the command line; `-dM -E` lists the macros visible at the preprocessing point.' },
  { code: 'make\nmake clean\nmake CFLAGS="-O2"', cat: 'compile',
    pt: 'O make lê o Makefile e só recompila o que mudou. `-j` paraleliza: `make -j8`.',
    en: 'make reads the Makefile and recompiles only what changed. `-j` parallelizes: `make -j8`.' },
  { code: '#include <stdio.h>   /* busca no include path do sistema */\n#include "meu.h"       /* busca no diretório atual primeiro */', cat: 'compile',
    pt: '`<...>` procura nos diretórios de sistema/`-I`; `"..."` procura na pasta do arquivo primeiro, depois o sistema.',
    en: '`<...>` searches system/`-I` dirs; `"..."` looks in the source file dir first, then the system.' },

  // ─── Básicos & tipos ──────────────────────────────────────────────────
  { code: 'int main(void) { return 0; }', cat: 'basics',
    pt: '`main` devolve o status de saída pro SO (0 = sucesso). `(void)` = sem argumentos.',
    en: '`main` returns the exit status to the OS (0 = success). `(void)` = no arguments.' },
  { code: 'printf("x=%d, s=%s\\n", x, s);', cat: 'basics',
    pt: 'Impressão formatada. Specifiers: `%d` int, `%u` unsigned, `%ld`, `%f`, `%s`, `%c`, `%p` ponteiro, `%zu` size_t, `%02x` hex.',
    en: 'Formatted printing. Specifiers: `%d` int, `%u` unsigned, `%ld`, `%f`, `%s`, `%c`, `%p` pointer, `%zu` size_t, `%02x` hex.' },
  { code: 'scanf("%d", &n);', cat: 'basics',
    pt: 'Leitura formatada: `%d` espera um `int*`, por isso o `&`. Cheque o retorno (1 = valor lido) antes de usar `n`.',
    en: 'Formatted input: `%d` expects an `int*`, hence the `&`. Check the return value (1 = value read) before using `n`.' },
  { code: '#include <stdint.h>\nint32_t x;\nuint64_t y;', cat: 'basics',
    pt: 'Inteiros de tamanho exato. `int` puro é no mínimo 16 bits — só use tamanho exato quando precisar.',
    en: 'Fixed-width integers. Plain `int` is at least 16 bits — prefer exact sizes only when you need them.' },
  { code: 'const int MAX = 100;', cat: 'basics',
    pt: '`const` é tempo de compilação: o compilador rejeita qualquer escrita. Não existe "const runtime".',
    en: '`const` is enforced at compile time: the compiler rejects any write. There is no "const at runtime".' },
  { code: 'size_t n = sizeof(x);', cat: 'basics',
    pt: '`size_t` (unsigned) é o tipo de tamanhos e índices, incluindo o retorno de `sizeof`.',
    en: '`size_t` (unsigned) is the type for sizes and indices, including the `sizeof` return.' },
  { code: 'enum Estado { NOVO, ATIVO, BLOQUEADO };', cat: 'basics',
    pt: 'Enumeração: constantes `int` sequenciais (0, 1, 2...). Dê um tipo editorial com `typedef enum ...`.',
    en: 'Enumeration: sequential `int` constants (0, 1, 2...). Prefer `typedef enum ...` for a named type.' },
  { code: 'uint8_t byte = 0xFF;', cat: 'basics',
    pt: 'Um byte não assinado explícito. `char` puro tem signedness definida por implementação — não confie pra bytes.',
    en: 'An explicit unsigned byte. Plain `char` has implementation-defined signedness — never rely on it for bytes.' },
  { code: 'double d = 3.1415;\nfloat f = 3.1415f;', cat: 'basics',
    pt: '`float` ~7 dígitos, `double` ~15. O sufixo `f` marca literal de float (double é o default).',
    en: '`float` ~7 digits, `double` ~15. The `f` suffix marks a float literal (double is the default).' },
  { code: 'unsigned int mask;\nlong long big;', cat: 'basics',
    pt: '`unsigned` dobra o teto (nada de negativo); `long long` é o inteiro de 64 bits garantido.',
    en: '`unsigned` doubles the ceiling (no negatives); `long long` is the guaranteed 64-bit integer.' },

  // ─── Ponteiros & memória ───────────────────────────────────────────────
  { code: 'int x = 10;\nint *p = &x;', cat: 'ptr',
    pt: '`&x` é o endereço de `x`; `*p` lê ou escreve o alvo. Sem o `*`, o ponteiro não se move.',
    en: '`&x` is the address of `x`; `*p` reads or writes the target. Without `*`, the pointer does not move.' },
  { code: 'int a[5];\nint *p = a;   /* a decai pra &a[0] */\na[2] == *(a + 2);', cat: 'ptr',
    pt: 'Arrays decaem pra ponteiro pro primeiro elemento. Indexar é aritmética de ponteiro disfarçada.',
    en: 'Arrays decay to a pointer to their first element. Indexing is disguised pointer arithmetic.' },
  { code: 'printf("%p\\n", (void*)p);', cat: 'ptr',
    pt: 'Pra imprimir ponteiro, o formato é `%p` com cast pra `void*` (o padrão exige).',
    en: 'To print a pointer, use `%p` with a cast to `void*` (the standard requires it).' },
  { code: '*p = 20;   /* escreve no alvo */', cat: 'ptr',
    pt: 'Dereference em escrita: muda o valor que `p` aponta, não o ponteiro.',
    en: 'Dereference on write: changes the value `p` points to, not the pointer itself.' },
  { code: 'p++;       /* anda sizeof(*p) bytes */', cat: 'ptr',
    pt: 'Aritmética de ponteiro anda de `sizeof(*p)` em `sizeof(*p)` — um elemento por incremento.',
    en: 'Pointer arithmetic steps by `sizeof(*p)` each time — one element per increment.' },
  { code: 'char *lit = "hello";   /* read-only */\nchar buf[] = "hello";  /* cópia mutável */', cat: 'ptr',
    pt: 'String literal vira ponteiro pra memória read-only. Array `[]` copia os bytes pro stack — escrever nele é seguro.',
    en: 'A string literal decays to read-only memory. An array `[]` copies the bytes to the stack — writing to it is safe.' },
  { code: 'void *ptr;\nint *ip = (int*)ptr;', cat: 'ptr',
    pt: '`void*` é o ponteiro genérico. Em C não precisa do cast pra atribuir, mas explicitá-lo documenta a intenção.',
    en: '`void*` is the generic pointer. In C the cast is optional on assignment, but writing it documents intent.' },
  { code: 'int soma(int a, int b);\nint (*f)(int, int) = soma;\nf(2, 3);', cat: 'ptr',
    pt: 'Ponteiro pra função: trata uma função como dado — o mecanismo de callbacks e dispatch table.',
    en: 'Function pointer: treats a function as data — the mechanism behind callbacks and dispatch tables.' },
  { code: 'int **mat;\nchar **argv;', cat: 'ptr',
    pt: 'Ponteiro pra ponteiro: array de ponteiros, matriz dinâmica, `argv` do main. Um nível por indireção.',
    en: 'Pointer to pointer: array of pointers, dynamic matrix, `argv` in main. One level per indirection.' },
  { code: 'int *p = malloc(sizeof *p * 10);\n...\nfree(p);', cat: 'ptr',
    pt: 'Todo `malloc` tem um `free`. `sizeof *p` evita errar o tamanho; liberar duas vezes ou não liberar = bug.',
    en: 'Every `malloc` has a `free`. `sizeof *p` avoids wrong sizes; double-free or no-free = bug.' },
  { code: 'if (p == NULL) { /* trata o erro */ }', cat: 'ptr',
    pt: 'Cheque `NULL` antes de dereferenciar. Em C, `NULL` é 0 (lazy) — o ponteiro de erro universal.',
    en: 'Check `NULL` before dereferencing. In C, `NULL` is 0 (truthy-false) — the universal error pointer.' },

  // ─── Strings & char ───────────────────────────────────────────────────
  { code: 'char s[32] = "oi";   /* 32 bytes, ocupa copia até \\0 */', cat: 'str',
    pt: 'String em C é array de char terminado em `\\0`. Escrever sem espaço pro `\\0` estoura o buffer.',
    en: 'A C string is a char array terminated by `\\0`. Writing without room for the `\\0` overflows the buffer.' },
  { code: '#include <string.h>', cat: 'str',
    pt: 'As funções de string moram em `<string.h>`: strlen, strcpy, strcmp, strcat, strchr, strstr, memcpy...',
    en: 'The string functions live in `<string.h>`: strlen, strcpy, strcmp, strcat, strchr, strstr, memcpy...' },
  { code: 'size_t n = strlen(s);   /* sem contar o \\0 */', cat: 'str',
    pt: 'O comprimento é contado até o `\\0`, sem incluir — e custa O(n), nada de usar em loop quente.',
    en: 'Length is counted up to (but excluding) the `\\0` — and costs O(n), so never call it in a hot loop.' },
  { code: 'snprintf(buf, sizeof buf, "%s-%d", s, n);', cat: 'str',
    pt: 'A cópia formatada SEGURA com limite de bytes — a alternativa a strcpy/strcat/strncpy que vive usando mal.',
    en: 'The SAFE formatted copy with a byte limit — the replacement for the often-misused strcpy/strcat/strncpy.' },
  { code: 'if (strcmp(a, b) == 0) { /* iguais */ }', cat: 'str',
    pt: 'Comparar strings com `==` compara ENDEREÇOS, não o conteúdo. `strcmp` devolve 0 quando iguais.',
    en: 'Comparing strings with `==` compares ADDRESSES, not content. `strcmp` returns 0 when equal.' },
  { code: "char *p = strchr(s, 'x');\nchar *q = strstr(s, \"sub\");", cat: 'str',
    pt: '`strchr` acha um char, `strstr` uma substring. Ambos devolvem ponteiro pra primeira ocorrência ou `NULL`.',
    en: '`strchr` finds a char, `strstr` a substring. Both return a pointer to the first occurrence or `NULL`.' },
  { code: 'char *tok = strtok(s, ",");\nwhile (tok) { /* usa */ tok = strtok(NULL, ","); }', cat: 'str',
    pt: '`strtok` quebra em tokens MAS modifica a string original e guarda estado global. Em threads, use `strtok_r`.',
    en: '`strtok` splits into tokens BUT mutates the original string and keeps global state. In threads, use `strtok_r`.' },
  { code: 'char *dup = strdup(s);   /* heap, precisa de free */', cat: 'str',
    pt: '`strdup` aloca na heap uma cópia da string (posix/C23). A cópia tem ciclo de vida próprio — `free` quando acabar.',
    en: '`strdup` allocates a heap copy of the string (posix/C23). The copy has its own lifetime — `free` it when done.' },
  { code: 'sscanf("42 abc", "%d %3s", &n, buf);', cat: 'str',
    pt: '`sscanf` parseia string com limites — `%3s` capa o tamanho lido e evita estouro do buffer.',
    en: '`sscanf` parses a string with limits — `%3s` caps the read length and prevents buffer overflow.' },

  // ─── Structs, unions & bitfields ──────────────────────────────────────
  { code: 'struct Ponto { int x; int y; };', cat: 'struct',
    pt: 'Agregado com campos: um tipo composto de tamanho/alinhamento próprios.',
    en: 'An aggregate with fields: a composite type with its own size/alignment.' },
  { code: 'struct Ponto p = {10, 20};\nstruct Ponto q = {.x = 1, .y = 2};', cat: 'struct',
    pt: 'Inicialização posicional ou nomeada (C99, `.{campo} = valor`) — nomeada sobrevive a mudar a ordem dos campos.',
    en: 'Positional or designated initialization (C99, `.{field} = value`) — designated survives field reordering.' },
  { code: 'typedef struct Ponto Ponto;', cat: 'struct',
    pt: '`typedef` cria um alias — escrever `Ponto p;` em vez de `struct Ponto p;`. Convenção comum em C.',
    en: '`typedef` creates an alias — write `Ponto p;` instead of `struct Ponto p;`. A common C convention.' },
  { code: 'Ponto *pp = &p;\npp->x == (*pp).x;', cat: 'struct',
    pt: '`->` é açúcar pra `(*ponteiro).campo`. Sem parênteses, `*pp.x` não compila (`.` tem preferência).',
    en: '`->` is sugar for `(*pointer).field`. Without parens, `*pp.x` does not compile (`.` binds tighter).' },
  { code: 'struct Ponto pts[100];   /* array de structs */', cat: 'struct',
    pt: 'Arrays de struct: alocação contígua e acesso por índice. Passar por funções vira ponteiro (decay).',
    en: 'Arrays of structs: contiguous storage, indexing access. Passing to functions decays to a pointer.' },
  { code: 'union { int i; float f; } u;', cat: 'struct',
    pt: '`union` sobrepõe os campos nos MESMOS bytes — cada um lê a memória à sua maneira. Tamanho = maior membro.',
    en: '`union` overlaps its fields in the SAME bytes — each reads the memory its own way. Size = largest member.' },
  { code: 'struct S { uint8_t a; uint8_t b; } __attribute__((packed));', cat: 'struct',
    pt: '`packed` remove o padding — pra ler formatos binários/rede. Custo: acesso desalinhado é mais lento e pode ser UB.',
    en: '`packed` removes padding — for parsing binary/network formats. Cost: misaligned access is slower, sometimes UB.' },
  { code: 'struct Flags { unsigned int a : 1; unsigned int b : 3; };', cat: 'struct',
    pt: 'Bitfields empacotam flags em poucos bits — bom pra registradores e protocolos compactos.',
    en: 'Bitfields pack flags into few bits — handy for registers and compact protocols.' },
  { code: 'printf("%zu\\n", sizeof(struct Ponto));', cat: 'struct',
    pt: '`sizeof` de struct inclui PADDING pra alinhamento — pode ser maior que a soma dos campos.',
    en: '`sizeof` a struct includes PADDING for alignment — it may exceed the sum of its members.' },

  // ─── Pré-processador ──────────────────────────────────────────────────
  { code: '#define MAX_ITEMS 100', cat: 'preproc',
    pt: 'Macro de objeto: substituição textual por `MAX_ITEMS`. Em C moderno, `const`/`enum` cobrem quase tudo',
    en: 'Object-like macro: textual substitution for `MAX_ITEMS`. In modern C, `const`/`enum` cover most needs.' },
  { code: '#ifdef DEBUG\n  printf("debug\\n");\n#endif', cat: 'preproc',
    pt: 'Compilação condicional: o bloco só existe se `DEBUG` estiver definida (`-DDEBUG` compila).',
    en: 'Conditional compilation: the block exists only if `DEBUG` is defined (`-DDEBUG` enables it).' },
  { code: '#if defined(__linux__)\n  #include <features.h>\n#elif defined(_WIN32)\n  /* ... */\n#endif', cat: 'preproc',
    pt: '`defined()` compõe condições multiplataforma: inclui headers e declarações por SO.',
    en: '`defined()` composes cross-platform conditions: includes headers and declarations per OS.' },
  { code: '#pragma once', cat: 'preproc',
    pt: 'Inclui o header uma única vez — o include guard simplificado (equivalente a `#ifndef _H_`/`#define`/`#endif`).',
    en: 'Includes the header once — the simplified include guard (equivalent to `#ifndef _H_`/`#define`/`#endif`).' },
  { code: '#define STR(x) #x\nSTR(hello)   /* vira "hello" */', cat: 'preproc',
    pt: '`#` stringifica o argumento da macro: transforma o token em string literal.',
    en: '`#` stringifies the macro argument: turns the token into a string literal.' },
  { code: '#define CAT(a, b) a##b\nCAT(port, 3)  /* vira port3 */', cat: 'preproc',
    pt: '`##` cola tokens num identificador só — ótimo pra gerar nomes de campos/variáveis por macro.',
    en: '`##` glues tokens into a single identifier — great for generating field/variable names via macro.' },
  { code: '#define LOG(fmt, ...) printf("[%s:%d] " fmt, __FILE__, __LINE__, __VA_ARGS__)', cat: 'preproc',
    pt: '`__FILE__` e `__LINE__` são macros mágicas com arquivo/linha do ponto de uso — a base de qualquer log.',
    en: '`__FILE__` and `__LINE__` are magic macros holding the file/line at the point of use — the base of any logging.' },
  { code: '#define MIN(a, b) ((a) < (b) ? (a) : (b))', cat: 'preproc',
    pt: 'Macros substituem texto SEM contexto: parênteses em volta de tudo evitam surpresas de precedência e efeitos colaterais.',
    en: 'Macros substitute text WITHOUT context: wrapping everything in parens avoids precedence surprises and side effects.' },
  { code: 'static inline int min_int(int a, int b) { return a < b ? a : b; }', cat: 'preproc',
    pt: 'Funções `inline` são a alternativa tipo-segura a macros de função: sem efeitos colaterais e com tipos checados.',
    en: '`inline` functions are the type-safe alternative to function-like macros: no side effects and checked types.' },

  // ─── Biblioteca padrão ────────────────────────────────────────────────
  { code: 'int *p = malloc(sizeof *p * 10);\nint *z = calloc(10, sizeof *z);', cat: 'stdlib',
    pt: '`malloc` aloca sem zerar, `calloc` devolve zeroed (e multiplica por você). Ambos devolvem `void*` ou `NULL`.',
    en: '`malloc` allocates uninitialized, `calloc` returns zeroed memory (and multiplies for you). Both return `void*` or `NULL`.' },
  { code: 'p = realloc(p, sizeof *p * 20);', cat: 'stdlib',
    pt: '`realloc` redimensiona e PODE mover o bloco — guarde o retorno no mesmo ponteiro e cheque `NULL`.',
    en: '`realloc` resizes and MAY move the block — store the return into the same pointer and check `NULL`.' },
  { code: 'int cmp(const void *a, const void *b) {\n  int x = *(const int*)a, y = *(const int*)b;\n  return (x > y) - (x < y);\n}\nqsort(base, n, sizeof *base, cmp);', cat: 'stdlib',
    pt: '`qsort` ordena com um comparador. Dica: `(x>y)-(x<y)` evita overflow e devolve -1/0/1 corretos.',
    en: '`qsort` sorts with a comparator. Tip: `(x>y)-(x<y)` avoids overflow and yields correct -1/0/1.' },
  { code: 'bsearch(&chave, base, n, sizeof *base, cmp);', cat: 'stdlib',
    pt: '`bsearch` faz busca binária num array JÁ ORDENADO com o mesmo comparador — retorna ponteiro ou `NULL`.',
    en: '`bsearch` binary-searches an ALREADY SORTED array with the same comparator — returns a pointer or `NULL`.' },
  { code: 'int a = atoi("42");   /* 12abc -> 12, sem erro */\nchar *end;\nlong b = strtol("42abc", &end, 10);', cat: 'stdlib',
    pt: '`atoi` engole lixo silenciosamente. `strtol` com `endptr` te diz onde a leitura parou — a forma robusta.',
    en: '`atoi` swallows garbage silently. `strtol` with `endptr` tells you where parsing stopped — the robust way.' },
  { code: 'exit(EXIT_SUCCESS);\nvoid cleanup(void) { ... }\natexit(cleanup);', cat: 'stdlib',
    pt: '`exit` encerra o processo (flush de buffers, `atexit` roda). `EXIT_FAILURE` sinaliza erro pro shell.',
    en: '`exit` ends the process (buffer flush, `atexit` handlers run). `EXIT_FAILURE` signals error to the shell.' },
  { code: 'srand((unsigned)time(NULL));\nint x = rand() % 100;', cat: 'stdlib',
    pt: '`rand`/`srand` geram pseudo-aleatório determinístico — use só pra testes/jogo, NUNCA pra segurança.',
    en: '`rand`/`srand` generate deterministic pseudo-randomness — only for tests/games, NEVER for security.' },
  { code: 'double x = sqrt(pow(2.0, 3.0));', cat: 'stdlib',
    pt: '`<math.h>` tem sqrt/pow/fabs/floor/ceil/round/trunc... Muitos sistemas exigem linkar `-lm`.',
    en: '`<math.h>` has sqrt/pow/fabs/floor/ceil/round/trunc... Many systems require linking `-lm`.' },
  { code: '#include <time.h>\nclock_t t = clock();\n/* ... */\ndouble s = (double)(clock() - t) / CLOCKS_PER_SEC;', cat: 'stdlib',
    pt: '`clock()` mede tempo de CPU aproximado. Pra wall-clock real, use `clock_gettime(CLOCK_MONOTONIC, ...)`.',
    en: '`clock()` measures approximate CPU time. For real wall-clock, use `clock_gettime(CLOCK_MONOTONIC, ...)`.' },

  // ─── I/O de arquivos ──────────────────────────────────────────────────
  { code: 'FILE *f = fopen("dados.txt", "r");\nif (!f) { perror("fopen"); return 1; }', cat: 'io',
    pt: 'Abre arquivo pra leitura. Modos: `r`/`w`/`a` (texto), `rb`/`wb` (binário), `+` pra leitura+escrita.',
    en: 'Opens a file for reading. Modes: `r`/`w`/`a` (text), `rb`/`wb` (binary), `+` for read+write.' },
  { code: 'fprintf(f, "linha %d\\n", i);\nfscanf(f, "%d", &n);', cat: 'io',
    pt: 'I/O formatado em arquivo: mesma semântica de printf/scanf, com um `FILE*` no primeiro argumento.',
    en: 'Formatted file I/O: same semantics as printf/scanf, with a `FILE*` as the first argument.' },
  { code: 'fread(buf, sizeof *buf, count, f);\nfwrite(buf, sizeof *buf, count, f);', cat: 'io',
    pt: 'I/O binário em blocos. O retorno diz quantos itens foram lidos — cheque pra não usar dados parciais.',
    en: 'Binary block I/O. The return tells how many items were read — check it to avoid partial data.' },
  { code: 'char linha[256];\nwhile (fgets(linha, sizeof linha, f)) { ... }', cat: 'io',
    pt: '`fgets` lê UMA linha com limite de tamanho — a única forma segura de ler linha. Inclui o `\\n`.',
    en: '`fgets` reads ONE line with a size limit — the only safe way to read a line. It includes the `\\n`.' },
  { code: 'int c = fgetc(f);\nwhile (c != EOF) { putchar(c); c = fgetc(f); }', cat: 'io',
    pt: '`fgetc` devolve um `int` (o char OU `EOF` negativo). Use `int`, não `char`, senão `EOF` vira outro byte.',
    en: '`fgetc` returns an `int` (the char OR the negative `EOF`). Use `int`, not `char`, or `EOF` becomes another byte.' },
  { code: 'fclose(f);', cat: 'io',
    pt: 'Fecha e descarrega buffers. Não fechar pode deixar dados perdidos e estourar o limite de descritores.',
    en: 'Closes and flushes buffers. Not closing can lose data and exhaust the file-descriptor limit.' },
  { code: 'fseek(f, 0, SEEK_END);\nlong sz = ftell(f);', cat: 'io',
    pt: 'Move o cursor e pergunta a posição — o par pra descobrir o tamanho do arquivo (binário com cuidado).',
    en: 'Moves the cursor and queries the position — the pair for finding a file size (careful with binary).' },
  { code: 'fprintf(stderr, "erro em %s\\n", arquivo);', cat: 'io',
    pt: 'Erros vão pra `stderr`, separado do `stdout` — assim `./app > out.txt` não mistura saída com diagnóstico.',
    en: 'Errors go to `stderr`, separate from `stdout` — so `./app > out.txt` keeps diagnostics out of the output.' },
  { code: 'setvbuf(stdout, NULL, _IONBF, 0);', cat: 'io',
    pt: 'Ajusta bufferização: `_IONBF` (sem buffer, útil em pipes), `_IOLBF` (por linha) ou `_IOFBF`.',
    en: 'Tunes buffering: `_IONBF` (unbuffered, useful for pipes), `_IOLBF` (line-buffered) or `_IOFBF`.' },
  { code: 'remove("lixo.tmp");\nrename("old.c", "new.c");', cat: 'io',
    pt: '`remove` apaga um arquivo; `rename` move/renomeia. Ambas devolvem 0 em sucesso.',
    en: '`remove` deletes a file; `rename` moves/renames. Both return 0 on success.' },

  // ─── Concorrência & sistema ───────────────────────────────────────────
  { code: '#include <pthread.h>\npthread_t t;\npthread_create(&t, NULL, rotina, NULL);\npthread_join(t, NULL);', cat: 'concur',
    pt: 'POSIX threads (Linux): crie, rode e espere. `rotina` é `void *rotina(void*)`. Link com `-pthread`.',
    en: 'POSIX threads (Linux): create, run, join. `rotina` is `void *rotina(void*)`. Link with `-pthread`.' },
  { code: 'pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;\npthread_mutex_lock(&m);\n/* seção crítica */\npthread_mutex_unlock(&m);', cat: 'concur',
    pt: 'Mutex protege estado compartilhado. Todo lock tem um unlock no mesmo caminho (idealmente no fim pra não vazar).',
    en: 'A mutex guards shared state. Every lock gets an unlock on the same path (ideally at the end so it never leaks).' },
  { code: '#include <stdatomic.h>\n_Atomic int contador;\natomic_fetch_add(&contador, 1);', cat: 'concur',
    pt: 'C11 traz atômicos nativos (`<stdatomic.h>`) — incrementos/leituras sem mutex pra casos simples.',
    en: 'C11 brings native atomics (`<stdatomic.h>`) — lock-free increments/reads for simple cases.' },
  { code: 'clock_gettime(CLOCK_MONOTONIC, &ts);', cat: 'concur',
    pt: 'Relógio monotônico: nunca anda pra trás (bom pra deadline/performance). `CLOCK_REALTIME` é o wall-clock.',
    en: 'Monotonic clock: never goes backwards (good for deadlines/performance). `CLOCK_REALTIME` is wall-clock time.' },
  { code: 'void handler(int sig) { /* sinal recebido */ }\nsignal(SIGINT, handler);', cat: 'concur',
    pt: '`signal` registra tratamento de Ctrl+C etc. `handler` recebe o número do sinal; prefira `sigaction` pra controle fino.',
    en: '`signal` registers a handler for Ctrl+C etc. `handler` receives the signal number; prefer `sigaction` for fine control.' },
  { code: 'errno = 0;\nFILE *f = fopen("x", "r");\nif (!f) fprintf(stderr, "erro %d: %s\\n", errno, strerror(errno));', cat: 'concur',
    pt: '`errno` carrega o último erro de sistema (zerar antes evita ler valor de chamada antiga); `strerror` vira texto.',
    en: '`errno` holds the last system error (clear it first to avoid stale values); `strerror` turns it into text.' },

  // ─── Gotchas ──────────────────────────────────────────────────────────
  { code: 'char s[4];\nstrcpy(s, "hello");   /* buffer overflow */', cat: 'gotchas',
    pt: 'O clássico e mais fatal: copiou 6 bytes (com `\\0`) num espaço de 4. Use `snprintf`/`strlcpy` e dimensione certo.',
    en: 'The classic and most fatal: 6 bytes (with `\\0`) copied into 4. Use `snprintf`/`strlcpy` and size correctly.' },
  { code: 'int *p;\n*p = 42;   /* p não aponta pra lugar nenhum */', cat: 'gotchas',
    pt: 'Ponteiro não inicializado é lixo — escrever nele corrompe memória aleatória. Inicialize sempre.',
    en: 'An uninitialized pointer is garbage — writing through it corrupts random memory. Always initialize.' },
  { code: 'free(p);\nfree(p);   /* double free */', cat: 'gotchas',
    pt: 'Liberar duas vezes o mesmo bloco = crash/UB. Depois do `free`, o ponteiro está pendurado — não use mais.',
    en: 'Freeing the same block twice = crash/UB. After `free` the pointer is dangling — stop using it.' },
  { code: 'if (s == "admin") { }   /* compara ENDEREÇOS */', cat: 'gotchas',
    pt: 'Ponteiros de string podem até "funcionar" às vezes (same literal) e quebrar em outra build. Use `strcmp`.',
    en: 'String pointers may even "work" sometimes (same literal) and break in another build. Use `strcmp`.' },
  { code: 'int maior = INT_MAX + 1;   /* overflow: UB */', cat: 'gotchas',
    pt: 'Overflow de inteiro signed é undefined behavior (não "wrap" garantido). Use `long long`, `uint64_t` ou cheque antes.',
    en: 'Signed integer overflow is undefined behavior (not a guaranteed wrap). Use `long long`, `uint64_t`, or check first.' },
  { code: 'int *ruim(void) {\n  int local = 42;\n  return &local;\n}   /* dangling pointer */', cat: 'gotchas',
    pt: 'Devolver ponteiro pra variável local devolve um endereço que deixa de existir. Aloque na heap ou receba dest.',
    en: 'Returning a pointer to a local variable returns an address that no longer exists. Heap-allocate or take a dest.' },
  { code: 'char c;\nwhile ((c = getchar()) != EOF) { }  /* \\x/ */', cat: 'gotchas',
    pt: '`EOF` é um valor negativo que não cabe em `char` (que pode ser unsigned). Leia com `int c`.',
    en: '`EOF` is a negative value that does not fit in `char` (which may be unsigned). Read with `int c`.' },
  { code: 'void f(int a[10]) {\n  printf("%zu", sizeof(a));  /* sizeof ponteiro! */\n}', cat: 'gotchas',
    pt: '`int a[10]` num parâmetro é `int *a` — o `sizeof` dentro da função mede o PONTEIRO. Passe o tamanho também.',
    en: '`int a[10]` as a parameter is `int *a` — `sizeof` inside measures the POINTER. Pass the length too.' },
  { code: 'int n;\nscanf("%d", &n);\n/* n pode não ter sido atribuído! */', cat: 'gotchas',
    pt: 'Se a entrada for inválida/vazia, `n` mantém lixo. Cheque o retorno (`scanf` devolve campos lidos) antes de usar.',
    en: 'On invalid/empty input `n` keeps garbage. Check the return (scanf returns fields read) before using it.' },
  { code: 'size_t i = 0;\n/* i > -1 sempre é true */', cat: 'gotchas',
    pt: 'Tipos `unsigned` nunca são negativos. Expressões mistas signed/unsigned convertem pro unsigned e engolem negativos.',
    en: 'Unsigned types are never negative. Mixed signed/unsigned expressions convert to unsigned and swallow negatives.' },
  { code: 'int i = 3; int j = i/2;   /* 1, não 1.5 */', cat: 'gotchas',
    pt: 'Divisão de inteiros trunca sempre. Pra decimal, force ponto flutuante: `(double)i / 2`.',
    en: 'Integer division always truncates. For decimals, force floating point: `(double)i / 2`.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de C',
    intro: (
      <>
        A linguagem que é base de quase tudo: do{' '}
        <Text code>gcc</Text>/<Text code>clang</Text>, passando por{' '}
        <Text code>printf</Text>/<Text code>scanf</Text>, ponteiros,
        strings, <Text code>struct</Text>/<Text code>union</Text>,{' '}
        pré-processador, biblioteca padrão (<Text code>malloc</Text>/
        <Text code>qsort</Text>/<Text code>fread</Text>) e os gotchas de{' '}
        memória que transformam péssimos em crashes.
      </>
    ),
    search: 'Pesquisar por comando ou descrição...',
    all: 'Todos',
    empty: 'Nada encontrado. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega quem está escrevendo C',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Você é o dono da memória.</Text> Todo{' '}
          <Text code>malloc</Text> tem um <Text code>free</Text>; arrays{' '}
          decaem pra ponteiro; passar "o array" é passar um ponteiro e o{' '}
          <Text code>sizeof</Text> na função mede o ponteiro. Passe o
          tamanho explícito sempre.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>String é array de char.</Text> Termina em{' '}
          <Text code>\\0</Text>, então <Text code>"oi"</Text> ocupa 3 bytes.
          Nunca escreva sem espaço pro terminador —{' '}
          <Text code>snprintf</Text>/<Text code>fgets</Text> são as formas
          seguras de copiar/ler.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Cheque retornos.</Text> <Text code>malloc</Text>{' '}
          devolve <Text code>NULL</Text>; <Text code>scanf</Text>/{' '}
          <Text code>fgets</Text> podem não ler nada;{' '}
          <Text code>realloc</Text> pode mover o bloco. O C não te avisa —
          ele deixa o estado errado passar em silêncio.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>UB não é opinião.</Text> Overflow de{' '}
          <Text code>int</Text>, acessar depois do <Text code>free</Text>{' '}
          e dereferenciar <Text code>NULL</Text> são undefined behavior:
          funcionam na sua máquina até quebrar em produção.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Warnings são erros.</Text>{' '}
          <Text code>-Wall -Wextra</Text> sempre. O compilador enxerga a
          maioria dos deslizes clássicos (formato errado, variável sem
          init) antes de virar crash.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Tipos cuidando de tamanhos.</Text> Use{' '}
          <Text code>&lt;stdint.h&gt;</Text> (u)intN_t pra bytes e{' '}
          <Text code>size_t</Text> pra tamanhos/índices. Muito do sofrimento
          de C vem de achar que <Text code>int</Text> e{' '}
          <Text code>char</Text> são "na medida".
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar snippet',
    copiedCode: 'Snippet copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'C Cheat Sheet',
    intro: (
      <>
        The language underneath almost everything: from{' '}
        <Text code>gcc</Text>/<Text code>clang</Text> through{' '}
        <Text code>printf</Text>/<Text code>scanf</Text>, pointers,
        strings, <Text code>struct</Text>/<Text code>union</Text>, the
        preprocessor, the standard library (<Text code>malloc</Text>/
        <Text code>qsort</Text>/<Text code>fread</Text>), and the memory
        gotchas that turn mistakes into crashes.
      </>
    ),
    search: 'Search by command or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: "What trips people up the most when writing C",
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>You own the memory.</Text> Every{' '}
          <Text code>malloc</Text> has a <Text code>free</Text>; arrays{' '}
          decay to pointers; "passing an array" passes a pointer and{' '}
          <Text code>sizeof</Text> inside the function measures the pointer.
          Always pass lengths explicitly.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>A string is a char array.</Text> It ends in{' '}
          <Text code>\\0</Text>, so <Text code>"hi"</Text> takes 3 bytes.
          Never write without room for the terminator —{' '}
          <Text code>snprintf</Text>/<Text code>fgets</Text> are the safe
          ways to copy/read.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Check return values.</Text> <Text code>malloc</Text>{' '}
          returns <Text code>NULL</Text>; <Text code>scanf</Text>/{' '}
          <Text code>fgets</Text> may read nothing;{' '}
          <Text code>realloc</Text> may move the block. C does not warn you
          — it silently keeps the wrong state.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>UB is not an opinion.</Text> Signed overflow,
          accessing after <Text code>free</Text>, and dereferencing{' '}
          <Text code>NULL</Text> are undefined behavior: they work on your
          machine until they break in production.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Warnings are errors.</Text> Always{' '}
          <Text code>-Wall -Wextra</Text>. The compiler catches most classic
          slips (wrong format, uninitialized variable) before they become
          crashes.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Types that mind their sizes.</Text> Use{' '}
          <Text code>&lt;stdint.h&gt;</Text> (u)intN_t for bytes and{' '}
          <Text code>size_t</Text> for sizes/indices. Much C suffering comes
          from assuming <Text code>int</Text> and <Text code>char</Text> are
          "just right".
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy snippet',
    copiedCode: 'Snippet copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function CCheatsheetPage() {
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
    const header = '# C (cheat sheet)\n\n'
    const body = filtered
      .map((it) =>
        [
          `### ${labelOf[it.cat][lang]}`,
          '',
          '```',
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
      <Title level={2}><ContainerOutlined /> {t.title}</Title>
      <Paragraph type="secondary">{t.intro}</Paragraph>

      <Alert
        type="warning"
        showIcon
        icon={<CodeOutlined />}
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
          <Button size="small" icon={<ReadOutlined />} onClick={copyMarkdown}>
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
                    color: '#262626',
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