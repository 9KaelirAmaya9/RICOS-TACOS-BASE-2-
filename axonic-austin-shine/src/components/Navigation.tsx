import { Button } from "@/components/ui/button";
import { Phone, Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import logo from "@/assets/logo.png";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setIsOpen(false); // Close mobile menu when clicking a link
    
    // If we're not on the home page, navigate there first
    if (location.pathname !== "/") {
      navigate("/");
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur-md border-b border-border shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          <button 
            onClick={() => {
              navigate("/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center cursor-pointer group"
          >
            <img src={logo} alt="Axonic Motorworks - Veteran Owned - Precision Restored" className="h-28 w-auto transition-transform duration-300 group-hover:scale-105" />
          </button>

          <div className="hidden lg:flex items-center gap-6">
            <button 
              onClick={() => scrollToSection("services")} 
              className="font-brand font-semibold text-sm tracking-wide text-foreground hover:text-primary transition-colors relative group"
            >
              SERVICES
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection("about")} 
              className="font-brand font-semibold text-sm tracking-wide text-foreground hover:text-primary transition-colors relative group"
            >
              WHY CHOOSE US
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => {
                navigate("/about");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="font-brand font-semibold text-sm tracking-wide text-foreground hover:text-primary transition-colors relative group"
            >
              ABOUT
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => navigate("/gallery")}
              className="font-brand font-semibold text-sm tracking-wide text-foreground hover:text-primary transition-colors relative group"
            >
              GALLERY
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => scrollToSection("contact")} 
              className="font-brand font-semibold text-sm tracking-wide text-foreground hover:text-primary transition-colors relative group"
            >
              CONTACT
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <button 
              onClick={() => navigate("/auth")}
              className="font-brand font-semibold text-sm tracking-wide text-foreground hover:text-primary transition-colors relative group"
            >
              EMPLOYEE LOGIN
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary transition-all duration-300 group-hover:w-full"></span>
            </button>
            <Button 
              onClick={() => navigate("/booking")}
              variant="default"
              size="lg"
              className="font-brand font-bold text-sm tracking-widest shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 px-6"
            >
              BOOK NOW
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button className="gap-2 hidden sm:flex" onClick={() => window.location.href = 'tel:2108231595'}>
              <Phone className="w-4 h-4" />
              <span>210-823-1595</span>
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col gap-6 mt-8">
                  <button 
                    onClick={() => scrollToSection("services")} 
                    className="text-lg font-brand font-semibold tracking-wide text-foreground hover:text-primary transition-colors text-left"
                  >
                    SERVICES
                  </button>
                  <button 
                    onClick={() => scrollToSection("about")} 
                    className="text-lg font-brand font-semibold tracking-wide text-foreground hover:text-primary transition-colors text-left"
                  >
                    WHY CHOOSE US
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/about");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-lg font-brand font-semibold tracking-wide text-foreground hover:text-primary transition-colors text-left"
                  >
                    ABOUT
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/gallery");
                    }}
                    className="text-lg font-brand font-semibold tracking-wide text-foreground hover:text-primary transition-colors text-left"
                  >
                    GALLERY
                  </button>
                  <button 
                    onClick={() => scrollToSection("contact")} 
                    className="text-lg font-brand font-semibold tracking-wide text-foreground hover:text-primary transition-colors text-left"
                  >
                    CONTACT
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/auth");
                    }}
                    className="text-lg font-brand font-semibold tracking-wide text-foreground hover:text-primary transition-colors text-left"
                  >
                    EMPLOYEE LOGIN
                  </button>
                  <Button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/booking");
                    }}
                    className="w-full font-brand font-bold tracking-widest"
                  >
                    BOOK NOW
                  </Button>
                  <Button className="gap-2 w-full" onClick={() => window.location.href = 'tel:2108231595'}>
                    <Phone className="w-4 h-4" />
                    210-823-1595
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
