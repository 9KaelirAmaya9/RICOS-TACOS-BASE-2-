import React from "react";
import { DocumentLayout } from "../../DocumentLayout";

export interface ContractorAgreementProps {
    data: {
        agreement_number: string;
        created_at: string;
        contractor_name: string;
        contractor_address?: string;
        contractor_phone?: string;
        contractor_email?: string;
        role: string;
        rate: string;
        payment_schedule?: string;
        start_date?: string;
    };
}

export const ContractorAgreement: React.FC<ContractorAgreementProps> = ({ data }) => {
    const formattedDate = new Date(data.created_at).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <DocumentLayout
            title="SERVICE & EMPLOYMENT AGREEMENT"
            documentNumber={data.agreement_number}
            date={formattedDate}
        >
            <div className="text-sm text-gray-800 leading-relaxed space-y-4 text-justify font-serif">
                <div className="text-center mb-6">
                    <h2 className="font-bold text-lg text-[#1a365d]">AXONIC MOTORWORKS LLC</h2>
                    <p>15600 Marsha St Bldg 1 Unit A Austin, TX 78728</p>
                    <p>T: 918-704-1450</p>
                </div>

                <div className="mb-6 border-b border-gray-300 pb-4">
                    <h3 className="font-bold text-[#1a365d] mb-2 uppercase">Table of Contents</h3>
                    <ol className="list-decimal list-inside grid grid-cols-2 gap-x-4 text-xs">
                        <li>Purpose and Scope</li>
                        <li>Parties to the Agreement</li>
                        <li>At-Will Employment (Employees Only)</li>
                        <li>Job Description and Duties</li>
                        <li>Compensation and Benefits</li>
                        <li>Vehicle and Property Damage Responsibility</li>
                        <li>Confidentiality and Proprietary Information</li>
                        <li>Workplace Safety</li>
                        <li>Drug and Alcohol Policy</li>
                        <li>Social Media and Communications</li>
                        <li>Legal Obligations, Liability & Indemnification</li>
                        <li>Termination & Cancellation</li>
                        <li>Failure to Perform and Compensation Adjustments</li>
                        <li>Privacy Agreement</li>
                        <li>Dispute Resolution and Arbitration</li>
                        <li>General Provisions</li>
                        <li>Governing Law & Jurisdiction</li>
                        <li>Entire Agreement & Amendments</li>
                    </ol>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">1. PURPOSE AND SCOPE</h3>
                    <p>This unified Agreement governs Contractors and Employees working with Axonic Motorworks LLC in the State of Texas. It establishes comprehensive terms for all work relationships while preserving all legal protections and intent found in prior versions. This Agreement covers service terms, compensation, responsibilities, confidentiality, safety requirements, and all legal obligations for both independent contractors and direct employees operating under Texas law.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">2. PARTIES TO THE AGREEMENT</h3>
                    <div className="pl-4">
                        <p className="font-bold">2.1 Company</p>
                        <p>Axonic Motorworks LLC, 15600 Marsha St, Bldg 1 Unit A, Austin, TX 78728. Phone: (918) 704-1450 Email: sales@axonicmoto.com</p>
                        <p className="font-bold mt-2">2.2 Contractors</p>
                        <p>Contractors engaged by the Company operate as independent service providers in the State of Texas and are responsible for completing specialized tasks such as body work, mechanical repair, preparation and painting, vehicle or product pickup, and other project-support services required to complete assigned work. Contractors are solely responsible for their own taxes, insurance, licensing, and any other obligations associated with independent contractor status under Texas and federal law.</p>
                        <p className="font-bold mt-2">2.3 Employees</p>
                        <p>Employees perform duties under the direct supervision of Axonic Motorworks LLC at the Austin, Texas facility. Their roles, responsibilities, and scope of work are defined and agreed upon in their respective hiring agreement forms. All standard payroll taxes and deductions are withheld as required by Texas and federal law.</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">3. AT-WILL EMPLOYMENT (EMPLOYEES ONLY)</h3>
                    <p>This section applies to Employees only. Employment is at-will under Texas law. Either party may terminate this employment relationship at any time, with or without cause, and with or without notice. This at-will relationship cannot be changed except by a written agreement signed by the Employee and an authorized representative of Axonic Motorworks. No oral statements or representations can alter the at-will nature of this employment. Contractors operate under the independent contractor termination terms specified in Section 12.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">4. JOB DESCRIPTION AND DUTIES</h3>
                    <div className="pl-4">
                        <p className="font-bold">4.1 Primary Responsibilities</p>
                        <p>For Technician/Body Shop Positions: Perform collision repair, body work, painting, and refinishing on customer vehicles; Diagnose vehicle damage and determine appropriate repair procedures; Operate hand tools, power tools, welding equipment, and spray painting equipment safely; Maintain a clean and organized work area; Complete work orders accurately and within estimated time frames.</p>
                        <p className="font-bold mt-2">4.2 Additional Duties</p>
                        <p>All parties agree to perform such other duties as may be reasonably assigned by the Company from time to time, consistent with their position and qualifications.</p>
                        <p className="font-bold mt-2">4.3 Performance Standards</p>
                        <p>All work shall be performed in a professional, competent, and diligent manner, in accordance with the Company's policies, procedures, and standards of performance as may be established from time to time, and in compliance with all applicable Texas and federal regulations.</p>
                        <p className="font-bold mt-2">4.4 Compliance with Policies</p>
                        <p>All parties agree to comply with all Company policies, procedures, rules, and regulations, including those contained in the Employee Handbook (for Employees), as may be amended from time to time.</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">5. COMPENSATION AND BENEFITS</h3>
                    <div className="pl-4">
                        <p className="font-bold">5.1 Contractor Compensation</p>
                        <p>Payment Structure: Contractors are paid per the terms agreed in the Execution Work Form (Addendum). Payment amounts and schedules are determined on a per-project or per-service basis. Contractors are issued payment weekly upon submission and approval of work logs.</p>
                        <p>Tax Responsibility: Contractors are solely responsible for their own federal and Texas state taxes, including self-employment taxes, sales taxes if applicable, and estimated quarterly tax payments as required by the IRS and Texas Comptroller.</p>
                        <p>No Benefits: Contractors are not entitled to overtime pay, paid time off (PTO), sick leave, vacation days, health insurance, retirement benefits, or any other employee benefits. Contractors must secure their own insurance coverage, including liability and workers' compensation insurance as required by Texas law.</p>
                        <p>Independent Status: Contractors acknowledge and agree that they are independent contractors under Texas law and not employees. They maintain control over how and when work is performed, subject to meeting agreed-upon deadlines and quality standards.</p>
                        <p className="font-bold mt-2">5.2 Employee Base Compensation</p>
                        <p>Employee compensation is specified in the Execution Work Form (Addendum). All compensation is subject to applicable federal and Texas state tax withholdings and other legally required deductions. Payment schedules may be weekly or bi-weekly in accordance with Company payroll practices and Texas Payday Law requirements.</p>
                        <p className="font-bold mt-2">5.3 Expense Reimbursement</p>
                        <p>The Company will reimburse Employees and Contractors for all reasonable and necessary business expenses incurred in the performance of duties, subject to the Company's expense reimbursement policy and submission of appropriate documentation including receipts. Reimbursement requests must be submitted within 30 days of the expense being incurred. All expenses exceeding $50 must be pre-approved by a supervisor.</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">6. VEHICLE AND PROPERTY DAMAGE RESPONSIBILITY</h3>
                    <p>6.1 Authorization to Operate Vehicles: All parties are authorized to operate customer vehicles, company vehicles, and other motor vehicles only as necessary to perform assigned job duties. This authorization is subject to: (a) Possession of a valid Texas driver's license; (b) Compliance with all Texas traffic laws; (c) Adherence to Company vehicle operation policies; and (d) Maintenance of insurability.</p>
                    <p>6.2 Vehicle Safety and Care: All parties agree to perform visual inspections, operate vehicles safely, report accidents immediately, secure vehicles, use protective covers, and never operate under the influence.</p>
                    <p>6.3 Damage to Customer Vehicles: In the event damage is caused to a customer vehicle through negligence, recklessness, or willful misconduct, the responsible party may be held financially responsible for repair costs and deductibles to the extent permitted by Texas law.</p>
                    <p>6.4 Damage to Company Property: Similar financial responsibility provisions apply to damage caused to Company property, tools, equipment, or facilities.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">7. CONFIDENTIALITY AND PROPRIETARY INFORMATION</h3>
                    <p>All parties acknowledge that they may have access to confidential and proprietary information. All parties agree to maintain strict confidentiality, use information solely for performing duties, not disclose to third parties, and return all information upon termination. These obligations survive termination.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">8. WORKPLACE SAFETY</h3>
                    <p>All parties must comply with OSHA regulations, Texas Health and Safety Code, and Company safety policies. All injuries and unsafe conditions must be reported immediately. Contractors must maintain adequate insurance.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">9. DRUG AND ALCOHOL POLICY</h3>
                    <p>Axonic Motorworks maintains a drug-free and alcohol-free workplace. Possession or use of illegal drugs or alcohol is prohibited. The Company reserves the right to conduct testing. Violations result in immediate termination.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">10. SOCIAL MEDIA AND COMMUNICATIONS</h3>
                    <p>All parties agree not to post confidential Company or customer information on social media. Public communications must be approved by management.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">11. LEGAL OBLIGATIONS, LIABILITY & INDEMNIFICATION</h3>
                    <p>Contractors are independent service providers. All parties acknowledge inherent risks in automotive work. Contractors and Employees agree to indemnify Axonic Motorworks LLC against claims arising from breach of Agreement, negligence, or violation of laws.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">12. TERMINATION & CANCELLATION</h3>
                    <p>Either party may terminate with written notice. The Company may terminate immediately for material breach, misconduct, safety violations, or illegal activity. Upon termination, all property must be returned and access credentials disclosed.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">13. FAILURE TO PERFORM AND COMPENSATION ADJUSTMENTS</h3>
                    <p>Timely and proper performance is required. Incomplete or defective work may result in disciplinary action or payment adjustments for Contractors to the extent permitted by Texas law.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">14. PRIVACY AGREEMENT</h3>
                    <p>Axonic Motorworks LLC protects personal information in accordance with Texas privacy laws. Personal data is used only for business purposes and not shared without permission unless required by law.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">15. DISPUTE RESOLUTION AND ARBITRATION</h3>
                    <p>Disputes shall be resolved by binding arbitration in Travis County, Texas, administered by the AAA. Class action waiver applies. Parties may opt out within 30 days.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">16. GENERAL PROVISIONS</h3>
                    <p>Includes Severability, Waiver, Assignment, Notices, Counterparts/Electronic Signatures, Advice of Counsel, Immigration Law Compliance, and Background Check provisions.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">17. GOVERNING LAW & JURISDICTION</h3>
                    <p>Governed by the laws of the State of Texas. Litigation not subject to arbitration shall be brought in Travis County, Texas.</p>
                </div>

                <div>
                    <h3 className="font-bold text-[#1a365d] mb-1 uppercase">18. ENTIRE AGREEMENT & AMENDMENTS</h3>
                    <p>This Agreement and the Execution Work Form constitute the entire agreement. Amendments must be in writing.</p>
                </div>

                <div className="mt-8 pt-4 page-break-inside-avoid border-t-2 border-gray-300">
                    <h2 className="text-center font-bold text-lg text-[#1a365d] mb-4">ADDENDUM: EXECUTION WORK FORM</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                        <div className="col-span-2"><span className="font-bold">Full Legal Name:</span> {data.contractor_name}</div>
                        <div className="col-span-2"><span className="font-bold">Residential Address:</span> {data.contractor_address || "__________________________________________________________________"}</div>
                        <div><span className="font-bold">Phone:</span> {data.contractor_phone || "____________________"}</div>
                        <div><span className="font-bold">Email:</span> {data.contractor_email || "____________________"}</div>
                        <div className="col-span-2"><span className="font-bold">Position/Title:</span> {data.role}</div>
                        <div className="col-span-2">
                            <span className="font-bold">Worker Classification:</span> &#9744; Independent Contractor (Texas) &#9744; Employee (At-Will, Texas)
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold mb-2">Job Description/Scope of Work:</p>
                        <div className="border-b border-gray-400 h-6 mb-2"></div>
                        <div className="border-b border-gray-400 h-6 mb-2"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div><span className="font-bold">Date Range/Term:</span> {data.start_date || "_______________________"}</div>
                        <div><span className="font-bold">Time/Schedule:</span> _____________________________________</div>
                        <div className="col-span-2">
                            <span className="font-bold">Payment Amount:</span> {data.rate} <span className="font-bold">Per:</span> &#9744; Hour &#9744; Project &#9744; Week &#9744; Other: __________
                        </div>
                        <div className="col-span-2">
                            <span className="font-bold">Payment Schedule:</span> {data.payment_schedule ? <span>{data.payment_schedule}</span> : <span>&#9744; Upon Completion &#9744; Daily &#9744; Weekly &#9744; Bi-weekly &#9744; Monthly</span>}
                        </div>
                    </div>

                    <div className="mb-8 p-2 border border-black text-xs">
                        <strong>CONTRACTOR ACKNOWLEDGMENT:</strong> &#9744; I acknowledge that as an Independent Contractor in Texas, I am NOT entitled to overtime pay, paid time off (PTO), sick leave, vacation days, health insurance, retirement benefits, or any other employee benefits. I am responsible for my own taxes and insurance.
                    </div>

                    <div>
                        <h3 className="font-bold text-[#1a365d] mb-4 uppercase border-b border-gray-300 pb-1">ACKNOWLEDGMENT AND SIGNATURES</h3>
                        <p className="mb-4 text-xs">By signing below, both parties acknowledge that they have read, understand, and agree to be bound by all terms and conditions contained in this Service & Employment Agreement.</p>

                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <div className="border-b border-black h-8 mb-2"></div>
                                <p className="font-bold text-xs uppercase">CONTRACTOR/EMPLOYEE</p>
                                <p className="text-xs text-gray-500">Signature</p>
                            </div>
                            <div>
                                <div className="border-b border-black h-8 mb-2"></div>
                                <p className="font-bold text-xs uppercase">Date</p>
                            </div>
                            <div>
                                <div className="border-b border-black h-8 mb-2"></div>
                                <p className="font-bold text-xs uppercase">Axonic Motorworks LLC</p>
                                <p className="text-xs text-gray-500">Authorized Signature</p>
                            </div>
                            <div>
                                <div className="border-b border-black h-8 mb-2"></div>
                                <p className="font-bold text-xs uppercase">Date</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DocumentLayout>
    );
};
