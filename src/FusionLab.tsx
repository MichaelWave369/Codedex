import { useId, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { ELEMENTS, MAX_FUSIONS, fuse, loadFusions, storeFusions, toMarkdown } from './fusion'
import type { FusionParent, FusionRecipe } from './fusion'
import './fusion-lab.css'

type Props = {
  username: string
  repos: FusionParent[]
  favorites: string[]
  onInspect: (fullName: string) => void
}

function Offspring({ recipe }: { recipe: FusionRecipe }) {
  const id = useId().replace(/:/g, '')
  const [a, b] = recipe.parents
  const ca = ELEMENTS[a.kind].color
  const cb = ELEMENTS[b.kind].color
  const dna = recipe.dna
  const horns = dna % 4
  const pupil = (dna >>> 8) % 3
  return <svg className="fusion-creature" viewBox="0 0 350 270" role="img"
    aria-label={'Original fused code creature for ' + recipe.title}>
    <defs>
      <linearGradient id={'hybrid-' + id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={ca}/>
        <stop offset=".54" stopColor={ca}/>
        <stop offset=".56" stopColor={cb}/>
        <stop offset="1" stopColor={cb}/>
      </linearGradient>
      <radialGradient id={'shine-' + id} cx="28%" cy="19%" r="75%">
        <stop offset="0" stopColor="#fff" stopOpacity=".54"/>
        <stop offset=".35" stopColor="#fff" stopOpacity=".03"/>
        <stop offset="1" stopColor="#fff" stopOpacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="177" cy="247" rx="83" ry="11" fill={cb} opacity=".15"/>
    <circle cx="173" cy="128" r="106" stroke={ca} strokeDasharray="4 11" fill="none" strokeWidth="2" opacity=".35"/>
    <circle cx="173" cy="128" r="118" stroke={cb} strokeDasharray="2 16" fill="none" opacity=".22"/>
    {horns === 0 && <g strokeWidth="3" stroke="#fff" strokeOpacity=".4"><path d="M119 88 91 19 162 67" fill={ca}/><path d="M230 88 256 19 188 67" fill={cb}/></g>}
    {horns === 1 && <><ellipse cx="99" cy="81" rx="31" ry="48" fill={ca} opacity=".8" transform="rotate(-33 99 81)"/><ellipse cx="249" cy="81" rx="31" ry="48" fill={cb} opacity=".8" transform="rotate(33 249 81)"/></>}
    {horns === 2 && <g fill="none" strokeWidth="13" strokeLinecap="round"><path d="M137 76 122 31 101 19" stroke={ca}/><path d="M211 76 226 31 249 19" stroke={cb}/></g>}
    {horns === 3 && <><circle cx="116" cy="52" r="24" fill={ca}/><circle cx="232" cy="52" r="24" fill={cb}/></>}
    <path d="M175 57C241 56 272 100 263 161C260 210 228 232 175 232C120 233 89 210 85 160C77 101 115 56 175 57Z"
      stroke="#e9e7ff" strokeOpacity=".43" strokeWidth="4" fill={'url(#hybrid-' + id + ')'}/>
    <path d="M175 57C241 56 272 100 263 161C260 210 228 232 175 232C120 233 89 210 85 160C77 101 115 56 175 57Z" fill={'url(#shine-' + id + ')'}/>
    <ellipse cx="135" cy="100" rx="34" ry="14" transform="rotate(-24 135 100)" fill="#fff" opacity=".19"/>
    <path d="M92 158 61 181 M257 159 289 181 M128 219 116 246 M220 219 233 246"
      strokeWidth="12" fill="none" strokeLinecap="round" stroke={ca}/>
    <ellipse cx="141" cy="155" rx={pupil === 0 ? 14 : 12} ry={pupil === 2 ? 12 : 18} fill="#131c34"/>
    <ellipse cx="208" cy="155" rx={pupil === 0 ? 14 : 12} ry={pupil === 2 ? 12 : 18} fill="#131c34"/>
    <circle cx="146" cy="149" r="5" fill="#fff"/><circle cx="213" cy="149" r="5" fill="#fff"/>
    <path d={dna % 2 === 0 ? 'M158 188Q176 210 194 188' : 'M162 190Q175 196 189 190'} fill="none" stroke="#1b2540" strokeWidth="5" strokeLinecap="round"/>
    <ellipse cx="113" cy="184" rx="11" ry="7" fill="#ffa0bc" opacity=".5"/>
    <ellipse cx="238" cy="184" rx="11" ry="7" fill="#ffa0bc" opacity=".5"/>
    <path d="m38 47 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" fill={ca}/>
    <path d="m309 33 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" fill={cb}/>
    <circle cx="176" cy="111" r="10" fill="#ffffff" opacity=".45"/>
    <circle cx="176" cy="111" r="4" fill="#1b2949" opacity=".8"/>
  </svg>
}

function download(text: string, filename: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function FusionLab({ username, repos, favorites, onInspect }: Props) {
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [collection, setCollection] = useState<FusionRecipe[]>(() => loadFusions(username))
  const [activeId, setActiveId] = useState('')
  const [notice, setNotice] = useState('SELECT TWO DIFFERENT REPOS TO BEGIN.')
  const priority = useMemo(() => [
    ...repos.filter(repo => favorites.includes(repo.full_name)),
    ...repos.filter(repo => !favorites.includes(repo.full_name)),
  ], [repos, favorites])
  const parentA = priority.find(repo => repo.full_name === first) || priority[0]
  const parentB = priority.find(repo => repo.full_name === second) ||
    priority.find(repo => repo.full_name !== parentA?.full_name)
  const active = collection.find(recipe => recipe.id === activeId) || collection[0] || null
  const canFuse = Boolean(parentA && parentB && parentA.full_name !== parentB.full_name)
  const maxed = collection.length >= MAX_FUSIONS
  const [copyStatus, setCopyStatus] = useState('')

  function spawn() {
    if (!parentA || !parentB || !canFuse) { setNotice('TWO DIFFERENT REPOSITORIES ARE REQUIRED.'); return }
    const previous = collection.filter(recipe => recipe.parents[0].full_name === parentA.full_name &&
      recipe.parents[1].full_name === parentB.full_name)
    const generation = previous.length ? Math.max(...previous.map(recipe => recipe.generation)) + 1 : 0
    const recipe = fuse(parentA, parentB, generation)
    const next = [recipe, ...collection].slice(0, MAX_FUSIONS)
    setCollection(next)
    storeFusions(username, next)
    setActiveId(recipe.id)
    setNotice('NEW ORIGINAL FUSION SAVED! · GENERATION ' + (generation + 1))
    setCopyStatus('')
  }

  async function copyBlueprint() {
    if (!active) return
    try {
      await navigator.clipboard.writeText(toMarkdown(active))
      setCopyStatus('BLUEPRINT COPIED TO CLIPBOARD')
    } catch {
      setCopyStatus('CLIPBOARD UNAVAILABLE · USE DOWNLOAD INSTEAD')
    }
  }

  function removeRecipe(id: string) {
    const next = collection.filter(item => item.id !== id)
    setCollection(next)
    storeFusions(username, next)
    if (active?.id === id) setActiveId(next[0]?.id || '')
    setNotice('FUSION REMOVED FROM THIS BROWSER.')
  }

  return <section className="fusion-section" id="fusion-lab" aria-labelledby="fusion-title">
    <div className="fusion-head">
      <div>
        <div className="tiny-heading">CODEDEX / CHAPTER 05 · THE IMPOSSIBLE IDEAS MACHINE</div>
        <h2 id="fusion-title">FUSION <span>LAB</span> <span aria-hidden="true">✳</span></h2>
        <p>Choose two of your existing projects. Give their ideas a new life. Discover an original creature and a buildable blueprint for the next wild repository.</p>
      </div>
      <div className="fusion-count"><span>INCUBATOR</span><strong>{collection.length} <small>/ {MAX_FUSIONS}</small></strong><span>SPECIMENS SAVED</span></div>
    </div>
    <div className="fusion-inputs">
      <div className="fusion-input"><label htmlFor="fusion-parent-a">PARENT A / PRIMARY IDEA</label>
        <select id="fusion-parent-a" value={parentA?.full_name || ''} onChange={event => setFirst(event.target.value)} disabled={!repos.length}>
          {priority.map(repo => <option key={repo.full_name} value={repo.full_name}>{repo.name} · {ELEMENTS[repo.kind].label}</option>)}
        </select>
        <div className="fusion-trait">INHERITS <strong>{parentA ? ELEMENTS[parentA.kind].gift : 'No parent selected'}</strong></div>
      </div>
      <div className="fusion-plus" aria-hidden="true">+</div>
      <div className="fusion-input"><label htmlFor="fusion-parent-b">PARENT B / SECONDARY IDEA</label>
        <select id="fusion-parent-b" value={parentB?.full_name || ''} onChange={event => setSecond(event.target.value)} disabled={!repos.length}>
          {priority.map(repo => <option key={repo.full_name} value={repo.full_name} disabled={repo.full_name === parentA?.full_name}>
            {repo.name} · {ELEMENTS[repo.kind].label}</option>)}
        </select>
        <div className="fusion-trait">INHERITS <strong>{parentB ? ELEMENTS[parentB.kind].gift : 'No second repo available'}</strong></div>
      </div>
    </div>
    <div className="fusion-generate-row">
      <div><span className="fusion-signal">◈ PROVENANCE: PUBLIC REPO METADATA + LOCAL RULES</span>
        <small>Generates a concept, not new code. No AI API or repository writes.</small></div>
      <button type="button" disabled={!canFuse} onClick={spawn}>✳ {maxed ? 'FUSE & REPLACE OLDEST' : 'FUSE THESE REPOS'} ↗</button>
    </div>
    <p className="fusion-notice" role="status" aria-live="polite">{notice}</p>

    {active ? <div className="fusion-result">
      <div className="fusion-specimen" style={{ '--fusion-a': ELEMENTS[active.parents[0].kind].color, '--fusion-b': ELEMENTS[active.parents[1].kind].color } as CSSProperties}>
        <div className="fusion-tag"><span>SPECIMEN · GEN {String(active.generation + 1).padStart(2, '0')}</span><span>{ELEMENTS[active.element].label.toUpperCase()} HYBRID</span></div>
        <Offspring recipe={active}/>
        <h3>{active.title}</h3>
        <p>{active.tagline}</p>
        <div className="fusion-parent-links">
          <button type="button" onClick={() => onInspect(active.parents[0].full_name)}>↗ {active.parents[0].name}</button>
          <span>×</span>
          <button type="button" onClick={() => onInspect(active.parents[1].full_name)}>↗ {active.parents[1].name}</button>
        </div>
      </div>
      <div className="fusion-blueprint">
        <div className="tiny-heading">OFFSPRING BLUEPRINT / {active.codename.toUpperCase()}</div>
        <h3>Meet {active.title}</h3>
        <p className="fusion-premise">{active.premise}</p>
        <p className="fusion-blend">{active.blend}</p>
        <h4>FIRST BUILD / MVP</h4>
        <ol>{active.mvp.map((item, index) => <li key={index}>{item}</li>)}</ol>
        <h4>ACCEPTANCE CHECKS</h4>
        <ul>{active.acceptance.map((item, index) => <li key={index}>{item}</li>)}</ul>
        <div className="fusion-next"><span>NEXT QUEST</span><strong>{active.nextQuest}</strong></div>
        <div className="fusion-export">
          <button type="button" onClick={() => void copyBlueprint()}>COPY MARKDOWN ↗</button>
          <button type="button" onClick={() => download(toMarkdown(active), 'CODEDEX-' + active.codename + '-blueprint.md', 'text/markdown;charset=utf-8')}>DOWNLOAD .MD ↓</button>
          <button type="button" onClick={() => download(JSON.stringify(active, null, 2), 'CODEDEX-' + active.codename + '.json', 'application/json;charset=utf-8')}>EXPORT JSON ↓</button>
        </div>
        {copyStatus && <p className="fusion-copy-status" role="status">{copyStatus}</p>}
      </div>
    </div> : <div className="fusion-empty"><span>◎</span><h3>NO CREATURES IN THE INCUBATOR</h3><p>Two repositories enter. An original project idea emerges.</p></div>}

    <div className="fusion-archive-head"><h3>YOUR INCUBATOR ARCHIVE</h3><span>LOCAL TO @{username} · MOST RECENT FIRST</span></div>
    {collection.length ? <div className="fusion-archive">
      {collection.map(item => <div key={item.id} className={'fusion-archive-entry ' + (active?.id === item.id ? 'selected' : '')}>
        <button className="fusion-archive-open" type="button" onClick={() => {setActiveId(item.id);setCopyStatus('')}} aria-pressed={active?.id === item.id}>
          <span className="fusion-archive-dot" style={{ background: ELEMENTS[item.element].color }}/>
          <span><strong>{item.title}</strong><small>{item.parents[0].name} × {item.parents[1].name} · GEN {item.generation + 1}</small></span>
          <span>↗</span>
        </button>
        <button className="fusion-archive-remove" type="button" onClick={() => removeRecipe(item.id)}
          aria-label={'Remove ' + item.title + ' from archive'} title="Remove locally saved fusion">×</button>
      </div>)}
    </div> : <p className="fusion-archive-empty">Nothing hatched yet. Your first pair is ready when you are.</p>}
    <p className="fusion-legal">ALL OFFSPRING ART IS ORIGINAL · GENERATED BLUEPRINTS ARE IDEAS, NOT VERIFIED INTEGRATIONS · CHECK ORIGINAL REPO LICENSES BEFORE REUSING CODE · NOTHING IS CREATED ON GITHUB WITHOUT A SEPARATE ACTION</p>
  </section>
}
