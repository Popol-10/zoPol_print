import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LogementCardProps {
  id: number;
  images: string[];
  title: string;
  capacity: string;
  published: boolean;
}

const formulas = ["Formule nuit", "2 Heures", "3 Heures", "5 Heures", "6 Heures", "4 Heures"];

const LogementCard = ({ id, images, title, capacity, published }: LogementCardProps) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPublished, setIsPublished] = useState(published);
  const hasMultipleImages = images.length > 1;
  const statusLabel = isPublished ? "Dépublier" : "Publier";

  const previousImage = () => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <article className="rounded-[22px] bg-card border border-[#d0d1dc] overflow-hidden">
      <div className="relative h-[230px] sm:h-[240px]">
        <img
          src={images[currentImageIndex]}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.src = "/placeholder.svg";
          }}
        />
        <button
          type="button"
          aria-label="Image précédente"
          onClick={previousImage}
          disabled={!hasMultipleImages}
          className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/95 text-black flex items-center justify-center"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Image suivante"
          onClick={nextImage}
          disabled={!hasMultipleImages}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white/95 text-black flex items-center justify-center"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {formulas.map((formula) => (
              <span
                key={formula}
                className="rounded-full bg-[#dff2ff] px-3 py-1 text-[13px] leading-none text-[#4f5a66]"
              >
                {formula}
              </span>
            ))}
          </div>

          <div className="min-w-[72px] pt-0.5">
            <p className="text-[18px] leading-none text-[#3d3d3d]">{statusLabel}</p>
            <button
              type="button"
              onClick={() => setIsPublished((prev) => !prev)}
              className="mt-2 h-5 w-10 rounded-full bg-[#e4e4e4] p-[2px]"
              aria-label={`Basculer la publication pour ${title}`}
              aria-pressed={isPublished}
            >
              <div
                className={`h-4 w-4 rounded-full transition-transform ${
                  isPublished ? "translate-x-5 bg-[#0f7cff]" : "translate-x-0 bg-black"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-bold leading-none text-[#151515]">{title}</h3>
            <p className="mt-2 text-[14px] italic font-semibold leading-none text-[#2d2d2d]">{capacity}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate("/logements/create", {
                state: { mode: "edit", logementId: id },
              })
            }
            className="h-10 min-w-[90px] rounded-xl bg-[#0f7cff] px-4 text-[19px] font-medium text-white"
          >
            Editer
          </button>
        </div>
      </div>
    </article>
  );
};

export default LogementCard;
