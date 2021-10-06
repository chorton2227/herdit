import { Box, Heading } from "@chakra-ui/layout";
import React from "react";
import EditDeletePostButtons from "../../components/EditDeletePostButtons";
import Layout from "../../components/Layout";
import useGetPostFromUrl from "../../utils/useGetPostFromUrl";
import { withApollo } from "../../utils/withApollo";

const Post = ({}) => {
    const { data, error, loading } = useGetPostFromUrl();

    if (loading) {
        return (
            <Layout>
                <div>loading...</div>
            </Layout>
        )
    }

    if (error) {
        return (
            <Layout>
                <div>{error.message}</div>
            </Layout>
        )
    }

    if (!data?.post) {
        return (
            <Layout>
                <div>post not found</div>
            </Layout>
        )
    }

    return (
        <Layout>
            <Heading mb={4}>
                {data.post.title}
            </Heading>
            <Box mb={4}>
                {data?.post?.text}
            </Box>
            <EditDeletePostButtons
                postId={data.post.id}
                creatorId={data.post.creator.id}
            />
        </Layout>
    );
}

export default withApollo({ ssr: false })(Post);