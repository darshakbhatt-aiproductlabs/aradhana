export type ChittaTrack = {
  id: string;
  title: string;
  hi: string;
};

export const CHITTA_CHANNEL = {
  handle: "@chittadhyana",
  url: "https://youtube.com/@chittadhyana",
  id: "UCyAeTAH1SeiiQKW6oDj_sLQ",
} as const;

/** Curated long-form and shorts from Chitta Dhyana. Paste-URL covers the rest of the channel. */
export const CHITTA_TRACKS: ChittaTrack[] = [
  { id: "YcrXsatOLPc", title: "Vishnu Sahasranama", hi: "विष्णु सहस्रनाम" },
  { id: "2FeMAI8Df-w", title: "Ram Rameti Rameti", hi: "राम रामेति रामेति" },
  { id: "ox0wanwWhiY", title: "Gananayakaya", hi: "गणनायकाय" },
  { id: "su-tllq9YdI", title: "Shiv Gayatri", hi: "शिव गायत्री" },
  { id: "CugJ4otMoXU", title: "Laghu Mrityunjaya", hi: "लघु मृत्युञ्जय" },
  { id: "vdVxL-NsD98", title: "Karpura Gauram", hi: "कर्पूर गौरम्" },
  { id: "otKEuK3bgmM", title: "Kali 108 japa", hi: "काली जप" },
  { id: "czT6DkANc5M", title: "Rudraksha purification", hi: "रुद्राक्ष मन्त्र" },
  { id: "mZBZt_Y8uSk", title: "Rahu Beej", hi: "राहु बीज" },
  { id: "nSXlmcPcnOI", title: "Hanuman Aadesh", hi: "हनुमान आदेश" },
  { id: "FsxS6MqRn-U", title: "Tirupati Balaji darshan", hi: "वेंकटेश्वर" },
  { id: "MtXVbJs4BkE", title: "Bedtime peace mantra", hi: "शान्ति मन्त्र" },
];

const YT_ID = /^[a-zA-Z0-9_-]{11}$/;

export function parseYoutubeId(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (YT_ID.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && YT_ID.test(id) ? id : null;
    }
    if (url.hostname.replace(/^www\./, "").includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v && YT_ID.test(v)) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const fromPath = parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live"
        ? parts[1]
        : null;
      if (fromPath && YT_ID.test(fromPath)) return fromPath;
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedSrc(id: string) {
  const q = new URLSearchParams({
    autoplay: "1",
    loop: "1",
    playlist: id,
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    controls: "1",
    fs: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${q.toString()}`;
}

export function trackTitle(id: string, fallback = "Chitta Dhyana") {
  return CHITTA_TRACKS.find((t) => t.id === id)?.title ?? fallback;
}
