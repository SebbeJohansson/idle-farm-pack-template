# Idle Farm pack template

A starting point for a biome pack for [Idle Farm](https://github.com/SebbeJohansson)'s
digger. A pack is one `pack.json` file: a few underground layers (biomes),
each with its blocks, ores, creatures, finds and a bit of lore. Players
install packs from the game's **Shop → Packs → Browse packs**, which reads
the registry at [idle-farm-packs](https://github.com/SebbeJohansson/idle-farm-packs).

This repo's `pack.json` is a working example ("Example Caverns", 3 biomes).

## Make your own

1. **Use this template** (the green button) to get your own copy.
2. Edit `pack.json`: give it your own `id` (lowercase letters, digits and
   `-`, up to 40), `name`, `author` and `version`, then write your biomes.
   Every visual is a single emoji; keep it cozy.
3. Check it, the same way the game will:

   ```bash
   npm run validate
   ```

   Node 22.18 or newer, nothing to install. GitHub Actions runs the same
   check on every push.

You can already try it in the game: **Shop → Packs → Import a pack**, then
start a new world with "Plus imported packs".

## Publish it

1. Commit and push, then tag a release. The tag pins the exact file players
   get:

   ```bash
   git tag v1.0.0 && git push origin v1.0.0
   ```

2. Print your registry entry. The URL is your file on jsDelivr at that tag:

   ```bash
   npm run entry -- https://cdn.jsdelivr.net/gh/<you>/<repo>@v1.0.0/pack.json "One line about your pack."
   ```

3. Open a pull request on
   [idle-farm-packs](https://github.com/SebbeJohansson/idle-farm-packs) that
   adds that entry to `index.json`. Its CI downloads your file and checks it
   matches the checksum.

For a new version, change `version` in `pack.json`, tag again (`v1.1.0`),
and send a PR that updates your entry's `version`, `url` and `sha256`.
Players see an **Update** button.

## Rules

- `license` must be one of CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, MIT or
  Apache-2.0. You're responsible for what you publish.
- Under 1 MB and at most 200 biomes. Biome names must be unique.
- Nothing scary, gory or mean: the farm is a cozy place. Packs that aren't
  get removed from the registry.

## tools/

`tools/` holds copies of the game's own pack rules (`schema.ts`), registry
reader (`registry.ts`) and pack tool (`digger-pack.ts`). They run on plain
Node with no dependencies.

## License

The template (tools, workflow, README) is [MIT No Attribution](LICENSE):
use it however you like, no credit needed. Your pack itself is under the
license you put in `pack.json`; the example pack is CC0-1.0.
