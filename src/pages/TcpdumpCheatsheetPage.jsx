import React, { useCallback, useMemo, useState } from 'react'
import { Typography, Card, Space, Input, List, Tag, Radio, Alert, Button, message } from 'antd'
import { ReadOutlined, SearchOutlined, CodeOutlined, CopyOutlined } from '@ant-design/icons'
import { useLanguage } from '../i18n/LanguageContext'

const { Title, Paragraph, Text } = Typography

const CATEGORIES = ['basics', 'filter', 'proto', 'flags', 'out', 'file', 'done']

const CATEGORY_COLOR = {
  basics: 'cyan',
  filter: 'blue',
  proto: 'purple',
  flags: 'magenta',
  out: 'gold',
  file: 'green',
  done: 'volcano',
}

const labelOf = {
  basics: { pt: 'Essenciais & interfaces', en: 'Basics & interfaces' },
  filter: { pt: 'Filtros BPF (expressões)', en: 'BPF filters (expressions)' },
  proto: { pt: 'Por protocolo', en: 'By protocol' },
  flags: { pt: 'Flags TCP & payload', en: 'TCP flags & payload' },
  out: { pt: 'Formato da saída', en: 'Output format' },
  file: { pt: 'Arquivos .pcap', en: '.pcap files' },
  done: { pt: 'Análise & workflow', en: 'Analysis & workflow' },
}

const ITEMS = [
  // ─── Essenciais & interfaces ─────────────────────────────────────────
  { code: 'sudo tcpdump -i eth0', cat: 'basics',
    pt: 'Captura na interface `eth0`. O `sudo` é porque o tcpdump precisa da capability `CAP_NET_RAW` pra abrir o socket de captura — sem ele, erro de permissão na cara.',
    en: 'Captures on interface `eth0`. `sudo` is needed because tcpdump requires the `CAP_NET_RAW` capability to open the capture socket — without it you get a permission error immediately.' },
  { code: 'tcpdump -i any', cat: 'basics',
    pt: 'Captura em TODAS as interfaces ao mesmo tempo — o jeito mais rápido de ver o tráfego da máquina sem saber em qual placa ele trafega.',
    en: 'Captures on ALL interfaces at once — the fastest way to see the machine traffic without knowing which NIC it flows through.' },
  { code: 'tcpdump -D', cat: 'basics',
    pt: 'Lista as interfaces disponíveis com um número e o nome real — o passo de descoberta quando você nem lembra como a placa se chama.',
    en: 'Lists available interfaces with a number and the real name — the discovery step when you don\'t even remember what the NIC is called.' },
  { code: 'tcpdump -i lo', cat: 'basics',
    pt: 'Captura no loopback — essencial pra debugar processos locais (dois serviços na mesma máquina conversando via 127.0.0.1 não aparecem em interface externa).',
    en: 'Captures on loopback — essential for debugging local processes (two services on the same machine talking over 127.0.0.1 don\'t show up on external interfaces).' },
  { code: 'tcpdump -i eth0 -c 20', cat: 'basics',
    pt: 'Pára sozinho depois de 20 pacotes — captura limitada por quantidade, ótimo pra "me dá uma amostra e sai da frente".',
    en: 'Stops by itself after 20 packets — quantity-limited capture, great for "give me a sample and get out of the way".' },
  { code: 'tcpdump -i eth0 -s 0', cat: 'basics',
    pt: '`-s` (snaplen) 0 = captura o pacote INTEIRO. O default moderno já é 262144 bytes (o suficiente), mas o 0 explicita "não trunca" quando você quer payload completo.',
    en: '`-s` (snaplen) of 0 = capture the WHOLE packet. The modern default is already 262144 bytes (enough), but 0 makes "don\'t truncate" explicit when you want full payloads.' },
  { code: 'timeout 30 tcpdump -i eth0', cat: 'basics',
    pt: 'Captura limitada por TEMPO: o GNU `timeout` derruba o tcpdump após 30 s — o equivalente do "deixa rodando um minuto e me traz".',
    en: 'TIME-limited capture: GNU `timeout` kills tcpdump after 30 s — the equivalent of "let it run a minute and bring me the result".' },
  { code: 'tcpdump -i eth0 -p', cat: 'basics',
    pt: '`-p` desliga o modo promíscuo: só pacotes com destino a esta interface. Útil quando um tráfego estranho de capture espelhada/switch está poluindo a saída.',
    en: '`-p` turns off promiscuous mode: only packets destined for this interface. Useful when mirrored/switch traffic is polluting the output.' },

  // ─── Filtros BPF (expressões) ───────────────────────────────────────
  { code: 'tcpdump -i eth0 host 8.8.8.8', cat: 'filter',
    pt: 'Só pacotes que envolvem aquele IP (como origem OU destino). É o filtro de gerência universal: "o que essa máquina está fazendo?".',
    en: 'Only packets involving that IP (as source OR destination). The universal management filter: "what is this box doing?".' },
  { code: 'tcpdump src 10.0.0.5\ntcpdump dst 10.0.0.5', cat: 'filter',
    pt: '`src`/`dst` restringem a direção: pacotes que SAEM da 10.0.0.5 ou que VÃO pra ela. Juntos desbravam quem está iniciando o quê.',
    en: '`src`/`dst` restrict the direction: packets LEAVING 10.0.0.5 or going TO it. Together they reveal who is initiating what.' },
  { code: 'tcpdump net 10.0.0.0/8', cat: 'filter',
    pt: 'Filtra por sub-rede em notação CIDR — o balde inteiro em vez de um host só. Combina com src/net e dst/net.',
    en: 'Filters by subnet in CIDR notation — the whole bucket instead of a single host. Combines with src/net and dst/net.' },
  { code: 'tcpdump port 443', cat: 'filter',
    pt: 'Qualquer pacote com porta 443 (origem ou destino). A porta normaliza o "o quê" (HTTPS), depois o host refina o "quem".',
    en: 'Any packet with port 443 (source or destination). The port normalizes the "what" (HTTPS), then the host refines the "who".' },
  { code: 'tcpdump portrange 8000-8010', cat: 'filter',
    pt: 'Faixa de portas de uma vez — prático pra dev servers que ocupam um bloco (Vite, microserviços...) sem enumerar porta por porta.',
    en: 'A port range at once — handy for dev servers that own a block (Vite, microservices...) without listing port by port.' },
  { code: 'tcpdump src port 53\ntcpdump dst port 53', cat: 'filter',
    pt: 'Porta lado a lado: `src port 53` é resposta de DNS chegando no cliente, `dst port 53` é a query saindo — direção importa quando o fluxo tem os dois lados.',
    en: 'Port on each side: `src port 53` is a DNS reply arriving at the client, `dst port 53` is the query leaving — direction matters when the flow has both sides.' },
  { code: "tcpdump 'tcp and (port 80 or port 443)'", cat: 'filter',
    pt: 'Combina com `and`/`or`/`not`. As aspas simples protegem os parênteses do shell — sem elas o bash engole a expressão e o filtro quebra.',
    en: 'Combine with `and`/`or`/`not`. The single quotes protect the parentheses from the shell — without them bash swallows the expression and the filter breaks.' },
  { code: "tcpdump 'not arp and not icmp'", cat: 'filter',
    pt: 'Esconde o ruído de protocolo de rede: ARP e ICMP (ping) são capa de disco de qualquer captura — tirá-los realça o tráfego de aplicação.',
    en: 'Hides the network-protocol noise: ARP and ICMP (ping) are the background noise of any capture — removing them highlights application traffic.' },
  { code: "tcpdump 'vlan 100'", cat: 'filter',
    pt: 'Captura só o tráfego de uma VLAN marcada (802.1Q) — o jeito de isolar um segmento lógico quando a interface recebe de várias VLANs.',
    en: 'Captures only the traffic of one tagged VLAN (802.1Q) — the way to isolate a logical segment when the interface receives from multiple VLANs.' },
  { code: 'tcpdump less 200\ntcpdump greater 1000', cat: 'filter',
    pt: '`less`/`greater` filtram por tamanho de pacote em bytes — pinga os pequenos (acks, queries) ou os grandes (downloads, streaming) sem olhar protocolo.',
    en: '`less`/`greater` filter by packet size in bytes — picks the small ones (acks, queries) or the big ones (downloads, streaming) without looking at the protocol.' },
  { code: 'tcpdump ether host 00:11:22:33:44:55', cat: 'filter',
    pt: 'Filtra pelo endereço MAC — o único jeito de isolar um host quando você não sabe o IP dele (ou ele usa DHCP).',
    en: 'Filters by MAC address — the only way to isolate a host when you don\'t know its IP (or it uses DHCP).' },
  { code: "tcpdump 'ip6 and tcp port 443'\ntcpdump 'ip and tcp port 443'", cat: 'filter',
    pt: '`ip6`/`ip` limitam a família de endereço — essencial pra separar o IPv4 do IPv6 quando o host fala os dois ao mesmo tempo.',
    en: '`ip6`/`ip` limit the address family — essential to separate IPv4 from IPv6 when the host speaks both at once.' },

  // ─── Por protocolo ──────────────────────────────────────────────────
  { code: 'tcpdump -nn tcp port 443', cat: 'proto',
    pt: 'Handshake TLS: o `ClientHello`/`ServerHello` aparecem na forma e no tamanho certos — dá pra ver a negociação até a cripto, mas o payload (já cifrado) o tcpdump não mostra.',
    en: 'TLS handshake: `ClientHello`/`ServerHello` show up with the right shape and size — you can see the negotiation up to crypto, but tcpdump won\'t show the (already encrypted) payload.' },
  { code: 'tcpdump -nn -v udp port 53', cat: 'proto',
    pt: 'DNS: com `-v` o tcpdump decodifica a resposta e mostra o nome (`A? example.com`). Sem `-v` você vê só "there are 9 nameservers" e o tamanho.',
    en: 'DNS: with `-v` tcpdump decodes the reply and shows the name (`A? example.com`). Without `-v` you only see "there are 9 nameservers" and the size.' },
  { code: 'tcpdump -nn udp port 67 or udp port 68', cat: 'proto',
    pt: 'DHCP: os dois lados do protocolo (67 servidor, 68 cliente) sob UDP — pega DORA (Discover/Offer/Request/Ack) inteiro: "a máquina pediu IP e o servidor respondeu".',
    en: 'DHCP: both sides of the protocol (67 server, 68 client) over UDP — captures the whole DORA (Discover/Offer/Request/Ack): "the machine asked for an IP and the server answered".' },
  { code: 'tcpdump -nn icmp[icmptype] == icmp-echo\ntcpdump -nn icmp[icmptype] == icmp-echoreply', cat: 'proto',
    pt: 'Ping separado por direção: echo request (`icmp-echo`) e echo reply (`icmp-echoreply`). O `[icmptype]` indexa o byte 0 do payload ICMP.',
    en: 'Ping split by direction: echo request (`icmp-echo`) and echo reply (`icmp-echoreply`). The `[icmptype]` indexes byte 0 of the ICMP payload.' },
  { code: 'tcpdump -nn arp\ntcpdump -nn arp[6:2] == 1\ntcpdump -nn arp[6:2] == 2', cat: 'proto',
    pt: 'ARP cru, request (`[6:2] == 1`) e reply (`[6:2] == 2`) — o campo `op` fica nos bytes 6–7 do cabeçalho ARP. Essencial pra caçar "IP duplicado" e falha de MAC.',
    en: 'Raw ARP, request (`[6:2] == 1`) and reply (`[6:2] == 2`) — the `op` field sits at bytes 6–7 of the ARP header. Essential for hunting "duplicate IP" and MAC failures.' },
  { code: 'tcpdump -nn -A tcp port 22', cat: 'proto',
    pt: 'SSH: o banner (`SSH-2.0-...`) e os primeiros bytes do handshake aparecem em ASCII com `-A` — antes da troca de chaves, o tráfego ainda é legível.',
    en: 'SSH: the banner (`SSH-2.0-...`) and the first bytes of the handshake show up in ASCII with `-A` — before the key exchange the traffic is still readable.' },
  { code: 'tcpdump -nn -A -s 0 tcp port 80', cat: 'proto',
    pt: 'HTTP: com `-A` você lê os cabeçalhos (e o body de texto) direto do stream — o jeito mais rápido de ver "o que esse cliente mandou pro servidor".',
    en: 'HTTP: with `-A` you read headers (and text bodies) straight off the stream — the fastest way to see "what this client sent to the server".' },
  { code: 'tcpdump -nn -s 0 port 3306', cat: 'proto',
    pt: 'MySQL/MariaDB: queries em texto cru nos pacotes — com `-A` você enxerga o SQL que está sendo executado. Porta 5432 é a do PostgreSQL (mesma ideia).',
    en: 'MySQL/MariaDB: queries in raw text in the packets — with `-A` you see the SQL being executed. Port 5432 is PostgreSQL (same idea).' },
  { code: 'tcpdump -nn tcp port 6379', cat: 'proto',
    pt: 'Redis: comandos (SET/GET/...) aparecem em texto — depurar cache inválido/falta de hit é só olhar qual chave o app está pedindo.',
    en: 'Redis: commands (SET/GET/...) appear as text — debugging invalid/missing cache hits is just watching which key the app requests.' },
  { code: 'tcpdump -nn udp port 123', cat: 'proto',
    pt: 'NTP: pacotes UDP de sincronização de relógio — vê quem na rede está usando que servidor de tempo e com que stratum.',
    en: 'NTP: UDP clock-sync packets — see who on the network is using which time server and at what stratum.' },

  // ─── Flags TCP & payload ────────────────────────────────────────────
  { code: "tcpdump -nn 'tcp[13] & 2 != 0'", cat: 'flags',
    pt: 'Todos os pacotes com a flag SYN setada (byte 13 = flags; 2 = SYN) — conexões NOVAS entrando ou saindo. `!= 0` pega também o SYN+ACK.',
    en: 'All packets with the SYN flag set (byte 13 = flags; 2 = SYN) — NEW connections coming in or going out. `!= 0` also catches SYN+ACK.' },
  { code: "tcpdump -nn 'tcp[13] == 2'", cat: 'flags',
    pt: 'SYN PURO: o byte de flags IGUAL a 2 (sem ACK junto) — o primeiro pacote do handshake, o "pedido de conexão" limpo, sem resposta.',
    en: 'BARE SYN: the flags byte EQUAL to 2 (no ACK alongside) — the first packet of the handshake, the clean "connection request", no reply.' },
  { code: "tcpdump -nn 'tcp[13] & 16 != 0'", cat: 'flags',
    pt: 'ACK (bit 16): o carimbo de "recebi" — as flags nas duas direções desenham quem está esperando e quem está respondendo.',
    en: 'ACK (bit 16): the "got it" stamp — the flags in both directions draw who is waiting and who is answering.' },
  { code: "tcpdump -nn 'tcp[13] & 4 != 0'", cat: 'flags',
    pt: 'RST (bit 4): conexão interrompida na marra — picos de RST são clínica: firewall descartando, porta fechada, ou aplicação que abriu e largou.',
    en: 'RST (bit 4): connection killed abruptly — RST spikes are a clinic: firewall dropping, closed port, or an app that opened and dropped.' },
  { code: "tcpdump -nn 'tcp[13] & 1 != 0'", cat: 'flags',
    pt: 'FIN (bit 1): encerramento gracioso — cada direção manda seu FIN quando termina de falar; contar Fins é contar "conexões que acabaram direito".',
    en: 'FIN (bit 1): graceful close — each direction sends its FIN when done talking; counting FINs is counting "connections that ended properly".' },
  { code: "tcpdump -nn 'tcp[tcpflags] & (tcp-syn|tcp-fin|tcp-rst) == 0'", cat: 'flags',
    pt: 'O clássico "estabelecidas": nenhuma das flags de início/fim/reset ligada — só tráfego de conexões JÁ conversando. `tcpflags` é o alias do offset 13.',
    en: 'The classic "established": none of the start/end/reset flags set — only traffic of connections ALREADY talking. `tcpflags` is the alias for offset 13.' },

  // ─── Formato da saída ───────────────────────────────────────────────
  { code: 'tcpdump -n -i eth0', cat: 'out',
    pt: '`-n` desliga a resolução de hostname: mostra os IPs crus. Sem ele o tcpdump faz lookup reverso e ENROLA a captura esperando DNS para cada pacote.',
    en: '`-n` turns off hostname resolution: shows raw IPs. Without it tcpdump does reverse lookups and SLOWS the capture waiting on DNS for every packet.' },
  { code: 'tcpdump -nn -i eth0', cat: 'out',
    pt: '`-nn` resolve NADA: nem hostnames nem nomes de porta (mostra `443` em vez de `https`). O padrão do dia a dia pra leitura limpa de números.',
    en: '`-nn` resolves NOTHING: neither hostnames nor port names (shows `443` instead of `https`). The everyday standard for clean, numeric output.' },
  { code: 'tcpdump -v -i eth0\ntcpdump -vvv -i eth0', cat: 'out',
    pt: '`-v`/`-vv`/`-vvv` aumentam a verbosidade: TTL, ToS, IDs, checksums e detalhes de protocolo — `-vvv` despeja o limite do pacote. Vai subindo até achar o nível.',
    en: '`-v`/`-vv`/`-vvv` increase verbosity: TTL, ToS, IDs, checksums and protocol details — `-vvv` dumps the packet limit. Ramp up until you find the right level.' },
  { code: 'tcpdump -e -i eth0', cat: 'out',
    pt: 'Adiciona o cabeçalho de camada de ENLACE: os MACs de origem/destino aparecem no começo da linha — essencial pra saber de qual porta/placa veio.',
    en: 'Adds the LINK-layer header: source/destination MACs appear at the start of the line — essential to know which port/NIC it came from.' },
  { code: 'tcpdump -A -s 0 -i eth0', cat: 'out',
    pt: 'Imprime o payload como ASCII — lê texto (HTTP, banners, queries) sem trocar de ferramenta. Dados binários viram ponto "." e param a festa.',
    en: 'Prints the payload as ASCII — read text (HTTP, banners, queries) without switching tools. Binary data becomes a "." and brings the party to an end.' },
  { code: 'tcpdump -X -s 0 -i eth0', cat: 'out',
    pt: 'Hex + ASCII lado a lado pra cada pacote — o formato de análise bit-a-bit (e o mesmo layout do Wireshark na parte de baixo).',
    en: 'Hex + ASCII side by side for each packet — the bit-by-bit analysis format (and the same layout Wireshark uses at the bottom pane).' },
  { code: 'tcpdump -x -s 0 -i eth0', cat: 'out',
    pt: 'Hex puro, sem coluna ASCII — quando o que importa é só o valor dos bytes. `-xx` inclui ainda o cabeçalho da camada de enlace (ethernet).',
    en: 'Plain hex, no ASCII column — when only the byte values matter. `-xx` also includes the link-layer (Ethernet) header.' },
  { code: 'tcpdump -tttt -i eth0\ntcpdump -ttt -i eth0', cat: 'out',
    pt: 'Timestamps: `-tttt` mostra data completa (`2026-08-18 10:00:00.123`), `-ttt` mostra o DELTA em relação ao pacote anterior — mede latência entre quadros.',
    en: 'Timestamps: `-tttt` shows the full date (`2026-08-18 10:00:00.123`), `-ttt` shows the DELTA from the previous packet — measure latency between frames.' },
  { code: 'tcpdump -q -i eth0', cat: 'out',
    pt: 'Modo quieto: descrição curta de protocolo em vez da linha inteira — perfeito pra contar volume sem encher a tela.',
    en: 'Quiet mode: short protocol description instead of the full line — perfect for counting volume without flooding the screen.' },
  { code: "tcpdump -nn -l port 80 | grep -i 'host:'", cat: 'out',
    pt: '`-l` deixa a saída line-buffered — sem ele, pipeline com grep só libera em blocos e dará impressão de que nada está chegando.',
    en: '`-l` makes the output line-buffered — without it, piping into grep only releases in chunks and it looks like nothing is arriving.' },

  // ─── Arquivos .pcap ─────────────────────────────────────────────────
  { code: 'tcpdump -i eth0 -w capture.pcap', cat: 'file',
    pt: 'Grava a captura binária num .pcap em vez de imprimir. É o formato que o Wireshark (e o tshark) abre direto — capture primeiro, analise depois.',
    en: 'Writes the binary capture to a .pcap instead of printing. It\'s the format Wireshark (and tshark) opens directly — capture first, analyze later.' },
  { code: 'tcpdump -r capture.pcap', cat: 'file',
    pt: 'Lê um .pcap gravado antes — a análise offline com o MESMO jogo de filtros (`-n`, `-vv`, `-A`, portas...) da captura ao vivo.',
    en: 'Reads a previously recorded .pcap — offline analysis with the SAME toolbox (`-n`, `-vv`, `-A`, ports...) as live capture.' },
  { code: 'tcpdump -i eth0 -w big.pcap -C 100', cat: 'file',
    pt: '`-C` rotaciona o arquivo a cada 100 MB: big.pcap, big.pcap1, big.pcap2... — evita o arquivo monstro que ninguém consegue abrir.',
    en: '`-C` rotates the file every 100 MB: big.pcap, big.pcap1, big.pcap2... — avoids the monster file nobody can open.' },
  { code: 'tcpdump -i eth0 -w rot.pcap -G 60 -W 5', cat: 'file',
    pt: '`-G 60` rotaciona a cada 60 s e `-W 5` mantém só os 5 arquivos mais novos (sobrescreve os velhos) — a janela giratória de captura contínua.',
    en: '`-G 60` rotates every 60 s and `-W 5` keeps only the 5 newest files (old ones are overwritten) — the rolling window of continuous capture.' },
  { code: 'tcpdump -i eth0 -w dns.pcap -z gzip', cat: 'file',
    pt: '`-z` roda um comando após cada rotação (`-G`/`-C`) — gzipar os arquivos fechados reduz o disco em ordens de grandeza.',
    en: '`-z` runs a command after each rotation (`-G`/`-C`) — gzipping closed files cuts disk usage by orders of magnitude.' },
  { code: 'tcpdump -r full.pcap -w dns.pcap udp port 53', cat: 'file',
    pt: 'Extrai um SUBCONJUNTO de um pcap pra um pcap novo — filtra o DNS do meio do tráfego misto sem re-capturar nada.',
    en: 'Extracts a SUBSET from a pcap into a fresh pcap — filters DNS out of mixed traffic without re-capturing anything.' },

  // ─── Análise & workflow ─────────────────────────────────────────────
  { code: "tcpdump -nn -r cap.pcap | tail -n +2 | wc -l", cat: 'done',
    pt: 'Conta quantos pacotes casaram o filtro no arquivo. O `tail -n +2` descarta a linha "reading from file" que o tcpdump imprime no início da leitura.',
    en: 'Counts how many packets matched the filter in the file. `tail -n +2` drops the "reading from file" line tcpdump prints when starting to read.' },
  { code: "tcpdump -nn -r cap.pcap | awk '{print $3}' | sort | uniq -c | sort -rn | head -20", cat: 'done',
    pt: 'Top conversadores: pega a coluna da origem, agrupa e ordena — "quem mais falou" em 30 segundos, sem ferramenta extra.',
    en: 'Top talkers: grab the source column, group and sort — "who spoke the most" in 30 seconds, no extra tooling.' },
  { code: "tcpdump -nn -r cap.pcap 'tcp[13] & 2 != 0' | wc -l", cat: 'done',
    pt: 'Conta conexões NOVAS (SYN) no arquivo inteiro — a métrica raiz de "quantos clientes chegaram" do ponto de vista da rede.',
    en: 'Counts NEW connections (SYN) across the whole file — the root metric of "how many clients arrived" from the network\'s point of view.' },
  { code: 'mergecap a.pcap b.pcap -w merged.pcap', cat: 'done',
    pt: 'Junta capturas (do mesmo `libpcap`/Wireshark) num único arquivo, ordenando por timestamp — reconstruir o dia inteiro a partir de janelas curtas.',
    en: 'Merges captures (same `libpcap`/Wireshark family) into a single file, sorting by timestamp — rebuilding a whole day from short windows.' },
  { code: "tshark -r cap.pcap -Y 'http.request'", cat: 'done',
    pt: 'Primo do tcpdump com decode de protocolo e filtros de DISPLAY (estilo Wireshark): `-Y` filtra coisa que BPF nem enxerga, como CABEÇALHOS HTTP.',
    en: 'tcpdump\'s cousin with protocol decoding and DISPLAY filters (Wireshark-style): `-Y` filters things BPF can\'t see at all, like HTTP HEADERS.' },
]

const translations = {
  pt: {
    title: 'Cheat Sheet de tcpdump',
    intro: (
      <>
        O <Text code>tcpdump</Text> — captura e análise de pacotes que todo
        dev de infra/backend acaba precisando. O irmão de linha de comando do{' '}
        <Text code>Wireshark</Text>: aqui é captura ao vivo e leitura de{' '}
        <Text code>.pcap</Text>, com a mesma linguagem de filtros (BPF) que o
        resto do ecossistema usa. Chega de decorar sintaxe de filtro na hora
        do incidente.
      </>
    ),
    search: 'Buscar por flag, filtro ou descrição...',
    all: 'Todas',
    empty: 'Nenhuma entrada encontrada. Tente outra busca ou categoria.',
    tipTitle: 'O que mais pega no tcpdump',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Filtros ao contrário de flags.</Text> O filtro
          (expressão BPF: <Text code>host</Text>, <Text code>port</Text>,{' '}
          <Text code>and</Text>/<Text code>or</Text>,{' '}
          <Text code>[13]</Text>) vai DEPOIS de todas as flags de captura —{' '}
          <Text code>tcpdump -nn -i eth0 port 80</Text>, nunca a expressão no
          meio. E sempre entre aspas simples quando tiver{' '}
          <Text code>(</Text>, <Text code>!</Text> ou{' '}
          <Text code>&gt;</Text>, ou o shell engole.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Cuidado com <Text code>&amp;</Text> vs{' '}
            <Text code>==</Text>.</Text> Em{' '}
          <Text code>tcp[13] &amp; 2 != 0</Text> o fluxo é: mascara a flag,
          testa se tem algum bit. Já{' '}
          <Text code>tcp[13] == 2</Text> exige a flag IGUAL a 2 (SYN puro).
          Trocar um pelo outro muda o conjunto inteiro de pacotes.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Permissão e nomes.</Text> Sem{' '}
          <Text code>sudo</Text> (capability <Text code>CAP_NET_RAW</Text>){' '}
          você nem abre a interface. E use{' '}
          <Text code>-n</Text>/<Text code>-nn</Text> sempre que puder: a
          resolução de hostname trava a captura esperando DNS para cada
          pacote.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Filtro de captura ≠ filtro de exibição.</Text> O
          tcpdump usa filtros BPF (packet filter); o Wireshark/tshark tem a
          camada extra de filtros de display (
          <Text code>-Y 'http.request'</Text>) que enxerga conteúdo de
          protocolo. BPF é fino; display filter é grosso.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Capture agora, analise depois.</Text>{' '}
          <Text code>-w</Text> grava .pcap e{' '}
          <Text code>-r</Text> relê com o mesmo jogo de bandeiras — nunca
          congele a captura em texto que você esquece de filtrar depois.
        </Paragraph>
      </>
    ),
    resultsOne: 'entrada encontrada',
    resultsMany: 'entradas encontradas',
    copy: 'Copiar como Markdown',
    copyCode: 'Copiar comando',
    copiedCode: 'Comando copiado',
    copiedList: 'Lista Markdown copiada',
    copyError: 'Não foi possível copiar',
  },
  en: {
    title: 'tcpdump Cheat Sheet',
    intro: (
      <>
        <Text code>tcpdump</Text> — packet capture and analysis that every
        infra/backend dev ends up needing. The command-line sibling of{' '}
        <Text code>Wireshark</Text>: live capture and{' '}
        <Text code>.pcap</Text> reading, using the same filter language (BPF)
        the rest of the ecosystem uses. No more re-memorizing filter syntax
        mid-incident.
      </>
    ),
    search: 'Search by flag, filter or description...',
    all: 'All',
    empty: 'No entry found. Try a different search or category.',
    tipTitle: 'What trips people up the most',
    tipBody: (
      <>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Filters last, flags first.</Text> The filter
          expression (BPF: <Text code>host</Text>, <Text code>port</Text>,{' '}
          <Text code>and</Text>/<Text code>or</Text>,{' '}
          <Text code>[13]</Text>) goes AFTER all capture flags —{' '}
          <Text code>tcpdump -nn -i eth0 port 80</Text>, never the expression
          in the middle. And always single-quote it when it has{' '}
          <Text code>(</Text>, <Text code>!</Text> or{' '}
          <Text code>&gt;</Text>, or the shell swallows it.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Mind <Text code>&amp;</Text> vs{' '}
            <Text code>==</Text>.</Text> In{' '}
          <Text code>tcp[13] &amp; 2 != 0</Text> the flow is: mask the flag,
          test if any bit is set. But{' '}
          <Text code>tcp[13] == 2</Text> demands the flag byte EQUAL to 2
          (bare SYN). Swapping one for the other changes the whole packet
          set.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Permissions and names.</Text> Without{' '}
          <Text code>sudo</Text> (capability{' '}
          <Text code>CAP_NET_RAW</Text>) you can&apos;t even open the
          interface. And use <Text code>-n</Text>/<Text code>-nn</Text>{' '}
          whenever you can: hostname resolution stalls the capture waiting on
          DNS for every packet.
        </Paragraph>
        <Paragraph style={{ marginBottom: 8 }}>
          <Text strong>Capture filter ≠ display filter.</Text> tcpdump uses
          BPF (packet-level) filters; Wireshark/tshark adds a display-filter
          layer (<Text code>-Y 'http.request'</Text>) that sees protocol
          content. BPF is thin; display filters are thick.
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Capture now, analyze later.</Text>{' '}
          <Text code>-w</Text> writes .pcap and{' '}
          <Text code>-r</Text> re-reads it with the same toolbox — never
          freeze a capture into text you forget to filter afterwards.
        </Paragraph>
      </>
    ),
    resultsOne: 'entry found',
    resultsMany: 'entries found',
    copy: 'Copy as Markdown',
    copyCode: 'Copy command',
    copiedCode: 'Command copied',
    copiedList: 'Markdown list copied',
    copyError: 'Could not copy',
  },
}

export default function TcpdumpCheatsheetPage() {
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
    const header = '# tcpdump (cheat sheet)\n\n'
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
      <Title level={2}><ReadOutlined /> {t.title}</Title>
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