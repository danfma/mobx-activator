# mobx-activator

Typescript compiler transformer to enhance your types automatically when using the new Mobx 6.

## Dependencies

- Mobx 6+

## What does this tool?

If you are following and plan to use the new Mobx 6, you will realize that you have two new ways of defining your model as observable.

1. Using the superb `makeAutoObservable`;
2. Using the good `makeObservable`.

So, why do I have to use the `mobx-activator`? Well, we have some small problems here.

- First, you can't use the `makeAutoObservable` if your models have inheritance, but you still can use the `makeObservable`;
- When using the `makeObservable`, you have to take some caution to only annotate as `observable` the properties of your current type;
  - And, the thing could be very annoying if you have a big model with a lot of properties and actions (Yeah! You should have broken that beast but now it's too late!!);
  - And, to finish, you need to initialize all your properties, even those that will have the value undefined by default.

While the `mobx` team is doing an excellent job on it. There is some things that you can only do automatically when analyzing the structure of your type (the AST). That is exactly what this library does! It analyses your classes, remove that `@reactive` decorator, and call the `makeObservable` inside of the Type's constructor, annotating all properties, accessors and methods automatically for you.

Ok, I'm lying about a small detail. The `makeObservable` is not being called directly, but through the `reactive.enhance` function. This function will analyzing your type at runtime and initialize all the annotated properties with `undefined` if you haven't done that yet.

### Show me the code

If you have something like this:

```typescript
import { reactive } from 'mobx-acttivator'

@reactive
class Pilot {
  constructor(
    public name: string,
    public surname: string,
    public age: number) {

  }

  get isAdult() {
    return age >= 18 // ok, this is valid at least for Brazil!
  }

  setName(value: string) {
    this.name = value
  }

  setSurname(value: string) {
    this.surname = value
  }

  setAge(value: number) {
    this.age = value
  }
}
```

This will be transformed to:

```typescript
import { reactive } from 'mobx-acttivator'

class Pilot {
  constructor(
    public name: string,
    public surname: string,
    public age: number) {

    reactive.enhance(Pilot, this, [
      [['name', false], ['surname', false], ['age': false]],
      ['isAdult'],
      ['setName', 'setSurname', 'setAge']
    ])
  }

  get isAdult() {
    return age >= 18 // ok, this is valid at least for Brazil!
  }

  setName(value: string) {
    this.name = value
  }

  setSurname(value: string) {
    this.surname = value
  }

  setAge(value: number) {
    this.age = value
  }
}
```

which would be the equivalent of writing by yourself the following:

```typescript
import { makeObservable, observable, computed, action } from 'mobx'

class Pilot {
  constructor(
    public name: string,
    public surname: string,
    public age: number) {

    makeObservable(this, {
      name: observable,
      surname: observable,
      age: observable,
      isAdult: computed,
      setName: action,
      setSurname: action,
      setAge: action
    })
  }

  get isAdult() {
    return age >= 18 // ok, this is valid at least for Brazil!
  }

  setName(value: string) {
    this.name = value
  }

  setSurname(value: string) {
    this.surname = value
  }

  setAge(value: number) {
    this.age = value
  }
}
```

So, in the end, this can save your fingers a bit.

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

The `reactive` decorator accepts the same parameter of the second parameter of the `mobx`'s `makeObservable`, except that you can specify `null` for a specific property to make it not observable, by not applying the annotation that property.

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

## Default behavior

The `reactive` has some default configurations, like:

```typescript
import { reactive } from 'mobx-activator'

/**
 * When true, all your actions will be annotated with the `action.bind` by default.
 */
reactive.options.autoBind = false /* default value */

/**
 * When true, if you define a property as readonly, in TypeScript,
 * then we will use the `observable.ref` instance of just the `observable`.
 */
reactive.options.readOnlyAsObservableRef = true; /* default value */
```
