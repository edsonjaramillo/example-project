import cloudflare from "@cloudflare/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
	...cloudflare,
	rules: {
		...cloudflare.rules,
		// Effect.fn / Effect.gen bodies often have no `yield` (pure logic); that's idiomatic.
		"require-yield": "off",
	},
});
