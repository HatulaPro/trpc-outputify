![demo of trpc-outputify in action](https://user-images.githubusercontent.com/70011806/229856342-3cc8ce19-2ace-4dcd-8ffc-5c37a6dde164.gif)

# trpc-outputify
`trpc-outputify` is a tool that automates the process of adding a [zod](https://zod.dev/) `.output()` validator to [trpc](https://trpc.io/) procedures, ensuring the output conforms to the expected schema and improves API safety and reliability.

> **NOTE:** `trpc-outputify` is still a work in progress, so it might have a few bugs. Please make sure the output fits your needs before running untrusted code.

`trpc-outputify` relies on the [TypeScript](https://www.typescriptlang.org/) compiler to generate the types, which means it can only understand the types TypeScript can understand. Generating validators that check the "contents" of the type (e.g. testing the length of a string) is not currently possible.

# Installing

```
npm install -g trpc-outputify
```

# Usage

```sh
$ trpc-outputify [files] [options]
```

## Arguments

- `files`: A glob pattern to find files that contain tRPC procedures.

## Options

- `-c, --config <tsconfig>`: Path to the local tsconfig.json file. By default, trpc-outputify looks for a tsconfig.json file in the current directory.
- `-p, --procedures <procedures...>`: The names of the procedures to validate. By default, only the following procedures will be validated: `publicProcedure, protectedProcedure, and procedure`.
- `-s, --silent`: Silent mode, no output will be shown.

## Examples

- To validate the default procedures in all files that match the glob pattern `routers/*.ts`, run:
  ```sh
  $ trpc-outputify "routers/*.ts"
  ```
- To only validate procedures named: `globalModProcedure` and `publicProcedure` and match the glob pattern `routers/*.ts`, run:
  ```sh
  $ trpc-outputify "routers/*.ts" -p globalModProcedure publicProcedure
  ```

# I don't like the output. What should I do?
We can do a lot, but we can't always produce the zod type you are expecting to see. So, what can you do about it?

### Improving detection
Often times the TypeScript compiler "overcomplicates" the types, which makes it harder to generate the validator correctly. Small things that can be done to improve it are:

  - Using async functions: 
  
    Try changing functions from this:
    ```typescript
    export const router = t.router({
        getPosts: t.procedure.query(({ctx}) => ctx.prisma.post.findMany().then(res => res.map(modifyPost))),
    });
    ```

    to this:
    ```typescript
    export const router = t.router({
        getPosts: t.procedure.query(async ({ctx}) => {
            const res = await ctx.prisma.post.findMany();
            return res.map(modifyPost);
        }),
    });
    ```

  - Using well-defined types:
  
    Adding a simple return type on functions can make the output types simpler too.
    
    ```typescript
    export const router = t.router({
        getPosts: t.procedure.query(async ({ctx}): Promise<MyComplexObject> => {
            return await getVeryComplexObject();
        }),
    });
    ```

- ### @outputify-ignore
  You can add an `@outputify-ignore` before your `query`/`mutation` functions calls. This lets the parser know you want the procedure to remain unchanged.

  ```typescript
  t.router({
      // No output will be generated.
      myProc: t.procedure.query(/* @outputify-ignore */ () => {
          return Math.random();
      }),
      // Will generate output normally
      myOtherProc: t.procedure.query(() => "HELLO"),
  });
  ```
- ### Use custom procedures
  The default procedures are: `[procedure, publicProcedure, protectedProcedure]`. Only procedures that were created using those names will be modified (you can change the default via the CLI). You can use other procedure names to keep parts of the program untouched:

  ```typescript
  export const publicProcedure = ...;
  export const publicProcedureUnmodified = publicProcedure;
  t.router({
      // No output will be generated.
      myProc: publicProcedureUnmodified.output(customValidator).query(() => {
          return ...;
      }),
      // Will generate output normally
      myOtherProc: publicProcedure.mutation(() => {
          return ...;
      }),
  });
  ```
- ### Let us know
  Feel free to create an issue or open a PR.


