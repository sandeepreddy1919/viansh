import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 1. Initialize Supabase
const SUPABASE_URL = 'https://aakrdcywvqebosezmuuu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_IeskKLdjrWVkh0hELe5X8Q_D43AwIkY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Register GSAP ScrollTrigger plugin safely
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// 2. Responsive Layout Slots (Dynamically scales for mobile to prevent getting stuck)
const isMobile = window.innerWidth < 768;
const sMod = isMobile ? 0.55 : 1; // Shrink card size by 45% on mobile
const yMod = isMobile ? 0.8 : 1;  // Compress vertical spread slightly on mobile
const xMod = isMobile ? 1.2 : 1;  // Expand horizontal spread slightly to utilize mobile width

const layoutSlots = [
  // --- COLUMN 3: THE MIDDLE (3 Images) ---
  { x: '0vw',   y: '0vh',   scale: 0.735 * sMod, rot: 0 },   
  { x: '0vw',   y: `${-29.4 * yMod}vh`, scale: 0.665 * sMod, rot: -2 },  
  { x: '0vw',   y: `${29.4 * yMod}vh`,  scale: 0.665 * sMod, rot: 2 },   
          
  // --- COLUMN 2 & 4: INNER SIDES (2 on Left, 2 on Right) ---
  { x: `${-15.4 * xMod}vw`, y: `${-16.8 * yMod}vh`, scale: 0.63 * sMod,  rot: -3 },  
  { x: `${-15.4 * xMod}vw`, y: `${16.8 * yMod}vh`,  scale: 0.7 * sMod,   rot: 2 },   
  { x: `${15.4 * xMod}vw`,  y: `${-16.8 * yMod}vh`, scale: 0.7 * sMod,   rot: 3 },   
  { x: `${15.4 * xMod}vw`,  y: `${16.8 * yMod}vh`,  scale: 0.63 * sMod,  rot: -2 },  

  // --- COLUMN 1 & 5: FAR SIDES (Outer edges) ---
  { x: `${-32.2 * xMod}vw`, y: `${-42 * yMod}vh`, scale: 0.72 * sMod, rot: -5 },  
  { x: `${-32.2 * xMod}vw`, y: '0vh',   scale: 0.75 * sMod, rot: 2 },   
  { x: `${-32.2 * xMod}vw`, y: `${42 * yMod}vh`,  scale: 0.72 * sMod, rot: -4 },  
  { x: `${32.2 * xMod}vw`,  y: `${-42 * yMod}vh`, scale: 0.72 * sMod, rot: 5 },   
  { x: `${32.2 * xMod}vw`,  y: '0vh',   scale: 0.75 * sMod, rot: -2 },  
  { x: `${32.2 * xMod}vw`,  y: `${42 * yMod}vh`,  scale: 0.72 * sMod, rot: 4 },   
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

  // Inject Images into DOM (Stacked in the center, stylized with a dark green and gold framed "board")
  deck.innerHTML = media.map((item) => `
    <div class="hero-anim-card absolute w-56 md:w-72 aspect-[4/5] rounded-3xl opacity-0 scale-50 z-30 overflow-visible">
      <!-- The Stylized Board Surface with dark green and gold border matching the overall luxury theme -->
      <div class="card-board absolute inset-0 bg-[#004d3d] rounded-3xl border-2 border-[#ffda6d]/80 shadow-3xl">
        <!-- Internal Gold Detail lines on the board -->
        <div class="board-detail absolute left-3 top-3 right-3 h-[2px] bg-[#ffda6d]/40"></div>
        <div class="board-detail absolute left-3 bottom-3 right-3 h-[2px] bg-[#ffda6d]/40"></div>
        <div class="board-detail absolute top-3 left-3 bottom-3 w-[2px] bg-[#ffda6d]/40"></div>
        <div class="board-detail absolute top-3 right-3 bottom-3 w-[2px] bg-[#ffda6d]/40"></div>

        <!-- Stylized mount for the image/video, framed with a thick gold border -->
        <div class="image-mount absolute inset-5 md:inset-6 border-4 border-[#ffda6d] rounded-2xl overflow-hidden shadow-inner">
          ${item.media_type === 'video' 
            ? `<video src="${item.media_url}" autoplay loop muted playsinline class="w-full h-full object-cover"></video>` 
            : `<img src="${item.media_url}" class="w-full h-full object-cover" />`}
        </div>
      </div>
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