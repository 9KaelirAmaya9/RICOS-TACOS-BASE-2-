import { Shield, Award, Zap, FileCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
  const differentiators = [
    {
      icon: Zap,
      title: "Modern Facility",
      description: "Digital diagnostics, paint-matching, and ADAS calibration in-house for precision results.",
    },
    {
      icon: Users,
      title: "Transparent Communication",
      description: "You see what we see — no surprises, no hidden costs. Clear pricing, honest service.",
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Rigorous inspection process ensures every repair meets our exacting standards before delivery.",
    },
  ];

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            <span>Veteran Owned & Operated • About Axonic Motorworks</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Precision Meets Integrity
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Axonic Motorworks delivers affordable collision repair, professional painting, 
            and comprehensive automotive services — combining advanced diagnostics with expert craftsmanship 
            and transparent pricing for Austin drivers.
          </p>
        </div>

        {/* Story */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-card rounded-2xl p-8 md:p-12 shadow-[var(--shadow-card)] border border-border">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              The Axonic Story
            </h3>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                At Axonic Motorworks, we believe that collision repair should feel seamless — not stressful. 
                Born from the idea that technology and transparency can transform the auto-repair experience, 
                we've redefined what it means to bring a vehicle back to life with affordable, expert service.
              </p>
              <p>
                Our experienced team combines OEM-grade repair methods and precision craftsmanship to restore every 
                vehicle to its true form. Whether it's collision damage, a classic restoration, or a daily driver 
                that deserves better, we treat every car as if it were our own — with meticulous attention to safety, 
                detail, and finish. Paint services come with a 2-year warranty, and we're always transparent about 
                warranties on specific jobs and repairs.
              </p>
            </div>
          </div>
        </div>

        {/* Differentiators */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">
            The Axonic Standard
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {differentiators.map((item, index) => (
              <div
                key={index}
                className="bg-card p-6 rounded-xl border border-border hover:shadow-[var(--shadow-card)] transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-primary-foreground shadow-[var(--shadow-button)]">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Get a Free Digital Estimate Today
          </h3>
          <p className="text-lg mb-8 opacity-95">
            Experience the Axonic standard — precision repairs, stress-free process.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => window.location.href = '/booking'}
            >
              Request Estimate
            </Button>
            <a 
              href="tel:2108231595" 
              className="text-primary-foreground hover:opacity-80 transition-opacity font-medium"
            >
              or call (210) 823-1595
            </a>
          </div>
          <p className="mt-8 text-sm opacity-90">
            Stop by our facility in North Austin for a same-day inspection and complimentary consultation.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;