import { ApolloCache } from "@apollo/client";
import { IconButton } from "@chakra-ui/button";
import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex } from "@chakra-ui/layout";
import gql from "graphql-tag";
import React, { useState } from "react";
import { PostSnippetFragment, useVoteMutation, VoteMutation } from "../generated/graphql";

interface UpdootSectionProps {
    post: PostSnippetFragment
}

const updateAfterVote = (value: number, postId: number, cache: ApolloCache<VoteMutation>) => {
    const data = cache.readFragment<{
        id: number;
        points: number;
        voteStatus: number | null;
    }>({
        id: 'Post:' + postId,
        fragment: gql`
            fragment _ on Post {
                id
                points
                voteStatus
            }
        `
    });

    if (data) {
        if (data.voteStatus === value) {
            return;
        }

        const newPoints = data.points + (!data.voteStatus ? 1 : 2) * value;
        cache.writeFragment({
            id: 'Post:' + postId,
            fragment: gql`
                fragment _ on Post {
                    points
                    voteStatus
                }
            `,
            data: {
                points: newPoints,
                voteStatus: value
            }
        });
    }
}

const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
    const [loadingState, setLoadingState] = useState<'updoot-loading' | 'downdoot-loading' | 'not-loading'>();
    const [vote] = useVoteMutation();
    return (
        <Flex
            direction="column"
            justifyContent="center"
            alignItems="center"
            mr={4}
        >
            <IconButton
                onClick={async () => {
                    if (post.voteStatus === 1) {
                        return;
                    }

                    setLoadingState('updoot-loading');
                    await vote({
                        variables: {
                            postId: post.id,
                            value: 1
                        },
                        update: (cache) => updateAfterVote(1, post.id, cache)
                    });
                    setLoadingState('not-loading');
                }}
                colorScheme={post.voteStatus === 1 ? "green" : undefined}
                isLoading={loadingState === 'updoot-loading'}
                aria-label="Updoot post"
                icon={<ChevronUpIcon w={8} h={8} />}
            />
            {post.points}
            <IconButton
                onClick={async () => {
                    if (post.voteStatus === -1) {
                        return;
                    }
                    
                    setLoadingState('downdoot-loading');
                    await vote({
                        variables: {
                            postId: post.id,
                            value: -1
                        },
                        update: (cache) => updateAfterVote(-1, post.id, cache)
                    })
                    setLoadingState('not-loading');
                }}
                colorScheme={post.voteStatus === -1 ? "red" : undefined}
                isLoading={loadingState === 'downdoot-loading'}
                aria-label="Downdoot post"
                icon={<ChevronDownIcon w={8} h={8} />}
            />
        </Flex>
    );
};

export default UpdootSection;