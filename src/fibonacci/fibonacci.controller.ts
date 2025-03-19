import { Controller, Get, Query } from '@nestjs/common';
import { resolve } from 'path';
import Piscina from 'piscina';
// import { FibonacciWorkerHost } from './fibonacci-worker.host';

@Controller('fibonacci')
export class FibonacciController {
  // constructor(private readonly fibonacciWorker: FibonacciWorkerHost) {}

  fibonacciWorker = new Piscina({
    filename: resolve(__dirname, 'fibonacci.worker.js'),
  });

  @Get()
  fibonacci(@Query('n') n: number = 10): Promise<number> {
    return this.fibonacciWorker.run(n);
  }
}
