import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useSEO } from "@/hooks/useSEO";

const Privacy = () => {
  useSEO({
    title: "Privacy Policy - Smart Digital Hub",
    description: "Read Smart Digital Hub's privacy policy to understand how we collect, use, and protect your personal data when you purchase digital products and subscriptions.",
  });
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <section className="container mt-8 mb-10 max-w-3xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-black text-center mb-6">Privacy Policy</h1>

        <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-5 text-foreground text-[15px] leading-relaxed">
          <p>
            At <strong>Smart Digital Hub</strong>, we respect and protect your privacy. We only collect and use your information to process orders, deliver digital access, and provide customer support.
          </p>

          <div>
            <p className="font-display font-bold text-lg mb-2">Information We Collect</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, email, and payment details (for transaction purposes only).</li>
              <li>Basic browser and device data for security and analytics.</li>
            </ul>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">How We Use Your Information</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To send digital product access and updates.</li>
              <li>To provide support and improve our services.</li>
              <li>To send promotional emails (only with your consent; you can unsubscribe anytime).</li>
            </ul>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Data Protection</p>
            <p>
              We use <strong>SSL encryption</strong> and <strong>secure servers</strong> to keep your data safe. Your personal information is never sold or shared without your permission.
            </p>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Cookies</p>
            <p>
              We use cookies to enhance your browsing experience. You can disable cookies in your browser settings if you prefer.
            </p>
          </div>

          <div>
            <p className="font-display font-bold text-lg mb-2">Your Rights</p>
            <p>
              You may request to view, correct, or delete your personal data at any time.
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

export default Privacy;
