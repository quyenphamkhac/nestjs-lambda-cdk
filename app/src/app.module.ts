import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DdbProductRepository } from './repositories/product-repository';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, DdbProductRepository],
})
export class AppModule {}
