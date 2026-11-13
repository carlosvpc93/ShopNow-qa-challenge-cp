import type { APIRequestContext, APIResponse } from "@playwright/test";

export interface CheckoutItem { productId: number; quantity: unknown }
export interface CheckoutBody {
  items: CheckoutItem[];
  coupons?: string[];
  shipping: { name: string; address: string };
  card: { number: string };
}

/**
 * Typed client for the documented ShopNow API (docs/API.md).
 * Returns raw responses so specs can assert on status codes and bodies.
 * The session cookie (`sid`) is kept by the underlying request context.
 */
export class ShopNowApi {
  private readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  login(email: string, password: string): Promise<APIResponse> {
    return this.request.post("/api/login", { data: { email, password } });
  }

  logout(): Promise<APIResponse> {
    return this.request.post("/api/logout");
  }

  me(): Promise<APIResponse> {
    return this.request.get("/api/me");
  }

  getProduct(id: number): Promise<APIResponse> {
    return this.request.get(`/api/products/${id}`);
  }

  listProducts(params: { q?: string; category?: string } = {}): Promise<APIResponse> {
    return this.request.get("/api/products", { params });
  }

  validateCoupon(code: string): Promise<APIResponse> {
    return this.request.post("/api/coupons/validate", { data: { code } });
  }

  checkout(body: CheckoutBody): Promise<APIResponse> {
    // The simulated processor "may take a few seconds" (docs/API.md).
    return this.request.post("/api/checkout", { data: body, timeout: 15_000 });
  }

  listOrders(): Promise<APIResponse> {
    return this.request.get("/api/orders");
  }

  getOrder(id: number): Promise<APIResponse> {
    return this.request.get(`/api/orders/${id}`);
  }

  listPayments(): Promise<APIResponse> {
    return this.request.get("/api/payments");
  }
}
