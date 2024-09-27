export type Id = string | number;

export type IdentifiableItem = {
  id: string | number;
  [key: string | number | symbol]: unknown;
};
