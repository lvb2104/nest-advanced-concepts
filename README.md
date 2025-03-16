# NestJS Advanced Concepts

## I. Common Errors

### 1. "Cannot Resolve Dependency" Error

Document: [https://docs.nestjs.com/faq/common-errors#cannot-resolve-dependency-error](https://docs.nestjs.com/faq/common-errors#cannot-resolve-dependency-error)

* Use 'NEST_DEBUG=true' to see more information about the error.
* The string in yellow is the host class of the dependency being injected.
* The string in blue is the name of the dependency being injected, or its injection token.
* The string in purple is the module in which the dependency is being searched for.

### 2. "Object" Error

* If the <unknown_token> above is Object, it means that you're injecting using an type/interface without a proper provider's token.
* To fix this, you can use the `@Inject` decorator to specify the injection token explicitly.

### 3. Circular Dependency Error

* This error occurs when two or more classes depend on each other, creating a circular reference.
* We can use Madge to visualize the dependency graph and identify circular dependencies.
* To use it, run this command:

```bash
npx madge dist/main.js --circular
npx madge dist/main.js --image graph.png
```
