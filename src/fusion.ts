/**
 * CODEDEX Fusion Lab: deterministic, offline, fictional repo recombination.
 * No model calls, repository modifications, or external analytics.
 */
export type FusionKind = 'MIND' | 'ARCADE' | 'ECHO' | 'PRISM' | 'COSMOS' | 'SHIELD' | 'FORGE' | 'WEB'

export type FusionParent = {
  full_name: string
  name: string
  description: string | null
  language: string | null
  html_url: string
  kind: FusionKind
}

export type FusionRecipe = {
  id: string
  generation: number
  createdAt: string
  parents: [FusionParent, FusionParent]
  title: string
  codename: string
  tagline: string
  premise: string
  blend: string
  capabilities: [string, string]
  mvp: string[]
  acceptance: string[]
  nextQuest: string
  element: FusionKind
  dna: number
}

const STORAGE_PREFIX = 'codedex:fusion:v1:'
export const MAX_FUSIONS = 60

export const ELEMENTS: Record<FusionKind, {
  label: string
  color: string
  gift: string
  mechanism: string
  milestone: string
}> = {
  MIND: {
    label: 'Mind', color: '#bba7ff', gift: 'interpreting ambiguous inputs and automating decisions',
    mechanism: 'an inspectable decision trace', milestone: 'Show which input caused each recommendation',
  },
  ARCADE: {
    label: 'Arcade', color: '#ff98ac', gift: 'interactive challenges, progression and feedback',
    mechanism: 'a playable challenge loop', milestone: 'Finish one complete playable round with a visible outcome',
  },
  ECHO: {
    label: 'Echo', color: '#ffe08d', gift: 'rhythm, audio signals and expressive sound',
    mechanism: 'a timeline of audio cues', milestone: 'Preview and export one repeatable audio sequence',
  },
  PRISM: {
    label: 'Prism', color: '#f6a5ed', gift: 'visual composition and procedural artwork',
    mechanism: 'a layered, editable visual canvas', milestone: 'Edit a composition and export its result',
  },
  COSMOS: {
    label: 'Cosmos', color: '#99b4ff', gift: 'models, hypotheses and exploratory experiments',
    mechanism: 'a repeatable experiment notebook', milestone: 'Re-run the same input and compare outcomes',
  },
  SHIELD: {
    label: 'Shield', color: '#8de9d0', gift: 'privacy, resilience and protective boundaries',
    mechanism: 'a local security audit trail', milestone: 'Explain a rejected or accepted input without leaking secrets',
  },
  FORGE: {
    label: 'Forge', color: '#ffc08c', gift: 'reusable tools, build steps and developer workflows',
    mechanism: 'a modular build pipeline', milestone: 'Run a multi-step build on a sample project with clear diagnostics',
  },
  WEB: {
    label: 'Web', color: '#94e7ff', gift: 'publishing and accessible web experiences',
    mechanism: 'a responsive interactive dashboard', milestone: 'Complete the main workflow on keyboard and mobile',
  },
}

type PairVariant = { target: string; twist: string; audience: string }
const SPECIAL: Record<string, PairVariant> = {
  'ARCADE+MIND': { target: 'an explainable agent-training game', twist: 'decisions become quests and each choice produces a replayable explanation', audience: 'curious developers' },
  'ARCADE+ECHO': { target: 'a beat-reactive arcade studio', twist: 'audio events shape the gameplay rather than just the soundtrack', audience: 'music makers and players' },
  'ARCADE+PRISM': { target: 'a playable generative-art exhibition', twist: 'each movement edits the canvas while earning challenges', audience: 'visual creators' },
  'ARCADE+COSMOS': { target: 'a research puzzle arcade', twist: 'hypotheses become playable scenarios with explicit pass/fail rules', audience: 'experimenters' },
  'ECHO+MIND': { target: 'an inspectable audio co-pilot', twist: 'audio decisions are explained and can be overridden', audience: 'musicians and sound designers' },
  'MIND+PRISM': { target: 'an explainable visual prototyping companion', twist: 'each generated layout retains an editable reasoning trail', audience: 'designers and builders' },
  'COSMOS+MIND': { target: 'an experiment-driven agent observatory', twist: 'a hypothesis and its falsification test travel with every suggestion', audience: 'AI researchers' },
  'FORGE+MIND': { target: 'a transparent agent build workbench', twist: 'agents recommend steps but never execute without an explicit local action', audience: 'open-source developers' },
  'FORGE+PRISM': { target: 'a procedural asset assembly bench', twist: 'art layers and build steps share a reversible recipe', audience: 'toolmakers and artists' },
  'ECHO+PRISM': { target: 'a visual sound sculpture studio', twist: 'sound parameters drive editable on-screen structures', audience: 'digital musicians' },
  'COSMOS+PRISM': { target: 'a visual simulation notebook', twist: 'interactive models become inspectable diagrams', audience: 'students and researchers' },
  'SHIELD+WEB': { target: 'a privacy-first public workspace', twist: 'every published view shows exactly which data is shared', audience: 'community builders' },
  'FORGE+SHIELD': { target: 'a reproducible build-integrity dashboard', twist: 'each tool stage emits a signed-off verification checklist', audience: 'maintainers' },
  'COSMOS+SHIELD': { target: 'a trust-aware research ledger', twist: 'every claim records provenance and the tests that would challenge it', audience: 'independent researchers' },
  'ECHO+WEB': { target: 'an accessible audio atlas', twist: 'interactive sound collections are browsable from any device', audience: 'listeners and curators' },
}

export function fusionHash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619)
  return h >>> 0
}

function safeStem(name: string): string {
  const simplified = name.replace(/[^a-z0-9]+/gi, ' ').trim()
  const words = simplified.split(/\s+/).filter(Boolean)
  return (words.length > 1 ? words[0] : simplified).replace(/[^a-z0-9]/gi, '').slice(0, 16) || 'Code'
}

function namePiece(name: string, position: 'start' | 'end'): string {
  const text = safeStem(name)
  return position === 'start' ? text.slice(0, Math.max(3, Math.ceil(text.length * 0.55))) : text.slice(Math.max(0, Math.floor(text.length * 0.45)))
}

const SUFFIXES = ['Lab', 'Works', 'Garden', 'Engine', 'Station', 'Arcade', 'Studio', 'Field', 'Foundry'] as const
const QUESTS = [
  'Prove the core interaction with one fixture before adding network services.',
  'Interview two intended users and record where they get stuck.',
  'Design a reversible import/export format before expanding the feature list.',
  'Add a second sample case that should fail, and document the expected failure.',
  'Build an accessible, keyboard-driven vertical slice before polishing effects.',
] as const

function canonicalPair(a: FusionParent, b: FusionParent) {
  return [a.kind, b.kind].sort().join('+')
}

export function fuse(a: FusionParent, b: FusionParent, generation = 0, createdAt = new Date().toISOString()): FusionRecipe {
  if (a.full_name === b.full_name) throw new Error('Choose two different repositories to fuse.')
  const step = Math.max(0, Math.floor(generation))
  const dna = fusionHash([a.full_name, b.full_name, step].join('|'))
  const flavor = SPECIAL[canonicalPair(a, b)]
  const left = ELEMENTS[a.kind]
  const right = ELEMENTS[b.kind]
  const suffix = SUFFIXES[(dna + step) % SUFFIXES.length]
  const codename = namePiece(a.name, 'start') + namePiece(b.name, 'end')
  const title = codename + ' ' + suffix
  const element: FusionKind = (dna % 2 === 0 ? a.kind : b.kind)
  const target = flavor?.target || ('a local-first ' + left.label.toLowerCase() + ' × ' + right.label.toLowerCase() + ' creation space')
  const audience = flavor?.audience || 'independent makers'
  const twist = flavor?.twist || ('the ' + left.mechanism + ' feeds directly into ' + right.mechanism)
  const intents = [
    'Preserve useful parts of both ideas without silently coupling either original repository.',
    'Turn two independent capabilities into a simple, repeatable workflow.',
    'Make the output inspectable and portable without requiring an account.',
    'Keep the experiment reproducible and easy to fork or extend.',
  ]
  const premise = 'Build ' + target + ' for ' + audience + '. ' + twist.charAt(0).toUpperCase() + twist.slice(1) + '.'
  const intro = (parent: FusionParent) => (parent.description || 'No public description provided').trim().slice(0, 180)
  const blend = a.name + ' (' + intro(a) + ') inspires ' + left.gift +
    '; ' + b.name + ' (' + intro(b) + ') inspires ' + right.gift + '.'
  return {
    id: a.full_name + '|' + b.full_name + '|' + step,
    generation: step,
    createdAt,
    parents: [a, b],
    title,
    codename,
    tagline: ['Two repos. One new species.', 'Build the unlikely connection.', 'A fresh branch of imagination.', 'Different roots, shared adventure.'][(dna + 3) % 4],
    premise,
    blend,
    capabilities: [left.mechanism, right.mechanism],
    mvp: [
      'Define the smallest shared input and output between ' + a.name + ' and ' + b.name + '.',
      'Prototype ' + left.mechanism + ' with a tiny, static fixture.',
      'Connect it to ' + right.mechanism + ' in a single end-to-end screen.',
      'Add save, reset and portable JSON export for the combined session.',
      intents[(dna + 1) % intents.length],
    ],
    acceptance: [
      left.milestone + '.',
      right.milestone + '.',
      'Two consecutive runs with the same fixture yield equivalent results.',
      'The initial prototype uses synthetic data and runs without credentials.',
    ],
    nextQuest: QUESTS[(dna >>> 2) % QUESTS.length],
    element,
    dna,
  }
}

export function storeFusions(username: string, collection: FusionRecipe[]) {
  try { localStorage.setItem(STORAGE_PREFIX + username.toLowerCase(), JSON.stringify(collection.slice(0, MAX_FUSIONS))) }
  catch { /* Remain useful even when storage is unavailable. */ }
}

export function loadFusions(username: string): FusionRecipe[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_PREFIX + username.toLowerCase()) || '[]')
    if (!Array.isArray(value)) return []
    return value.filter((entry): entry is FusionRecipe => {
      if (!entry || typeof entry !== 'object') return false
      const item = entry as Partial<FusionRecipe>
      return typeof item.id === 'string' && item.id.length < 700 &&
        typeof item.title === 'string' && typeof item.codename === 'string' &&
        typeof item.element === 'string' && Object.prototype.hasOwnProperty.call(ELEMENTS, item.element) &&
        typeof item.generation === 'number' && Number.isFinite(item.generation) &&
        typeof item.dna === 'number' && Number.isFinite(item.dna) &&
        Array.isArray(item.parents) && item.parents.length === 2 &&
        item.parents.every((p: unknown) => Boolean(p && typeof p === 'object' &&
          typeof (p as FusionParent).full_name === 'string' && typeof (p as FusionParent).name === 'string' &&
          typeof (p as FusionParent).kind === 'string' &&
          Object.prototype.hasOwnProperty.call(ELEMENTS, (p as FusionParent).kind))) &&
        typeof item.premise === 'string' && typeof item.blend === 'string' &&
        typeof item.tagline === 'string' && typeof item.nextQuest === 'string' &&
        Array.isArray(item.mvp) && item.mvp.every((v: unknown) => typeof v === 'string') &&
        Array.isArray(item.acceptance) && item.acceptance.every((v: unknown) => typeof v === 'string')
    }).slice(0, MAX_FUSIONS)
  } catch { return [] }
}

export function toMarkdown(recipe: FusionRecipe): string {
  const [a, b] = recipe.parents
  return [
    '# ' + recipe.title,
    '',
    '> CODEDEX Fusion Lab concept blueprint · ' + recipe.tagline,
    '',
    '**Status:** Proposed concept only. No repository created or code merged.',
    '**Generated:** ' + recipe.createdAt,
    '**Generation:** ' + (recipe.generation + 1),
    '**Element:** ' + ELEMENTS[recipe.element].label,
    '',
    '## Parent repositories',
    '',
    '- **' + a.name + '** (' + a.kind + '): ' + a.html_url,
    '- **' + b.name + '** (' + b.kind + '): ' + b.html_url,
    '',
    '## Premise',
    '',
    recipe.premise,
    '',
    '## How they combine',
    '',
    recipe.blend,
    '',
    '## MVP plan',
    '',
    ...recipe.mvp.map((item, index) => (index + 1) + '. ' + item),
    '',
    '## Acceptance checks',
    '',
    ...recipe.acceptance.map(item => '- [ ] ' + item),
    '',
    '## Next quest',
    '',
    recipe.nextQuest,
    '',
    '## Provenance & license note',
    '',
    'This is an original, deterministic concept prompt generated from public repository metadata. It does not inspect source code, verify technical compatibility, authorize reuse, or create a new project. Review license terms and technical constraints before combining actual code.',
    '',
  ].join('\n')
}
