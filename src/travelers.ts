import { ts, type TransformTraversalControl } from "ts-morph";
import { type ProcedureNode } from "./procedure";
import { writeZodType } from "./zod";

export const Travelers = {
  addOutputAfterInput(procedure: ProcedureNode) {
    return (traversal: TransformTraversalControl) => {
      const node = traversal.visitChildren();
      const f = traversal.factory;
      if (ts.isCallExpression(node)) {
        for (const child of node.getChildren()) {
          if (ts.isPropertyAccessExpression(child)) {
            if (child.name.escapedText === "input") {
              return f.createCallExpression(
                f.createPropertyAccessExpression(
                  node,
                  f.createIdentifier("output")
                ),
                undefined,
                writeZodType(f, procedure.returnType)
              );
            }
          }
        }
      }
      return node;
    };
  },

  updateExistingOutput(procedure: ProcedureNode) {
    return (traversal: TransformTraversalControl) => {
      const node = traversal.visitChildren();
      const f = traversal.factory;
      if (ts.isCallExpression(node)) {
        for (const child of node.getChildren()) {
          if (ts.isPropertyAccessExpression(child)) {
            if (child.name.escapedText === "output") {
              return f.updateCallExpression(
                node,
                child,
                [],
                writeZodType(f, procedure.returnType)
              );
            }
          }
        }
      }
      return node;
    };
  },

  addOutputBeforeRPC(procedure: ProcedureNode) {
    return (traversal: TransformTraversalControl) => {
      const node = traversal.visitChildren();
      const f = traversal.factory;
      if (ts.isPropertyAccessExpression(node)) {
        if (
          node.name.escapedText === "query" ||
          node.name.escapedText === "mutation"
        ) {
          for (const child of node.getChildren()) {
            if (ts.isCallExpression(child)) {
              return f.createPropertyAccessExpression(
                f.createCallExpression(
                  f.createPropertyAccessExpression(child, "output"),
                  [],
                  writeZodType(f, procedure.returnType)
                ),
                node.name.escapedText
              );
            }
          }
        }
      }
      return node;
    };
  },
};
