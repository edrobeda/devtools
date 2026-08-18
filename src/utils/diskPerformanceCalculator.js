// Calculadora de performance de disco / storage — 100% client-side
//
// Estima IOPS, throughput e latência a partir das características mecânicas
// ou eletrônicas do drive, do padrão de acesso (aleatório/sequencial,
// leitura/escrita), do tamanho do bloco e da configuração RAID.

export const BLOCK_UNITS = {
  KB: 1024,
  MB: 1024 * 1024,
}

export const RAID_LEVELS = {
  0: { readFactor: (n) => n, writeFactor: (n) => n, writePenalty: 1 },
  1: { readFactor: (n) => n, writeFactor: () => 1, writePenalty: 2 },
  5: { readFactor: (n) => Math.max(1, n - 1), writeFactor: (n) => Math.max(1, n - 1) / 4, writePenalty: 4 },
  6: { readFactor: (n) => Math.max(1, n - 2), writeFactor: (n) => Math.max(1, n - 2) / 6, writePenalty: 6 },
  10: { readFactor: (n) => n, writeFactor: (n) => n / 2, writePenalty: 2 },
  50: { readFactor: (n) => Math.max(1, n - 1), writeFactor: (n) => Math.max(1, n - 1) / 4, writePenalty: 4 },
  60: { readFactor: (n) => Math.max(1, n - 2), writeFactor: (n) => Math.max(1, n - 2) / 6, writePenalty: 6 },
}

// Especificações representativas de drives comuns. Os valores são ordens de
// grandeza para dimensionamento rápido; cenários reais variam com modelo,
// firmware, fila de comandos, cache e carga de trabalho.
export const DRIVE_TYPES = {
  hdd_7200: {
    seekMs: 8.5,
    rotationalLatencyMs: 4.17, // 7200 RPM => 60 / 7200 / 2
    controllerMs: 0.5,
    sequentialMBps: 180,
    iopsHint: 75,
    label: { pt: 'HDD 7.200 RPM', en: 'HDD 7,200 RPM' },
  },
  hdd_10000: {
    seekMs: 4.0,
    rotationalLatencyMs: 3.0,
    controllerMs: 0.4,
    sequentialMBps: 220,
    iopsHint: 120,
    label: { pt: 'HDD 10.000 RPM', en: 'HDD 10,000 RPM' },
  },
  hdd_15000: {
    seekMs: 2.5,
    rotationalLatencyMs: 2.0,
    controllerMs: 0.3,
    sequentialMBps: 250,
    iopsHint: 175,
    label: { pt: 'HDD 15.000 RPM', en: 'HDD 15,000 RPM' },
  },
  sata_ssd: {
    seekMs: 0.05,
    rotationalLatencyMs: 0,
    controllerMs: 0.15,
    sequentialMBps: 550,
    iopsHint: 80_000,
    label: { pt: 'SSD SATA', en: 'SATA SSD' },
  },
  nvme_ssd: {
    seekMs: 0.01,
    rotationalLatencyMs: 0,
    controllerMs: 0.05,
    sequentialMBps: 3_500,
    iopsHint: 500_000,
    label: { pt: 'SSD NVMe', en: 'NVMe SSD' },
  },
  nvme_gen4: {
    seekMs: 0.005,
    rotationalLatencyMs: 0,
    controllerMs: 0.04,
    sequentialMBps: 7_000,
    iopsHint: 1_000_000,
    label: { pt: 'SSD NVMe Gen4', en: 'NVMe Gen4 SSD' },
  },
  custom: {
    seekMs: 0,
    rotationalLatencyMs: 0,
    controllerMs: 0,
    sequentialMBps: 0,
    iopsHint: 0,
    label: { pt: 'Personalizado', en: 'Custom' },
  },
}

export function getDriveTypes(lang = 'pt') {
  return Object.entries(DRIVE_TYPES).map(([key, value]) => ({
    ...value,
    key,
    label: value.label[lang] || value.label.pt,
  }))
}

export function getRaidLevels(lang = 'pt') {
  const labels = {
    pt: {
      0: 'RAID 0 (striping)',
      1: 'RAID 1 (mirroring)',
      5: 'RAID 5 (paridade distribuída)',
      6: 'RAID 6 (dupla paridade)',
      10: 'RAID 10 (mirror + stripe)',
      50: 'RAID 50 (striped RAID 5)',
      60: 'RAID 60 (striped RAID 6)',
    },
    en: {
      0: 'RAID 0 (striping)',
      1: 'RAID 1 (mirroring)',
      5: 'RAID 5 (distributed parity)',
      6: 'RAID 6 (dual parity)',
      10: 'RAID 10 (mirror + stripe)',
      50: 'RAID 50 (striped RAID 5)',
      60: 'RAID 60 (striped RAID 6)',
    },
  }
  return Object.keys(RAID_LEVELS).map((key) => ({
    key,
    label: labels[lang][key] || labels.pt[key],
  }))
}

export function getPresets(lang = 'pt') {
  return [
    {
      key: 'db_oltp',
      label: { pt: 'Banco OLTP (NVMe, bloco 8 KB, 70% read)', en: 'OLTP DB (NVMe, 8 KB block, 70% read)' },
      driveType: 'nvme_ssd',
      diskCount: 4,
      raidLevel: '10',
      blockSize: 8,
      blockUnit: 'KB',
      readRatio: 70,
      randomRatio: 90,
    },
    {
      key: 'web_server',
      label: { pt: 'Servidor Web (SATA SSD, bloco 16 KB, 95% read)', en: 'Web Server (SATA SSD, 16 KB block, 95% read)' },
      driveType: 'sata_ssd',
      diskCount: 2,
      raidLevel: '1',
      blockSize: 16,
      blockUnit: 'KB',
      readRatio: 95,
      randomRatio: 40,
    },
    {
      key: 'analytics',
      label: { pt: 'Analytics / DW (HDD, bloco 1 MB, 95% read)', en: 'Analytics / DW (HDD, 1 MB block, 95% read)' },
      driveType: 'hdd_7200',
      diskCount: 12,
      raidLevel: '5',
      blockSize: 1,
      blockUnit: 'MB',
      readRatio: 95,
      randomRatio: 5,
    },
    {
      key: 'file_server',
      label: { pt: 'File Server (HDD 10k, bloco 64 KB, 80% read)', en: 'File Server (HDD 10k, 64 KB block, 80% read)' },
      driveType: 'hdd_10000',
      diskCount: 8,
      raidLevel: '5',
      blockSize: 64,
      blockUnit: 'KB',
      readRatio: 80,
      randomRatio: 30,
    },
    {
      key: 'nvme_raid0',
      label: { pt: 'NVMe RAID 0 puro (4 discos, bloco 4 KB)', en: 'Raw NVMe RAID 0 (4 disks, 4 KB block)' },
      driveType: 'nvme_ssd',
      diskCount: 4,
      raidLevel: '0',
      blockSize: 4,
      blockUnit: 'KB',
      readRatio: 50,
      randomRatio: 50,
    },
  ]
}

export function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return '0'
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(digits)}B`
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(digits)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(digits)}k`
  if (Math.abs(value) >= 1) return value.toFixed(digits)
  return value.toFixed(digits)
}

// Estima IOPS de um único drive considerando a latência total para completar
// uma operação aleatória. Para acessos sequenciais, o throughput sequencial
// do drive é o gargalo em vez do IOPS.
export function estimateDriveIops(drive, blockSizeBytes) {
  const latencyMs = drive.seekMs + drive.rotationalLatencyMs + drive.controllerMs
  // Transferência do bloco (interface SATA ~ 600 MB/s, limitado pelo
  // throughput sequencial declarado do drive).
  const interfaceMBps = Math.max(drive.sequentialMBps || 1, 1)
  const transferMs = (blockSizeBytes / (1024 * 1024) / interfaceMBps) * 1000
  const totalMs = Math.max(latencyMs + transferMs, 0.001)
  return Math.round(1000 / totalMs)
}

// Aplica o fator do RAID sobre o IOPS bruto de um único drive.
// readRatio indica % de operações de leitura (0–100).
export function applyRaid(rawIops, diskCount, raidLevel, readRatio = 50) {
  const raid = RAID_LEVELS[raidLevel]
  if (!raid) return { read: rawIops, write: rawIops, mixed: rawIops }
  const readFactor = raid.readFactor(diskCount)
  const writeFactor = raid.writeFactor(diskCount)
  const readIops = Math.round(rawIops * readFactor)
  const writeIops = Math.round(rawIops * writeFactor)
  const r = readRatio / 100
  const w = 1 - r
  const mixedIops = Math.round(readIops * r + writeIops * w)
  return { read: readIops, write: writeIops, mixed: mixedIops }
}

export function throughputFromIops(iops, blockSizeBytes) {
  // MB/s = IOPS * blockSizeBytes / 1.048.576
  return (iops * blockSizeBytes) / (1024 * 1024)
}

// Throughput sequencial é limitado principalmente pela interface e pelo
// número de discos em paralelo; usamos o mínimo entre o IOPS×bloco e a
// capacidade sequencial agregada dos drives.
export function estimateSequentialThroughput(drive, diskCount, raidLevel, blockSizeBytes) {
  const rawSequential = (drive.sequentialMBps || 0) * diskCount
  const iopsLimit = throughputFromIops(estimateDriveIops(drive, blockSizeBytes) * diskCount, blockSizeBytes)
  return Math.min(rawSequential, iopsLimit)
}

// Calcula o resultado completo a partir das entradas do usuário.
export function calculateDiskPerformance({
  driveType,
  customDrive,
  diskCount,
  raidLevel,
  blockSize,
  blockUnit,
  readRatio,
  randomRatio,
}) {
  const drive = driveType === 'custom' ? customDrive : DRIVE_TYPES[driveType]
  if (!drive) return null

  const blockSizeBytes = blockSize * (BLOCK_UNITS[blockUnit] || BLOCK_UNITS.KB)
  const rawIops = estimateDriveIops(drive, blockSizeBytes)
  const raidIops = applyRaid(rawIops, Math.max(1, diskCount), raidLevel, readRatio)

  const randomReadIops = raidIops.read
  const randomWriteIops = raidIops.write
  const randomMixedIops = raidIops.mixed

  const randomReadMBps = throughputFromIops(randomReadIops, blockSizeBytes)
  const randomWriteMBps = throughputFromIops(randomWriteIops, blockSizeBytes)
  const randomMixedMBps = throughputFromIops(randomMixedIops, blockSizeBytes)

  const seqBaseMBps = estimateSequentialThroughput(drive, Math.max(1, diskCount), raidLevel, blockSizeBytes)
  const randomFactor = randomRatio / 100
  const sequentialFactor = 1 - randomFactor

  // Throughput efetivo ponderado entre padrão aleatório e sequencial.
  const effectiveReadMBps = randomReadMBps * randomFactor + seqBaseMBps * sequentialFactor * (readRatio / 100)
  const effectiveWriteMBps = randomWriteMBps * randomFactor + seqBaseMBps * sequentialFactor * (1 - readRatio / 100)
  const effectiveMixedMBps = randomMixedMBps * randomFactor + seqBaseMBps * sequentialFactor * 0.5

  // Latência estimada para uma operação aleatória no conjunto RAID.
  const latencyMs = drive.seekMs + drive.rotationalLatencyMs + drive.controllerMs
  const estimatedLatencyMs = latencyMs / Math.max(1, Math.sqrt(Math.max(1, diskCount)))

  const raid = RAID_LEVELS[raidLevel]
  const usableRatio = {
    0: 1,
    1: 1 / diskCount,
    5: (diskCount - 1) / diskCount,
    6: (diskCount - 2) / diskCount,
    10: 0.5,
    50: (diskCount - 1) / diskCount,
    60: (diskCount - 2) / diskCount,
  }[raidLevel] || 1

  return {
    drive,
    blockSizeBytes,
    rawIops,
    diskCount: Math.max(1, diskCount),
    raidLevel,
    readRatio,
    randomRatio,
    raidWritePenalty: raid?.writePenalty || 1,
    random: {
      readIops: randomReadIops,
      writeIops: randomWriteIops,
      mixedIops: randomMixedIops,
      readMBps: randomReadMBps,
      writeMBps: randomWriteMBps,
      mixedMBps: randomMixedMBps,
    },
    sequential: {
      readMBps: seqBaseMBps,
      writeMBps: seqBaseMBps,
      mixedMBps: seqBaseMBps,
    },
    effective: {
      readIops: Math.round(randomReadIops * randomFactor + (seqBaseMBps / blockSizeBytes * 1024 * 1024) * sequentialFactor * (readRatio / 100)),
      writeIops: Math.round(randomWriteIops * randomFactor + (seqBaseMBps / blockSizeBytes * 1024 * 1024) * sequentialFactor * (1 - readRatio / 100)),
      mixedIops: Math.round(randomMixedIops * randomFactor + (seqBaseMBps / blockSizeBytes * 1024 * 1024) * sequentialFactor * 0.5),
      readMBps: effectiveReadMBps,
      writeMBps: effectiveWriteMBps,
      mixedMBps: effectiveMixedMBps,
    },
    latencyMs: estimatedLatencyMs,
    usableCapacityRatio: usableRatio,
  }
}
