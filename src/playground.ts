import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
const publicProcedure = t.procedure;
const procedure = t.procedure;

const bluh = {
    a: {
        b: {
            c: {
                d: Math.random,
            },
        },
    },
};

export const router = t.router({
    getSession: t.procedure
        .input(z.string())
        .output(/* BEGIN GENERATED CONTENT */ z.number() /* END GENERATED CONTENT */)
        .query(({ ctx }) => {
            return bluh.a.b.c.d();
        }),
    getSession2: publicProcedure
        .output(/* BEGIN GENERATED CONTENT */ z.number() /* END GENERATED CONTENT */)
        .query(({ ctx }) => {
            return bluh.a.b.c.d();
        }),
    getSession3: procedure
        .output(/* BEGIN GENERATED CONTENT */ z.number() /* END GENERATED CONTENT */)
        .query(({ ctx }) => {
            return bluh.a.b.c.d();
        }),
});
