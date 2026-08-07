// events.js

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://nzlnilejmrsmvaambkip.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sDau1lh7K-BZmQKs8OEA2A_xmmtg6pO';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Intersection Observer for Entrance Animations
const revealItemsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, { root: null, threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

// --- DYNAMIC EVENTS GRID LOADING ---
async function loadDynamicEventsGrid() {
    // 1. Target the correct ID from your index.html
    const gridContainer = document.getElementById('event-grid-container');
    if (!gridContainer) {
        console.error('Could not find event-grid-container');
        return;
    }

    // 2. Fetch data from Supabase
    const { data: events, error } = await supabase
        .from('eventsgrid')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Supabase Error loading events:', error);
        return;
    }

    // 3. Create the Static Logo Card HTML
    const logoCard = `
        <div class="reveal-item bento-item bg-white rounded-2xl border-4 border-white shadow-md aspect-[1/1.1] md:aspect-square flex flex-col items-center justify-center p-4 text-center select-none col-span-1">
            <h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tighter mb-1">Viansh.</h2>
            <div class="w-8 h-1 bg-black rounded-full mb-3"></div>
            <p class="text-[9px] sm:text-xs text-gray-400 max-w-[140px] uppercase tracking-widest font-semibold">Events</p>
        </div>
    `;

    // 4. Handle Empty Database Fallback
    if (!events || events.length === 0) {
        gridContainer.innerHTML = logoCard;
        revealItemsObserver.observe(gridContainer.querySelector('.reveal-item'));
        return;
    }

    // 5. Generate Dynamic Cards HTML
    const dynamicCards = events.map(event => `
        <div class="reveal-item bento-item bg-white rounded-2xl overflow-hidden shadow-md border-4 border-white aspect-[1/1.1] md:aspect-square relative group cursor-pointer" onclick="window.location.href='${event.details_url_hash}'">
            <img src="${event.image_url}" alt="${event.title}" 
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onload="this.parentElement.classList.add('loaded')"
                onerror="this.src='images/placeholder.png'">
            <div class="absolute inset-x-0 top-0 h-[60%] bg-gradient-to-b from-black/75 via-black/20 to-transparent"></div>
            <h3 class="absolute top-4 left-4 text-base sm:text-xl md:text-2xl font-extrabold text-white tracking-tight leading-tight">${event.title}</h3>
            ${event.registration_url ? `<button onclick="event.stopPropagation(); window.open('${event.registration_url}', '_blank')" class="absolute bottom-3 right-3 bg-white/20 hover:bg-white text-white hover:text-black backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] sm:text-xs font-bold tracking-wide uppercase transition-all duration-300 shadow-lg">Register</button>` : ''}
        </div>
    `).join('');

    // 6. Inject Directly into Grid (Combining Logo + Dynamic Cards)
    gridContainer.innerHTML = logoCard + dynamicCards;

    // 7. Observe new dynamically generated items for animations
    const newRevealItems = gridContainer.querySelectorAll('.reveal-item');
    newRevealItems.forEach(item => revealItemsObserver.observe(item));
}

// MAIN INITIALIZATION ON DOM LOAD
document.addEventListener("DOMContentLoaded", () => {
    // Only call the database fetching function here. 
    // Scroll tracking logic remains safely inside your indexjs.js file.
    loadDynamicEventsGrid();
});