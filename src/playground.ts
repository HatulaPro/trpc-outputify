import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure
		.use((m) => {
			return m.next({ ctx: m.ctx });
		})
		.input(z.string())
		.use((m) => {
			return m.next({ ctx: m.ctx });
		})
		.query(() => {
			return { z: 'asd' };
		}),
});
