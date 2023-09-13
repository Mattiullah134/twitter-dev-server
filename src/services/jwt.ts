import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { jwtUser } from "../interface";
const JWT_SECRET = "kslfj;alsjfopwiuerqweurpo"
class JWTService {
    public static generateJwtTokens(user: User) {
        try {

            const payload: jwtUser = {
                id: user?.id,
                email: user?.email
            }
            const token = jwt.sign(payload, JWT_SECRET)
            return token;
        } catch (error) {
            return null;
        }
    }
    public static decodeToken(token: string) {

        try {

            return jwt.verify(token, JWT_SECRET) as jwtUser;
        } catch (error) {
            return null;
        }
    }
}

export default JWTService;