# NestJS + Lambda + CDK (powered by AWS Lambda Powertools)

## Webpack config
We use webpack as the build tool to bundle NestJS app to a single Javascript file
```
// webpack.config.js
module.exports = (options, webpack) => {
  const lazyImports = [
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets/socket-module',
  ];

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const TerserPlugin = require('terser-webpack-plugin');

  return {
    ...options,
    externals: [],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_classnames: true,
          },
        }),
      ],
    },
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
    plugins: [
      ...options.plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          if (lazyImports.includes(resource)) {
            try {
              require.resolve(resource);
            } catch (err) {
              return true;
            }
          }
          return false;
        },
      }),
    ],
  };
};
```

## Config AWS Lambda Powertools
[powertools](/app/src/powertools/utils.ts)
```
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger({
  persistentLogAttributes: {
    aws_account_id: process.env.AWS_ACCOUNT_ID || 'N/A',
    aws_region: process.env.AWS_REGION || 'N/A',
  },
});

const metrics = new Metrics({
  defaultDimensions: {
    aws_account_id: process.env.AWS_ACCOUNT_ID || 'N/A',
    aws_region: process.env.AWS_REGION || 'N/A',
  },
});

const tracer = new Tracer();

export { logger, metrics, tracer };
```

## NestJS main.ts
Transform NestJS app to Lambda Handler + AWS Lambda Powertools config
[main.ts](/app/src/main.ts)
```
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { logMetrics } from '@aws-lambda-powertools/metrics';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import middy from '@middy/core';
import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { AppModule } from './app.module';
import { logger, metrics, tracer } from './powertools/utils';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

const lambdaHandler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  logger.appendKeys({
    resource_path: event.requestContext.resourcePath,
  });
  server = server ?? (await bootstrap());
  return server(event, context, callback);
};

const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics, { captureColdStartMetric: true }))
  .use(injectLambdaContext(logger, { clearState: true }));

export { handler };

```

## Deploy stack
```
cd app
yarn build
cd ..
cdk deploy --profile my-profile
```

## Run offline
```
cd app
serverless offline
```