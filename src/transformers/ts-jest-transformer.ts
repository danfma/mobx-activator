import transform from "./ts-transformer";

export const name = 'ts-jest-transformer';
export const version = 1;

export function factory() {
  return transform();
}
