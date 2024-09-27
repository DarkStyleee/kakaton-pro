import type { Raw } from '@/@interfaces/Raw';
import type { Id } from '@/@types/IdentifiableItem';
import { Identifier } from '@/utils/adapterUtilities';
import Adapter from '@/adapters/Adapter';

export default class Short extends Adapter {
  public id: Id;
  public name: string;

  constructor(raw: Raw) {
    super(raw);
    this.id = Identifier(raw['id']);
    this.name = String(raw['name']);
  }

  static toRaw(short: Short): Raw {
    const raw: Raw = {};

    raw['id'] = short.id;
    raw['name'] = short.name;

    return raw;
  }
}
