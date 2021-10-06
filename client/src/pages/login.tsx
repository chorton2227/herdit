import { Button } from "@chakra-ui/button";
import { Box, Flex, Link } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import { useRouter } from "next/dist/client/router";
import React from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { MeDocument, MeQuery, useLoginMutation } from "../generated/graphql";
import toErrorMap from "../utils/toErrorMap";
import NextLink from "next/link";
import { withApollo } from "../utils/withApollo";

const Login = () => {
    const router = useRouter();
    const [login] = useLoginMutation();
    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ usernameOrEmail: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await login({
                        variables: values,
                        update: (cache, { data }) => {
                            cache.writeQuery<MeQuery>({
                                query: MeDocument,
                                data: {
                                    __typename: "Query",
                                    me: data?.login.user
                                }
                            });
                            cache.evict({ fieldName: "posts:{}" });
                        }
                    });

                    if (response.data?.login.errors) {
                        setErrors(toErrorMap(response.data.login.errors));
                    } else if (response.data?.login.user) {
                        if (typeof router.query.next === "string") {
                            router.push(router.query.next);
                        } else {
                            router.push("/");
                        }
                    }
                }}
            >
                {({values, handleChange, isSubmitting}) => (
                    <Form>
                        <InputField
                            name="usernameOrEmail"
                            label="Username or Email"
                            placeholder="username or email"
                        />
                        <Box mt={4}>
                            <InputField
                                name="password"
                                label="Password"
                                placeholder="password"
                                type="password"
                            />
                        </Box>
                        <Flex mt={2}>
                            <NextLink href="/forgot-password">
                                <Link ml="auto">forgot password</Link>
                            </NextLink>
                        </Flex>
                        <Button
                            mt={4}
                            type="submit"
                            isLoading={isSubmitting}>
                            login
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

export default withApollo({ ssr: false })(Login);
