/**
 * Isolated Thermal & Document Printing Helper
 * 
 * Creates an isolated, zero-margin iframe containing ONLY the target HTML,
 * preventing browser modals, background flow heights, backdrop-filters,
 * and layout offsets from generating multi-page blank spills in Chrome/Edge.
 */

export interface PrintOptions {
  type?: "receipt" | "label" | "report";
  title?: string;
  copies?: number;
}

export function printElement(elementId: string, options: PrintOptions = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const targetElem = document.getElementById(elementId);
  if (!targetElem) {
    console.warn(`[printElement] Element with ID "${elementId}" not found. Falling back to window.print().`);
    window.print();
    return;
  }

  const { type = "receipt", title = "طباعة" } = options;

  // Remove any stale print iframes
  const oldIframe = document.getElementById("__pos_print_iframe__");
  if (oldIframe) {
    oldIframe.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.id = "__pos_print_iframe__";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Base styles tailored specifically to Thermal 80mm/58mm or Barcode Labels or Reports
  let specificStyles = "";

  if (type === "label") {
    specificStyles = `
      @page {
        margin: 0;
        size: auto;
      }
      body {
        width: 50mm;
        max-width: 50mm;
        margin: 0 auto;
        padding: 1.5mm;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 10px;
        text-align: center;
        background: #fff;
        color: #000;
      }
      svg {
        display: block;
        margin: 0 auto;
        max-width: 100%;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
      }
    `;
  } else if (type === "report") {
    specificStyles = `
      @page {
        margin: 10mm;
        size: A4 portrait;
      }
      body {
        width: 100%;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        font-size: 12px;
        color: #111827;
        background: #fff;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        background-color: #f3f4f6;
        border-bottom: 2px solid #9ca3af;
        padding: 6px 8px;
        font-weight: bold;
      }
      td {
        border-bottom: 1px solid #e5e7eb;
        padding: 6px 8px;
      }
      .grid-cols-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .grid-cols-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    `;
  } else {
    // Continuous Thermal POS Receipt / Voucher (80mm / 58mm)
    specificStyles = `
      @page {
        margin: 0;
        size: auto;
      }
      body {
        width: 100%;
        max-width: 78mm;
        min-width: 68mm;
        margin: 0 auto;
        padding: 4mm 5mm;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace;
        font-size: 11px;
        line-height: 1.4;
        background: #ffffff;
        color: #000000;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        margin-bottom: 5px;
      }
      th, td {
        padding: 3px 2px;
      }
      th {
        border-bottom: 1px solid #000;
        font-weight: bold;
      }
      td {
        border-bottom: 1px dashed #d1d5db;
      }
      img {
        display: block;
        margin: 0 auto 6px auto;
        max-height: 48px;
        max-width: 48px;
        object-fit: contain;
      }
    `;
  }

  const fullHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html {
            height: auto;
            margin: 0;
            padding: 0;
            background: #fff;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-left { text-align: left; }
          .border-b { border-bottom: 1px solid #9ca3af; }
          .border-t { border-top: 1px solid #9ca3af; }
          .border-dashed { border-style: dashed; }
          .font-bold { font-weight: bold; }
          .font-black { font-weight: 900; }
          .font-medium { font-weight: 500; }
          .font-sans { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
          .font-mono { font-family: monospace, Courier, monospace; }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 12.5px; }
          .text-base { font-size: 14px; }
          .text-lg { font-size: 16px; }
          .text-xl { font-size: 18px; }
          .space-y-1 > * + * { margin-top: 3px; }
          .space-y-2 > * + * { margin-top: 6px; }
          .space-y-3 > * + * { margin-top: 10px; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .items-center { align-items: center; }
          .w-full { width: 100%; }
          .pt-1 { padding-top: 3px; }
          .pt-2 { padding-top: 6px; }
          .pt-3 { padding-top: 10px; }
          .pb-1 { padding-bottom: 3px; }
          .pb-2 { padding-bottom: 6px; }
          .my-1 { margin-top: 4px; margin-bottom: 4px; }
          .no-print { display: none !important; }
          .hidden { display: none !important; }
          
          ${specificStyles}
        </style>
      </head>
      <body>
        ${targetElem.innerHTML}
      </body>
    </html>
  `;

  doc.open();
  doc.write(fullHtml);
  doc.close();

  // Give images & fonts time to load, then print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Clean up after print dialog closes
    setTimeout(() => {
      iframe.remove();
    }, 2000);
  }, 300);
}
