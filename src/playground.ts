import { initTRPC } from '@trpc/server';
import { z } from 'zod';

function getColor() {
	return (['red', 'blue', 'green'] as const)[Math.floor(Math.random() * 3)]!;
}

function getAge() {
	return Math.random() * 120;
}

const t = initTRPC.context().create();
export const router = t.router({
	myProc: t.procedure
		.output(
			/* BEGIN GENERATED CONTENT */ z.object({
				name: z.string(),
				favoriteColor: z.enum(['red', 'blue', 'green']),
				age: z.number(),
			}) /* END GENERATED CONTENT */
		)
		.query(() => {
			return {
				name: 'John ' + 'Smith',
				favoriteColor: getColor(),
				age: getAge(),
			};
		}),
});
