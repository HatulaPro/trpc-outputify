import { type ts, type Type } from 'ts-morph';

export function removePromiseFromType(t: Type<ts.Type>) {
	if (t.getProperty('then') && t.getProperty('catch')) {
		return t.getTypeArguments()[0] ?? t;
	}

	return t;
}
