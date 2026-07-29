// 1. Initialize Supabase
const { createClient } = supabase;

const supabaseUrl = 'https://mwqxolqhixjgoqivmcor.supabase.co';
const supabaseKey = 'sb_publishable_922Js1DXmj8ZbtfctVPckQ_xWW7rSRn';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Helper function for HTML escaping
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Global Function to Toggle "Read More / Read Less" exactly by characters
window.toggleTextByChar = function(elementId, btnElement) {
    const textEl = document.getElementById(elementId);
    if (!textEl) return;

    const isTruncated = textEl.getAttribute('data-is-truncated') === 'true';
    
    if (isTruncated) {
        textEl.innerText = '"' + textEl.getAttribute('data-fulltext') + '"';
        textEl.setAttribute('data-is-truncated', 'false');
        btnElement.innerText = 'Read Less';
    } else {
        textEl.innerText = '"' + textEl.getAttribute('data-truncated') + '"';
        textEl.setAttribute('data-is-truncated', 'true');
        btnElement.innerText = 'Read More';
    }
}

// Setup Carousel Navigation (Unified horizontal track for Mobile and Desktop)
function setupCarousel(totalCards) {
    const container = document.getElementById('testimonials-container');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!container || !dotsContainer) return;

    let currentIndex = 0;

    // Generate dots
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalCards; i++) {
        const dot = document.createElement('button');
        dot.className = `h-2 rounded-full transition-all duration-300 ${i === 0 ? 'w-6 bg-purple-950' : 'w-2 bg-gray-300'}`;
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => {
            currentIndex = i;
            const cards = container.children;
            if (cards.length === 0) return;
            const cardWidth = cards[0].offsetWidth;
            const style = window.getComputedStyle(container);
            const gap = parseInt(style.gap) || 24;
            
            container.scrollTo({ left: currentIndex * (cardWidth + gap), behavior: 'smooth' });
        });
        dotsContainer.appendChild(dot);
    }

    const updateActiveDot = () => {
        const cards = container.children;
        if (cards.length === 0) return;
        const cardWidth = cards[0].offsetWidth;
        const style = window.getComputedStyle(container);
        const gap = parseInt(style.gap) || 24;
        
        currentIndex = Math.round(container.scrollLeft / (cardWidth + gap));
        const dots = dotsContainer.children;
        for (let i = 0; i < dots.length; i++) {
            if (dots[i]) {
                dots[i].className = `h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-purple-950' : 'w-2 bg-gray-300'}`;
            }
        }
    };

    container.removeEventListener('scroll', updateActiveDot); // Prevent duplicate listeners
    container.addEventListener('scroll', updateActiveDot);
}

// Fetch data from Supabase and render Feedback
async function loadTestimonials() {
    const container = document.getElementById('testimonials-container');
    if (!container) {
        console.warn("Testimonials container not found on this page.");
        return; 
    }

    // Force container styles via JS to override any conflicting HTML grid layout classes
    container.style.display = 'flex';
    container.style.flexWrap = 'nowrap';
    container.style.overflowX = 'auto';
    container.style.gap = '24px';
    container.style.scrollSnapType = 'x mandatory';
    container.style.scrollbarWidth = 'none'; // Hide scrollbar for clean look

    try {
        const { data: feedbackData, error } = await supabaseClient
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(12);

        if (error) throw error;

        if (!feedbackData || feedbackData.length === 0) {
            container.innerHTML = "<p class='text-gray-500 text-sm'>No feedback yet. Be the first!</p>";
            return;
        }

        const testimonialsHTML = feedbackData.map((feedback, index) => {
            const safeRating = feedback.rating ? parseInt(feedback.rating) : 5;
            const stars = '★'.repeat(safeRating) + '☆'.repeat(5 - safeRating);
            const reviewId = `fb-review-${index}`;
            
            const fullText = feedback.review || "";
            const isLongText = fullText.length > 100;
            const truncatedText = isLongText ? fullText.substring(0, 100) + '...' : fullText;

            return `
                <div class="bg-white p-8 rounded-2xl text-center space-y-4 shadow-sm border border-gray-50 flex flex-col justify-between flex-shrink-0 w-[300px] sm:w-[350px] snap-center">
                    <div>
                        <div class="w-16 h-16 rounded-full mx-auto overflow-hidden bg-cover bg-center mb-2" style="background-image: url('${feedback.image || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}');"></div>
                        <div class="text-yellow-400 text-sm tracking-widest">${stars}</div>
                        
                        <p id="${reviewId}" 
                           data-fulltext="${escapeHTML(fullText)}" 
                           data-truncated="${escapeHTML(truncatedText)}" 
                           data-is-truncated="true"
                           class="text-[11px] md:text-xs text-gray-500 italic leading-relaxed font-medium mt-3 transition-all duration-300">
                            "${truncatedText}"
                        </p>

                        ${isLongText ? `
                            <button type="button" onclick="toggleTextByChar('${reviewId}', this)" class="text-[11px] text-purple-600 font-bold mt-1 hover:underline focus:outline-none">
                                Read More
                            </button>
                        ` : ''}
                    </div>
                    <h5 class="font-bold text-[10px] ${feedback.nameColor || 'text-gray-800'} uppercase tracking-widest mt-4">— ${feedback.name || 'Anonymous'}</h5>
                </div>
            `;
        }).join('');

        container.innerHTML = testimonialsHTML;
        setupCarousel(feedbackData.length);
    } catch (err) {
        console.error("Supabase Fetch Error:", err);
        container.innerHTML = "<p class='text-red-400 text-sm'>Could not load feedback at this time.</p>";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadTestimonials();
    
    const feedbackForm = document.getElementById('feedback-form');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            let msgDiv = document.getElementById('form-feedback-msg');
            if (!msgDiv) {
                msgDiv = document.createElement('div');
                msgDiv.id = 'form-feedback-msg';
                feedbackForm.appendChild(msgDiv);
            }

            const nameInput = document.getElementById('fb-name');
            const ratingInput = document.getElementById('fb-rating');
            const reviewInput = document.getElementById('fb-review');

            if (!nameInput || !reviewInput || !nameInput.value.trim() || !reviewInput.value.trim()) {
                msgDiv.className = 'mt-4 text-center font-bold text-sm text-red-500';
                msgDiv.innerText = "Please fill out all fields before submitting.";
                return;
            }

            const userName = nameInput.value.trim();
            const userRating = ratingInput ? parseInt(ratingInput.value) : 5;
            const userReview = reviewInput.value.trim();

            const themeColors = [
                { ring: "ring-purple-100", text: "text-purple-600" },
                { ring: "ring-pink-100", text: "text-pink-600" },
                { ring: "ring-cyan-100", text: "text-cyan-600" },
                { ring: "ring-green-100", text: "text-green-600" }
            ];
            const randomTheme = themeColors[Math.floor(Math.random() * themeColors.length)];

            const newFeedback = {
                name: userName,
                rating: userRating || 5, 
                review: userReview,
                ringColor: randomTheme.ring,
                nameColor: randomTheme.text,
                image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' 
            };

            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerText : "Submit";
            
            if (submitBtn) {
                submitBtn.innerText = "Saving...";
                submitBtn.disabled = true;
            }

            try {
                const { error } = await supabaseClient
                    .from('feedback')
                    .insert([newFeedback]);

                if (error) throw error; 

                loadTestimonials();
                feedbackForm.reset(); 
                
                msgDiv.className = 'mt-4 text-center font-bold text-sm text-green-600 tracking-wide';
                msgDiv.innerText = "Submitted successfully!";
                
                setTimeout(() => {
                    msgDiv.innerText = "";
                }, 4000);

            } catch (error) {
                console.error("Supabase Insert Error:", error);
                msgDiv.className = 'mt-4 text-center font-bold text-sm text-red-500';
                msgDiv.innerText = `Error: ${error.message || "Failed to save feedback."}`;
            } finally {
                if (submitBtn) {
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                }
            }
        });
    }
});