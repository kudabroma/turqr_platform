import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import TrustSection from "@/components/TrustSection";
import LeadFormSection from "@/components/LeadFormSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import VisualMenuSection from "@/components/VisualMenuSection";
import Pricing from "@/components/Pricing"
import FloatingCta from "@/components/FloatingCta";
const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Header />
      <HeroSection />
      <VisualMenuSection />
      <HowItWorks />
      <Features />
      <Pricing />
      <LeadFormSection />
      <FAQSection />
      <Footer />
      <FloatingCta />
      {/* Floating WhatsApp */}
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;