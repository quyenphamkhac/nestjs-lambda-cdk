import { Injectable } from '@nestjs/common';
import { Product } from './models/product';
import { DdbProductRepository } from './repositories/product-repository';

@Injectable()
export class AppService {
  constructor(private readonly productRepository: DdbProductRepository) {}

  getHello(): string {
    return 'Hello World!';
  }

  getProduct(id: string): Promise<Product | undefined> {
    return this.productRepository.getProduct(id);
  }
}
