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
const axios_1 = __importDefault(require("axios"));
const indes_1 = require("../client/db/indes");
const jwt_1 = __importDefault(require("./jwt"));
class UserService {
    static verifyGoogleAuthToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const googleOauthUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
            googleOauthUrl.searchParams.set("id_token", token);
            const { data } = yield axios_1.default.get(googleOauthUrl.toString(), {
                responseType: "json"
            });
            let user = yield indes_1.prismaClient.user.findUnique({ where: { email: data.email } });
            if (!user) {
                user = yield indes_1.prismaClient.user.create({
                    data: {
                        firstname: data.given_name,
                        lastname: data.family_name,
                        email: data.email,
                        imageUrl: data.picture
                    }
                });
            }
            const userInDb = yield indes_1.prismaClient.user.findUnique({ where: { email: user === null || user === void 0 ? void 0 : user.email } });
            if (!userInDb)
                throw new Error("User with this email is not exit");
            const userToken = jwt_1.default.generateJwtTokens(userInDb);
            console.log('userToken', userToken);
            return userToken;
        });
    }
    static getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("hi this is id => ", id);
            const user = yield indes_1.prismaClient.user.findUnique({ where: { id } });
            console.log(user);
            return user;
        });
    }
    static followUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield indes_1.prismaClient.follows.create({
                data: {
                    follower: { connect: { id: from } },
                    following: { connect: { id: to } }
                }
            });
        });
    }
    static unFollowUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield indes_1.prismaClient.follows.delete({
                where: { followerId_followingId: { followerId: from, followingId: to } }
            });
        });
    }
}
exports.default = UserService;
