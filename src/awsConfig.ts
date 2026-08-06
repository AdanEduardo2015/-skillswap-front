import { Amplify } from "aws-amplify";

const DEFAULT_REDIRECT_SIGN_IN = [
  "http://127.0.0.1:5173/oauth-callback",
  "http://localhost:5173/oauth-callback",
  "https://d13n6erwppvnl7.cloudfront.net/oauth-callback",
  "https://comuni-red.com/oauth-callback",
];

const DEFAULT_REDIRECT_SIGN_OUT = [
  "http://127.0.0.1:5173/",
  "http://localhost:5173/",
  "https://d13n6erwppvnl7.cloudfront.net/",
  "https://comuni-red.com/",
];

const splitEnvList = (value: string | undefined, fallback: string[]) => {
  const items = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : fallback;
};

const requiredEnv = (key: string, fallback: string) => {
  const value = String(import.meta.env[key] || "").trim();
  return value || fallback;
};

const cognitoRegion = requiredEnv("VITE_COGNITO_REGION", "us-east-1");
const userPoolId = requiredEnv("VITE_COGNITO_USER_POOL_ID", "us-east-1_biQbutzMT");
const userPoolClientId = requiredEnv("VITE_COGNITO_USER_POOL_CLIENT_ID", "20j5terohkdksm6ofosp5q9bhm");
const cognitoDomain = requiredEnv(
  "VITE_COGNITO_DOMAIN",
  "skillswap-auth-prod.auth.us-east-1.amazoncognito.com"
);

if (!userPoolId.startsWith(`${cognitoRegion}_`)) {
  throw new Error(`Cognito userPoolId ${userPoolId} does not match region ${cognitoRegion}`);
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,

      loginWith: {
        oauth: {
          domain: cognitoDomain,
          scopes: ["openid", "email", "profile"],
          redirectSignIn: splitEnvList(
            import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN,
            DEFAULT_REDIRECT_SIGN_IN
          ),
          redirectSignOut: splitEnvList(
            import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT,
            DEFAULT_REDIRECT_SIGN_OUT
          ),
          responseType: "code",
        },
      },
    },
  },
});
