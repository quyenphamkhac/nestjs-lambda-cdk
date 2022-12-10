import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';
import { captureAWSv3Client } from 'aws-xray-sdk-core';
import { Product } from 'src/models/product';
import { tracer } from 'src/powertools/utils';

export interface ProductRepository {
  getProduct: (id: string) => Promise<Product | undefined>;
}

@Injectable()
export class DdbProductRepository implements ProductRepository {
  private static tableName = process.env.TABLE_NAME;
  private static ddbClient: DynamoDBClient = captureAWSv3Client(
    new DynamoDBClient({}),
  );
  private static ddbDocClient: DynamoDBDocumentClient =
    DynamoDBDocumentClient.from(DdbProductRepository.ddbClient);

  @tracer.captureMethod()
  public async getProduct(id: string): Promise<Product | undefined> {
    const params: GetCommand = new GetCommand({
      TableName: DdbProductRepository.tableName,
      Key: {
        id: id,
      },
    });
    const result: GetCommandOutput =
      await DdbProductRepository.ddbDocClient.send(params);

    return result.Item as Product;
  }
}
