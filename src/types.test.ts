import { SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import { createProject } from './file';
import {
	ElementFlags,
	areAllSameEnumMembers,
	getTupleElementsAndFlags,
	getValueOfBooleanLiteral,
	isDateType,
	isMapType,
	isRecordType,
	isSetType,
	removePromiseFromType,
} from './types';

const project = createProject('./tsconfig.json');
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
		const resultType = removePromiseFromType(type, types[0]!);

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
		const resultType = removePromiseFromType(type, types[0]!);
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
		const resultType = removePromiseFromType(type, types[0]!);
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

describe('should detect values correctly', () => {
	it('should return the right types', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`
			const x = new Date();
			const y = new Set([1, 2]);
			const z = new Map([[1, 'bluh']]);
			const w: Record<string, number> = {'a': 1, 'b': 2};
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
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const shouldBeRecord = types[3]!.getType();

		expect(isDateType(shouldBeDate)).toBe(true);
		expect(isDateType(shouldBeSet)).toBe(false);
		expect(isDateType(shouldBeMap)).toBe(false);
		expect(isDateType(shouldBeRecord)).toBe(false);

		expect(isSetType(shouldBeDate)).toBe(false);
		expect(isSetType(shouldBeSet)).toBe(true);
		expect(isSetType(shouldBeMap)).toBe(false);
		expect(isDateType(shouldBeRecord)).toBe(false);

		expect(isMapType(shouldBeDate)).toBe(false);
		expect(isMapType(shouldBeSet)).toBe(false);
		expect(isMapType(shouldBeMap)).toBe(true);
		expect(isDateType(shouldBeRecord)).toBe(false);

		expect(isRecordType(shouldBeDate)).toBe(false);
		expect(isRecordType(shouldBeSet)).toBe(false);
		expect(isRecordType(shouldBeMap)).toBe(false);
		expect(isRecordType(shouldBeRecord)).toBe(true);
	});
});

describe('should detect tuple values correctly', () => {
	it('should detect a standard tuple', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`const x = [1, 'bluh'] as [number, string];`,
			{ overwrite: true }
		);

		const tuple = f.getFirstDescendantByKindOrThrow(
			SyntaxKind.VariableDeclaration
		);
		const elsAndFlags = getTupleElementsAndFlags(tuple.getType());
		expect(elsAndFlags).length(2);
		expect(elsAndFlags[0]?.element?.getText()).toBe('number');
		expect(elsAndFlags[1]?.element?.getText()).toBe('string');
		expect(elsAndFlags[0]?.flag).toBe(ElementFlags.Required);
		expect(elsAndFlags[1]?.flag).toBe(ElementFlags.Required);
	});

	it('should detect a tuple with an optional element', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`const x = [1, 'bluh', true?] as [number, string, boolean?];`,
			{ overwrite: true }
		);

		const tuple = f.getFirstDescendantByKindOrThrow(
			SyntaxKind.VariableDeclaration
		);
		const elsAndFlags = getTupleElementsAndFlags(tuple.getType());
		expect(elsAndFlags).length(3);
		expect(elsAndFlags[0]?.element?.getText()).toBe('number');
		expect(elsAndFlags[1]?.element?.getText()).toBe('string');
		expect(elsAndFlags[2]?.element?.getText()).toBe('boolean | undefined');
		expect(elsAndFlags[0]?.flag).toBe(ElementFlags.Required);
		expect(elsAndFlags[1]?.flag).toBe(ElementFlags.Required);
		expect(elsAndFlags[2]?.flag).toBe(ElementFlags.Optional);
	});

	it('should detect a tuple with rest elements', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`const x = [1, 'a', 'b', 'c'] as [number, ...string[]];`,
			{ overwrite: true }
		);

		const tuple = f.getFirstDescendantByKindOrThrow(
			SyntaxKind.VariableDeclaration
		);
		const elsAndFlags = getTupleElementsAndFlags(tuple.getType());
		expect(elsAndFlags).length(2);
		expect(elsAndFlags[0]?.element?.getText()).toBe('number');
		expect(elsAndFlags[1]?.element?.getText()).toBe('string');
		expect(elsAndFlags[1]?.flag).toBe(ElementFlags.Rest);
	});
});

describe('should detect enum values correctly', () => {
	it('should detect an all-enum situation', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`enum Color {
				Blue,
				Red,
				Green,
			}
			const x: Color = Math.random() < 0.5 ? Color.Blue : Math.random() < 0.5 ? Color.Red : Color.Green;
			`,
			{ overwrite: true }
		);

		const enumVar = f.getFirstDescendantByKindOrThrow(
			SyntaxKind.VariableDeclaration
		);
		const enumLiterals = enumVar.getType().getUnionTypes();
		const areSame = areAllSameEnumMembers(enumLiterals);
		expect(areSame).toBe('Color');
	});

	it('should not detect an all-enum situation because the types are used as literals', () => {
		const f = project.createSourceFile(
			'newfile.ts',
			`enum Color {
				Blue,
				Red,
				Green,
			}
			const x = Math.random() < 0.5 ? Color.Blue : Color.Green;
			`,
			{ overwrite: true }
		);

		const enumVar = f.getFirstDescendantByKindOrThrow(
			SyntaxKind.VariableDeclaration
		);
		const enumLiterals = enumVar.getType().getUnionTypes();
		const areSame = areAllSameEnumMembers(enumLiterals);
		expect(areSame).toBe(undefined);
	});
});
