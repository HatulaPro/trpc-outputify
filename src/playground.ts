import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure
		.output(
			/* BEGIN GENERATED CONTENT */ z.record(
				z.union([z.number(), z.literal('?')]),
				z.string()
			) /* END GENERATED CONTENT */
		)
		.query(() => {
			return { 1: 'hello', 2: 'wow', 3: 'nice', '?': 'lol' } as Record<
				number | '?',
				string
			>;
		}),
});
