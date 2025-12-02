import jsPDF from "jspdf";
import logoAxonic from "@/assets/logo-axonic.png";

/**
 * Base PDF Generator with consistent branding and layout
 * All PDFs share the same header, footer, and styling
 */
export class BasePDFGenerator {
  protected doc: jsPDF;
  protected pageWidth: number;
  protected pageHeight: number;
  protected margins = { top: 40, right: 40, bottom: 60, left: 40 };
  protected yPos = 0;
  
  // Brand colors
  protected readonly BRAND_PRIMARY = { r: 26, g: 54, b: 93 }; // #1a365d
  protected readonly BRAND_SECONDARY = { r: 113, g: 128, b: 150 }; // #718096
  protected readonly BRAND_BLACK = { r: 0, g: 0, b: 0 };
  protected readonly BRAND_WHITE = { r: 255, g: 255, b: 255 };

  constructor() {
    this.doc = new jsPDF({
      compress: true,
      unit: 'pt',
      format: 'letter',
    });
    this.pageWidth = this.doc.internal.pageSize.width;
    this.pageHeight = this.doc.internal.pageSize.height;
    this.yPos = this.margins.top;
  }

  protected setColor(color: { r: number; g: number; b: number }) {
    this.doc.setTextColor(color.r, color.g, color.b);
    this.doc.setDrawColor(color.r, color.g, color.b);
    this.doc.setFillColor(color.r, color.g, color.b);
  }

  protected checkPageBreak(requiredSpace: number = 40) {
    if (this.yPos + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.doc.addPage();
      this.yPos = this.margins.top + 60; // Leave space for mini header
      this.addContinuationHeader();
    }
  }

  protected addContinuationHeader() {
    // Mini header for continuation pages
    this.setColor(this.BRAND_PRIMARY);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("AXONIC MOTORWORKS", this.margins.left, this.yPos);
    this.yPos += 10;
    
    // Horizontal line
    this.doc.setLineWidth(1);
    this.doc.line(this.margins.left, this.yPos, this.pageWidth - this.margins.right, this.yPos);
    this.yPos += 20;
  }

  /**
   * Add professional header with logo and branding
   */
  protected async addHeader() {
    // Logo at top left
    try {
      const logoHeight = 80;
      const logoWidth = 80;
      
      this.doc.addImage(
        logoAxonic,
        "PNG",
        this.margins.left,
        this.margins.top,
        logoWidth,
        logoHeight,
        undefined,
        'FAST'
      );
    } catch (error) {
      console.error("Error adding logo:", error);
    }

    // Company name and tagline - positioned to the right of logo
    const textStartX = this.margins.left + 95;
    let textY = this.margins.top + 25;

    this.setColor(this.BRAND_PRIMARY);
    this.doc.setFontSize(18);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("AXONIC MOTORWORKS", textStartX, textY);

    textY += 18;
    this.setColor(this.BRAND_SECONDARY);
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Veteran-Owned Auto Body & Paint Excellence", textStartX, textY);

    textY += 14;
    this.doc.setFontSize(10);
    this.doc.text("Austin, Texas", textStartX, textY);

    // Horizontal brand line below header
    this.yPos = this.margins.top + 95;
    this.setColor(this.BRAND_PRIMARY);
    this.doc.setLineWidth(2);
    this.doc.line(this.margins.left, this.yPos, this.pageWidth - this.margins.right, this.yPos);
    this.yPos += 20;
  }

  /**
   * Add document title and metadata in top-right
   */
  protected addDocumentTitle(docType: string, docNumber: string, date: string) {
    const rightX = this.pageWidth - this.margins.right;
    let titleY = this.margins.top + 25;

    // Document type
    this.setColor(this.BRAND_PRIMARY);
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    const titleWidth = this.doc.getTextWidth(docType);
    this.doc.text(docType, rightX - titleWidth, titleY);

    // Document number
    titleY += 16;
    this.setColor(this.BRAND_BLACK);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(`#${docNumber}`, rightX, titleY, { align: "right" });

    // Date
    titleY += 14;
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Date: ${date}`, rightX, titleY, { align: "right" });
  }

  /**
   * Add section header with background
   */
  protected addSectionHeader(title: string) {
    this.checkPageBreak(30);

    // Background box
    this.setColor(this.BRAND_PRIMARY);
    this.doc.setFillColor(240, 245, 250); // Light blue background
    this.doc.roundedRect(
      this.margins.left,
      this.yPos,
      this.pageWidth - this.margins.left - this.margins.right,
      22,
      2,
      2,
      "F"
    );

    // Text
    this.setColor(this.BRAND_PRIMARY);
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margins.left + 8, this.yPos + 15);
    this.yPos += 30;
  }

  /**
   * Add field row (label: value)
   */
  protected addField(label: string, value: string, indent: number = 0) {
    this.checkPageBreak(20);

    const xPos = this.margins.left + indent + 8;
    
    this.setColor(this.BRAND_BLACK);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(`${label}:`, xPos, this.yPos);

    this.doc.setFont("helvetica", "normal");
    const labelWidth = this.doc.getTextWidth(`${label}: `);
    this.doc.text(value || "N/A", xPos + labelWidth, this.yPos);
    
    this.yPos += 15; // Line height 1.5x
  }

  /**
   * Add two-column field row
   */
  protected addTwoColumnFields(label1: string, value1: string, label2: string, value2: string) {
    this.checkPageBreak(20);

    const col1X = this.margins.left + 8;
    const col2X = this.pageWidth / 2 + 10;

    // Column 1
    this.setColor(this.BRAND_BLACK);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(`${label1}:`, col1X, this.yPos);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(value1 || "N/A", col1X + this.doc.getTextWidth(`${label1}: `), this.yPos);

    // Column 2
    this.doc.setFont("helvetica", "bold");
    this.doc.text(`${label2}:`, col2X, this.yPos);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(value2 || "N/A", col2X + this.doc.getTextWidth(`${label2}: `), this.yPos);

    this.yPos += 15;
  }

  /**
   * Add table with headers and rows
   */
  protected addTable(headers: { text: string; width: number }[], rows: { text: string; align?: "left" | "center" | "right" }[][]) {
    this.checkPageBreak(40);

    const tableWidth = this.pageWidth - this.margins.left - this.margins.right;
    const startX = this.margins.left;

    // Table header
    this.setColor(this.BRAND_PRIMARY);
    this.doc.setFillColor(240, 245, 250);
    this.doc.roundedRect(startX, this.yPos, tableWidth, 20, 2, 2, "F");

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    
    let xPos = startX + 8;
    headers.forEach((header) => {
      this.doc.text(header.text, xPos, this.yPos + 13);
      xPos += header.width;
    });
    this.yPos += 25;

    // Table rows
    this.setColor(this.BRAND_BLACK);
    this.doc.setFont("helvetica", "normal");

    rows.forEach((row, rowIndex) => {
      this.checkPageBreak(20);

      // Alternating row background
      if (rowIndex % 2 === 1) {
        this.doc.setFillColor(250, 250, 252);
        this.doc.rect(startX, this.yPos - 5, tableWidth, 18, "F");
      }

      xPos = startX + 8;
      row.forEach((cell, colIndex) => {
        const align = cell.align || "left";
        if (align === "right") {
          this.doc.text(cell.text, xPos + headers[colIndex].width - 16, this.yPos + 8, { align: "right" });
        } else if (align === "center") {
          this.doc.text(cell.text, xPos + headers[colIndex].width / 2, this.yPos + 8, { align: "center" });
        } else {
          this.doc.text(cell.text, xPos, this.yPos + 8);
        }
        xPos += headers[colIndex].width;
      });

      this.yPos += 18;
    });

    this.yPos += 8; // Spacing after table
  }

  /**
   * Add total line with emphasis
   */
  protected addTotal(label: string, amount: string) {
    this.yPos += 10;
    this.checkPageBreak(30);

    const rightX = this.pageWidth - this.margins.right;
    const leftX = rightX - 180;

    // Horizontal line
    this.setColor(this.BRAND_PRIMARY);
    this.doc.setLineWidth(1);
    this.doc.line(leftX, this.yPos, rightX, this.yPos);
    this.yPos += 15;

    // Total text
    this.setColor(this.BRAND_BLACK);
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(label, leftX + 5, this.yPos);
    this.doc.text(amount, rightX - 5, this.yPos, { align: "right" });
    this.yPos += 20;
  }

  /**
   * Add footer with company info
   */
  protected addFooter() {
    const footerY = this.pageHeight - 35;

    this.setColor(this.BRAND_SECONDARY);
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");

    const line1 = "15600 Marsha Street, Building 1 Unit 1A, Austin, TX";
    const line2 = "210-823-1595 | sales@axonicmoto.com | www.axonicmoto.com";
    const line3 = "Precision. Quality. Service.";

    this.doc.text(line1, this.pageWidth / 2, footerY, { align: "center" });
    this.doc.text(line2, this.pageWidth / 2, footerY + 10, { align: "center" });
    
    this.setColor(this.BRAND_PRIMARY);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(line3, this.pageWidth / 2, footerY + 20, { align: "center" });

    // Page number
    this.setColor(this.BRAND_SECONDARY);
    this.doc.setFont("helvetica", "normal");
    const pageNum = this.doc.getCurrentPageInfo().pageNumber;
    this.doc.text(`Page ${pageNum}`, this.pageWidth - this.margins.right, footerY, { align: "right" });
  }

  /**
   * Get final document
   */
  public getDocument(): jsPDF {
    this.addFooter();
    return this.doc;
  }

  /**
   * Output as blob
   */
  public output(): Blob {
    this.addFooter();
    return this.doc.output("blob");
  }

  /**
   * Save to file
   */
  public save(filename: string) {
    this.addFooter();
    this.doc.save(filename);
  }
}
