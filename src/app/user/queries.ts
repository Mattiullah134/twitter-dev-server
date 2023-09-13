export const queries = `#graphql
    verifyGoogleAuthToken(token:String!):String!
    getCurrentUser:User
    getUserById(id:ID!):User
`