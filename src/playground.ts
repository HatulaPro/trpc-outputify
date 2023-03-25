import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure
		.use((m) => {
			return m.next({ ctx: m.ctx });
		})
		.input(z.string())
		.output(
			/* BEGIN GENERATED CONTENT */ z.object({
				name: z.string(),
				age: z.number(),
				birthday: z.date(),
				contact: z.object({
					email: z.string(),
					phone: z.object({ home: z.string(), work: z.string() }),
				}),
				preferences: z.object({
					colors: z.array(
						z.union([
							z.literal('blue'),
							z.literal('green'),
							z.literal('red'),
						])
					),
					food: z.object({
						breakfast: z.string(),
						lunch: z.string(),
						dinner: z.string(),
					}),
				}),
				run: z.object({}),
			}) /* END GENERATED CONTENT */
		)
		.use((m) => {
			return m.next({ ctx: m.ctx });
		})
		.query(() => {
			const deeplyNestedObject = {
				name: 'John Doe',
				age: 30,
				birthday: new Date('2001-03-05'),
				contact: {
					email: 'johndoe@example.com',
					phone: {
						home: '555-1234',
						work: '555-5678',
					},
				},
				preferences: {
					colors: ['blue', 'green'] as ('blue' | 'green' | 'red')[],
					food: {
						breakfast: 'cereal',
						lunch: 'sandwich',
						dinner: 'pasta',
					},
				},
				run() {
					return 'ok';
				},
			};
			return deeplyNestedObject;
		}),
});
