import { Box, Flex, Heading, Link, Stack, Text } from "@chakra-ui/layout"
import React from "react"
import Layout from "../components/Layout"
import { PostsQuery, usePostsQuery } from "../generated/graphql"
import NextLink from "next/link";
import { Button } from "@chakra-ui/button"
import UpdootSection from "../components/UpdootSection"
import EditDeletePostButtons from "../components/EditDeletePostButtons"
import { withApollo } from "../utils/withApollo";

const Index = () => {
  const { data, error, loading, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 10,
      cursor: null
    },
    notifyOnNetworkStatusChange: true
  });

  if (!loading && !data) {
    return (
      <div>{error?.message}</div>
    );
  }

  return (
    <Layout>
      {loading && !data ? (
        <div>loading...</div>
      ) : (
        <Stack spacing={8}>
          {data!.posts.posts.map((p) =>
            !p ? null : (
              <Flex
                key={p.id}
                p={4}
                shadow="md"
                borderWidth="1px"
              >
                <UpdootSection post={p} />
                <Box>
                  <NextLink href="/post/[id]" as={`/post/${p.id}`}>
                    <Link>
                      <Heading fontSize="xl">
                        {p.title}
                      </Heading>
                    </Link>
                  </NextLink>
                  <Text>
                    posted by {p.creator.username}
                  </Text>
                  <Text mt={4}>{p.textSnippet}</Text>
                </Box>
                <EditDeletePostButtons
                  postId={p.id}
                  creatorId={p.creator.id}
                />
              </Flex>
            )
          )}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            isLoading={loading}
            m={"auto"}
            my={8}
            onClick={() => {
              fetchMore({
                variables: {
                  limit: variables?.limit,
                  cursor: data.posts.posts[data.posts.posts.length - 1].createdAt
                },
                // updateQuery: (previousValue, { fetchMoreResult }): PostsQuery => {
                //   if (!fetchMoreResult) {
                //     return previousValue as PostsQuery;
                //   }

                //   return {
                //     __typename: "Query",
                //     posts: {
                //       __typename: "PaginatedPosts",
                //       hasMore: (fetchMoreResult as PostsQuery).posts.hasMore,
                //       posts: [
                //         ...(previousValue as PostsQuery).posts.posts,
                //         ...(fetchMoreResult as PostsQuery).posts.posts
                //       ]
                //     }
                //   }
                // }
              })
            }}
          >
            load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
}

export default withApollo({ ssr: false })(Index);
