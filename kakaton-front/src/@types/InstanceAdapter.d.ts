import { Raw } from '@/@interfaces/Raw';

export type instanceAdapter<T> = (raw: Raw) => T;

export type reverseInstanceAdapter<T> = (adapter: T) => Raw;

export type unknownAdapter<T> = (raw: unknown) => T;

export type reverseUnknownAdapter<T> = (adapter: T) => unknown;
