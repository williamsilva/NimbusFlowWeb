export interface HalLink {
  href: string;
}

export interface HalLinks {
  self?: HalLink;
  [key: string]: HalLink | undefined;
}

export interface HalPageMeta {
  page: number; // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface HalPagedResponse<T, TCollectionKey extends string = 'content'> {
  _embedded?: {
    [K in TCollectionKey]: T[];
  };
  _links?: HalLinks;
  page?: HalPageMeta;
}
