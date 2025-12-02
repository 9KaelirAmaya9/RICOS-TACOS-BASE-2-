import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4 bg-background rounded-lg p-3 w-fit">
              <img src={logo} alt="Axonic Motorworks - Veteran Owned - Precision Restored" className="h-16 w-auto" />
            </div>
            <p className="text-background/70 text-sm mb-2">
              Austin's premier full-service vehicle center. Quality you can trust, service you can count on.
            </p>
            <p className="text-background/90 text-sm font-semibold">
              🇺🇸 Proudly Veteran Owned & Operated
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Services</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>Auto Painting</li>
              <li>Automotive Repair</li>
              <li>Bodywork Services</li>
              <li>Boat Repair</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About Us</button></li>
              <li><button onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>Our Services</button></li>
              <li><button onClick={() => navigate('/gallery')} className="hover:text-background transition-colors">Gallery</button></li>
              <li><button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>15600 Marsha Street</li>
              <li>Building 1 Unit 1A</li>
              <li>Austin, TX</li>
              <li className="pt-2"><a href="tel:2108231595" className="hover:text-background transition-colors">210-823-1595</a></li>
              <li>sales@axonicmoto.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/70">
            <p>&copy; 2024 Axonic Motorworks. All rights reserved.</p>
            <div className="flex gap-6">
              <button className="hover:text-background transition-colors">Privacy Policy</button>
              <button className="hover:text-background transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
