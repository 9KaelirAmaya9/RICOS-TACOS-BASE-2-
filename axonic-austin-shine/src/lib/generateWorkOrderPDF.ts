import { BasePDFGenerator } from "./pdfBase";

interface WorkOrderData {
  work_order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_vin?: string;
  vehicle_license_plate?: string;
  services_requested: string[];
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
}

class WorkOrderPDFGenerator extends BasePDFGenerator {
  async generate(data: WorkOrderData): Promise<Blob> {
    // Add header and title
    await this.addHeader();
    this.addDocumentTitle(
      "INTERNAL WORK ORDER",
      data.work_order_number,
      new Date(data.created_at).toLocaleDateString()
    );

    this.yPos += 10;

    // Customer Information
    this.addSectionHeader("CUSTOMER INFORMATION");
    this.addTwoColumnFields("Name", data.customer_name, "Email", data.customer_email);
    if (data.customer_phone) {
      this.addField("Phone", data.customer_phone);
    }

    this.yPos += 5;

    // Vehicle Information
    if (data.vehicle_year || data.vehicle_make || data.vehicle_model) {
      this.addSectionHeader("VEHICLE INFORMATION");
      this.addTwoColumnFields("Year", data.vehicle_year || "N/A", "Make", data.vehicle_make || "N/A");
      this.addTwoColumnFields("Model", data.vehicle_model || "N/A", "Color", data.vehicle_color || "N/A");
      if (data.vehicle_vin) {
        this.addField("VIN", data.vehicle_vin);
      }
      if (data.vehicle_license_plate) {
        this.addField("License Plate", data.vehicle_license_plate);
      }
      this.yPos += 5;
    }

    // Services Requested
    this.addSectionHeader("SERVICES REQUESTED");
    data.services_requested.forEach((service, index) => {
      this.checkPageBreak(15);
      this.setColor(this.BRAND_BLACK);
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(`${index + 1}. ${service}`, this.margins.left + 8, this.yPos);
      this.yPos += 15;
    });

    this.yPos += 5;

    // Cost Breakdown
    this.addSectionHeader("COST BREAKDOWN");
    this.addField("Labor Cost", `$${data.labor_cost.toFixed(2)}`);
    this.addField("Parts Cost", `$${data.parts_cost.toFixed(2)}`);
    
    this.addTotal("TOTAL COST", `$${data.total_cost.toFixed(2)}`);

    // Notes
    if (data.notes) {
      this.yPos += 10;
      this.addSectionHeader("NOTES");
      const splitNotes = this.doc.splitTextToSize(
        data.notes,
        this.pageWidth - this.margins.left - this.margins.right - 16
      );
      splitNotes.forEach((line: string) => {
        this.checkPageBreak(15);
        this.setColor(this.BRAND_BLACK);
        this.doc.setFontSize(10);
        this.doc.setFont("helvetica", "normal");
        this.doc.text(line, this.margins.left + 8, this.yPos);
        this.yPos += 15;
      });
    }

    // Warranty Information
    this.yPos += 10;
    this.addSectionHeader("WARRANTY INFORMATION");
    const warranties = [
      "Paint work includes a 2-year warranty",
      "Warranties on other services are subject to evaluation",
      "Warranty covers defects in workmanship only",
    ];
    warranties.forEach((warranty) => {
      this.checkPageBreak(15);
      this.setColor(this.BRAND_BLACK);
      this.doc.setFontSize(9);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(`• ${warranty}`, this.margins.left + 8, this.yPos);
      this.yPos += 12;
    });

    return this.output();
  }
}

export async function generateWorkOrderPDF(data: WorkOrderData): Promise<Blob> {
  const generator = new WorkOrderPDFGenerator();
  return await generator.generate(data);
}
