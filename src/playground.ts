import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure
		.output(
			/* BEGIN GENERATED CONTENT */ z.object({
				z: z.string(),
			}) /* END GENERATED CONTENT */
		)
		.query(() => {
			return { z: 'asd' };
		}),
});
