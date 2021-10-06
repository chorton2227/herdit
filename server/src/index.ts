import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import "reflect-metadata";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageGraphQLPlayground, ApolloServerPluginLandingPageDisabled } from "apollo-server-core"
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import cors from "cors";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";
import { Updoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";
import "dotenv-safe/config";

const main = async () => {
    const conn = await createConnection({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        logging: true,
        // synchronize: true,
        entities: [Post, User, Updoot],
        migrations: [path.join(__dirname, './migrations/*')]
    });
    await conn.runMigrations();

    const app = express();

    app.use(
        cors({
          origin: process.env.CORS_ORIGIN,
          credentials: true
        })
    );

    const redisStore = connectRedis(session);
    const redis = new Redis(process.env.REDIS_URL);

    app.set("trust proxy", 1);

    app.use(
        session({
            name: COOKIE_NAME,
            store: new redisStore({
                client: redis,
                disableTouch: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
                httpOnly: true,
                sameSite: 'lax', // csrf
                secure: __prod__
            },
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET,
            resave: false
        })
    );

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        context: ({ req, res }): MyContext => ({
            req,
            res,
            redis,
            userLoader: createUserLoader(),
            updootLoader: createUpdootLoader()
        }),
        plugins: [
            __prod__
                ? ApolloServerPluginLandingPageDisabled()
                : ApolloServerPluginLandingPageGraphQLPlayground()
        ]
    });

    await apolloServer.start();

    apolloServer.applyMiddleware({
        app,
        cors: false
    });

    app.listen(parseInt(process.env.PORT), () => {
        console.log('server listening localhost:4000')
    });

    // const post = orm.em.create(Post, { title: 'My first post' });
    // await orm.em.persistAndFlush(post);

    // const posts = await orm.em.find(Post, {});
    // console.log(posts);
};

main().catch(err => {
    console.error(err);
});
