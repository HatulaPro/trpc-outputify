import { Project, SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import { getValueOfBooleanLiteral, removePromiseFromType } from './types';

describe('removePromiseFromType should turn Promise<T> into T', () => {
	const project = new Project({
		compilerOptions: {
			tsConfigFilePath: './tsconfig.json',
		},
	});
	it('should get the type inside the promise', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`type X = Promise<number>;
			`,
			{ overwrite: true }
		);

		const types = f.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const type = types[0]!.getType();
		const resultType = removePromiseFromType(type);

		expect(resultType?.getText()).toBe('number');
	});
	it('should get the union type inside the promise', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`export type X = Promise<number | string>
			`,
			{ overwrite: true }
		);

		const types = f.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const type = types[0]!.getType();
		const resultType = removePromiseFromType(type);
		expect(resultType?.getText()).toBe('string | number');
	});

	it('should just return the type itself', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`export type X = string | number;
			`,
			{ overwrite: true }
		);

		const types = f.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const type = types[0]!.getType();
		const resultType = removePromiseFromType(type);
		expect(resultType.isUnion()).toBe(true);
		const unionTypes = resultType.getUnionTypes().map((x) => x.getText());
		expect(unionTypes).toContain('string');
		expect(unionTypes).toContain('number');
	});
});

describe('getValueOfBooleanLiteral should work', () => {
	const project = new Project({
		compilerOptions: {
			tsConfigFilePath: './tsconfig.json',
		},
	});
	it('should return true', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`const x = true as const;
			let y = false as const;`,
			{ overwrite: true }
		);

		const types = f.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const literalTrue = getValueOfBooleanLiteral(types[0]!.getType());
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const literalFalse = getValueOfBooleanLiteral(types[1]!.getType());
		expect(literalTrue).toBe(true);
		expect(literalFalse).toBe(false);
	});
});
