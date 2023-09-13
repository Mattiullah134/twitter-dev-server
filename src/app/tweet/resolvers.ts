import { Tweet } from "@prisma/client"
import { prismaClient } from "../../client/db/indes"
import { GraphQlContext } from "../../interface"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import TweetService from "../../services/tweet";
interface CreateTweetData {
    content: string
    imageUrl?: string
}

const mutations = {
    createTweet: async (parent: any, { payload }: { payload: CreateTweetData }, ctx: GraphQlContext) => {
        console.log('ctx.user', ctx);
        if (!ctx.user?.id) {
            throw new Error("You are not authenticated")
        } else {

            return TweetService.createTweet({ ...payload, userId: ctx.user?.id })
        }
    }
}

const s3Client = new S3Client({
    region: process.env.AWS_DEFAULT_REGION
})
const queries = {
    getTweets: async () => TweetService.getTweets(),
    getSignedUrlForTweet: async (parent: any, { imageName, imageType }: { imageName: string, imageType: string }, ctx: GraphQlContext) => {
        console.log(ctx.user?.id);
        if (!ctx.user?.id) {
            throw new Error("You are aunthenticated")
        }
        const allowedImageType = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedImageType.includes(imageType)) {
            throw new Error("Unsupported image type")
        }
        console.log(process.env.AWS_S3_BUCKET);

        const putObjectCommand = new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            ContentType: imageType,
            Key: `/uploads/${ctx.user.id}/tweets/${imageName}-${Date.now()}`
        })
        const signedUrl = getSignedUrl(s3Client, putObjectCommand);
        console.log(signedUrl);

        return signedUrl;
    }
}
const extraResolvers = {
    Tweet: {
        author: async (parent: Tweet) => await prismaClient.user.findUnique({ where: { id: parent.authorId } })
    }
}
export const resolvers = { mutations, extraResolvers, queries }