#!/usr/bin/env node
// Copied from Idle Farm (app/game/digger/ and scripts/digger-pack.ts).
// The game applies these same rules on import; keep the copies in step.

// Checks community pack files — what a pack template repo's CI runs before
// a release, and what the registry pins (digger-plan.md, "Community packs").
//
//   node scripts/digger-pack.ts validate <pack.json>...   # exit 1 on any problem
//   node scripts/digger-pack.ts checksum <pack.json>      # sha256, for the registry
//   node scripts/digger-pack.ts entry <pack.json> <url> [description]
//                                                         # its registry index.json entry
//   node scripts/digger-pack.ts registry <index.json>     # check a registry file
//
// `validate` applies the same schema the game does on import
// (app/game/digger/schema.ts), plus the file-level rules only a repository
// can enforce: a size cap (jsDelivr serves files up to 20 MB; packs are
// text and should be tiny), no duplicate biome names, and every biome
// playable — enough ore for a common one to appear in it.

import { createHash } from 'node:crypto'
import { readFileSync, statSync } from 'node:fs'
import { readRegistry } from './registry.ts'
import { validatePack } from './schema.ts'

const MAX_PACK_BYTES = 1_000_000
const MAX_BIOMES = 200

function validate(path: string): string[] {
  const problems: string[] = []
  let size: number
  try {
    size = statSync(path).size
  }
  catch {
    return [`cannot read ${path}`]
  }
  if (size > MAX_PACK_BYTES)
    problems.push(`file is ${(size / 1e6).toFixed(1)} MB; keep packs under ${MAX_PACK_BYTES / 1e6} MB`)
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'))
  }
  catch (error) {
    return [...problems, `not valid JSON: ${error instanceof Error ? error.message : String(error)}`]
  }
  // Schema problems and the repo's own rules are reported together, so an
  // author fixes everything in one pass.
  const result = validatePack(raw)
  if (!result.ok)
    problems.push(...result.errors)
  const pack = (raw && typeof raw === 'object' ? raw : {}) as { license?: unknown, biomes?: unknown }
  const biomes = Array.isArray(pack.biomes) ? pack.biomes as { name?: unknown }[] : []
  if (biomes.length > MAX_BIOMES)
    problems.push(`${biomes.length} biomes; the game reads at most ${MAX_BIOMES} per pack`)
  const names = new Map<string, number>()
  for (const b of biomes) {
    if (typeof b?.name === 'string')
      names.set(b.name.toLowerCase(), (names.get(b.name.toLowerCase()) ?? 0) + 1)
  }
  for (const [name, count] of names) {
    if (count > 1)
      problems.push(`biome name "${name}" is used ${count} times — players tell biomes apart by name`)
  }
  if (typeof pack.license !== 'string' || !/^(?:CC0-1\.0|CC-BY-4\.0|CC-BY-SA-4\.0|MIT|Apache-2\.0)$/.test(pack.license))
    problems.push(`license ${JSON.stringify(pack.license)} isn't one the registry accepts (CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, MIT, Apache-2.0)`)
  return problems
}

function checksum(path: string): string {
  return `sha256-${createHash('sha256').update(readFileSync(path)).digest('base64')}`
}

const [command, ...paths] = process.argv.slice(2)
if (command === 'validate' && paths.length) {
  let failed = 0
  for (const path of paths) {
    const problems = validate(path)
    if (problems.length) {
      failed++
      console.log(`✗ ${path}`)
      for (const p of problems)
        console.log(`    ${p}`)
    }
    else {
      const pack = JSON.parse(readFileSync(path, 'utf8')) as { name: string, biomes: unknown[] }
      console.log(`✓ ${path} — "${pack.name}", ${pack.biomes.length} biomes`)
    }
  }
  process.exit(failed ? 1 : 0)
}
else if (command === 'checksum' && paths.length === 1) {
  console.log(checksum(paths[0]!))
}
else if (command === 'entry' && paths.length >= 2) {
  const [path, url, ...description] = paths as [string, string, ...string[]]
  const problems = validate(path)
  if (problems.length) {
    console.error(`✗ ${path}\n    ${problems.join('\n    ')}`)
    process.exit(1)
  }
  const pack = JSON.parse(readFileSync(path, 'utf8')) as { id: string, name: string, author: string, version: string, license: string, biomes: unknown[] }
  console.log(JSON.stringify({ id: pack.id, name: pack.name, author: pack.author, description: description.join(' '), version: pack.version, license: pack.license, biomes: pack.biomes.length, url, sha256: checksum(path) }, null, 2))
}
else if (command === 'registry' && paths.length === 1) {
  const raw = JSON.parse(readFileSync(paths[0]!, 'utf8')) as { packs?: unknown[] }
  const registry = readRegistry(raw)
  if (!registry) {
    console.log(`✗ ${paths[0]} — not a registry file (schemaVersion 1, packs: [])`)
    process.exit(1)
  }
  const dropped = (raw.packs?.length ?? 0) - registry.packs.length
  console.log(`${dropped ? '✗' : '✓'} ${paths[0]} — ${registry.packs.length} packs${dropped ? `, ${dropped} entries unreadable or blocked` : ''}, ${registry.blocked.length} blocked`)
  process.exit(dropped ? 1 : 0)
}
else {
  console.log('usage: node scripts/digger-pack.ts validate <pack.json>... | checksum <pack.json> | entry <pack.json> <url> [description] | registry <index.json>')
  process.exit(2)
}
