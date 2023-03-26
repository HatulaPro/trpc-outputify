import { Project } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import { handleFile } from './file';

describe('Testing the entire transformation process', () => {
	const project = new Project({
		compilerOptions: {
			tsConfigFilePath: './tsconfig.json',
			strict: true,
		},
	});
	it('Should add an output right after the input', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`import { initTRPC } from '@trpc/server';
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
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.input(z.string()).output(/* BEGIN GENERATED CONTENT */ z.object({ z: z.string() }) /* END GENERATED CONTENT */)'
		);
	});

	it('Should create an output right before the RPC', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.use((m) => {
						return m.next({ ctx: m.ctx });
					})
					.use((m) => {
						return m.next({ ctx: m.ctx });
					})
					.query(() => {
						return { z: 'asd' };
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.object({ z: z.string() }) /* END GENERATED CONTENT */).query'
		);
	});

	it('Should create an output right before the RPC', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.query(() => {
						return { z: 'asd' };
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.object({ z: z.string() }) /* END GENERATED CONTENT */).query'
		);
	});

	it('Should update the output', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.output(z.object({z: z.string()}))
					.query(() => {
						return { z: 'asd' };
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.object({ z: z.string() }) /* END GENERATED CONTENT */)'
		);
	});

	it('Should set the output type to be `z.string()`.', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.output(z.object({z: z.string()}))
					.query(() => {
						return "bluh";
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.string() /* END GENERATED CONTENT */)'
		);
	});

	it('Should unwrap the promise and set the output type to be `z.string()`.', () => {
		const f = project.createSourceFile(
			'asdasd.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.output(z.object({z: z.string()}))
					.query(async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return 69420;
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.number() /* END GENERATED CONTENT */)'
		);
	});

	it('Should unwrap the promise and set the output type to be `z.union([z.number(), z.literal("one"), z.literal("two")])`.', () => {
		const f = project.createSourceFile(
			'asdasd.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.output(z.object({z: z.string()}))
					.query(async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return Math.random() < 0.5 ? 'one' : Math.random() < 0.5 ? 17n : Math.random();
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.union([z.number(), z.literal("one"), z.literal(17n)]) /* END GENERATED CONTENT */)'
		);
	});

	it('Should set the output type to be `z.date()`.', () => {
		const f = project.createSourceFile(
			'asdasd.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.output(z.object({z: z.string()}))
					.query(() => {
						class Date {
							thing: number;
			
							constructor() {
								this.thing = 12;
							}
						}
						return new Date();
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).not.contain('z.date()');
	});

	it("Should unwrap the promise and detect the array's value.", () => {
		const f = project.createSourceFile(
			'asdasd.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.output(z.object({z: z.string()}))
					.query(async () => {
						await new Promise((resolve) => setTimeout(resolve, 100));
						return [1, 2, 3].map((x) => x % 2 === 0 ? x : x.toString());
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.array(z.union([z.string(), z.number()])) /* END GENERATED CONTENT */)'
		);
	});
	it('Should handle a readonly number array like a normal number array.', () => {
		const f = project.createSourceFile(
			'asdasd.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.output(z.object({z: z.string()}))
					.query(() => {
						return [1, 2, 3] as readonly number[];
					}),
			});
			`,
			{ overwrite: true }
		);

		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.array(z.number()) /* END GENERATED CONTENT */)'
		);
	});

	it('Should throw an error, because function can not be serialized.', () => {
		const f = project.createSourceFile(
			'asdasd.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure
					.input(z.string())
					.query(() => {
						return {
							x: Math.random(),
							y: Math.random,
						};
					}),
			});
			`,
			{ overwrite: true }
		);
		expect(() => handleFile(project)(f)).toThrowError();
	});

	it('Should handle null, undefined and unions correctly.', () => {
		const f = project.createSourceFile(
			'1234.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			type Thing = {
				x: number;
				y?: number;
			};
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure.query(() => {
					if (Math.random() < 0.5) {
						return { x: 1, y: 2 } as Thing;
					} else if (Math.random() < 0.5) {
						return null;
					}
					return { x: 1 } as Thing;
				}),
			});
			`,
			{ overwrite: true }
		);
		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.object({ x: z.number(), y: z.number().optional() }).nullable() /* END GENERATED CONTENT */)'
		);
	});

	it('Should handle tuples correctly.', () => {
		const f = project.createSourceFile(
			'1234.ts',
			`import { initTRPC } from '@trpc/server';

			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure.query(() => {
					return [Math.random(), Math.random().toString()] as const;
				}),
			});`,
			{ overwrite: true }
		);
		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.tuple([z.number(), z.string()]) /* END GENERATED CONTENT */)'
		);
	});

	it('Should handle rest tuples correctly.', () => {
		const f = project.createSourceFile(
			'1234.ts',
			`import { initTRPC } from '@trpc/server';

			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure.query(() => {
					return [Math.random(), false, Math.random().toString()] as [number, false, ...string[]];
				}),
			});`,
			{ overwrite: true }
		);
		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.tuple([z.number(), z.literal(false)]).rest(z.string()) /* END GENERATED CONTENT */)'
		);
	});

	it('Should ignore the marked procedure and update the unmarked procedure.', () => {
		const f = project.createSourceFile(
			'1234.ts',
			`import { initTRPC } from '@trpc/server';
			import { z } from 'zod';
			
			const t = initTRPC.context().create();
			t.router({
				myProc: t.procedure.query(
					/* @outputify-ignore */ () => {
						return Math.random();
					}
				),
				myOtherProc: t.procedure.query(() => "HELLO"),
			});`,
			{ overwrite: true }
		);
		handleFile(project)(f);
		project.emitToMemory();
		const text = f.getText();
		expect(text).not.toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.number() /* END GENERATED CONTENT */)'
		);
		expect(text).toContain(
			'.output(/* BEGIN GENERATED CONTENT */ z.string() /* END GENERATED CONTENT */)'
		);
	});
});
