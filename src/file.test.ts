import { Project } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import { handleFile } from './file';

describe('Testing the entire transformation process', () => {
	const project = new Project({
		compilerOptions: {
			tsConfigFilePath: './tsconfig.json',
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
			'.input(z.string()).output(/* BEGIN GENERATED CONTENT */ "{ z: string; }" /* END GENERATED CONTENT */)'
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
			'.output(/* BEGIN GENERATED CONTENT */ "{ z: string; }" /* END GENERATED CONTENT */).query'
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
			'.output(/* BEGIN GENERATED CONTENT */ "{ z: string; }" /* END GENERATED CONTENT */)'
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
});
