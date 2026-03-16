import { useEffect } from "react";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | TADMAIDS";
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-lg text-muted-foreground mb-2">TADMAIDS Domestic Workers Services Center LLC</p>
      <p className="text-sm text-muted-foreground mb-10">Last Updated: March 2026</p>

      <div className="space-y-8 text-foreground">
        <section>
          <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
          <p className="mb-2">TADMAIDS Domestic Workers Services Center LLC ("TADMAIDS", "we", "our", or "us") respects your privacy and is committed to protecting your personal information.</p>
          <p className="mb-2">This Privacy Policy explains how we collect, use, store, and protect your information when you interact with our services, including:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Our websites</li>
            <li>Online forms and applications</li>
            <li>WhatsApp communication</li>
            <li>In-person services at our center</li>
            <li>Domestic worker recruitment and visa processing services</li>
          </ul>
          <p className="mt-2">By using our services, you agree to the practices described in this Privacy Policy.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">2. Information We Collect</h2>
          <p className="mb-2">We may collect the following types of information.</p>

          <h3 className="text-xl font-medium mt-4 mb-2">Personal Information</h3>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Full name</li>
            <li>Phone number</li>
            <li>Email address</li>
            <li>Emirates ID details</li>
            <li>Passport information</li>
            <li>Nationality</li>
            <li>Address</li>
            <li>Family information required for visa processing</li>
          </ul>

          <h3 className="text-xl font-medium mt-4 mb-2">Worker Information</h3>
          <p className="mb-2">For domestic worker recruitment or visa services, we may collect:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Passport copies</li>
            <li>Identification information</li>
            <li>Medical information required for visa processing</li>
            <li>Employment history</li>
            <li>Training records</li>
          </ul>

          <h3 className="text-xl font-medium mt-4 mb-2">Payment Information</h3>
          <p className="mb-2">When a payment is made for services, we may collect limited information such as:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Invoice records</li>
            <li>Payment confirmation numbers</li>
            <li>Bank transfer confirmation</li>
            <li>Installment provider confirmations (such as Tabby or similar services)</li>
          </ul>
          <p className="mt-2">TADMAIDS does not store, process, or retain full payment card details such as credit card numbers, CVV codes, or card expiration dates.</p>
          <p className="mt-2">All electronic payments are processed securely through licensed third-party payment providers, and any card information entered is handled directly by those providers in accordance with their security standards.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">3. How We Use Your Information</h2>
          <p className="mb-2">Your information is used for legitimate business purposes including:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Processing domestic worker recruitment requests</li>
            <li>Processing UAE residency and visa applications</li>
            <li>Preparing required government documentation</li>
            <li>Communicating service updates</li>
            <li>Providing customer support</li>
            <li>Maintaining internal business records</li>
            <li>Legal and regulatory compliance</li>
          </ul>
          <p className="mt-3 mb-2">We may also use your contact information to send:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Service updates</li>
            <li>Important notices regarding your application or service</li>
            <li>Promotional offers related to TADMAIDS services</li>
          </ul>
          <p className="mt-2">You may opt out of marketing communications at any time.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">4. Sharing of Information</h2>
          <p className="mb-2">We may share information only when necessary with:</p>

          <h3 className="text-xl font-medium mt-4 mb-2">Government Authorities</h3>
          <p className="mb-2">Including but not limited to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>UAE Ministry of Human Resources & Emiratisation (MOHRE)</li>
            <li>Immigration authorities</li>
            <li>Visa processing centers</li>
            <li>Medical testing centers</li>
            <li>Insurance providers</li>
          </ul>

          <h3 className="text-xl font-medium mt-4 mb-2">Service Partners</h3>
          <p className="mb-2">Such as:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Domestic worker recruitment agencies</li>
            <li>Medical clinics</li>
            <li>Insurance providers</li>
            <li>Government typing centers</li>
            <li>Payment service providers</li>
          </ul>
          <p className="mt-2">All partners are expected to handle personal information responsibly and only for service delivery purposes.</p>
          <p className="mt-2 font-medium">TADMAIDS does not sell or rent personal data to third parties.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">5. Data Security</h2>
          <p className="mb-2">TADMAIDS takes reasonable administrative and technical measures to protect personal information including:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Restricted employee access to sensitive data</li>
            <li>Secure internal systems</li>
            <li>Controlled document storage</li>
            <li>Secure digital communication channels where applicable</li>
          </ul>
          <p className="mt-2">While we implement strong safeguards, no system can guarantee absolute security.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">6. Data Retention</h2>
          <p className="mb-2">We retain personal information only for as long as necessary to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Deliver the requested services</li>
            <li>Maintain official business records</li>
            <li>Comply with UAE legal and regulatory requirements</li>
          </ul>
          <p className="mt-2">Visa-related records may be retained for the duration required by UAE authorities.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">7. Cookies and Website Data</h2>
          <p className="mb-2">Our website may use cookies or analytics tools to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Improve website performance</li>
            <li>Understand visitor behavior</li>
            <li>Optimize marketing campaigns</li>
          </ul>
          <p className="mt-2">You may disable cookies in your browser settings if you prefer.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">8. Your Rights</h2>
          <p className="mb-2">You may request to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of information where legally permissible</li>
          </ul>
          <p className="mt-2">Some information may need to be retained to comply with UAE regulatory requirements.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">9. Third-Party Links</h2>
          <p className="mb-2">Our website may contain links to external websites.</p>
          <p>TADMAIDS is not responsible for the privacy practices or content of those third-party websites.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">10. Changes to This Policy</h2>
          <p className="mb-2">TADMAIDS may update this Privacy Policy from time to time to reflect:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Changes in legal requirements</li>
            <li>Updates to our services</li>
            <li>Improvements in data protection practices</li>
          </ul>
          <p className="mt-2">Any updates will be published on our website.</p>
        </section>

        <hr className="border-border" />

        <section>
          <h2 className="text-2xl font-semibold mb-3">11. Contact Information</h2>
          <p className="mb-2">For privacy inquiries please contact:</p>
          <div className="mt-3 p-4 bg-muted rounded-lg">
            <p className="font-medium">TADMAIDS Domestic Workers Services Center LLC</p>
            <p>Retail 1, Croesus Building</p>
            <p>Majan, Wadi Al Safa 3</p>
            <p>Dubai, United Arab Emirates</p>
            <p className="mt-2">Email: tadbeer@tadmaids.com</p>
            <p>Phone: +971 567822225</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
