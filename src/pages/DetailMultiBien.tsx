import uploadIcon from "@/assets/icoImporPhot.png";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { toast } from "@/components/ui/use-toast";
import { getMultiBienById, upsertMultiBienItem } from "@/lib/multiBienStore";
import { ChevronDown, Trash2 } from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const MAX_PHOTOS = 20;

const propertyTypes = ["Appartement", "Villa", "Studio", "Loft", "Maison"];
const occupancyOptions = ["10%", "20%", "30%", "40%", "50%", "60%", "70%", "80%", "90%", "100%"];

interface DetailMultiBienRouteState {
  itemId?: string;
  logementId?: number;
  logementTitle?: string;
}

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}`));
    reader.readAsDataURL(file);
  });

const DetailMultiBien = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state || {}) as DetailMultiBienRouteState;

  const existingItem = useMemo(() => {
    if (routeState.itemId) {
      return getMultiBienById(routeState.itemId);
    }

    if (typeof routeState.logementId === "number") {
      return getMultiBienById(`preset-${routeState.logementId}`);
    }

    return null;
  }, [routeState.itemId, routeState.logementId]);

  const [propertyType, setPropertyType] = useState(existingItem?.propertyType || "Appartement");
  const [propertyName, setPropertyName] = useState(
    existingItem?.property.replace("\n", " ") || routeState.logementTitle || "",
  );
  const [city, setCity] = useState(existingItem?.city || "");
  const [isPublished, setIsPublished] = useState(existingItem ? existingItem.status === "Publié" : true);
  const [basePrice, setBasePrice] = useState(existingItem?.basePrice || "100€/nuit");
  const [occupancy, setOccupancy] = useState(existingItem?.occupancy || "50%");
  const [monthlyRevenue, setMonthlyRevenue] = useState(existingItem?.monthlyRevenue || "0€");
  const [photos, setPhotos] = useState<string[]>(existingItem?.photos || []);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = Math.max(0, MAX_PHOTOS - photos.length);
    if (!remaining) {
      toast({
        title: "Limite atteinte",
        description: `Vous pouvez importer jusqu'a ${MAX_PHOTOS} photos.`,
      });
      return;
    }

    const nextFiles = Array.from(files).slice(0, remaining);

    try {
      const nextPhotos = await Promise.all(nextFiles.map(toDataUrl));
      setPhotos((current) => [...current, ...nextPhotos]);
    } catch {
      toast({
        title: "Import impossible",
        description: "Une des images n'a pas pu etre importee.",
      });
    }
  };

  const onInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await addFiles(event.target.files);
    event.target.value = "";
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    await addFiles(event.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const normalizePrice = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "0€";
    return trimmed.includes("€") ? trimmed : `${trimmed}€`;
  };

  const normalizeOccupancy = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "0%";
    return trimmed.includes("%") ? trimmed : `${trimmed}%`;
  };

  const handleSave = () => {
    if (!propertyName.trim() || !city.trim() || !basePrice.trim()) {
      toast({
        title: "Champs requis",
        description: "Renseignez au minimum le nom, la ville et le prix de base.",
      });
      return;
    }

    setIsSaving(true);

    const saved = upsertMultiBienItem({
      id: existingItem?.id || routeState.itemId,
      propertyType,
      property: propertyName.trim(),
      city: city.trim(),
      status: isPublished ? "Publié" : "Brouillon",
      basePrice: normalizePrice(basePrice),
      occupancy: normalizeOccupancy(occupancy),
      monthlyRevenue: normalizePrice(monthlyRevenue),
      image: photos[0] || existingItem?.image || "/placeholder.svg",
      photos: photos.length ? photos : existingItem?.photos || [existingItem?.image || "/placeholder.svg"],
    });

    toast({
      title: existingItem ? "Bien mis a jour" : "Bien ajoute",
      description: `${saved.property.replace("\n", " ")} a ete enregistre.`,
    });

    navigate("/gestion-multi-bien");
    setIsSaving(false);
  };

  return (
    <div className="page-shell flex min-h-screen bg-[#edeef7]">
      <SidebarNav />

      <main className="min-w-0 flex-1 p-3 pt-16 sm:p-4 sm:pt-16 lg:p-6 lg:pl-6 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <TopNav title="DETAIL MULTIBIEN" userName="Mark Loren" />

          <section className="mt-7 rounded-[20px] border border-[#d2d3dc] bg-[#f5f5f5] px-5 py-7 sm:px-8 sm:py-9 md:px-10 md:py-10 lg:mt-9 lg:px-12 lg:py-12">
            <h2 className="text-[22px] font-semibold leading-none text-[#111111] md:text-[24px]">Informations generales</h2>

            <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2 lg:mt-10 xl:grid-cols-3">
              <div>
                <label className="block text-[15px] font-semibold text-[#1c1c1c] md:text-[16px]">Type de propriete</label>
                <div className="relative">
                  <select
                    value={propertyType}
                    onChange={(event) => setPropertyType(event.target.value)}
                    className="mt-3 h-[60px] w-full appearance-none rounded-[12px] border border-[#c5c6ce] bg-[#eeedf1] px-6 pr-12 text-[15px] text-[#414141] outline-none md:h-[64px]"
                  >
                    {propertyTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#111111]" />
                </div>
              </div>

              <div>
                <label className="block text-[15px] font-semibold text-[#1c1c1c] md:text-[16px]">Nom du bien</label>
                <input
                  type="text"
                  value={propertyName}
                  onChange={(event) => setPropertyName(event.target.value)}
                  placeholder="Nom du bien"
                  className="mt-3 h-[60px] w-full rounded-[12px] border border-[#c5c6ce] bg-[#eeedf1] px-6 text-[15px] text-[#414141] outline-none md:h-[64px] md:px-8"
                />
              </div>

              <div>
                <label className="block text-[15px] font-semibold text-[#1c1c1c] md:text-[16px]">Ville</label>
                <input
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Ville du bien"
                  className="mt-3 h-[60px] w-full rounded-[12px] border border-[#c5c6ce] bg-[#eeedf1] px-6 text-[15px] text-[#414141] outline-none md:h-[64px] md:px-8"
                />
              </div>

              <div className="flex items-center gap-5 md:col-span-2 md:pt-1 xl:col-span-1 xl:pt-[44px]">
                <span className="text-[15px] font-semibold text-[#111111] md:text-[16px]">Statut</span>
                <button
                  type="button"
                  className={`relative h-[38px] w-[68px] rounded-full transition-colors ${
                    isPublished ? "bg-[#b8dcff]" : "bg-[#cccccc]"
                  }`}
                  aria-label="Statut"
                  aria-pressed={isPublished}
                  onClick={() => setIsPublished((current) => !current)}
                >
                  <span
                    className={`absolute top-[3px] h-[30px] w-[30px] rounded-full transition-all ${
                      isPublished ? "left-[35px] bg-[#157eea]" : "left-[3px] bg-[#4a4a4a]"
                    }`}
                  />
                </button>
                <span className="text-[14px] font-medium text-[#2f2f2f]">{isPublished ? "Publie" : "Brouillon"}</span>
              </div>

              <div>
                <label className="block text-[15px] font-semibold text-[#1c1c1c] md:text-[16px]">Prix de base</label>
                <input
                  type="text"
                  value={basePrice}
                  onChange={(event) => setBasePrice(event.target.value)}
                  placeholder="100€/nuit"
                  className="mt-3 h-[60px] w-full rounded-[12px] border border-[#c5c6ce] bg-[#eeedf1] px-6 text-[15px] text-[#414141] outline-none md:h-[64px]"
                />
              </div>

              <div>
                <label className="block text-[15px] font-semibold text-[#1c1c1c] md:text-[16px]">Taux d'occupation</label>
                <div className="relative">
                  <select
                    value={occupancy}
                    onChange={(event) => setOccupancy(event.target.value)}
                    className="mt-3 h-[60px] w-full appearance-none rounded-[12px] border border-[#c5c6ce] bg-[#eeedf1] px-6 pr-12 text-[15px] text-[#414141] outline-none md:h-[64px]"
                  >
                    {occupancyOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#111111]" />
                </div>
              </div>

              <div>
                <label className="block text-[15px] font-semibold text-[#1c1c1c] md:text-[16px]">CA mensuelle</label>
                <input
                  type="text"
                  value={monthlyRevenue}
                  onChange={(event) => setMonthlyRevenue(event.target.value)}
                  placeholder="0€"
                  className="mt-3 h-[60px] w-full rounded-[12px] border border-[#c5c6ce] bg-[#eeedf1] px-6 text-[15px] text-[#414141] outline-none md:h-[64px] md:px-8"
                />
              </div>
            </div>

            <h3 className="mt-10 text-[22px] font-semibold leading-none text-[#111111] md:mt-12 md:text-[24px]">
              Importer des images
            </h3>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              className={`mt-7 flex min-h-[250px] w-full flex-col items-center justify-center rounded-[26px] border-2 border-dashed px-4 text-center md:mt-8 md:min-h-[300px] lg:min-h-[330px] ${
                isDragOver ? "border-[#8a8a8a]" : "border-[#8e8f93]"
              }`}
            >
              <img src={uploadIcon} alt="" className="h-[56px] w-[56px] md:h-[70px] md:w-[70px]" />
              <p className="mt-4 text-[16px] font-medium text-[#1e1e1e] md:text-[18px]">
                Glisser-deposer ici pour importer une photo
              </p>
              <p className="mt-2 text-[13px] text-[#585858] md:text-[14px]">
                Formats : JPEG, PNG, WebP, 20 Mo maximum, maximum : {MAX_PHOTOS} photos
              </p>
              <p className="mt-3 text-[16px] font-semibold text-[#1e1e1e] md:text-[18px]">Ou</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 inline-flex h-[50px] min-w-[120px] items-center justify-center rounded-[12px] border border-[#4f4f4f] bg-[#f9f9f9] px-5 text-[14px] text-[#232323] md:h-[54px] md:min-w-[136px]"
              >
                Importer
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={onInputChange}
              />
            </div>

            <p className="mt-4 text-[14px] text-[#444]">{photos.length}/{MAX_PHOTOS} photo(s) importee(s)</p>

            <div className="mt-5 flex flex-wrap gap-3 md:mt-6 md:gap-4">
              {photos.map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative overflow-hidden rounded-[10px] border border-[#b8b8b8]">
                  <img
                    src={photo}
                    alt={`Photo logement ${index + 1}`}
                    className="h-[130px] w-[180px] object-cover sm:h-[150px] sm:w-[210px] md:h-[170px] md:w-[235px]"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-white"
                    aria-label={`Supprimer la photo ${index + 1}`}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-10 flex justify-center md:mt-12">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-[54px] w-full max-w-[446px] items-center justify-center rounded-[10px] bg-[#ff226d] px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default DetailMultiBien;
