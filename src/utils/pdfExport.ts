import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PdfExportOptions {
  margin?: number | number[];
  filename?: string;
  image?: { type?: string; quality?: number };
  jsPDF?: { unit?: string; format?: string; orientation?: string };
}

/**
 * Drop-in replacement for html2pdf().set(opt).from(source).save()
 * Accepts either a DOM element or an HTML string.
 */
export async function exportToPdf(
  source: HTMLElement | string,
  options: PdfExportOptions = {}
) {
  const filename = options.filename || "document.pdf";
  const orientation = (options.jsPDF?.orientation as "portrait" | "landscape") || "portrait";
  const format = (options.jsPDF?.format as string) || "a4";
  const imgType = options.image?.type || "jpeg";
  const imgQuality = options.image?.quality || 0.98;

  // If source is a string, create a temporary element
  let element: HTMLElement;
  let tempElement = false;
  if (typeof source === "string") {
    element = document.createElement("div");
    element.innerHTML = source;
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "0";
    document.body.appendChild(element);
    tempElement = true;
  } else {
    element = source;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL(`image/${imgType}`, imgQuality);
    const pdf = new jsPDF({ orientation, unit: "mm", format });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Parse margins
    let mt = 10, mr = 10, mb = 10, ml = 10;
    if (options.margin != null) {
      if (Array.isArray(options.margin)) {
        [mt, mr, mb, ml] = options.margin.length === 4
          ? options.margin
          : [options.margin[0], options.margin[0], options.margin[0], options.margin[0]];
      } else {
        mt = mr = mb = ml = options.margin;
      }
    }

    const contentWidth = pageWidth - ml - mr;
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const usableHeight = pageHeight - mt - mb;

    let heightLeft = imgHeight;
    let position = mt;

    pdf.addImage(imgData, imgType.toUpperCase(), ml, position, imgWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
      position = mt - (imgHeight - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, imgType.toUpperCase(), ml, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;
    }

    pdf.save(filename);
  } finally {
    if (tempElement) {
      document.body.removeChild(element);
    }
  }
}
