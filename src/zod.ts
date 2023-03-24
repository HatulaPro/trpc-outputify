import { ts, type Type, SyntaxKind } from 'ts-morph';

export function writeZodType(f: ts.NodeFactory, t: Type<ts.Type>) {
	return [wrapWithComments(f.createStringLiteral(t.getText()))];
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
