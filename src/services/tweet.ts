import { prismaClient } from "../client/db/indes";
import { redisClient } from "../client/redis";
export interface CreateTweetData {
    content: string
    imageUrl?: string
    userId: string
}
class TweetService {
    public static async getTweets() {
        const cachedTweets = await redisClient.get(`ALL_TWEETS`);
        if (cachedTweets) return JSON.parse(cachedTweets);
        const data = await prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } })
        await redisClient.set(`ALL_TWEETS`, JSON.stringify(data));
        return data;
    }
    public static async createTweet(data: CreateTweetData) {
        console.log(data);
        const rateLimetFlag = await redisClient.get(`RATE_LIMIT:TWEET:${data.userId}`);
        if (rateLimetFlag) {
            throw new Error("Please Wait")
        }

        const tweet = await prismaClient.tweet.create({
            data: {
                content: data.content,
                imageUrl: data.imageUrl,
                author: { connect: { id: data.userId } }
            }
        })
        await redisClient.del(`ALL_TWEETS`);
        await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1)
        return tweet;
    }
}
export default TweetService