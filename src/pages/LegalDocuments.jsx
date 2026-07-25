import React from 'react'
import { Badge, Card } from '../components/UI.jsx'

const DOCUMENTS = {
  terms: {
    title: 'Terms of Service',
    summary: 'Rules governing access to and use of Shikola Timetable Creator.',
    sections: [
      ['1. Agreement', <>These Terms of Service form an agreement between Sepio Corp (<strong>“Sepio,” “we,” “us,”</strong> or <strong>“our”</strong>) and the person or organization using Shikola Timetable Creator (<strong>“you”</strong>). By installing, accessing, or using the application, you agree to these terms. If you use the application for an organization, you confirm that you have authority to bind it.</>],
      ['2. The service', <>Shikola Timetable Creator provides tools for creating, managing, checking, importing, exporting, and printing school timetables. Features may change as the product is improved. The desktop application is designed to work offline, although updates, telemetry you enable, support, and linked services may require internet access.</>],
      ['3. License and acceptable use', <>Sepio grants you a limited, non-exclusive, non-transferable, revocable license to use the application for your internal educational or administrative purposes. You may not copy, resell, sublicense, reverse engineer, bypass technical limits, interfere with security, use the application unlawfully, or use it to infringe another person’s rights.</>],
      ['4. Your data and responsibilities', <>You are responsible for the accuracy, legality, and backup of data entered into the application and for controlling access to your device. You must have all required notices, permissions, and lawful bases before entering personal data. Local data may be lost if the device, application data, or storage is deleted.</>],
      ['5. Updates and third-party services', <>We may provide updates, patches, or replacement versions. Links and integrations operated by third parties are governed by their own terms. Sepio is not responsible for third-party products or services.</>],
      ['6. Disclaimers and liability', <>The application is provided <strong>“as is”</strong> and <strong>“as available.”</strong> To the extent permitted by law, Sepio disclaims implied warranties and is not liable for indirect, incidental, special, consequential, or punitive damages, loss of data, lost revenue, or interruption. Any aggregate liability will not exceed the amount you paid Sepio for the application during the twelve months before the claim.</>],
      ['7. Suspension and termination', <>You may stop using the application at any time. Sepio may suspend or terminate a license for material breach, unlawful use, security risk, or non-payment after any notice or cure period required by an applicable agreement or law. Provisions intended to survive termination will remain effective.</>],
      ['8. Governing law and contact', <>These terms are governed by the laws of the Republic of Zambia, excluding conflict-of-law rules. The courts of competent jurisdiction in Lusaka, Zambia will have jurisdiction unless mandatory law requires otherwise. Questions may be sent to <a href="mailto:legal@shikola.org">legal@shikola.org</a>.</>],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    summary: 'How Sepio Corp handles personal information associated with Shikola.',
    sections: [
      ['1. Scope', <>This policy applies to Shikola Timetable Creator and related support, update, registration, analytics, and crash-reporting interactions. Sepio Corp is the controller of information it receives directly. Schools and other customers remain responsible for personal data they enter and store locally in the application.</>],
      ['2. Information stored locally', <>School information, teachers, classes, subjects, rooms, constraints, and timetables are stored on your device. Sepio does not receive this local content merely because you use the application. You control local access, retention, backup, export, and deletion.</>],
      ['3. Information we receive', <>If enabled, school registration may send school name, contact details, address, academic year, and IP address. Optional analytics may send event names, session identifiers, app version, and operating-system information. Optional crash reports may include error messages, stack traces, system information, and IP address. Support requests contain the information you choose to provide.</>],
      ['4. Uses and legal bases', <>We use information to provide support, secure and improve the product, understand feature usage, diagnose faults, communicate about the service, and comply with law. Depending on your location, our legal bases may include consent, performance of a contract, legitimate interests, and legal obligations. You can disable optional telemetry in Settings.</>],
      ['5. Sharing and retention', <>We do not sell personal information. We may disclose it to vetted service providers acting under contract, professional advisers, authorities when legally required, or a successor in a corporate transaction. Optional telemetry and support records are normally retained for up to 24 months, then deleted or anonymized, unless a longer period is needed for security, dispute resolution, contractual commitments, or legal compliance.</>],
      ['6. Security and international transfers', <>We use reasonable administrative, technical, and organizational safeguards. No system is completely secure. The application stores timetable content locally. Optional telemetry is transmitted over HTTPS through Formspree, and ipify may be used to determine a public IP address. These providers may process information outside Zambia. Where required, transfers will use contractual and other safeguards consistent with the Zambia Data Protection Act, 2021.</>],
      ['7. Your rights', <>Depending on applicable law, you may request access, correction, deletion, restriction, portability, or objection, and may withdraw consent without affecting earlier processing. You may also complain to your local data-protection authority. Requests can be sent to <a href="mailto:privacy@shikola.org">privacy@shikola.org</a>.</>],
      ['8. Children and changes', <>Shikola is supplied to schools and administrators and is not directed to children acting independently. Institutions must provide required notices and permissions for student information. We may update this policy and will identify the current effective date.</>],
    ],
  },
  dpa: {
    title: 'Data Processing Addendum',
    summary: 'Template data-processing terms for customers that appoint Sepio as a processor.',
    sections: [
      ['1. Parties and priority', <>This Data Processing Addendum (<strong>“DPA”</strong>) forms part of the agreement between Sepio Corp (<strong>“Processor”</strong>) and the customer identified in the applicable order form or service agreement (<strong>“Controller”</strong>). If this DPA conflicts with the main agreement on personal-data processing, this DPA controls.</>],
      ['2. Processing details', <>The subject matter is provision and support of Shikola services. Processing lasts for the agreement term and any agreed return or deletion period. The nature and purpose are support, troubleshooting, optional telemetry selected by the Controller, service security, and related instructions. Data subjects may include customer staff, teachers, administrators, and institutional contacts. Approved data categories are account and contact details, school profile information, device and operating-system information, usage events, IP addresses, and diagnostic or crash information. Timetable content remains local unless the Controller deliberately includes it in a support request.</>],
      ['3. Processor obligations', <>Processor will process personal data only on documented instructions, ensure authorized personnel are bound by confidentiality, implement appropriate security measures, assist with data-subject requests and compliance obligations, notify Controller of a personal-data breach without undue delay, and delete or return data at termination unless law requires retention.</>],
      ['4. Controller obligations', <>Controller is responsible for lawful instructions, transparency, legal bases, data accuracy, user access, and ensuring the service is appropriate for its processing. Controller will not provide special-category or highly sensitive data unless expressly agreed in writing with appropriate safeguards.</>],
      ['5. Subprocessors', <>Controller authorizes Formspree, used to relay optional telemetry, and ipify, used to obtain a public IP address when applicable. Processor will impose appropriate data-protection duties and remain responsible for subprocessors as required by law. Processor will provide at least 30 days’ prior notice of a material new subprocessor and a reasonable opportunity to object on legitimate data-protection grounds.</>],
      ['6. Transfers and audits', <>Any restricted international transfer will use an approved legal mechanism under the Zambia Data Protection Act, 2021 and other applicable law. Processor will provide information reasonably necessary to demonstrate compliance and permit audits no more than once annually, unless a breach or regulator requires otherwise, subject to confidentiality, security, and reasonable cost controls.</>],
      ['7. Security schedule', <>Controls include local storage of timetable content, HTTPS encryption for optional telemetry in transit, consent controls for registration, analytics, and crash reporting, restricted access to received reports, application updates, reasonable vulnerability remediation, incident handling, personnel confidentiality, and vendor review. Controller remains responsible for device security, user access, and local backups.</>],
      ['8. Acceptance', <>This DPA is accepted when the parties enter an order form or service agreement that incorporates it. The names, titles, and dates in that signed agreement apply to this DPA.</>],
    ],
  },
  refund: {
    title: 'Refund Policy',
    summary: 'Template rules for purchases, cancellations, and refund requests.',
    sections: [
      ['1. Free application', <>If Shikola Timetable Creator is supplied at no charge, there is no purchase price to refund. Charges for separate products, implementation, support, customization, or enterprise services are governed by the order form or agreement for those services.</>],
      ['2. Paid licenses', <>Unless an order form says otherwise, a first-time direct purchase may be cancelled for a refund within 14 days after purchase by emailing <a href="mailto:billing@shikola.org">billing@shikola.org</a> with the purchaser name, order number, purchase date, and reason for the request.</>],
      ['3. Exclusions', <>Refunds are not available after the stated window, for renewal periods already begun, consumed professional services, custom development, abuse, fraud, violation of license terms, or purchases made through a third-party store. Third-party purchases are subject to that seller’s refund process and terms.</>],
      ['4. Subscriptions and renewals', <>Cancellation prevents future renewal but does not automatically refund the current billing period. To avoid renewal, cancellation must be received at least 30 days before the renewal date unless the applicable order form allows a shorter period. A cancellation takes effect at the end of the paid term.</>],
      ['5. Processing', <>Approved refunds will be returned to the original payment method where practical within 10 business days. Bank or payment-provider processing may take longer. This policy does not limit non-waivable consumer rights.</>],
    ],
  },
  msa: {
    title: 'Master Services Agreement',
    summary: 'Template commercial framework for institutional and enterprise services.',
    sections: [
      ['1. Agreement structure', <>This Master Services Agreement (<strong>“MSA”</strong>) is between Sepio Corp and the customer identified in the applicable order form. It governs order forms and statements of work that identify services, deliverables, fees, and timelines. Signed order forms and statements of work form part of this MSA.</>],
      ['2. Services and customer cooperation', <>Sepio will provide the services with reasonable skill and care in material accordance with the applicable order. Customer will provide timely access, decisions, accurate information, suitable systems, and personnel reasonably required for delivery. Changes to scope, schedule, or fees must be documented in writing.</>],
      ['3. Fees and taxes', <>Customer will pay undisputed invoices within 30 days of the invoice date in the currency stated on the applicable order form. Fees exclude applicable taxes. Customer may withhold disputed amounts if it gives prompt written detail and works in good faith toward resolution. Late charges may not exceed the lawful maximum.</>],
      ['4. Intellectual property', <>Each party retains its pre-existing materials and intellectual property. Sepio owns the services, software, documentation, methods, improvements, and reusable know-how. Upon full payment, Customer receives the usage rights stated in the applicable order. Customer owns its data and grants Sepio only the rights needed to perform the services.</>],
      ['5. Confidentiality and data protection', <>Each party will protect the other’s confidential information using reasonable care, use it only for the agreement, and disclose it only to personnel and contractors who need it and are bound by confidentiality. Legally compelled disclosure is permitted with notice where lawful. The DPA applies when Sepio processes personal data for Customer.</>],
      ['6. Warranties and remedies', <>Each party warrants it has authority to enter the agreement. Sepio warrants that professional services will materially conform to the applicable statement of work. Customer’s exclusive remedy for a breach of this service warranty is re-performance or, if Sepio cannot re-perform, a refund of fees paid for the affected service.</>],
      ['7. Liability and insurance', <>Neither party is liable for indirect, special, incidental, consequential, or punitive damages or lost profits, revenue, goodwill, or data. Except for liabilities that cannot lawfully be limited and any negotiated exclusions, each party’s aggregate liability will not exceed the fees paid or payable under the affected order during the 12 months before the event giving rise to the claim. Insurance obligations, if any, must be stated in the applicable order.</>],
      ['8. Term and termination', <>This MSA begins on the effective date of the first order form that incorporates it and continues until terminated under agreed notice. Either party may terminate for an uncured material breach after 30 days’ written notice, or immediately for insolvency where lawful. Customer will pay fees accrued through termination.</>],
      ['9. General', <>The parties are independent contractors. Neither may assign this MSA except as agreed or in connection with a merger or sale of substantially all assets. Notices will be sent to the contacts in the applicable order. This MSA is governed by the laws of the Republic of Zambia, and the courts of competent jurisdiction in Lusaka, Zambia have jurisdiction. This MSA is the entire agreement on its subject matter.</>],
      ['10. Acceptance', <>The authorized names, titles, signatures, and effective date stated in the applicable signed order form apply to this MSA.</>],
    ],
  },
  cyberInsurance: {
    title: 'Cyber Liability Insurance',
    summary: 'Template coverage disclosure and certificate-information sheet.',
    warning: 'This template is not proof of insurance. Publish it only after entering details from a current policy or insurer-issued certificate.',
    sections: [
      ['1. Insured organization', <>Named insured: Sepio Corp<br />Business address: <Placeholder>REGISTERED ADDRESS PENDING CONFIRMATION</Placeholder></>],
      ['2. Policy details', <>Insurer: <Placeholder>INSURER NAME</Placeholder><br />Policy number: <Placeholder>POLICY NUMBER</Placeholder><br />Policy period: <Placeholder>START DATE – END DATE</Placeholder><br />Broker or authorized contact: <Placeholder>NAME / CONTACT DETAILS</Placeholder></>],
      ['3. Coverage limits', <>Cyber liability aggregate: <Placeholder>AMOUNT / CURRENCY</Placeholder><br />Per-claim limit: <Placeholder>AMOUNT / CURRENCY</Placeholder><br />Privacy and network security: <Placeholder>LIMIT</Placeholder><br />Incident response and data restoration: <Placeholder>LIMIT</Placeholder><br />Business interruption: <Placeholder>LIMIT / WAITING PERIOD</Placeholder><br />Cyber extortion and social engineering: <Placeholder>LIMITS</Placeholder></>],
      ['4. Retention and exclusions', <>Deductible or self-insured retention: <Placeholder>AMOUNT / CURRENCY</Placeholder><br />Material exclusions or endorsements: <Placeholder>POLICY-SPECIFIC DETAILS</Placeholder></>],
      ['5. Evidence and requests', <>Coverage is subject to the policy’s terms, conditions, exclusions, limits, and endorsements. This summary does not amend or extend coverage. A current insurer-issued certificate or other approved evidence may be requested from <a href="mailto:legal@shikola.org">legal@shikola.org</a>.</>],
    ],
  },
}

function Placeholder({ children }) {
  return <span className="inline-flex rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">[{children}]</span>
}

export default function LegalDocuments({ documentId }) {
  const document = DOCUMENTS[documentId] || DOCUMENTS.terms

  return (
    <>
      <Card className="mb-4 border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Draft template — legal review required</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">Replace every highlighted placeholder and have qualified counsel approve this document before relying on or publishing it.</p>
          </div>
        </div>
      </Card>

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-slate-800">{document.title}</h2>
            <Badge color="amber">Template</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-500">{document.summary}</p>
          <p className="mt-3 text-xs text-slate-400">Effective date: 01 August 2026 · Last updated: 25 July 2026</p>
        </div>

        <div className="space-y-7 px-6 py-6 sm:px-8 sm:py-8">
          {document.warning && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium leading-relaxed text-red-700">
              {document.warning}
            </div>
          )}
          {document.sections.map(([heading, content]) => (
            <section key={heading}>
              <h3 className="text-sm font-bold text-slate-800">{heading}</h3>
              <div className="mt-2 text-sm leading-7 text-slate-600 [&_a]:font-medium [&_a]:text-brand-600 [&_a]:hover:text-brand-700">
                {content}
              </div>
            </section>
          ))}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-xs text-slate-500 sm:px-8">
          Sepio Corp · <a className="font-medium text-brand-600 hover:text-brand-700" href="mailto:legal@shikola.org">legal@shikola.org</a> · <Placeholder>REGISTERED ADDRESS PENDING CONFIRMATION</Placeholder>
        </div>
      </Card>
    </>
  )
}
