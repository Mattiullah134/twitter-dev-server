"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const indes_1 = require("../../client/db/indes");
const user_1 = __importDefault(require("../../services/user"));
const redis_1 = require("../../client/redis");
const mutations = {
    followUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        if (!ctx.user || !ctx.user.id) {
            throw new Error("You are not authenticated");
        }
        yield user_1.default.followUser(ctx.user.id, to);
        yield redis_1.redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }),
    unFollowUser: (parent, { to }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        if (!ctx.user || !ctx.user.id) {
            throw new Error("You are not authenticated");
        }
        yield user_1.default.unFollowUser(ctx.user.id, to);
        yield redis_1.redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }),
};
const queries = {
    verifyGoogleAuthToken: (parent, { token }) => __awaiter(void 0, void 0, void 0, function* () {
        const userToken = user_1.default.verifyGoogleAuthToken(token);
        return userToken;
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        console.log(ctx.user);
        let id = (_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!id) {
            return null;
        }
        else {
            const user = user_1.default.getUserById(id);
            return user;
        }
    }),
    getUserById: (parent, { id }) => __awaiter(void 0, void 0, void 0, function* () {
        return yield indes_1.prismaClient.user.findUnique({ where: { id } });
    })
};
const extraResolvers = {
    User: {
        tweets: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            return yield indes_1.prismaClient.tweet.findMany({
                where: { author: { id: parent.id } }
            });
        }),
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            console.log('parent.id', parent.id);
            const result = yield indes_1.prismaClient.follows.findMany({
                where: { following: { id: parent.id } }, include: {
                    follower: true
                }
            });
            console.log('result followers', result);
            return result.map(el => el.follower);
        }),
        followings: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield indes_1.prismaClient.follows.findMany({
                where: { follower: { id: parent.id } }, include: {
                    following: true
                }
            });
            console.log('result following', result);
            return result.map(el => el.following);
        }),
        recommendedUsers: (parent, _, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            var _b;
            if (!((_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id)) {
                return [];
            }
            else {
                const cachedValue = yield redis_1.redisClient.get(`RECOMMENDED_USERS:${ctx.user.id}`);
                if (cachedValue)
                    return JSON.parse(cachedValue);
                const myFollowings = yield indes_1.prismaClient.follows.findMany({
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
                });
                console.log('myFollowings', myFollowings[0].following.follower);
                const userToRecommend = [];
                for (const followings of myFollowings) {
                    for (const followingsOfFollowedUser of followings.following.follower) {
                        if (followingsOfFollowedUser.following.id !== ctx.user.id && myFollowings.findIndex(el => el.followerId === followingsOfFollowedUser.following.id) < 0) {
                            userToRecommend.push(followingsOfFollowedUser.following);
                        }
                    }
                }
                yield redis_1.redisClient.set(`RECOMMENDED_USERS:${ctx.user.id}`, JSON.stringify(userToRecommend));
                return userToRecommend;
            }
        })
    }
};
exports.resolvers = { queries, extraResolvers, mutations };
