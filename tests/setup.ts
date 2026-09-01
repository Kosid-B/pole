import "@testing-library/jest-dom/vitest";

vi.mock("next/font/google", () => ({
  Kanit: () => ({
    className: "font-kanit",
    variable: "font-kanit-variable",
  }),
}));
