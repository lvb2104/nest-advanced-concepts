import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoffeesModule } from './coffees/coffees.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CronModule } from './cron/cron.module';
import { CronService } from './cron/cron.service';

@Module({
  imports: [CoffeesModule, SchedulerModule, CronModule],
  controllers: [AppController],
  providers: [AppService, CronService],
})
export class AppModule {}
