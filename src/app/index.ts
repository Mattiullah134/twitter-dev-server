import express from "express"
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import { json } from 'body-parser';
import { prismaClient } from "../client/db/indes";
import { User } from "./user";
import { GraphQlContext } from "../interface";
import JWTService from "../services/jwt";
import { tweet } from "./tweet";

export async function initServer() {
    const app = express();
    app.use(express.json());
    app.use(cors());
    const server = new ApolloServer<GraphQlContext>({
        typeDefs: `
        ${User.types}
        ${tweet.types}
            type Query {
                ${User.queries}
                ${tweet.queries}
            }
            type Mutation {
                ${tweet.mutations}
                ${User.mutations}
            }

        `,
        resolvers: {
            Query: {
                ...User.resolvers.queries,
                ...tweet.resolvers.queries
            },
            Mutation: {
                ...tweet.resolvers.mutations,
                ...User.resolvers.mutations,
            },
            ...tweet.resolvers.extraResolvers,
            ...User.resolvers.extraResolvers

        },
    });

    await server.start();


    app.use('/graphql', cors<cors.CorsRequest>(), json(), expressMiddleware(server, {

        context: async ({ req, res }) => {
            // console.log(req?.headers);

            return {
                user: req.headers.authorization ? JWTService.decodeToken(req.headers.authorization.split("Bearer ")[1]) : undefined
            }

        },
    }));
    return app;
}
