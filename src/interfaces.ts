export type Type<T> = {
  new?(...args: any[]): T;
  prototype: any;
};

export type TypeWithConstructor<T> = {
  new(...args: any[]): T;
  prototype: any;
};

export type PropertyInfo = [
  /* name */ string,
  /* readOnly */ boolean
];

export type MethodInfo = [
  /* name */ string,
  /* override */ boolean
];

export type Members = [
  /* properties */ Array<PropertyInfo>,
  /* accessors */ Array<string>,
  /* methods */ Array<MethodInfo>
];

export type AutoFactory<T> = (target: T) => void;
