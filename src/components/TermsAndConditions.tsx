import { Page } from "./Page";

export const TermsAndConditions = () => {
  return (
    <Page>
      <div className="container mx-auto max-w-4xl ">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[color:var(--sf-primary)] to-[color:var(--sf-accent)] bg-clip-text text-transparent">
            Terms & Conditions
          </h1>
          <p className="text-lg text-[color:var(--sf-mutedText)]">
            Last Updated: November 13, 2025
          </p>
        </div>

        <div className="space-y-8 text-[color:var(--sf-text)] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              Welcome to X-Bid ("we", "us", "our", or "the Site"). By creating
              an account and using our services, you agree to be bound by these
              Terms and Conditions, our{" "}
              <a
                href="/privacy-policy"
                className="text-[color:var(--sf-primary)] hover:underline"
              >
                Privacy Policy
              </a>
              , and any other policies referenced herein. If you do not agree to
              these terms, you must not use our services. [1]
            </p>
            <p className="mt-2">
              We reserve the right to modify these terms at any time. We will
              notify you of significant changes by posting a notice on the Site.
              Your continued use of the Site after such changes constitutes your
              acceptance of the new terms. [1]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              2. Eligibility
            </h2>
            <p>
              You must be at least 18 years of age to use X-Bid's services. By
              registering, you confirm that you meet this age requirement. This
              service is intended for use within the United States. We may
              require a valid payment method to verify your identity and to
              process payments for bids and won auctions. [1]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              3. How X-Bid Works
            </h2>
            <p>
              X-Bid is an entertainment auction platform where you can bid on
              and win brand-new, factory-sealed products. The auctions are not
              traditional; they are a form of entertainment shopping.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>
                <strong>Bids:</strong> To participate in auctions, you must
                purchase "Bids". Bids are purchased in packs and are
                non-refundable. Each time you place a bid on an auction, one Bid
                is deducted from your account.
              </li>
              <li>
                <strong>Bidding Process:</strong> Each bid placed increases the
                auction price by a small increment (e.g., one cent) and resets
                the auction timer (e.g., adds 10 seconds). The auction ends when
                the timer reaches zero.
              </li>
              <li>
                <strong>Winning an Auction:</strong> The last person to place a
                bid before the timer runs out wins the auction. The winner is
                then eligible to purchase the item at the final auction price,
                plus shipping and handling fees.
              </li>
              <li>
                <strong>Auto-Bidder (The Wingman):</strong> We provide an
                automated bidding tool. You can set a number of bids and a price
                range, and the system will place bids for you. Use of this tool
                is at your own risk.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              4. 'Buy It Now' Feature
            </h2>
            <p>
              For many auctions, if you participate but do not win, you may have
              the option to purchase the item at a stated retail price, less the
              value of the Bids you placed on that specific auction. This 'Buy
              It Now' option is available for a limited time after the auction
              ends and is subject to specific terms detailed on the auction
              page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              5. Payments, Shipping, and Returns
            </h2>
            <p>
              All payments for Bid packs and won items must be made through the
              accepted payment methods on our Site. Winners must pay the final
              auction price and any applicable shipping fees within a specified
              timeframe. Failure to do so may result in forfeiture of the win.
            </p>
            <p className="mt-2">
              All items are shipped to the address provided in your account. All
              sales are final. We do not accept returns unless the item arrives
              damaged or is not as described. Any issues with a received item
              must be reported within 48 hours of delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              6. User Conduct and Termination
            </h2>
            <p>
              You agree not to use our services for any unlawful purpose or to
              engage in any activity that could harm the Site or other users.
              This includes, but is not limited to, using multiple accounts,
              using bots or scripts to bid (other than the provided
              Auto-Bidder), or interfering with the auction process. [2]
            </p>
            <p className="mt-2">
              We reserve the right to terminate or suspend your account at our
              sole discretion, without notice, for any violation of these terms
              or for any other reason we deem appropriate. [1]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              7. Intellectual Property
            </h2>
            <p>
              All content on this Site, including text, graphics, logos, and
              software, is the property of X-Bid or its licensors and is
              protected by copyright and other intellectual property laws. You
              may not copy, distribute, or create derivative works from any part
              of the Site without our prior written consent. [2]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              8. Disclaimer of Warranties
            </h2>
            <p>
              THE SITE AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE"
              WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE
              DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR
              ERROR-FREE. ALL PRODUCTS ARE SOLD WITH THE MANUFACTURER'S WARRANTY
              ONLY. [1]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              9. Limitation of Liability
            </h2>
            <p>
              IN NO EVENT SHALL X-BID, ITS DIRECTORS, OR EMPLOYEES BE LIABLE FOR
              ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES
              ARISING OUT OF YOUR USE OF THE SITE OR SERVICES, OR YOUR INABILITY
              TO USE THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE
              POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU FOR ANY
              AND ALL CLAIMS SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE
              12 MONTHS PRECEDING THE CLAIM. [1]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              10. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless X-Bid and its employees
              from any claim or demand, including reasonable attorneys' fees,
              made by any third party due to or arising out of your breach of
              these Terms and Conditions or your violation of any law or the
              rights of a third party. [1]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              11. Governing Law and Dispute Resolution
            </h2>
            <p>
              These terms shall be governed by the laws of the State of
              Delaware, without regard to its conflict of law provisions. Any
              dispute arising from these terms shall be resolved through binding
              arbitration in Wilmington, Delaware, except for matters that may
              be taken to small claims court.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[color:var(--sf-primary)] mb-4">
              12. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms and Conditions, please
              contact us at legal@x-bid.com.
            </p>
          </section>
        </div>
      </div>
    </Page>
  );
};
