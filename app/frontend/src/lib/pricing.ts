/** Same rule as the orders service: every full pack at the pack price, the rest at unit price. */
export function lineTotal(
  price: number | null,
  quantity: number,
  packPrice: number | null,
  packSize: number | null,
): number | null {
  if (price === null) return null;
  if (packPrice && packSize && packSize > 1) {
    return Math.floor(quantity / packSize) * packPrice + (quantity % packSize) * price;
  }
  return price * quantity;
}
