import { Button } from "@chakra-ui/button";
import { Box } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import React, { useState } from "react";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";
import { useForgotPasswordMutation } from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const ForgotPassword: React.FC<{}> = ({}) => {
    const [complete, setComplete] = useState(false);
    const [forgotPassword] = useForgotPasswordMutation();
    return (
        <Wrapper variant="small">
            <Formik
                initialValues={{ email: "" }}
                onSubmit={ async (values) => {
                    await forgotPassword({ variables: values });
                    setComplete(true);
                }}
            >
                {({ isSubmitting }) =>
                    complete ? (
                        <Box>
                            We sent you an email to reset your password.
                        </Box>
                    )
                    : (
                        <Form>
                            <InputField
                                name="email"
                                placeholder="email"
                                label="Email"
                            />
                            <Button
                                mt={4}
                                type="submit"
                                isLoading={isSubmitting}
                            >
                                reset password
                            </Button>
                        </Form>
                    )
                }
            </Formik>
        </Wrapper>
    );
};

export default withApollo()(ForgotPassword);