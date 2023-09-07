import { CognitoJwtVerifier } from "aws-jwt-verify";
import {
  APIGatewayEvent,
  Context,
  APIGatewayProxyCallback,
} from "aws-lambda";

const COGNITO_USERPOOL_ID = process.env.COGNITO_USERPOOL_ID;
const COGNITO_WEB_CLIENT_ID = process.env.COGNITO_WEB_CLIENT_ID;

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: COGNITO_USERPOOL_ID as string,
  tokenUse: "id",
  clientId: COGNITO_WEB_CLIENT_ID,
});

const generatePolicy = (
  principalId: string,
  effect: string,
  resource: string
) => {
  var tmp = resource.split(":");
  var apiGatewayArnTmp = tmp[5].split("/");
  // Create wildcard resource
  var wildcardResource =
    tmp[0] +
    ":" +
    tmp[1] +
    ":" +
    tmp[2] +
    ":" +
    tmp[3] +
    ":" +
    tmp[4] +
    ":" +
    apiGatewayArnTmp[0] +
    "/*/*";
  var authResponse: any = {
    principalId: principalId,
  };
  if (effect && resource) {
    let policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: effect,
          Resource: wildcardResource,
          Action: "execute-api:Invoke",
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }

  authResponse.context = {
    foo: "bar",
  };
  console.log(JSON.stringify(authResponse));
  return authResponse;
};

export const handler = async (
  event: any,
  context: Context,
  callback: APIGatewayProxyCallback
) => {
  // lambda authorizer code
  var token = event.authorizationToken;
  console.log(token);

  try {
    const payload = await jwtVerifier.verify(token, {} as any);
    console.log(payload);
    callback(null, generatePolicy("user", "Allow", event.methodArn as string));
  } catch (error) {
    console.error("Error: ", error.message);
    callback("Error: Invalid token");
  }
};
