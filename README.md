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


## R2 / Wild Encounters

A standalone, entirely local, turn-based battle minigame that uses only public repository metadata.

1. Select one of the currently loaded GitHub repos as your challenger (defaults to a favorite, when available).
2. Click **Find a Wild Repo** to encounter a randomly selected *different* public repo from the same trainer collection.
3. Choose **Code Pulse** (basic attack, gain one charge), **Overclock Surge** (strong attack, costs two charge), **Bubble Firewall** (reduce one incoming attack and gain charge), or **Patch Kit** (heal once per match).
4. Battle against automated fictional counterattacks until someone reaches zero hit points.
5. Record victories, defeats and streaks, and unlock four fictional trainer achievements. Records persist locally per GitHub username.

Each creature inherits the CODEDEX heuristic type and level, while the battle engine applies a simple fictional eight-type advantage ring. Random opponent selection is the only nondeterministic encounter input; damage varies reproducibly based on round and repository names. Battle is a solo mode; no multiplayer, server or GitHub write access. You need at least two public repos to play. No battle statistic is an assessment of code quality, security, or reliability.


## R3 / Evolution Lab

Train any repo-backed creature and unlock visually different, original forms. Experience belongs to each repository and is saved only in your browser for the currently selected public GitHub trainer.

- **Code Drill** grants 60 fictional XP per click.
- **Wild Encounter victory** grants 80 XP to the winning repo-backed Codémon, linking arena play with the lab.
- Evolution stages: **Spark** (0 XP), **Hatchling** (120 XP), **Evolved** (360 XP), and **Ascended** (900 XP).
- Evolving reveals new creature accessories and silhouette elements in the lab and main Codédex cards, including wings, antennae, and an ultimate crown and aura.
- A slow, capped square-root XP bonus increases displayed battle level without exceeding level 100.
- Pick creatures, inspect their records, see progress to the next evolution, and track how many have trained and evolved.
- Maximum XP per creature: 5,000, so growth is finite and locally reproducible.

XP, levels and evolutionary forms are deliberately **fictional game mechanics**, not measurements of project maturity, performance, or security. Real GitHub repositories remain unchanged. No login or online game server needed.

## R4 / Fusion Lab

**Combine two existing public repositories into a new original Codémon and an actionable project concept.** This is a creative ideation tool, **not** automatic repository creation or code-merging.

- Select Parent A and Parent B from the loaded trainer's public repo collection. They must be different.
- The local deterministic idea engine uses the two repo names, descriptions, and inferred CODEDEX types to propose an original hybrid creature, concept title, premise, pairing rationale, five-step MVP, four acceptance checks, and a next quest.
- Curated cross-type combinations offer more specific ideas, such as sound + arcade, visual art + research, or AI + build tooling.
- Each fusion gets new procedural two-color creature art and a stable identifier based on the ordered parents and generation. **Fuse again** to explore another seeded variation.
- Save up to 60 offspring concepts per GitHub trainer in this browser; review or remove them later even if the GitHub API is unavailable.
- Copy the Markdown blueprint, download a Markdown brief or export structured JSON. Exports happen locally with no server.
- The application never copies the parents' source code or creates a new GitHub repository. Review actual APIs, security requirements, and software licenses before integrating any ideas.

Run `npm run test:fusion` to exercise deterministic replay, uniqueness across generations, parent validation, exported content, and curated pairing logic. The Pages workflow runs the checks before its TypeScript/production build.

## License and rights

MIT. All creature designs and app assets are original. CODEDEX is an independent, playful fan-inspired concept and is not affiliated with, endorsed by, or sponsored by Nintendo, Pokémon or The Pokémon Company. It uses no official Pokémon art, logos, or characters.
