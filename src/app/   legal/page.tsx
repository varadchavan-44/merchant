export const metadata = {
  title: "Terms & Policy — MerchNguys",
};

export default function PolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-16 lg:py-24">
      <h1 className="font-display font-medium text-3xl mb-2">Terms &amp; Policy</h1>
      <p className="text-sm text-ink-muted mb-10">Last updated {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>

      <div className="space-y-6 text-sm leading-relaxed text-ink-muted">
        <p>
          MerchNguys is a student-run campus merchandise store. By placing an order through this
          site, you agree to the terms below.
        </p>

        <div>
          <h2 className="text-ink font-medium mb-1.5">Orders &amp; payment</h2>
          <p>
            Orders are confirmed only after payment is verified against the UTR/reference number and
            proof of payment you provide. Submitting false, incomplete, or unverifiable payment
            information may result in your order being cancelled without notice.
          </p>
        </div>

        <div>
          <h2 className="text-ink font-medium mb-1.5">Product availability</h2>
          <p>
            Products are produced only if minimum quantity thresholds are met by the campaign
            deadline. If a size or product doesn&apos;t meet its threshold, that order may be
            cancelled and refunded at our discretion.
          </p>
        </div>

        <div>
          <h2 className="text-ink font-medium mb-1.5">Limitation of liability</h2>
          <p>
            MerchNguys and its organizers are not liable for indirect, incidental, or consequential
            damages arising from the use of this site or any product ordered through it, to the
            fullest extent permitted by law. We are not responsible for delays, print defects
            outside our reasonable control, or issues arising from incorrect information provided at
            checkout.
          </p>
        </div>

        <div>
          <h2 className="text-ink font-medium mb-1.5">Disputes &amp; final authority</h2>
          <p>
            All decisions relating to orders, refunds, cancellations, disputes, or eligibility to
            use this site rest solely with MerchNguys, and our decision on any such matter is final.
          </p>
        </div>

        <div>
          <h2 className="text-ink font-medium mb-1.5">Changes to these terms</h2>
          <p>
            We may update this policy at any time without prior notice. Continued use of this site
            after changes are posted constitutes acceptance of the updated terms.
          </p>
        </div>

        <div>
          <h2 className="text-ink font-medium mb-1.5">Contact</h2>
          <p>
            For any questions, order issues, or concerns, reach us at{" "}
            <a href="mailto:merchnguys@gmail.com" className="underline hover:text-ink transition-colors duration-150">
              merchnguys@gmail.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
