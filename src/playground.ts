import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
export const router = t.router({
	myProc: t.procedure
		.output(
			/* BEGIN GENERATED CONTENT */ z.object(
				{}
			) /* END GENERATED CONTENT */
		)
		.query(({ ctx }) => {
			return new WeakSet([{ x: 45 }, { x: 89 }]);
		}),
});
