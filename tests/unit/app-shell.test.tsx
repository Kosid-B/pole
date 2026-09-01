import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders the Thai application root and page content", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>child page</div>
      </RootLayout>,
    );

    expect(html).toContain('lang="th"');
    expect(html).toContain("font-kanit-variable");
    expect(html).toContain("child page");
  });
});
