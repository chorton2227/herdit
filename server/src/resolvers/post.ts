import { Post } from "../entities/Post";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

@InputType()
class PostInput {
    @Field()
    title: string

    @Field()
    text: string
}

@ObjectType()
class PaginatedPosts {
    @Field(() => [Post])
    posts: Post[]

    @Field()
    hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
    @FieldResolver(() => Int, { nullable: true })
    async voteStatus(
        @Root() post: Post,
        @Ctx() { updootLoader, req }: MyContext
    ) {
        if (!req.session.userId) {
            return null;
        }

        const updoot = await updootLoader.load({
            postId: post.id,
            userId: req.session.userId
        });

        return updoot ? updoot.value : null;
    }

    @FieldResolver(() => User)
    creator(
        @Root() post: Post,
        @Ctx() { userLoader }: MyContext
    ) {
        return userLoader.load(post.creatorId);
    }

    @FieldResolver(() => String)
    textSnippet(
        @Root() root: Post
    ) {
        return root.text.slice(0, 50);
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async vote(
        @Arg('value', () => Int) value: number,
        @Arg('postId', () => Int) postId: number,
        @Ctx() { req }: MyContext
    ) {
        const isUpdoot = value !== -1;
        const realValue = isUpdoot ? 1 : -1;
        const { userId } = req.session;

        const updoot = await Updoot.findOne({
            where: {
                postId,
                userId
            }
        })

        // Already voted and have not changed their vote
        // Remove updoot, update points
        if (updoot && updoot.value === realValue) {
            await getConnection().transaction(async tm => {
                await tm.query(`
                    delete from updoot
                    where "postId" = $1 and "userId" = $2
                `, [postId, userId]);

                await tm.query(`
                    update post
                    set points = points + $1
                    where id = $2
                `, [realValue * -1, postId]);
            });
        }
        // Has not voted
        // Add updoot, update points
        else if (!updoot) {
            await getConnection().transaction(async tm => {
                await tm.query(`
                    insert into updoot ("userId", "postId", value)
                    values($1, $2, $3)
                `, [userId, postId, realValue]);

                await tm.query(`
                    update post
                    set points = points + $1
                    where id = $2
                `, [realValue, postId]);
            });
        }
        // Has already voted and changed their vote
        // Update updoot and points
        else {
            await getConnection().transaction(async tm => {
                await tm.query(`
                    update updoot
                    set value = $1
                    where "postId" = $2 and "userId" = $3
                `, [realValue, postId, userId]);

                await tm.query(`
                    update post
                    set points = points + $1
                    where id = $2
                `, [realValue * 2, postId]);
            })
        }

        return true;
    }

    @Query(() => PaginatedPosts)
    async posts(
        @Arg('limit', () => Int) limit: number,
        @Arg('cursor', () => String, { nullable: true }) cursor: string
    ): Promise<PaginatedPosts> {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;

        const replacements: any[] = [realLimitPlusOne];
        
        if (cursor) {
            replacements.push(new Date(parseInt(cursor)));
        }

        const posts = await getConnection().query(`
            select
                p.*
            from post p
            ${cursor ? `where p."createdAt" < $2` : ''}
            order by p."createdAt" DESC
            limit $1
        `, replacements);

        return {
            posts: posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne
        };
    }

    @Query(() => Post, { nullable: true })
    async post(@Arg('id', () => Int) id: number): Promise<Post | undefined> {
        return Post.findOne(id);
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg("input") input: PostInput,
        @Ctx() { req }: MyContext
    ): Promise<Post> {
        return Post.create({
            ...input,
            creatorId: req.session.userId
        }).save();
    }

    @Mutation(() => Post, { nullable: true })
    @UseMiddleware(isAuth)
    async updatePost(
        @Arg("id", () => Int) id: number,
        @Arg("title", () => String) title: string,
        @Arg("text", () => String) text: string,
        @Ctx() { req }: MyContext
    ): Promise<Post | null> {
        const result = await getConnection()
            .createQueryBuilder()
            .update(Post)
            .set({ title, text })
            .where(
                'id = :id and "creatorId" = :creatorId',
                {
                    id,
                    creatorId: req.session.userId
                }
            )
            .returning("*")
            .execute();
            
        return result.raw[0];
    }

    @Mutation(() => Boolean)
    @UseMiddleware(isAuth)
    async deletePost(
        @Arg("id", () => Int) id: number,
        @Ctx() { req }: MyContext
    ): Promise<boolean> {
        // const post = await Post.findOne(id);
        // if (!post) {
        //     return false;
        // }

        // if (post.creatorId !== req.session.userId) {
        //     throw new Error('not authorized');
        // }

        // await Updoot.delete({ postId: id })

        await Post.delete({ id, creatorId: req.session.userId });
        return true;
    }
}