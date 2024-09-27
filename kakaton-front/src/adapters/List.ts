import Paginator from '@/adapters/Paginator';
import type { Raw } from '@/@interfaces/Raw';
import type { instanceAdapter } from '@/@types/InstanceAdapter';

export default class Listing<T> {
  public items: T[];
  public paginator: Paginator;

  constructor(raw: Raw, instanceAdapter: instanceAdapter<T>) {
    this.items = raw['items'] ? raw['items'].map((item: Raw) => instanceAdapter(item)) : [];
    this.paginator = raw['paginator'] ? Paginator.fromRaw(raw['paginator']) : Paginator.fromRaw({});
  }

  static fromRaw<T>(raw: Raw, instanceAdapter: instanceAdapter<T>): Listing<T> {
    return new Listing<T>(raw, instanceAdapter);
  }

  static wrapItems<T>(items: T[]): Listing<T> {
    const empty = new Listing<unknown>({}, () => null);
    empty.items = items;
    return empty as Listing<T>;
  }
}
