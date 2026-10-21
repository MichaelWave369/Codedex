import { useEffect, useId, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import './splash-squad.css'

type SquadRepo = {
  id: number
  full_name: string
  name: string
  language: string | null
}
type Props = {
  username: string
  repos: SquadRepo[]
  favorites: string[]
  onInspect: (fullName: string) => void
}
const CREW = [
  { name: 'BLOOP.EXE', role: 'CAPTAIN', ability: 'Wave Compiler', color: '#77deff', shape: 0, lore: 'Leads the squad with curiosity, chaos and a steady stream of bubbles.' },
  { name: 'RIPPLEBYTE', role: 'SCOUT', ability: 'Packet Surf', color: '#92bbff', shape: 1, lore: 'Never met a network it could not splash through.' },
  { name: 'CORALPATCH', role: 'HEALER', ability: 'Patch Pool', color: '#ffa3c7', shape: 2, lore: 'Fixes broken builds before anybody notices.' },
  { name: 'DRIFTLET', role: 'GUARDIAN', ability: 'Buffer Bubble', color: '#7cefd7', shape: 3, lore: 'Very calm. Usually still buffering.' },
  { name: 'TIDALINK', role: 'ARCHITECT', ability: 'Current Control', color: '#c4b5ff', shape: 4, lore: 'Connects the whole ocean with duct tape and APIs.' },
] as const

const KEY = 'codedex:splash-squad:v1:'
function load(username: string): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY + username.toLowerCase()) || '[]')
    if (Array.isArray(data)) return Array.from({ length: CREW.length }, (_, i) => typeof data[i] === 'string' ? data[i] : '')
  } catch { /* Browser storage is optional. */ }
  return Array(CREW.length).fill('') as string[]
}

function Mascot({ index, recruited, active }: { index: number; recruited: boolean; active: boolean }) {
  const member = CREW[index]
  const id = useId().replace(/:/g, '')
  return <svg className={'splash-mascot ' + (active ? 'is-active' : '')}
    viewBox="0 0 210 200" role="img" aria-label={member.name + ', original aquatic code creature'}>
    <defs><radialGradient id={'sea-' + id} cx="32%" cy="24%" r="76%">
      <stop stopColor="white" stopOpacity=".88"/>
      <stop offset=".26" stopColor={member.color}/>
      <stop offset="1" stopColor={member.color} stopOpacity=".6"/>
    </radialGradient></defs>
    <ellipse cx="105" cy="184" rx="59" ry="8" fill={member.color} opacity=".2"/>
    <circle cx="34" cy="55" r="6" fill={member.color} opacity=".46"/>
    <circle cx="183" cy="70" r="9" fill={member.color} opacity=".24"/>
    {member.shape === 0 && <path d="M80 67 89 25 105 48 124 25 134 67" stroke={member.color} strokeWidth="7" fill={member.color} strokeLinejoin="round"/>}
    {member.shape === 1 && <path d="M58 95 16 67 25 137 61 143M152 95 194 67 185 137 149 143" fill={member.color} opacity=".73" stroke={member.color} strokeWidth="3"/>}
    {member.shape === 2 && <g stroke={member.color} strokeWidth="10" strokeLinecap="round"><path d="M75 65 54 33 44 18 M57 36 72 14 M135 65 155 33 173 17 M153 37 139 13"/></g>}
    {member.shape === 3 && <><ellipse cx="55" cy="93" rx="23" ry="39" transform="rotate(-27 55 93)" fill={member.color} opacity=".7"/><ellipse cx="155" cy="93" rx="23" ry="39" transform="rotate(27 155 93)" fill={member.color} opacity=".7"/></>}
    {member.shape === 4 && <><path d="M85 59 78 25 112 42 136 18 130 61" fill={member.color} stroke={member.color} strokeWidth="4"/><circle cx="78" cy="23" r="7" fill="#fff"/><circle cx="137" cy="18" r="6" fill="#fff"/></>}
    <path d="M105 48C143 45 170 73 170 114C170 150 145 170 105 171C65 170 40 150 40 114C40 73 66 45 105 48Z" fill={'url(#sea-' + id + ')'} stroke={member.color} strokeWidth="3"/>
    <path d="M42 109 24 124 M168 109 187 124 M77 162 69 177 M134 162 143 177" fill="none" stroke={member.color} strokeWidth="9" strokeLinecap="round"/>
    <ellipse cx="80" cy="83" rx="22" ry="11" fill="white" opacity=".22" transform="rotate(-30 80 83)"/>
    <ellipse cx="83" cy="114" rx="11" ry="13" fill="#152840"/><ellipse cx="129" cy="114" rx="11" ry="13" fill="#152840"/>
    <circle cx="88" cy="109" r="4" fill="white"/><circle cx="134" cy="109" r="4" fill="white"/>
    <path d={member.shape === 3 ? 'M98 140 H115' : 'M95 139Q106 152 119 139'} fill="none" stroke="#152840" strokeWidth="4" strokeLinecap="round"/>
    <ellipse cx="65" cy="136" rx="10" ry="5" fill="#f88fb1" opacity=".4"/><ellipse cx="149" cy="136" rx="10" ry="5" fill="#f88fb1" opacity=".4"/>
    {recruited && <path d="m185 23 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" fill="#ffefbb"/>}
  </svg>
}

export default function SplashSquad({ username, repos, favorites, onInspect }: Props) {
  const [slots, setSlots] = useState<string[]>(() => load(username))
  const [formation, setFormation] = useState(false)
  const [shouts, setShouts] = useState(0)
  const repoMap = useMemo(() => new Map(repos.map(repo => [repo.full_name, repo])), [repos])
  const assigned = slots.map(name => repoMap.get(name))
  const activeCount = assigned.filter(Boolean).length
  const languageCount = new Set(assigned.filter(Boolean).map(repo => repo?.language || 'other')).size
  const charge = activeCount * 20
  const combo = activeCount === 5 ? (languageCount >= 3 ? 'FULL TIDAL COMBO' : 'FIVE-STACK WAVE') :
    activeCount >= 3 ? 'RISING CURRENT' : activeCount ? 'FIRST RIPPLE' : 'AWAITING CREW'

  useEffect(() => {
    try { localStorage.setItem(KEY + username.toLowerCase(), JSON.stringify(slots)) }
    catch { /* Storage optional. */ }
  }, [slots, username])

  function assign(index: number, name: string) {
    setSlots(current => current.map((value, i) => i === index ? name : (name && value === name ? '' : value)))
    setFormation(false)
  }
  function autoRecruit() {
    const prioritized = [...repos.filter(repo => favorites.includes(repo.full_name)), ...repos.filter(repo => !favorites.includes(repo.full_name))]
    setSlots(Array.from({ length: CREW.length }, (_, i) => prioritized[i]?.full_name || ''))
    setFormation(false)
  }

  return <section id="splash-squad" className={'splash-section ' + (formation ? 'splash-formation-on' : '')} aria-labelledby="splash-heading">
    <div className="splash-heading">
      <div>
        <div className="tiny-heading">ORIGINAL AQUATIC CREATURES · NOSTALGIA MODE · CREW 001</div>
        <h2 id="splash-heading">THE <span>SPLASH SQUAD</span> ≈</h2>
        <p>One legendary shout. Five chaotic little code creatures. Recruit real repos into their crew slots and activate their formation.</p>
      </div>
      <div className="splash-shout">
        <small>ORIGIN SIGNAL</small><strong>{shouts ? 'SQUIRTLE!!' : 'STANDBY...'}</strong>
        <button type="button" onClick={() => setShouts(n => n + 1)}>SHOUT SQUIRTLE! ↗</button>
      </div>
    </div>
    <div className="splash-toolbar">
      <div className="splash-energy">
        <div><span>SQUAD CHARGE</span><strong>{charge}%</strong></div>
        <div className="splash-meter" role="progressbar" aria-label="Squad charge" aria-valuemin={0} aria-valuemax={100} aria-valuenow={charge}><span style={{ width: charge + '%' }}/></div>
        <small>{activeCount}/5 REPOSITORIES LINKED · {combo}</small>
      </div>
      <div className="splash-toolbar-actions">
        <button type="button" disabled={!repos.length} onClick={autoRecruit}>↻ AUTO-RECRUIT</button>
        <button type="button" disabled={!slots.some(Boolean)} onClick={() => { setSlots(Array(CREW.length).fill('') as string[]); setFormation(false) }}>CLEAR TEAM</button>
      </div>
    </div>
    <div className="splash-crew">
      {CREW.map((member, index) => {
        const repo = assigned[index]
        return <article key={member.name} className={'splash-member ' + (repo ? 'recruited' : '')}
          style={{ '--crew-color': member.color } as CSSProperties}>
          <div className="splash-member-top"><span>MEMBER {String(index + 1).padStart(2, '0')}</span><span>{member.role}</span></div>
          <div className="splash-art"><Mascot index={index} recruited={Boolean(repo)} active={formation && Boolean(repo)}/></div>
          <h3>{member.name}</h3><p>{member.lore}</p>
          <div className="splash-move"><small>SIGNATURE MOVE</small><strong>{member.ability}</strong></div>
          <label htmlFor={'crew-slot-' + index}>LINK PUBLIC REPO</label>
          <select id={'crew-slot-' + index} value={slots[index]} onChange={e => assign(index, e.target.value)}>
            <option value="">— EMPTY SLOT —</option>
            {slots[index] && !repoMap.has(slots[index]) && <option value={slots[index]}>Unavailable repo</option>}
            {repos.map(candidate => <option key={candidate.id} value={candidate.full_name}
              disabled={slots.some((name, slotIndex) => slotIndex !== index && name === candidate.full_name)}>{candidate.name}</option>)}
          </select>
          <div className="splash-linked">{repo ? <button type="button" onClick={() => onInspect(repo.full_name)}>↗ {repo.name}</button> :
            <span>{slots[index] ? 'Not in this public collection' : 'AWAITING ASSIGNMENT'}</span>}</div>
        </article>
      })}
    </div>
    <div className="splash-footer">
      <div><strong>{activeCount === 5 ? 'THE SQUAD IS COMPLETE!' : 'THE GANG IS ASSEMBLING...'}</strong>
        <p>Fill five unique slots to activate formation. Your squad is saved locally for @{username}.</p></div>
      <button type="button" disabled={activeCount < 5} onClick={() => setFormation(value => !value)}>
        {formation ? '◈ FORMATION ACTIVE' : '◈ ACTIVATE FORMATION'} ↗
      </button>
    </div>
    <div className="splash-status" role="status" aria-live="polite">
      {shouts ? 'SQUIRTLE! SQUIRTLE! · ORIGIN SIGNAL RECEIVED × ' + shouts : 'ORIGINAL FAN-INSPIRED TRIBUTE · NO OFFICIAL POKÉMON ART OR CHARACTERS'}
      {formation ? ' · TIDAL FORMATION ONLINE' : ''}
    </div>
  </section>
}
