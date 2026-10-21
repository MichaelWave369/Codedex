import { useEffect, useId, useState } from 'react'
import type { CSSProperties } from 'react'
import './battle-arena.css'

type TypeName = 'MIND' | 'ARCADE' | 'ECHO' | 'PRISM' | 'COSMOS' | 'SHIELD' | 'FORGE' | 'WEB'
export type ArenaRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  kind: TypeName
  level: number
  stargazers_count: number
}

type Fighter = { repo: ArenaRepo; hp: number; maxHp: number; charge: number }
type Phase = 'active' | 'win' | 'loss'
type Encounter = { hero: Fighter; wild: Fighter; round: number; patches: number; phase: Phase; log: string[] }
type Move = 'pulse' | 'surge' | 'shield' | 'patch'
type RecordBook = { wins: number; losses: number; bestStreak: number; streak: number; lastWin: string | null }
type Props = { username: string; repos: ArenaRepo[]; favorites: string[]; onInspect: (fullName: string) => void }

const COLORS: Record<TypeName, string> = {
  MIND: '#b4a2ff', ARCADE: '#ff899d', ECHO: '#ffda88', PRISM: '#ff9cea',
  COSMOS: '#90afff', SHIELD: '#85e5d5', FORGE: '#f9b781', WEB: '#96e4ff'
}

// Fictional type ring, not a statement about software performance.
const STRONG_AGAINST: Record<TypeName, TypeName> = {
  MIND: 'FORGE', FORGE: 'SHIELD', SHIELD: 'WEB', WEB: 'COSMOS',
  COSMOS: 'ARCADE', ARCADE: 'ECHO', ECHO: 'PRISM', PRISM: 'MIND'
}
const EMPTY_RECORD: RecordBook = { wins: 0, losses: 0, bestStreak: 0, streak: 0, lastWin: null }
const RECORD_PREFIX = 'codedex:arena:record:v1:'
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
function hash(value: string) {
  let n = 2166136261
  for (const char of value) n = Math.imul(n ^ char.charCodeAt(0), 16777619)
  return n >>> 0
}
function loadRecord(username: string): RecordBook {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(RECORD_PREFIX + username.toLowerCase()) || 'null')
    if (data && typeof data === 'object' && 'wins' in data && 'losses' in data) {
      const entry = data as Partial<RecordBook>
      if (typeof entry.wins === 'number' && Number.isFinite(entry.wins) &&
          typeof entry.losses === 'number' && Number.isFinite(entry.losses)) {
        return {
          wins: Math.max(0, Math.floor(entry.wins)),
          losses: Math.max(0, Math.floor(entry.losses)),
          streak: Math.max(0, Math.floor(entry.streak || 0)),
          bestStreak: Math.max(0, Math.floor(entry.bestStreak || 0)),
          lastWin: typeof entry.lastWin === 'string' ? entry.lastWin : null
        }
      }
    }
  } catch { /* Storage may be disabled. */ }
  return EMPTY_RECORD
}
function freshFighter(repo: ArenaRepo): Fighter {
  const maxHp = 48 + Math.min(100, repo.level)
  return { repo, hp: maxHp, maxHp, charge: 2 }
}
function impact(source: Fighter, target: Fighter, special: boolean, round: number): { damage: number; advantage: boolean } {
  const advantage = STRONG_AGAINST[source.repo.kind] === target.repo.kind
  const weak = STRONG_AGAINST[target.repo.kind] === source.repo.kind
  const base = (special ? 15 : 9) + Math.floor(source.repo.level / (special ? 5 : 8))
  const variation = (hash(source.repo.full_name + ':' + target.repo.full_name + ':' + round) % 5) - 2
  return { damage: clamp(Math.round((base + variation) * (advantage ? 1.3 : weak ? 0.82 : 1)), 1, 60), advantage }
}
function pushLog(log: string[], ...items: string[]): string[] { return [...items, ...log].slice(0, 8) }
function advance(state: Encounter, move: Move): Encounter {
  if (state.phase !== 'active') return state
  if (move === 'surge' && state.hero.charge < 2) return state
  if (move === 'patch' && state.patches < 1) return state
  const hero = { ...state.hero }, wild = { ...state.wild }
  const round = state.round + 1
  const updates: string[] = []
  let guard = false, patches = state.patches
  if (move === 'pulse' || move === 'surge') {
    const special = move === 'surge'
    if (special) hero.charge -= 2
    else hero.charge = Math.min(3, hero.charge + 1)
    const attack = impact(hero, wild, special, round)
    wild.hp = clamp(wild.hp - attack.damage, 0, wild.maxHp)
    updates.push(hero.repo.name + (special ? ' unleashed Overclock Surge!' : ' used Code Pulse!') +
      ' −' + attack.damage + ' HP' + (attack.advantage ? ' · TYPE ADVANTAGE!' : ''))
  } else if (move === 'shield') {
    guard = true
    hero.charge = Math.min(3, hero.charge + 1)
    updates.push(hero.repo.name + ' raised a Bubble Firewall! Next hit reduced.')
  } else {
    patches -= 1
    const restored = Math.min(30, hero.maxHp - hero.hp)
    hero.hp += restored
    updates.push(hero.repo.name + ' applied Patch Kit! +' + restored + ' HP')
  }

  if (wild.hp === 0) {
    updates.push('VICTORY! The wild repository has been debugged.')
    return { hero, wild, round, patches, phase: 'win', log: pushLog(state.log, ...updates) }
  }

  const wildSurge = wild.charge >= 2 && (hash(wild.repo.full_name) + round) % 4 === 0
  const retaliation = impact(wild, hero, wildSurge, round + 37)
  if (wildSurge) wild.charge -= 2
  else wild.charge = Math.min(3, wild.charge + 1)
  const incoming = guard ? Math.max(1, Math.round(retaliation.damage * .3)) : retaliation.damage
  hero.hp = clamp(hero.hp - incoming, 0, hero.maxHp)
  updates.push('Wild ' + wild.repo.name + (wildSurge ? ' used Runtime Rush!' : ' countered with Data Strike!') +
    ' −' + incoming + ' HP' + (guard ? ' · BLOCKED' : retaliation.advantage ? ' · TYPE ADVANTAGE!' : ''))
  const phase: Phase = hero.hp === 0 ? 'loss' : 'active'
  if (phase === 'loss') updates.push('DEFEAT. Your creature needs a reboot.')
  return { hero, wild, round, patches, phase, log: pushLog(state.log, ...updates) }
}
function newEncounter(hero: ArenaRepo, wild: ArenaRepo): Encounter {
  return { hero: freshFighter(hero), wild: freshFighter(wild), round: 0, patches: 1, phase: 'active', log: [
    'A wild ' + wild.name + ' appeared! ' + hero.name + ', prepare to compile!'
  ] }
}

function FighterArt({ repo, wild }: { repo: ArenaRepo; wild?: boolean }) {
  const id = useId().replace(/:/g, '')
  const color = COLORS[repo.kind]
  const variant = hash(repo.full_name) % 4
  return <svg className={'arena-monster ' + (wild ? 'arena-wild-monster' : '')} viewBox="0 0 230 185"
    role="img" aria-label={'Original ' + repo.kind.toLowerCase() + ' code creature representing ' + repo.name}>
    <defs><radialGradient id={'f-' + id} cx="36%" cy="22%" r="75%">
      <stop stopColor="#fff" stopOpacity=".9"/><stop offset=".25" stopColor={color}/><stop offset="1" stopColor={color} stopOpacity=".55"/>
    </radialGradient></defs>
    <ellipse cx="114" cy="174" rx="63" ry="9" opacity=".23" fill={color}/>
    <circle cx="115" cy="93" r="75" stroke={color} strokeDasharray="3 11" fill="none" opacity=".3"/>
    {variant === 0 && <path d="M81 65 58 13 111 47 M145 65 175 13 121 47" fill={color} opacity=".75"/>}
    {variant === 1 && <path d="M67 88 27 42 33 118 65 123 M161 88 202 42 196 118 163 123" fill={color} opacity=".7"/>}
    {variant === 2 && <g stroke={color} strokeWidth="13" strokeLinecap="round"><path d="M92 53 84 14 M137 53 151 14"/></g>}
    {variant === 3 && <><circle cx="74" cy="42" r="24" fill={color} opacity=".6"/><circle cx="153" cy="42" r="24" fill={color} opacity=".6"/></>}
    <path d="M114 39C160 39 184 73 181 108C178 146 153 163 113 163C72 163 49 143 48 108C47 73 69 39 114 39Z" stroke={color} strokeWidth="3" fill={'url(#f-' + id + ')'}/>
    <ellipse cx="90" cy="76" rx="23" ry="11" fill="white" opacity=".21" transform="rotate(-30 90 76)"/>
    <ellipse cx="92" cy="106" rx="12" ry="14" fill="#102038"/><ellipse cx="138" cy="106" rx="12" ry="14" fill="#102038"/>
    <circle cx="96" cy="101" r="4" fill="white"/><circle cx="142" cy="101" r="4" fill="white"/>
    <path d="M105 130 Q115 141 128 130" stroke="#11243a" fill="none" strokeLinecap="round" strokeWidth="4"/>
    <path d="M61 121 44 128 M167 121 184 128 M83 155 78 170 M143 155 150 170" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"/>
  </svg>
}

function FighterPanel({ fighter, role }: { fighter: Fighter; role: 'TRAINER' | 'WILD' }) {
  const hp = Math.round((fighter.hp / fighter.maxHp) * 100)
  return <div className="arena-fighter" style={{ '--arena-ink': COLORS[fighter.repo.kind] } as CSSProperties}>
    <div className="arena-fighter-head"><span>{role} / {fighter.repo.kind}</span><span>LVL {fighter.repo.level}</span></div>
    <FighterArt repo={fighter.repo} wild={role === 'WILD'}/>
    <strong title={fighter.repo.full_name}>{fighter.repo.name}</strong>
    <div className="arena-vitals"><span>HP {fighter.hp} / {fighter.maxHp}</span><span>CHARGE {fighter.charge}/3</span></div>
    <div className="arena-hp" role="progressbar" aria-label={fighter.repo.name + ' hit points'} aria-valuemin={0} aria-valuemax={fighter.maxHp} aria-valuenow={fighter.hp}>
      <div style={{ width: hp + '%' }}/>
    </div>
  </div>
}

export default function BattleArena({ username, repos, favorites, onInspect }: Props) {
  const [selected, setSelected] = useState('')
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [record, setRecord] = useState<RecordBook>(() => loadRecord(username))
  const [arenaError, setArenaError] = useState('')
  const player = repos.find(repo => repo.full_name === selected) || repos.find(repo => favorites.includes(repo.full_name)) || repos[0]
  const possible = repos.filter(repo => repo.full_name !== player?.full_name)
  const rank = record.wins >= 25 ? 'LEGENDARY DEBUGGER' : record.wins >= 10 ? 'ELITE TRAINER' : record.wins >= 3 ? 'CODE RANGER' : 'ROOKIE BUILDER'

  useEffect(() => {
    try { localStorage.setItem(RECORD_PREFIX + username.toLowerCase(), JSON.stringify(record)) }
    catch { /* Persistence is optional. */ }
  }, [record, username])

  function encounterWild() {
    if (!player || possible.length === 0) {
      setArenaError('You need at least two public repositories to battle.')
      return
    }
    const opponent = possible[Math.floor(Math.random() * possible.length)]
    setEncounter(newEncounter(player, opponent))
    setArenaError('')
  }
  function action(move: Move) {
    if (!encounter || encounter.phase !== 'active') return
    const next = advance(encounter, move)
    setEncounter(next)
    if (next.phase === 'win') {
      setRecord(previous => {
        const streak = previous.streak + 1
        return { ...previous, wins: previous.wins + 1, streak, bestStreak: Math.max(previous.bestStreak, streak), lastWin: next.wild.repo.name }
      })
    }
    if (next.phase === 'loss') setRecord(previous => ({ ...previous, losses: previous.losses + 1, streak: 0 }))
  }

  return <section className="arena-section" id="wild-encounters" aria-labelledby="arena-title">
    <div className="arena-intro">
      <div><div className="tiny-heading">CODEDEX / CHAPTER 03 · SOLO BATTLE MODE</div>
        <h2 id="arena-title">WILD <span>ENCOUNTERS</span> ⚡</h2>
        <p>Your repositories are ready to battle. Choose a creature and face another public repo in a fictional, turn-based code clash.</p></div>
      <div className="arena-record"><small>TRAINER RECORD</small>
        <strong>{record.wins}W <span>/</span> {record.losses}L</strong>
        <span>{rank} · BEST STREAK {record.bestStreak}</span>
      </div>
    </div>

    <div className="arena-picker">
      <label htmlFor="arena-creature">YOUR CHALLENGER</label>
      <select id="arena-creature" value={player?.full_name || ''} disabled={encounter?.phase === 'active'} onChange={event => { setSelected(event.target.value); setEncounter(null) }}>
        {repos.map(repo => <option key={repo.id} value={repo.full_name}>{repo.name} · LVL {repo.level} / {repo.kind}</option>)}
      </select>
      <button type="button" onClick={encounterWild} disabled={!player || possible.length === 0}>↻ {encounter ? 'NEW WILD ENCOUNTER' : 'FIND A WILD REPO'}</button>
    </div>
    {arenaError && <p className="arena-error" role="alert">{arenaError}</p>}
    <div className="arena-field">
      <div className="arena-scanline" aria-hidden="true"/>
      {encounter ? <>
        <FighterPanel fighter={encounter.hero} role="TRAINER"/>
        <div className="arena-versus"><span>VS</span><small>ROUND {encounter.round}</small></div>
        <FighterPanel fighter={encounter.wild} role="WILD"/>
      </> : <div className="arena-standby">
        <span className="arena-orb">◈</span><h3>AWAITING FIRST ENCOUNTER</h3>
        <p>{repos.length < 2 ? 'Load a trainer with at least two public repos to begin.' : 'Pick your repo and hit FIND A WILD REPO to enter the arena.'}</p>
      </div>}
    </div>
    {encounter && <div className="arena-console">
      <div className="arena-console-head"><span>⌘ BATTLE CONSOLE</span><span>{encounter.phase === 'active' ? 'YOUR TURN' : encounter.phase === 'win' ? 'VICTORY CONFIRMED' : 'REBOOT REQUIRED'}</span></div>
      {encounter.phase === 'active' ?
        <div className="arena-moves">
          <button type="button" onClick={() => action('pulse')}><strong>⌁ CODE PULSE</strong><small>Basic hit · +1 charge</small></button>
          <button type="button" onClick={() => action('surge')} disabled={encounter.hero.charge < 2}><strong>✦ OVERCLOCK SURGE</strong><small>Strong hit · costs 2 charge</small></button>
          <button type="button" onClick={() => action('shield')}><strong>⬡ BUBBLE FIREWALL</strong><small>Block 70% · +1 charge</small></button>
          <button type="button" onClick={() => action('patch')} disabled={encounter.patches === 0}><strong>✚ PATCH KIT</strong><small>Restore up to 30 HP · once</small></button>
        </div> :
        <div className="arena-result"><strong>{encounter.phase === 'win' ? '★ YOU WON THE MATCH!' : '✕ DEFEAT · REBOOT AND RETRY'}</strong>
          <button type="button" onClick={encounterWild}>NEXT ENCOUNTER ↗</button></div>}
      <div className="arena-log" aria-live="polite" aria-atomic="false">
        {encounter.log.map((line, index) => <p key={encounter.round + ':' + index}>{index === 0 ? '› ' : '· '}{line}</p>)}
      </div>
      <div className="arena-links">
        <button type="button" onClick={() => onInspect(encounter.hero.repo.full_name)}>INSPECT CHALLENGER ↗</button>
        <button type="button" onClick={() => onInspect(encounter.wild.repo.full_name)}>INSPECT WILD REPO ↗</button>
      </div>
    </div>}
    <div className="arena-achievements" aria-label="Trainer achievements">
      {[{label:'FIRST COMPILE',threshold:1},{label:'THREE-PEAT',threshold:3},{label:'TEN PATCHES',threshold:10},{label:'MASTER BUILDER',threshold:25}].map(badge =>
        <div key={badge.label} className={record.wins >= badge.threshold ? 'earned' : ''}>
          <span>{record.wins >= badge.threshold ? '◆' : '◇'}</span>
          <strong>{badge.label}</strong><small>{badge.threshold} VICTOR{badge.threshold > 1 ? 'IES' : 'Y'}</small>
        </div>)}
    </div>
    <p className="arena-disclaimer">OFFLINE TURN RESOLUTION · PUBLIC REPO METADATA ONLY · BATTLE LEVELS, ADVANTAGES AND RANKS ARE FICTIONAL GAME RULES, NOT SOFTWARE QUALITY SCORES. WINS SAVE IN THIS BROWSER FOR @{username}.</p>
  </section>
}
