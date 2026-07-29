// 1. Initialize Supabase
const { createClient } = supabase;

const supabaseUrl = 'https://mwqxolqhixjgoqivmcor.supabase.co';
const supabaseKey = 'sb_publishable_922Js1DXmj8ZbtfctVPckQ_xWW7rSRn';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// 2. Helper function to prevent quotes from breaking the HTML structure
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 3. Global Function to Toggle "Read More / Read Less" exactly by characters
window.toggleTextByChar = function(elementId, btnElement) {
    const textEl = document.getElementById(elementId);
    if (!textEl) return;

    const isTruncated = textEl.getAttribute('data-is-truncated') === 'true';
    
    if (isTruncated) {
        // Expand the text
        textEl.innerText = '"' + textEl.getAttribute('data-fulltext') + '"';
        textEl.setAttribute('data-is-truncated', 'false');
        btnElement.innerText = 'Read Less';
    } else {
        // Collapse the text
        textEl.innerText = '"' + textEl.getAttribute('data-truncated') + '"';
        textEl.setAttribute('data-is-truncated', 'true');
        btnElement.innerText = 'Read More';
    }
}

// 4. Function to fetch data from Supabase and render Feedback
async function loadTestimonials() {
    const container = document.getElementById('testimonials-container');
    if (!container) return; 

    // Fetch ONLY 3 feedbacks, newest first
    const { data: feedbackData, error } = await supabaseClient
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error("Error fetching testimonials:", error);
        return;
    }

    // Generate HTML for each feedback item
    const testimonialsHTML = feedbackData.map((feedback, index) => {
        const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
        const reviewId = `fb-review-${index}`;
        
        // Character Truncation Logic
        const fullText = feedback.review || "";
        const isLongText = fullText.length > 100;
        const truncatedText = isLongText ? fullText.substring(0, 100) + '...' : fullText;

        return `
            <div class="bg-white p-8 rounded-2xl text-center space-y-4 shadow-sm border border-gray-50 flex flex-col justify-between">
                <div>
                    <div class="w-16 h-16 rounded-full mx-auto overflow-hidden bg-cover bg-center mb-2" style="background-image: url('${feedback.image}');"></div>
                    <div class="text-yellow-400 text-sm tracking-widest">${stars}</div>
                    
                    <!-- Review Text with Character Limits -->
                    <p id="${reviewId}" 
                       data-fulltext="${escapeHTML(fullText)}" 
                       data-truncated="${escapeHTML(truncatedText)}" 
                       data-is-truncated="true"
                       class="text-[11px] md:text-xs text-gray-500 italic leading-relaxed font-medium mt-3 transition-all duration-300">
                        "${truncatedText}"
                    </p>

                    ${isLongText ? `
                        <button onclick="toggleTextByChar('${reviewId}', this)" class="text-[11px] text-purple-600 font-bold mt-1 hover:underline focus:outline-none">
                            Read More
                        </button>
                    ` : ''}
                </div>

                <h5 class="font-bold text-[10px] ${feedback.nameColor} uppercase tracking-widest mt-4">— ${feedback.name}</h5>
            </div>
        `;
    }).join('');

    // Inject into the DOM
    container.innerHTML = testimonialsHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    // Load testimonials on page load
    loadTestimonials();
    
    // Form submission logic
    const feedbackForm = document.getElementById('feedback-form');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const userName = document.getElementById('fb-name').value;
            const userRating = parseInt(document.getElementById('fb-rating').value);
            const userReview = document.getElementById('fb-review').value;

            const themeColors = [
                { ring: "ring-purple-100", text: "text-purple-600" },
                { ring: "ring-pink-100", text: "text-pink-600" },
                { ring: "ring-cyan-100", text: "text-cyan-600" },
                { ring: "ring-green-100", text: "text-green-600" }
            ];
            const randomTheme = themeColors[Math.floor(Math.random() * themeColors.length)];

            // Human silhouette image
            const newFeedback = {
                name: userName,
                rating: userRating,
                review: userReview,
                ringColor: randomTheme.ring,
                nameColor: randomTheme.text,
                image: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' 
            };

            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Saving...";
            submitBtn.disabled = true;

            let msgDiv = document.getElementById('form-feedback-msg');
            if (!msgDiv) {
                msgDiv = document.createElement('div');
                msgDiv.id = 'form-feedback-msg';
                feedbackForm.appendChild(msgDiv);
            }

            const { error } = await supabaseClient
                .from('feedback')
                .insert([newFeedback]);

            if (error) {
                console.error("Error saving feedback:", error);
                msgDiv.className = 'mt-4 text-center font-semibold text-sm text-red-500';
                msgDiv.innerText = "There was an error saving your feedback. Please try again.";
            } else {
                loadTestimonials();
                feedbackForm.reset(); 
                
                msgDiv.className = 'mt-4 text-center font-semibold text-sm text-green-600 tracking-wide';
                msgDiv.innerText = "Submitted successfully!";
                
                setTimeout(() => {
                    msgDiv.innerText = "";
                }, 4000);
            }

            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        });
    }
});