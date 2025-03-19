import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { filter, firstValueFrom, fromEvent, map, Observable } from 'rxjs';
import { Worker } from 'worker_threads';

@Injectable()
export class FibonacciWorkerHost
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private worker: Worker; // Worker instance
  private message$: Observable<{ id: string; result: number }>; // store our messages in our RxJS observable

  onApplicationBootstrap() {
    // initialize the worker with the specified script
    this.worker = new Worker(join(__dirname, 'fibonacci.worker.js'));
    // creating an observable from the worker's message events
    this.message$ = fromEvent(this.worker, 'message') as unknown as Observable<{
      id: string;
      result: number;
    }>;
  }
  async onApplicationShutdown(signal?: string) {
    // terminate the worker thread
    await this.worker.terminate();
  }

  async run(n: number) {
    const uniqueId = randomUUID(); // generate a unique ID for the task
    this.worker.postMessage({ n, id: uniqueId }); // send the task to the worker thread with input number and unique ID
    return firstValueFrom(
      this.message$.pipe(
        filter(({ id }) => id === uniqueId),
        map(({ result }) => result),
      ),
    );
  }
}
