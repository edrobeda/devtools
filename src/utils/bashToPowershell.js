/**
 * Motor heurístico de tradução entre comandos Bash (Linux/macOS/WSL)
 * e PowerShell (Windows). NÃO é um parser de shell completo: ele faz
 * substituições de padrões comuns linha a linha, o que já cobre a maior
 * parte do dia a dia de quem alterna entre os dois ambientes.
 */

// Mapeamento Bash -> PowerShell para comandos/operadores inteiros.
// Ordem importa: padrões mais específicos devem vir antes dos genéricos.
const BASH_TO_PS = [
  { from: /^\s*#/, to: (line) => line }, // comentários permanecem
  { from: /\$\(([^)]+)\)/g, to: '($1)' }, // command substitution
  { from: /\$\{([^}]+)\}/g, to: '$$env:$1' }, // ${VAR} -> $env:VAR
  { from: /\$(?=[A-Za-z_][A-Za-z0-9_]*\b)/g, to: '$env:' }, // $VAR -> $env:VAR
  { from: /\bchmod\s+([0-7]{3,4})\s+(.+)/g, to: 'chmod $1 $2  # no PowerShell nativo não existe chmod; use em WSL ou icacls' },
  { from: /\bchown\s+/g, to: 'chown  # não existe no PowerShell nativo — use em WSL ou takeown/icacls' },
  { from: /\bls\b/g, to: 'Get-ChildItem' },
  { from: /\bll\b/g, to: 'Get-ChildItem -Force' },
  { from: /\bll\s+-la\b/g, to: 'Get-ChildItem -Force' },
  { from: /\bpwd\b/g, to: 'Get-Location' },
  { from: /\bcp\s+/g, to: 'Copy-Item ' },
  { from: /\bmv\s+/g, to: 'Move-Item ' },
  { from: /\brm\s+/g, to: 'Remove-Item ' },
  { from: /\brmdir\s+/g, to: 'Remove-Item ' },
  { from: /\bmkdir\s+/g, to: 'New-Item -ItemType Directory ' },
  { from: /\btouch\s+(.+)/g, to: "New-Item -ItemType File -Path $1 -Force" },
  { from: /\bcat\s+/g, to: 'Get-Content ' },
  { from: /\bless\s+/g, to: 'Get-Content ' },
  { from: /\bhead\s+/g, to: 'Get-Content | Select-Object -First ' },
  { from: /\btail\s+/g, to: 'Get-Content | Select-Object -Last ' },
  { from: /\btail\s+-f\s+(.+)/g, to: 'Get-Content $1 -Wait' },
  { from: /\bgrep\s+/g, to: 'Select-String ' },
  { from: /\bfind\s+/g, to: 'Get-ChildItem -Recurse ' },
  { from: /\bwhich\s+(.+)/g, to: 'Get-Command $1' },
  { from: /\bwhoami\b/g, to: 'whoami  # ou $env:USERNAME' },
  { from: /\bdate\b/g, to: 'Get-Date' },
  { from: /\becho\s+/g, to: 'Write-Output ' },
  { from: /\bprintf\s+/g, to: 'Write-Host ' },
  { from: /\bclear\b/g, to: 'Clear-Host' },
  { from: /\bhistory\b/g, to: 'Get-History' },
  { from: /\bman\s+(.+)/g, to: 'Get-Help $1' },
  { from: /\bkill\s+(.+)/g, to: 'Stop-Process -Id $1  # ou Stop-Process -Name nome' },
  { from: /\bkillall\s+(.+)/g, to: 'Stop-Process -Name $1' },
  { from: /\bpgrep\s+(.+)/g, to: 'Get-Process $1' },
  { from: /\bps\b/g, to: 'Get-Process' },
  { from: /\btop\b/g, to: 'Get-Process | Sort-Object CPU -Descending' },
  { from: /\bdf\s+-h\b/g, to: 'Get-Volume' },
  { from: /\bdu\s+-sh\s+(.+)/g, to: '(Get-ChildItem $1 -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB' },
  { from: /\bwc\s+-l\s+(.+)/g, to: '(Get-Content $1 | Measure-Object).Count' },
  { from: /\bsleep\s+(.+)/g, to: 'Start-Sleep -Seconds $1' },
  { from: /\benv\b/g, to: 'Get-ChildItem Env:' },
  { from: /\bexport\s+([A-Za-z_][A-Za-z0-9_]*)=(.+)/g, to: "$env:$1 = '$2'" },
  { from: /\bunset\s+([A-Za-z_][A-Za-z0-9_]*)/g, to: 'Remove-Item Env:$1' },
  { from: /\bread\s+([A-Za-z_][A-Za-z0-9_]*)/g, to: '$$env:$1 = Read-Host' },
  { from: /\btrue\b/g, to: '$true' },
  { from: /\bfalse\b/g, to: '$false' },
  { from: /\b&&\b/g, to: '; if ($?) {' },
  { from: /\b\|\|\b/g, to: '; if (-not $?) {' },
  { from: /2>\/dev\/null/g, to: '-ErrorAction SilentlyContinue' },
  { from: />\/dev\/null\s*2>&1/g, to: '| Out-Null' },
  { from: /\|\s*xargs\s+(.+)/g, to: '| ForEach-Object { $1 $$_ }' },
  { from: /\bsed\s+['"]s\/(.+?)\/(.+?)\/g['"]/g, to: '-replace "$1", "$2"' },
  { from: /\bawk\s+['"]{\s*print\s+\$1\s*}['"]/g, to: '| ForEach-Object { $$_.Split()[0] }' },
  { from: /\bawk\s+['"]{\s*print\s+\$NF\s*}['"]/g, to: '| ForEach-Object { $$_.Split()[-1] }' },
]

// PowerShell -> Bash
const PS_TO_BASH = [
  { from: /^\s*#/, to: (line) => line },
  { from: /\$env:([A-Za-z_][A-Za-z0-9_]*)/g, to: '$$$1' },
  { from: /\$\(Resolve-Path\s+([^)]+)\)/g, to: '$(readlink -f $1)' },
  { from: /\bGet-ChildItem\b/g, to: 'ls' },
  { from: /\bGet-Location\b/g, to: 'pwd' },
  { from: /\bCopy-Item\b/g, to: 'cp' },
  { from: /\bMove-Item\b/g, to: 'mv' },
  { from: /\bRemove-Item\b/g, to: 'rm' },
  { from: /\bNew-Item\s+-ItemType\s+Directory\b/g, to: 'mkdir' },
  { from: /\bNew-Item\s+-ItemType\s+File\b(?:\s+-Path\s+([^-]+)\s+-Force)?/g, to: 'touch $1' },
  { from: /\bGet-Content\b/g, to: 'cat' },
  { from: /\bSelect-String\b/g, to: 'grep' },
  { from: /\bGet-Command\b/g, to: 'which' },
  { from: /\bGet-Date\b/g, to: 'date' },
  { from: /\bWrite-Output\b/g, to: 'echo' },
  { from: /\bWrite-Host\b/g, to: 'echo' },
  { from: /\bClear-Host\b/g, to: 'clear' },
  { from: /\bGet-History\b/g, to: 'history' },
  { from: /\bGet-Help\s+(.+)/g, to: 'man $1' },
  { from: /\bStop-Process\s+-Id\s+(.+)/g, to: 'kill $1' },
  { from: /\bStop-Process\s+-Name\s+(.+)/g, to: 'killall $1' },
  { from: /\bGet-Process\b/g, to: 'ps' },
  { from: /\bGet-Volume\b/g, to: 'df -h' },
  { from: /\bStart-Sleep\s+-Seconds\s+(.+)/g, to: 'sleep $1' },
  { from: /\bGet-ChildItem\s+Env:/g, to: 'env' },
  { from: /\b\$true\b/g, to: 'true' },
  { from: /\b\$false\b/g, to: 'false' },
  { from: /\bOut-Null\b/g, to: '> /dev/null 2>&1' },
  { from: /-ErrorAction\s+SilentlyContinue/g, to: '2>/dev/null' },
  { from: /\bForEach-Object\s*\{\s*\$_\s*\}/g, to: 'xargs' },
  { from: /-replace\s+['"](.+?)['"],\s*['"](.+?)['"]/g, to: "sed 's/$1/$2/g'" },
  { from: /\|\s*Select-Object\s+-First\s+(.+)/g, to: '| head -n $1' },
  { from: /\|\s*Select-Object\s+-Last\s+(.+)/g, to: '| tail -n $1' },
  { from: /;\s*if\s*\(\s*\$\?\s*\)\s*\{/g, to: '&&' },
  { from: /;\s*if\s*\(\s*-not\s+\$\?\s*\)\s*\{/g, to: '||' },
]

function applyRules(line, rules) {
  let out = line
  for (const rule of rules) {
    if (typeof rule.to === 'function') {
      out = out.replace(rule.from, rule.to)
    } else {
      out = out.replace(rule.from, rule.to)
    }
  }
  return out
}

export function bashToPowershell(input) {
  if (!input) return { output: '', lines: 0, changed: 0 }
  const lines = input.split('\n')
  const mapped = lines.map((line) => {
    const changed = line.trim() && !line.trim().startsWith('#')
    const out = applyRules(line, BASH_TO_PS)
    return { in: line, out, changed: changed && out !== line }
  })
  return {
    output: mapped.map((m) => m.out).join('\n'),
    lines: mapped.length,
    changed: mapped.filter((m) => m.changed).length,
  }
}

export function powershellToBash(input) {
  if (!input) return { output: '', lines: 0, changed: 0 }
  const lines = input.split('\n')
  const mapped = lines.map((line) => {
    const changed = line.trim() && !line.trim().startsWith('#')
    const out = applyRules(line, PS_TO_BASH)
    return { in: line, out, changed: changed && out !== line }
  })
  return {
    output: mapped.map((m) => m.out).join('\n'),
    lines: mapped.length,
    changed: mapped.filter((m) => m.changed).length,
  }
}

// Catálogo comparativo para a tabela de referência.
export const CATALOG = [
  { category: 'file', pt: 'Listar arquivos', en: 'List files', bash: 'ls -la', ps: 'Get-ChildItem -Force' },
  { category: 'file', pt: 'Diretório atual', en: 'Current directory', bash: 'pwd', ps: 'Get-Location' },
  { category: 'file', pt: 'Copiar arquivo', en: 'Copy file', bash: 'cp origem destino', ps: 'Copy-Item origem destino' },
  { category: 'file', pt: 'Mover arquivo', en: 'Move file', bash: 'mv origem destino', ps: 'Move-Item origem destino' },
  { category: 'file', pt: 'Remover arquivo', en: 'Remove file', bash: 'rm arquivo', ps: 'Remove-Item arquivo' },
  { category: 'file', pt: 'Criar diretório', en: 'Create directory', bash: 'mkdir dir', ps: 'New-Item -ItemType Directory dir' },
  { category: 'file', pt: 'Criar arquivo vazio', en: 'Create empty file', bash: 'touch arquivo', ps: 'New-Item -ItemType File arquivo -Force' },
  { category: 'file', pt: 'Ler arquivo', en: 'Read file', bash: 'cat arquivo', ps: 'Get-Content arquivo' },
  { category: 'file', pt: 'Primeiras linhas', en: 'First lines', bash: 'head -n 10 arquivo', ps: 'Get-Content arquivo | Select-Object -First 10' },
  { category: 'file', pt: 'Últimas linhas (follow)', en: 'Tail follow', bash: 'tail -f arquivo', ps: 'Get-Content arquivo -Wait' },
  { category: 'file', pt: 'Espaço em disco', en: 'Disk space', bash: 'df -h', ps: 'Get-Volume' },
  { category: 'file', pt: 'Tamanho de diretório', en: 'Directory size', bash: 'du -sh dir', ps: '(Get-ChildItem dir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB' },
  { category: 'file', pt: 'Contar linhas', en: 'Count lines', bash: 'wc -l arquivo', ps: '(Get-Content arquivo | Measure-Object).Count' },
  { category: 'file', pt: 'Buscar recursivo', en: 'Find recursively', bash: 'find . -name "*.js"', ps: 'Get-ChildItem -Recurse -Filter "*.js"' },
  { category: 'text', pt: 'Buscar padrão', en: 'Search pattern', bash: 'grep padrão arquivo', ps: 'Select-String padrão arquivo' },
  { category: 'text', pt: 'Substituir padrão', en: 'Replace pattern', bash: "sed 's/antigo/novo/g'", ps: '-replace "antigo", "novo"' },
  { category: 'text', pt: 'Imprimir texto', en: 'Print text', bash: 'echo "oi"', ps: 'Write-Output "oi"' },
  { category: 'process', pt: 'Listar processos', en: 'List processes', bash: 'ps aux', ps: 'Get-Process' },
  { category: 'process', pt: 'Matar por PID', en: 'Kill by PID', bash: 'kill 1234', ps: 'Stop-Process -Id 1234' },
  { category: 'process', pt: 'Matar por nome', en: 'Kill by name', bash: 'killall node', ps: 'Stop-Process -Name node' },
  { category: 'env', pt: 'Ver variáveis', en: 'View variables', bash: 'env', ps: 'Get-ChildItem Env:' },
  { category: 'env', pt: 'Definir variável', en: 'Set variable', bash: 'export VAR=valor', ps: "$env:VAR = 'valor'" },
  { category: 'env', pt: 'Ler entrada', en: 'Read input', bash: 'read VAR', ps: '$env:VAR = Read-Host' },
  { category: 'env', pt: 'Localizar comando', en: 'Locate command', bash: 'which node', ps: 'Get-Command node' },
  { category: 'control', pt: 'AND lógico', en: 'Logical AND', bash: 'cmd1 && cmd2', ps: 'cmd1; if ($?) { cmd2 }' },
  { category: 'control', pt: 'OR lógico', en: 'Logical OR', bash: 'cmd1 || cmd2', ps: 'cmd1; if (-not $?) { cmd2 }' },
  { category: 'control', pt: 'Silenciar erros', en: 'Silence errors', bash: 'cmd 2>/dev/null', ps: 'cmd -ErrorAction SilentlyContinue' },
  { category: 'control', pt: 'Descartar saída', en: 'Discard output', bash: 'cmd >/dev/null 2>&1', ps: 'cmd | Out-Null' },
  { category: 'control', pt: 'Aguardar', en: 'Sleep', bash: 'sleep 5', ps: 'Start-Sleep -Seconds 5' },
  { category: 'control', pt: 'Pipeline por item', en: 'Pipeline per item', bash: '... | xargs cmd', ps: '... | ForEach-Object { cmd $_ }' },
]

export const CATEGORIES = {
  pt: { file: 'Arquivos', text: 'Texto', process: 'Processos', env: 'Ambiente', control: 'Controle' },
  en: { file: 'Files', text: 'Text', process: 'Processes', env: 'Environment', control: 'Control' },
}
