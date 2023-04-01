import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
export const router = t.router({
	myProc: t.procedure.query(({ ctx }) => {
		return { value: 123 };
	}),
});
