import Adapter from '@/adapters/Adapter';
import type { Raw } from '@/@interfaces/Raw';
import { extractSimpleAdapterFields } from '@/utils/extractSimpleAdapterFields';

export default class Paginator extends Adapter {
  public total: number;
  public size: number;
  public page: number;

  constructor(raw: Raw) {
    super(raw);
    this.total = Number(raw['total'] || 0);
    this.size = Number(raw['size'] || raw['size'] || 20);
    this.page = Number(raw['page'] || raw['page'] || 1);
  }

  static toRaw(adapter: Paginator): Raw {
    return extractSimpleAdapterFields(adapter);
  }
}
