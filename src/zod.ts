import { type ts, type Type } from "ts-morph";

export function writeZodType(f: ts.NodeFactory, t: Type<ts.Type>) {
  return [f.createStringLiteral(t.getText())];
}
