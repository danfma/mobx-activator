import { isObservable, isObservableProp, isAction } from "mobx"
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

test('it should auto bind an action method', () => {
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
