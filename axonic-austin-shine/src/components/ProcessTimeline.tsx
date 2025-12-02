import { CheckCircle2, ClipboardCheck, Wrench, Sparkles, Car } from "lucide-react";

const ProcessTimeline = () => {
  const steps = [
    {
      icon: ClipboardCheck,
      title: "1. Schedule Consultation",
      description: "Book your appointment online or call us. We'll discuss your needs and provide a free estimate."
    },
    {
      icon: Wrench,
      title: "2. Expert Assessment",
      description: "Our experienced team thoroughly inspects your vehicle and creates a detailed service plan."
    },
    {
      icon: Sparkles,
      title: "3. Professional Service",
      description: "We use premium materials and state-of-the-art equipment to deliver exceptional results."
    },
    {
      icon: CheckCircle2,
      title: "4. Quality Check",
      description: "Rigorous inspection ensures every detail meets our high standards before delivery."
    },
    {
      icon: Car,
      title: "5. Enjoy Your Ride",
      description: "Drive away with confidence, backed by our satisfaction guarantee. Paint work includes 2-year warranty."
    }
  ];

  return (
    <section id="process" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Process
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From consultation to completion, we make it simple and transparent
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-border" />

            <div className="space-y-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;

                return (
                  <div
                    key={index}
                    className={cn(
                      "relative flex items-center gap-8",
                      isEven ? "md:flex-row" : "md:flex-row-reverse"
                    )}
                  >
                    {/* Content */}
                    <div className={cn(
                      "flex-1",
                      isEven ? "md:text-right" : "md:text-left",
                      "text-left"
                    )}>
                      <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          {step.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-primary items-center justify-center shadow-lg z-10">
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>

                    {/* Mobile icon */}
                    <div className="md:hidden flex w-12 h-12 rounded-full bg-primary items-center justify-center shadow-lg flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>

                    {/* Spacer for even spacing */}
                    <div className="hidden md:block flex-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

export default ProcessTimeline;