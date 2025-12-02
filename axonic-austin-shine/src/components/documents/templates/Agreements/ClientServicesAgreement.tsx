import React from "react";
import { DocumentLayout } from "../../DocumentLayout";

export interface ClientServicesAgreementProps {
    data: {
        agreement_number: string;
        created_at: string;
        client_name: string;
        client_phone?: string;
        client_address?: string;
        client_email?: string;
        vehicle_info?: string;
        vin?: string;
        services_description: string;
        total_estimated_cost: number;
    };
}

export const ClientServicesAgreement: React.FC<ClientServicesAgreementProps> = ({ data }) => {
    const formattedDate = new Date(data.created_at).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <DocumentLayout
            title="SERVICE AGREEMENT"
            documentNumber={data.agreement_number}
            date={formattedDate}
        >
            <div className="text-sm text-gray-800 leading-relaxed space-y-4 text-justify font-serif">
                <div className="mb-6 border-b border-gray-300 pb-4">
                    <h3 className="font-bold text-[#1a365d] mb-2 uppercase">Customer Information:</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        <div><span className="font-bold">Name:</span> {data.client_name}</div>
                        <div><span className="font-bold">Phone:</span> {data.client_phone || "_________________"}</div>
                        <div><span className="font-bold">Address:</span> {data.client_address || "_________________"}</div>
                        <div><span className="font-bold">Email:</span> {data.client_email || "_________________"}</div>
                        <div className="col-span-2"><span className="font-bold">Vehicle Year/Make/Model:</span> {data.vehicle_info || "_________________"}</div>
                        <div className="col-span-2"><span className="font-bold">VIN:</span> {data.vin || "_________________"}</div>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">1. PARTIES</h3>
                    <p>This Service Agreement (“Agreement”) is made between Axonic Motorworks LLC (“Company”) and the customer identified below (“Customer”).</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">2. SCOPE OF SERVICES</h3>
                    <p>The company agrees to perform repair, paint, body, mechanical, and/or restoration work (“Services”) as described in the approved Estimate or Work Order.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">3. ESTIMATES & AUTHORIZATION</h3>
                    <p>Customer acknowledges receipt of an estimate and authorizes all required repairs, use of OEM/used/aftermarket parts, and operation of the vehicle for testing.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">4. PAYMENT TERMS</h3>
                    <p>A 50% deposit is required before work begins. Deposits are non refundable. Balance is due before release. Storage fees apply after 3 business days. Late fees apply after 5 days.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">5. WARRANTY</h3>
                    <p>A 2-year workmanship warranty applies to body and paint repairs. Warranty excludes rust, prior repairs, corrosion, or environmental damage.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">6. DISCLAIMER OF WARRANTIES</h3>
                    <p>Except for the stated warranty, all other warranties are disclaimed. The company is not liable for loss of use, rental fees, diminished value, or consequential damages.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">7. PROPERTY & RISK OF LOSS</h3>
                    <p>Customers must remove valuables. The company is not responsible for personal items. Unclaimed vehicles after 30 days may be subject to lien and sale.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">8. AUTHORIZATION TO OPERATE VEHICLE</h3>
                    <p>The customer authorizes the Company to operate the vehicle for testing or transport. The company maintains garage liability insurance.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">9. INSURANCE CLAIMS</h3>
                    <p>Customers are responsible for deductibles and uncovered items. Insurance payments must be endorsed to Company.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">10. PARTS & STORAGE POLICY</h3>
                    <p>Replaced parts become Company property unless requested beforehand. Paint match cannot be guaranteed due to fade or material variations.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">11. INDEMNIFICATION</h3>
                    <p>Customer indemnifies Company against losses from misrepresentation, unpaid invoices, or customer-supplied parts.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">12. TERMINATION</h3>
                    <p>The company may terminate due to non-payment or safety concerns. Work completed will be billed accordingly.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">13. DISPUTE RESOLUTION</h3>
                    <p>Agreement governed by Texas law. Disputes resolved via binding arbitration in Travis County, Texas.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">14. PRIVACY AGREEMENT, ALL PERSONAL IDENTIFICATION NUMBERS</h3>
                    <p>Axonic Motorworks may temporarily collect and securely store personal identification documents for verification and legal compliance, and will delete all scanned personal identification numbers and related digital copies within seven (7) business days after full payment, unless legally required to retain them. The Company will not share personal information except as required by law or with the client’s written consent, and maintains safeguards to protect privacy. By signing, the Client consents to this policy.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">15. ENTIRE AGREEMENT</h3>
                    <p>This Agreement supersedes prior communications. Changes must be in writing and signed by both parties.</p>
                </div>

                <div className="mt-8 pt-4 page-break-inside-avoid">
                    <div className="mb-8">
                        <h3 className="font-bold text-[#1a365d] mb-4 uppercase border-b border-gray-300 pb-1">CUSTOMER ACCEPTANCE</h3>
                        <div className="flex justify-between items-end">
                            <div className="w-2/3">
                                <div className="border-b border-black h-8 mb-1"></div>
                                <p className="text-xs text-gray-500">Customer Signature</p>
                            </div>
                            <div className="w-1/4">
                                <div className="border-b border-black h-8 mb-1"></div>
                                <p className="text-xs text-gray-500">Date</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-[#1a365d] mb-4 uppercase border-b border-gray-300 pb-1">AXONIC MOTORWORKS REPRESENTATIVE</h3>
                        <div className="flex justify-between items-end">
                            <div className="w-2/3">
                                <div className="border-b border-black h-8 mb-1"></div>
                                <p className="text-xs text-gray-500">Authorized Signature</p>
                            </div>
                            <div className="w-1/4">
                                <div className="border-b border-black h-8 mb-1"></div>
                                <p className="text-xs text-gray-500">Date</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DocumentLayout>
    );
};
