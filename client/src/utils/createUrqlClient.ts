import { dedupExchange, Exchange, stringifyVariables } from "@urql/core";
import { cacheExchange, Resolver, Cache } from '@urql/exchange-graphcache';
import { fetchExchange, gql } from "urql";
import { pipe, tap } from "wonka";
import { DeletePostMutationVariables, LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation, VoteMutationVariables } from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import Router from 'next/router';
import { isServer } from "./isServer";

const errorExchange: Exchange = ({ forward }) => ops$ => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error?.message.includes("not authenticated")) {
        Router.replace("/login");
      }
    })
  );
}

const cursorPagination = (
  cursorArgument = "cursor"
): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;
    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isInCache = cache.resolve(entityKey, fieldKey);
    info.partial = !isInCache;

    let hasMore = true;
    const results: string[] = []
    fieldInfos.forEach(fi => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;

      const data = cache.resolve(key, "posts") as string[];
      results.push(...data);

      const _hasMore = cache.resolve(key, "hasMore") as boolean;
      if (!_hasMore) {
        hasMore = false;
      }
    })

    return {
      __typename: "PaginatedPosts",
      hasMore: hasMore,
      posts: results
    };
  };
};

function invalidateAllPosts(cache: Cache) {
  const allFields = cache.inspectFields('Query');
  const fieldInfos = allFields.filter((info) => info.fieldName === 'posts');
  fieldInfos.forEach((fi) => {
    cache.invalidate('Query', 'posts', fi.arguments || {});
  });
}

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  if (isServer()) {
    cookie = ctx.req.headers.cookie;
  }

  return {
    url: process.env.NEXT_PUBLIC_API_URL,
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie
        ? { cookie }
        : undefined
    },
    exchanges: [dedupExchange, cacheExchange({
      keys: {
        PaginatedPosts: () => null
      },
      resolvers: {
        Query: {
          posts: cursorPagination()
        }
      },
      updates: {
        Mutation: {
          deletePost: (_result, args, cache, info) => {
            cache.invalidate({
              __typename: "Post",
              id: (args as DeletePostMutationVariables).id
            })
          },
          vote: (_result, args, cache, info) => {
            const {postId, value} = args as VoteMutationVariables;
            const data = cache.readFragment(
              gql`
                fragment _ on Post {
                  id
                  points
                  voteStatus
                }
              `,
              { id: postId }
            );

            if (data) {
              if (data.voteStatus === value) {
                return;
              }

              const newPoints = data.points + (!data.voteStatus ? 1 : 2) * value;
              cache.writeFragment(
                gql`
                  fragment _ on Post {
                    points
                    voteStatus
                  }
                `,
                { id: postId, points: newPoints, voteStatus: value }
              );
            }
          },
          createPost: (_result, args, cache, info) => {
            invalidateAllPosts(cache);
          },
          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query;
                } else {
                  return {
                    me: result.login.user
                  }
                }
              }
            );
            invalidateAllPosts(cache);
          },
          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query;
                } else {
                  return {
                    me: result.register.user
                  }
                }
              }
            );
          },
          logout: (result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              result,
              () => ({ me: null })
            );
          }
        }
      }
    }),
    ssrExchange,
    errorExchange,
    fetchExchange]
  };
};

export default createUrqlClient;