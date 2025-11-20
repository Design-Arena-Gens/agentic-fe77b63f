"use client";

import AmbientSound from "@/components/AmbientSound";
import ForestScene from "@/components/ForestScene";

export default function Home() {
  const dialogue = [
    "जटायु… हे महानुभाव… यह दशा किसने की?",
    "मित्र, जो भी तुमने किया है, वह व्यर्थ नहीं जाएगा।",
    "मैं यहाँ हूँ… मुझे सीता के बारे में बताओ, क्या हुआ?",
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070504] text-amber-50">
      <ForestScene />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#100a05]/20 via-[#110b07]/40 to-[#090604] mix-blend-screen" />
      <div className="pointer-events-none absolute inset-y-0 left-0 right-1/3 bg-gradient-to-r from-[#090502] via-transparent to-transparent opacity-75" />
      <div className="grain-overlay" />
      <div className="relative z-10 flex min-h-screen flex-col justify-between px-6 pb-12 pt-12 sm:px-10 md:px-16">
        <header className="mt-4 max-w-xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-amber-100/80">
            <span>दण्डकारण्य</span>
            <span>स्वर्णिम संध्या</span>
          </div>
          <h1 className="mt-7 text-4xl font-semibold leading-tight text-amber-50 drop-shadow-[0_12px_24px_rgba(255,210,134,0.18)] sm:text-5xl md:text-6xl">
            श्रीराम का करुण आलिंगन — जटायु की अमर गाथा
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-amber-100/70 sm:text-lg">
            सुनहरे आकाशी किरणों से आलोकित पवित्र वन-भूमि में, भगवान श्रीराम और
            उनके धैर्यवान साथी अपने मित्र और रक्षक जटायु के अंतिम क्षणों में
            श्रद्धापूर्ण संगति देते हैं। भावनाओं से भरे इस क्षण में धूलकण
            तैरते हैं, पत्तियाँ सिहरती हैं और देवदिव्य प्रकाश उनके संकल्प को
            आलोकित करता है।
          </p>
        </header>

        <section className="mt-12 flex flex-col gap-6 sm:gap-8">
          <div className="max-w-md rounded-3xl border border-amber-100/20 bg-black/50 p-6 backdrop-blur-lg sm:p-8">
            <h2 className="text-sm uppercase tracking-[0.5em] text-amber-200/80">
              संवाद
            </h2>
            <div className="mt-4 space-y-4 text-lg leading-relaxed text-amber-100">
              {dialogue.map((line, index) => (
                <p key={index} className="font-semibold text-amber-50/90">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.4em] text-amber-100/70">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              सिनेमैटिक 35mm
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              डॉली-इन मूवमेंट
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              वॉल्यूमेट्रिक गॉड-रेज़
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              पवित्र वन ambience
            </span>
          </div>
        </section>

        <footer className="mb-6 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-sm leading-relaxed text-amber-100/70">
            हल्की हवा, पवित्र अनुनाद और दूरस्थ पक्षियों के स्वर शांत वन को जीवंत
            करते हैं। immersive अनुभव के लिए ध्वनि सक्षम करें।
          </p>
          <AmbientSound />
        </footer>
      </div>
    </main>
  );
}
