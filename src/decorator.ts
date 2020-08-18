import 'reflect-metadata';
import { makeObservable, observable, computed, action } from 'mobx';
import type { ReflectionInfo } from './interfaces';
import type { AnnotationMapEntry } from 'mobx/dist/internal';

function isReflectionInfo(something: any): something is ReflectionInfo<any> {
  return (
    'properties' in something && Array.isArray(something.properties) &&
    'getters' in something && Array.isArray(something.getters) &&
    'methods' in something && Array.isArray(something.methods)
  );
}

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

export function reactive(
  targetOrReflectionInfo?: any,
  overrides: Partial<Record<string, AnnotationMapEntry | null>> = {}, 
  config: { autoBind?: boolean } = { autoBind: true }
): any {

  const decorator = (type: any) => {
    // TODO get from other place
    const { autoBind = true } = config;
    const annotationsMap: Partial<Record<string, AnnotationMapEntry>> = {};
    const reflectionInfo: ReflectionInfo<any> = targetOrReflectionInfo;

    reflectionInfo?.properties
      .filter(x => !x.static)
      .map(x => x.name)
      .forEach(propertyName => {
        annotationsMap[propertyName as string] = observable;
      });

    reflectionInfo?.getters
      .filter(x => !x.static)
      .map(x => x.name)
      .forEach(accessorName => {
        annotationsMap[accessorName as string] = computed;
      });


    reflectionInfo?.methods
      .filter(x => !x.static)
      .map(x => x.name)
      .forEach(methodName => {
        annotationsMap[methodName as string] = autoBind ? action.bound : action;
      });

    Object.assign(annotationsMap, overrides);

    for (const key of Object.keys(annotationsMap)) {
      if (annotationsMap[key] === null) {
        delete annotationsMap[key];
      }
    }

    reflectionInfo?.properties.forEach(property => {
      const isDefinedProperty = property.name in type.prototype;

      if (!isDefinedProperty) {
        type.prototype[property.name] = undefined;
      }
    });

    return class ReactiveModel extends type {
      constructor(...args: any[]) {
        super(args);
        makeObservable(this, annotationsMap as any);
      }
    }
  };

  if (isReflectionInfo(targetOrReflectionInfo)) {
    return decorator;
  }

  console.log('RECEIVED', arguments);

  throw new Error('This type should be enhanced at compile time');
}
