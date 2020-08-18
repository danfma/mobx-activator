import { isObservable, isObservableProp, isAction, isComputed, isComputedProp } from "mobx"
import { reactive } from "../src"

test('it should transform a simple type without a constructor', () => {
  @reactive
  class Thing {
    name = ''
  }

  const thing = new Thing();

  expect(isObservable(thing)).toBeTruthy()
  expect(isObservableProp(thing, 'name')).toBeTruthy()
})

test('it should transform a simple type with a constructor', () => {
  @reactive
  class Thing {
    constructor(public name: string = '') {

    }
  }

  const thing = new Thing();

  expect(isObservable(thing)).toBeTruthy()
  expect(isObservableProp(thing, 'name')).toBeTruthy()
})

test('it should enhance computed properties', () => {
  @reactive
  class Thing {
    constructor(public name: string = '') {

    }

    get length() {
      return this.name.length
    }
  }

  const thing = new Thing();

  expect(isObservable(thing)).toBeTruthy()
  expect(isObservableProp(thing, 'name')).toBeTruthy()
  expect(isComputedProp(thing, 'length')).toBeTruthy()
})

test('it should ignore a property anotated with null', () => {
  @reactive({
    surname: null
  })
  class Thing {
    constructor(
      public name = '',
      public surname = '') {

    }
  }

  const thing = new Thing();

  expect(isObservable(thing)).toBeTruthy()
  expect(isObservableProp(thing, 'name')).toBeTruthy()
  expect(isObservableProp(thing, 'surname')).toBeFalsy()
})

test('it should not auto bind an action method unless configured', () => {
  @reactive
  class Thing {
    constructor(
      public name = '',
      public surname = '') {

    }

    setName(value: string) {
      this.name = value
    }
  }

  const thing = new Thing();

  expect(isObservable(thing)).toBeTruthy()
  expect(isObservableProp(thing, 'name')).toBeTruthy()
  expect(isObservableProp(thing, 'surname')).toBeTruthy()
  expect(isAction(thing.setName)).toBeTruthy()

  const setName = thing.setName

  expect(() => setName('ABC')).toThrowError()
})

test('it should auto bind an action method when configured', () => {
  reactive.autoBind = true;

  @reactive
  class Thing {
    constructor(
      public name = '',
      public surname = '') {

    }

    setName(value: string) {
      this.name = value
    }
  }

  const thing = new Thing();

  expect(isObservable(thing)).toBeTruthy()
  expect(isObservableProp(thing, 'name')).toBeTruthy()
  expect(isObservableProp(thing, 'surname')).toBeTruthy()
  expect(isAction(thing.setName)).toBeTruthy()

  const setName = thing.setName

  setName('ABC')
  expect(thing.name).toBe('ABC')
})


test('it should allow to enhance types with inheritance', () => {
  @reactive
  class Point {
    constructor(public x: number, public y: number) {

    }
  }

  @reactive
  class Point3D extends Point {
    constructor(x: number, y: number, public z: number) {
      super(x, y);
    }
  }

  const point = new Point3D(0, 0, 0);

  expect(isObservable(point)).toBeTruthy()
  expect(isObservableProp(point, 'x')).toBeTruthy()
  expect(isObservableProp(point, 'y')).toBeTruthy()
  expect(isObservableProp(point, 'z')).toBeTruthy()
  expect(point).toEqual({ x: 0, y: 0, z: 0 });
})
