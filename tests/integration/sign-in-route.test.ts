import { NextRequest } from "next/server";
import { POST } from "@/app/api/auth/sign-in/route";
import {
  EMAIL_COOKIE_NAME,
  ROLE_COOKIE_NAME,
  USER_ID_COOKIE_NAME,
} from "@/lib/auth";

function createSignInRequest(email: string, password: string, redirectTo = "/") {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);
  formData.set("redirectTo", redirectTo);

  return new NextRequest("http://localhost:3000/api/auth/sign-in", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/auth/sign-in", () => {
  it("sets the complete session tuple and redirects a valid user", async () => {
    const response = await POST(
      createSignInRequest("admin@example.com", "password", "/"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    expect(response.cookies.get(USER_ID_COOKIE_NAME)?.value).toBeTruthy();
    expect(response.cookies.get(ROLE_COOKIE_NAME)?.value).toBe("ADMIN");
    expect(response.cookies.get(EMAIL_COOKIE_NAME)?.value).toBe(
      "admin@example.com",
    );
  });

  it("redirects invalid credentials without creating a session", async () => {
    const response = await POST(
      createSignInRequest("admin@example.com", "wrong-password"),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?error=invalid-credentials",
    );
    expect(response.cookies.get(USER_ID_COOKIE_NAME)).toBeUndefined();
    expect(response.cookies.get(ROLE_COOKIE_NAME)).toBeUndefined();
    expect(response.cookies.get(EMAIL_COOKIE_NAME)).toBeUndefined();
  });
});
