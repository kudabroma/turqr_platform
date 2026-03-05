import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import TrustSection from "@/components/TrustSection";
import LeadFormSection from "@/components/LeadFormSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <HowItWorks />
      <Features />
      <TrustSection />
      <LeadFormSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
