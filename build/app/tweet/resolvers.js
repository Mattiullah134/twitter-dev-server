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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const tweet_1 = __importDefault(require("../../services/tweet"));
const mutations = {
    createTweet: (parent, { payload }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        console.log('ctx.user', ctx);
        if (!((_a = ctx.user) === null || _a === void 0 ? void 0 : _a.id)) {
            throw new Error("You are not authenticated");
        }
        else {
            return tweet_1.default.createTweet(Object.assign(Object.assign({}, payload), { userId: (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id }));
        }
    })
};
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_DEFAULT_REGION
});
const queries = {
    getTweets: () => __awaiter(void 0, void 0, void 0, function* () { return tweet_1.default.getTweets(); }),
    getSignedUrlForTweet: (parent, { imageName, imageType }, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _c, _d;
        console.log((_c = ctx.user) === null || _c === void 0 ? void 0 : _c.id);
        if (!((_d = ctx.user) === null || _d === void 0 ? void 0 : _d.id)) {
            throw new Error("You are aunthenticated");
        }
        const allowedImageType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedImageType.includes(imageType)) {
            throw new Error("Unsupported image type");
        }
        console.log(process.env.AWS_S3_BUCKET);
        const putObjectCommand = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            ContentType: imageType,
            Key: `/uploads/${ctx.user.id}/tweets/${imageName}-${Date.now()}`
        });
        const signedUrl = (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectCommand);
        console.log(signedUrl);
        return signedUrl;
    })
};
const extraResolvers = {
    Tweet: {
        author: (parent) => __awaiter(void 0, void 0, void 0, function* () { return yield indes_1.prismaClient.user.findUnique({ where: { id: parent.authorId } }); })
    }
};
exports.resolvers = { mutations, extraResolvers, queries };
