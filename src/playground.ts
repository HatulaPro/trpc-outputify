import { initTRPC } from '@trpc/server';
import { z } from "zod";

// import { z } from 'zod';

// const z = 17;

type Thing = {
    x: number;
    y?: number;
};

const t = initTRPC.context().create();
t.router({
    myProc: t.procedure
        .output(/* BEGIN GENERATED CONTENT */ z.object({ x: z.number(), y: z.number().optional() }) /* END GENERATED CONTENT */)
        .query(() => {
            if (Math.random() < 0.5) {
                const z = 2;
                return { x: 1, y: z } as Thing;
            }
            return { x: 1 } as Thing;
        }),
});
