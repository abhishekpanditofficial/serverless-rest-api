import * as DynamoDB from "aws-sdk/clients/dynamodb";
import {
  APIGatewayEvent,
  Context,
  APIGatewayProxyCallback,
} from "aws-lambda";
import { String } from "aws-sdk/clients/acm";

const documentClient = new DynamoDB.DocumentClient({
  region: "us-east-1",
  maxRetries: 3,
  httpOptions: {
    timeout: 5000,
  },
});
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode: number, data: any) => {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
};

export const createNote = async (
  event: APIGatewayEvent,
  context: Context,
  cb: APIGatewayProxyCallback
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let data = JSON.parse(event.body as string);
  try {
    const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: NOTES_TABLE_NAME as String,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body,
      },
      ConditionExpression: "attribute_not_exists(notesId)",
    };
 
    await documentClient.put(params).promise();

    cb(null, send(201, data));
  } catch (error) {
    cb(null, send(500, error.message));
  }
};

export const updateNote = async (
  event: APIGatewayEvent,
  context: Context,
  cb: APIGatewayProxyCallback
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters?.id as string;
  let data = JSON.parse(event.body as string);

  try {
    const params: DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: NOTES_TABLE_NAME as string,
      Key: { notesId },
      UpdateExpression: "set #title = :title, #body = :body",
      ExpressionAttributeNames: {
        "#title": "title",
        "#body": "body",
      },
      ExpressionAttributeValues: {
        ":title": data.title,
        ":body": data.body,
      },
      ConditionExpression: "attribute_exists(notesId)",
    };

    await documentClient.update(params).promise();
    cb(null, send(200, data));
  } catch (error) {
    cb(null, send(500, error.message));
  }
};

export const deleteNote = async (
  event: APIGatewayEvent,
  context: Context,
  cb: APIGatewayProxyCallback
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let notesId = event.pathParameters?.id;
  try {
    const params: DynamoDB.DocumentClient.DeleteItemInput = {
      TableName: NOTES_TABLE_NAME as string,
      Key: { notesId },
      ConditionExpression: "attribute_exists(notesId)",
    };

    await documentClient.delete(params).promise();
    cb(
      null,
      send(200, {
        message: `Note with ${notesId} have been successfully deleted!`,
      })
    );
  } catch (error) {
    cb(null, send(500, error.message));
  }
};

export const getAllNotes = async (
  event: APIGatewayEvent,
  context: Context,
  cb: APIGatewayProxyCallback
) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const params: DynamoDB.DocumentClient.ScanInput = {
      TableName: NOTES_TABLE_NAME as string,
    };

    const notes = await documentClient.scan(params).promise();
    cb(null, send(200, notes));
  } catch (error) {
    cb(null, send(500, error.message));
  }
};
