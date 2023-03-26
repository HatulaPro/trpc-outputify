import { initTRPC } from '@trpc/server';
import { z } from 'zod';

type MyTuple = [number, ...string[]];

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure.query(() => {
		return [
			Math.random(),
			Math.random().toString(),
			Math.random().toString(),
		] as MyTuple;
	}),
});
