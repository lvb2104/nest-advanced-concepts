# NestJS Advanced Concepts

## I. Common Errors

### 1. "Cannot Resolve Dependency" Error

Document: [https://docs.nestjs.com/faq/common-errors#cannot-resolve-dependency-error](https://docs.nestjs.com/faq/common-errors#cannot-resolve-dependency-error)

* Use 'NEST_DEBUG=true' to see more information about the error.
* The string in yellow is the host class of the dependency being injected.
* The string in blue is the name of the dependency being injected, or its injection token.
* The string in purple is the module in which the dependency is being searched for.

### 2. "Object" Error

If the <unknown_token> above is Object, it means that you're injecting using an type/interface without a proper provider's token.
To fix this, you can use the `@Inject` decorator to specify the injection token explicitly.

### 3. Circular Dependency Error

* This error occurs when two or more classes depend on each other, creating a circular reference.
* We can use Madge to visualize the dependency graph and identify circular dependencies.
* To use it, run this command:

```bash
npx madge dist/main.js --circular
npx madge dist/main.js --image graph.png
```

## II. Explicit and implicit dependencies

```ts
// implicit dependency
export class CoffeesController {
  constructor(private readonly appService: AppService) {}
}

// explicit dependency
export class CoffeesController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}
}
```

### Why?

When the TypeScript compiler transpiles files into JavaScript files. It leaves some additional metadata behind that allows us to use the reflection to analyze everything at runtime.

```ts
CoffeesController = __decorate([
  Injectable(),
  __metadata("design:paramtypes", [AppService])
], CoffeesController);
```

We have to explicitly use the inject annotation for dependencies that we can't simply reference by their classes. Like for example, the symbol and interface reference we used in the previous section.

```ts
exports.CoffeesController = CoffeesController = __decorate([
    (0, common_1.Controller)('coffees'),
    __param(0, (0, common_1.Inject)(coffees_service_1.CoffeesService)),
    __metadata("design:paramtypes", [coffees_service_1.CoffeesService, Object])
], CoffeesController);
```

As you can see, instead of having the coffee's data source reference or some type of coffee's data source related metadata, we simply have an object. This is because the TypeScript compiler doesn't know how to handle the interface type. So it just leaves it as an object reference. And so this is why for other types of providers, be it value providers or factory providers, we have to use inject decorators explicitly.

## III. Lazy-loading modules

Document: [https://docs.nestjs.com/fundamentals/lazy-loading-modules](https://docs.nestjs.com/fundamentals/lazy-loading-modules)

By default, NestJS loads all modules eagerly. This means that all modules are loaded when the application starts, even if they are not used immediately. It may become a bottleneck for large applications or workers running in a serverless environment, or having little to no startup latency or cold start is important.

## IV. Accessing IoC Container

NestJS provides powerful tools for accessing its Inversion of Control (IoC) container at runtime through the `DiscoveryService`. This allows us to dynamically discover, filter, and interact with providers based on metadata, types, and custom decorators.

### Goals

With IoC container access, we can:

* Dynamically discover providers at runtime
* Apply functionality across multiple services without hard-coding dependencies
* Create extensible plugin systems
* Implement aspects of Aspect-Oriented Programming (AOP)
* Build automatic scheduling, event listening, and other cross-cutting concerns

### Implementation Example: Interval Scheduling System

Our implementation demonstrates building a declarative interval scheduling system using IoC container access:

1.**Custom Class Decorator**: `IntervalHost` marks classes that should be scanned for scheduled methods:

```typescript
// src/scheduler/decorators/interval-host.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const INTERVAL_HOST_KEY = 'INTERVAL_HOST_KEY';

export const IntervalHost: ClassDecorator = SetMetadata(
  INTERVAL_HOST_KEY,
  true,
);
```

2.**Custom Method Decorator**: `Interval` marks methods that should run on a schedule:

```typescript
// src/scheduler/decorators/interval.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const INTERVAL_KEY = 'INTERVAL_KEY';
export const Interval = (ms: number) => SetMetadata(INTERVAL_KEY, ms);
```

3.**Scheduler Service**: Scans the application for decorated classes and methods:

```typescript
// src/scheduler/interval.scheduler.ts
@Injectable()
export class IntervalScheduler implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly intervals: NodeJS.Timeout[] = [];

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onApplicationBootstrap() {
    // Get all providers in the application
    const providers = this.discoveryService.getProviders();
    
    providers.forEach((wrapper) => {
      const { instance } = wrapper;
      const prototype = instance && Object.getPrototypeOf(instance);
      if (!instance || !prototype) {
        return;
      }
      
      // Check if this provider (class) is decorated with @IntervalHost
      const isIntervalHost =
        this.reflector.get(INTERVAL_HOST_KEY, instance.constructor) ?? false;
      if (!isIntervalHost) {
        return;
      }
      
      // Scan all methods in the provider (class)
      const methodKeys = this.metadataScanner.getAllMethodNames(prototype);
      methodKeys.forEach((methodKey) => {
        // Check if method is decorated with @Interval
        const interval = this.reflector.get(INTERVAL_KEY, instance[methodKey]);
        if (interval === undefined) {
          return;
        }
        
        // Schedule the method to run at the specified interval
        const intervalRef = setInterval(() => instance[methodKey](), interval);
        this.intervals.push(intervalRef);
      });
    });
  }

  onApplicationShutdown() {
    // Clean up all intervals when application shuts down
    this.intervals.forEach((intervalRef) => clearInterval(intervalRef));
  }
}
```

4.**Scheduler Module**: Imports `DiscoveryModule` to enable IoC container access:

```typescript
// src/scheduler/scheduler.module.ts
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { IntervalScheduler } from './interval.scheduler';

@Module({
  imports: [DiscoveryModule],
  providers: [IntervalScheduler],
})
export class SchedulerModule {}
```

5.**Usage Example**: Apply decorators to use the scheduling system:

```typescript
// src/cron/cron.service.ts
import { IntervalHost } from '../scheduler/decorators/interval-host.decorator';
import { Interval } from '../scheduler/decorators/interval.decorator';

@IntervalHost
export class CronService {
  @Interval(1000)
  everySecond() {
    console.log('This will be logged every second');
  }
}
```

This approach demonstrates how NestJS's IoC container empowers developers to build declarative, loosely coupled systems without explicitly wiring dependencies together.

## V. Worker Threads in NestJS

Document: [https://medium.com/@Abdelrahman_Rezk/understanding-worker-threads-in-nestjs-a-hands-on-guide-with-fibonacci-example-6f09998e9129#ea51](https://medium.com/@Abdelrahman_Rezk/understanding-worker-threads-in-nestjs-a-hands-on-guide-with-fibonacci-example-6f09998e9129#ea51)

### 1. What are Worker Threads?

Node.js is single-threaded by nature, meaning it can only execute one task at a time. CPU-intensive operations can block the event loop, preventing other operations from executing and degrading application performance. Worker threads solve this problem by allowing JavaScript code to run in parallel across multiple threads, improving performance for CPU-bound tasks without blocking the main event loop.

### 2. Goals

Our implementation of Worker Threads in NestJS aims to:

* Handle CPU-intensive tasks without blocking the main event loop
* Improve application responsiveness by offloading heavy computations
* Demonstrate a practical example using Fibonacci number calculation
* Show how to properly manage worker lifecycle (creation, communication, and cleanup)
* Implement a clean separation between main thread and worker thread logic

### 3. Implementation Example

Our implementation consists of three key components:

#### 1. Fibonacci Worker (`fibonacci.worker.ts`)

```typescript
function fib(n: number): number {
  // Base cases: fib(0) = 0, fib(1) = 1
  if (n < 2) {
    return n;
  }
  
  // Recursive case: fib(n) = fib(n-1) + fib(n-2)
  return fib(n - 1) + fib(n - 2);
}

// Export the worker function that will be called from the main thread
// The worker receives a number and returns the calculated Fibonacci value
module.exports = (n: number) => {
  return fib(n);
};
```

#### 2. Worker Host Service (`fibonacci-worker.host.ts`)

```typescript
import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { Observable, fromEvent, firstValueFrom } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class FibonacciWorkerHost implements OnApplicationBootstrap, OnApplicationShutdown {
  // Worker instance that will run in a separate thread
  private worker: Worker;
  
  // Observable that listens for messages from the worker
  private message$: Observable<{ id: string; result: number }>;

  onApplicationBootstrap() {
    // Create a new worker instance pointing to our worker file
    this.worker = new Worker(join(__dirname, 'fibonacci.worker.js'));
    
    // Create an observable from the worker's 'message' event
    this.message$ = fromEvent(this.worker, 'message') as Observable<{
      id: string;
      result: number;
    }>;
  }

  // Clean up the worker when the application shuts down
  async onApplicationShutdown() {
    await this.worker.terminate();
  }

  async run(n: number) {
    // Generate a unique ID for this calculation request
    const uniqueId = randomUUID();
    
    // Send the calculation request to the worker
    this.worker.postMessage({ n, id: uniqueId });
    
    // Wait for and return the first message that matches our request ID
    return firstValueFrom(
      this.message$.pipe(
        // Only process messages with our request ID
        filter(({ id }) => id === uniqueId),
        // Extract just the result
        map(({ result }) => result),
      ),
    );
  }
}
```

#### 3. Controller Using Piscina Thread Pool (`fibonacci.controller.ts`)

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { resolve } from 'path';
import Piscina from 'piscina'; // Thread pool manager

@Controller('fibonacci')
export class FibonacciController {
  // Create a thread pool pointing to our worker file
  // Piscina automatically manages thread creation and reuse
  fibonacciWorker = new Piscina({
    filename: resolve(__dirname, 'fibonacci.worker.js'),
  });

  @Get()
  fibonacci(@Query('n') n: number = 10): Promise<number> {
    // Delegate the calculation to our worker thread pool
    return this.fibonacciWorker.run(n);
  }
}
```

### 4. How It All Works Together

1. **Request Flow**: When a client makes a request to `/fibonacci?n=30`:
   * The controller receives the request on the main thread
   * The controller delegates the CPU-intensive calculation to a worker thread
   * The main thread remains free to handle other requests

2. **Worker Execution**:
   * The worker performs the Fibonacci calculation in isolation
   * The main event loop isn't blocked during computation
   * The worker sends the result back to the main thread

3. **Thread Management**:
   * `FibonacciWorkerHost` demonstrates manual worker creation and communication
   * The controller example uses Piscina to automatically manage a thread pool
   * Both approaches properly handle worker lifecycle and cleanup

4. **Performance Benefits**:
   * For a calculation like `fib(45)`, which might take several seconds
   * Without workers, the entire application would be unresponsive during calculation
   * With workers, only the specific calculation runs in parallel while the rest of the application remains responsive

This pattern is ideal for any CPU-intensive operations in NestJS applications, such as image processing, complex calculations, or data transformations.
