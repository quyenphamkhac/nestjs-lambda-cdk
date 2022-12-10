import { MetricUnits } from '@aws-lambda-powertools/metrics';
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Product } from './models/product';
import { logger, metrics } from './powertools/utils';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/products/:id')
  async getProduct(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Product | undefined> {
    const result = await this.appService.getProduct(id);
    if (!result) {
      logger.warn(
        'No product with ID ' +
          id +
          ' found in the databases while trying to retrieve a product',
      );
      throw new NotFoundException(
        'No product with ID ' +
          id +
          ' found in the databases while trying to retrieve a product',
      );
    }
    logger.info('Product retrieved with ID ' + id, {
      details: { product: result },
    });
    metrics.addMetric('productRetrieved', MetricUnits.Count, 1);
    metrics.addMetadata('productId', id);

    return result;
  }
}
