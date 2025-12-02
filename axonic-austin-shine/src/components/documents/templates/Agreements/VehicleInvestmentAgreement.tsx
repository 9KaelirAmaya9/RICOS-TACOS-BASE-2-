import React from "react";
import { DocumentLayout } from "../../DocumentLayout";

export interface AgreementData {
    agreement_number: string;
    created_at: string;
    client_name: string;
    client_address?: string;
    client_email?: string;
    vehicle_info?: string;
    investment_amount: number;
    projected_return?: number;
}

interface VehicleInvestmentAgreementProps {
    data: AgreementData;
}

export const VehicleInvestmentAgreement: React.FC<VehicleInvestmentAgreementProps> = ({ data }) => {
    const formattedDate = new Date(data.created_at).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <DocumentLayout
            title="VEHICLE INVESTMENT AGREEMENT"
            documentNumber={data.agreement_number}
            date={formattedDate}
        >
            <div className="text-sm text-gray-800 leading-relaxed space-y-6 text-justify font-serif">
                <div className="mb-6">
                    <p><strong>Date:</strong> {formattedDate}</p>
                    <p className="mt-4"><strong>BETWEEN:</strong></p>
                    <p>
                        <strong>AXONIC MOTORWORKS, LLC</strong><br />
                        15600 Marsha St Bldg 1 Unit A<br />
                        Austin, TX 78728, United States<br />
                        Phone: 918-704-1450<br />
                        Email: sales@axonicmoto.com<br />
                        ("Company" or "Axonic Motorworks")
                    </p>
                    <p className="mt-4"><strong>AND:</strong></p>
                    <p>
                        <strong>{data.client_name}</strong><br />
                        {data.client_address && <>{data.client_address}<br /></>}
                        {data.client_email && <>{data.client_email}<br /></>}
                        ("Investor")
                    </p>
                </div>

                <p>
                    This Vehicle Investment Agreement (“Agreement”) is made between Axonic Motorworks LLC (“Company”) and <strong>{data.client_name}</strong> (“Investor”) for the purpose of funding, restoring, and reselling a <strong>{data.vehicle_info || "_________________________________"}</strong>.
                </p>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-2 uppercase">1. INVESTMENT TERMS</h3>
                    <p>
                        The Investor agrees to provide an investment of <strong>${data.investment_amount.toLocaleString()} USD</strong> to Axonic Motorworks LLC for the restoration and resale of a <strong>{data.vehicle_info || "_______________________________"}</strong>. The Investor’s total return upon successful resale shall be <strong>{data.projected_return ? `$${data.projected_return.toLocaleString()} USD` : "$_________ USD"}</strong>, inclusive of the initial investment. The vehicle will remain under the sole ownership of Axonic Motorworks LLC until the restoration and resale process is complete. The Investor acknowledges that they do not hold title or ownership rights to the vehicle at any point during the agreement term.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-2 uppercase">2. RESTORATION AND RESALE TERMS</h3>
                    <p>
                        Axonic Motorworks will perform and oversee all restoration work on the vehicle, including mechanical, electrical, and cosmetic improvements. Upon completion, the vehicle will be marketed and sold at a fair market price determined by Axonic Motorworks based on prevailing conditions. After the vehicle’s sale and receipt of cleared funds, Axonic Motorworks will remit the full agreed return of <strong>{data.projected_return ? `$${data.projected_return.toLocaleString()} USD` : "$_________ USD"}</strong> to the Investor. The Investor acknowledges that vehicle market conditions may affect sale timing and profitability.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-2 uppercase">3. LIABILITY AND OWNERSHIP</h3>
                    <p>
                        Axonic Motorworks assumes full responsibility for vehicle maintenance, insurance, and resale. The Investor’s liability shall be limited strictly to the investment amount of <strong>${data.investment_amount.toLocaleString()} USD</strong>. Axonic Motorworks will ensure the vehicle is stored securely throughout the restoration and sale period.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-2 uppercase">4. GOVERNING LAW</h3>
                    <p>
                        This Agreement shall be governed by and construed in accordance with the laws of the State of Texas. Any disputes shall be resolved in Travis County, Texas.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-2 uppercase">5. ENTIRE AGREEMENT</h3>
                    <p>
                        This Agreement represents the full and final understanding between the parties regarding the investment, restoration, and resale of the specified vehicle. It supersedes all prior discussions and agreements, written or oral.
                    </p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-2 uppercase">6. SIGNATURES</h3>
                    <p>
                        By signing below, both parties acknowledge that they have read, understood, and agree to the terms set forth in this Agreement.
                    </p>
                </div>

                <div className="mt-12 pt-8 page-break-inside-avoid">
                    <h3 className="font-bold text-[#1a365d] mb-6 uppercase text-center border-b border-gray-300 pb-2">EXECUTION PAGE</h3>
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <p className="font-bold text-sm uppercase mb-8">AXONIC MOTORWORKS, LLC</p>
                            <div className="mb-4">
                                <div className="border-b border-black h-8 mb-1"></div>
                                <p className="text-xs text-gray-500">Signature</p>
                            </div>
                            <div className="mb-4">
                                <p className="font-medium">Goupu Touthang</p>
                                <div className="border-b border-black h-1 mb-1"></div>
                                <p className="text-xs text-gray-500">Printed Name</p>
                            </div>
                            <div className="mb-4">
                                <p className="font-medium">CEO & Owner</p>
                                <div className="border-b border-black h-1 mb-1"></div>
                                <p className="text-xs text-gray-500">Title</p>
                            </div>
                            <div>
                                <div className="border-b border-black h-8 mb-1"></div>
                                <p className="text-xs text-gray-500">Date</p>
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-sm uppercase mb-8">INVESTOR</p>
                            <div className="mb-4">
                                <div className="border-b border-black h-8 mb-1"></div>
                                <p className="text-xs text-gray-500">Signature</p>
                            </div>
                            <div className="mb-4">
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
