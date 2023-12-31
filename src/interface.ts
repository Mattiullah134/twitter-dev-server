export interface jwtUser {
    id: string,
    email: string
}
export interface GraphQlContext {
    user?: jwtUser
}
export interface GoogleUserInfo {
    iss: string;
    azp: string;
    aud: string;
    sub: string;
    email: string;
    email_verified: string;
    nbf: string;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
    locale: string;
    iat: string;
    exp: string;
    jti: string;
    alg: string;
    kid: string;
    typ: string;
}