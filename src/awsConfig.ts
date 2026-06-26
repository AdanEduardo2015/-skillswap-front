import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_Tib3xMk2L",
      userPoolClientId: "4geq8qheqvrapneafq5pqgga1f",

      loginWith: {
        oauth: {
          domain: "comunired-auth-prod.auth.us-east-1.amazoncognito.com",
          scopes: ["openid", "email", "profile"],
          redirectSignIn: ["https://comuni-red.com/oauth-callback"],
          redirectSignOut: ["https://comuni-red.com/"],
          responseType: "code",
        },
      },
    },
  },
});
