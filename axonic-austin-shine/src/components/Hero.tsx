import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Award, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-shop.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const scrollToContact = () => {
    const element = document.getElementById("contact");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-32">
      {/* Military-grade background with precision overlay - Extended coverage with parallax */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none transition-transform duration-100 ease-out"
        style={{
          backgroundImage: `var(--gradient-overlay), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      />
      
      {/* Extended blue overlay to eliminate white space */}
      <div 
        className="absolute inset-0 bg-primary/60 z-0 pointer-events-none" 
      />
      
      {/* Hexagon pattern overlay for tech aesthetic */}
      <div 
        className="absolute inset-0 opacity-20 z-0 pointer-events-none" 
        style={{ backgroundImage: 'var(--pattern-hexagon)' }} 
      />
      
      {/* Carbon fiber texture */}
      <div 
        className="absolute inset-0 opacity-10 z-0 pointer-events-none" 
        style={{ backgroundImage: 'var(--texture-carbon)' }} 
      />
      
      {/* Decorative precision elements */}
      <div className="absolute top-32 right-10 w-96 h-96 border border-secondary/30 rounded-full blur-3xl z-0 pointer-events-none animate-pulse" 
           style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-32 left-10 w-80 h-80 border border-accent/20 rounded-full blur-3xl z-0 pointer-events-none animate-pulse" 
           style={{ animationDuration: '5s' }} />
      
      <div className="container mx-auto px-4 z-10 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Veteran badge with military precision */}
          <div className="inline-flex items-center gap-3 bg-secondary/10 backdrop-blur-md text-secondary px-6 py-3 rounded-full text-sm font-brand font-bold mb-6 border-2 border-secondary/30 shadow-gold animate-fade-in">
            <Shield className="w-5 h-5" />
            <span className="tracking-wider">VETERAN OWNED & OPERATED</span>
          </div>
          
          {/* Main headline - Precision Restored */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-brand font-bold text-white mb-6 leading-tight tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <span className="block text-secondary">PRECISION</span>
            <span className="block text-white mt-2">RESTORED</span>
          </h1>
          
          {/* Value proposition - No Bull Pricing & Affordability */}
          <div className="bg-gradient-to-r from-secondary/20 via-secondary/30 to-secondary/20 backdrop-blur-sm border-2 border-secondary/50 rounded-xl p-8 mb-6 animate-fade-in shadow-2xl" style={{ animationDelay: '0.2s' }}>
            <p className="text-2xl md:text-4xl text-white font-bold text-center tracking-wide mb-4">
              <span className="text-secondary">Honest Repairs.</span> Elite Results. <span className="text-secondary">Fair Pricing.</span>
            </p>
            <p className="text-xl md:text-2xl text-white/95 text-center leading-relaxed max-w-3xl mx-auto font-semibold mb-2">
              You deserve a shop that respects your wallet and your vehicle.
            </p>
            <p className="text-xl md:text-2xl text-white/95 text-center leading-relaxed max-w-3xl mx-auto font-semibold">
              We deliver dealership-level quality—without the games.
            </p>
          </div>
          
          {/* Trust indicators - Enhanced visibility */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <Award className="w-6 h-6 text-secondary" />
              <span className="font-extrabold text-lg">Transparent Pricing</span>
            </div>
            <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <Target className="w-6 h-6 text-accent" />
              <span className="font-extrabold text-lg">No Hidden Fees</span>
            </div>
            <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <Shield className="w-6 h-6 text-secondary" />
              <span className="font-extrabold text-lg">Quality Guaranteed</span>
            </div>
          </div>
          
          {/* CTA buttons - Prominent and action-oriented */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in relative z-20" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              variant="cta"
              className="text-xl px-12 py-8 font-brand font-extrabold tracking-wider gap-3 group transition-all duration-300 hover:gap-5 relative overflow-hidden"
              onClick={() => navigate("/booking")}
            >
              <span className="relative z-10">SCHEDULE APPOINTMENT</span>
              <ArrowRight className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-300 relative z-10" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-xl px-12 py-8 font-brand font-extrabold tracking-wider bg-white/15 backdrop-blur-md text-white border-3 border-white/40 hover:bg-white hover:text-primary shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300"
              onClick={() => {
                const element = document.getElementById("services");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              EXPLORE SERVICES
            </Button>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default Hero;