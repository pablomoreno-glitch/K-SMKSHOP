import { afterEach, describe, expect, it } from "vitest";
import { getCartToken, MAX_CART_QUANTITY, quantityAfterAdding, setCartToken } from "./cart";
import type { Cart, CartItem } from "../types";

describe("cart token helper", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(getCartToken()).toBeNull();
  });

  it("persists a token to localStorage", () => {
    setCartToken("abc-123");
    expect(getCartToken()).toBe("abc-123");
    expect(localStorage.getItem("vp_cart_token")).toBe("abc-123");
  });

  it("removes the token when set to null", () => {
    setCartToken("abc-123");
    setCartToken(null);
    expect(getCartToken()).toBeNull();
  });
});

const line = (ref: string, quantity: number): CartItem => ({
  ref,
  slug: ref.toLowerCase(),
  name: ref,
  image_url: "",
  price: 45000,
  quantity,
  line_total: 45000 * quantity,
  source: "catalog",
});

const cartWith = (...items: CartItem[]): Cart => ({
  token: "t",
  items,
  item_count: items.length,
  subtotal: 0,
  has_unpriced: false,
});

describe("quantityAfterAdding", () => {
  it("starts from zero when the product is not in the cart", () => {
    expect(quantityAfterAdding(cartWith(line("VP-001", 3)), "VP-011", 1)).toBe(1);
    expect(quantityAfterAdding(undefined, "VP-011", 2)).toBe(2);
  });

  it("adds to the quantity already in the cart", () => {
    expect(quantityAfterAdding(cartWith(line("VP-011", 1)), "VP-011", 1)).toBe(2);
    expect(quantityAfterAdding(cartWith(line("VP-011", 2)), "VP-011", 3)).toBe(5);
  });

  it("never goes above the maximum the service accepts", () => {
    expect(quantityAfterAdding(cartWith(line("VP-011", 98)), "VP-011", 5)).toBe(MAX_CART_QUANTITY);
  });
});
