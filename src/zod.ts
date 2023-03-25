import { ts, type Type, SyntaxKind, TypeFlags } from 'ts-morph';
import {
	getValueOfBooleanLiteral,
	isBigIntLiteral,
	removePromiseFromType,
} from './types';

export function writeZodType(f: ts.NodeFactory, t: Type<ts.Type>) {
	const promised = removePromiseFromType(t);
	return [wrapWithComments(writeZodTypeRecursive(f, promised))];
}

function writeZodTypeRecursive(
	f: ts.NodeFactory,
	t: Type<ts.Type>
): ts.Expression {
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
		return writeUnionType(f, t);
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

function writeUnionType(f: ts.NodeFactory, t: Type<ts.Type>) {
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
					writeZodTypeRecursive(f, unionType)
				),
				false
			),
		]
	);
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
