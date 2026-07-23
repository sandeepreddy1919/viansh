// 1. Initialize Supabase
const supabaseUrl = 'https://nzlnilejmrsmvaambkip.supabase.co';
const supabaseKey = 'sb_publishable_sDau1lh7K-BZmQKs8OEA2A_xmmtg6pO'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

let selectedWorkshopTitle = "";

// 2. Fetch Events dynamically from Supabase
async function fetchEvents() {
    try {
        const { data: events, error } = await supabaseClient
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
            
            htmlContent += `
                <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between group">
                    <div>
                        <div class="overflow-hidden h-56">
                            <img src="${event.image_url}" alt="${safeTitle}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                        </div>
                        <div class="p-6">
                            <h3 class="text-2xl font-bold text-slate-900 mb-2 font-serif">${event.title}</h3>
                            
                            <div class="space-y-1.5 mb-4">
                                <p class="text-xs font-bold text-purple-600 tracking-wide uppercase">📅 ${event.date}</p>
                                <p class="text-xs font-bold text-pink-500 tracking-wide uppercase">📍 ${event.location || 'Hyderabad (Venue TBA)'}</p>
                            </div>
                            
                            <p class="text-gray-600 text-sm font-medium leading-relaxed">${event.description}</p>
                        </div>
                    </div>
                    <div class="p-6 pt-0 mt-auto">
                        <button 
                            data-title="${safeTitle}" 
                            onclick="openBookingModal(this.dataset.title)" 
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

// 3. Modal Controls
function openBookingModal(title) {
    selectedWorkshopTitle = title;
    const modalTitle = document.getElementById('modal-workshop-title');
    const bookingModal = document.getElementById('booking-modal');
    if (modalTitle) modalTitle.innerText = title;
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

    const name = nameInput ? nameInput.value : '';
    const email = emailInput ? emailInput.value : '';
    const phone = phoneInput ? phoneInput.value : '';

    const options = {
        "key": "rzp_live_TGEvaJciOnGGP3", 
        "amount": 100, // 100 paise = 1 INR
        "currency": "INR",
        "name": "Viansh Art Workshop",
        "description": `Ticket for ${selectedWorkshopTitle}`,
        "prefill": { "name": name, "email": email, "contact": phone },
        "theme": { "color": "#db2777" },
        "handler": async function (response) {
            
            const { error } = await supabaseClient
                .from('registrations')
                .insert([{
                    full_name: name,
                    email: email,
                    phone: phone,
                    workshop_title: selectedWorkshopTitle,
                    payment_id: response.razorpay_payment_id,
                    amount: 100,
                    status: 'paid',
                    location: 'Hyderabad (Venue TBA)'
                }]);

            if (error) {   
                
                alert("Payment successful, but failed to save registration. Please contact support.");
                console.error(error);
            } else {
                closeModal();
                generateTicket(name, selectedWorkshopTitle, response.razorpay_payment_id);
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

// --- 5. TICKET DISPLAY FUNCTION ---
function generateTicket(name, eventTitle, paymentId) {
    const ticketName = document.getElementById('ticket-name');
    const ticketEvent = document.getElementById('ticket-event');
    const ticketId = document.getElementById('ticket-id');
    const ticketModal = document.getElementById('ticket-modal');

    if (ticketName) ticketName.innerText = name;
    if (ticketEvent) ticketEvent.innerText = eventTitle;
    if (ticketId) ticketId.innerText = paymentId;
    if (ticketModal) ticketModal.classList.remove('hidden');
}

// --- 6. CLOSE TICKET LOGIC ---
document.getElementById('close-ticket-btn')?.addEventListener('click', () => {
    document.getElementById('ticket-modal')?.classList.add('hidden');
});

// --- 7. DOWNLOAD IMAGE LOGIC ---
function downloadTicketImage() {
    const ticketElement = document.getElementById('ticket-content');
    if (!ticketElement) return;

    const elementsToHide = ticketElement.querySelectorAll('.no-print');
    elementsToHide.forEach(el => el.style.display = 'none');

    if (typeof html2canvas !== 'undefined') {
        html2canvas(ticketElement, {
            scale: 3, 
            backgroundColor: "#ffffff",
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'Viansh_Event_Ticket.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            elementsToHide.forEach(el => el.style.display = '');
        }).catch(err => {
            console.error("Error generating ticket image:", err);
            elementsToHide.forEach(el => el.style.display = '');
        });
    } else {
        console.error("html2canvas library is not loaded.");
        elementsToHide.forEach(el => el.style.display = '');
    }
}

// Run fetch on load
fetchEvents();