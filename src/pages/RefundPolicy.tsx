import Layout from "@/components/Layout";
import { Helmet } from "react-helmet-async";

const RefundPolicy = () => {
  return (
    <Layout>
      <Helmet>
        <title>Refund Policy | Tadmaids</title>
        <meta name="description" content="Tadmaids refund policy for domestic worker placement, visa processing, and sponsorship services in the UAE." />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Refund Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: 08 April 2026</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold">About Tadmaids</h2>
            <p>This Refund Policy applies to services provided by Tadmaids Domestic Workers Services LLC ("Tadmaids", "we", "us", or "our") through our website, branches, and official communication channels.</p>
            <p>Tadmaids provides domestic worker placement, visa processing, sponsorship services, and related administrative support (the "Services"), including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maid Visa Support Package</li>
              <li>Direct Hire / Sponsorship Support</li>
              <li>Monthly Sponsorship System</li>
              <li>Recruitment, documentation, and coordination services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Scope</h2>
            <p>This Refund Policy outlines when refunds may be granted and how requests are handled. It should be read together with our Terms & Conditions.</p>
            <p>In case of conflict, the signed contract, invoice, or official service agreement shall prevail.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">General Rule</h2>
            <p>All payments made to Tadmaids are generally non-refundable once:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Work has started</li>
              <li>A maid has been allocated or processed</li>
              <li>Any government or third-party cost has been incurred</li>
            </ul>
            <p>Refunds are only considered under specific conditions outlined below and in accordance with UAE regulations.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">When a Refund May Be Approved</h2>
            <ol className="list-decimal pl-6 space-y-3">
              <li><strong>Overpayment / Duplicate Payment</strong> — Customer paid more than once or above invoiced amount</li>
              <li><strong>Service Not Started</strong> — No processing initiated, no maid allocated, no government/third-party costs incurred</li>
              <li><strong>Administrative Error</strong> — Incorrect billing or internal system error</li>
              <li><strong>Failure to Deliver (Outside Country Cases)</strong> — Tadmaids is unable to deliver a worker for reasons not related to client actions. In such cases, refund may include Tadmaids service fee (fully or partially), less any actual costs incurred.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Non-Refundable Items</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Government fees (visa, Emirates ID, medical, insurance, entry permit, cancellation fees)</li>
              <li>Third-party costs (air tickets, training, embassy, documentation, typing, courier)</li>
              <li>Processing and service fees once work has started</li>
              <li>Maid Visa Support Package once visa process has been initiated</li>
              <li>Any allocated or reserved maid</li>
              <li>Expedited / priority service fees</li>
              <li>Recruitment costs for overseas workers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Package-Specific Rules</h2>
            <h3 className="text-xl font-medium mt-4">Maid Visa Support Package</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Service fee is non-refundable once processing starts</li>
              <li>Refund only considered if no visa application submitted and no government cost incurred</li>
            </ul>
            <h3 className="text-xl font-medium mt-4">Direct Hire / Client Sponsorship</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Refund applicable only if worker is not delivered</li>
              <li>If delivered → No refund</li>
              <li>If not delivered → Tadmaids fee (excluding VAT) may be refunded, less actual costs incurred</li>
            </ul>
            <h3 className="text-xl font-medium mt-4">Monthly Sponsorship System</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Monthly payments are non-refundable once service period has started</li>
              <li>Advance payments may be partially refunded if worker not deployed or visa not processed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Cancellation Requirements</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Request must be submitted in writing</li>
              <li>Client must complete maid visa cancellation (if applicable)</li>
              <li>All original documents must be returned</li>
              <li>Any outstanding balances must be cleared</li>
            </ul>
            <p className="font-medium">No refund will be processed without visa cancellation (if visa was issued).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Refund Processing Timeline</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Refund requests are reviewed within 5–10 working days</li>
              <li>Approved refunds are processed within 14 working days</li>
            </ul>
            <p>Refunds are issued via original payment method or bank transfer (if required). Processing time may vary depending on bank/payment provider.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Deductions</h2>
            <p>All approved refunds are subject to deductions including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Government fees (if already paid)</li>
              <li>Third-party costs</li>
              <li>Admin and processing fees</li>
              <li>Any used portion of service</li>
              <li>Penalties (if applicable under contract)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Chargebacks & Disputes</h2>
            <p>Clients must contact Tadmaids before initiating any chargeback.</p>
            <p>If a chargeback is initiated, all services will be immediately suspended and legal and administrative actions may follow if required.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
            <p>Tadmaids is not liable for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Government delays or rejections</li>
              <li>Client-provided incorrect information</li>
              <li>Third-party processing delays</li>
              <li>Worker-related decisions outside Tadmaids control</li>
            </ul>
            <p>Liability is limited to the amount paid for Tadmaids service fees only (excluding third-party costs).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Policy Updates</h2>
            <p>This policy may be updated periodically to reflect operational or legal changes. The latest version will always apply.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">Contact</h2>
            <p>Email: <a href="mailto:info@tadmaids.com" className="text-primary underline">info@tadmaids.com</a></p>
            <p>WhatsApp: <a href="https://wa.me/971567822225" className="text-primary underline">+971 56 782 2225</a></p>
            <p>Website: <a href="https://www.tadmaids.com" className="text-primary underline">www.tadmaids.com</a></p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;
