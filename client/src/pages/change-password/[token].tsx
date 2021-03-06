import { Button } from "@chakra-ui/button";
import { Box, Flex, Link } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import React, { useState } from "react";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import { MeDocument, MeQuery, useChangePasswordMutation } from "../../generated/graphql";
import toErrorMap from "../../utils/toErrorMap";
import NextLink from "next/link";
import { withApollo } from "../../utils/withApollo";

const ChangePassword: NextPage<{token: string}> = ({ token }) => {
    const router = useRouter();
    const [changePassword] = useChangePasswordMutation();
    const [tokenError, setTokenError] = useState('');
    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ newPassword: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await changePassword({
                        variables: {
                            token: token,
                            newPassword: values.newPassword
                        },
                        update: (cache, { data }) => {
                            cache.writeQuery<MeQuery>({
                                query: MeDocument,
                                data: {
                                    __typename: "Query",
                                    me: data?.changePassword.user
                                }
                            })
                        }
                    });
                    if (response.data?.changePassword.errors) {
                        const errorMap = toErrorMap(response.data.changePassword.errors);
                        if ('token' in errorMap) {
                            setTokenError(errorMap.token);
                        } else {
                            setErrors(errorMap);
                        }
                    } else if (response.data?.changePassword.user) {
                        router.push("/");
                    }
                }}
            >
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="newPassword"
                            placeholder="new password"
                            label="New Password"
                            type="password"
                        />
                        {tokenError ? (
                            <Flex>
                                <Box mr={2} color="red">{tokenError}</Box>
                                <NextLink href="/forgot-password">
                                    <Link>click here to get a new one</Link>
                                </NextLink>
                            </Flex>
                        ) : null}
                        <Button
                            mt={4}
                            type="submit"
                            isLoading={isSubmitting}
                        >
                            change password
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

ChangePassword.getInitialProps = ({ query }) => {
    return {
        token: query.token as string
    }
}

export default withApollo()(ChangePassword);