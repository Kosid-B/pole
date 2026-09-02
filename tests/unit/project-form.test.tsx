import { render, screen } from "@testing-library/react";
import { ProjectForm } from "@/components/projects/project-form";

describe("ProjectForm", () => {
  it("keeps the minimum project setup explicit, required, and Thai-first", () => {
    render(<ProjectForm action={async () => undefined} />);

    expect(screen.getByText("ขั้นที่ 1 • ข้อมูลโครงการ")).toBeInTheDocument();
    expect(screen.getByText("ขั้นที่ 2 • พื้นที่เริ่มต้น")).toBeInTheDocument();

    expect(screen.getByRole("textbox", { name: "ชื่อโครงการ" })).toBeRequired();
    expect(screen.getByRole("spinbutton", { name: "มูลค่าสัญญา" })).toBeRequired();
    expect(screen.getByRole("spinbutton", { name: "เป้าหมายรวมของโครงการ" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "ชื่อพื้นที่เริ่มต้น" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "จังหวัด" })).toBeRequired();
    expect(screen.getByRole("spinbutton", { name: "เป้าหมายของพื้นที่เริ่มต้น" })).toBeRequired();

    expect(screen.getByRole("button", { name: "บันทึกและเปิดโครงการ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ยกเลิก" })).toHaveAttribute("href", "/projects");
  });
});
