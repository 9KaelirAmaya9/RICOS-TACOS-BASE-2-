import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const Contact = () => {
  return (
    <section id="contact" className="relative py-24 bg-muted/30 overflow-hidden">
      {/* Subtle texture */}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'var(--texture-noise)' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get Started Today
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Schedule your appointment or request a free quote. Our team is ready to help with all your vehicle needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="border-border">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-6">Contact Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Address</p>
                    <p className="text-muted-foreground">
                      15600 Marsha Street<br />
                      Building 1 Unit 1A<br />
                      Austin, TX
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Phone</p>
                    <a href="tel:2108231595" className="text-muted-foreground hover:text-primary transition-colors">210-823-1595</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <p className="text-muted-foreground">sales@axonicmoto.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Hours</p>
                    <p className="text-muted-foreground">
                      Monday - Friday: 8:00 AM - 6:00 PM<br />
                      Saturday: 9:00 AM - 4:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-primary text-primary-foreground">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">Request a Quote</h3>
              
              <div className="space-y-4 mb-6">
                <p className="text-primary-foreground/90 leading-relaxed">
                  Ready to experience the Axonic difference? Whether you need automotive repair, professional painting, 
                  or boat restoration, our team is here to provide expert service with affordable, transparent pricing.
                </p>
                <ul className="space-y-2 text-primary-foreground/90">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                    Free estimates on all services
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                    Insurance claim assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                    Flexible scheduling options
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
                    Same-day response guaranteed
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  size="lg" 
                  variant="cta"
                  className="w-full text-lg font-bold"
                  onClick={() => window.location.href = 'tel:2108231595'}
                >
                  Call Now: 210-823-1595
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full text-lg bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground hover:text-primary font-bold"
                  onClick={() => window.location.href = 'mailto:sales@axonicmoto.com'}
                >
                  Email Us
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Contact;
