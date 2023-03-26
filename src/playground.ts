import { initTRPC } from '@trpc/server';
import { z } from 'zod';

type MyTuple = [boolean, ...number[]];

const t = initTRPC.context().create();
t.router({
    myProc: t.procedure
        .output(/* BEGIN GENERATED CONTENT */ z.tuple([z.boolean()]).rest(z.number()) /* END GENERATED CONTENT */)
        .query(() => {
            return [false, Math.random(), Math.random()] as MyTuple;
        }),
});
