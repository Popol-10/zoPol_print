import ico2 from "@/assets/icoImporPhot.png";
import villa1 from "@/assets/villa1.png";
import villa2 from "@/assets/villa2.png";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import { Trash2 } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadLogementDraft, saveLogementDraft } from "@/lib/logementDraft";
import { toast } from "@/components/ui/use-toast";

const MAX_PHOTOS = 20;
const currentStep = 3;

const CreateLogementStep3 = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draft = loadLogementDraft();
  const initialPhotos = draft.photos.length ? draft.photos : [villa1, villa2];
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [isDragOver, setIsDragOver] = useState(false);

  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error(`Impossible de lire ${file.name}`));
      reader.readAsDataURL(file);
    });

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = Math.max(0, MAX_PHOTOS - photos.length);
    if (!remaining) return;

    try {
      const next = await Promise.all(
        Array.from(files)
          .slice(0, remaining)
          .map((file) => toDataUrl(file)),
      );
      setPhotos((current) => [...current, ...next]);
    } catch {
      toast({
        title: "Import impossible",
        description: "Une photo n'a pas pu etre importee.",
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
    setPhotos((current) => {
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const saveStep3 = () => {
    saveLogementDraft({ photos });
  };

  const goPrevious = () => {
    saveStep3();
    navigate("/logements/create/step-2");
  };

  const goNext = () => {
    if (!photos.length) {
      toast({
        title: "Photo requise",
        description: "Ajoutez au moins une photo avant de continuer.",
      });
      return;
    }
    saveStep3();
    navigate("/logements/create/step-4");
  };

  return (
    <div className="page-shell flex min-h-screen bg-[#eeeff7]">
      <SidebarNav />

      <main className="flex-1 min-w-0 p-4 pt-16 lg:p-6 lg:pl-6 lg:pt-6">
        <div className="mx-auto w-full max-w-[1400px]">
          <TopNav title="CREER UN LOGEMENT" />

          <section className="anim-item mt-7 rounded-2xl border border-[#d0d1dc] bg-[#fff] px-4 py-8 sm:px-8 md:px-8 lg:px-15 lg:py-10">
            <header className="text-center">
              <h1 className="text-[25px] font-bold text-[#101010] sm:text-[33px]">ETAPE 3</h1>
              <p className="mt-2 text-[18px] font-semibold text-[#111111] sm:text-[25px]">Galerie photos</p>
            </header>

            <div className="relative mx-auto mt-8 flex w-full max-w-[420px] items-center md:max-w-[500px]">
              <div className="h-[7px] w-full rounded-full bg-[#d4d4d7]" />
              <div
                className="absolute left-0 top-1/2 h-[7px] -translate-y-1/2 rounded-full bg-[#1d7df2]"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
              <div className="pointer-events-none absolute left-0 top-1/2 flex w-full -translate-y-1/2 items-center justify-between">
                {[1, 2, 3, 4].map((step) => {
                  const active = step <= currentStep;
                  return (
                    <div
                      key={step}
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold leading-none ${
                        active ? "bg-[#1d7df2] text-white" : "bg-[#bdd6f8] text-[#4b96ec]"
                      }`}
                    >
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mt-8 text-center text-[20px] font-medium text-[#1a1a1a] sm:text-[23px] lg:text-[23px]">
              Mettez en valeur votre logement avec de belles photos
            </p>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              className={`anim-item mt-8 flex min-h-[220px] w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed px-4 text-center transition-colors duration-200 sm:min-h-[280px] lg:min-h-[360px] ${
                isDragOver ? "border-[#1d7df2]" : "border-[#8e8f93]"
              }`}
            >
              {/* <ImagePlus className="h-12 w-12 text-[#5a5a5a]" /> */}
              <img src={ico2} alt="" className="h-15 w-15"/>
              <p className="mt-4 text-[13px] text-[#1e1e1e] sm:text-[20px]">Glisser-déposer ici pour importer une photo</p>
              <p className="mt-2 text-[12px] text-[#595959] sm:text-[18px]">
                Formats : JPEG, PNG, WebP ,20 Mo maximum, maximum : 20 photos
              </p>
              <p className="mt-4 text-[15px] font-medium text-[#1e1e1e] sm:text-[25px]">Ou</p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 h-[48px] min-w-[170px] rounded-xl border border-[#535353] bg-[#f9f9f9] px-5 text-[20px] text-[#232323] transition-colors duration-200 hover:bg-[#f0f0f0]"
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

            <div className="mt-6 flex flex-wrap gap-3 sm:gap-4">
              {photos.map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative overflow-hidden rounded-xl border border-[#b8b8b8]">
                  <img
                    src={photo}
                    alt={`Photo logement ${index + 1}`}
                    className="h-[110px] w-[150px] object-cover sm:h-[130px] sm:w-[210px]"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-85"
                    aria-label={`Supprimer la photo ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col justify-between gap-5 sm:flex-row">
              <button
                type="button"
                onClick={goPrevious}
                className="anim-item inline-flex h-[50px] w-full items-center justify-center rounded-xl border border-[#bebec3] bg-[#f8f8f8] px-6 text-[18px] font-semibold text-[#111111] transition-colors duration-200 hover:bg-[#f1f1f1] sm:w-auto sm:min-w-[200px] lg:min-w-[230px]"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={goNext}
                className="anim-item inline-flex h-[50px] w-full items-center justify-center rounded-xl bg-[#0f7cff] px-6 text-[18px] font-semibold text-white transition-opacity duration-200 hover:opacity-90 sm:w-auto sm:min-w-[200px] lg:min-w-[230px]"
              >
                Etape suivante
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CreateLogementStep3;
