import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { ChevronDown, ImagePlus, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { toast } from "@/components/ui/use-toast";
import { loadOptionsServicesData, saveOptionsServicesData, type ExtraItem } from "@/lib/optionsServicesStore";

interface ExtraItemState {
  id?: string;
  title?: string;
  description?: string;
  price?: string;
  category?: string;
  image?: string;
}

interface LocationState {
  mode?: "add" | "edit";
  itemId?: string;
  item?: ExtraItemState;
}

const categoryOptions = ["Boisson", "Decoration", "Romance", "Bien-etre"];

const toDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });

const OptionsServicesExtra = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState | null) ?? {};

  const isEdit = state.mode === "edit";
  const data = loadOptionsServicesData();
  const existing =
    (state.itemId ? data.extras.find((entry) => entry.id === state.itemId) : null) ??
    (state.item?.id ? data.extras.find((entry) => entry.id === state.item?.id) : null) ??
    null;

  const [title, setTitle] = useState(isEdit ? (existing?.title ?? state.item?.title ?? "") : "");
  const [price, setPrice] = useState(isEdit ? (existing?.price ?? state.item?.price ?? "") : "");
  const [category, setCategory] = useState(isEdit ? (existing?.category ?? state.item?.category ?? "Boisson") : "Boisson");
  const [description, setDescription] = useState(isEdit ? (existing?.description ?? state.item?.description ?? "") : "");
  const [imagePreview, setImagePreview] = useState<string | null>(
    isEdit ? (existing?.image ?? state.item?.image ?? null) : null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const helperText = useMemo(
    () => "Proposez des extras a vos clients : bouteilles, petales de rose, compositions florales...",
    [],
  );

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await toDataUrl(file);
      setImagePreview(dataUrl);
    } catch {
      toast({ title: "Import impossible", description: "Cette image n'a pas pu etre importee." });
    }
  };

  const handleSave = () => {
    if (!title.trim() || !price.trim() || !description.trim()) {
      toast({ title: "Champs requis", description: "Renseignez le nom, le prix et la description." });
      return;
    }

    const updated: ExtraItem = {
      id: existing?.id || `extra-${Date.now()}`,
      title: title.trim(),
      price: price.trim(),
      category,
      description: description.trim(),
      image: imagePreview || existing?.image || "/placeholder.svg",
    };

    const nextExtras = existing
      ? data.extras.map((entry) => (entry.id === existing.id ? updated : entry))
      : [...data.extras, updated];

    saveOptionsServicesData({
      ...data,
      extras: nextExtras,
    });

    toast({ title: isEdit ? "Extra modifie" : "Extra ajoute" });
    navigate("/options-services", { state: { tab: "extra" } });
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="OPTIONS SERVICES" />

        <section className="mx-auto w-full max-w-[1120px]">
          <div className="rounded-[22px] border border-[#d3d3d9] bg-[#f4f4f6] p-6 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.36)] lg:p-10">
            <h2 className="text-center text-2xl font-bold tracking-tight text-[#121217] lg:text-3xl">
              {isEdit ? "MODIFIER EXTRA" : "AJOUTER EXTRA"}
            </h2>

            <div className="mx-auto mt-10 max-w-[980px]">
              <p className="text-xl font-semibold text-[#17171c]">Extra</p>
              <p className="mt-1 text-sm italic text-[#25252b] lg:text-[15px]">{helperText}</p>

              <div className="mt-4 h-px bg-[#d0d0d6]" />

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Nom</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bouteille de champagne"
                    className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 text-[15px] text-[#2b2b31]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Prix</span>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="10€"
                    className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 text-[15px] text-[#2b2b31]"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Categories</span>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-14 w-full appearance-none rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 text-[15px] text-[#2b2b31]"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#202026]" />
                  </div>
                </label>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.2fr]">
                <label className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Description</span>
                  <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description de l’extra"
                    className="h-14 w-full rounded-xl border border-[#ceced5] bg-[#ececf0] px-4 text-[15px] text-[#2b2b31]"
                  />
                </label>

                <div className="space-y-2">
                  <span className="block text-[15px] font-semibold text-[#212127]">Photo</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleFilePick}
                      className="flex h-14 min-w-[280px] items-center gap-3 rounded-xl border border-dashed border-[#8d8d94] bg-transparent px-5 text-[15px] text-[#222228] transition-colors hover:bg-[#ececf1]"
                    >
                      <ImagePlus className="h-5 w-5" />
                      Importer une photo
                    </button>
                    <button
                      type="button"
                      onClick={handleFilePick}
                      className="h-14 rounded-xl bg-black px-8 text-[15px] font-semibold text-white transition-colors hover:bg-[#202020]"
                    >
                      Importer
                    </button>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
              </div>

              {imagePreview ? (
                <div className="mt-5">
                  <img src={imagePreview} alt="Apercu extra" className="h-24 w-40 rounded-lg object-cover" />
                </div>
              ) : null}

              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex h-12 min-w-[240px] items-center justify-center gap-2 rounded-xl bg-[#0f7bf1] px-7 text-base font-semibold text-white transition-colors hover:bg-[#0c69cf]"
                >
                  {isEdit ? "Mettre a jour l'option" : "Ajouter l'option"}
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default OptionsServicesExtra;
