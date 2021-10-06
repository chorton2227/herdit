import { Button } from "@chakra-ui/button";
import { Box } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import { useRouter } from "next/dist/client/router";
import React from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { MeDocument, MeQuery, useRegisterMutation } from "../generated/graphql";
import toErrorMap from "../utils/toErrorMap";
import { withApollo } from "../utils/withApollo";

interface registerProps {}

export const Register: React.FC<registerProps> = ({}) => {
    const router = useRouter();
    const [register] = useRegisterMutation();
    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ email: "", username: "", password: "" }}
                onSubmit={async (values, { setErrors }) => {
                    const response = await register({
                        variables: { options: values },
                        update: (cache, { data }) => {
                            cache.writeQuery<MeQuery>({
                                query: MeDocument,
                                data: {
                                    __typename: "Query",
                                    me: data?.register.user
                                }
                            })
                        }
                    });

                    if (response.data?.register.errors) {
                        setErrors(toErrorMap(response.data.register.errors));
                    } else if (response.data?.register.user) {
                        router.push("/");
                    }
                }}
            >
                {({values, handleChange, isSubmitting}) => (
                    <Form>
                        <InputField
                            name="username"
                            label="Username"
                            placeholder="username"
                        />
                        <Box mt={4}>
                            <InputField
                                name="email"
                                label="Email"
                                placeholder="email"
                            />
                        </Box>
                        <Box mt={4}>
                            <InputField
                                name="password"
                                label="Password"
                                placeholder="password"
                                type="password"
                            />
                        </Box>
                        <Button
                            mt={4}
                            type="submit"
                            isLoading={isSubmitting}>
                            register
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

export default withApollo()(Register);