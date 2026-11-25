# Toolchain compatibility check (agent prompt)

> Prompt to use: "Read `docs/toolchain-compat.md` and run the compatibility check. Report what can be
> upgraded, what is blocked and why, and propose (don't apply) the changes."

## Why this exists

`effect`, `@effect/tsgo` (Effect Language Service), `tsrs` (Rust port of tsc 7) and `oxlint` are
version-coupled. `@effect/tsgo` ships Effect-patched builds of _specific_ tsrs and oxlint versions,
so upgrading one in isolation can silently drop Effect diagnostics or break commands.

## Current state (last reviewed 2026-11-25)

| Package                | Pinned                     | Latest on npm then | Note                                               |
| ---------------------- | -------------------------- | ------------------ | -------------------------------------------------- |
| `effect`               | `^4.1.5`                   | 4.1.5              | Effect v4 (stable)                                 |
| `@effect/platform-bun` | `^4.1.5`                   | 4.1.5              | Must match `effect` version                        |
| `@effect/tsgo`         | `0.73.4` (exact)           | 0.73.4             | Supports tsrs tsrs2/tsrs4, oxlint 1.91–1.94        |
| `tsrs`                 | `7.1.0-beta.tsrs4` (exact) | 7.1.0-beta.tsrs5   | **Held back**: tsrs5 not supported by @effect/tsgo |
| `oxlint`               | `^1.95.0`                  | 1.95.0             | Not supported by `effect-tsgo oxlint` (so unused)  |
| `oxfmt`                | `^0.80.0`                  | —                  | Independent                                        |

Note: tsrs uses `tsrsN` revisions that sort as text (`tsrs10` < `tsrs9`), so always pin exactly.

## How things are wired

- **CLI typecheck**: `bun run typecheck` → `effect-tsgo tsrs -p .` (Effect-patched tsrs, no
  node_modules patching). Also run by lefthook pre-commit. Effect plugin options live in
  `tsconfig.json` → `compilerOptions.plugins[@effect/language-service]`.
- **Lint**: `bun run lint` → stock `oxlint`; type-aware rules run on stock `tsrs-lint`. No Effect rules
  here (by design, see blockers).
- **Neovim** (`~/.config/nvim/lsp/tsrs.lua`): starts `effect-tsgo tsrs --lsp --stdio` when
  `node_modules/.bin/effect-tsgo` exists, else plain `tsrs --lsp --stdio`. Oxlint LSP
  (`~/.config/nvim/lua/plugins/lsp.lua`) uses `typeAware = true`, no type-check (would duplicate tsrs).
- **Not used**: `effect-tsgo patch --tsrs` — in 0.73.4 it fails with
  `DiscoveryError: Unable to discover an installed typescript binary` when `typescript` isn't installed.

## Open blockers / things to watch

1. **tsrs upgrade** blocked until `@effect/tsgo` lists the newer tsrs version as supported.
2. **Effect rules in oxlint** (`effect-tsgo oxlint --type-aware`) blocked: needs `@effect/tsgo` to support
   the installed oxlint (≥1.95). Even then, only adopt if wanted in `bun run lint`; in the editor the tsrs
   LSP already reports Effect diagnostics (enabling both = duplicates).
3. **`effect-tsgo patch --tsrs`** bug (requires `typescript`). If fixed, patching could let plain
   `tsrs` / editor tsdk pick up Effect diagnostics without the wrapper. Optional.
4. **Unstable APIs**: `effect/cli` and `@effect/platform-bun` are `@stability unstable` and allowed via
   `allowedUnstableApis` in tsconfig. Check if they became stable (then remove the allowance).
5. Is there a tsrs **stable** (`7.1.0-tsrsN`, non-beta) release yet?

## Check procedure

```sh
# 1. Latest versions
npm view effect dist-tags
npm view @effect/platform-bun dist-tags
npm view @effect/tsgo dist-tags
npm view tsrs dist-tags
npm view oxlint version
npm view oxfmt version

# 2. What the latest @effect/tsgo supports (see "Supported Package Versions" table)
npm view @effect/tsgo@latest readme | sed -n '/supported-components:start/,/supported-components:end/p'

# 3. Installed versions
bun pm ls | grep -E 'effect|tsrs|oxlint|oxfmt'
npx effect-tsgo tsrs --version   # should show +effect-tsgo.<ver> and the installed tsrs version
```

Also skim release notes / issues for breaking changes:

- https://github.com/Effect-TS/tsgo (releases, README "Supported Package Versions")
- https://github.com/Effect-TS/effect-smol/releases (Effect v4)
- https://github.com/oxc-project/tsrs/releases and issue #834 (native Effect diagnostics in tsrs)
- https://github.com/oxc-project/oxc/releases (oxlint)

## Verify after any upgrade

```sh
bun install
bun run check && bun test
bun src/index.ts world                 # → "hello world"

# Effect diagnostics must still fire through tsrs (expect exit 2 + effect(floatingEffect)):
printf 'import { Effect } from "effect";\nexport const f = () => { Effect.log("x"); };\n' > src/_probe.ts
bun run typecheck; rm src/_probe.ts

# Only if attempting Effect rules in oxlint:
npx effect-tsgo oxlint --type-aware src
```

In Neovim: open a `.ts` file, `:checkhealth vim.lsp` → the `tsrs` client version should contain
`+effect-tsgo`, and the probe above should show `effect(floatingEffect)` exactly once.

## Upgrade rules

- Bump `@effect/tsgo` first, then set `tsrs` (exact) to the newest version it supports.
- Keep `effect` and `@effect/*` packages on the same version.
- Only bump `oxlint` freely while Effect rules are not routed through oxlint; if they are, keep it within
  `@effect/tsgo`'s supported range.
- Update the "Current state" table and date in this file after changes.
