import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure
    .use((m) => {
    return m.next({ ctx: m.ctx });
})
    .input(z.string())
    .output(/* BEGIN GENERATED CONTENT */ z.null() /* END GENERATED CONTENT */)
		.use((m) => {
			return m.next({ ctx: m.ctx });
		})
		.query<null>(async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));
			return null;
		}),
});
