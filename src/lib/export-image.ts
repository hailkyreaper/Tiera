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
    // Confirmed live: without this, a multi-book tier board exported every
    // cover as the same image. html-to-image caches each fetched image
    // internally keyed by URL, and that cache has a known bug where
    // same-origin proxied images (every cover here goes through Next's
    // /_next/image, not the original external URL) can collide and all
    // resolve to whichever one was fetched first. cacheBust appends a
    // unique query param per image so each fetch is forced fresh instead
    // of hitting that shared cache.
    cacheBust: true,
  });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
