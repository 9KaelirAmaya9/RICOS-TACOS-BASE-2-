import React from "react";
import logoAxonic from "@/assets/logo-axonic-new.jpg";

interface DocumentLayoutProps {
    children: React.ReactNode;
    title: string;
    documentNumber: string;
    date: string;
    className?: string;
}

export const DocumentLayout: React.FC<DocumentLayoutProps> = ({
    children,
    title,
    documentNumber,
    date,
    className = "",
}) => {
    return (
        <div
            id="document-template"
            className={`bg-white text-black font-sans relative box-border ${className}`}
            style={{
                width: "8.5in",
                minHeight: "11in",
                padding: "40px",
                margin: "0 auto", // Center in preview
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-[#1a365d] pb-6">
                <div className="flex items-center gap-4">
                    {/* Ensure logo is imported correctly in parent or use absolute path if public */}
                    <img src={logoAxonic} alt="Axonic Motorworks" className="w-24 h-24 object-contain" />
                    <div>
                        <h1 className="text-3xl font-bold text-[#1a365d] m-0 leading-tight tracking-tight">
                            AXONIC MOTORWORKS
                        </h1>
                        <p className="text-[#718096] text-sm m-0 font-medium tracking-wide">
                            PRECISION RESTORED
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Austin, Texas</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-[#1a365d] m-0 uppercase tracking-wide">{title}</h2>
                    <div className="mt-2 text-right">
                        <p className="text-sm font-bold text-gray-700 m-0">#{documentNumber}</p>
                        <p className="text-sm text-gray-500 m-0">{date}</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-grow min-h-[600px]">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
                <div className="flex justify-center gap-8 mb-2 font-medium text-[#1a365d]">
                    <span>15600 Marsha Street, Building 1 Unit 1A, Austin, TX</span>
                    <span>|</span>
                    <span>210-823-1595</span>
                    <span>|</span>
                    <span>sales@axonicmoto.com</span>
                </div>
                <p className="font-bold text-[#1a365d] tracking-widest uppercase text-[10px]">
                    Precision. Quality. Service.
                </p>
            </div>
        </div>
    );
};
