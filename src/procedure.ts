import {
	type CallExpression,
	Node,
	type Project,
	type PropertyAccessExpression,
	SyntaxKind,
	type ts,
	type Type,
} from 'ts-morph';

export type ProcedureNode = {
	node: CallExpression<ts.CallExpression>;
	callExpers: CallExpression<ts.CallExpression>[];
	propAccessExprs: PropertyAccessExpression<ts.PropertyAccessExpression>[];
	propAccessExprsMap: Map<
		string,
		PropertyAccessExpression<ts.PropertyAccessExpression>
	>;
	returnType: Type<ts.Type>;
};
const procedures = ['publicProcedure', 'protectedProcedure', 'procedure'];

function getReturnTypeOfCallExpression(
	project: Project,
	expr: CallExpression<ts.CallExpression>
) {
	const f = expr.getArguments()[0];

	if (!Node.isFunctionLikeDeclaration(f)) {
		if (Node.isIdentifier(f)) {
			return f.getType();
		}
		return;
	}

	const res = project
		.getTypeChecker()
		.getReturnTypeOfSignature(f.getSignature());
	return res;
}
export function handleProcedure(
	project: Project,
	node: Node<ts.Node>,
	callback: (n: ProcedureNode) => void
) {
	if (!Node.isCallExpression(node)) return;
	const child = node.getFirstChild();
	if (Node.isPropertyAccessExpression(child)) {
		const objectName = child.getExpression().getSymbol();
		if (!objectName || !procedures.includes(objectName.getName())) return;

		const parent = node.getParentIfKind(
			SyntaxKind.PropertyAccessExpression
		);
		if (!parent) return;
		const propAccessExprs = [child, parent];
		const callExpers = [node];

		while (true) {
			const nextCallExpr = propAccessExprs[
				propAccessExprs.length - 1
			]?.getParentIfKind(SyntaxKind.CallExpression);
			if (nextCallExpr) {
				callExpers.push(nextCallExpr);
				const accessExpr = nextCallExpr.getParentIfKind(
					SyntaxKind.PropertyAccessExpression
				);
				if (accessExpr) {
					propAccessExprs.push(accessExpr);
				} else {
					break;
				}
			} else {
				break;
			}
		}
		const propAccessExprsMap = new Map<
			string,
			PropertyAccessExpression<ts.PropertyAccessExpression>
		>(propAccessExprs.map((expr) => [expr.getName(), expr]));

		const queryOrMutationCallExpression = (
			propAccessExprsMap.get('query') ||
			propAccessExprsMap.get('mutation')
		)?.getParentIfKind(SyntaxKind.CallExpression);
		if (!queryOrMutationCallExpression) {
			// Could not find .query/.mutation call
			return;
		}

		const returnType = getReturnTypeOfCallExpression(
			project,
			queryOrMutationCallExpression
		);
		if (!returnType) {
			// No return type
			return;
		}

		callback({
			node,
			callExpers,
			propAccessExprs,
			returnType,
			propAccessExprsMap,
		});
	}
}
