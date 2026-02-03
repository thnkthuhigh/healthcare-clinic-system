export type Id = string;

export type IsoDateString = string;
export type IsoDateTimeString = string;

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
};

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};
