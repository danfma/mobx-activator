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

test('it should ignore a property annotated with null', () => {
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
  reactive.options.autoBind = true;

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

test('it should decorate readonly fields with observable.ref', () => {
  interface MyObject {
    name: string;
  }

  @reactive
  class Container {
    constructor(readonly obj: MyObject) {

    }
  }
  const container = new Container({
    name: 'Daniel'
  });

  expect(isObservable(container)).toBeTruthy()
  expect(isObservableProp(container, 'obj')).toBeTruthy()
  expect(isObservable(container.obj)).toBeFalsy()
})


test('it should decorate overridden methods with override by default', () => {
  @reactive
  class Monster {
    getAttack() {
      return 'Slash'
    }
  }

  @reactive
  class Godzilla extends Monster {
    getAttack() {
      return `Atomic ${super.getAttack()}`
    }
  }

  const monster = new Monster()
  const godzilla = new Godzilla()

  expect(isObservable(monster)).toBeTruthy()
  expect(isAction(monster.getAttack)).toBeTruthy()
  expect(monster.getAttack()).toBe('Slash')

  expect(isObservable(godzilla)).toBeTruthy()
  expect(isAction(godzilla.getAttack)).toBeTruthy()
  expect(godzilla.getAttack()).toBe('Atomic Slash')
})

test('it should decorate overridden methods with override by default, when the parent has a constructor but not the child', () => {
  @reactive
  class Villain {
    constructor(readonly name: string) {

    }

    getPhrase() {
      return 'Attack!'
    }
  }

  @reactive
  class Joker extends Villain {
    getPhrase() {
      return 'Why so serious?'
    }
  }

  const villain = new Villain('Minion')
  const joker = new Joker('Jack Napier')

  expect(isObservable(villain)).toBeTruthy()
  expect(isAction(villain.getPhrase)).toBeTruthy()
  expect(villain.name).toBe('Minion')
  expect(villain.getPhrase()).toBe('Attack!')

  expect(isObservable(joker)).toBeTruthy()
  expect(isAction(joker.getPhrase)).toBeTruthy()
  expect(joker.name).toBe('Jack Napier')
  expect(joker.getPhrase()).toBe('Why so serious?')
})


test('it should decorate overridden methods with override by default, when the parent has a constructor and the child too', () => {
  @reactive
  class Villain {
    constructor(readonly name: string) {

    }

    getPhrase() {
      return 'Attack!'
    }
  }

  @reactive
  class Joker extends Villain {
    constructor(name: string) {
      super(name)
      console.log('New Joker in the city: ', name)
    }

    getPhrase() {
      return 'Why so serious?'
    }
  }

  const villain = new Villain('Minion')
  const joker = new Joker('Jack Napier')

  expect(isObservable(villain)).toBeTruthy()
  expect(isAction(villain.getPhrase)).toBeTruthy()
  expect(villain.name).toBe('Minion')
  expect(villain.getPhrase()).toBe('Attack!')

  expect(isObservable(joker)).toBeTruthy()
  expect(isAction(joker.getPhrase)).toBeTruthy()
  expect(joker.name).toBe('Jack Napier')
  expect(joker.getPhrase()).toBe('Why so serious?')
})
