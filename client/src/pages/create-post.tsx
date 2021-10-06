import { Button } from "@chakra-ui/button";
import { Box } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import React from "react";
import InputField from "../components/InputField";
import { useCreatePostMutation } from "../generated/graphql";
import { useRouter } from "next/router";
import Layout from "../components/Layout";
import { useIsAuth } from "../utils/useIsAuth";
import { withApollo } from "../utils/withApollo";

const CreatePost: React.FC<{}> = ({}) => {
    useIsAuth();
    const router = useRouter();
    const [createPost] = useCreatePostMutation();
    return (
        <Layout variant="small">
            <Formik
                initialValues={{ title: "", text: "" }}
                onSubmit={async (values) => {
                    const { errors } = await createPost({
                        variables: { input: values },
                        update: (cache) => {
                            cache.evict({ fieldName: "posts" });
                        }
                    });

                    if (!errors) {
                        router.push("/");
                    }
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
                                name="text"
                                placeholder="text..."
                                label="Body"
                                textarea
                            />
                        </Box>
                        <Button
                            mt={4}
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            create post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
}

export default withApollo()(CreatePost);