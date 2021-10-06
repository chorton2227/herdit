import { Button } from "@chakra-ui/button";
import { Box } from "@chakra-ui/layout";
import { Formik, Form } from "formik";
import { useRouter } from "next/router";
import React from "react";
import InputField from "../../../components/InputField";
import Layout from "../../../components/Layout";
import { useUpdatePostMutation } from "../../../generated/graphql";
import useGetPostFromUrl from "../../../utils/useGetPostFromUrl";
import { withApollo } from "../../../utils/withApollo";

const EditPost = ({}) => {
    const router = useRouter();
    const postId = typeof router.query.id === 'string' ? parseInt(router.query.id) : -1;
    const { data, loading } = useGetPostFromUrl();
    const [updatePost] = useUpdatePostMutation();

    if (loading) {
        return (
            <Layout>
                <div>loading...</div>
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
        <Layout variant="small">
            <Formik
                initialValues={{
                    title: data.post.title,
                    text: data.post.text
                }}
                onSubmit={async (values) => {
                    await updatePost({
                        variables: {
                            id: postId,
                            ...values
                        }
                    });
                    router.back();
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="title"
                            placeholder="title"
                            label="Title"
                        />
                        <Box mt={4}>
                            <InputField
                                textarea
                                name="text"
                                placeholder="text"
                                label="Body"
                            />
                        </Box>
                        <Button
                            mt={4}
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            update post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    )
};

export default withApollo()(EditPost);