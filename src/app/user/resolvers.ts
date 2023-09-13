import axios from "axios"
import { prismaClient } from "../../client/db/indes";
import JWTService from "../../services/jwt";
import UserService from "../../services/user";
import { GraphQlContext } from "../../interface";
import { User } from "@prisma/client";
import { redisClient } from "../../client/redis";
import { json } from "body-parser";
interface GoogleUserInfo {
    iss: string;
    azp: string;
    aud: string;
    sub: string;
    email: string;
    email_verified: string;
    nbf: string;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
    locale: string;
    iat: string;
    exp: string;
    jti: string;
    alg: string;
    kid: string;
    typ: string;
}
const mutations = {
    followUser: async (parent: any, { to }: { to: string }, ctx: GraphQlContext) => {
        if (!ctx.user || !ctx.user.id) {
            throw new Error("You are not authenticated")
        }
        await UserService.followUser(ctx.user.id, to);
        await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    },
    unFollowUser: async (parent: any, { to }: { to: string }, ctx: GraphQlContext) => {
        if (!ctx.user || !ctx.user.id) {
            throw new Error("You are not authenticated")
        }
        await UserService.unFollowUser(ctx.user.id, to);
        await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);

        return true;
    },
}
const queries = {
    verifyGoogleAuthToken: async (parent: any, { token }: { token: string }) => {
        const userToken = UserService.verifyGoogleAuthToken(token);

        return userToken;
    },
    getCurrentUser: async (parent: any, args: any, ctx: GraphQlContext) => {
        console.log(ctx.user);

        let id = ctx.user?.id;
        if (!id) {
            return null;
        } else {
            const user = UserService.getUserById(id);
            return user
        }
    },
    getUserById: async (parent: any, { id }: { id: string }) => {
        return await prismaClient.user.findUnique({ where: { id } })
    }
}

const extraResolvers = {
    User: {
        tweets: async (parent: User) => await prismaClient.tweet.findMany({
            where: { author: { id: parent.id } }
        }),
        followers: async (parent: User) => {
            console.log('parent.id', parent.id);
            const result = await prismaClient.follows.findMany({
                where: { following: { id: parent.id } }, include: {
                    follower: true
                }
            });
            console.log('result followers', result);

            return result.map(el => el.follower);
        },
        followings: async (parent: User) => {
            const result = await prismaClient.follows.findMany({
                where: { follower: { id: parent.id } }, include: {
                    following: true
                }
            });
            console.log('result following', result);

            return result.map(el => el.following);
        },
        recommendedUsers: async (parent: User, _: any, ctx: GraphQlContext) => {
            if (!ctx.user?.id) {
                return [];
            } else {
                const cachedValue = await redisClient.get(`RECOMMENDED_USERS:${ctx.user.id}`);
                if (cachedValue) return JSON.parse(cachedValue);
                const myFollowings = await prismaClient.follows.findMany({
                    where: {
                        follower: {
                            id: ctx.user.id
                        }
                    },
                    include: {
                        following: {
                            include: {
                                follower: {
                                    include: {
                                        following: true
                                    }
                                }
                            }
                        }
                    }
                })
                console.log('myFollowings', myFollowings[0].following.follower);
                const userToRecommend: User[] = [];
                for (const followings of myFollowings) {
                    for (const followingsOfFollowedUser of followings.following.follower) {
                        if (followingsOfFollowedUser.following.id !== ctx.user.id && myFollowings.findIndex(el => el.followerId === followingsOfFollowedUser.following.id) < 0) {
                            userToRecommend.push(followingsOfFollowedUser.following);

                        }
                    }
                }
                await redisClient.set(`RECOMMENDED_USERS:${ctx.user.id}`, JSON.stringify(userToRecommend));

                return userToRecommend;
            }
        }
    }
}
export const resolvers = { queries, extraResolvers, mutations }