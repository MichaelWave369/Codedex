import assert from 'node:assert/strict'
import { fuse, fusionHash, toMarkdown, MAX_FUSIONS } from '../src/fusion.ts'

const alpha = {
  name: 'Auralith369', full_name: 'MichaelWave369/Auralith369',
  description: 'Audio experiment and synthesizer', language: 'TypeScript',
  html_url: 'https://github.com/MichaelWave369/Auralith369', kind: 'ECHO',
}
const beta = {
  name: 'Spark', full_name: 'MichaelWave369/Spark',
  description: 'Arcade game and cooperative challenges', language: 'TypeScript',
  html_url: 'https://github.com/MichaelWave369/Spark', kind: 'ARCADE',
}
const fixed = '2026-10-20T00:00:00.000Z'
const a = fuse(alpha, beta, 0, fixed)
const again = fuse(alpha, beta, 0, fixed)
assert.deepEqual(a, again, 'same parents, generation and date must replay exactly')
assert.ok(a.title && a.id && a.dna >= 0, 'offspring must have a name and seed')
assert.equal(a.parents.length, 2)
assert.equal(a.mvp.length, 5)
assert.equal(a.acceptance.length, 4)
assert.match(a.blend, /Audio experiment and synthesizer/, 'parent descriptions contribute context')
assert.match(a.premise, /beat-reactive arcade studio/, 'paired types should select thematic use case')
const mutation = fuse(alpha, beta, 1, fixed)
assert.notEqual(mutation.id, a.id, 'subsequent generations are uniquely identifiable')
assert.notEqual(mutation.dna, a.dna, 'new generation changes DNA')
assert.equal(fusionHash('sample'), fusionHash('sample'), 'hash must be deterministic')
assert.match(toMarkdown(a), /## MVP plan/)
assert.match(toMarkdown(a), /## Acceptance checks/)
assert.match(toMarkdown(a), /license/i)
assert.ok(MAX_FUSIONS > 0 && MAX_FUSIONS <= 100, 'library limit stays finite')
assert.throws(() => fuse(alpha, alpha), /different repositories/i, 'a repo cannot be both parents')
console.log('CODEDEX Fusion Lab smoke checks passed.')
