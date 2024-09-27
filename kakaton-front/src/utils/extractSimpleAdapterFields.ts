import type { Raw } from '@/@interfaces/Raw';
import { camelToSnakeCase } from '@/utils/string';

export function processBool(value: unknown): number {
  return Number(value);
}

// Common type processing on toRaw conversion go here. Special overrides must be processed per-adapter
const typeProcessorMap = {
  [typeof true]: processBool
};

export function processAdapterValue(value: unknown): unknown {
  if (!Object.keys(typeProcessorMap).includes(typeof value)) {
    return value;
  }

  return typeProcessorMap[typeof value](value);
}

export function extractSimpleAdapterFields(
  adapter: object,
  excludedKeys: string[] = [],
  convertUndefinedToNull = false,
  convertNullToUndefined = true
): Raw {
  return Object.entries(adapter as Record<string, unknown>)
    .filter(([key]) => !excludedKeys.includes(key))
    .reduce((raw: Raw, [entryKey, entryValue]) => {
      let processedValue = processAdapterValue(entryValue);

      if (convertUndefinedToNull && processedValue === undefined) {
        processedValue = null;
      } else if (convertNullToUndefined && processedValue === null) {
        processedValue = undefined;
      }

      raw[camelToSnakeCase(entryKey)] = processedValue;
      return raw;
    }, {});
}
