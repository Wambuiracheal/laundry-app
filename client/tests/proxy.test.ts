// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

function visit(path: string, role?: string) {
  const request = new NextRequest(new URL(path, "http://localhost:3000"));
  if (role !== undefined) request.cookies.set("pl_session", role);
  return proxy(request);
}

const location = (response: Response) => response.headers.get("location");

describe("proxy (route guard)", () => {
  it("sends signed-out visitors to login with a return path", () => {
    const response = visit("/order-tracking?id=42");
    expect(response.status).toBe(307);
    const target = new URL(location(response)!);
    expect(target.pathname).toBe("/login");
    expect(target.searchParams.get("next")).toBe("/order-tracking?id=42");
  });

  it("clears a cookie that holds no known role", () => {
    const response = visit("/profile", "unknown");
    expect(new URL(location(response)!).pathname).toBe("/login");
    expect(response.headers.get("set-cookie")).toMatch(/pl_session=;/);
  });

  it("lets signed-out visitors open the auth pages", () => {
    expect(location(visit("/login"))).toBeNull();
    expect(location(visit("/register/rider"))).toBeNull();
  });

  it("bounces signed-in users from auth pages to their home", () => {
    expect(location(visit("/login", "rider"))).toBe("http://localhost:3000/rider");
  });

  it("keeps each role on its own pages", () => {
    expect(location(visit("/shop", "customer"))).toBe("http://localhost:3000/customer-dashboard");
    expect(location(visit("/shop/pricing", "staff"))).toBe("http://localhost:3000/shop");
    expect(location(visit("/shop/pricing", "admin"))).toBeNull();
    expect(location(visit("/new-order", "customer"))).toBeNull();
    expect(location(visit("/support", "rider"))).toBeNull();
  });
});
