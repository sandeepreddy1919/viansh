import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 1. Initialize Supabase
const SUPABASE_URL = 'https://aakrdcywvqebosezmuuu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IeskKLdjrWVkh0hELe5X8Q_D43AwIkY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Register GSAP ScrollTrigger plugin safely
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// 2. The 13 Layout Slots (Calibrated with proper gaps, outer ones allowed to gracefully crop/cut)
const layoutSlots = [
  // --- COLUMN 3: THE MIDDLE (3 Images) ---
  { x: '0vw',   y: '0vh',   scale: 0.735, rot: 0 },   // True Center (Behind main text)
  { x: '0vw',   y: '-29.4vh', scale: 0.665, rot: -2 },  // Top Center
  { x: '0vw',   y: '29.4vh',  scale: 0.665, rot: 2 },   // Bottom Center

  // --- COLUMN 2 & 4: INNER SIDES (2 on Left, 2 on Right) ---
  { x: '-15.4vw', y: '-16.8vh', scale: 0.63,  rot: -3 },  // Inner Left Top
  { x: '-15.4vw', y: '16.8vh',  scale: 0.7,   rot: 2 },   // Inner Left Bottom
  { x: '15.4vw',  y: '-16.8vh', scale: 0.7,   rot: 3 },   // Inner Right Top
  { x: '15.4vw',  y: '16.8vh',  scale: 0.63,  rot: -2 },  // Inner Right Bottom

  // --- COLUMN 1 & 5: FAR SIDES (3 on Left, 3 on Right - Outer edges bleed/cut cleanly) ---
  { x: '-32.2vw', y: '-28vh', scale: 0.805, rot: -5 },  // Far Left Top
  { x: '-32.2vw', y: '0vh',   scale: 0.84,  rot: 2 },   // Far Left Middle
  { x: '-32.2vw', y: '28vh',  scale: 0.805, rot: -4 },  // Far Left Bottom
  { x: '32.2vw',  y: '-28vh', scale: 0.805, rot: 5 },   // Far Right Top
  { x: '32.2vw',  y: '0vh',   scale: 0.84,  rot: -2 },  // Far Right Middle
  { x: '32.2vw',  y: '28vh',  scale: 0.805, rot: 4 },   // Far Right Bottom
];

// 3. Main Animation Function
async function initHeroAnimation() {
  const deck = document.getElementById('dynamic-image-deck');
  if (!deck) return;

  // Fetch Images from Supabase
  const { data: media, error } = await supabase
    .from('hero_cards')
    .select('media_url, media_type')
    .limit(layoutSlots.length); 

  if (error) {
    console.error("Supabase Error:", error);
    return;
  }
  
  if (!media || media.length === 0) {
    console.warn("No images found in the database.");
    return;
  }

  // Inject Images into DOM (Stacked in the center, transparent & scaled down)
  deck.innerHTML = media.map((item) => `
    <div class="hero-anim-card absolute w-56 md:w-72 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/10 opacity-0 scale-50">
      ${item.media_type === 'video' 
        ? `<video src="${item.media_url}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>` 
        : `<img src="${item.media_url}" class="w-full h-full object-cover" />`}
    </div>
  `).join('');

  // 4. Build the GSAP Scroll Timeline
  const cards = gsap.utils.toArray('.hero-anim-card');
  
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "#hero-scroll-wrapper",
      start: "top top",
      end: "bottom bottom",
      scrub: 1, // Smooth scrolling transition
    }
  });

  // ANIMATION SEQUENCE:
  
  // Step A: Fade out intro text
  tl.to("#intro-text", { opacity: 0, y: -50, scale: 0.9, duration: 1 });

  // Step B: Pop the very first image (True Center) into view
  if (cards[0]) {
    tl.to(cards[0], { opacity: 1, scale: 1.1, duration: 1 }, "-=0.5");
  }

  // Step C: Make all other cards fully visible, stacked behind the first card
  tl.set(cards.slice(1), { opacity: 1 });

  // Step D: Explode cards outwards simultaneously to their 13 assigned slots
  cards.forEach((card, i) => {
    if (!layoutSlots[i]) return; 
    
    tl.to(card, {
      x: layoutSlots[i].x,
      y: layoutSlots[i].y,
      rotation: layoutSlots[i].rot,
      scale: layoutSlots[i].scale,
      duration: 3,
      ease: "power2.inOut"
    }, "explode_label"); 
  });

  // Step E: Fade in the massive central brand text right as cards finish expanding
  tl.to("#main-brand-text", { 
    opacity: 1, 
    scale: 1, 
    duration: 2 
  }, "explode_label+=1.5");

  // Step F: FIX AT THE END (Hold final layout state securely during scroll duration)
  tl.to({}, { duration: 2.5 });
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initHeroAnimation);