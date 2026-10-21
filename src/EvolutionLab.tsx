import { useId, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { EVOLUTIONS, MAX_XP, TRAINING_REWARD, experienceFor, nextEvolution, stageIndex, trainedLevel } from './progression'
import type { ExperienceLedger } from './progression'
import './evolution-lab.css'

type ElementType = 'MIND' | 'ARCADE' | 'ECHO' | 'PRISM' | 'COSMOS' | 'SHIELD' | 'FORGE' | 'WEB'
export type EvolutionRepo = {
  id: number
  full_name: string
  name: string
  kind: ElementType
  baseLevel: number
  language: string | null
}
type Props = {
  username: string
  repos: EvolutionRepo[]
  favorites: string[]
  experience: ExperienceLedger
  onTrain: (fullName: string, xp: number) => void
  onInspect: (fullName: string) => void
}

const COLORS: Record<ElementType, string> = {
  MIND: '#bbabff', ARCADE: '#ff91a7', ECHO: '#ffd987', PRISM: '#f7a3ff',
  COSMOS: '#96b5ff', SHIELD: '#8aecd3', FORGE: '#ffc08b', WEB: '#99e5ff'
}

function creatureHash(value: string): number {
  let hash = 2166136261
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return hash >>> 0
}

function EvolutionCreature({ repo, form }: { repo: EvolutionRepo; form: number }) {
  const id = useId().replace(/:/g, '')
  const color = COLORS[repo.kind]
  const seed = creatureHash(repo.full_name)
  return <svg viewBox="0 0 360 300" role="img" className={'evolution-creature evolution-form-' + form}
    aria-label={'Original ' + repo.kind.toLowerCase() + ' Codémon ' + repo.name + ' in ' + EVOLUTIONS[form].label + ' form'}>
    <defs>
      <radialGradient id={'evo-' + id} cx="32%" cy="22%" r="80%">
        <stop offset="0" stopColor="#fff" stopOpacity=".92" />
        <stop offset=".23" stopColor={color} />
        <stop offset="1" stopColor={color} stopOpacity=".47" />
      </radialGradient>
      <linearGradient id={'armor-' + id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={color} /><stop offset="1" stopColor="#445884" />
      </linearGradient>
    </defs>
    <ellipse cx="180" cy="269" rx={64 + form * 10} ry="10" fill={color} opacity=".18" />
    <circle cx="180" cy="151" r={109 + form * 6} stroke={color} strokeDasharray={form > 1 ? '8 13' : '2 18'}
      strokeWidth={form > 1 ? 2 : 1} fill="none" opacity=".27" />
    {form >= 1 && <g fill={'url(#armor-' + id + ')'} stroke={color} strokeWidth="3" opacity=".85">
      <path d="M107 140 48 85 51 173 105 187Z" />
      <path d="M251 140 312 85 310 173 252 187Z" />
    </g>}
    {form >= 2 && <g fill="none" stroke={color} strokeWidth="9" strokeLinecap="round">
      <path d="M128 89 101 44 72 35 M233 89 258 42 284 34" />
      <circle cx="71" cy="34" r="12" fill={color} strokeWidth="2" />
      <circle cx="284" cy="34" r="12" fill={color} strokeWidth="2" />
      <path d="M93 213 47 241 M269 213 313 241" />
    </g>}
    {form === 3 && <g fill={color}>
      <path d="M118 82 133 24 174 65 216 22 236 83 180 99Z" opacity=".8" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
      <path d="m37 67 6 15 15 6-15 6-6 15-6-15-15-6 15-6Z" />
      <path d="m323 54 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z" />
      <path d="m314 211 5 11 11 5-11 5-5 11-5-11-11-5 11-5Z" />
      <circle cx="180" cy="151" r="136" stroke={color} strokeDasharray="2 16" strokeWidth="3" fill="none" opacity=".5" />
    </g>}
    {form === 0 && <g stroke={color} strokeWidth="8" strokeLinecap="round" fill="none">
      <path d="M149 107 129 77 M212 107 228 77" />
    </g>}
    <path d={form < 2
      ? 'M179 83C225 83 253 114 252 167C249 210 223 240 180 240C136 240 108 211 108 167C108 114 137 83 179 83Z'
      : 'M180 64C243 64 268 111 270 163C270 219 230 249 180 249C128 249 90 215 90 163C92 110 125 64 180 64Z'}
      stroke={color} strokeWidth="5" fill={'url(#evo-' + id + ')'} />
    <ellipse cx="152" cy="112" rx="34" ry="16" fill="white" opacity=".24" transform="rotate(-24 152 112)" />
    <path d="M109 167 81 181 M251 167 280 181 M152 235 142 258 M208 235 219 258" fill="none" stroke={color} strokeWidth={10 + form * 2} strokeLinecap="round" />
    {form >= 2 && <path d="M121 188 95 205 127 216 M238 188 263 205 233 216" fill={'url(#armor-' + id + ')'} stroke={color} strokeWidth="2" />}
    <ellipse cx={form >= 2 ? 149 : 152} cy="172" rx={13 + form} ry="17" fill="#101c35" />
    <ellipse cx={form >= 2 ? 211 : 208} cy="172" rx={13 + form} ry="17" fill="#101c35" />
    <circle cx="157" cy="167" r="5" fill="white" />
    <circle cx="213" cy="167" r="5" fill="white" />
    <path d={seed % 2 === 0 ? 'M161 204Q180 222 199 204' : 'M164 208Q180 217 196 208'}
      fill="none" stroke="#15243e" strokeWidth="5" strokeLinecap="round" />
    <ellipse cx="123" cy="197" rx="12" ry="7" fill="#ff9fae" opacity=".35" />
    <ellipse cx="237" cy="197" rx="12" ry="7" fill="#ff9fae" opacity=".35" />
    {form >= 1 && <g fill={color} opacity=".72">
      <circle cx="99" cy="75" r="7"/><circle cx="261" cy="75" r="7" />
      {form >= 2 && <><circle cx="180" cy="25" r="6"/><circle cx="298" cy="156" r="5"/></>}
    </g>}
  </svg>
}

export default function EvolutionLab({ username, repos, favorites, experience, onTrain, onInspect }: Props) {
  const [selected, setSelected] = useState('')
  const [lastMessage, setLastMessage] = useState('')
  const creature = repos.find(repo => repo.full_name === selected) || repos.find(repo => favorites.includes(repo.full_name)) || repos[0]
  const xp = creature ? experienceFor(experience, creature.full_name) : 0
  const stage = stageIndex(xp)
  const upcoming = nextEvolution(xp)
  const start = EVOLUTIONS[stage].at
  const end = upcoming?.at ?? MAX_XP
  const progress = Math.max(0, Math.min(100, Math.round(((xp - start) / Math.max(1, end - start)) * 100)))
  const level = creature ? trainedLevel(creature.baseLevel, xp) : 0
  const trained = useMemo(() => repos.filter(repo => experienceFor(experience, repo.full_name) > 0).length, [repos, experience])
  const evolved = useMemo(() => repos.filter(repo => stageIndex(experienceFor(experience, repo.full_name)) > 0).length, [repos, experience])

  function train() {
    if (!creature || xp >= MAX_XP) return
    const earned = Math.min(TRAINING_REWARD, MAX_XP - xp)
    const newXP = xp + earned
    const before = stageIndex(xp)
    const after = stageIndex(newXP)
    onTrain(creature.full_name, earned)
    setLastMessage(after > before
      ? creature.name + ' EVOLVED into ' + EVOLUTIONS[after].label.toUpperCase() + '! +' + earned + ' XP!'
      : creature.name + ' completed a code training drill. +' + earned + ' XP!')
  }

  return <section className="evolution-section" id="evolution-lab" aria-labelledby="evolution-heading">
    <div className="evolution-heading">
      <div><div className="tiny-heading">CODEDEX / CHAPTER 04 · TRAIN AND TRANSFORM</div>
        <h2 id="evolution-heading">EVOLUTION <span>LAB</span> <span aria-hidden="true">✧</span></h2>
        <p>Choose a repository, train your Codémon, and watch it grow into four original forms. Victories in Wild Encounters earn XP here too.</p>
      </div>
      <div className="evolution-tallies">
        <span>LAB REPORT</span>
        <strong>{trained} <small>TRAINED</small></strong>
        <strong>{evolved} <small>EVOLVED</small></strong>
      </div>
    </div>
    <div className="evolution-chooser">
      <label htmlFor="evolution-repo">SELECT YOUR CODEMON</label>
      <select id="evolution-repo" value={creature?.full_name || ''} onChange={event => { setSelected(event.target.value); setLastMessage('') }}>
        {repos.map(repo => <option value={repo.full_name} key={repo.id}>{repo.name}</option>)}
      </select>
      {creature && <button type="button" onClick={() => onInspect(creature.full_name)}>VIEW SPECIMEN ↗</button>}
    </div>
    {creature ? <div className="evolution-station" style={{ '--evolution-color': COLORS[creature.kind] } as CSSProperties}>
      <div className="evolution-gallery">
        <div className="evolution-subline"><span>SPECIMEN {String(creature.id).slice(-6)}</span><span>{creature.kind} / {creature.language || 'CODE'}</span></div>
        <div className="evolution-ring"><EvolutionCreature repo={creature} form={stage}/></div>
        <div className="evolution-name">{creature.name}</div>
        <div className="evolution-form-label">{EVOLUTIONS[stage].label.toUpperCase()} FORM · LEVEL {level}</div>
      </div>
      <div className="evolution-control">
        <div className="tiny-heading">CREATURE DEVELOPMENT / {username}</div>
        <h3>{EVOLUTIONS[stage].label} <span>FORM {stage + 1} / 4</span></h3>
        <p>{EVOLUTIONS[stage].description}</p>
        <div className="evolution-metrics">
          <div><span>XP EARNED</span><strong>{xp.toLocaleString()}</strong></div>
          <div><span>TRAINING BONUS</span><strong>+{level - creature.baseLevel} LVL</strong></div>
        </div>
        <div className="evolution-progress-top"><span>{upcoming ? 'NEXT EVOLUTION: ' + upcoming.label.toUpperCase() : 'MAXIMUM EVOLUTION UNLOCKED'}</span><strong>{progress}%</strong></div>
        <div className="evolution-meter" role="progressbar" aria-label="Progress to next evolution" aria-valuemin={start} aria-valuemax={end} aria-valuenow={xp}>
          <span style={{ width: progress + '%' }}/>
        </div>
        <small className="evolution-next">{upcoming ? (upcoming.at - xp) + ' XP TO GO · ' + upcoming.at + ' XP REQUIRED' : 'ASCENDED FORM ACHIEVED · KEEP TRAINING FOR BONUS LEVELS'}</small>
        <button className="evolution-train" type="button" disabled={xp >= MAX_XP} onClick={train}>
          {xp >= MAX_XP ? '✓ MAX TRAINING XP' : '⚡ RUN CODE DRILL · +' + Math.min(TRAINING_REWARD, MAX_XP - xp) + ' XP'} <span>↗</span>
        </button>
        <div className="evolution-announce" role="status" aria-live="polite">{lastMessage || 'READY FOR TRAINING · ALL XP IS LOCAL AND FICTIONAL'}</div>
      </div>
    </div> : <div className="evolution-empty">Load a public GitHub trainer to start the evolution experiment.</div>}
    <div className="evolution-path">
      {EVOLUTIONS.map((form, index) =>
        <div key={form.id} className={index === stage && creature ? 'current' : index < stage ? 'complete' : ''}>
          <span className="evolution-path-marker">{index < stage ? '✓' : String(index + 1).padStart(2, '0')}</span>
          <strong>{form.label.toUpperCase()}</strong><small>{form.at} XP</small>
        </div>)}
    </div>
    <p className="evolution-caveat">FICTIONAL, LOCAL-ONLY PROGRESSION · REPO METADATA NEVER CHANGES · ALL CREATURE DESIGNS ARE ORIGINAL · XP IS NOT A SOFTWARE QUALITY MEASURE</p>
  </section>
}
