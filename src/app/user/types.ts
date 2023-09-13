export const types = `#graphql
    type User {
        id:ID!
        firstname:String!
        lastname:String
        imageUrl:String
        email:String!
        tweets:[Tweet]
        followers:[User]
        followings:[User]
        recommendedUsers:[User]
    }
    
    `
// tweets:[Tweet]