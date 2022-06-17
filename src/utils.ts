import { Maybe } from '@octokit/graphql-schema';

export type UnwrapMaybe<T> = NonNullable<T> extends Maybe<infer U> ? U : never;

export const notEmpty = <T>(val: T | null | undefined): val is T => {
  return val != null;
};
