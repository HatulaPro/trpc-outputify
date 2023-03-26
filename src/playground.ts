import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
function f() {
	return {
		x: 1,
	};
}
t.router({
	myProc: t.procedure
		.output(
			/* BEGIN GENERATED CONTENT */ z.object({
				x: z.number(),
			}) /* END GENERATED CONTENT */
		)
		.query(f),
});
