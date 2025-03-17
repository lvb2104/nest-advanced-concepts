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

## IV. Accessing IoC container
