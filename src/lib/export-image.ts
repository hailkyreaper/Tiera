import { toPng } from "html-to-image";

// Shared by the create flow's review step and the published-list 3-dot
// menu's Export option — same capture settings both places, so a list
// looks the same whether you export it while building it or after.
export async function exportElementAsImage(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 3,
    backgroundColor: "#0a0a0a",
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
