import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import bridePhoto from '../assets/bride-amira.png';
import groomPhoto from '../assets/groom-reza.png';
import preweddingPortrait from '../assets/prewedding-portrait.png';
import preweddingTogether from '../assets/prewedding-together.png';
import preweddingStaircase from '../assets/prewedding-staircase.png';
import preweddingHandInHand from '../assets/prewedding-hand-in-hand.png';
import preweddingCover from '../assets/prewedding-cover.png';
import openingCoverGenerated from '../assets/opening-cover-generated.webp';
import ringsPhoto from '../assets/rings.webp';
import bouquetPhoto from '../assets/bouquet.webp';
import venueFloralsPhoto from '../assets/venue-florals.webp';
import guestTablePhoto from '../assets/guest-table.webp';
import tableDetailPhoto from '../assets/table-detail.webp';
import hotelPhoto from '../assets/hotel.webp';

const UNSPLASH = {
  hero: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1800&h=1200&fit=crop&auto=format',
  bride: bridePhoto,
  groom: groomPhoto,
  venue: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=500&fit=crop&auto=format',
  eventVenue: 'https://images.unsplash.com/photo-1666626349363-9117bbf2a251?w=1200&h=1600&fit=crop&auto=format',
  gallery1: 'https://images.unsplash.com/photo-1642191027829-3fc090231786?w=900&h=1200&fit=crop&auto=format',
  gallery2: 'https://images.unsplash.com/photo-1707190979552-a07178600aa6?w=1200&h=800&fit=crop&auto=format',
  gallery3: 'https://images.unsplash.com/photo-1665391980833-488a7404129b?w=900&h=1200&fit=crop&auto=format',
  gallery4: 'https://images.unsplash.com/photo-1711968558574-3cdc2a947f30?w=1200&h=800&fit=crop&auto=format',
  gallery5: 'https://images.unsplash.com/photo-1707190979639-0fce82c66a1c?w=1200&h=900&fit=crop&auto=format',
  detail1: 'https://images.unsplash.com/photo-1537018575677-d5e6f979e12a?w=1000&h=800&fit=crop&auto=format',
  detail2: 'https://images.unsplash.com/photo-1644534197817-2cd95fbadc40?w=900&h=1100&fit=crop&auto=format',
  detail3: 'https://images.unsplash.com/photo-1581398775561-905cde115122?w=1100&h=800&fit=crop&auto=format',
  detail4: 'https://images.unsplash.com/photo-1547793806-ab30291ca3c6?w=1000&h=800&fit=crop&auto=format',
  detail5: 'https://images.unsplash.com/photo-1623672655530-2fd989eb9860?w=900&h=1100&fit=crop&auto=format',
  detail6: 'https://images.unsplash.com/photo-1634820181422-8d1c9ad41d1f?w=900&h=1100&fit=crop&auto=format',
};

function useCountdown(targetDate: Date) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) return;
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return time;
}

const WEDDING_DATE = new Date('2028-11-16T09:00:00+07:00');

const timelineEvents = [
  { year: '2019', title: 'First Meeting', desc: 'We first met as classmates in college, sharing the same major and the beginning of a beautiful story.' },
  { year: '2021', title: 'Our Journey Begins', desc: 'After two years of friendship, love found its way.' },
  { year: '2024', title: 'Engagement', desc: 'A sunset proposal in Bali, she said yes.' },
  { year: '2028', title: 'Wedding Day', desc: 'The beginning of forever, surrounded by those we love.' },
];

const faqItems = [
  { q: 'What is the event schedule?', a: 'Akad Nikah starts at 09:00 WIB, followed by Reception at 12:00 WIB. Please arrive 15 minutes early.' },
  { q: 'What is the dress code?', a: 'Formal attire in burgundy, dark brown, or coordinating warm neutrals such as mocha, taupe, and champagne. Please choose an elegant, modest look to complement our wedding theme.' },
  { q: 'Is parking available?', a: 'Parking and hotel entrance details will be shared closer to the wedding day.' },
  { q: 'How many guests can I bring?', a: 'Your invitation is valid for the number of guests specified. Please indicate the number during RSVP.' },
  { q: 'How do I get to the venue?', a: 'Our wedding will take place at The Premier Hotel Pekanbaru, Riau. Use the Open Navigation button for directions. Event room and hotel entrance details will be shared closer to the wedding day.' },
];

const wishes = [
  { name: 'Budi Santoso', msg: 'Selamat menempuh hidup baru! Semoga pernikahan kalian penuh berkah dan kebahagiaan.', hearts: 24 },
  { name: 'Sari Dewi', msg: 'May your love story be the greatest of all time. Congratulations to the beautiful couple!', hearts: 18 },
  { name: 'Ahmad Fauzi', msg: 'Bahagia selalu untuk kalian berdua. Semoga rumah tangga kalian sakinah, mawaddah, warahmah.', hearts: 31 },
];

function InvitationOrnament({ mirrored = false }: { mirrored?: boolean }) {
  return (
    <svg
      className={`intro-ornament ${mirrored ? 'rotate-180' : ''}`}
      viewBox="0 0 320 44"
      fill="none"
      aria-hidden="true"
    >
      <path d="M18 28C68 28 89 9 143 21C151 23 156 24 160 22" />
      <path d="M302 28C252 28 231 9 177 21C169 23 164 24 160 22" />
      <path d="M160 15L167 22L160 29L153 22L160 15Z" className="intro-ornament-diamond" />
      <path d="M143 27C150 33 155 34 160 34C165 34 170 33 177 27" className="intro-ornament-fine" />
    </svg>
  );
}

function CoupleProfileIcon({ type }: { type: 'bride' | 'groom' }) {
  return type === 'bride' ? (
    <svg className="couple-profile-icon" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M18 5c-4.4 0-7.5 3.5-7.5 8.3 0 3.2 1.4 5.9 3.7 7.2M18 5c4.4 0 7.5 3.5 7.5 8.3 0 3.2-1.4 5.9-3.7 7.2" />
      <path d="M12.5 9.5C8.4 13.7 7.2 22 6.8 30M23.5 9.5c4.1 4.2 5.3 12.5 5.7 20.5M11 26c2.2 1.2 4.5 1.8 7 1.8s4.8-.6 7-1.8" />
      <path d="M18 4v4M16 6h4" />
    </svg>
  ) : (
    <svg className="couple-profile-icon" viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <path d="M18 13.5 10 9v12l8-4.5L26 21V9l-8 4.5Z" />
      <path d="M15.5 12.2h5v5.6h-5zM18 8V5M13 28h10M18 18v10" />
    </svg>
  );
}

function EventDetailIcon({ type }: { type: 'ceremony' | 'reception' }) {
  return type === 'ceremony' ? (
    <svg className="event-detail-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M8 34V18C8 11.5 12.2 6.8 20 3c7.8 3.8 12 8.5 12 15v16" />
      <path d="M14 34V20c0-3.8 2-6.7 6-9 4 2.3 6 5.2 6 9v14M5 34h30" />
      <path d="M17.5 25.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5 0a4 4 0 1 0 0 8" />
    </svg>
  ) : (
    <svg className="event-detail-icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M20 4v5M13 9h14M10 13h20M8 34h24" />
      <path d="M12 13c0 7.5-2.5 12-6 15h28c-3.5-3-6-7.5-6-15M14 28v6M26 28v6" />
      <path d="M16 18c1.2-1.5 2.5-2.2 4-2.2s2.8.7 4 2.2M18 22h4" />
    </svg>
  );
}

function BotanicalSprig({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 240" fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M42 232C47 186 63 145 71 108C78 72 76 41 91 10" />
      <path d="M48 198C25 189 15 166 18 151C36 155 48 174 48 198ZM56 169C82 165 104 144 105 126C84 128 65 147 56 169ZM64 137C42 128 32 107 35 91C54 98 63 114 64 137ZM72 107C95 97 108 79 106 62C88 67 77 84 72 107ZM77 75C60 67 52 49 56 35C71 43 78 58 77 75ZM82 40C96 36 108 20 105 7C92 12 84 26 82 40Z" />
      <path d="M47 207L28 182M58 165L91 143M66 131L44 108M74 101L96 80M78 69L62 49M86 31L98 16M40 231C30 212 20 202 7 197M68 126C82 116 90 109 96 94" />
      <path d="M7 197L5 186M7 197L17 189M96 94L92 82M96 94L106 87" />
    </svg>
  );
}

function SectionAccents({ dark = false, divider = true }: { dark?: boolean; divider?: boolean }) {
  return (
    <div className={`section-accents${dark ? ' section-accents-dark' : ''}`} aria-hidden="true">
      <div className="section-linen" />
      <BotanicalSprig className="corner-botanical corner-botanical-left" />
      <BotanicalSprig className="corner-botanical corner-botanical-right" />
      {dark && <span className="journey-watermark">SAME HEARTS, ONE JOURNEY</span>}
      {divider && <div className="dried-floral-divider"><BotanicalSprig /></div>}
    </div>
  );
}

export default function GuestSite() {
  const navigate = useNavigate();
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'yes' | 'no' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [likedWishes, setLikedWishes] = useState<number[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [wishSubmitted, setWishSubmitted] = useState(false);
  const [wishName, setWishName] = useState('');
  const [wishMsg, setWishMsg] = useState('');
  const [copiedBank, setCopiedBank] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const [introVisible, setIntroVisible] = useState(false);
  const countdown = useCountdown(WEDDING_DATE);

  useEffect(() => {
    const section = introRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntroVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [envelopeOpen]);

  useEffect(() => {
    if (!envelopeOpen) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.story-section'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [envelopeOpen]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(label);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  if (!envelopeOpen) {
    return (
      <div className="opening-cover min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <img
          src={openingCoverGenerated}
          alt="Angga and Ayu together on the staircase"
          className="opening-cover-photo opening-cover-composed absolute object-cover"
        />
        <div className="opening-cover-overlay absolute inset-0" />
        <div className="opening-cover-grain absolute inset-0" />
        <SectionAccents dark divider={false} />
        <div className="cover-particles" aria-hidden="true">
          {[...Array(10)].map((_, index) => <span key={index} />)}
        </div>

        <style>{`
          @keyframes float { from { transform: translateY(0px) rotate(0deg); } to { transform: translateY(-20px) rotate(10deg); } }
          @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse-gold { 0%, 100% { box-shadow: 0 0 0 0 rgba(184,150,90,0.4); } 50% { box-shadow: 0 0 0 20px rgba(184,150,90,0); } }
        `}</style>

        <div className="opening-cover-content relative z-10 text-center px-6 max-w-lg" style={{ animation: 'fadeUp 1s ease forwards' }}>
          <div className="cover-monogram" aria-hidden="true">A <i>&</i> A</div>
          <div className="cover-kicker text-sm tracking-[0.4em] uppercase mb-8" style={{ color: '#b8965a', fontFamily: 'Outfit, sans-serif' }}>
            Wedding Invitation
          </div>

          <div className="cover-greeting mb-2 text-lg italic" style={{ color: '#d4b896', fontFamily: 'Playfair Display, serif' }}>
            Dear, <span style={{ color: '#e8d5b0' }}>Valued Guest</span>
          </div>

          <h1 className="opening-names text-6xl md:text-8xl mb-8">
            Angga <span>&</span> Ayu
          </h1>

          <div className="cover-date text-base mb-10" style={{ color: '#c8b090', letterSpacing: '0.15em', fontFamily: 'Outfit, sans-serif' }}>
            16 NOVEMBER 2028
          </div>

          <button
            onClick={() => setEnvelopeOpen(true)}
            className="luxury-open-button px-10 py-4 text-sm tracking-widest uppercase transition-all duration-300"
          >
            <svg className="luxury-open-corner luxury-open-corner-tl" viewBox="0 0 58 48" aria-hidden="true">
              <path d="M4 42C8 22 19 9 43 5" />
              <path d="M14 27c-7-1-10-5-10-10 7 0 11 4 10 10ZM24 15c-1-7 2-11 7-13 2 7-1 11-7 13ZM32 10c4-5 9-6 13-4-3 6-8 7-13 4Z" className="luxury-open-leaf" />
            </svg>
            <svg className="luxury-open-corner luxury-open-corner-tr" viewBox="0 0 58 48" aria-hidden="true">
              <path d="M54 41C51 25 43 13 27 8C20 6 15 7 10 10" />
              <path d="M40 21c5-4 10-4 14-1-4 5-9 6-14 1Z" className="luxury-open-leaf" />
              <path d="M18 10c2-6 7-9 12-7 1 6-3 10-9 11M21 14c-3 0-6-1-8-4" className="luxury-open-bud" />
            </svg>
            <svg className="luxury-open-corner luxury-open-corner-bl" viewBox="0 0 58 48" aria-hidden="true">
              <path d="M4 6C8 25 21 39 42 43C50 44 55 40 53 35C51 31 45 32 44 36" />
              <path d="M15 22c-6 1-10-2-12-7 6-2 11 1 12 7ZM27 35c-1 6 2 10 7 12 2-6-1-11-7-12Z" className="luxury-open-leaf" />
            </svg>
            <svg className="luxury-open-corner luxury-open-corner-br" viewBox="0 0 64 52" aria-hidden="true">
              <path d="M60 5C55 26 42 42 18 47" />
              <path d="M51 24c7 0 11 3 12 8-7 2-12-1-12-8ZM39 37c5 3 7 8 5 13-6-2-8-7-5-13ZM48 15c-1-6 2-10 7-12 2 6-1 11-7 12Z" className="luxury-open-leaf" />
              <path d="M23 43c-3-4-2-9 2-12 5 2 6 7 3 11M23 43c-4 1-7 0-10-2" className="luxury-open-bud" />
              <circle cx="24.5" cy="38.5" r="2.1" className="luxury-open-dried-flower" />
            </svg>
            <span className="luxury-open-label">
              Open Invitation
            </span>
          </button>
          <a
            href={`${import.meta.env.BASE_URL}undangan-angga-ayu.pdf`}
            download="Undangan-Angga-Ayu-Desktop.pdf"
            className="cover-download mx-auto mt-6 block w-fit text-sm text-primary underline underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            Unduh PDF
          </a>
        </div>

        <button
          onClick={() => setMusicOn(!musicOn)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110"
          style={{ background: 'rgba(184,150,90,0.2)', border: '1px solid rgba(184,150,90,0.4)', color: '#b8965a' }}
          title={musicOn ? 'Mute music' : 'Play music'}
        >
          {musicOn ? '♪' : '♩'}
        </button>

        <div className="cover-scroll-indicator absolute bottom-6 left-0 right-0 text-center text-xs" style={{ color: 'rgba(200,176,144,0.5)', letterSpacing: '0.2em', fontFamily: 'Outfit, sans-serif' }}>
          Scroll to explore our story
        </div>
      </div>
    );
  }

  return (
    <div ref={mainRef} className="invitation-site min-h-screen" style={{ background: 'var(--background)' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .fade-in { animation: fadeInUp 0.8s ease forwards; }
        .gold-text {
          background: linear-gradient(90deg, #b8965a, #e0c080, #b8965a);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(184,150,90,0.2);
        }
        .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(44,33,24,0.1); }
      `}</style>

      {/* Hero */}
      <section className="cinematic-hero story-section relative h-screen overflow-hidden">
        <img src={preweddingCover} alt="Wedding hero" className="opening-cover-photo absolute object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(44,33,24,0.3) 0%, rgba(44,33,24,0.5) 60%, rgba(44,33,24,0.8) 100%)' }} />
        <SectionAccents dark divider={false} />
        <div className="hero-editorial relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24">
          <div className="hero-monogram fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>A <i>&</i> A</div>
          <div className="hero-kicker text-xs tracking-[0.5em] uppercase mb-6 fade-in" style={{ color: '#d4aa6a', animationDelay: '0.2s', opacity: 0 }}>The Wedding of</div>
          <h1 className="text-6xl md:text-8xl mb-4 fade-in" style={{ color: '#f9f4ee', fontFamily: 'Playfair Display, serif', animationDelay: '0.4s', opacity: 0, lineHeight: 1.1 }}>
            Angga <span className="italic font-normal">& </span>Ayu
          </h1>
          <div className="text-base tracking-[0.3em] uppercase fade-in" style={{ color: '#c8a870', animationDelay: '0.6s', opacity: 0 }}>
            16 · 11 · 2028 — Pekanbaru
          </div>
        </div>

        <button
          onClick={() => setMusicOn(!musicOn)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
        >
          {musicOn ? '♪' : '♩'}
        </button>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex flex-col items-center gap-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span className="text-xs tracking-widest uppercase" style={{ fontSize: '10px' }}>Scroll</span>
            <div className="w-px h-8 animate-bounce" style={{ background: 'rgba(184,150,90,0.6)' }} />
          </div>
        </div>
      </section>

      {/* Islamic Introduction */}
      <section ref={introRef} className={`invitation-intro ${introVisible ? 'is-visible' : ''}`}>
        <SectionAccents dark />
        <div className="intro-grain" aria-hidden="true" />
        <div className="intro-pampas intro-pampas-left" aria-hidden="true" />
        <div className="intro-pampas intro-pampas-right" aria-hidden="true" />

        <div className="intro-card">
          <div className="intro-frame" aria-hidden="true" />
          <div className="intro-quote-stage">
            <div className="intro-reveal intro-monogram" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
              <span>A</span><i>&</i><span>A</span>
            </div>

            <div className="intro-reveal intro-parallax" style={{ '--reveal-delay': '220ms' } as React.CSSProperties}>
              <InvitationOrnament />
            </div>

            <div className="intro-quote">
              <p className="intro-reveal intro-quote-line" style={{ '--reveal-delay': '360ms' } as React.CSSProperties}>
                “Ya Tuhan kami, anugerahkanlah kepada kami pasangan kami
              </p>
              <p className="intro-reveal intro-quote-line" style={{ '--reveal-delay': '510ms' } as React.CSSProperties}>
                dan keturunan kami sebagai penyejuk hati (kami),
              </p>
              <p className="intro-reveal intro-quote-line" style={{ '--reveal-delay': '660ms' } as React.CSSProperties}>
                dan jadikanlah kami pemimpin bagi orang-orang yang bertakwa.”
              </p>
            </div>
            <p className="intro-reveal intro-source" style={{ '--reveal-delay': '790ms' } as React.CSSProperties}>
              QS. Al-Furqan: 74 (penggalan ayat)
            </p>
          </div>

          <div className="intro-message-stage">
            <div className="intro-reveal intro-parallax intro-divider" style={{ '--reveal-delay': '900ms' } as React.CSSProperties}>
              <InvitationOrnament mirrored />
            </div>

            <p className="intro-reveal intro-salutation" style={{ '--reveal-delay': '1030ms' } as React.CSSProperties}>
              Assalamu’alaikum Warahmatullahi Wabarakatuh
            </p>
            <p className="intro-reveal intro-copy" style={{ '--reveal-delay': '1160ms' } as React.CSSProperties}>
              Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta’ala, kami bermaksud
              menyelenggarakan pernikahan putra-putri kami. Tanpa mengurangi rasa hormat,
              kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu.
            </p>

            <div className="intro-reveal intro-parallax intro-bottom-ornament" style={{ '--reveal-delay': '1290ms' } as React.CSSProperties}>
              <InvitationOrnament />
            </div>
          </div>
        </div>
      </section>

      {/* Bride & Groom */}
      <section className="couple-editorial story-section py-24 px-6">
        <SectionAccents />
        <div className="max-w-6xl mx-auto">
          <span className="section-monogram-watermark section-monogram-left" aria-hidden="true">A & A</span>
          <div className="section-heading text-center mb-16">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Meet the Couple</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>
              Two Hearts, One Story
            </h2>
          </div>

          <div className="couple-spread">
            {[
              {
                role: 'The Bride',
                type: 'bride' as const,
                monogram: 'A',
                name: 'Ayu Syafni Zuriyanti',
                photo: UNSPLASH.bride,
                focus: 'center',
                parents: 'Daughter of Mr. Hendra & Mrs. Dewi Kusuma',
                quote: 'In your love, I found the quiet joy of home.',
              },
              {
                role: 'The Groom',
                type: 'groom' as const,
                monogram: 'A',
                name: 'Kahijina Minda Angga Kusuma',
                photo: UNSPLASH.groom,
                focus: 'center',
                parents: 'Son of Mr. Wahyu & Mrs. Rina Firmansyah',
                quote: 'With you, every tomorrow becomes a promise.',
              },
            ].map((person, index) => (
              <article key={person.role} className={`couple-profile ${index === 1 ? 'couple-profile-reverse' : ''}`}>
                <div className="couple-photo">
                  <img src={person.photo} alt={person.name} className="w-full h-full object-cover" style={{ objectPosition: person.focus }} />
                  <span className="couple-photo-inner-frame" aria-hidden="true" />
                  <span className="couple-photo-monogram" aria-hidden="true">{person.monogram}</span>
                </div>
                <div className="couple-copy">
                  <div className="couple-profile-label">
                    <CoupleProfileIcon type={person.type} />
                    <span>{person.role}</span>
                  </div>
                  <h3 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>{person.name}</h3>
                  <div className="couple-signature-line" aria-hidden="true" />
                  <p className="couple-parents text-sm leading-relaxed" style={{ color: '#756552' }}>{person.parents}</p>
                  <span className="couple-with-love" aria-hidden="true">with love</span>
                  <blockquote className="couple-profile-quote">“{person.quote}”</blockquote>
                </div>
              </article>
            ))}
          </div>

          <div className="couple-quote mt-20 text-center py-10 px-8">
            <p className="text-xl italic leading-relaxed" style={{ fontFamily: 'Playfair Display, serif', color: '#5a4a35' }}>
              "Love is composed of a single soul inhabiting two bodies."
            </p>
            <p className="text-xs mt-3 tracking-widest uppercase" style={{ color: '#b8965a' }}>— Aristotle</p>
          </div>
        </div>
      </section>

      {/* Countdown */}
      <section className="countdown-cinematic story-section py-24 px-6 relative overflow-hidden">
        <SectionAccents dark />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Counting Down</div>
          <h2 className="text-4xl mb-12" style={{ fontFamily: 'Playfair Display, serif', color: '#f5ecd8' }}>Until We Say "I Do"</h2>
          <div className="countdown-grid grid grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Minutes', value: countdown.minutes },
              { label: 'Seconds', value: countdown.seconds },
            ].map(({ label, value }) => (
              <div key={label} className="countdown-unit py-8 px-4">
                <div className="text-4xl md:text-5xl font-bold gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {String(value).padStart(2, '0')}
                </div>
                <div className="text-xs tracking-widest uppercase mt-2" style={{ color: 'rgba(184,150,90,0.7)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="events-editorial story-section py-28 px-6">
        <SectionAccents />
        <div className="max-w-5xl mx-auto">
          <span className="section-monogram-watermark section-monogram-right" aria-hidden="true">A & A</span>
          <div className="section-heading text-center mb-20">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Save the Date</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>Wedding Events</h2>
          </div>

          <div className="event-detail-layout">
            <figure className="event-venue-visual">
              <img src={UNSPLASH.eventVenue} alt="Luxury chandelier ballroom with warm ambient lighting" />
              <div className="event-venue-overlay" />
              <figcaption>
                <div className="event-venue-eyebrow">The Celebration Venue</div>
                <h3>The Premier Hotel Pekanbaru</h3>
                <p>Pekanbaru, Riau · Thursday, 16 November 2028</p>
                <small>Venue ambience · Photo by Gloria Lau on Unsplash</small>
              </figcaption>
            </figure>

            <div className="event-timeline">
              {[
                { title: 'Akad Nikah', type: 'ceremony' as const, eyebrow: 'Sacred Ceremony', date: 'Thursday, 16 November 2028', time: '09:00 – 11:00 WIB', venue: 'The Premier Hotel Pekanbaru', address: 'Pekanbaru, Riau' },
                { title: 'Holy Reception', type: 'reception' as const, eyebrow: 'Wedding Reception', date: 'Thursday, 16 November 2028', time: '12:00 – 17:00 WIB', venue: 'The Premier Hotel Pekanbaru', address: 'Pekanbaru, Riau' },
              ].map((event) => (
                <article key={event.title} className="event-entry">
                  <div className="event-marker"><span><EventDetailIcon type={event.type} /></span></div>
                  <div className="event-content">
                    <div className="event-eyebrow text-xs tracking-[0.3em] uppercase mb-3" style={{ color: '#b8965a' }}>{event.eyebrow}</div>
                    <h3 className="text-3xl md:text-4xl mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>{event.title}</h3>
                    <div className="event-meta text-sm">
                      <div><span>Date</span>{event.date}</div>
                      <div><span>Time</span>{event.time}</div>
                    </div>
                    <div className="event-venue mt-6">
                      <div className="font-medium" style={{ color: '#2c2118' }}>{event.venue}</div>
                      <div className="text-sm mt-1" style={{ color: '#8a7a65' }}>{event.address}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="event-note">
            <span className="event-note-monogram" aria-hidden="true">A&A</span>
            <div>
              <div className="event-note-label">A Note for Our Guests</div>
              <p>Please arrive 15 minutes before the ceremony begins. Kindly silence mobile devices during the akad and join us in celebrating with your warmest prayers.</p>
            </div>
          </aside>

          <div className="dress-code flex flex-wrap items-center justify-between gap-6 py-8">
            <div>
              <div className="text-xs tracking-widest uppercase mb-1" style={{ color: '#b8965a' }}>Dress Code</div>
              <p className="font-medium" style={{ color: '#2c2118' }}>Formal — Burgundy, Dark Brown, or Warm Neutrals</p>
            </div>
            <button
              onClick={() => window.open(`https://calendar.google.com/calendar/render?${new URLSearchParams({ action: 'TEMPLATE', text: 'The Wedding of Angga & Ayu', dates: '20281116T020000Z/20281116T100000Z', location: 'The Premier Hotel Pekanbaru, Riau', details: 'Akad Nikah: 09:00–11:00 WIB. Reception: 12:00–17:00 WIB. Dress code: burgundy, dark brown, or warm neutrals.' })}`, '_blank', 'noopener,noreferrer')}
              className="px-6 py-3 text-sm tracking-wide transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #b8965a, #d4aa6a)', color: '#fff', borderRadius: '8px' }}
            >
              + Add to Calendar
            </button>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="venue-editorial story-section py-28 px-6">
        <SectionAccents />
        <div className="max-w-5xl mx-auto">
          <div className="section-heading text-center mb-16">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Find Us</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>Venue & Location</h2>
          </div>
          <div className="venue-spread grid md:grid-cols-2 gap-8">
            <div className="venue-photo relative overflow-hidden">
              <img src={hotelPhoto} alt="Luxury hotel exterior illuminated at night" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(44,33,24,0.6) 0%, transparent 50%)' }} />
              <div className="absolute bottom-4 left-4 text-white">
                <div className="font-semibold">The Premier Hotel Pekanbaru</div>
                <div className="text-sm opacity-80">Hotel exterior · Venue reference</div>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>The Premier Hotel Pekanbaru</h3>
                <p className="text-sm mb-2" style={{ color: '#5a4a35' }}>Pekanbaru, Riau, Indonesia</p>
                <p className="text-sm mb-6" style={{ color: '#8a7a65' }}>Event room and hotel entrance details to follow.</p>
                <div className="venue-map w-full overflow-hidden mb-6" style={{ height: '180px', background: '#e0d8cc' }}>
                  <iframe
                    title="The Premier Hotel Pekanbaru location map"
                    src="https://www.google.com/maps?q=The%20Premier%20Hotel%20Pekanbaru%2C%20Jl.%20Jend.%20Sudirman%20No.389%2C%20Pekanbaru%2C%20Riau&z=16&output=embed"
                    width="100%"
                    height="180"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
              <button
                onClick={() => window.open('https://www.google.com/maps/search/?api=1&query=The%20Premier%20Hotel%20Pekanbaru%2C%20Riau', '_blank', 'noopener,noreferrer')}
                className="w-full py-3 text-sm tracking-wide font-medium transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #b8965a, #d4aa6a)', color: '#fff', borderRadius: '8px' }}
              >
                Open Navigation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Love Story Timeline */}
      <section className="story-timeline-section story-section py-28 px-6">
        <SectionAccents />
        <div className="max-w-2xl mx-auto">
          <div className="section-heading text-center mb-16">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Our Journey</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>Love Story</h2>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: 'linear-gradient(to bottom, transparent, #b8965a, transparent)' }} />
            {timelineEvents.map((event, i) => (
              <div key={event.year} className={`flex items-center mb-12 gap-8 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-1/2 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <div className="text-2xl font-bold gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>{event.year}</div>
                  <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>{event.title}</h3>
                  <p className="text-sm" style={{ color: '#8a7a65' }}>{event.desc}</p>
                </div>
                <div className="relative z-10 w-4 h-4 rounded-full flex-shrink-0" style={{ background: 'linear-gradient(135deg, #b8965a, #d4aa6a)', boxShadow: '0 0 0 4px rgba(184,150,90,0.2)' }} />
                <div className="w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery-editorial story-section py-28 px-6">
        <SectionAccents />
        <div className="max-w-6xl mx-auto">
          <span className="section-monogram-watermark section-monogram-right" aria-hidden="true">A & A</span>
          <div className="gallery-heading mb-16">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Pre-Wedding</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>Gallery</h2>
            <p>Fragments of a love story, captured in quiet light.</p>
          </div>
          <div className="story-gallery curated-gallery">
            {[
              { src: preweddingTogether, label: 'Angga and Ayu', real: true, frame: 1 },
              { src: ringsPhoto, label: 'Wedding rings', real: false, frame: 2 },
              { src: preweddingPortrait, label: 'Angga and Ayu together', real: true, frame: 3 },
              { src: bouquetPhoto, label: 'Wedding bouquet', real: false, frame: 4 },
              { src: preweddingStaircase, label: 'Pre-wedding portrait on the staircase', real: true, frame: 6 },
              { src: venueFloralsPhoto, label: 'Floral arrangement at the wedding venue', real: false, frame: 7 },
              { src: preweddingHandInHand, label: 'Angga and Ayu walking hand in hand', real: true, frame: 8 },
              { src: guestTablePhoto, label: 'Guest table place setting at the venue', real: false, frame: 9 },
              { src: tableDetailPhoto, label: 'Glassware and floral table details', real: false, frame: 10 },
            ].map((image) => (
              <div key={`${image.label}-${image.frame}`} className={`story-frame story-frame-${image.frame}${image.real ? ' story-frame-real gallery-polaroid' : ''}`} onClick={() => setLightboxImg(image.src)}>
                <img src={image.src} alt={image.label} loading="lazy" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="story-gallery-ornament" aria-hidden="true">
              <InvitationOrnament />
            </div>
          </div>
          <div className="text-center mt-10">
            <button className="px-8 py-3 text-sm tracking-wide border transition-all hover:opacity-80" style={{ borderColor: '#b8965a', color: '#b8965a', borderRadius: '8px' }}>
              Share Your Moment ↗
            </button>
          </div>
        </div>
      </section>

      {/* RSVP */}
      <section className="rsvp-editorial story-section py-28 px-6">
        <SectionAccents />
        <div className="rsvp-invitation max-w-2xl mx-auto">
          <div className="section-heading text-center mb-12">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Kindly Reply</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>RSVP</h2>
          </div>

          {rsvpSubmitted ? (
            <div className="text-center py-16">
              <div className="success-monogram">A & A</div>
              <h3 className="text-2xl mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>Thank You!</h3>
              <p style={{ color: '#8a7a65' }}>Your response has been recorded. We look forward to celebrating with you.</p>
            </div>
          ) : (
            <form
              className="rsvp-form space-y-6"
              onSubmit={(e) => { e.preventDefault(); setRsvpSubmitted(true); }}
            >
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#8a7a65' }}>Your Name</label>
                <input type="text" required className="w-full px-4 py-3 text-sm outline-none transition-all" style={{ background: '#faf8f5', border: '1px solid var(--border)', borderRadius: '8px', color: '#2c2118', fontFamily: 'Outfit, sans-serif' }} placeholder="Enter your full name" />
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#8a7a65' }}>Attendance</label>
                <div className="flex gap-3">
                  {['yes', 'no'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRsvpStatus(val as 'yes' | 'no')}
                      className="flex-1 py-3 text-sm tracking-wide transition-all"
                      style={{
                        borderRadius: '8px',
                        border: rsvpStatus === val ? '2px solid #b8965a' : '1px solid var(--border)',
                        background: rsvpStatus === val ? 'linear-gradient(135deg, #b8965a, #d4aa6a)' : '#fff',
                        color: rsvpStatus === val ? '#fff' : '#5a4a35',
                      }}
                    >
                      {val === 'yes' ? '✓ Yes, I will attend' : '✗ Sorry, cannot attend'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#8a7a65' }}>Number of Guests</label>
                <select className="browser-default w-full px-4 py-3 text-sm outline-none" style={{ background: '#faf8f5', border: '1px solid var(--border)', borderRadius: '8px', color: '#2c2118' }}>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} person{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: '#8a7a65' }}>Message (optional)</label>
                <textarea rows={3} className="materialize-textarea w-full px-4 py-3 text-sm outline-none resize-none" style={{ background: '#faf8f5', border: '1px solid var(--border)', borderRadius: '8px', color: '#2c2118', fontFamily: 'Outfit, sans-serif' }} placeholder="Share a kind message..." />
              </div>
              <button type="submit" className="btn waves-effect w-full py-4 text-sm tracking-widest uppercase font-medium transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #b8965a, #d4aa6a)', color: '#fff', borderRadius: '8px' }}>
                Send RSVP
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Wishes */}
      <section className="wishes-editorial story-section py-28 px-6">
        <SectionAccents />
        <div className="max-w-3xl mx-auto">
          <span className="section-monogram-watermark section-monogram-left" aria-hidden="true">A & A</span>
          <div className="section-heading text-center mb-12">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Words of Love</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>Guest Wishes</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {wishes.map((wish, i) => (
              <div key={i} className="wish-note p-6">
                <p className="text-sm leading-relaxed mb-4 italic" style={{ color: '#5a4a35', fontFamily: 'Playfair Display, serif' }}>"{wish.msg}"</p>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm" style={{ color: '#2c2118' }}>{wish.name}</div>
                  <button
                    onClick={() => setLikedWishes(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                    className="flex items-center gap-1 text-xs transition-all hover:scale-110"
                    style={{ color: likedWishes.includes(i) ? '#b8965a' : '#8a7a65' }}
                  >
                    ♥ {wish.hearts + (likedWishes.includes(i) ? 1 : 0)}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {wishSubmitted ? (
            <div className="text-center py-8">
              <div className="success-monogram">A & A</div>
              <p style={{ color: '#8a7a65' }}>Your wish has been added. Thank you!</p>
            </div>
          ) : (
            <form
              className="wish-form p-6 space-y-4"
              onSubmit={(e) => { e.preventDefault(); setWishSubmitted(true); }}
            >
              <input type="text" required value={wishName} onChange={e => setWishName(e.target.value)} className="w-full px-4 py-3 text-sm outline-none" style={{ background: '#faf8f5', border: '1px solid var(--border)', borderRadius: '8px', color: '#2c2118', fontFamily: 'Outfit, sans-serif' }} placeholder="Your name" />
              <textarea required rows={3} value={wishMsg} onChange={e => setWishMsg(e.target.value)} className="materialize-textarea w-full px-4 py-3 text-sm outline-none resize-none" style={{ background: '#faf8f5', border: '1px solid var(--border)', borderRadius: '8px', color: '#2c2118', fontFamily: 'Outfit, sans-serif' }} placeholder="Write your wish here..." />
              <button type="submit" className="btn waves-effect w-full py-3 text-sm tracking-wide transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #b8965a, #d4aa6a)', color: '#fff', borderRadius: '8px' }}>
                Send Wish ♥
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Digital Gift */}
      <section className="gift-editorial story-section py-28 px-6">
        <SectionAccents dark />
        <div className="max-w-3xl mx-auto">
          <span className="section-monogram-watermark section-monogram-right" aria-hidden="true">A & A</span>
          <div className="section-heading text-center mb-12">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Wedding Gift</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>Send a Gift</h2>
            <p className="text-sm mt-3" style={{ color: '#8a7a65' }}>Your presence is the greatest gift. But if you wish to give more…</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { bank: 'BCA', account: '1234567890', name: 'Kahijina Minda Angga Kusuma' },
              { bank: 'Mandiri', account: '0987654321', name: 'Ayu Syafni Zuriyanti' },
              { bank: 'QRIS', account: 'QR Code', name: 'Scan to Pay' },
            ].map((gift) => (
              <div key={gift.bank} className={`gift-slip p-6 text-center ${gift.bank === 'QRIS' ? 'gift-slip-qr' : ''}`}>
                <div className="text-2xl font-bold mb-1 gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>{gift.bank}</div>
                <div className="text-xs mb-1" style={{ color: '#8a7a65' }}>{gift.name}</div>
                {gift.bank === 'QRIS' && (
                  <div className="gift-qr" aria-label="Decorative QR code frame">
                    {[...Array(49)].map((_, index) => <i key={index} className={(index % 3 === 0 || index % 8 === 0 || [9, 10, 16, 24, 32, 38, 39].includes(index)) ? 'filled' : ''} />)}
                  </div>
                )}
                <div className="text-sm font-mono mb-4" style={{ color: '#2c2118', background: '#faf8f5', padding: '8px', borderRadius: '6px' }}>{gift.account}</div>
                <button
                  onClick={() => handleCopy(gift.account, gift.bank)}
                  className="w-full py-2 text-xs tracking-wide transition-all hover:opacity-80"
                  style={{ border: '1px solid #b8965a', borderRadius: '6px', background: copiedBank === gift.bank ? '#b8965a' : 'transparent', color: copiedBank === gift.bank ? '#fff' : '#b8965a' }}
                >
                  {copiedBank === gift.bank ? 'Copied!' : 'Copy Number'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-editorial story-section py-28 px-6">
        <SectionAccents />
        <div className="max-w-2xl mx-auto">
          <div className="section-heading text-center mb-12">
            <div className="text-xs tracking-[0.4em] uppercase mb-3" style={{ color: '#b8965a' }}>Questions & Answers</div>
            <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Playfair Display, serif', color: '#2c2118' }}>FAQ</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((faq, i) => (
              <div key={i} className="faq-row overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left transition-all"
                  style={{ color: '#2c2118' }}
                >
                  <span className="font-medium text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>{faq.q}</span>
                  <span className="text-lg transition-transform duration-300" style={{ color: '#b8965a', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: '#5a4a35' }}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="closing-cinematic story-section py-28 px-6 text-center">
        <SectionAccents dark divider={false} />
        <div className="closing-monogram">A <i>&</i> A</div>
        <div className="text-xs tracking-[0.4em] uppercase mb-4" style={{ color: '#b8965a' }}>With Love</div>
        <h2 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#f5ecd8' }}>
          Angga & Ayu
        </h2>
        <p className="text-sm mb-8" style={{ color: '#c8a870' }}>16 November 2028 · Pekanbaru, Indonesia</p>
        <InvitationOrnament />
        <div className="mt-10 pt-8" style={{ borderTop: '1px solid rgba(184,150,90,0.2)' }}>
          <button onClick={() => navigate('/admin/login')} className="text-xs tracking-widest uppercase transition-all hover:opacity-100" style={{ color: 'rgba(184,150,90,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>
            Admin Portal
          </button>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.9)' }}
          onClick={() => setLightboxImg(null)}
        >
          <img src={lightboxImg} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" />
          <button className="absolute top-6 right-6 text-white text-3xl hover:opacity-80" onClick={() => setLightboxImg(null)}>✕</button>
        </div>
      )}
    </div>
  );
}
