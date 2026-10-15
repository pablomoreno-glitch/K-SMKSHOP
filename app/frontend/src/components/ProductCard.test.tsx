import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import type { Product } from "../types";

const product: Product = {
  ref: "VP-011",
  slug: "nimmbox-flux",
  name: "Nimmbox Flux",
  brand: "Nimmbox",
  category: { slug: "alta-capacidad", name: "Alta capacidad" },
  device_type: "desechable",
  flavors: [],
  puffs: 40000,
  nicotine_percent: 5,
  battery_mah: null,
  charging: null,
  modes: null,
  highlights: [],
  description: "",
  image_url: "/media/products/nimmbox-flux.webp",
  price: 45000,
  pack_price: 80000,
  pack_size: 2,
  is_featured: false,
  is_new: false,
  is_active: true,
};

/** A tiny in-memory orders service: one cart whose lines are set with PUT. */
function fakeCartServer() {
  const quantities = new Map<string, number>();
  const puts: number[] = [];
  const cart = () => ({
    token: "cart-1",
    items: [...quantities].map(([ref, quantity]) => ({ ref, quantity, source: "catalog" })),
    item_count: quantities.size,
    subtotal: 0,
    has_unpriced: false,
  });
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === "PUT") {
      const ref = url.split("/").pop()!;
      const { quantity } = JSON.parse(String(init.body)) as { quantity: number };
      puts.push(quantity);
      quantities.set(ref, quantity);
    }
    return new Response(JSON.stringify(cart()), { status: 200 });
  });
  return { fetchMock, puts, quantities };
}

describe("ProductCard add button", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("adds one unit per click instead of resetting the quantity to 1", async () => {
    const server = fakeCartServer();
    vi.stubGlobal("fetch", server.fetchMock);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ProductCard product={product} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const button = screen.getByRole("button", { name: /agregar nimmbox flux/i });

    fireEvent.click(button);
    await waitFor(() => expect(server.quantities.get("VP-011")).toBe(1));
    await waitFor(() => expect(button).toBeEnabled());

    fireEvent.click(button);
    await waitFor(() => expect(server.quantities.get("VP-011")).toBe(2));
    expect(server.puts).toEqual([1, 2]);
  });
});
