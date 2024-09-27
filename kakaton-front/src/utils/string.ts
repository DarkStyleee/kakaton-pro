import { upperFirst } from 'lodash-es';

export const camelCase = (string: string, separator = ' ', isPascalCase = false): string => {
  return string
    .split(separator)
    .map((namePart: string, index: number) =>
      !isPascalCase && index === 0 ? namePart : upperFirst(namePart)
    )
    .join(separator);
};

export const camelToSnakeCase = (string: string): string =>
  string.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
