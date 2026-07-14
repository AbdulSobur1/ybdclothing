import { FileText } from "lucide-react";

/**
 * Terms & Refund Policy page.
 *
 * ⚠️ IMPORTANT: This is a placeholder policy. The store owner MUST review
 *    and finalize the actual wording before going live. This content is
 *    provided as a starting template only and may not be legally binding
 *    or compliant with Nigerian consumer law.
 */
export default function TermsPage() {
  return (
    <div className="flex-1 bg-[#F2EDE1]">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back link */}
      <a
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#8A9283] hover:text-[#4A6B6D] mb-6 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Home
      </a>

      <div className="flex items-center gap-3 mb-8">
          <FileText className="h-6 w-6 text-[#4A6B6D]" />
          <h1
            className="text-3xl font-bold text-[#2C2C2C]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Terms & Refund Policy
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 border border-[#E0D8C8] space-y-6 text-sm leading-relaxed">
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-amber-800 font-medium">
              ⚠️ This is a placeholder policy. Please review and finalize with your legal advisor before launch.
            </p>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              1. General
            </h2>
            <p className="text-[#5A5A4A]">
              By placing an order on YBD Clothing, you agree to the following terms and conditions.
              These terms govern the sale of products through our website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              2. Orders & Payment
            </h2>
            <p className="text-[#5A5A4A]">
              All orders are processed in the order they are received. Payment is via bank transfer
              to the account provided at checkout. Your order will be marked as &ldquo;Pending Verification&rdquo;
              until payment is confirmed. We reserve the right to cancel any order if payment is not
              received within 48 hours.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              3. Delivery
            </h2>
            <p className="text-[#5A5A4A]">
              Delivery fees are calculated based on the delivery zone selected at checkout.
              Delivery times vary by location. YBD Clothing is not responsible for delays
              caused by third-party logistics providers or circumstances beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              4. Refund & Exchange Policy
            </h2>
            <p className="text-[#5A5A4A]">
              We want you to love your purchase. If you are not satisfied, you may request a
              refund or exchange within 7 days of receiving your order, subject to the following conditions:
            </p>
            <ul className="list-disc pl-5 mt-2 text-[#5A5A4A] space-y-1">
              <li>Items must be unworn, unwashed, and in original condition with tags attached.</li>
              <li>Customers are responsible for return shipping costs unless the item is defective.</li>
              <li>Refunds will be processed within 5-7 business days after we receive and inspect the returned item.</li>
              <li>Refunds are issued to the original bank account used for payment.</li>
              <li>Custom or personalized items are non-refundable unless defective.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              5. Product Availability
            </h2>
            <p className="text-[#5A5A4A]">
              All products are subject to availability. If a product is out of stock after your
              order is placed, we will notify you and offer a refund or alternative.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              6. Contact
            </h2>
            <p className="text-[#5A5A4A]">
              For any questions regarding these terms, please contact us via WhatsApp or email.
            </p>
          </section>

          <p className="text-xs text-[#B8B2A3] pt-4 border-t border-[#E0D8C8]">
            Last updated: {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}
