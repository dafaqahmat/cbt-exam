import { useEffect, useMemo, useState } from "react";

export type SearchPredicate<T> = (item: T, query: string) => boolean;

interface UsePaginationOptions<T> {
  pageSize?: number;
  searchBy?: SearchPredicate<T>;
}

interface UsePaginationResult<T> {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  items: T[];
  startIndex: number;
  endIndex: number;
  search: string;
  setSearch: (value: string) => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

const defaultPredicate: UsePredicate = () => true;

type UsePredicate = <T>(item: T, query: string) => boolean;

export function usePagination<T>(
  allItems: T[] | undefined,
  { pageSize = 10, searchBy }: UsePaginationOptions<T> = {}
): UsePaginationResult<T> {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const predicate = searchBy ?? defaultPredicate;

  const filtered = useMemo(() => {
    const items = allItems ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => predicate(item, query));
  }, [allItems, search, predicate]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(1, next), totalPages));
  };

  return {
    page: safePage,
    pageSize,
    totalPages,
    totalItems,
    items: pageItems,
    startIndex: totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1,
    endIndex: Math.min(safePage * pageSize, totalItems),
    search,
    setSearch,
    goToPage,
    nextPage: () => goToPage(safePage + 1),
    prevPage: () => goToPage(safePage - 1),
  };
}