import { BasePDFGenerator } from "./pdfBase";

interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  services_requested: string[];
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  customer_deposit?: number;
  created_at: string;
  payment_method?: string;
}

/**
 * Client Invoice PDF Generator
 * Professional invoice for customer billing
 */
export class InvoicePDFGenerator extends BasePDFGenerator {
  async generate(data: InvoiceData): Promise<Blob> {
    // Header with logo and branding
    await this.addHeader();
    
    // Document title in top-right
    const formattedDate = new Date(data.created_at).toLocaleDateString("en-US");
    this.addDocumentTitle("INVOICE", data.invoice_number, formattedDate);

    // Bill To Section
    this.addSectionHeader("Bill To");
    this.addField("Customer", data.customer_name);
    if (data.customer_address) {
      this.addField("Address", data.customer_address);
    }
    if (data.customer_email) {
      this.addField("Email", data.customer_email);
    }
    if (data.customer_phone) {
      this.addField("Phone", data.customer_phone);
    }
    this.yPos += 8;

    // Vehicle Information
    if (data.vehicle_make || data.vehicle_model || data.vehicle_year) {
      this.addSectionHeader("Vehicle");
      const vehicleInfo = [
        data.vehicle_year,
        data.vehicle_make,
        data.vehicle_model
      ].filter(Boolean).join(" ");
      
      this.addField("Description", vehicleInfo);
      this.yPos += 8;
    }

    // Services & Charges Table
    this.addSectionHeader("Services & Charges");
    
    const serviceRows = data.services_requested.map((service, index) => [
      { text: `${index + 1}`, align: "left" as const },
      { text: service, align: "left" as const },
      { text: "1", align: "center" as const },
      { text: "-", align: "right" as const }
    ]);

    // Add labor and parts as line items
    serviceRows.push([
      { text: "", align: "left" as const },
      { text: "Labor", align: "left" as const },
      { text: "1", align: "center" as const },
      { text: `$${data.labor_cost.toFixed(2)}`, align: "right" as const }
    ]);

    serviceRows.push([
      { text: "", align: "left" as const },
      { text: "Parts & Materials", align: "left" as const },
      { text: "1", align: "center" as const },
      { text: `$${data.parts_cost.toFixed(2)}`, align: "right" as const }
    ]);

    this.addTable(
      [
        { text: "#", width: 30 },
        { text: "Description", width: 280 },
        { text: "Qty", width: 60 },
        { text: "Amount", width: 130 }
      ],
      serviceRows
    );

    // Subtotal, deposit, and total
    const rightX = this.pageWidth - this.margins.right;
    const leftX = rightX - 180;

    this.yPos += 10;
    this.checkPageBreak(60);

    // Subtotal
    this.setColor(this.BRAND_BLACK);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Subtotal:", leftX + 5, this.yPos);
    this.doc.text(`$${data.total_cost.toFixed(2)}`, rightX - 5, this.yPos, { align: "right" });
    this.yPos += 15;

    // Deposit (if any)
    if (data.customer_deposit && data.customer_deposit > 0) {
      this.doc.text("Deposit Paid:", leftX + 5, this.yPos);
      this.doc.text(`-$${data.customer_deposit.toFixed(2)}`, rightX - 5, this.yPos, { align: "right" });
      this.yPos += 15;
    }

    // Total due
    const totalDue = data.total_cost - (data.customer_deposit || 0);
    this.addTotal("TOTAL DUE", `$${totalDue.toFixed(2)}`);

    // Payment instructions
    this.yPos += 15;
    this.checkPageBreak(80);
    this.addSectionHeader("Payment Information");
    
    this.setColor(this.BRAND_BLACK);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    
    const paymentInstructions = [
      "Payment is due upon completion of services.",
      "Accepted payment methods: Cash, Check, Credit/Debit Cards.",
      "Make checks payable to: Axonic Motorworks LLC",
      "For questions regarding this invoice, please contact us at 210-823-1595."
    ];

    paymentInstructions.forEach((instruction) => {
      this.checkPageBreak(15);
      this.doc.text(`• ${instruction}`, this.margins.left + 10, this.yPos);
      this.yPos += 15;
    });

    // Terms & Conditions
    this.yPos += 15;
    this.checkPageBreak(60);
    this.addSectionHeader("Terms & Conditions");
    
    const terms = [
      "Paint work includes a 2-year warranty on workmanship.",
      "Warranty does not cover damage from accidents, weather, or normal wear.",
      "Vehicle must be picked up within 3 business days of completion.",
      "Storage fees apply after 3 business days at $25/day."
    ];

    terms.forEach((term) => {
      this.checkPageBreak(15);
      this.doc.text(`• ${term}`, this.margins.left + 10, this.yPos);
      this.yPos += 15;
    });

    // Signature line
    this.yPos += 25;
    this.checkPageBreak(40);
    
    this.setColor(this.BRAND_BLACK);
    this.doc.setLineWidth(1);
    this.doc.line(this.margins.left + 10, this.yPos, this.margins.left + 250, this.yPos);
    this.yPos += 15;
    
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Customer Signature", this.margins.left + 10, this.yPos);
    
    this.doc.text("Date", this.margins.left + 200, this.yPos);

    return this.output();
  }
}

/**
 * Generate invoice PDF
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Blob> {
  const generator = new InvoicePDFGenerator();
  return await generator.generate(data);
}
