import React from "react";
import { render, screen } from "@testing-library/react";
import { ZohoInvoice, InvoiceData } from "./templates/ZohoInvoice";
import { VehicleInvestmentAgreement } from "./templates/Agreements/VehicleInvestmentAgreement";
import { ContractorAgreement } from "./templates/Agreements/ContractorAgreement";
import { ClientServicesAgreement } from "./templates/Agreements/ClientServicesAgreement";
import { describe, it, expect } from "vitest";

// Mock Data
const mockInvoiceData: InvoiceData = {
    invoice_number: "INV-001",
    created_at: "2023-10-27T10:00:00Z",
    customer_name: "John Doe",
    customer_email: "john@example.com",
    customer_phone: "555-0123",
    customer_address: "123 Main St, Austin, TX",
    vehicle_info: {
        year: "2020",
        make: "Tesla",
        model: "Model 3",
        vin: "ABC123456789",
        mileage: "15,000"
    },
    items: [
        { description: "Ceramic Coating", quantity: 1, rate: 1500, amount: 1500 },
        { description: "Paint Correction", quantity: 1, rate: 500, amount: 500 }
    ],
    subtotal: 2000,
    tax: 0,
    total: 2000,
    balance_due: 2000,
    notes: "Customer requested rush service."
};

describe("Document Templates Vigorous Testing", () => {

    describe("ZohoInvoice Template", () => {
        it("renders correctly with full data", () => {
            render(<ZohoInvoice data={mockInvoiceData} />);
            expect(screen.getByText(/INV-001/)).toBeInTheDocument();
            const names = screen.getAllByText("John Doe");
            expect(names.length).toBeGreaterThan(0);
            expect(screen.getByText(/Tesla/)).toBeInTheDocument(); // Partial match check
            const amounts = screen.getAllByText(/\$2,000\.00/);
            expect(amounts.length).toBeGreaterThan(0);
            expect(screen.getByText("Ceramic Coating")).toBeInTheDocument();
        });

        it("renders correctly with minimal data (no vehicle info, no notes)", () => {
            const minimalData: InvoiceData = {
                ...mockInvoiceData,
                vehicle_info: undefined,
                notes: undefined,
                customer_address: undefined,
                customer_phone: undefined
            };
            render(<ZohoInvoice data={minimalData} />);
            expect(screen.getByText(/INV-001/)).toBeInTheDocument();
            const names = screen.getAllByText("John Doe");
            expect(names.length).toBeGreaterThan(0);
            expect(screen.queryByText("Vehicle Details")).not.toBeInTheDocument();
            expect(screen.getByText("Thank you for your business!")).toBeInTheDocument(); // Default note
        });

        it("handles large lists of items without crashing", () => {
            const largeItems = Array.from({ length: 50 }, (_, i) => ({
                description: `Service Item ${i + 1}`,
                quantity: 1,
                rate: 100,
                amount: 100
            }));
            const largeData = { ...mockInvoiceData, items: largeItems, total: 5000 };

            render(<ZohoInvoice data={largeData} />);
            expect(screen.getByText("Service Item 50")).toBeInTheDocument();
            const amounts = screen.getAllByText(/5,000/);
            expect(amounts.length).toBeGreaterThan(0);
        });

        it("handles special characters in names", () => {
            const specialData = { ...mockInvoiceData, customer_name: "José O'Connor & Sons" };
            render(<ZohoInvoice data={specialData} />);
            expect(screen.getByText("José O'Connor & Sons")).toBeInTheDocument();
        });

        it("handles extremely long descriptions gracefully", () => {
            const longDesc = "This is a very long description that should wrap around the table cell and not break the layout of the invoice document. It contains many words to simulate a detailed service explanation.";
            const longItemData = {
                ...mockInvoiceData,
                items: [{ description: longDesc, quantity: 1, rate: 100, amount: 100 }]
            };
            render(<ZohoInvoice data={longItemData} />);
            expect(screen.getByText(longDesc)).toBeInTheDocument();
        });

        it("handles empty items list", () => {
            const emptyItemsData = { ...mockInvoiceData, items: [] };
            render(<ZohoInvoice data={emptyItemsData} />);
            // Should render table headers but no rows
            expect(screen.getByText("Item & Description")).toBeInTheDocument();
        });
    });

    describe("Vehicle Investment Agreement", () => {
        const mockAgreementData = {
            agreement_number: "VIA-001",
            created_at: "2023-10-27T10:00:00Z",
            client_name: "Investor Jane",
            vehicle_info: "1969 Ford Mustang",
            investment_amount: 50000,
            projected_return: 60000
        };

        it("renders agreement details correctly", () => {
            render(<VehicleInvestmentAgreement data={mockAgreementData} />);
            expect(screen.getByText("VEHICLE INVESTMENT AGREEMENT")).toBeInTheDocument();
            const names = screen.getAllByText("Investor Jane");
            expect(names.length).toBeGreaterThan(0);
            expect(screen.getAllByText("1969 Ford Mustang").length).toBeGreaterThan(0);
            const amounts = screen.getAllByText(/\$50,000/);
            expect(amounts.length).toBeGreaterThan(0);
            expect(screen.getByText("1. INVESTMENT TERMS")).toBeInTheDocument();
        });
    });

    describe("Contractor Agreement", () => {
        const mockContractorData = {
            agreement_number: "CA-001",
            created_at: "2023-10-27T10:00:00Z",
            contractor_name: "Bob Builder",
            contractor_address: "456 Construction Ln",
            contractor_phone: "555-9876",
            contractor_email: "bob@builder.com",
            role: "Paint Specialist",
            rate: "$50/hr",
            start_date: "10/27/2023"
        };

        it("renders contractor details correctly", () => {
            render(<ContractorAgreement data={mockContractorData} />);
            expect(screen.getByText("SERVICE & EMPLOYMENT AGREEMENT")).toBeInTheDocument();
            const names = screen.getAllByText(/Bob Builder/);
            expect(names.length).toBeGreaterThan(0);
            expect(screen.getByText(/Paint Specialist/)).toBeInTheDocument();
            expect(screen.getAllByText(/\$50\/hr/).length).toBeGreaterThan(0);
            expect(screen.getByText(/456 Construction Ln/)).toBeInTheDocument();
            expect(screen.getByText(/555-9876/)).toBeInTheDocument();
            expect(screen.getByText(/bob@builder.com/)).toBeInTheDocument();
            expect(screen.getByText("1. PURPOSE AND SCOPE")).toBeInTheDocument();
        });
    });

    describe("Client Services Agreement", () => {
        const mockServiceData = {
            agreement_number: "CSA-001",
            created_at: "2023-10-27T10:00:00Z",
            client_name: "Alice Client",
            client_phone: "555-0123",
            client_address: "123 Main St",
            client_email: "alice@example.com",
            vehicle_info: "2020 Tesla Model 3",
            vin: "ABC123456789",
            services_description: "Full Restoration",
            total_estimated_cost: 15000
        };

        it("renders service agreement details correctly", () => {
            render(<ClientServicesAgreement data={mockServiceData} />);
            expect(screen.getByText("SERVICE AGREEMENT")).toBeInTheDocument();
            const clientNames = screen.getAllByText("Alice Client");
            expect(clientNames.length).toBeGreaterThan(0);
            expect(screen.getByText("555-0123")).toBeInTheDocument();
            expect(screen.getByText("123 Main St")).toBeInTheDocument();
            expect(screen.getByText("alice@example.com")).toBeInTheDocument();
            expect(screen.getByText("2020 Tesla Model 3")).toBeInTheDocument();
            expect(screen.getByText("ABC123456789")).toBeInTheDocument();
            expect(screen.getByText("1. PARTIES")).toBeInTheDocument();
        });
    });
});
