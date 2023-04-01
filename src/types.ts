import { Node, TypeFlags, type ts, Type } from 'ts-morph';
import type { Type as TSType } from 'typescript';

export enum ElementFlags {
	Required = 1,
	Optional = 2,
	Rest = 4,
	Variadic = 8,
	Fixed = 3,
	Variable = 12,
	NonRequired = 14,
	NonRest = 11,
}

export function removePromiseFromType(t: Type<ts.Type>, node: Node<ts.Node>) {
	// Using native TS compiler function for more accuracy
	try {
		const res =
			// @ts-ignore
			new Type(
				// @ts-ignore
				node.getProject()._context,
				(
					node.getProject().getTypeChecker().compilerObject as any
				).getPromisedTypeOfPromise(t.compilerType) as TSType
			) as Type<ts.Type> | undefined;
		return res?.compilerType ? res : t;
	} catch {
		return t;
	}
}

export function getTupleElementsAndFlags(t: Type<ts.Type>) {
	const elements = t.getTupleElements();
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
	const elementFlags = ((t.compilerType as any)?.target)
		.elementFlags as ElementFlags[];
	if (Array.isArray(elementFlags) && elementFlags.length === elements.length)
		return elementFlags.map((flag, index) => {
			if (!elements[index]) throw new Error('Can not parse tuple');
			return {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				element: elements[index]!,
				flag,
			};
		});
	throw new Error('Not a tuple');
}

export function isBigIntLiteral(t: Type<ts.Type>) {
	return t.getLiteralFreshType()?.getFlags() === TypeFlags.BigIntLiteral;
}

export function getValueOfBooleanLiteral(t: Type<ts.Type>) {
	// eslint-disable-next-line
	const literalValue = // eslint-disable-next-line
		(t.getLiteralRegularType()?.compilerType.freshType as any)
			.intrinsicName as 'true' | 'false';
	return literalValue === 'true';
}

export function isDateType(t: Type<ts.Type>) {
	if (
		t.getSymbol()?.getEscapedName() === 'Date' &&
		t.getProperty('toUTCString') &&
		t.getProperty('toISOString') &&
		t.getProperty('getDate') &&
		t.getProperty('getTime')
	) {
		return true;
	}
	return false;
}

export function isSetType(t: Type<ts.Type>) {
	if (
		t.getSymbol()?.getEscapedName() === 'Set' &&
		t.getProperty('add') &&
		t.getProperty('has') &&
		t.getProperty('forEach') &&
		t.getProperty('delete')
	) {
		return true;
	}
	return false;
}

export function isMapType(t: Type<ts.Type>) {
	if (
		t.getSymbol()?.getEscapedName() === 'Map' &&
		t.getProperty('set') &&
		t.getProperty('has') &&
		t.getProperty('forEach') &&
		t.getProperty('delete')
	) {
		return true;
	}
	return false;
}

export function isRecordType(t: Type<ts.Type>) {
	if (
		t.isObject() &&
		t.getSymbol()?.getEscapedName() === '__type' &&
		t.getAliasSymbol()?.getName() === 'Record'
	) {
		return true;
	}
	return false;
}

export function areAllSameEnumMembers(types: Type<ts.Type>[]) {
	if (types.length === 0) return false;

	let parentEnum: Map<string, unknown> | undefined;
	let parentIdentifier: string | undefined;
	types.every((t) => {
		if (!t.isEnumLiteral()) return undefined;
		// eslint-disable-next-line
		// @ts-ignore
		// eslint-disable-next-line
		const parent = t.getSymbol()?.compilerSymbol.parent.exports;
		if (parentEnum) {
			return parent === parentEnum;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		parentEnum = parent;
		// eslint-disable-next-line
		parentIdentifier = t
			.getSymbol()
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			?.compilerSymbol.parent.getEscapedName();
		return true;
	});
	return parentEnum?.size === types.length ? parentIdentifier : undefined;
}

export function squashUnionTypes(types: Type<ts.Type>[]) {
	const hasString = types.some((t) => t.isString() && !t.isStringLiteral());
	const hasNumber = types.some((t) => t.isNumber() && !t.isNumberLiteral());

	return types.filter((t) => {
		if (hasString && t.isStringLiteral()) return false;
		if (hasNumber && t.isNumberLiteral()) return false;
		return true;
	});
}

export function simplifyIntersectionType(t: Type<ts.Type>) {
	if (!t.isIntersection()) return t;
	const types = t.getIntersectionTypes();
	if (types.length !== 2)
		throw new Error('Can not handle complex intersections.');

	const nonEmptyObject = types.find(
		(type) => !(type.isObject() && type.getProperties().length === 0)
	);
	if (nonEmptyObject) {
		return nonEmptyObject;
	}
	throw new Error('Can not handle complex intersections.');
}

export function isFunction(t: Type<ts.Type>) {
	return t.getCallSignatures().length > 0;
}
