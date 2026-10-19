import { useMemo, useState } from "react";
import { Check, CheckCheck, ChevronDown, EllipsisVertical } from "lucide-react";
import SidebarNav from "@/components/SidebarNav";
import TopNav from "@/components/TopNav";

type SortKey = "date_reception" | "date_ancienne";
type FilterKey = "read" | "unread";

interface MessageItem {
  id: string;
  sender: string;
  property: string;
  preview: string;
  dateLabel: string;
  avatar: string;
  isRead: boolean;
}

const messagesSeed: MessageItem[] = [
  {
    id: "m1",
    sender: "Gerald Ft",
    property: "Appartement avec vue sur la mer",
    preview: "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis...",
    dateLabel: "20 Septembre 2025 à 20:23",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    isRead: false,
  },
  {
    id: "m2",
    sender: "Lucie Blare",
    property: "Appartement avec vue sur la mer",
    preview: "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis...",
    dateLabel: "30 Septembre 2025 à 12:25",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    isRead: true,
  },
  {
    id: "m3",
    sender: "Gerald Ft",
    property: "Appartement avec vue sur la mer",
    preview: "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis...",
    dateLabel: "12 Mai 2025 à 07:30",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    isRead: true,
  },
  {
    id: "m4",
    sender: "Wes Malt",
    property: "Appartement avec vue sur la mer",
    preview: "Porem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis...",
    dateLabel: "24 Juin 2024 à 08h30",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    isRead: true,
  },
];

const Messages = () => {
  const parseFrenchDate = (value: string) => {
    const normalized = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace("h", ":")
      .trim();
    const match = normalized.match(/(\d{1,2})\s+([a-z]+)\s+(\d{4}).*?(\d{1,2})[:](\d{2})/);
    if (!match) return 0;
    const monthMap: Record<string, number> = {
      janvier: 0,
      fevrier: 1,
      mars: 2,
      avril: 3,
      mai: 4,
      juin: 5,
      juillet: 6,
      aout: 7,
      septembre: 8,
      octobre: 9,
      novembre: 10,
      decembre: 11,
    };
    const month = monthMap[match[2]];
    if (month === undefined) return 0;
    return new Date(Number(match[3]), month, Number(match[1]), Number(match[4]), Number(match[5])).getTime();
  };

  const [sortBy, setSortBy] = useState<SortKey>("date_reception");
  const [filterBy, setFilterBy] = useState<FilterKey>("unread");
  const [selectedId, setSelectedId] = useState("m1");
  const [messages, setMessages] = useState<MessageItem[]>(messagesSeed);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  const readCount = useMemo(() => messages.filter((item) => item.isRead).length, [messages]);
  const unreadCount = useMemo(() => messages.filter((item) => !item.isRead).length, [messages]);

  const rows = useMemo(() => {
    const filtered = filterBy === "read" ? messages.filter((m) => m.isRead) : messages.filter((m) => !m.isRead);
    const sorted = [...filtered].sort((a, b) => {
      const aDate = parseFrenchDate(a.dateLabel);
      const bDate = parseFrenchDate(b.dateLabel);
      return sortBy === "date_reception" ? bDate - aDate : aDate - bDate;
    });
    return sorted;
  }, [messages, filterBy, sortBy]);

  const toggleRead = (id: string) => {
    setMessages((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: !item.isRead } : item)));
  };

  const removeMessage = (id: string) => {
    const ok = window.confirm("Supprimer ce message ?");
    if (!ok) return;
    setMessages((prev) => prev.filter((item) => item.id !== id));
    setOpenMenuFor(null);
    if (selectedId === id) setSelectedId("");
  };

  return (
    <div className="page-shell flex min-h-screen bg-background">
      <SidebarNav />

      <main className="flex min-w-0 flex-1 flex-col gap-5 p-4 pb-8 pt-16 lg:gap-6 lg:p-6 lg:pt-6">
        <TopNav title="MESSAGES" unreadMessagesCount={unreadCount} />

        <section className="mx-auto w-full max-w-[1120px] rounded-[18px] border border-[#d4d4da] bg-[#fff] p-5 shadow-[0_30px_70px_-24px_rgba(82,96,255,0.34)] lg:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#24242b]">Trier par</p>
              <div className="relative mt-1 w-[190px]">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="h-11 w-full appearance-none rounded-md border border-[#2e2e33] bg-transparent px-3 pr-9 text-[15px] font-semibold text-[#1a1a1f]"
                >
                  <option value="date_reception">Date de réception</option>
                  <option value="date_ancienne">Date la plus ancienne</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterBy("read")}
                className={`h-9 min-w-[96px] rounded-md px-3 text-[15px] font-semibold transition-colors ${
                  filterBy === "read" ? "bg-[#0f7bf1] text-white" : "bg-[#dfdfe3] text-[#222229] hover:bg-[#d3d3d8]"
                }`}
              >
                Lu ({readCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterBy("unread")}
                className={`h-9 min-w-[96px] rounded-md px-3 text-[15px] font-semibold transition-colors ${
                  filterBy === "unread" ? "bg-[#0f7bf1] text-white" : "bg-[#dfdfe3] text-[#222229] hover:bg-[#d3d3d8]"
                }`}
              >
                Non Lu ({unreadCount})
              </button>
            </div>
          </div>

          <p className="mt-6 text-[15px] italic text-[#3a3a42]">Vous avez un nouveau message de John Doe</p>

          <div className="mt-7 space-y-0.5">
            {rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#d2d2d9] px-4 py-8 text-center text-[15px] text-[#4a4a52]">
                Aucun message dans cette catégorie.
              </div>
            ) : null}
            {rows.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <article
                  key={item.id}
                  className={`grid grid-cols-[minmax(220px,1.1fr)_minmax(330px,2fr)_minmax(180px,1fr)_44px_34px] items-center gap-4 rounded-xl px-4 py-3 ${
                    isSelected ? "bg-[#e1e8f2]" : "border-b border-[#d8d8de]"
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="flex items-start gap-3">
                    <img src={item.avatar} alt={item.sender} className="h-11 w-11 rounded-full border-2 border-[#1b7ff2] object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-[#1b1b21]">{item.sender}</p>
                      <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-[#1d1d23]">{item.property}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-[#1c1c21]">Message</p>
                    <p className="line-clamp-2 text-[15px] leading-tight text-[#3a3a40]">{item.preview}</p>
                  </div>

                  <p className="text-[15px] font-semibold italic text-[#222229]">{item.dateLabel}</p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRead(item.id);
                    }}
                    className="grid h-8 w-8 place-items-center rounded-md hover:bg-[#d6dce5]"
                    aria-label="Marquer comme lu"
                  >
                    {item.isRead ? <CheckCheck className="h-5 w-5 text-[#111116]" /> : <Check className="h-5 w-5 text-[#111116]" />}
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuFor((prev) => (prev === item.id ? null : item.id));
                      }}
                      className="grid h-8 w-8 place-items-center rounded-md hover:bg-[#d6dce5]"
                      aria-label="Actions"
                    >
                      <EllipsisVertical className="h-5 w-5 text-[#111116]" />
                    </button>
                    {openMenuFor === item.id ? (
                      <div className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-[#d7d7dd] bg-white p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRead(item.id);
                            setOpenMenuFor(null);
                          }}
                          className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#f1f2f5]"
                        >
                          {item.isRead ? "Marquer non lu" : "Marquer lu"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMessage(item.id);
                          }}
                          className="w-full rounded-md px-3 py-2 text-left text-sm text-[#cf1111] hover:bg-[#f8efef]"
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Messages;
