import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React from "react";
import { createRoot } from "react-dom/client";

// Import your templates
import { ZohoInvoice, InvoiceData } from "../components/documents/templates/ZohoInvoice";
import { VehicleInvestmentAgreement, AgreementData } from "../components/documents/templates/Agreements/VehicleInvestmentAgreement";
import { ContractorAgreement, ContractorAgreementProps } from "../components/documents/templates/Agreements/ContractorAgreement";
import { ClientServicesAgreement, ClientServicesAgreementProps } from "../components/documents/templates/Agreements/ClientServicesAgreement";

export type DocumentType =
    | "invoice"
    | "vehicle-investment"
    | "contractor-agreement"
    | "client-services";

export class DocumentGenerator {

    /**
     * Generates a PDF Blob from a React component template.
     * @param type The type of document to generate
     * @param data The data prop to pass to the template
     * @returns Promise<Blob>
     */
    static async generateDocument(type: DocumentType, data: Record<string, unknown>): Promise<Blob> {
        // 1. Create a hidden container to render the template
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.width = "8.5in"; // Match the template width
        document.body.appendChild(container);

        // 2. Render the appropriate component
        const root = createRoot(container);
        let component: React.ReactNode;

        switch (type) {
            case "invoice":
                component = <ZohoInvoice data={data as unknown as InvoiceData} />;
                break;
            case "vehicle-investment":
                component = <VehicleInvestmentAgreement data={data as unknown as AgreementData} />;
                break;
            case "contractor-agreement":
                component = <ContractorAgreement data={(data as unknown as ContractorAgreementProps).data} />;
                break;
            case "client-services":
                component = <ClientServicesAgreement data={(data as unknown as ClientServicesAgreementProps).data} />;
                break;
            default:
                throw new Error(`Unknown document type: ${type}`);
        }

        // Wrap in a Promise to ensure rendering is complete
        await new Promise<void>((resolve) => {
            // Use flushSync if needed, or just a small timeout to allow layout
            root.render(component);
            setTimeout(resolve, 500); // Give it time to render images/fonts
        });

        try {
            // 3. Capture with html2canvas
            const canvas = await html2canvas(container, {
                scale: 2, // 2x scale for better quality (retina-like)
                useCORS: true, // Allow loading cross-origin images (like Supabase logos)
                logging: false,
                backgroundColor: "#ffffff"
            });

            // 4. Generate PDF
            const imgData = canvas.toDataURL("image/jpeg", 0.95); // JPEG is smaller than PNG
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "in",
                format: "letter"
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

            // If content overflows one page, handle multi-page (basic implementation)
            // For now, we assume single page or handle scaling. 
            // A more complex loop would check height > 11in and add pages.

            return pdf.output("blob");

        } catch (error) {
            console.error("PDF Generation Failed:", error);
            throw error;
        } finally {
            // 5. Cleanup
            root.unmount();
            document.body.removeChild(container);
        }
    }
}
