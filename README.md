# CODEDEX ◈

**Gotta build 'em all.**

CODEDEX is a free, open-source, GitHub Pages-ready field guide that turns public GitHub repositories into original collectible **Codémon**.

## R0 / First Encounter

- Fetch public repos from any GitHub username, starting with **MichaelWave369**, using GitHub's public API (no login).
- Each repo gets a deterministic original SVG creature, one of eight types: Mind, Arcade, Echo, Prism, Cosmos, Shield, Forge, Web.
- Procedural rarity, game level, evolution stage, energy, and signature move.
- Search projects, filter by type, sort by newest/oldest/level/stars/name.
- Tap hearts to add up to five favorites to your trainer team (favorites persist locally).
- Inspect any creature for metadata, code stats, date, signature move and repo link.
- Responsive interface, reduced motion, local caching, graceful error messages.

**Note:** Codémon levels, types, rarities, battle abilities and evolution stages are playful fictional mechanics. They **do not** measure code quality, security or correctness.

## Local development

Requires Node 20 or higher.

~~~bash
npm install
npm run dev
npm run build
~~~

## Deployment

The project configures Vite with a /Codedex/ base path and includes a GitHub Actions Pages workflow. After merging the PR, set **Settings > Pages > Build and deployment > Source: GitHub Actions**.

Expected site: https://michaelwave369.github.io/Codedex/

## Privacy and limitations

Public API only; private GitHub repositories are never read. This version paginates up to 1,000 public repos. Anonymous GitHub API requests are rate-limited (often 60/hour per IP). The browser stores optional cached public results and locally selected favorites. CODEDEX never writes to GitHub, asks for credentials, or sends personal data to a CODEDEX server.

Creature appearance and rarity derive from a stable hash of the repository full name; type is a keyword heuristic based on repo metadata; level uses capped size, star and fork counts. Favorites are browser-local, not GitHub stars.

## License and rights

MIT. All creature designs and app assets are original. CODEDEX is an independent, playful fan-inspired concept and is not affiliated with, endorsed by, or sponsored by Nintendo, Pokémon or The Pokémon Company. It uses no official Pokémon art, logos, or characters.
