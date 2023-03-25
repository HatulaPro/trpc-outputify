import { TypeFlags, type ts, type Type } from 'ts-morph';

export function removePromiseFromType(t: Type<ts.Type>) {
	if (
		t.getProperty('then') &&
		t.getProperty('catch') &&
		t.getSymbol()?.getEscapedName() === 'Promise'
	) {
		return t.getTypeArguments()[0] ?? t;
	}

	return t;
}

export function isBigIntLiteral(t: Type<ts.Type>) {
	return t.getLiteralFreshType()?.getFlags() === TypeFlags.BigIntLiteral;
}

export function getValueOfBooleanLiteral(t: Type<ts.Type>) {
	// eslint-disable-next-line
	const literalValue = // eslint-disable-next-line
		(t.getLiteralRegularType()?.compilerType.freshType as any)
			.intrinsicName as 'true' | 'false';
	return literalValue === 'true';
}

export function isDateType(t: Type<ts.Type>) {
	if (
		t.getSymbol()?.getEscapedName() === 'Date' &&
		t.getProperty('getDate') &&
		t.getProperty('getTime')
	) {
		return true;
	}
	return false;
}
