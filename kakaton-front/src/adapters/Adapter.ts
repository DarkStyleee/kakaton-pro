import type { Raw } from '@/@interfaces/Raw';

type Constructor<T> = { new (raw: Raw): T };

export default class Adapter {
  // @typescript-eslint/no-unused-vars
  // @ts-ignore
  // eslint-disable-next-line
  constructor(raw: Raw) {
    // unpack raw
  }

  static fromRaw<T>(this: Constructor<T>, raw: Raw): T {
    return new this(raw);
  }
}
