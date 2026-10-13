import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Availability, Business, Category, Facets, Product, ProductListResponse } from "../types";
import { type CatalogFilters, filtersToApiQuery } from "./filters";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/v1/catalog/categories"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFacets() {
  return useQuery({
    queryKey: ["facets"],
    queryFn: () => api.get<Facets>("/v1/catalog/facets"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(filters: CatalogFilters, limit = 48) {
  return useQuery({
    queryKey: ["products", filters, limit],
    queryFn: () =>
      api.get<ProductListResponse>(`/v1/catalog/products?${filtersToApiQuery(filters, limit)}`),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => api.get<Product>(`/v1/catalog/products/${slug}`),
    enabled: Boolean(slug),
    retry: false,
  });
}

export function useRelatedProducts(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug, "related"],
    queryFn: () => api.get<Product[]>(`/v1/catalog/products/${slug}/related`),
    enabled: Boolean(slug),
  });
}

export function useAvailability(refs: string[]) {
  const key = refs.slice().sort().join(",");
  return useQuery({
    queryKey: ["availability", key],
    queryFn: () =>
      api.get<Availability[]>(`/v1/inventory/availability?refs=${encodeURIComponent(key)}`),
    enabled: refs.length > 0,
  });
}

export function useBusiness() {
  return useQuery({
    queryKey: ["business"],
    queryFn: () => api.get<Business>("/v1/business"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useContactForm() {
  return useMutation({
    mutationFn: (input: { name: string; phone?: string; email?: string; message: string }) =>
      api.post("/v1/business/contact-messages", input),
  });
}
