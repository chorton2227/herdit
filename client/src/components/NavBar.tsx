import { Box, Flex, Heading } from "@chakra-ui/layout";
import { Button, Link } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useRouter } from "next/router";
import { useApolloClient } from "@apollo/client";


interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
    const router = useRouter();
    const [logout, { loading: logoutFetching }] = useLogoutMutation();
    const apolloClient = useApolloClient();
    const { data, loading } = useMeQuery({ skip: isServer() });
    let body = null;

    // Loading
    if (isServer() || loading) {

    }
    // User not logged in
    else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link color="white" mr={2}>
                        login
                    </Link>
                </NextLink>
                <NextLink href="/register">
                    <Link color="white">
                        register
                    </Link>
                </NextLink>
            </>
        );
    }
    // User logged in
    else {
        body = (
            <Flex align="center">
                <NextLink href="/create-post">
                    <Button as={Link} mr={4}>
                        create post
                    </Button>
                </NextLink>
                <Box mr={2}>{data.me.username}</Box>
                <Button
                    variant="link"
                    color="black"
                    onClick={async () => {
                        await logout();
                        await apolloClient.resetStore();
                    }}
                    isLoading={logoutFetching}
                >
                    logout
                </Button>
            </Flex>
        );
    }

    return (
        <Flex bg="gray" p={4} align="center">
            <Flex flex={1} m="auto" align="center" maxW={800}>
                <NextLink href="/">
                    <Link>
                        <Heading>herd.it</Heading>
                    </Link>
                </NextLink>
                <Box ml={"auto"}>
                    {body}
                </Box>
            </Flex>
        </Flex>
    );
}

export default NavBar;