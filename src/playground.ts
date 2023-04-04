import { initTRPC } from '@trpc/server';
import { z } from 'zod';

type GetStaticProperties<T> = Pick<
	T,
	{
		[K in keyof T]: T[K] extends Function ? never : K;
	}[keyof T]
>;

const t = initTRPC.context().create();
export const router = t.router({
	myProc: t.procedure
		.output(
			/* BEGIN GENERATED CONTENT */ z.intersection(
				z.object({
					E: z.number(),
					LN10: z.number(),
					LN2: z.number(),
					LOG2E: z.number(),
					LOG10E: z.number(),
					PI: z.number(),
					SQRT1_2: z.number(),
					SQRT2: z.number(),
				}),
				z.intersection(
					z.object({
						prototype: z.object({}),
						MAX_VALUE: z.number(),
						MIN_VALUE: z.number(),
						NaN: z.number(),
						NEGATIVE_INFINITY: z.number(),
						POSITIVE_INFINITY: z.number(),
						EPSILON: z.number(),
						MAX_SAFE_INTEGER: z.number(),
						MIN_SAFE_INTEGER: z.number(),
					}),
					z.object({ color: z.string() })
				)
			) /* END GENERATED CONTENT */
		)
		.query(({ ctx }) => {
			return {
				EPSILON: 123123,
				color: 'blue',
			} as typeof Math &
				GetStaticProperties<typeof Number> & {
					color: 'red' | 'blue' | (string & {});
				};
		}),
});
