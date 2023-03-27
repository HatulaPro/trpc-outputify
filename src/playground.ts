import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure.query(() => {
		return Math.random() ? 'A' : 'B';
	}),
});
