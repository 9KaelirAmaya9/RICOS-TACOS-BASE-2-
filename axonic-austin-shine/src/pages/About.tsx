import Navigation from "@/components/Navigation";
import About from "@/components/About";
import ProcessTimeline from "@/components/ProcessTimeline";
import Footer from "@/components/Footer";
import StickyBookingCTA from "@/components/StickyBookingCTA";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <About />
      <ProcessTimeline />
      <Footer />
      <StickyBookingCTA />
    </div>
  );
};

export default AboutPage;
