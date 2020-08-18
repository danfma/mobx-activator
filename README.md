# mobx-activator

Typescript compiler transformer to enhance your types automatically when using the new Mobx 6.

## Dependencies

- Mobx 6+

## Usage

1. First, you need to add the transformer to your typescript compiler pipeline;

If you are using `ts-loader` with `webpack`, then you should add the transformer to the `getCustomTransformers` option of the bundler:

```javascript
{
  test: /\.tsx?$/,
  loader: 'ts-loader',
  options: {
    getCustomTransformers: program => ({
      before: [
        require('mobx-activator/lib/transformers/ts-transformer').transform()
      ]
    })
  }
}
```

If you are using `jest` with `ts-jest`, then you should add the transformer to the `ts-jest`'s globals configuration:

```javascript
module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      astTransformers: [
        'mobx-activator/lib/transformers/ts-jest-transformer'
      ]
    }
  }
}
```

2. Just decorate your classes with the `reactive` decorator:

```typescript
import { reactive } from 'mobx-activator';

@reactive
class MyThing {
}
```

> Don't forget to allow the `experimentalDecorators` in your `tsconfig.json`.

## Overriding the current configuration

The `reactive` decorator accepts the same parameter of the second parameter of the `mobx`'s `makeObservable`, except that you can specify `null` for a specific property to make it not observable.

```typescript

@reactive({
  id: null
})
class MyThing {
  constructor(
    readonly id: string,
    public name: string) {
  }
}

```
