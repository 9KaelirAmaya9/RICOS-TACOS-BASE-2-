import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

// Import before/after images
import beforeCarPaint from "@/assets/before-car-paint.jpg";
import afterCarPaint from "@/assets/after-car-paint.jpg";
import beforeRedCar from "@/assets/before-red-car.jpg";
import afterRedCar from "@/assets/after-red-car.jpg";
import beforeBoatRepair from "@/assets/before-boat-repair.jpg";
import afterBoatRepair from "@/assets/after-boat-repair.jpg";
import beforeWhiteBoat from "@/assets/before-white-boat.jpg";
import afterWhiteBoat from "@/assets/after-white-boat.jpg";
import beforeCollisionSedan from "@/assets/before-collision-sedan.jpg";
import afterCollisionSedan from "@/assets/after-collision-sedan.jpg";
import beforeFrontCollision from "@/assets/before-front-collision.jpg";
import afterFrontCollision from "@/assets/after-front-collision.jpg";
import beforeBodyworkLuxury from "@/assets/before-bodywork-luxury.jpg";
import afterBodyworkLuxury from "@/assets/after-bodywork-luxury.jpg";
import beforePanelReplacement from "@/assets/before-panel-replacement.jpg";
import afterPanelReplacement from "@/assets/after-panel-replacement.jpg";

interface GalleryItem {
  id: number;
  category: "paint" | "bodywork" | "collision" | "boat";
  title: string;
  beforeImage: string;
  afterImage: string;
  description: string;
}

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    category: "paint",
    title: "Complete Paint Restoration",
    beforeImage: beforeCarPaint,
    afterImage: afterCarPaint,
    description: "Full vehicle repaint with color correction and clear coat protection. Transformed from weathered finish to showroom quality.",
  },
  {
    id: 2,
    category: "paint",
    title: "Custom Red Paint Job",
    beforeImage: beforeRedCar,
    afterImage: afterRedCar,
    description: "Custom candy red paint with metallic finish. Premium paint application with flawless finish.",
  },
  {
    id: 3,
    category: "collision",
    title: "Major Collision Repair",
    beforeImage: beforeCollisionSedan,
    afterImage: afterCollisionSedan,
    description: "Extensive collision damage repaired including frame straightening, panel replacement, and paint matching.",
  },
  {
    id: 4,
    category: "bodywork",
    title: "Dent & Scratch Removal",
    beforeImage: beforeBodyworkLuxury,
    afterImage: afterBodyworkLuxury,
    description: "Multiple dents and deep scratches expertly removed and refinished to factory specifications.",
  },
  {
    id: 5,
    category: "boat",
    title: "Hull Repair & Gelcoat",
    beforeImage: beforeBoatRepair,
    afterImage: afterBoatRepair,
    description: "Major hull damage repaired with fiberglass work and gelcoat restoration. Marine-grade finish applied.",
  },
  {
    id: 6,
    category: "boat",
    title: "Complete Boat Restoration",
    beforeImage: beforeWhiteBoat,
    afterImage: afterWhiteBoat,
    description: "Full boat restoration including hull repair, deck refinishing, and complete gelcoat application.",
  },
  {
    id: 7,
    category: "bodywork",
    title: "Panel Replacement & Paint",
    beforeImage: beforePanelReplacement,
    afterImage: afterPanelReplacement,
    description: "Damaged panels replaced with OEM parts, precision alignment, and seamless paint blend.",
  },
  {
    id: 8,
    category: "collision",
    title: "Front End Reconstruction",
    beforeImage: beforeFrontCollision,
    afterImage: afterFrontCollision,
    description: "Complete front end reconstruction after major collision. Frame repair, panel replacement, and paint.",
  },
];

const categories = [
  { id: "all", label: "All Work" },
  { id: "paint", label: "Paint Jobs" },
  { id: "bodywork", label: "Bodywork" },
  { id: "collision", label: "Collision Repair" },
  { id: "boat", label: "Boat Restoration" },
];

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [showBefore, setShowBefore] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredItems = selectedCategory === "all" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === selectedCategory);

  const openLightbox = (item: GalleryItem, index: number) => {
    setSelectedImage(item);
    setCurrentIndex(index);
    setShowBefore(true);
    setLightboxOpen(true);
  };

  const navigateImage = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + filteredItems.length) % filteredItems.length
      : (currentIndex + 1) % filteredItems.length;
    
    setCurrentIndex(newIndex);
    setSelectedImage(filteredItems[newIndex]);
    setShowBefore(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-primary to-primary/80 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'var(--pattern-hexagon)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-7xl font-brand font-bold mb-6 tracking-wide">
              OUR WORK GALLERY
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/95 font-medium">
              See the precision and excellence that defines Axonic Motorworks. Every project showcases 
              our commitment to military-grade quality and customer satisfaction.
            </p>
            <div className="flex items-center justify-center gap-4 text-white/90">
              <div className="text-center">
                <p className="text-4xl font-brand font-bold text-secondary">500+</p>
                <p className="font-semibold">Projects Completed</p>
              </div>
              <div className="h-12 w-px bg-white/30" />
              <div className="text-center">
                <p className="text-4xl font-brand font-bold text-secondary">100%</p>
                <p className="font-semibold">Customer Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Buttons */}
      <section className="py-12 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(category => (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="lg"
                className={`font-brand font-semibold tracking-wide transition-all duration-300 ${
                  selectedCategory === category.id 
                    ? "shadow-lg scale-105" 
                    : "hover:scale-105"
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, index) => (
              <Card 
                key={item.id}
                className="group cursor-pointer overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                onClick={() => openLightbox(item, index)}
              >
                <div className="relative h-64 overflow-hidden">
                  {/* Before/After Slider Effect */}
                  <div className="absolute inset-0">
                    <img 
                      src={item.afterImage} 
                      alt={`${item.title} - After`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 w-1/2 overflow-hidden border-r-4 border-white group-hover:w-full transition-all duration-500">
                    <img 
                      src={item.beforeImage} 
                      alt={`${item.title} - Before`}
                      className="w-full h-full object-cover absolute left-0"
                      style={{ width: '200%' }}
                    />
                  </div>
                  
                  {/* Labels */}
                  <div className="absolute top-4 left-4 bg-destructive text-white px-3 py-1 rounded-full text-xs font-bold">
                    BEFORE
                  </div>
                  <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                    AFTER
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute bottom-4 left-4 bg-primary text-white px-3 py-1 rounded-full text-xs font-brand font-bold tracking-wide">
                    {categories.find(c => c.id === item.category)?.label.toUpperCase()}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-brand font-bold text-foreground mb-2 tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl text-muted-foreground font-medium">
                No projects found in this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-6xl p-0 bg-black/95 border-none">
          {selectedImage && (
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Buttons */}
              <button
                onClick={() => navigateImage("prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => navigateImage("next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              {/* Image Display */}
              <div className="relative aspect-video bg-black">
                <img 
                  src={showBefore ? selectedImage.beforeImage : selectedImage.afterImage}
                  alt={selectedImage.title}
                  className="w-full h-full object-contain"
                />
                
                {/* Before/After Toggle */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-brand font-bold text-white mb-2">
                        {selectedImage.title}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {selectedImage.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowBefore(true)}
                        variant={showBefore ? "default" : "outline"}
                        size="sm"
                        className={showBefore ? "bg-destructive hover:bg-destructive/90" : "text-white border-white/30"}
                      >
                        Before
                      </Button>
                      <Button
                        onClick={() => setShowBefore(false)}
                        variant={!showBefore ? "default" : "outline"}
                        size="sm"
                        className={!showBefore ? "bg-accent hover:bg-accent/90" : "text-white border-white/30"}
                      >
                        After
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Gallery;
