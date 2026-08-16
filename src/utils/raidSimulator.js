// Simulador de RAID - 100% client-side
// Visualiza a distribuicao de blocos em discos e calcula metricas dos niveis RAID mais comuns.

export const RAID_LEVELS = {
  RAID0: 'RAID0',
  RAID1: 'RAID1',
  RAID5: 'RAID5',
  RAID6: 'RAID6',
  RAID10: 'RAID10',
}

export const RAID_CONFIG = {
  [RAID_LEVELS.RAID0]: {
    minDisks: 2,
    parityDisks: 0,
    faultTolerance: 0,
    readPenalty: 1,
    writePenalty: 1,
    descriptionPt: 'Striping: dados distribuidos entre todos os discos. Maxima performance, nenhuma redundancia.',
    descriptionEn: 'Striping: data spread across all disks. Maximum performance, no redundancy.',
  },
  [RAID_LEVELS.RAID1]: {
    minDisks: 2,
    parityDisks: 0,
    faultTolerance: 1,
    readPenalty: 1,
    writePenalty: 2,
    descriptionPt: 'Mirroring: cada dado e copiado em pelo menos 2 discos. Alta redundancia, capacidade pela metade.',
    descriptionEn: 'Mirroring: every block is copied to at least 2 disks. High redundancy, half the capacity.',
  },
  [RAID_LEVELS.RAID5]: {
    minDisks: 3,
    parityDisks: 1,
    faultTolerance: 1,
    readPenalty: 1,
    writePenalty: 4,
    descriptionPt: 'Striping com paridade distribuida: tolera 1 disco falho, penalidade de escrita maior por causa da paridade.',
    descriptionEn: 'Striping with distributed parity: tolerates 1 disk failure, higher write penalty due to parity.',
  },
  [RAID_LEVELS.RAID6]: {
    minDisks: 4,
    parityDisks: 2,
    faultTolerance: 2,
    readPenalty: 1,
    writePenalty: 6,
    descriptionPt: 'Striping com paridade dupla: tolera 2 discos falhos simultaneos, ainda mais penalidade de escrita.',
    descriptionEn: 'Striping with dual parity: tolerates 2 simultaneous disk failures, even higher write penalty.',
  },
  [RAID_LEVELS.RAID10]: {
    minDisks: 4,
    parityDisks: 0,
    faultTolerance: 1,
    faultToleranceMax: 'grupos',
    readPenalty: 1,
    writePenalty: 2,
    descriptionPt: 'RAID 1+0: stripes sobre mirrors. Boa performance e redundancia, mas ocupa metade da capacidade.',
    descriptionEn: 'RAID 1+0: stripes over mirrors. Good performance and redundancy, but uses half the capacity.',
  },
}

export function validateRaidInput(level, diskCount, diskSize) {
  const cfg = RAID_CONFIG[level]
  const errors = []
  if (!cfg) {
    errors.push('Nivel RAID invalido / Invalid RAID level')
    return { valid: false, errors }
  }
  if (Number.isNaN(diskCount) || diskCount < cfg.minDisks) {
    errors.push(`Minimo de ${cfg.minDisks} discos / Minimum ${cfg.minDisks} disks`)
  }
  if (Number.isNaN(diskSize) || diskSize <= 0) {
    errors.push('Tamanho do disco deve ser positivo / Disk size must be positive')
  }
  if (level === RAID_LEVELS.RAID10 && diskCount % 2 !== 0) {
    errors.push('RAID 10 precisa de numero par de discos / RAID 10 requires an even number of disks')
  }
  return { valid: errors.length === 0, errors }
}

export function calculateCapacity(level, diskCount, diskSize) {
  switch (level) {
    case RAID_LEVELS.RAID0:
      return diskCount * diskSize
    case RAID_LEVELS.RAID1:
      return diskSize
    case RAID_LEVELS.RAID5:
      return (diskCount - 1) * diskSize
    case RAID_LEVELS.RAID6:
      return (diskCount - 2) * diskSize
    case RAID_LEVELS.RAID10:
      return (diskCount / 2) * diskSize
    default:
      return 0
  }
}

export function calculateFaultTolerance(level, diskCount) {
  const cfg = RAID_CONFIG[level]
  if (level === RAID_LEVELS.RAID10) {
    // Cada mirror tem 2 discos; o pior caso e perder 1 de cada mirror, mas
    // matematicamente podemos perder ate diskCount/2 discos se cada falha
    // estiver em um mirror diferente. O minimo garantido e 1.
    return {
      guaranteed: 1,
      bestCase: diskCount / 2,
    }
  }
  return { guaranteed: cfg.faultTolerance, bestCase: cfg.faultTolerance }
}

function nextParityDiskRAID5(blockIndex, diskCount) {
  return blockIndex % diskCount
}

function nextParityDisksRAID6(blockIndex, diskCount) {
  const p = blockIndex % diskCount
  const q = (blockIndex + 1) % diskCount
  return [p, q]
}

export function distributeBlocks(level, diskCount, blockCount, failedDisks = []) {
  const disks = Array.from({ length: diskCount }, () => ({
    blocks: [],
    parityCount: 0,
    dataCount: 0,
  }))

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
    switch (level) {
      case RAID_LEVELS.RAID0: {
        const disk = blockIndex % diskCount
        disks[disk].blocks.push({ type: 'data', index: blockIndex })
        disks[disk].dataCount += 1
        break
      }
      case RAID_LEVELS.RAID1: {
        for (let d = 0; d < diskCount; d += 1) {
          disks[d].blocks.push({ type: 'data', index: blockIndex })
          disks[d].dataCount += 1
        }
        break
      }
      case RAID_LEVELS.RAID5: {
        const parityDisk = nextParityDiskRAID5(blockIndex, diskCount)
        for (let d = 0; d < diskCount; d += 1) {
          if (d === parityDisk) {
            disks[d].blocks.push({ type: 'parity', index: blockIndex })
            disks[d].parityCount += 1
          } else {
            disks[d].blocks.push({ type: 'data', index: blockIndex })
            disks[d].dataCount += 1
          }
        }
        break
      }
      case RAID_LEVELS.RAID6: {
        const parityDisks = nextParityDisksRAID6(blockIndex, diskCount)
        for (let d = 0; d < diskCount; d += 1) {
          if (parityDisks.includes(d)) {
            disks[d].blocks.push({ type: 'parity', index: blockIndex })
            disks[d].parityCount += 1
          } else {
            disks[d].blocks.push({ type: 'data', index: blockIndex })
            disks[d].dataCount += 1
          }
        }
        break
      }
      case RAID_LEVELS.RAID10: {
        const groupSize = 2
        const groupIndex = Math.floor(blockIndex / (diskCount / 2))
        const stripeIndex = blockIndex % (diskCount / 2)
        const primary = stripeIndex * groupSize
        const secondary = stripeIndex * groupSize + 1
        for (let d = 0; d < diskCount; d += 1) {
          if (d === primary || d === secondary) {
            disks[d].blocks.push({ type: 'data', index: blockIndex })
            disks[d].dataCount += 1
          } else {
            disks[d].blocks.push({ type: 'empty', index: null })
          }
        }
        break
      }
      default:
        break
    }
  }

  return disks.map((d, idx) => ({
    ...d,
    failed: failedDisks.includes(idx),
  }))
}

export function isDataLost(level, failedDisks, diskCount) {
  if (failedDisks.length === 0) return false
  const cfg = RAID_CONFIG[level]

  if (level === RAID_LEVELS.RAID0) {
    return failedDisks.length > 0
  }

  if (level === RAID_LEVELS.RAID1) {
    return failedDisks.length >= diskCount
  }

  if (level === RAID_LEVELS.RAID5) {
    return failedDisks.length >= 2
  }

  if (level === RAID_LEVELS.RAID6) {
    return failedDisks.length >= 3
  }

  if (level === RAID_LEVELS.RAID10) {
    const groups = diskCount / 2
    for (let g = 0; g < groups; g += 1) {
      const primary = g * 2
      const secondary = g * 2 + 1
      if (failedDisks.includes(primary) && failedDisks.includes(secondary)) {
        return true
      }
    }
    return false
  }

  return failedDisks.length > cfg.faultTolerance
}

export function calculateMetrics(level, diskCount, diskSize, failedDisks = []) {
  const capacity = calculateCapacity(level, diskCount, diskSize)
  const rawCapacity = diskCount * diskSize
  const efficiency = rawCapacity > 0 ? capacity / rawCapacity : 0
  const faultTolerance = calculateFaultTolerance(level, diskCount)
  const dataLost = isDataLost(level, failedDisks, diskCount)
  const degraded = failedDisks.length > 0 && !dataLost

  return {
    capacity,
    rawCapacity,
    efficiency,
    faultTolerance,
    dataLost,
    degraded,
    failedCount: failedDisks.length,
  }
}

export const PRESETS = {
  '4x1TB-RAID0': { level: RAID_LEVELS.RAID0, diskCount: 4, diskSize: 1000, blockCount: 12 },
  '2x1TB-RAID1': { level: RAID_LEVELS.RAID1, diskCount: 2, diskSize: 1000, blockCount: 8 },
  '4x1TB-RAID5': { level: RAID_LEVELS.RAID5, diskCount: 4, diskSize: 1000, blockCount: 12 },
  '6x2TB-RAID6': { level: RAID_LEVELS.RAID6, diskCount: 6, diskSize: 2000, blockCount: 12 },
  '4x1TB-RAID10': { level: RAID_LEVELS.RAID10, diskCount: 4, diskSize: 1000, blockCount: 8 },
}

export const sourceCode = `export const RAID_LEVELS = {
  RAID0: 'RAID0',
  RAID1: 'RAID1',
  RAID5: 'RAID5',
  RAID6: 'RAID6',
  RAID10: 'RAID10',
}

export const RAID_CONFIG = {
  [RAID_LEVELS.RAID0]: { minDisks: 2, parityDisks: 0, faultTolerance: 0 },
  [RAID_LEVELS.RAID1]: { minDisks: 2, parityDisks: 0, faultTolerance: 1 },
  [RAID_LEVELS.RAID5]: { minDisks: 3, parityDisks: 1, faultTolerance: 1 },
  [RAID_LEVELS.RAID6]: { minDisks: 4, parityDisks: 2, faultTolerance: 2 },
  [RAID_LEVELS.RAID10]: { minDisks: 4, parityDisks: 0, faultTolerance: 1 },
}

export function calculateCapacity(level, diskCount, diskSize) {
  switch (level) {
    case RAID_LEVELS.RAID0: return diskCount * diskSize
    case RAID_LEVELS.RAID1: return diskSize
    case RAID_LEVELS.RAID5: return (diskCount - 1) * diskSize
    case RAID_LEVELS.RAID6: return (diskCount - 2) * diskSize
    case RAID_LEVELS.RAID10: return (diskCount / 2) * diskSize
    default: return 0
  }
}

function nextParityDiskRAID5(blockIndex, diskCount) {
  return blockIndex % diskCount
}

export function distributeBlocks(level, diskCount, blockCount) {
  const disks = Array.from({ length: diskCount }, () => [])
  for (let i = 0; i < blockCount; i += 1) {
    if (level === RAID_LEVELS.RAID0) {
      disks[i % diskCount].push({ type: 'data', index: i })
    } else if (level === RAID_LEVELS.RAID5) {
      const parity = nextParityDiskRAID5(i, diskCount)
      for (let d = 0; d < diskCount; d += 1) {
        disks[d].push({ type: d === parity ? 'parity' : 'data', index: i })
      }
    }
  }
  return disks
}
`
