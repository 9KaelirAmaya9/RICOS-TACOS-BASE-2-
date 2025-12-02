import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Paintbrush, Anchor, Hammer } from "lucide-react";
import paintingImage from "@/assets/service-painting.jpg";
import boatImage from "@/assets/service-boat.jpg";
import automotiveImage from "@/assets/service-automotive.jpg";
import bodyworkImage from "@/assets/service-bodywork.jpg";

const services = [
  {
    icon: Wrench,
    title: "Automotive Repair",
    description: "Comprehensive mechanical services for all makes and models. From routine maintenance to complex repairs, we handle engine diagnostics, transmission work, brake systems, and everything in between.",
    image: automotiveImage,
    features: ["Engine Repair", "Transmission Service", "Brake Systems", "Diagnostics"]
  },
  {
    icon: Hammer,
    title: "Bodywork Services",
    description: "Expert collision repair and bodywork restoration. We handle dents, scratches, dings, and collision damage with precision craftsmanship to restore your vehicle to its original condition.",
    image: bodyworkImage,
    features: ["Dent Removal", "Scratch Repair", "Collision Repair", "Panel Replacement"]
  },
  {
    icon: Paintbrush,
    title: "Professional Car Painting",
    description: "State-of-the-art paint booth delivers showroom-quality finishes. We use premium eco-friendly paints and offer color matching, custom designs, and quality work backed by a 2-year paint warranty.",
    image: paintingImage,
    features: ["Color Matching", "Custom Designs", "Eco-Friendly Paints", "2-Year Paint Warranty"]
  },
  {
    icon: Anchor,
    title: "Boat Repair & Restoration",
    description: "Expert marine repair services for all vessel types. From hull repairs to fiberglass work, we handle everything from minor scratches to major restoration projects with quality craftsmanship.",
    image: boatImage,
    features: ["Hull Repairs", "Fiberglass Work", "Gelcoat Restoration", "Insurance Claims"]
  }
];

const Services = () => {
  return (
    <section id="services" className="relative py-24 bg-muted/30 overflow-hidden">
      {/* Texture overlay */}
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'var(--pattern-dots)', backgroundSize: '20px 20px' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-brand font-bold text-primary mb-4 tracking-wide">
            COMPREHENSIVE VEHICLE SERVICES
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
            Four essential services under one roof—military precision, transparent pricing, and excellence you can trust.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index}
              className="group hover:shadow-xl transition-all duration-300 border-border overflow-hidden relative backdrop-blur-sm"
            >
              {/* Subtle texture on card */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'var(--texture-noise)' }} />
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <service.icon className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              <CardContent className="pt-6">
                <h3 className="text-2xl font-brand font-bold text-foreground mb-3 tracking-wide">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-4 leading-relaxed font-medium">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-foreground">
                      <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
