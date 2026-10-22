import { describe, expect, it } from "vitest";
import { canAccess, homeForRole, isRole, rolesForPath } from "@/utils/roles";
import { postLoginPath, safeNextPath } from "@/utils/session";

describe("roles", () => {
  it("recognises only known roles", () => {
    expect(isRole("customer")).toBe(true);
    expect(isRole("admin")).toBe(true);
    expect(isRole("superuser")).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });

  it("sends each role to its home page, unknown roles to login", () => {
    expect(homeForRole("customer")).toBe("/customer-dashboard");
    expect(homeForRole("rider")).toBe("/rider");
    expect(homeForRole("staff")).toBe("/shop");
    expect(homeForRole("admin")).toBe("/shop");
    expect(homeForRole(null)).toBe("/login");
  });

  it("matches the most specific /shop rule first", () => {
    expect(rolesForPath("/shop")).toEqual(["staff", "admin"]);
    expect(rolesForPath("/shop/map")).toEqual(["staff", "admin"]);
    expect(rolesForPath("/shop/pricing")).toEqual(["admin"]);
    expect(canAccess("staff", "/shop/payments")).toBe(false);
    expect(canAccess("admin", "/shop/payments")).toBe(true);
  });

  it("matches whole path segments only", () => {
    // "/riders" must not be caught by the "/rider" prefix.
    expect(rolesForPath("/riders")).toBeNull();
    expect(rolesForPath("/rider/jobs")).toEqual(["rider"]);
  });

  it("treats unlisted pages as public", () => {
    expect(rolesForPath("/")).toBeNull();
    expect(canAccess("rider", "/preview")).toBe(true);
  });

  it("keeps customers off staff and rider pages", () => {
    expect(canAccess("customer", "/new-order")).toBe(true);
    expect(canAccess("customer", "/notifications")).toBe(true);
    expect(canAccess("staff", "/notifications")).toBe(false);
    expect(canAccess("customer", "/shop")).toBe(false);
    expect(canAccess("customer", "/rider")).toBe(false);
    expect(canAccess("rider", "/customer-dashboard")).toBe(false);
  });
});

describe("post-login redirects", () => {
  it("only allows same-site relative paths", () => {
    expect(safeNextPath("/profile")).toBe("/profile");
    expect(safeNextPath("//evil.com")).toBe("/customer-dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/customer-dashboard");
    expect(safeNextPath(null, "/shop")).toBe("/shop");
  });

  it("honours the requested page when the role may open it", () => {
    expect(postLoginPath("/order-tracking?id=42", "customer")).toBe("/order-tracking?id=42");
    expect(postLoginPath("/profile", "rider")).toBe("/profile");
  });

  it("falls back to the role's home when the page is off-limits", () => {
    expect(postLoginPath("/shop/pricing", "staff")).toBe("/shop");
    expect(postLoginPath("/new-order", "rider")).toBe("/rider");
    expect(postLoginPath(null, "admin")).toBe("/shop");
  });
});
