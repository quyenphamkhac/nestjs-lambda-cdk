import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  aws_apigateway,
  aws_lambda_nodejs,
  aws_dynamodb,
  aws_logs,
  aws_lambda,
} from "aws-cdk-lib";

export class NestjsLambdaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const productsTable = new aws_dynamodb.Table(this, "Products", {
      tableName: "Products",
      partitionKey: {
        name: "id",
        type: aws_dynamodb.AttributeType.STRING,
      },
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const envVariables = {
      AWS_ACCOUNT_ID: cdk.Stack.of(this).account,
      POWERTOOLS_SERVICE_NAME: "hello-world-service",
      POWERTOOLS_LOGGER_LOG_LEVEL: "WARN",
      POWERTOOLS_LOGGER_SAMPLE_RATE: "0.01",
      POWERTOOLS_LOGGER_LOG_EVENT: "true",
      POWERTOOLS_METRICS_NAMESPACE: "NestjsLambdaCdk",
    };

    const esBuildSettings = {
      minify: true,
    };

    const functionSettings = {
      handler: "handler",
      runtime: aws_lambda.Runtime.NODEJS_16_X,
      memorySize: 256,
      environment: {
        TABLE_NAME: productsTable.tableName,
        ...envVariables,
      },
      logRetention: aws_logs.RetentionDays.ONE_WEEK,
      tracing: aws_lambda.Tracing.ACTIVE,
      bundling: esBuildSettings,
    };

    const helloService = new aws_lambda_nodejs.NodejsFunction(
      this,
      "HelloService",
      {
        awsSdkConnectionReuse: true,
        entry: "./app/dist/main.js",
        ...functionSettings,
      }
    );

    productsTable.grantReadData(helloService);

    const api = new aws_apigateway.LambdaRestApi(this, "MyApi", {
      handler: helloService,
      proxy: true,
    });

    new cdk.CfnOutput(this, "MyApiURL", {
      value: `${api.url}`,
    });
  }
}
