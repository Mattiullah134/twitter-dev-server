"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = void 0;
exports.types = `#graphql
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
    
    `;
// tweets:[Tweet]
