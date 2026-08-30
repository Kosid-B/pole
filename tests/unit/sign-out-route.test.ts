import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  EMAIL_COOKIE_NAME,
  ROLE_COOKIE_NAME,
  USER_ID_COOKIE_NAME,
} from "@/lib/auth";
import { GET } from "@/app/sign-out/route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("GET /sign-out", () => {
  it("clears the mock session cookies and redirects to sign-in", async () => {
    const deleteCookie = vi.fn();

    vi.mocked(cookies).mockResolvedValue({
      delete: deleteCookie,
    } as Awaited<ReturnType<typeof cookies>>);

    const request = new NextRequest(
      "http://localhost:3000/sign-out?redirectTo=/sign-in",
    );

    const response = await GET(request);

    expect(deleteCookie).toHaveBeenCalledWith(USER_ID_COOKIE_NAME);
    expect(deleteCookie).toHaveBeenCalledWith(ROLE_COOKIE_NAME);
    expect(deleteCookie).toHaveBeenCalledWith(EMAIL_COOKIE_NAME);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in",
    );
  });

  it("falls back when the redirect target is unsafe", async () => {
    const deleteCookie = vi.fn();

    vi.mocked(cookies).mockResolvedValue({
      delete: deleteCookie,
    } as Awaited<ReturnType<typeof cookies>>);

    const request = new NextRequest(
      "http://localhost:3000/sign-out?redirectTo=//evil.example",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in",
    );
  });
});
