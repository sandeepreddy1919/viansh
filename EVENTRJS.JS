// 1. Initialize Supabase
const supabaseUrlReg = 'https://pduejtjmpvlhsqblviff.supabase.co';
const supabaseKeyReg = 'sb_publishable_XEqvPJ-kQujXK0ONksCexA_r4NaUW99'; 
const supabaseClientReg = window.supabase.createClient(supabaseUrlReg, supabaseKeyReg);

const supabaseUrlEv = 'https://nzlnilejmrsmvaambkip.supabase.co';
const supabaseKeyEv = 'sb_publishable_sDau1lh7K-BZmQKs8OEA2A_xmmtg6pO'; 
const supabaseClientEv = window.supabase.createClient(supabaseUrlEv, supabaseKeyEv);

// Object to store details of the currently selected workshop, now including price
let selectedWorkshop = {
    title: "",
    date: "",
    location: "",
    price: 0 // <-- Added price tracking
};

// 2. Fetch Events dynamically from Supabase
async function fetchEvents() {
    try {
        const { data: events, error } = await supabaseClientEv
            .from('events') 
            .select('*');

        const container = document.getElementById('events-container');
        const loadingText = document.getElementById('loading-text');

        if (error) {
            console.error('Error fetching events:', error);
            if (loadingText) {
                loadingText.innerText = "Failed to load events.";
                loadingText.style.display = 'block';
            }
            return;
        }

        if (loadingText) loadingText.style.display = 'none';

        if (!events || events.length === 0) {
            if (loadingText) {
                loadingText.style.display = 'block';
                loadingText.innerText = "No upcoming workshops found.";
            }
            return;
        }

        let htmlContent = "";

        events.forEach(event => {
            const safeTitle = event.title ? event.title.replace(/"/g, '&quot;') : '';
            const safeDate = event.date ? event.date.replace(/"/g, '&quot;') : '';
            const safeLocation = event.location ? event.location.replace(/"/g, '&quot;') : 'Hyderabad (Venue TBA)';
            const safeSlots = event.time ? JSON.stringify(event.time).replace(/"/g, '&quot;') : '[]';
            
            // Extract price from database (defaults to 0 if empty)
            const eventPrice = event.price ? parseInt(event.price) : 0;
            
            htmlContent += `
                <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between group">
                    <div>
                        <div class="overflow-hidden">
                            <img src="${event.image}" alt="${safeTitle}" class="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-700">
                        </div>
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-2xl font-bold text-slate-900 font-serif w-2/3">${event.title}</h3>
                                <!-- Show dynamic price on the card -->
                                <p class="text-xl font-black text-pink-600 bg-pink-50 px-3 py-1 rounded-lg">₹${eventPrice}</p>
                            </div>
                            
                            <div class="space-y-1.5 mb-4 mt-2">
                                <p class="text-xs font-bold text-purple-600 tracking-wide uppercase">📅 ${event.date}</p>
                                <p class="text-xs font-bold text-pink-500 tracking-wide uppercase">📍 ${safeLocation}</p>
                            </div>
                            
                            <p class="text-gray-600 text-sm font-medium leading-relaxed">${event.description}</p>
                        </div>
                    </div>
                    <div class="p-6 pt-0 mt-auto">
                        <!-- Passed dataset.price into the openBookingModal function -->
                        <button 
                            data-title="${safeTitle}" 
                            data-date="${safeDate}"
                            data-location="${safeLocation}"
                            data-slots="${safeSlots}"
                            data-price="${eventPrice}"
                            onclick="openBookingModal(this.dataset.title, this.dataset.date, this.dataset.location, this.dataset.slots, this.dataset.price)" 
                            class="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition">
                            Book Now
                        </button>
                    </div>
                </div>
            `;
        });
        
        if (container) container.innerHTML = htmlContent;
    } catch (err) {
        console.error("Error rendering events:", err);
    }
}

// 3. Modal Controls & Dynamic Time Slot Rendering
// Now accepts 'price' as the 5th argument
function openBookingModal(title, date, location, rawTimeSlots, price) {
    selectedWorkshop = {
        title: title || "",
        date: date || "",
        location: location || "Hyderabad (Venue TBA)",
        price: parseInt(price) || 0 // Store dynamic price
    };

    const modalTitle = document.getElementById('modal-workshop-title');
    const bookingModal = document.getElementById('booking-modal');
    const timeSelect = document.getElementById('cust-time');
    const paySubmitBtn = document.getElementById('pay-submit-btn'); // Target the new button ID

    if (modalTitle) modalTitle.innerText = selectedWorkshop.title;
    
    // Dynamically update the button text to show the database price
    if (paySubmitBtn) {
        paySubmitBtn.innerText = `Pay ₹${selectedWorkshop.price} & Book Seat`;
    }
    
    // Parse and render the dynamic time slots
    if (timeSelect) {
        timeSelect.innerHTML = '<option value="" disabled selected class="text-gray-900">Select a time slot</option>';
        let slots = [];
        try {
            slots = rawTimeSlots ? JSON.parse(rawTimeSlots) : [];
        } catch(e) {
            console.error("Error parsing time slots", e);
        }

        if (Array.isArray(slots) && slots.length > 0) {
            slots.forEach(slot => {
                timeSelect.innerHTML += `<option value="${slot}" class="text-gray-900">${slot}</option>`;
            });
        } else {
            timeSelect.innerHTML += `<option value="Standard Slot" class="text-gray-900">Standard Slot</option>`;
        }
    }

    if (bookingModal) bookingModal.classList.remove('hidden');
}

function closeModal() {
    const bookingModal = document.getElementById('booking-modal');
    const registrationForm = document.getElementById('registration-form');
    if (bookingModal) bookingModal.classList.add('hidden');
    if (registrationForm) registrationForm.reset();
}

// 4. Combined Razorpay Payment & Database Insert
function initiatePayment(e) {
    e.preventDefault();

    const nameInput = document.getElementById('cust-name');
    const emailInput = document.getElementById('cust-email');
    const phoneInput = document.getElementById('cust-phone');
    const timeInput = document.getElementById('cust-time');

    const name = nameInput ? nameInput.value : '';
    const email = emailInput ? emailInput.value : '';
    const phone = phoneInput ? phoneInput.value : '';
    const selectedTime = timeInput ? timeInput.value : '';

    const options = {
        "key": "rzp_live_TGEvaJciOnGGP3", 
        // Razorpay expects paise (multiply ₹ by 100)
        "amount": selectedWorkshop.price * 100, 
        "currency": "INR",
        "name": "Viansh Art Workshop",
        "description": `Ticket for ${selectedWorkshop.title}`,
        "prefill": { "name": name, "email": email, "contact": phone },
        "theme": { "color": "#eab308" },
        "handler": async function (response) {
            
            // Insert dynamic amount into Supabase
            const { data, error } = await supabaseClientReg
                .from('registrations')
                .insert([{
                    full_name: name,
                    email: email,
                    phone: phone,
                    workshop_title: selectedWorkshop.title,
                    workshop_date: selectedWorkshop.date,
                    time_slot: selectedTime, 
                    payment_id: response.razorpay_payment_id,
                    amount: selectedWorkshop.price, // Records the actual dynamic price
                    status: 'paid',
                    location: selectedWorkshop.location
                }])
                .select();

            if (error) {    
                alert("DB Error: " + error.message + " | Code: " + error.code);
                console.error(error);
            } else {
                closeModal();
                
                const qrDataToEncode = response.razorpay_payment_id;

                generateTicket(
                    name, 
                    selectedWorkshop.title, 
                    selectedWorkshop.date, 
                    selectedTime, 
                    response.razorpay_payment_id,
                    qrDataToEncode
                );
            }
        } 
    };

    const rzp = new Razorpay(options);
     
    rzp.on('payment.failed', function (response){
        console.error("Payment Failed:", response.error);
        alert("Payment Failed. Please try again.");
    });

    rzp.open();
}
// Call the function to load the events
fetchEvents();