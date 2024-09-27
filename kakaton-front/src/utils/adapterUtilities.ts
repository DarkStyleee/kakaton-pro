import Short from '@/adapters/Short';
import type { Raw } from '@/@interfaces/Raw';
import type { Id } from '@/@types/IdentifiableItem';

export function BooleanOrUndefined(raw: unknown): boolean | undefined {
  return !isUndefined(raw) ? Boolean(Number(raw)) : undefined;
}

export function TrueOrUndefined(raw: unknown): true | undefined {
  return !isUndefined(raw) ? true : undefined;
}

export function NumberOrUndefined(raw: unknown): number | undefined {
  return !isUndefined(raw) ? Number(raw) : undefined;
}

export function StringOrUndefined(raw: unknown): string | undefined {
  return !isUndefined(raw) ? String(raw) : undefined;
}

export function Identifier(raw: unknown): Id {
  const id = Number(raw);
  const isEmptyString = typeof raw === 'string' && !raw.trim().length;

  return !isEmptyString && Number.isInteger(id) ? id : String(raw);
}

export function IdentifierOrUndefined(raw: unknown): Id | undefined {
  return !isUndefined(raw) ? Identifier(raw) : undefined;
}

export function ShortOrUndefined(raw: Raw | undefined | null): Short | undefined {
  return raw ? Short.fromRaw(raw) : undefined;
}

export function ArrayOrEmptyArray<T, D>(raw: D, converter?: (value: D) => T): T[] {
  const definedConverter = converter ?? ((val: unknown) => val as T);

  return raw && Array.isArray(raw) ? raw.map(definedConverter) : raw ? [definedConverter(raw)] : [];
}

export function ArrayOrUndefined<T, D>(raw: D, converter?: (value: D) => T): T[] | undefined {
  const definedConverter = converter ?? ((val: unknown) => val as T);

  return raw && Array.isArray(raw)
    ? raw.map(definedConverter)
    : raw
      ? [definedConverter(raw)]
      : undefined;
}

export function InstanceOrUndefined<T, D>(raw: D, converter?: (value: D) => T): T | undefined {
  const definedConverter = converter ?? ((val: unknown) => val as T);

  return !isUndefined(raw) ? definedConverter(raw) : undefined;
}

function isUndefined(value: unknown): boolean {
  return value === undefined || value === null;
}

export function convertNullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value === null ? undefined : value;
}
