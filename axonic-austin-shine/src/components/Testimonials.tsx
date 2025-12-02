import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star, Quote, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import customer1 from "@/assets/customer-1.jpg";
import customer2 from "@/assets/customer-2.jpg";
import customer3 from "@/assets/customer-3.jpg";
import customer4 from "@/assets/customer-4.jpg";
import beforeCarPaint from "@/assets/before-car-paint.jpg";
import afterCarPaint from "@/assets/after-car-paint.jpg";
import beforeRedCar from "@/assets/before-red-car.jpg";
import afterRedCar from "@/assets/after-red-car.jpg";
import beforeBoatRepair from "@/assets/before-boat-repair.jpg";
import afterBoatRepair from "@/assets/after-boat-repair.jpg";
import beforeBodyworkLuxury from "@/assets/before-bodywork-luxury.jpg";
import afterBodyworkLuxury from "@/assets/after-bodywork-luxury.jpg";

interface Testimonial {
  name: string;
  image: string;
  rating: 5;
  text: string;
  service: string;
  date: string;
  verified: boolean;
  beforeImage?: string;
  afterImage?: string;
  googleReview?: boolean;
}

const testimonials: Testimonial[] = [
  {
    name: "Michael Thompson",
    image: customer1,
    rating: 5,
    text: "Absolutely phenomenal service! They repainted my classic Mustang and it looks better than the day I bought it. The attention to detail is unmatched. I've taken it to three other shops before, and Axonic is the only one that truly delivered military-grade precision.",
    service: "Complete Paint Restoration",
    date: "2 weeks ago",
    verified: true,
    beforeImage: beforeCarPaint,
    afterImage: afterCarPaint,
    googleReview: true,
  },
  {
    name: "Sarah Martinez",
    image: customer2,
    rating: 5,
    text: "Outstanding service from start to finish! They handled my collision repair professionally and kept me updated throughout. The quality exceeded my expectations. Transparent pricing with absolutely no hidden fees - exactly what they promised!",
    service: "Collision Repair & Paint",
    date: "3 weeks ago",
    verified: true,
    beforeImage: beforeRedCar,
    afterImage: afterRedCar,
    googleReview: true,
  },
  {
    name: "Robert Chen",
    image: customer3,
    rating: 5,
    text: "My boat needed serious fiberglass work after a storm. The team at Axonic restored it perfectly. They really know their craft and communicated every step of the way. Being veteran-owned, they approach every job with the discipline and excellence you'd expect.",
    service: "Boat Hull Restoration",
    date: "1 month ago",
    verified: true,
    beforeImage: beforeBoatRepair,
    afterImage: afterBoatRepair,
    googleReview: true,
  },
  {
    name: "Emily Rodriguez",
    image: customer4,
    rating: 5,
    text: "Best auto body shop in Austin! They handled my insurance claim, kept me updated throughout the process, and delivered ahead of schedule. The before and after photos they provided were incredibly detailed. Will definitely return for any future needs.",
    service: "Bodywork & Detailing",
    date: "1 month ago",
    verified: true,
    beforeImage: beforeBodyworkLuxury,
    afterImage: afterBodyworkLuxury,
    googleReview: true,
  }
];

const Testimonials = () => {
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [showBefore, setShowBefore] = useState(true);

  const averageRating = testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length;
  const totalReviews = testimonials.length;

  return (
    <section className="relative py-24 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
      {/* Military-grade hexagon pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'var(--pattern-hexagon)' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header with Google Reviews Badge */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-card border border-border rounded-full shadow-md">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-secondary text-secondary" />
              <span className="font-brand font-bold text-2xl text-foreground">{averageRating.toFixed(1)}</span>
            </div>
            <div className="h-6 w-px bg-border" />
            <div className="text-left">
              <p className="font-semibold text-foreground text-sm">Google Rating</p>
              <p className="text-xs text-muted-foreground">{totalReviews} verified reviews</p>
            </div>
          </div>

          <h2 className="font-brand text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            TRUSTED BY AUSTIN DRIVERS
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Military-grade precision backed by real customer experiences. See the transformations and read authentic reviews from our satisfied clients.
          </p>

          <Button 
            variant="outline" 
            className="gap-2 font-brand tracking-wide hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => window.open('https://www.google.com/search?q=axonic+motorworks+austin', '_blank')}
          >
            View All Google Reviews
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                  <div className="p-2">
                    <Card className="border-border bg-card hover:shadow-xl transition-all duration-300 h-full group">
                      <CardContent className="p-6">
                        {/* Header with Google Badge */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex gap-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-5 h-5 fill-secondary text-secondary"
                              />
                            ))}
                          </div>
                          {testimonial.googleReview && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                              </svg>
                              <span className="font-semibold">Google</span>
                            </div>
                          )}
                        </div>

                        {/* Quote Icon */}
                        <Quote className="w-8 h-8 text-primary/20 mb-3" />

                        {/* Testimonial Text */}
                        <p className="text-foreground mb-6 leading-relaxed line-clamp-4">
                          "{testimonial.text}"
                        </p>

                        {/* Before/After Preview if available */}
                        {testimonial.beforeImage && testimonial.afterImage && (
                          <div className="mb-6">
                            <button
                              onClick={() => setSelectedTestimonial(testimonial)}
                              className="relative w-full h-40 rounded-lg overflow-hidden group/img cursor-pointer"
                            >
                              <div className="absolute inset-0 grid grid-cols-2 gap-1">
                                <div className="relative">
                                  <img 
                                    src={testimonial.beforeImage} 
                                    alt="Before" 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-2 left-2 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded text-xs font-bold">
                                    BEFORE
                                  </div>
                                </div>
                                <div className="relative">
                                  <img 
                                    src={testimonial.afterImage} 
                                    alt="After" 
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-2 right-2 bg-accent/90 text-accent-foreground px-2 py-1 rounded text-xs font-bold">
                                    AFTER
                                  </div>
                                </div>
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-brand font-bold tracking-wide">VIEW FULL SIZE</span>
                              </div>
                            </button>
                          </div>
                        )}

                        {/* Customer Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center gap-3">
                            <img
                              src={testimonial.image}
                              alt={testimonial.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                            />
                            <div>
                              <p className="font-brand font-semibold text-foreground flex items-center gap-2">
                                {testimonial.name}
                                {testimonial.verified && (
                                  <svg className="w-4 h-4 fill-accent" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                                  </svg>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {testimonial.service}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{testimonial.date}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">Ready to experience the Axonic difference?</p>
          <Button 
            size="lg"
            className="font-brand font-bold tracking-widest shadow-lg hover:shadow-xl"
            onClick={() => window.location.href = '#contact'}
          >
            GET YOUR FREE QUOTE
          </Button>
        </div>
      </div>

      {/* Before/After Lightbox Dialog */}
      <Dialog open={!!selectedTestimonial} onOpenChange={() => setSelectedTestimonial(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          {selectedTestimonial && (
            <div className="relative">
              {/* Image Container */}
              <div className="relative h-[70vh] bg-black">
                <img
                  src={showBefore ? selectedTestimonial.beforeImage : selectedTestimonial.afterImage}
                  alt={showBefore ? "Before" : "After"}
                  className="w-full h-full object-contain"
                />
                
                {/* Before/After Toggle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="pointer-events-auto">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setShowBefore(!showBefore)}
                      className="font-brand font-bold tracking-wide shadow-2xl"
                    >
                      {showBefore ? (
                        <>SHOW AFTER <ChevronRight className="ml-2 w-5 h-5" /></>
                      ) : (
                        <><ChevronLeft className="mr-2 w-5 h-5" /> SHOW BEFORE</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg font-brand font-bold">
                  {showBefore ? 'BEFORE' : 'AFTER'}
                </div>
              </div>

              {/* Customer Info Footer */}
              <div className="bg-card p-6 border-t border-border">
                <div className="flex items-start gap-4">
                  <img
                    src={selectedTestimonial.image}
                    alt={selectedTestimonial.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-brand font-bold text-lg">{selectedTestimonial.name}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{selectedTestimonial.service}</p>
                    <p className="text-foreground leading-relaxed">"{selectedTestimonial.text}"</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Testimonials;