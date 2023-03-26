import { initTRPC } from '@trpc/server';
import { z } from 'zod';

type MyType = {
	name: string;
	data: MyType | undefined;
};

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure.query((): MyType => {
		return {
			name: '123',
			data: {
				name: '456',
				data: {
					name: '789',
					data: undefined,
				},
			},
		};
	}),
});
