import { initTRPC } from '@trpc/server';
import { z } from 'zod';

enum Color {
	Blue,
	Red,
	Green,
}

function getRandomColor() {
	return [Color.Blue, Color.Green, Color.Red][Math.floor(Math.random() * 3)];
}

const t = initTRPC.context().create();
t.router({
	myProc: t.procedure
		.output(
			/* BEGIN GENERATED CONTENT */ z
				.nativeEnum(Color)
				.optional() /* END GENERATED CONTENT */
		)
		.query(getRandomColor),
});
