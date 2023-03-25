import { ts, type Type, SyntaxKind, TypeFlags } from 'ts-morph';
import { removePromiseFromType } from './types';

export function writeZodType(f: ts.NodeFactory, t: Type<ts.Type>) {
	// console.log(t);
	const promised = removePromiseFromType(t);
	return [wrapWithComments(writeZodTypeRecursive(f, promised))];
}

function writeZodTypeRecursive(
	f: ts.NodeFactory,
	t: Type<ts.Type>
): ts.Expression {
	if (t.isString()) {
		return f.createCallExpression(
			f.createPropertyAccessExpression(
				f.createIdentifier('z'),
				f.createIdentifier('string')
			),
			undefined,
			[]
		);
	} else if (t.isNumber()) {
		return f.createCallExpression(
			f.createPropertyAccessExpression(
				f.createIdentifier('z'),
				f.createIdentifier('number')
			),
			undefined,
			[]
		);
	} else if (t.isBoolean()) {
		return f.createCallExpression(
			f.createPropertyAccessExpression(
				f.createIdentifier('z'),
				f.createIdentifier('boolean')
			),
			undefined,
			[]
		);
	} else if ((t.getFlags() & TypeFlags.BigInt) === TypeFlags.BigInt) {
		return f.createCallExpression(
			f.createPropertyAccessExpression(
				f.createIdentifier('z'),
				f.createIdentifier('bigint')
			),
			undefined,
			[]
		);
	} else if (t.isNull()) {
		return f.createCallExpression(
			f.createPropertyAccessExpression(
				f.createIdentifier('z'),
				f.createIdentifier('null')
			),
			undefined,
			[]
		);
	} else if (t.isUndefined()) {
		return f.createCallExpression(
			f.createPropertyAccessExpression(
				f.createIdentifier('z'),
				f.createIdentifier('undefined')
			),
			undefined,
			[]
		);
	} else if (t.isAny()) {
		return f.createCallExpression(
			f.createPropertyAccessExpression(
				f.createIdentifier('z'),
				f.createIdentifier('any')
			),
			undefined,
			[]
		);
	} else if (t.isUnion()) {
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
