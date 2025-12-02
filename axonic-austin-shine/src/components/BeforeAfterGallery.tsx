import { useState } from "react";
import { Card } from "@/components/ui/card";
import beforeRedCar from "@/assets/before-red-car.jpg";
import afterRedCar from "@/assets/after-red-car.jpg";
import beforeWhiteBoat from "@/assets/before-white-boat.jpg";
import afterWhiteBoat from "@/assets/after-white-boat.jpg";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  title: string;
}

const BeforeAfterSlider = ({ beforeImage, afterImage, title }: BeforeAfterSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.touches[0].clientX, rect);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, rect);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-foreground">{title}</h3>
      <div
        className="relative overflow-hidden rounded-xl cursor-ew-resize select-none group"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onTouchMove={handleTouchMove}
        onClick={handleClick}
      >
        {/* After Image (Background) */}
        <div className="relative w-full aspect-video">
          <img
            src={afterImage}
            alt="After"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-semibold">
            After
          </div>
        </div>

        {/* Before Image (Foreground with clip) */}
        <div
          className="absolute top-0 left-0 w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt="Before"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-muted text-foreground px-3 py-1.5 rounded-full text-sm font-semibold">
            Before
          </div>
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* Slider Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <div className="flex gap-1">
              <div className="w-0.5 h-6 bg-primary rounded-full"></div>
              <div className="w-0.5 h-6 bg-primary rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BeforeAfterGallery = () => {
  return (
    <section className="relative py-24 bg-background overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            See the Transformation
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Drag the slider to reveal our expert craftsmanship. From damaged to pristine—quality work you can see.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
            <BeforeAfterSlider
              beforeImage={beforeRedCar}
              afterImage={afterRedCar}
              title="Professional Car Painting"
            />
          </Card>

          <Card className="p-6 border-border bg-card/50 backdrop-blur-sm">
            <BeforeAfterSlider
              beforeImage={beforeWhiteBoat}
              afterImage={afterWhiteBoat}
              title="Expert Boat Restoration"
            />
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground italic">
            Real results from our Austin shop. Your vehicle receives the same attention to detail.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterGallery;
