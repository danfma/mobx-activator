import type { Type, ReflectionInfo } from "./interfaces";

export const reflectionInfoKey = 'mobx-activator:type-info';

export function getReflectionInfo<T>(type: Type<T>): ReflectionInfo<T> | undefined {
  return Reflect.getMetadata(reflectionInfoKey, type);
}
