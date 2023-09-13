import axios from "axios";
import { prismaClient } from "../client/db/indes";
import { GoogleUserInfo } from "../interface";
import JWTService from "./jwt";

class UserService {
    public static async verifyGoogleAuthToken(token: string) {
        const googleOauthUrl = new URL("https://oauth2.googleapis.com/tokeninfo")
        googleOauthUrl.searchParams.set("id_token", token);

        const { data } = await axios.get<GoogleUserInfo>(googleOauthUrl.toString(), {
            responseType: "json"
        });
        let user = await prismaClient.user.findUnique({ where: { email: data.email } });
        if (!user) {
            user = await prismaClient.user.create({
                data: {
                    firstname: data.given_name,
                    lastname: data.family_name,
                    email: data.email,
                    imageUrl: data.picture
                }
            })

        }
        const userInDb = await prismaClient.user.findUnique({ where: { email: user?.email } });
        if (!userInDb) throw new Error("User with this email is not exit");
        const userToken = JWTService.generateJwtTokens(userInDb);
        console.log('userToken', userToken);

        return userToken;
    }

    public static async getUserById(id: string) {
        console.log("hi this is id => ", id);

        const user = await prismaClient.user.findUnique({ where: { id } });
        console.log(user);

        return user
    }
    public static async followUser(from: string, to: string) {
        return await prismaClient.follows.create({
            data: {
                follower: { connect: { id: from } },
                following: { connect: { id: to } }

            }
        })
    }
    public static async unFollowUser(from: string, to: string) {
        return await prismaClient.follows.delete({
            where: { followerId_followingId: { followerId: from, followingId: to } }
        })
    }
}

export default UserService