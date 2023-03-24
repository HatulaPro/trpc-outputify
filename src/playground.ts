/* eslint-disable */
// @ts-nocheck

const procedure = {
	input: (x: number) => ({
		value: x * x,
		query: (f: () => { z: string }) => f,
		output: (x: object) => ({
			value: x,
			query: (f: () => { z: string }) => f,
		}),
	}),
};

export function x<T>(y: T) {
	return {
		abc: procedure
			.input(987987)
			.testing(() => console.log(whoknows.input(123).cake().query()))
			.something([1, 23])
			.output('{ z: string; }')
			.query(() => {
				return { z: 'asd' };
			}),
		y,
	};
}
