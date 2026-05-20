import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders the product title in the shell metadata region", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div>child page</div>
      </RootLayout>,
    );

    expect(html).toContain("Project Command Center");
  });
});
