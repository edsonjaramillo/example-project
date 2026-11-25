## Effect + tsrs

Type checking runs through `effect-tsgo tsrs` (`bun run typecheck`), the Effect-patched build of the installed `tsrs`,
so Effect Language Service diagnostics (configured under `compilerOptions.plugins` in `tsconfig.json`) are reported
as regular type errors. `tsrs` is pinned to a version supported by `@effect/tsgo`; bump both together.

For editor support, point your LSP client at `bunx effect-tsgo tsrs --lsp --stdio`.
