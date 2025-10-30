import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import HeroSection from "@/components/HeroSection";
import MatchSelection from "@/components/MatchSelection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="relative">
        <HeroSection />
        <MatchSelection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
