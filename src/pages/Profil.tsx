import { useRef, useState } from "react";
import {
  BadgeCheck,
  BookMarked,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  House,
  ImagePlus,
  Mail,
  Phone,
} from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";
import userAvatar from "@/assets/user.png";
import ico1 from "@/assets/wpf_security-checked.png";
import ico2 from "@/assets/lets-icons_check-fill.png";
type ProfileForm = {
  nom: string;
  prenom: string;
  adresse: string;
  dateNaissance: string;
  email: string;
  telephone: string;
  apropos: string;
};

const advantages = [
  "Paiements sécurisés par carte bancaire",
  "Virements automatiques sur votre compte",
  "Gestion simplifiée des remboursements",
  "Protection contre la fraude intégrée",
];

const PROFILE_STORAGE_KEY = "profile-form-data";

const defaultForm: ProfileForm = {
  nom: "John",
  prenom: "Doe",
  adresse: "Adresse Lorem Rue 102",
  dateNaissance: "25 Decembre 2002",
  email: "jojodoe@gmail.com",
  telephone: "+33 04 555 48 25",
  apropos: "Je suis ...",
};

const readStoredProfile = (): ProfileForm => {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return defaultForm;
  try {
    const parsed = JSON.parse(raw) as Partial<ProfileForm>;
    return {
      nom: parsed.nom ?? defaultForm.nom,
      prenom: parsed.prenom ?? defaultForm.prenom,
      adresse: parsed.adresse ?? defaultForm.adresse,
      dateNaissance: parsed.dateNaissance ?? defaultForm.dateNaissance,
      email: parsed.email ?? defaultForm.email,
      telephone: parsed.telephone ?? defaultForm.telephone,
      apropos: parsed.apropos ?? defaultForm.apropos,
    };
  } catch {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    return defaultForm;
  }
};

const Profil = () => {
  const [formData, setFormData] = useState<ProfileForm>(() => readStoredProfile());
  const [isStripeConnected, setIsStripeConnected] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>(userAvatar);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFieldChange = (field: keyof ProfileForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof ProfileForm, string>> = {};

    if (!formData.nom.trim()) nextErrors.nom = "Nom requis";
    if (!formData.prenom.trim()) nextErrors.prenom = "Prénom requis";
    if (!formData.adresse.trim()) nextErrors.adresse = "Adresse requise";
    if (!formData.dateNaissance.trim()) nextErrors.dateNaissance = "Date requise";
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) nextErrors.email = "Email invalide";
    if (!formData.telephone.trim()) nextErrors.telephone = "Téléphone requis";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(formData));
    window.alert("Profil enregistré.");
  };

  const handleReset = () => {
    setFormData(defaultForm);
    setErrors({});
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValidType = file.type === "image/jpeg" || file.type === "image/png";
    if (!isValidType) {
      window.alert("Format invalide. Utilisez JPG ou PNG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      window.alert("Fichier trop volumineux (max 2Mo).");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="MESSAGES" userName={`${formData.nom} ${formData.prenom}`.trim()} unreadMessagesCount={1} />

        <section className="mx-auto w-full max-w-[1260px] overflow-hidden rounded-[16px] border border-[#d8d8df] bg-white shadow-[0_30px_75px_-35px_rgba(109,119,255,0.75)]">
          <div className="relative bg-[#187cec] px-4 pb-1 pt-2 text-white">
            <div className="ml-[150px] flex flex-col gap-2 justify-center">
              <h2 className="text-[18px] font-bold leading-none">{`${formData.nom} ${formData.prenom}`.trim()}</h2>
              <p className="text-[15px] italic leading-none">{formData.email}</p>
              <span className="mt-2 inline-flex w-fit rounded-[7px] bg-white px-3 py-1 text-[12px] font-medium text-[#23242b]">
                Membre depuis Janvier 2026
              </span>
            </div>

            <div className="-mt-5  ml-[400px] flex flex-wrap items-center gap-8 pb-2 text-[15px] italic">
              <div className="flex items-center gap-2">
                <House className="h-4 w-4" />
                <span>Logement(4)</span>
              </div>
              <div className="flex items-center gap-2">
                <BookMarked className="h-4 w-4" />
                <span>Reservations(2)</span>
              </div>
              <div className="flex items-center gap-2">
                <House className="h-4 w-4" />
                <span>Bien(0)</span>
              </div>
            </div>

            <img
              src={avatarPreview}
              alt="Photo profil"
              className="absolute bottom-[-35px] left-8 h-[102px] w-[102px] rounded-full border-4 border-[#dcd8ef] object-cover"
            />
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 pt-14">
            <h3 className="text-[20px] font-bold text-[#17171d]">Information personnelle</h3>

            <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-[16px] font-semibold text-[#1e1e24]">Nom</label>
                  <input
                    value={formData.nom}
                    onChange={(e) => handleFieldChange("nom", e.target.value)}
                    className="mt-2 h-[58px] w-full rounded-[10px] border border-[#cfd0d8] bg-[#f7f7fa] px-6 text-[14px] text-[#404047]"
                  />
                  {errors.nom ? <p className="mt-1 text-[12px] text-[#e32727]">{errors.nom}</p> : null}
                </div>
                <div>
                  <label className="text-[16px] font-semibold text-[#1e1e24]">Prénom</label>
                  <input
                    value={formData.prenom}
                    onChange={(e) => handleFieldChange("prenom", e.target.value)}
                    className="mt-2 h-[58px] w-full rounded-[10px] border border-[#cfd0d8] bg-[#f7f7fa] px-6 text-[14px] text-[#404047]"
                  />
                  {errors.prenom ? <p className="mt-1 text-[12px] text-[#e32727]">{errors.prenom}</p> : null}
                </div>
                <div>
                  <label className="text-[16px] font-semibold text-[#1e1e24]">Adresse</label>
                  <input
                    value={formData.adresse}
                    onChange={(e) => handleFieldChange("adresse", e.target.value)}
                    className="mt-2 h-[58px] w-full rounded-[10px] border border-[#cfd0d8] bg-[#f7f7fa] px-6 text-[14px] text-[#404047]"
                  />
                  {errors.adresse ? <p className="mt-1 text-[12px] text-[#e32727]">{errors.adresse}</p> : null}
                </div>
                <div>
                  <label className="text-[16px] font-semibold text-[#1e1e24]">Date de naissance</label>
                  <div className="relative mt-2">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#404047]" />
                    <input
                      value={formData.dateNaissance}
                      onChange={(e) => handleFieldChange("dateNaissance", e.target.value)}
                      className="h-[58px] w-full rounded-[10px] border border-[#cfd0d8] bg-[#f7f7fa] pl-12 pr-6 text-[14px] text-[#404047]"
                    />
                  </div>
                  {errors.dateNaissance ? <p className="mt-1 text-[12px] text-[#e32727]">{errors.dateNaissance}</p> : null}
                </div>
                <div>
                  <label className="text-[16px] font-semibold text-[#1e1e24]">Adresse Email</label>
                  <div className="relative mt-2">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#404047]" />
                    <input
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className="h-[58px] w-full rounded-[10px] border border-[#cfd0d8] bg-[#f7f7fa] pl-12 pr-6 text-[14px] text-[#404047]"
                    />
                  </div>
                  {errors.email ? <p className="mt-1 text-[12px] text-[#e32727]">{errors.email}</p> : null}
                </div>
                <div>
                  <label className="text-[16px] font-semibold text-[#1e1e24]">Numéro de téléphone</label>
                  <div className="relative mt-2">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#404047]" />
                    <input
                      value={formData.telephone}
                      onChange={(e) => handleFieldChange("telephone", e.target.value)}
                      className="h-[58px] w-full rounded-[10px] border border-[#cfd0d8] bg-[#f7f7fa] pl-12 pr-6 text-[14px] text-[#404047]"
                    />
                  </div>
                  {errors.telephone ? <p className="mt-1 text-[12px] text-[#e32727]">{errors.telephone}</p> : null}
                </div>
              </div>

              <div>
                <label className="text-[16px] font-semibold text-[#1e1e24]">A propos de moi</label>
                <textarea
                  value={formData.apropos}
                  onChange={(e) => handleFieldChange("apropos", e.target.value)}
                  className="mt-2 h-[216px] w-full resize-none rounded-[10px] border border-[#cfd0d8] bg-[#f7f7fa] p-6 text-[14px] text-[#404047]"
                />
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
              <div>
                <h4 className="text-[20px] font-bold text-[#17171d]">Configuration stripe</h4>
                <div className="mt-3 rounded-[16px] border border-[#1e82f3] bg-[#edf2f9] p-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <div className="flex items-start gap-3">
                        {/* <BadgeCheck className="h-7 w-7 text-[#1e82f3]" /> */}
                        <img src={ico1} alt="" className="h-7 w-7"/>
                        <h5 className="text-[16px] font-bold leading-[1.2] text-[#1278ec]">Connectez votre compte Stripe</h5>
                      </div>
                      <p className="mt-4 text-[14px] italic leading-[1.25] text-[#3d3d45]">
                        Pour recevoir des paiements de vos voyageurs, vous devez connecter un compte Stripe.
                      </p>
                    </div>

                    <div>
                      <h5 className="text-[16px] font-bold text-[#1278ec]">Avantages</h5>
                      <div className="mt-4 space-y-2">
                        {advantages.map((item) => (
                          <div key={item} className="flex items-start gap-3 text-[14px] italic leading-[1.2] text-[#3d3d45]">
                            {/* <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1e82f3]" /> */}
                            <img src={ico2} alt="" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsStripeConnected(true)}
                    className="inline-flex h-[40px] min-w-[200px] items-center justify-center gap-3 rounded-[10px] bg-[#197eec] px-7 text-[18px] font-semibold text-white transition-colors hover:bg-[#0f71db]"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>{isStripeConnected ? "Stripe connecté" : "Connecter Stripe"}</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[20px] font-bold text-[#17171d]">Photo de profil</h4>
                <div className="mt-3 flex h-[265px] flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[#9b9ba4] p-5 text-center">
                  <ImagePlus className="h-11 w-11 text-[#606068]" />
                  <p className="mt-3 text-[17px] font-medium text-[#2d2d34]">Importer une photo de profil</p>
                  <p className="mt-2 text-[14px] leading-[1.2] text-[#5b5b63]">JPG, PNG | max: 2Mo | dimensions: 400x400px</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="mt-6 inline-flex h-[50px] min-w-[165px] items-center justify-center rounded-[12px] bg-[#197eec] px-7 text-[16px] font-semibold text-white transition-colors hover:bg-[#0f71db]"
                  >
                    Importer
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-[44px] items-center justify-center rounded-[10px] border border-[#c9cad2] bg-white px-5 text-[15px] font-semibold text-[#2d2d34] transition-colors hover:bg-[#f4f4f7]"
              >
                Réinitialiser
              </button>
              <button
                type="submit"
                className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[10px] bg-[#197eec] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#0f71db]"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Profil;
