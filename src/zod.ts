import { ts, Type, SyntaxKind, TypeFlags, type Node } from 'ts-morph';
import { ElementFlags, isSymbolProperty, isVoid } from './types';
import {
	areAllSameEnumMembers,
	getTupleElementsAndFlags,
	getValueOfBooleanLiteral,
	isBigIntLiteral,
	isDateType,
	isFunction,
	isMapType,
	isRecordType,
	isSetType,
	removePromiseFromType,
	simplifyIntersectionType,
	squashUnionTypes,
} from './types';

type ZodWriter = {
	node: Node<ts.Node>;
	f: ts.NodeFactory;
	t: Type<ts.Type>;
	depth: number;
};

export function writeZodType(
	node: Node<ts.Node>,
	f: ts.NodeFactory,
	t: Type<ts.Type>
) {
	const promised = removePromiseFromType(t, node);
	return [
		wrapWithComments(
			writeZodTypeRecursive({ node, f, t: promised, depth: 0 })
		),
	];
}

function writeZodTypeRecursive({
	node,
	f,
	t,
	depth,
}: ZodWriter): ts.Expression {
	if (depth > 50) {
		throw new Error('Can not handle recursive types');
	}
	depth++;
	if (isFunction(t)) {
		throw new Error('Can not serialize functions');
	}
	if (t.isString()) {
		return writeSimpleZodValidator(f, 'string');
	} else if (t.isNumber()) {
		return writeSimpleZodValidator(f, 'number');
	} else if (t.isBoolean()) {
		return writeSimpleZodValidator(f, 'boolean');
	} else if ((t.getFlags() & TypeFlags.BigInt) === TypeFlags.BigInt) {
		return writeSimpleZodValidator(f, 'bigint');
	} else if (t.isNull()) {
		return writeSimpleZodValidator(f, 'null');
	} else if (t.isUndefined()) {
		return writeSimpleZodValidator(f, 'undefined');
	} else if (t.isAny()) {
		return writeSimpleZodValidator(f, 'any');
	} else if (t.isUnion()) {
		return writeUnionType({ node, f, t, depth });
	} else if (t.isLiteral()) {
		if (t.isNumberLiteral()) {
			return writeSimpleZodValidator(f, 'literal', [
				f.createNumericLiteral(t.getLiteralValue() as number),
			]);
		} else if (t.isStringLiteral()) {
			return writeSimpleZodValidator(f, 'literal', [
				f.createStringLiteral(t.getLiteralValue() as string),
			]);
		} else if (t.isBooleanLiteral()) {
			const literalValue = getValueOfBooleanLiteral(t);
			return writeSimpleZodValidator(f, 'literal', [
				literalValue ? f.createTrue() : f.createFalse(),
			]);
		}
	} else if (isBigIntLiteral(t)) {
		return writeSimpleZodValidator(f, 'literal', [
			f.createBigIntLiteral(t.getLiteralValue() as ts.PseudoBigInt),
		]);
	} else if (t.isArray()) {
		return writeArrayType({ node, f, t, depth });
	} else if (t.isTuple()) {
		return writeTupleType({ node, f, t, depth });
	} else if (isDateType(t)) {
		return writeSimpleZodValidator(f, 'date');
	} else if (isSetType(t)) {
		return writeSetType({ node, f, t, depth });
	} else if (isMapType(t)) {
		return writeMapType({ node, f, t, depth });
	} else if (isRecordType(t)) {
		return writeRecordType({ node, f, t, depth });
	} else if (t.isObject()) {
		return writeObjectType({ node, f, t, depth });
	} else if (t.isIntersection()) {
		return writeIntersectionType({ node, f, t, depth });
	} else if (isVoid(t)) {
		return writeSimpleZodValidator(f, 'void');
	}
	return writeSimpleZodValidator(f, 'never');
}

function wrapWithComments(node: ts.Expression) {
	return ts.addSyntheticTrailingComment(
		ts.addSyntheticLeadingComment(
			node,
			SyntaxKind.MultiLineCommentTrivia,
			' BEGIN GENERATED CONTENT '
		),
		SyntaxKind.MultiLineCommentTrivia,
		' END GENERATED CONTENT '
	);
}

function wrapWithModifier(
	node: ts.Expression,
	f: ts.NodeFactory,
	modifier: string
) {
	return f.createCallExpression(
		f.createPropertyAccessExpression(node, modifier),
		[],
		[]
	);
}

function writeUnionType({ node, f, t, depth }: ZodWriter) {
	depth++;
	const unionTypes = t.getUnionTypes();
	const hasNull = unionTypes.find((type) => type.isNull());
	const hasUndefined = unionTypes.find((type) => type.isUndefined());
	const filteredUnionTypes = squashUnionTypes(
		unionTypes
			.filter((type) => !type.isNull() && !type.isUndefined())
			.map(simplifyIntersectionType)
	);
	const isStringLiteralsUnion = filteredUnionTypes.every((x) =>
		x.isStringLiteral()
	);
	const isNativeEnum = areAllSameEnumMembers(filteredUnionTypes);

	if (filteredUnionTypes.length === 0) {
		return wrapWithModifier(
			writeSimpleZodValidator(f, 'undefined'),
			f,
			'nullable'
		);
	}

	const currentZodType = isNativeEnum
		? writeSimpleZodValidator(f, 'nativeEnum', [
				f.createIdentifier(isNativeEnum),
		  ])
		: filteredUnionTypes.length === 1
		? writeZodTypeRecursive({
				node,
				f,
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				t: filteredUnionTypes[0]!,
				depth,
		  })
		: f.createCallExpression(
				f.createPropertyAccessExpression(
					f.createIdentifier('z'),
					f.createIdentifier(isStringLiteralsUnion ? 'enum' : 'union')
				),
				undefined,
				[
					f.createArrayLiteralExpression(
						filteredUnionTypes.map((unionType) =>
							isStringLiteralsUnion
								? f.createStringLiteral(
										unionType.getLiteralValue() as string
								  )
								: writeZodTypeRecursive({
										node,
										f,
										t: unionType,
										depth,
								  })
						),
						false
					),
				]
		  );

	if (hasNull && hasUndefined) {
		return wrapWithModifier(currentZodType, f, 'nullish');
	}
	if (hasNull) {
		return wrapWithModifier(currentZodType, f, 'nullable');
	}
	if (hasUndefined) {
		return wrapWithModifier(currentZodType, f, 'optional');
	}
	return currentZodType;
}

function writeIntersectionType({ node, f, t, depth }: ZodWriter) {
	depth++;

	function writeIntersectionTypeRecursive(
		types: Type<ts.Type>[]
	): ts.CallExpression {
		const [first, ...rest] = types;
		if (rest.length > 1) {
			return writeSimpleZodValidator(f, 'intersection', [
				writeObjectType({ node, f, t: first!, depth }),
				writeIntersectionTypeRecursive(rest),
			]);
		} else if (rest.length === 1) {
			return writeSimpleZodValidator(f, 'intersection', [
				writeObjectType({ node, f, t: first!, depth }),
				writeObjectType({ node, f, t: rest[0]!, depth }),
			]);
		}
		return writeObjectType({ node, f, t: first!, depth });
	}

	const intersectionTypes = t.getIntersectionTypes();
	if (intersectionTypes.length === 1) {
		return writeZodTypeRecursive({
			node,
			f,
			t: intersectionTypes[0]!,
			depth,
		});
	}
	if (intersectionTypes.every((type) => type.isObject())) {
		if (intersectionTypes.length === 0)
			throw new Error('Invalid intersection detected.');
		return writeIntersectionTypeRecursive(intersectionTypes);
	}
	return writeZodTypeRecursive({
		node,
		f,
		t: simplifyIntersectionType(t),
		depth,
	});
}

function writeArrayType({ node, f, t, depth }: ZodWriter) {
	depth++;
	const elType = t.getArrayElementType();
	if (elType) {
		return writeSimpleZodValidator(f, 'array', [
			writeZodTypeRecursive({ node, f, t: elType, depth }),
		]);
	} else {
		return writeSimpleZodValidator(f, 'array', [
			writeSimpleZodValidator(f, 'any'),
		]);
	}
}

function writeTupleType({ node, f, t, depth }: ZodWriter) {
	depth++;
	const elsAndFlags = getTupleElementsAndFlags(t);
	const restType =
		elsAndFlags[elsAndFlags.length - 1]?.flag === ElementFlags.Rest
			? elsAndFlags.pop()
			: undefined;

	if (elsAndFlags.find(({ flag }) => flag !== ElementFlags.Required)) {
		throw new Error('Complex tuples are not supported by zod (or us)');
	}

	const mainElementsExpression = writeSimpleZodValidator(f, 'tuple', [
		f.createArrayLiteralExpression(
			elsAndFlags.map(({ element }) =>
				writeZodTypeRecursive({ node, f, t: element, depth })
			)
		),
	]);
	if (restType) {
		return f.createCallExpression(
			f.createPropertyAccessExpression(mainElementsExpression, 'rest'),
			[],
			[writeZodTypeRecursive({ node, f, t: restType.element, depth })]
		);
	}

	return mainElementsExpression;
}

function writeSetType({ node, f, t, depth }: ZodWriter) {
	depth++;
	const elType = t.getTypeArguments()[0];
	if (elType) {
		return writeSimpleZodValidator(f, 'set', [
			writeZodTypeRecursive({ node, f, t: elType, depth }),
		]);
	} else {
		return writeSimpleZodValidator(f, 'set', [
			writeSimpleZodValidator(f, 'any'),
		]);
	}
}

function writeMapType({ node, f, t, depth }: ZodWriter) {
	depth++;
	const [elKeyType, elValueType] = t.getTypeArguments();
	if (elKeyType && elValueType) {
		return writeSimpleZodValidator(f, 'map', [
			writeZodTypeRecursive({ node, f, t: elKeyType, depth }),
			writeZodTypeRecursive({ node, f, t: elValueType, depth }),
		]);
	} else {
		return writeSimpleZodValidator(f, 'map', [
			writeSimpleZodValidator(f, 'any'),
			writeSimpleZodValidator(f, 'any'),
		]);
	}
}

function writeRecordType({ node, f, t, depth }: ZodWriter) {
	depth++;
	const [elKeyType, elValueType] = t.getAliasTypeArguments();
	if (elKeyType && elValueType) {
		return writeSimpleZodValidator(f, 'record', [
			writeZodTypeRecursive({ node, f, t: elKeyType, depth }),
			writeZodTypeRecursive({ node, f, t: elValueType, depth }),
		]);
	} else {
		return writeSimpleZodValidator(f, 'record', [
			writeSimpleZodValidator(f, 'any'),
			writeSimpleZodValidator(f, 'any'),
		]);
	}
}

function writeObjectType({ node, f, t, depth }: ZodWriter) {
	depth++;
	const propertiesAndTypes = t
		.getApparentProperties()
		.map((x) => {
			return [x.getName(), x.getTypeAtLocation(node)] as const;
		})
		.filter(
			([propName, type]) =>
				!isFunction(type) && !isSymbolProperty(propName)
		);

	return writeSimpleZodValidator(f, 'object', [
		f.createObjectLiteralExpression(
			propertiesAndTypes.map(([propName, type]) =>
				f.createPropertyAssignment(
					f.createIdentifier(propName),
					writeZodTypeRecursive({ node, f, t: type, depth })
				)
			)
		),
	]);
}

function writeSimpleZodValidator(
	f: ts.NodeFactory,
	validatorName: string,
	argumentsArray?: ts.Expression[]
) {
	return f.createCallExpression(
		f.createPropertyAccessExpression(
			f.createIdentifier('z'),
			f.createIdentifier(validatorName)
		),
		undefined,
		argumentsArray
	);
}
