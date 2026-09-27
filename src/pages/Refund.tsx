import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useSEO } from "@/hooks/useSEO";

const Refund = () => {
  useSEO({
    title: "Refund Policy - Smart Digital Hub",
    description: "Understand Smart Digital Hub's refund policy for digital products. Get instant refunds for undelivered or non-working products. Contact our support for quick resolution.",
  });
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <section className="container mt-8 mb-10 max-w-3xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-black text-center mb-6">Refund Policy</h1>

        <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-5 text-foreground text-[15px] leading-relaxed">
          <p>
            At <strong>Smart Digital Hub</strong>, we place the highest priority on customer satisfaction. We always strive to deliver <strong>100% effective and quality digital products</strong>. Below is our refund policy in detail.
          </p>

          <div>
            <p className="font-display font-bold text-lg mb-2">Incorrect or Unintentional Payment</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>If a customer makes a payment by mistake, we will issue a refund <strong>immediately</strong>.</li>
              <li>In this case, please contact our support team immediately: <a href="https://wa.me/8801516524644" target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">+8801516524644</a></li>
            </ul>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Product Delivery Issues</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Product access or login information will be sent via email within <strong>2 to 5 minutes</strong> or 30 minutes to a maximum of 24 hours after payment is completed.</li>
              <li>If you do not receive access within the specified time, or the product does not work or does not match the description, you are eligible for a <strong>full refund</strong>.</li>
            </ul>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Cases Where Refunds Will Not Be Issued</p>
            <p className="mb-2">No refunds will be issued in the following situations:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The product has been successfully delivered and is working properly.</li>
              <li>The customer has changed their mind or does not want to take it anymore after receiving the product.</li>
              <li>The product has been shared, modified, or misused by the customer after delivery.</li>
            </ul>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Refund Process</p>
            <p>Refunds are processed <strong>instantly</strong> after verification.</p>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">How to Request a Refund</p>
            <p>For a refund request, please contact us at: <a href="https://wa.me/8801516524644" target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">+8801516524644</a></p>
            <p>Or email us at: <strong>abir28you@gmail.com</strong></p>
            <p className="mt-2">Please include the following information in your message:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your name and the email address used at the time of purchase</li>
              <li>Payment receipt or transaction ID</li>
              <li>A brief description of the issue</li>
            </ul>
            <p className="mt-2">Our team will review and respond to your request as soon as possible.</p>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Policy Changes</p>
            <p>
              Smart Digital Hub may change or update this Refund Policy at any time as necessary. The latest version will always be published on this page.
            </p>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default Refund;
