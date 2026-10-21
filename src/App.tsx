import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import SplashSquad from './SplashSquad'
import BattleArena from './BattleArena'

type Repo = {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  topics: string[]
  stargazers_count: number
  forks_count: number
  size: number
  created_at: string
  pushed_at: string | null
  archived: boolean
  fork: boolean
}

const CATEGORIES = {
  MIND:   { name: 'Mind',   color: '#af96ff', icon: '◈', move: 'Neural Burst',    cue: 'AI & autonomous systems' },
  ARCADE: { name: 'Arcade', color: '#ff7c8b', icon: '✦', move: 'Combo Breaker',   cue: 'Games & interactive worlds' },
  ECHO:   { name: 'Echo',   color: '#ffcb75', icon: '♫', move: 'Bass Drop',       cue: 'Audio & music' },
  PRISM:  { name: 'Prism',  color: '#ff8cf1', icon: '◇', move: 'Color Cascade',   cue: 'Art & creative software' },
  COSMOS: { name: 'Cosmos', color: '#8ca8ff', icon: '✧', move: 'Theory Shift',    cue: 'Research & exploration' },
  SHIELD: { name: 'Shield', color: '#7df1d4', icon: '⬡', move: 'Firewall Pulse', cue: 'Network & security' },
  FORGE:  { name: 'Forge',  color: '#f5ad75', icon: '⚒', move: 'Build Storm',    cue: 'Developer tools & engines' },
  WEB:    { name: 'Web',    color: '#8fe1ff', icon: '⌘', move: 'Deploy Dash',    cue: 'Sites & applications' },
} as const

type Kind = keyof typeof CATEGORIES
type Sort = 'recent' | 'oldest' | 'level' | 'stars' | 'name'
type Cached = { at: number; repos: Repo[] }

const MATCHERS: Array<[Kind, RegExp]> = [
  ['ECHO', /audio|music|suno|sound|mix|beat|radio|dj\b|recorder|synth|loopcatch|auralith/],
  ['ARCADE', /game|arcade|puzzle|chess|checker|domino|mahjong|fallout|wasteland|spark|phicade|common.?table|gilt.?house/],
  ['PRISM', /draw|paint|visual|design|color|blender|animation|pixel|poster|art\b|gallery|louvre|framefield|domistika|huehatch|rastaphi/],
  ['COSMOS', /physics|quantum|theory|math|research|ledger|foam|bubble|altermath|regeneration|phi.?369|ufp|nbg|atlas|mriphi/],
  ['SHIELD', /network|router|firewall|security|auth|crypto|lan\b|cat.?6|infrastructure|vault/],
  ['MIND', /agent|llm|model|brain|ai\b|intelligen|ollama|vessel|cognit|mind|phibot/],
  ['FORGE', /studio|engine|sdk|tool|build|terminal|git|compiler|bridge|worker|forge/],
]

function category(repo: Repo): Kind {
  const text = [repo.name, repo.description || '', ...(repo.topics || [])].join(' ').toLowerCase()
  return MATCHERS.find(([, rx]) => rx.test(text))?.[0] || 'WEB'
}
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}
function stats(repo: Repo) {
  const seed = hash(repo.full_name)
  const level = Math.min(100, Math.max(1, 5 + Math.floor(Math.log2(repo.size + 1) * 2.4) +
    Math.min(35, repo.stargazers_count * 2) + Math.min(15, repo.forks_count * 2)))
  const rarityRoll = seed % 100
  const rarity = rarityRoll < 4 ? 'MYTHIC' : rarityRoll < 17 ? 'EPIC' : rarityRoll < 44 ? 'RARE' : 'COMMON'
  const stage = level >= 55 ? 'ASCENDED' : level >= 32 ? 'EVOLVED' : level >= 17 ? 'HATCHLING' : 'SPARK'
  const energy = Math.min(99, 20 + (seed % 37) + Math.floor(level / 3))
  return { seed, level, rarity, stage, energy }
}
function niceDate(date: string | null) {
  return date ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown'
}
function readFavorites(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem('codedex:favorites:v1') || '[]')
    return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : []
  } catch { return [] }
}
function readCache(username: string): Cached | null {
  try {
    const raw = localStorage.getItem('codedex:cache:v1:' + username.toLowerCase())
    const obj = raw ? JSON.parse(raw) as Cached : null
    return obj && typeof obj.at === 'number' && Array.isArray(obj.repos) ? obj : null
  } catch { return null }
}
async function fetchAll(username: string, signal: AbortSignal): Promise<Repo[]> {
  const found: Repo[] = []
  for (let page = 1; page <= 10; page++) {
    const url = 'https://api.github.com/users/' + encodeURIComponent(username) +
      '/repos?per_page=100&page=' + page + '&sort=created&direction=desc&type=owner'
    const response = await fetch(url, { signal, headers: { Accept: 'application/vnd.github+json' } })
    if (response.status === 404) throw new Error('GitHub user not found. Check the username.')
    if (response.status === 403 || response.status === 429) throw new Error('GitHub API limit reached. Try again later, or use your locally cached dex.')
    if (!response.ok) throw new Error('GitHub returned HTTP ' + response.status + '.')
    const batch: Repo[] = await response.json()
    if (!Array.isArray(batch)) throw new Error('Unexpected response from GitHub.')
    found.push(...batch.filter((r) => r && typeof r.id === 'number' && typeof r.name === 'string'))
    if (batch.length < 100) break
  }
  return found
}

function Sprite({ repo, big = false }: { repo: Repo; big?: boolean }) {
  const kind = category(repo)
  const color = CATEGORIES[kind].color
  const { seed, rarity } = stats(repo)
  const shape = seed % 4
  const id = useId().replace(/:/g, '')
  const eyes = seed % 2 === 0
  return (
    <svg className={'sprite ' + (big ? 'sprite-big' : '')} viewBox="0 0 240 210" role="img"
      aria-label={repo.name + ', an original ' + CATEGORIES[kind].name + ' Codémon'}>
      <defs>
        <radialGradient id={'a' + id} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity=".55"/>
          <stop offset="24%" stopColor={color} stopOpacity=".95"/>
          <stop offset="100%" stopColor={color} stopOpacity=".45"/>
        </radialGradient>
        <filter id={'shadow' + id} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10"/>
        </filter>
      </defs>
      <ellipse cx="120" cy="188" rx="65" ry="10" fill={color} opacity=".20" filter={'url(#shadow' + id + ')'} />
      <circle cx="120" cy="99" r={rarity === 'MYTHIC' ? 94 : 80}
        fill="none" stroke={color} strokeDasharray={rarity === 'MYTHIC' ? '3 9' : '2 13'}
        strokeWidth="1.5" opacity=".35" />
      {shape === 0 && <><path d="M72 79 55 16 113 52Z M166 79 184 16 127 52Z" fill={color} opacity=".75" stroke="#fff" strokeOpacity=".3" strokeWidth="2"/></>}
      {shape === 1 && <><path d="M68 106Q16 55 28 147Q45 166 79 143ZM172 106Q224 55 212 147Q195 166 161 143Z" fill={color} opacity=".68" stroke="#fff" strokeOpacity=".25" strokeWidth="2"/></>}
      {shape === 2 && <><path d="M99 67 115 10 130 64 M73 85 47 41 86 60 M167 85 192 41 154 60" fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"/></>}
      {shape === 3 && <><circle cx="69" cy="51" r="19" fill={color} opacity=".7"/><circle cx="171" cy="51" r="19" fill={color} opacity=".7"/></>}
      <path d="M120 39 C172 37 196 82 186 132 C182 167 149 182 120 179 C74 184 49 152 52 117 C50 68 80 42 120 39Z"
        fill={'url(#a' + id + ')'} stroke={color} strokeWidth="3.5"/>
      <ellipse cx="95" cy="83" rx="31" ry="22" fill="white" opacity=".09" transform="rotate(-22 95 83)"/>
      <ellipse cx="91" cy="111" rx={eyes ? 11 : 15} ry={eyes ? 14 : 10} fill="#10162d"/>
      <ellipse cx="151" cy="111" rx={eyes ? 11 : 15} ry={eyes ? 14 : 10} fill="#10162d"/>
      <circle cx="95" cy="106" r="4.5" fill="white"/><circle cx="155" cy="106" r="4.5" fill="white"/>
      <path d={seed % 3 === 0 ? 'M111 143Q121 136 131 143' : 'M108 140Q120 155 132 140'}
        stroke="#17203a" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <ellipse cx="74" cy="136" rx="10" ry="6" fill="#fa7aab" opacity=".38"/>
      <ellipse cx="168" cy="136" rx="10" ry="6" fill="#fa7aab" opacity=".38"/>
      <path d="M74 168Q56 182 73 189 M166 168Q185 182 166 189" stroke={color} strokeWidth="8"
        strokeLinecap="round" fill="none"/>
      <path d="M60 83 45 74 M181 83 195 73" stroke={color} strokeWidth="7" strokeLinecap="round"/>
      {rarity === 'MYTHIC' && <><path d="m30 31 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" fill="#ffe9a6"/><path d="m206 19 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#ffe9a6"/></>}
    </svg>
  )
}

export default function App() {
  const [username, setUsername] = useState('MichaelWave369')
  const [draft, setDraft] = useState('MichaelWave369')
  const [repos, setRepos] = useState<Repo[]>([])
  const [favorites, setFavorites] = useState<string[]>(readFavorites)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<Kind | 'ALL'>('ALL')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [sort, setSort] = useState<Sort>('recent')
  const [selected, setSelected] = useState<Repo | null>(null)
  const [busy, setBusy] = useState(false)
  const [synced, setSynced] = useState<number | null>(null)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)

  async function sync(target: string) {
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setBusy(true)
    setError('')
    try {
      const items = await fetchAll(target, request.signal)
      if (request.signal.aborted) return
      setRepos(items)
      const at = Date.now()
      setSynced(at)
      try { localStorage.setItem('codedex:cache:v1:' + target.toLowerCase(), JSON.stringify({ at, repos: items })) }
      catch { /* cache is optional */ }
    } catch (err) {
      if (!request.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to sync repositories.')
    } finally {
      if (!request.signal.aborted) setBusy(false)
    }
  }

  useEffect(() => {
    const cached = readCache(username)
    setRepos(cached?.repos || [])
    setSynced(cached?.at || null)
    setError('')
    if (!cached || Date.now() - cached.at > 10 * 60 * 1000) void sync(username)
    return () => controller.current?.abort()
  }, [username])

  useEffect(() => {
    try { localStorage.setItem('codedex:favorites:v1', JSON.stringify(favorites)) } catch { /* optional */ }
  }, [favorites])

  useEffect(() => {
    if (!selected) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selected])

  function toggleFavorite(repo: Repo) {
    const key = repo.full_name
    setFavorites((before) => before.includes(key) ? before.filter((v) => v !== key) : [...before, key])
  }

  function changeUser(e: FormEvent) {
    e.preventDefault()
    const input = draft.trim()
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(input)) {
      setError('Enter a valid GitHub username.')
      return
    }
    setQuery('')
    setKind('ALL')
    setSelected(null)
    if (input === username) { void sync(username); return }
    setUsername(input)
  }

  const shown = useMemo(() => {
    const needle = query.toLowerCase().trim()
    return repos.filter((repo) =>
      (kind === 'ALL' || category(repo) === kind) &&
      (!onlyFavorites || favorites.includes(repo.full_name)) &&
      (!needle || [repo.name, repo.description || '', repo.language || '', ...(repo.topics || [])].join(' ').toLowerCase().includes(needle))
    ).sort((a, b) => {
      if (sort === 'level') return stats(b).level - stats(a).level || a.name.localeCompare(b.name)
      if (sort === 'stars') return b.stargazers_count - a.stargazers_count
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'oldest') return a.created_at.localeCompare(b.created_at)
      return b.created_at.localeCompare(a.created_at)
    })
  }, [repos, kind, onlyFavorites, query, sort, favorites])

  const caught = repos.filter((repo) => favorites.includes(repo.full_name))
  const team = caught.slice(0, 5)
  const typesSeen = new Set(repos.map(category)).size
  const featured = repos[0]
  const arenaRepos = useMemo(() => repos.map(repo => ({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    html_url: repo.html_url,
    kind: category(repo),
    level: stats(repo).level,
    stargazers_count: repo.stargazers_count,
  })), [repos])
  const countLabel = synced && repos.length ? 'Last synced ' + niceDate(new Date(synced).toISOString()) : 'Public GitHub data'

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="CODEDEX home"><span className="logo-mark">◈</span> CODE<span>DEX</span><small>LAB · 001</small></a>
        <div className="top-meta"><span className="live-dot"/> REAL REPOS · ORIGINAL CREATURES</div>
        <a className="splash-jump" href="#splash-squad">SPLASH SQUAD ↘</a>
        <a className="arena-jump" href="#wild-encounters">WILD ENCOUNTERS ↘</a>
        <a className="github-link" href="https://github.com/MichaelWave369/Codedex" target="_blank" rel="noreferrer">VIEW SOURCE ↗</a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">WELCOME TO YOUR DEVELOPER FIELD GUIDE <span>///</span> SEASON 01</div>
            <h1>Gotta <em>build</em><br/> 'em all<span className="period">.</span></h1>
            <p>Every repository is a creature. Every merge is an adventure. Meet your code collection, brought to life.</p>
            <div className="hero-actions">
              <a className="primary-button" href="#collection">EXPLORE THE DEX <span>↘</span></a>
              <span className="little-note">No login. No tracking. Just code creatures.</span>
            </div>
          </div>
          <div className="hero-panel" aria-label="Featured original Codémon">
            <div className="panel-grid"/>
            <div className="panel-label">FIRST ENCOUNTER <span>NO. 001</span></div>
            {featured ? <Sprite repo={featured} big /> : <div className="hero-unknown">?</div>}
            <div className="panel-bottom"><div><span>WILD CODEMON APPEARED!</span><strong>{featured ? featured.name : 'YOUR NEXT BIG IDEA'}</strong></div><span>✳</span></div>
          </div>
        </section>

        <section className="stat-ribbon" aria-label="Collection stats">
          <div><span className="stat-num">{repos.length}</span><span className="stat-caption">SPECIES DISCOVERED</span></div>
          <div><span className="stat-num">{caught.length}</span><span className="stat-caption">IN YOUR PARTY</span></div>
          <div><span className="stat-num">{typesSeen} <small>/ 8</small></span><span className="stat-caption">ELEMENTAL TYPES</span></div>
          <div><span className="stat-num">{repos.reduce((n, r) => n + r.stargazers_count, 0)}</span><span className="stat-caption">TOTAL GITHUB STARS</span></div>
        </section>

        <section className="trainer-area">
          <div className="trainer-info">
            <div className="tiny-heading">✳ TRAINER IDENTITY</div>
            <h2>{username === 'MichaelWave369' ? 'Mikey Ketchum' : username}</h2>
            <p>CREATURE ARCHITECT <span>·</span> FULL-STACK EXPLORER</p>
          </div>
          <div className="team-wrap">
            <div className="tiny-heading">YOUR FAVORITES / TEAM SLOTS</div>
            <div className="team-slots">
              {Array.from({ length: 5 }, (_, index) => (
                <div className={'team-slot ' + (team[index] ? 'occupied' : '')} key={index} title={team[index]?.name || 'Empty team slot'}>
                  {team[index] ? <Sprite repo={team[index]}/> : <span>+</span>}
                </div>
              ))}
            </div>
            <div className="team-hint">Tap the heart on any creature card to add it to your collection.</div>
          </div>
        </section>

        <SplashSquad key={username} username={username} repos={repos} favorites={favorites} onInspect={(fullName) => {
          const chosen = repos.find(repo => repo.full_name === fullName)
          if (chosen) setSelected(chosen)
        }} />

        <BattleArena key={username} username={username} repos={arenaRepos} favorites={favorites} onInspect={(fullName) => {
          const chosen = repos.find(repo => repo.full_name === fullName)
          if (chosen) setSelected(chosen)
        }} />

        <section className="dex-section" id="collection">
          <div className="section-head">
            <div><div className="tiny-heading">THE FIELD GUIDE / VOL. 01</div><h2>THE CODEDEX <span>↗</span></h2><p>A living index of public repositories, reimagined as digital creatures.</p></div>
            <span className="index-count">{String(shown.length).padStart(3, '0')} ENTRIES</span>
          </div>

          <form className="user-form" onSubmit={changeUser}>
            <label htmlFor="username">GITHUB TRAINER</label>
            <div className="form-input-line"><span>@</span><input id="username" aria-label="GitHub username" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={39} autoComplete="off" spellCheck={false}/></div>
            <button type="submit" disabled={busy}>LOAD TRAINER ↗</button>
            <button className="sync-button" type="button" onClick={() => void sync(username)} disabled={busy}>{busy ? 'SYNCING…' : '↻ REFRESH'}</button>
          </form>

          <div className="controls">
            <div className="search-wrap"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, language or keyword..." aria-label="Search Codémon"/></div>
            <select aria-label="Sort the Codédex" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="recent">Newest first</option><option value="oldest">Oldest first</option>
              <option value="level">Highest level</option><option value="stars">Most stars</option><option value="name">Name A–Z</option>
            </select>
            <label className="favorites-toggle"><input type="checkbox" checked={onlyFavorites} onChange={(e) => setOnlyFavorites(e.target.checked)}/> ♥ My team</label>
          </div>

          <div className="type-row">
            <button className={'type-pill ' + (kind === 'ALL' ? 'active' : '')} onClick={() => setKind('ALL')}>ALL <span>{repos.length}</span></button>
            {(Object.keys(CATEGORIES) as Kind[]).map((name) =>
              <button key={name} className={'type-pill ' + (kind === name ? 'active' : '')} onClick={() => setKind(name)} style={{ '--t': CATEGORIES[name].color } as CSSProperties}>{CATEGORIES[name].icon} {CATEGORIES[name].name.toUpperCase()} <span>{repos.filter((r) => category(r) === name).length}</span></button>
            )}
          </div>

          <div className="sync-status" aria-live="polite"><span className={busy ? 'pulse' : ''}>{busy ? '↻ Fetching public repos from GitHub…' : countLabel}</span><span>Creature types & battle levels are fictional game stats.</span></div>
          {error && <div className="error" role="alert">⚠ {error} {repos.length ? 'Showing your cached collection.' : ''}</div>}

          <div className="cards-grid">
            {shown.map((repo, index) => {
              const type = category(repo)
              const info = stats(repo)
              const favorite = favorites.includes(repo.full_name)
              return <article className="creature-card" key={repo.id} style={{ '--accent': CATEGORIES[type].color } as CSSProperties}>
                <div className="card-top"><span>NO. {String(index + 1).padStart(3, '0')}</span><span className={'rarity rarity-' + info.rarity.toLowerCase()}>{info.rarity}</span></div>
                <button className="sprite-button" onClick={() => setSelected(repo)} aria-label={'Inspect ' + repo.name}><Sprite repo={repo}/></button>
                <div className="card-content">
                  <div className="category-line"><span>{CATEGORIES[type].icon} {CATEGORIES[type].name.toUpperCase()} TYPE</span><span>LVL {info.level}</span></div>
                  <button className="card-name" onClick={() => setSelected(repo)} title={'Inspect ' + repo.name}>{repo.name}</button>
                  <p>{repo.description || 'A mysterious project waiting to tell its story.'}</p>
                  <div className="card-foot"><span>★ {repo.stargazers_count} <span className="soft-divider">·</span> {repo.language || 'CODE'}</span><button className={'heart-button ' + (favorite ? 'saved' : '')} onClick={() => toggleFavorite(repo)} aria-label={(favorite ? 'Remove ' : 'Add ') + repo.name + (favorite ? ' from' : ' to') + ' favorites'} aria-pressed={favorite}>{favorite ? '♥' : '♡'}</button></div>
                </div>
              </article>
            })}
          </div>
          {!busy && !shown.length && <div className="empty">
            <div className="empty-ball">◈</div>
            <h3>{repos.length ? 'No Codémon found.' : 'Your adventure begins here.'}</h3>
            <p>{repos.length ? 'Try changing the filters or search terms.' : 'Enter a public GitHub username to discover your creatures.'}</p>
          </div>}
        </section>
      </main>

      <footer><span>◈ CODEDEX / THE CREATURE COMPENDIUM</span><span>ORIGINAL FAN-INSPIRED CONCEPT · MIT · NOT AFFILIATED WITH POKÉMON OR NINTENDO</span><a href="https://github.com/MichaelWave369/Codedex" target="_blank" rel="noreferrer">GITHUB ↗</a></footer>

      {selected && (() => {
        const type = category(selected)
        const info = stats(selected)
        const favorite = favorites.includes(selected.full_name)
        return <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}>
          <div className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title" onMouseDown={(e) => e.stopPropagation()} style={{ '--accent': CATEGORIES[type].color } as CSSProperties}>
            <button className="close" onClick={() => setSelected(null)} aria-label="Close creature details">✕</button>
            <div className="detail-art"><div className="tiny-heading">SPECIMEN / {selected.id}</div><Sprite repo={selected} big/><div className="detail-rarity">{info.rarity} • {info.stage}</div></div>
            <div className="detail-copy">
              <div className="tiny-heading">{CATEGORIES[type].icon} {CATEGORIES[type].name.toUpperCase()} TYPE / CODEMON</div>
              <h2 id="detail-title">{selected.name}</h2>
              <p>{selected.description || 'A mysterious repository from the developer wilds.'}</p>
              <div className="detail-stats"><div><span>LEVEL</span><strong>{info.level}</strong></div><div><span>ENERGY</span><strong>{info.energy}</strong></div><div><span>STARS</span><strong>{selected.stargazers_count}</strong></div><div><span>FORKS</span><strong>{selected.forks_count}</strong></div></div>
              <div className="moves"><div className="tiny-heading">SIGNATURE MOVE</div><strong>{CATEGORIES[type].move}</strong><small>Fictional ability · based on type</small></div>
              <div className="meta-line">CREATED {niceDate(selected.created_at)} · LAST PUSH {niceDate(selected.pushed_at)}</div>
              <div className="detail-actions"><a href={selected.html_url} target="_blank" rel="noreferrer">VIEW REPO ↗</a><button onClick={() => toggleFavorite(selected)}>{favorite ? '♥ IN YOUR TEAM' : '♡ ADD TO TEAM'}</button></div>
            </div>
          </div>
        </div>
      })()}
    </div>
  )
}
