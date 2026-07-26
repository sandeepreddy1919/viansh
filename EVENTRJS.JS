// 1. Initialize Supabase
const supabaseUrlReg = 'https://pduejtjmpvlhsqblviff.supabase.co';
const supabaseKeyReg = 'sb_publishable_XEqvPJ-kQujXK0ONksCexA_r4NaUW99'; 
const supabaseClientReg = window.supabase.createClient(supabaseUrlReg, supabaseKeyReg);

const supabaseUrlEv = 'https://nzlnilejmrsmvaambkip.supabase.co';
const supabaseKeyEv = 'sb_publishable_sDau1lh7K-BZmQKs8OEA2A_xmmtg6pO'; 
const supabaseClientEv = window.supabase.createClient(supabaseUrlEv, supabaseKeyEv);

// Object to store details of the currently selected workshop
let selectedWorkshop = {
    title: "",
    date: "",
    location: ""
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
                                <p class="text-xs font-bold text-pink-500 tracking-wide uppercase">📍 ${safeLocation}</p>
                            </div>
                            
                            <p class="text-gray-600 text-sm font-medium leading-relaxed">${event.description}</p>
                        </div>
                    </div>
                    <div class="p-6 pt-0 mt-auto">
                        <button 
                            data-title="${safeTitle}" 
                            data-date="${safeDate}"
                            data-location="${safeLocation}"
                            onclick="openBookingModal(this.dataset.title, this.dataset.date, this.dataset.location)" 
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
function openBookingModal(title, date, location) {
    selectedWorkshop = {
        title: title || "",
        date: date || "",
        location: location || "Hyderabad (Venue TBA)"
    };

    const modalTitle = document.getElementById('modal-workshop-title');
    const bookingModal = document.getElementById('booking-modal');
    if (modalTitle) modalTitle.innerText = selectedWorkshop.title;
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
        "amount": 100, // 100 paise = 1 INR
        "currency": "INR",
        "name": "Viansh Art Workshop",
        "description": `Ticket for ${selectedWorkshop.title}`,
        "prefill": { "name": name, "email": email, "contact": phone },
        "theme": { "color": "#eab308" }, // Changed to Yellow matching ticket UI
        "handler": async function (response) {
            
            // Save to database AND .select() to get the row data back (for qr_token)
            const { data, error } = await supabaseClientReg
                .from('registrations')
                .insert([{
                    full_name: name,
                    email: email,
                    phone: phone,
                    workshop_title: selectedWorkshop.title,
                    workshop_date: selectedWorkshop.date,
                    // If you add time_slot to Supabase DB in the future, uncomment this line:
                    // time_slot: selectedTime, 
                    payment_id: response.razorpay_payment_id,
                    amount: 100,
                    status: 'paid',
                    location: selectedWorkshop.location
                }])
                .select(); // <--- CRITICAL: This returns the inserted record

            if (error) {    
                alert("DB Error: " + error.message + " | Code: " + error.code);
                console.error(error);
            } else {
                closeModal();
                
                // Extract the generated qr_token, or fallback to payment_id if token doesn't exist
                const qrDataToEncode = (data && data[0] && data[0].qr_token) 
                    ? data[0].qr_token 
                    : response.razorpay_payment_id;

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

// 5. Ticket Display Function
function generateTicket(name, eventTitle, date, time, paymentId, qrData) {
    const ticketName = document.getElementById('ticket-name');
    const ticketEvent = document.getElementById('ticket-event');
    const ticketDate = document.getElementById('ticket-date');
    const ticketTime = document.getElementById('ticket-time');
    const ticketId = document.getElementById('ticket-id');
    const ticketModal = document.getElementById('ticket-modal');
    const qrContainer = document.getElementById('ticket-qrcode');

    // Populate textual fields
    if (ticketName) ticketName.innerText = name;
    if (ticketEvent) ticketEvent.innerText = eventTitle;
    if (ticketDate) ticketDate.innerText = date || "N/A";
    if (ticketTime) ticketTime.innerText = time || "TBA";
    if (ticketId) ticketId.innerText = paymentId;

    // Generate the QR Code dynamically based on database UUID or Payment ID
    if (qrContainer) {
        qrContainer.innerHTML = ""; // Clear existing QR code if generated previously
        new QRCode(qrContainer, {
            text: qrData,
            width: 120, // slightly larger for easier scanning
            height: 120,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    if (ticketModal) ticketModal.classList.remove('hidden');
}

// 6. Close Ticket Logic
function closeTicket() {
    const ticketModal = document.getElementById('ticket-modal');
    if (ticketModal) {
        ticketModal.classList.add('hidden');
    }
}

// 7. Download Image Logic
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