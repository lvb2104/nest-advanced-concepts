import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { CoffeesModule } from './coffees/coffees.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CronModule } from './cron/cron.module';
import { CronService } from './cron/cron.service';
import { FibonacciModule } from './fibonacci/fibonacci.module';
import { AppController } from './app.controller';

@Module({
  imports: [CoffeesModule, SchedulerModule, CronModule, FibonacciModule],
  controllers: [AppController],
  providers: [AppService, CronService],
})
export class AppModule {}
