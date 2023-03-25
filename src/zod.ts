import { ts, type Type, SyntaxKind } from 'ts-morph';
import { removePromiseFromType } from './types';

export function writeZodType(f: ts.NodeFactory, t: Type<ts.Type>) {
	// console.log(t);
	const promised = removePromiseFromType(t);
	return [wrapWithComments(writeZodTypeRecursive(f, promised))];
}

function writeZodTypeRecursive(f: ts.NodeFactory, t: Type<ts.Type>) {
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
