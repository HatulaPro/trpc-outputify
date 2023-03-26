import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure.query(() => {
		return {
			z: 'asd',
			y: new Set([1, 2, 3]),
			x: new Map([
				['hey', 1],
				['wow', 2],
			]),
		};
	}),
});
