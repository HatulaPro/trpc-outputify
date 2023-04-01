import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
export const router = t.router({
	myProc: t.procedure
		.output(
			/* BEGIN GENERATED CONTENT */ z
				.literal(12)
				.optional() /* END GENERATED CONTENT */
		)
		.query(({ ctx }) => {
			if (Math.random() < 0.5) return 12;
		}),
});
