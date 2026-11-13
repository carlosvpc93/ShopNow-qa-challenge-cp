import { USERS } from "../helpers";

export { USERS };

/** Product ids and prices from the seed data (fresh install). */
export const PRODUCTS = {
  mug: { id: 1, name: "Ceramic mug", price: 8.35, stock: 25 },
  tshirt: { id: 3, name: "Basic T-shirt", price: 14.35, stock: 40 },
  keyboard: { id: 6, name: "Mechanical keyboard", price: 89.9, stock: 5 },
  chair: { id: 8, name: "Ergonomic chair", price: 129, stock: 2 },
} as const;

export const COUPONS = { flock10: "FLOCK10", bienvenida15: "BIENVENIDA15" } as const;

export const SEED_ORDERS = {
  /** Ana's order created 2026-10-15T02:30:00Z = Oct 14, 23:30 in Argentina. */
  anaLateNight: { id: 2, ownerEmail: USERS.ana.email },
  /** Ana's first order. Bruno must not be able to read it. */
  anaFirst: { id: 1, ownerEmail: USERS.ana.email },
} as const;

export const SHIPPING = {
  default: { name: "Ana Garcia", address: "1234 Corrientes Ave" },
  withAccents: { name: "Ana García", address: "Av. Córdoba 1234" },
} as const;

export const CARDS = {
  approved: "4242424242424242",
  declined: "4242424242420000",
} as const;
