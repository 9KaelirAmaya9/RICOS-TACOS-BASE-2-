import { BasePDFGenerator } from "./pdfBase";

interface AgreementData {
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_vin?: string;
  services_requested: string[];
  total_cost: number;
  created_at: string;
}

/**
 * Service Agreement PDF Generator
 * Legal agreement for customer signature
 */
export class AgreementPDFGenerator extends BasePDFGenerator {
  async generate(data: AgreementData): Promise<Blob> {
    // Header with logo and branding
    await this.addHeader();
    
    // Document title in top-right
    const formattedDate = new Date(data.created_at).toLocaleDateString("en-US");
    this.addDocumentTitle("SERVICE AGREEMENT", data.invoice_number, formattedDate);

    // Customer Information Section
    this.addSectionHeader("Customer Information");
    this.addField("Name", data.customer_name);
    if (data.customer_email) {
      this.addField("Email", data.customer_email);
    }
    if (data.customer_phone) {
      this.addField("Phone", data.customer_phone);
    }
    if (data.customer_address) {
      this.addField("Address", data.customer_address);
    }
    this.yPos += 8;

    // Vehicle Information
    if (data.vehicle_make || data.vehicle_model || data.vehicle_year) {
      this.addSectionHeader("Vehicle Information");
      const vehicleInfo = [
        data.vehicle_year,
        data.vehicle_make,
        data.vehicle_model
      ].filter(Boolean).join(" ");
      
      this.addField("Vehicle", vehicleInfo);
      if (data.vehicle_vin) {
        this.addField("VIN", data.vehicle_vin);
      }
      this.yPos += 8;
    }

    // Services Section
    this.addSectionHeader("Services To Be Performed");
    this.yPos += 5;

    data.services_requested.forEach((service, index) => {
      this.checkPageBreak(20);
      this.setColor(this.BRAND_BLACK);
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(`${index + 1}. ${service}`, this.margins.left + 15, this.yPos);
      this.yPos += 15;
    });
    this.yPos += 10;

    // Estimated cost
    this.addField("Estimated Total", `$${data.total_cost.toFixed(2)}`);
    this.yPos += 15;

    // Agreement Terms
    this.addSectionHeader("Terms & Conditions");
    this.yPos += 5;

    const terms = [
      {
        title: "1. SCOPE OF SERVICES",
        content: "The Company agrees to perform the services described above. Customer authorizes all required repairs and the use of OEM, used, or aftermarket parts as appropriate."
      },
      {
        title: "2. PAYMENT TERMS",
        content: "A 50% deposit is required before work begins. Deposits are non-refundable. Balance is due upon completion before vehicle release. Late fees apply after 5 days. Storage fees of $25/day apply after 3 business days following completion."
      },
      {
        title: "3. WARRANTY",
        content: "Paint and bodywork carries a 2-year workmanship warranty. Warranty excludes rust, prior repairs, corrosion, environmental damage, and customer-caused damage. All other work warranties are subject to shop evaluation on a per-job basis."
      },
      {
        title: "4. DISCLAIMER",
        content: "Except for the stated warranty, all other warranties are disclaimed. Company is not liable for loss of use, rental fees, diminished value, or consequential damages."
      },
      {
        title: "5. PROPERTY & RISK",
        content: "Customers must remove all valuables. Company is not responsible for personal items. Unclaimed vehicles after 30 days may be subject to lien and sale per Texas law."
      },
      {
        title: "6. VEHICLE OPERATION",
        content: "Customer authorizes Company to operate vehicle for testing and transport. Company maintains garage liability insurance."
      },
      {
        title: "7. INSURANCE CLAIMS",
        content: "Customers are responsible for deductibles and uncovered items. Insurance payments must be endorsed to Company."
      },
      {
        title: "8. GOVERNING LAW",
        content: "This agreement is governed by Texas law. Disputes resolved via binding arbitration in Travis County, Texas."
      }
    ];

    terms.forEach((term) => {
      this.checkPageBreak(40);
      
      // Term title
      this.setColor(this.BRAND_PRIMARY);
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(term.title, this.margins.left + 10, this.yPos);
      this.yPos += 15;

      // Term content
      this.setColor(this.BRAND_BLACK);
      this.doc.setFont("helvetica", "normal");
      const splitContent = this.doc.splitTextToSize(
        term.content,
        this.pageWidth - this.margins.left - this.margins.right - 25
      );
      
      splitContent.forEach((line: string) => {
        this.checkPageBreak(15);
        this.doc.text(line, this.margins.left + 15, this.yPos);
        this.yPos += 12;
      });
      this.yPos += 8;
    });

    // Signature Section
    this.yPos += 20;
    this.checkPageBreak(80);
    this.addSectionHeader("Customer Acceptance");
    this.yPos += 10;

    this.setColor(this.BRAND_BLACK);
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    
    const acceptance = "By signing below, I acknowledge that I have read, understood, and agree to all terms and conditions of this Service Agreement. I authorize Axonic Motorworks to perform the services listed above.";
    
    const splitAcceptance = this.doc.splitTextToSize(
      acceptance,
      this.pageWidth - this.margins.left - this.margins.right - 20
    );
    
    splitAcceptance.forEach((line: string) => {
      this.checkPageBreak(15);
      this.doc.text(line, this.margins.left + 10, this.yPos);
      this.yPos += 12;
    });

    this.yPos += 25;
    this.checkPageBreak(60);

    // Signature line
    this.doc.setLineWidth(1);
    this.doc.line(this.margins.left + 10, this.yPos, this.margins.left + 280, this.yPos);
    this.yPos += 15;
    
    this.doc.setFontSize(9);
    this.doc.text("Customer Signature", this.margins.left + 10, this.yPos);
    
    // Date line
    const dateLineX = this.margins.left + 350;
    this.doc.line(dateLineX, this.yPos - 15, dateLineX + 120, this.yPos - 15);
    this.doc.text("Date", dateLineX, this.yPos);

    return this.output();
  }
}

/**
 * Generate service agreement PDF
 */
export async function generateAgreementPDF(data: AgreementData): Promise<Blob> {
  const generator = new AgreementPDFGenerator();
  return await generator.generate(data);
}
