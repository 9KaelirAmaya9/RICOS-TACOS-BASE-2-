import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const StickyBookingCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling 500px
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-6 left-6 z-40 transition-all duration-300 transform",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
      )}
    >
      <Button
        size="lg"
        variant="cta"
        className="shadow-lg hover:shadow-2xl gap-2 px-6 py-6 text-base hover:gap-3 animate-gentle-pulse hover:animate-none font-bold"
        onClick={() => navigate("/booking")}
      >
        <Calendar className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
        <span className="hidden sm:inline">Book Appointment</span>
        <span className="sm:hidden">Book Now</span>
      </Button>
    </div>
  );
};

export default StickyBookingCTA;