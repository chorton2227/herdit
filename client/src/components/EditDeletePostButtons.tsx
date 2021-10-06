import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { Flex, Link } from "@chakra-ui/layout";
import { IconButton } from "@chakra-ui/react";
import React from "react";
import NextLink from "next/link";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";

interface EditDeletePostButtonsProps {
    postId: number,
    creatorId: number
}

const EditDeletePostButtons: React.FC<EditDeletePostButtonsProps> = ({ postId, creatorId }) => {
    const { data: meData } = useMeQuery();
    const [deletePost] = useDeletePostMutation();

    if (meData?.me?.id !== creatorId) {
        return null;
    }

    return (
        <Flex ml='auto' align="center">
            <NextLink href="/post/edit/[id]" as={`/post/edit/${postId}`}>
                <IconButton
                    mr={4}
                    aria-label="Edit post"
                    icon={<EditIcon />}
                    as={Link}
                />
            </NextLink>
            <IconButton
                aria-label="Delete post"
                icon={<DeleteIcon />}
                onClick={() => {
                    deletePost({
                        variables: { id: postId },
                        update: (cache) => {
                            cache.evict({
                                id: 'Post:' + postId
                            });
                        }
                    })
                }}
            />
        </Flex>
    );
}

export default EditDeletePostButtons;