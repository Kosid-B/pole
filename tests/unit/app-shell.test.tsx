import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders the product shell title and page content", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>child page</div>
      </RootLayout>,
    );

    expect(html).toContain("Project Command Center");
    expect(html).toContain("child page");
  });
});
