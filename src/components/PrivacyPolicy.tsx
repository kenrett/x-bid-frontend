import { Page } from "./Page";

export const PrivacyPolicy = () => {
  return (
    <Page>
      <div className="container mx-auto max-w-4xl ">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[color:var(--sf-primary)] to-[color:var(--sf-accent)] bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-lg text-[color:var(--sf-mutedText)]">
            Last Updated: November 13, 2025
          </p>
        </div>

        <div className="space-y-8 text-[color:var(--sf-text)] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              1. Introduction
            </h2>
            <p>
              This website is operated by X-Bid ("we", "us", or "our"). This
              privacy policy discloses our practices regarding information
              collection and usage for the website located at this domain. This
              privacy policy does not apply to any other website or service
              provided by us, our affiliates or clients, unless it appears on
              such website or service.
            </p>
            <p className="mt-2">
              By using and visiting our Website and by submitting your
              personally identifying information to us, you agree to us using
              your personally identifying information as set out in this privacy
              policy. If you do not agree to this privacy policy, you may not
              access or otherwise use the Website or service. Use of the Website
              is also governed by our{" "}
              <a
                href="/terms-and-conditions"
                className="text-[color:var(--sf-primary)] hover:underline"
              >
                Terms and Conditions
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              2. Information We Collect
            </h2>
            <p>We may collect the following types of information:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Personal Information:</strong> This includes information
                that can be used to identify you specifically, such as your
                name, email address, shipping address, and phone number, which
                you provide when you create an account, make a purchase, or
                contact support.
              </li>
              <li>
                <strong>Financial Information:</strong> When you purchase Bids
                or win an auction, we collect payment information, such as
                credit card details or other payment account information. This
                information is processed by our secure payment partners (for
                example, Stripe).
              </li>
              <li>
                <strong>Transactional Information:</strong> We collect
                information about your bidding activity, auctions won, and
                products purchased.
              </li>
              <li>
                <strong>Technical and Usage Information:</strong> We
                automatically collect non-personally identifiable information,
                such as your IP address, browser type, device type, operating
                system, and usage patterns on our website (e.g., pages visited,
                time spent on site).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              3. How We Use Your Information
            </h2>
            <p>
              We use the information we collect for several purposes, including:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>To create and manage your account.</li>
              <li>
                To process your transactions, including Bid purchases and
                auction winnings.
              </li>
              <li>To ship your won items to you.</li>
              <li>
                To provide customer support and respond to your inquiries.
              </li>
              <li>To improve and personalize your experience on X-Bid.</li>
              <li>
                To enforce our Terms and Conditions and prevent fraudulent
                activity.
              </li>
              <li>
                To send you newsletters, promotions, or other marketing
                materials (only if you have opted in).
              </li>
              <li>
                To analyze website traffic and performance to improve our
                services.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              4. How We Share Your Information
            </h2>
            <p>
              We do not sell your personal information to third parties. We may
              share your information in the following circumstances:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Service Providers:</strong> We may share information
                with third-party vendors who perform services on our behalf,
                such as payment processing, shipping, and data analysis. These
                vendors are obligated to protect your information and use it
                only for the services they provide.
              </li>
              <li>
                <strong>Legal Compliance:</strong> We may disclose your
                information if required by law, such as to comply with a
                subpoena, or in response to a valid request from a law
                enforcement or government agency.
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger,
                acquisition, or sale of all or a portion of our assets, your
                information may be transferred as part of that transaction.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              5. Cookies and Tracking Technologies
            </h2>
            <p>
              We use cookies and similar tracking technologies to track the
              activity on our Service and hold certain information. Cookies are
              files with a small amount of data which may include an anonymous
              unique identifier. You can instruct your browser to refuse all
              cookies or to indicate when a cookie is being sent. However, if
              you do not accept cookies, you may not be able to use some
              portions of our Service.
            </p>
            <p className="mt-2">
              <strong>Stripe:</strong> If you enter a checkout flow, Stripe may
              set cookies or similar identifiers for fraud prevention and
              payment processing, and load resources from Stripe domains (such
              as <span className="font-mono">js.stripe.com</span>). We do not
              intentionally load Stripe on the homepage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              6. Data Security
            </h2>
            <p>
              We take reasonable measures to protect your personal information
              from unauthorized access, use, or disclosure. We use
              industry-standard encryption for data transmission and secure
              storage solutions. However, no method of transmission over the
              Internet or method of electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              7. Your Data Protection Rights (GDPR & CCPA)
            </h2>
            <p>
              Depending on your location, you may have certain rights regarding
              your personal data.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>The right to access:</strong> You have the right to
                request copies of your personal data.
              </li>
              <li>
                <strong>The right to rectification:</strong> You have the right
                to request that we correct any information you believe is
                inaccurate or complete information you believe is incomplete.
              </li>
              <li>
                <strong>The right to erasure:</strong> You have the right to
                request that we erase your personal data, under certain
                conditions.
              </li>
              <li>
                <strong>The right to opt-out of sale:</strong> We do not sell
                personal information. Under the CCPA, you have the right to
                request that a business that sells your personal data not sell
                your personal data.
              </li>
            </ul>
            <p className="mt-2">
              If you would like to exercise any of these rights, please contact
              us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              8. Children's Privacy
            </h2>
            <p>
              Our Service does not address anyone under the age of 18
              ("Children"). We do not knowingly collect personally identifiable
              information from anyone under the age of 18. If you are a parent
              or guardian and you are aware that your Children has provided us
              with Personal Data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              9. Changes to This Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page
              and updating the "Last Updated" date at the top. You are advised
              to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              10. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, you can
              contact us:
            </p>
            <ul className="list-none mt-2 space-y-1">
              <li>By email: admin@x-bid.com</li>
              <li>By visiting a contact page on our website.</li>
            </ul>
          </section>
        </div>
      </div>
    </Page>
  );
};
