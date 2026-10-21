// Cosmetic, browser-local CODEDEX progression. Nothing here measures repository quality.
export type ExperienceLedger = Record<string, number>

export const MAX_XP = 5000
export const TRAINING_REWARD = 60
export const BATTLE_REWARD = 80

export const EVOLUTIONS = [
  { id: 'SPARK', at: 0, label: 'Spark', description: 'The adventure begins.' },
  { id: 'HATCHLING', at: 120, label: 'Hatchling', description: 'A fresh form takes shape.' },
  { id: 'EVOLVED', at: 360, label: 'Evolved', description: 'Your Codémon discovers its strengths.' },
  { id: 'ASCENDED', at: 900, label: 'Ascended', description: 'Ultimate form unlocked.' },
] as const

export function experienceFor(ledger: ExperienceLedger, fullName: string): number {
  const value = ledger[fullName]
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(MAX_XP, Math.floor(value))) : 0
}

export function stageIndex(xp: number): number {
  for (let i = EVOLUTIONS.length - 1; i >= 0; i--) {
    if (xp >= EVOLUTIONS[i].at) return i
  }
  return 0
}

export function nextEvolution(xp: number) {
  return EVOLUTIONS.find(stage => stage.at > xp) || null
}

export function trainedLevel(baseLevel: number, xp: number): number {
  // A slowly growing fictional training bonus, capped at level 100.
  return Math.min(100, Math.max(1, baseLevel + Math.floor(Math.sqrt(xp / 12))))
}

export function grantExperience(ledger: ExperienceLedger, fullName: string, reward: number): ExperienceLedger {
  if (!fullName || !Number.isFinite(reward) || reward <= 0) return ledger
  const before = experienceFor(ledger, fullName)
  const after = Math.min(MAX_XP, before + Math.floor(reward))
  return before === after ? ledger : { ...ledger, [fullName]: after }
}

export function readExperience(username: string): ExperienceLedger {
  try {
    const raw = localStorage.getItem('codedex:xp:v1:' + username.toLowerCase())
    if (!raw) return {}
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    const clean: ExperienceLedger = {}
    for (const [name, xp] of Object.entries(value)) {
      if (name.length < 250 && typeof xp === 'number' && Number.isFinite(xp) && xp >= 0) {
        clean[name] = Math.min(MAX_XP, Math.floor(xp))
      }
    }
    return clean
  } catch {
    return {}
  }
}

export function saveExperience(username: string, ledger: ExperienceLedger): void {
  try { localStorage.setItem('codedex:xp:v1:' + username.toLowerCase(), JSON.stringify(ledger)) }
  catch { /* Storage permission or quota may be unavailable. Game continues in memory. */ }
}
