import { Config, Data, Effect } from "effect";

/** Raised when the caller passes a blank name. */
export class EmptyNameError extends Data.TaggedError("EmptyNameError") {}

/** Greeting word, overridable via the GREETING env var. */
const greetingConfig = Config.String("GREETING").pipe(Config.withDefault("hello"));

export const hello = Effect.fn("hello")(function* (name: string) {
	const trimmed = name.trim();
	if (trimmed === "") {
		return yield* new EmptyNameError();
	}

	const greeting = yield* greetingConfig;
	yield* Effect.logDebug("greeting user", { name: trimmed });

	return `${greeting} ${trimmed}`;
});
