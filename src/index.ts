import { BunRuntime } from "@effect/platform-bun";
import { Console, Effect } from "effect";

import { hello } from "./hello";

const program = Effect.gen(function* () {
	const greeting = yield* hello("tmlp");
	yield* Console.log(greeting);

	const fallback = yield* hello("   ").pipe(
		Effect.catchTag("EmptyNameError", () => Effect.succeed("hello stranger")),
	);
	yield* Console.log(fallback);
});

BunRuntime.runMain(program);
