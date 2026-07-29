// 1. Initialize Supabase
const { createClient } = supabase;

const supabaseUrl = 'https://mwqxolqhixjgoqivmcor.supabase.co';
const supabaseKey = 'sb_publishable_922Js1DXmj8ZbtfctVPckQ_xWW7rSRn';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// 2. Function to fetch data from Supabase and render it
async function loadTestimonials() {
    const container = document.getElementById('testimonials-container');
    if (!container) return; 

    // Fetch data from the 'testimonials' table
    const { data: feedbackData, error } = await supabaseClient
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching testimonials:", error);
        return;
    }

    // Generate HTML for each feedback item exactly like the screenshot
    const testimonialsHTML = feedbackData.map(feedback => {
        const stars = '★'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);

        return `
            <div class="bg-white p-8 rounded-2xl text-center space-y-4 shadow-sm border border-gray-50">
                <div class="w-16 h-16 rounded-full mx-auto overflow-hidden bg-cover bg-center" style="background-image: url('${feedback.image}');"></div>
                <div class="text-yellow-400 text-sm tracking-widest">${stars}</div>
                <p class="text-[11px] md:text-xs text-gray-500 italic leading-relaxed font-medium">"${feedback.review}"</p>
                <h5 class="font-bold text-[10px] ${feedback.nameColor} uppercase tracking-widest">— ${feedback.name}</h5>
            </div>
        `;
    }).join('');

    // Inject into the DOM
    container.innerHTML = testimonialsHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    // 3. Load testimonials from Supabase when the page loads
    loadTestimonials();
    
    // 4. Form submission logic
    const feedbackForm = document.getElementById('feedback-form');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(event) {
            event.preventDefault(); // Prevent page refresh

            // Get values from the form
            const userName = document.getElementById('fb-name').value;
            const userRating = parseInt(document.getElementById('fb-rating').value);
            const userReview = document.getElementById('fb-review').value;

            // Pick a random color theme for the name
            const themeColors = [
                { ring: "ring-purple-100", text: "text-purple-600" },
                { ring: "ring-pink-100", text: "text-pink-600" },
                { ring: "ring-cyan-100", text: "text-cyan-600" },
                { ring: "ring-green-100", text: "text-green-600" }
            ];
            const randomTheme = themeColors[Math.floor(Math.random() * themeColors.length)];

            // Create the new feedback object
            const newFeedback = {
                name: userName,
                rating: userRating,
                review: userReview,
                ringColor: randomTheme.ring,
                nameColor: randomTheme.text,
                image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}&backgroundColor=f0fdf4,fdf2f8,faf5ff`
            };

            // Change button text to show it's loading
            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "Saving...";
            submitBtn.disabled = true;

            // 5. Insert the new data into Supabase
            const { error } = await supabaseClient
                .from('testimonials')
                .insert([newFeedback]);

            if (error) {
                console.error("Error saving feedback:", error);
                alert("There was an error saving your feedback. Please try again.");
            } else {
                // If successful, reload the testimonials to show the new one
                loadTestimonials();
                feedbackForm.reset(); // Clear the form
                alert("Thank you! Your feedback has been posted permanently.");
            }

            // Reset button state
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        });
    }
});