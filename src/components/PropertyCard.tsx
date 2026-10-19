import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Property data interface */
export interface Property {
  id: number;
  name: string;
  capacity: number;
  images: string[];
  tags: string[];
  published: boolean;
}

interface PropertyCardProps {
  property: Property;
}

/** Individual property card with image carousel, tags, publish toggle and edit button */
const PropertyCard = ({ property }: PropertyCardProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isPublished, setIsPublished] = useState(property.published);

  const prevImage = () => {
    setCurrentImage((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentImage((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden flex flex-col">
      {/* Image carousel */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <img
          src={property.images[currentImage]}
          alt={property.name}
          className="w-full h-full object-cover"
        />
        {/* Navigation arrows */}
        <button
          onClick={prevImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-card transition-colors"
          aria-label="Image précédente"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </button>
        <button
          onClick={nextImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-card transition-colors"
          aria-label="Image suivante"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </button>
      </div>

      {/* Card content */}
      <div className="p-4 flex flex-col gap-3">
        {/* Tags row + publish toggle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {property.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium text-sweethome-blue border border-sweethome-blue/30 rounded-full px-2.5 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
          {/* Publish toggle */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-xs font-medium text-muted-foreground">
              {isPublished ? "Publier" : "Dépublier"}
            </span>
            <button
              onClick={() => setIsPublished(!isPublished)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isPublished ? "bg-foreground" : "bg-sweethome-blue"
              }`}
              aria-label="Toggle publication"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform ${
                  isPublished ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Name, capacity and edit button */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-foreground">{property.name}</p>
            <p className="text-xs text-muted-foreground italic">
              Capacité : {property.capacity} personnes
            </p>
          </div>
          <button className="bg-sweethome-blue text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Editer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
