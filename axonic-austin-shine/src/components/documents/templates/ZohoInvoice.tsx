import React from "react";
import { DocumentLayout } from "../DocumentLayout";

export interface InvoiceData {
    invoice_number: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    customer_address?: string;
    vehicle_info?: {
        year: string;
        make: string;
        model: string;
        vin?: string;
        mileage?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        rate: number;
        amount: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    deposit?: number;
    balance_due: number;
    notes?: string;
}

interface ZohoInvoiceProps {
    data: InvoiceData;
}

export const ZohoInvoice: React.FC<ZohoInvoiceProps> = ({ data }) => {
    const formattedDate = new Date(data.created_at).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    return (
        <DocumentLayout
            title="INVOICE"
            documentNumber={data.invoice_number}
            date={formattedDate}
        >
            {/* Bill To Section */}
            <div className="flex justify-between mb-12">
                <div className="w-1/2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
                    <div className="text-sm text-gray-800 leading-relaxed">
                        <p className="font-bold text-base text-[#1a365d]">{data.customer_name}</p>
                        {data.customer_address && <p>{data.customer_address}</p>}
                        {data.customer_email && <p>{data.customer_email}</p>}
                        {data.customer_phone && <p>{data.customer_phone}</p>}
                    </div>
                </div>

                {/* Vehicle Details (Optional but common for auto shops) */}
                {data.vehicle_info && (
                    <div className="w-1/3 text-right">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vehicle Details</h3>
                        <div className="text-sm text-gray-800 leading-relaxed">
                            <p className="font-bold">{data.vehicle_info.year} {data.vehicle_info.make} {data.vehicle_info.model}</p>
                            {data.vehicle_info.vin && <p className="text-xs text-gray-500">VIN: {data.vehicle_info.vin}</p>}
                            {data.vehicle_info.mileage && <p className="text-xs text-gray-500">Mileage: {data.vehicle_info.mileage}</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* Itemized Table */}
            <div className="mb-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-[#1a365d] text-white">
                            <th className="text-left py-3 px-4 font-semibold uppercase text-xs tracking-wider w-12">#</th>
                            <th className="text-left py-3 px-4 font-semibold uppercase text-xs tracking-wider">Item & Description</th>
                            <th className="text-right py-3 px-4 font-semibold uppercase text-xs tracking-wider w-24">Qty</th>
                            <th className="text-right py-3 px-4 font-semibold uppercase text-xs tracking-wider w-32">Rate</th>
                            <th className="text-right py-3 px-4 font-semibold uppercase text-xs tracking-wider w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="py-3 px-4 border-b border-gray-100 text-gray-500">{index + 1}</td>
                                <td className="py-3 px-4 border-b border-gray-100 font-medium text-gray-800">{item.description}</td>
                                <td className="text-right py-3 px-4 border-b border-gray-100 text-gray-600">{item.quantity}</td>
                                <td className="text-right py-3 px-4 border-b border-gray-100 text-gray-600">{formatCurrency(item.rate)}</td>
                                <td className="text-right py-3 px-4 border-b border-gray-100 font-medium text-gray-800">{formatCurrency(item.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary Section */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 max-w-xs">
                    <div className="flex justify-between py-2 text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{formatCurrency(data.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm text-gray-600">
                        <span>Tax (0%)</span>
                        <span>{formatCurrency(data.tax)}</span>
                    </div>

                    <div className="my-2 border-t border-gray-200"></div>

                    <div className="flex justify-between py-2 text-base font-bold text-[#1a365d]">
                        <span>Total</span>
                        <span>{formatCurrency(data.total)}</span>
                    </div>

                    {data.deposit && data.deposit > 0 && (
                        <div className="flex justify-between py-2 text-sm text-red-500 font-medium">
                            <span>Deposit Paid</span>
                            <span>-{formatCurrency(data.deposit)}</span>
                        </div>
                    )}

                    <div className="flex justify-between py-2 text-base font-bold text-[#1a365d] border-t-2 border-[#1a365d] mt-2 pt-2">
                        <span>Balance Due</span>
                        <span>{formatCurrency(data.balance_due)}</span>
                    </div>
                </div>
            </div>

            {/* Notes & Terms */}
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 italic">
                        {data.notes || "Thank you for your business!"}
                    </p>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Terms & Conditions</h3>
                    <p className="text-sm text-gray-600">
                        Payment is due upon receipt. Please make checks payable to Axonic Motorworks LLC.
                        Warranty on paint and bodywork is 2 years from the date of completion.
                    </p>
                </div>
            </div>
        </DocumentLayout>
    );
};
