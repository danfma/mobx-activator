import { makeObservable, observable, computed, action } from 'mobx';
import type { ReflectionInfo, Type } from './interfaces';
import { AnnotationMapEntry, objectPrototype } from 'mobx/dist/internal';

export function reactive(
  reflectionInfo: ReflectionInfo<any>,
  overrides: Partial<Record<string, AnnotationMapEntry | null>>,
  config?: { autoBind?: boolean }
): (target: any) => any;

export function reactive(
  overrides: Partial<Record<string, AnnotationMapEntry | null>>,
  config?: { autoBind?: boolean }
): (target: any) => any;

export function reactive(
  target: any
): any;

export function reactive(): any {
  throw new Error('This type should be enhanced at compile time. Did you forget to apply the transformer?');
}

type Members = [
  /* properties */ Array<string>,
  /* accessors */ Array<string>,
  /* methods */ Array<string>
];

type AutoFactory<T> = (target: T) => void;

const autoFactoryMap = new Map<Type<any>, AutoFactory<any>>();

reactive.autoBind = false;

reactive.enhance = function enhance<T>(
  type: Type<T>,
  target: T,
  members: Members,
  overrides: Partial<Record<keyof T, AnnotationMapEntry | null>> = {}) {

  let autoFactory = autoFactoryMap.get(type) as AutoFactory<T> | undefined;

  if (autoFactory) {
    autoFactory(target);
    return;
  }

  const autoBind = reactive.autoBind;
  const annotationsMap: Partial<Record<keyof T, AnnotationMapEntry>> = {};
  const [properties, accessors, methods] = members;

  for (const property of properties) {
    annotationsMap[property as keyof T] = observable;
  }

  for (const accessor of accessors) {
    annotationsMap[accessor as keyof T] = computed;
  }

  for (const method of methods) {
    annotationsMap[method as keyof T] = autoBind ? action.bound : action;
  }

  Object.assign(annotationsMap, overrides);

  Object.keys(annotationsMap).forEach(property => {
    if (!annotationsMap[property as keyof T]) {
      delete annotationsMap[property as keyof T]
    }

    const isDefinedProperty = property in target;

    if (!isDefinedProperty) {
      type.prototype[property] = undefined;
    }
  });

  autoFactory = (target) => {
    makeObservable(target, annotationsMap);
  };

  autoFactory(target);
}
