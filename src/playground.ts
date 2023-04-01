import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context().create();
const publicProcedure = t.procedure;
const procedure = t.procedure;
export const router = t.router({
    getSession: t.procedure.output(/* BEGIN GENERATED CONTENT */ z.number() /* END GENERATED CONTENT */).query(({ ctx }) => {
        return 12;
    }),
    getSession2: publicProcedure.output(/* BEGIN GENERATED CONTENT */ z.number() /* END GENERATED CONTENT */).query(({ ctx }) => {
        return 12;
    }),
    getSession3: procedure.output(/* BEGIN GENERATED CONTENT */ z.number() /* END GENERATED CONTENT */).query(({ ctx }) => {
        return 12;
    }),
});
