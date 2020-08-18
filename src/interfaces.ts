export type Type<T> = {
  new?(...args: any[]): T;
  prototype: any;
};

export type TypeWithConstructor<T> = {
  new(...args: any[]): T;
  prototype: any;
};

export interface PropertyInfo<T> {
  name: keyof T;
  static: boolean;
  optional: boolean;
  declaredInConstructor: boolean;
}

export interface AccessInfo<T> {
  name: keyof T;
  static: boolean;
}

export interface MethodInfo<T> {
  name: keyof T;
  static: boolean;
}

export interface ReflectionInfo<T> {
  properties: PropertyInfo<T>[];
  getters: AccessInfo<T>[];
  methods: MethodInfo<T>[];
}
