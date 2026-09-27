import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useSEO } from "@/hooks/useSEO";

const Terms = () => {
  useSEO({
    title: "Terms & Conditions - Smart Digital Hub",
    description: "Review Smart Digital Hub's terms and conditions covering payments, product delivery, refund eligibility, and usage rules for all digital subscriptions and services.",
  });
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <section className="container mt-8 mb-10 max-w-3xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-black text-center mb-6">Terms and Conditions</h1>

        <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-5 text-foreground text-[15px] leading-relaxed">
          <p>
            <strong>Smart Digital Hub</strong> is a digital product sales platform. By using our site or purchasing any product, you agree to the following terms and conditions.
          </p>

          <div>
            <p className="font-display font-bold text-lg mb-2">Payment & Order</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All payments are processed through our <strong>secure payment gateway</strong>.</li>
              <li>If a customer makes a mistake in payment, we provide an <strong>immediate refund</strong>.</li>
            </ul>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Product Delivery</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Product access or login information is sent via email within <strong>2 to 5 minutes</strong> or 30 minutes to a maximum of an hour after payment is completed.</li>
              <li>If the customer requests a refund before the product is delivered, we provide an <strong>immediate refund</strong>.</li>
            </ul>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Refund Policy</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>If the product does not work after delivery and the customer does not want to accept it, we provide an <strong>instant refund</strong>.</li>
              <li>If there is no problem with the product and the customer simply changes his mind, <strong>no refund</strong> is provided.</li>
              <li>To request a refund, please contact our support team with proof: <strong>abir28you@gmail.com</strong></li>
            </ul>
            <p className="mt-2">
              WhatsApp: <a href="https://wa.me/8801516524644" target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">+8801516524644</a>
            </p>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Terms of Use</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Customers may not change or share the access information (email, username, password) they have received.</li>
              <li>If any misuse or unauthorized sharing is detected, <strong>access will be revoked</strong>.</li>
            </ul>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Disclaimer</p>
            <p>
              <strong>Smart Digital Hub</strong> is committed to providing the highest quality service, but Smart Digital Hub will not be liable for any losses caused by third-party technical problems or user errors.
            </p>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Changes</p>
            <p>
              Smart Digital Hub reserves the right to amend or update these Terms at any time. The latest version will always be published on our website.
            </p>
          </div>

          <div className="bg-primary/5 rounded-lg p-5 border border-primary/10 mt-4 space-y-1">
            <p className="font-display font-bold text-lg mb-2">Contact</p>
            <p>Email: <strong>abir28you@gmail.com</strong></p>
            <p>
              WhatsApp: <a href="https://wa.me/8801516524644" target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">+8801516524644</a>
            </p>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default Terms;
