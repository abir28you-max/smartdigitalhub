import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { ShieldCheck, Mail, AlertTriangle, FileText } from "lucide-react";

const DMCA = () => {
  useSEO({
    title: "DMCA & Copyright Policy - Smart Digital Hub",
    description: "Read Smart Digital Hub's DMCA copyright policy, trademark notice, and intellectual property protection terms.",
  });

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />

      <main className="container mt-8 mb-12 max-w-4xl mx-auto px-4">
        <div className="text-center space-y-2 mb-8">
          <h1 className="font-display text-2xl md:text-4xl font-black text-foreground tracking-tight">
            DMCA &amp; Copyright Policy
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Smart Digital Hub complies with international copyright laws and the Digital Millennium Copyright Act (DMCA).
          </p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 md:p-10 space-y-6 text-foreground text-[15px] leading-relaxed shadow-xs">
          <div>
            <h2 className="font-display font-bold text-lg md:text-xl mb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              1. Overview &amp; Intellectual Property
            </h2>
            <p>
              <strong>Smart Digital Hub</strong> (<a href="https://smartdigitalhub.site" className="text-primary hover:underline">smartdigitalhub.site</a>) respects the intellectual property rights of creators and copyright owners. All proprietary code, custom UI designs, graphic layouts, and original content developed for Smart Digital Hub are protected under applicable intellectual property laws.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
            <h2 className="font-display font-bold text-lg md:text-xl mb-2 flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              2. Third-Party Trademarks &amp; Fair Use Disclaimer
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              All third-party product names, logos, registered trademarks, service marks, and brand names (including but not limited to <em>ChatGPT, OpenAI, Netflix, Canva, Spotify, Microsoft, Adobe, Surfshark, Telegram</em>) mentioned on this website are the property of their respective trademark holders.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The use of these names, trademarks, and logos is strictly for <strong>identification, comparative, and descriptive purposes ("Nominative Fair Use")</strong> to accurately indicate compatibility and the nature of digital subscriptions, access assistance, or software services offered. Smart Digital Hub is an <strong>independent digital service provider and reseller</strong> and is not sponsored, endorsed, or officially affiliated with these third-party companies.
            </p>
          </div>

          <div>
            <h2 className="font-display font-bold text-lg md:text-xl mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              3. DMCA Notice &amp; Takedown Procedure
            </h2>
            <p>
              If you are a copyright or trademark owner (or authorized agent) and believe in good faith that any content, material, or reference on this website infringes upon your intellectual property rights, please send a written notification containing the following details to our designated agent:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li>A physical or electronic signature of the person authorized to act on behalf of the owner of the copyright interest.</li>
              <li>Identification of the copyrighted work or trademark claimed to have been infringed.</li>
              <li>The exact URL (link) or location on our website where the claimed infringing material is located.</li>
              <li>Your contact information, including full name, physical address, telephone number, and email address.</li>
              <li>A statement that you have a good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement, made under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf.</li>
            </ul>
          </div>

          <div className="bg-primary/5 rounded-xl p-5 md:p-6 border border-primary/20 space-y-2">
            <h3 className="font-display font-bold text-base md:text-lg flex items-center gap-2 text-primary">
              <Mail className="h-5 w-5" />
              Designated DMCA Contact Agent
            </h3>
            <p className="text-sm">
              Please send all copyright notices, trademark queries, and takedown requests directly to:
            </p>
            <p className="text-sm font-semibold text-foreground">
              Attention: Legal &amp; Copyright Support<br />
              Smart Digital Hub<br />
              Email: <a href="mailto:abir28you@gmail.com" className="text-primary hover:underline">abir28you@gmail.com</a><br />
              WhatsApp Support: <a href="https://wa.me/8801516524644" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">+8801516524644</a>
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              We respond to and address legitimate, verified infringement requests promptly within 24 to 48 business hours.
            </p>
          </div>

          <div>
            <h2 className="font-display font-bold text-lg md:text-xl mb-2">4. Counter-Notification Procedure</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If content or access has been disabled in response to a DMCA notice and you believe this was due to mistake or misidentification, a written counter-notification may be submitted pursuant to Sections 512(g)(2) and (3) of the Digital Millennium Copyright Act.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default DMCA;
