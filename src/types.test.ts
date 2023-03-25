import { project } from './index';
import { SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import {
	getValueOfBooleanLiteral,
	isDateType,
	isMapType,
	isSetType,
	removePromiseFromType,
} from './types';

describe('removePromiseFromType should turn Promise<T> into T', () => {
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

describe('should detect values correctly should work', () => {
	it('should return true', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`
			const x = new Date();
			const y = new Set([1, 2]);
			const z = new Map([[1, 'bluh']]);
			`,
			{ overwrite: true }
		);

		const types = f.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const shouldBeDate = types[0]!.getType();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const shouldBeSet = types[1]!.getType();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const shouldBeMap = types[2]!.getType();

		expect(isDateType(shouldBeDate)).toBe(true);
		expect(isDateType(shouldBeSet)).toBe(false);
		expect(isDateType(shouldBeMap)).toBe(false);

		expect(isSetType(shouldBeDate)).toBe(false);
		expect(isSetType(shouldBeSet)).toBe(true);
		expect(isSetType(shouldBeMap)).toBe(false);

		expect(isMapType(shouldBeDate)).toBe(false);
		expect(isMapType(shouldBeSet)).toBe(false);
		expect(isMapType(shouldBeMap)).toBe(true);
	});
});
