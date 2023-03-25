import { ts, type Type, SyntaxKind, TypeFlags, type Node } from 'ts-morph';
import {
	getValueOfBooleanLiteral,
	isBigIntLiteral,
	isDateType,
	isFunction,
	removePromiseFromType,
} from './types';

export function writeZodType(
	node: Node<ts.Node>,
	f: ts.NodeFactory,
	t: Type<ts.Type>
) {
	const promised = removePromiseFromType(t);
	return [wrapWithComments(writeZodTypeRecursive(node, f, promised))];
}

function writeZodTypeRecursive(
	node: Node<ts.Node>,
	f: ts.NodeFactory,
	t: Type<ts.Type>
): ts.Expression {
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
		return writeUnionType(node, f, t);
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
		return writeArrayType(node, f, t);
	} else if (isDateType(t)) {
		return writeSimpleZodValidator(f, 'date');
	} else if (t.isObject()) {
		return writeObjectType(node, f, t);
	}
	return f.createStringLiteral(t.getText());
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

function writeUnionType(
	node: Node<ts.Node>,
	f: ts.NodeFactory,
	t: Type<ts.Type>
) {
	const unionTypes = t.getUnionTypes();
	return f.createCallExpression(
		f.createPropertyAccessExpression(
			f.createIdentifier('z'),
			f.createIdentifier('union')
		),
		undefined,
		[
			f.createArrayLiteralExpression(
				unionTypes.map((unionType) =>
					writeZodTypeRecursive(node, f, unionType)
				),
				false
			),
		]
	);
}

function writeArrayType(
	node: Node<ts.Node>,
	f: ts.NodeFactory,
	t: Type<ts.Type>
) {
	const elType = t.getArrayElementType();
	if (elType) {
		return writeSimpleZodValidator(f, 'array', [
			writeZodTypeRecursive(node, f, elType),
		]);
	} else {
		return writeSimpleZodValidator(f, 'array', [
			writeSimpleZodValidator(f, 'any'),
		]);
	}
}

function writeObjectType(
	node: Node<ts.Node>,
	f: ts.NodeFactory,
	t: Type<ts.Type>
) {
	const propertiesAndTypes = t
		.getProperties()
		.map((x) => [x.getName(), x.getTypeAtLocation(node)] as const);

	return writeSimpleZodValidator(f, 'object', [
		f.createObjectLiteralExpression(
			propertiesAndTypes.map(([propName, type]) =>
				f.createPropertyAssignment(
					f.createIdentifier(propName),
					writeZodTypeRecursive(node, f, type)
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
