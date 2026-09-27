import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useSEO } from "@/hooks/useSEO";

const About = () => {
  useSEO({
    title: "About Smart Digital Hub - Trusted Digital Products Store in Bangladesh",
    description: "Learn about Smart Digital Hub, Bangladesh's trusted platform for 100+ genuine digital subscriptions, AI tools, VPNs, and streaming services at affordable prices with 24/7 support.",
  });
  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <section className="container mt-8 mb-10 max-w-3xl mx-auto">
        <h1 className="font-display text-2xl md:text-3xl font-black text-center mb-6">About Us</h1>

        <div className="bg-card rounded-xl border border-border p-6 md:p-8 space-y-5 text-foreground text-[15px] leading-relaxed">
          <p>
            <strong>Smart Digital Hub</strong> is your trusted platform for accessing the world's most popular digital subscriptions and premium tools in one place. We believe that quality digital services should be <strong>affordable</strong> and easily available to everyone. That's why we provide <strong>100+ official and Genuine products</strong> at competitive prices.
          </p>

          <p>Our collection includes a wide range of software, tools, and entertainment platforms such as:</p>

          <ul className="space-y-3 list-none pl-0">
            <li>
              <strong>Design & Productivity:</strong> Canva, Freepik, AdobeStock, Autodesk, Filmora12, NitroPDF, I Love PDF, CamScanner, Astra Pro
            </li>
            <li>
              <strong>AI & Writing Tools:</strong> ChatGpt Plus, Replit Core, Perplexity AI, QuillBot, Grammarly, Trunitune, ElevenLabs, Claude AI, Gemini AI, Leonardo AI, HeyGen
            </li>
            <li>
              <strong>Security & VPNs:</strong> NordVPN, IPVanish, Surfshark, ExpressVPN, NortonVPN, PureVPN, HamaVPN, AviraPrime, AdGuard
            </li>
            <li>
              <strong>Entertainment & Streaming:</strong> Spotify, Netflix, YouTube Premium, Prime Video, Prime Music, Paramount+, Disney+, SonyLiv, Crunchyroll, HBO Max, WeTV, Mega OTT IPTV
            </li>
            <li>
              <strong>Gaming:</strong> Roblox, Steam, PlayStation Store, Xbox Game Pass, Prime Gaming
            </li>
            <li>
              <strong>Gift Cards & Payments:</strong> Google Gift Card, Apple Gift Card, Visa Card, MasterCard
            </li>
            <li>
              <strong>Software & Subscriptions:</strong> Windows 10/11, Microsoft Office, Adobe Creative Cloud Genuine Key.
            </li>
          </ul>

          <p>We are continuously expanding our offerings to ensure you always have access to the <strong>latest and most in-demand services</strong>.</p>

          <div className="bg-primary/5 rounded-lg p-5 border border-primary/10 mt-4">
            <p className="font-display font-bold text-lg mb-2">Our Mission</p>
            <p>
              To deliver <strong>fast, reliable, and affordable</strong> digital services with <strong>100% genuine products</strong> and dedicated <strong>24/7 customer support</strong>.
            </p>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
};

export default About;
