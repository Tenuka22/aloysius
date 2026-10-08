import { appRouter } from "@aloysius/api/routers/index";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { ClientRetryPlugin } from "@orpc/client/plugins";
import { createRouterClient } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { toast } from "sonner";

import { createContext } from "../context";

export function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        /*
         * Toasts are for the browser. During SSR there is nothing to render one
         * into, and the page reports the same failure in its own `Notice` where
         * the operator is actually looking.
         */
        if (import.meta.env.SSR) {
          return;
        }
        toast.error(error.message, {
          /*
           * One toast per query, updated in place. Without an id, a screen whose
           * loader mounts three failing queries stacks three copies of the same
           * sentence, and the next background refetch adds a fourth.
           */
          id: query.queryHash,
          action: {
            label: "Retry",
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  });
}

const getORPCClient = createIsomorphicFn()
  .server(() =>
    createRouterClient(appRouter, {
      context: async () => createContext({ req: getRequest() }),
    })
  )
  .client((): RouterClient<typeof appRouter> => {
    const link = new RPCLink({
      url: `${window.location.origin}/api/rpc`,
      plugins: [new ClientRetryPlugin({ default: { retry: 2 } })],
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    });

    return createORPCClient(link);
  });

export const client: RouterClient<typeof appRouter> = getORPCClient();

export const orpc = createTanstackQueryUtils(client);
