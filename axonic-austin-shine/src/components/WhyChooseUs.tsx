import { Shield, DollarSign, Leaf, Clock } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Licensed & Insured",
    description: "Fully licensed, bonded, and insured with comprehensive liability coverage for complete peace of mind and protection."
  },
  {
    icon: DollarSign,
    title: "Affordable Quality",
    description: "Premium automotive and marine services at competitive Austin prices. Get expert repairs without breaking the bank."
  },
  {
    icon: Leaf,
    title: "Eco-Friendly Practices",
    description: "We use water-based paints, proper waste disposal, and sustainable practices to protect our Austin environment."
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description: "Efficient service without compromising quality. Most jobs completed within 3-5 business days to get you back on the road."
  }
];

const WhyChooseUs = () => {
  return (
    <section id="about" className="relative py-24 bg-background overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-muted/30 to-transparent" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose Axonic Motorworks?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Austin's trusted full-service automotive and marine repair center delivering quality, affordability, and expert care.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary/5 rounded-2xl p-8 md:p-12 border border-primary/10 relative overflow-hidden backdrop-blur-sm">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'var(--pattern-grid)', backgroundSize: '30px 30px' }} />
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              The Axonic Difference
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Experience affordable excellence at Austin's premier automotive and marine service center. From complete collision repair and professional paint services to engine diagnostics and boat restoration, we deliver expert craftsmanship that fits your budget. Our comprehensive approach saves you time and money—no need to coordinate multiple shops when one trusted team handles all your vehicle needs with transparent pricing and quality results.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold text-primary">
              <span className="bg-primary/10 px-4 py-2 rounded-full">Affordable Quality</span>
              <span className="bg-primary/10 px-4 py-2 rounded-full">Veteran Owned</span>
              <span className="bg-primary/10 px-4 py-2 rounded-full">20+ Years Experience</span>
              <span className="bg-primary/10 px-4 py-2 rounded-full">Insurance Approved</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
