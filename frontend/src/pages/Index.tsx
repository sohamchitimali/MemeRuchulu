import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import TemplateGallery from "@/components/TemplateGallery";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <TemplateGallery />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
