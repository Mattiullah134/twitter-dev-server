export const queries = `#graphql
    getTweets:[Tweet]
    getSignedUrlForTweet(imageName :String!,imageType: String!): String
`