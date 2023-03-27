import { initTRPC } from '@trpc/server';
import { z } from 'zod';

type X = 3 | 'a' | 'b' | (string & {});

const t = initTRPC.context().create();
t.router({
    myProc: t.procedure.output(/* BEGIN GENERATED CONTENT */ z.union([z.literal(3), z.string()]) /* END GENERATED CONTENT */).query(() => {
        return 'a' as X;
    }),
});
