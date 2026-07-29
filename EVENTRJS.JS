// 1. Initialize Supabase Clients
const supabaseUrlReg = 'https://pduejtjmpvlhsqblviff.supabase.co';
const supabaseKeyReg = 'sb_publishable_XEqvPJ-kQujXK0ONksCexA_r4NaUW99'; 
const supabaseClientReg = window.supabase.createClient(supabaseUrlReg, supabaseKeyReg);

const supabaseUrlEv = 'https://nzlnilejmrsmvaambkip.supabase.co';
const supabaseKeyEv = 'sb_publishable_sDau1lh7K-BZmQKs8OEA2A_xmmtg6pO'; 
const supabaseClientEv = window.supabase.createClient(supabaseUrlEv, supabaseKeyEv);

// Selected Workshop State
let selectedWorkshop = {
    title: "",
    date: "",
    location: "",
    price: 0
};

// Helper function to prevent quotes from breaking HTML attributes
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Global Function to Toggle "Read More / Read Less" for Workshops (No quotes added)
window.toggleEventTextByChar = function(elementId, btnElement) {
    const textEl = document.getElementById(elementId);
    if (!textEl) return;

    const isTruncated = textEl.getAttribute('data-is-truncated') === 'true';
    
    if (isTruncated) {
        // Expand the text
        textEl.innerText = textEl.getAttribute('data-fulltext');
        textEl.setAttribute('data-is-truncated', 'false');
        btnElement.innerText = 'Read Less';
    } else {
        // Collapse the text
        textEl.innerText = textEl.getAttribute('data-truncated');
        textEl.setAttribute('data-is-truncated', 'true');
        btnElement.innerText = 'Read More';
    }
}

// 2. Fetch Events Dynamically from Supabase
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
                loadingText.innerText = "Failed to load events. Check database credentials.";
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

        // Added index parameter to the forEach loop to generate unique IDs
        events.forEach((event, index) => {
            const safeTitle = event.title ? event.title.replace(/"/g, '&quot;') : '';
            const safeDate = event.date ? event.date.replace(/"/g, '&quot;') : '';
            const safeLocation = event.location ? event.location.replace(/"/g, '&quot;') : 'Hyderabad (Venue TBA)';
            const safeSlots = event.time ? JSON.stringify(event.time).replace(/"/g, '&quot;') : '[]';
            const safePasses = event.ticket_passes ? JSON.stringify(event.ticket_passes).replace(/"/g, '&quot;') : '[]';
            const eventPrice = event.price ? parseInt(event.price) : 0;
            
            // Character Truncation Logic for Workshop Description
            const descId = `event-desc-${index}`;
            const fullText = event.description || "";
            const isLongText = fullText.length > 100;
            const truncatedText = isLongText ? fullText.substring(0, 100) + '...' : fullText;

            htmlContent += `
                <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between group">
                    <div>
                        <div class="overflow-hidden">
                            <img src="${event.image}" alt="${safeTitle}" class="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-700">
                        </div>
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-2xl font-bold text-slate-900 font-serif w-2/3">${event.title}</h3>
                                <p class="text-xl font-black text-pink-600 bg-pink-50 px-3 py-1 rounded-lg">₹${eventPrice}</p>
                            </div>
                            
                            <div class="space-y-1.5 mb-4 mt-2">
                                <p class="text-xs font-bold text-purple-600 tracking-wide uppercase">📅 ${event.date}</p>
                                <p class="text-xs font-bold text-pink-500 tracking-wide uppercase">📍 ${safeLocation}</p>
                            </div>
                            
                            <!-- Updated Description with Truncation -->
                            <p id="${descId}" 
                               data-fulltext="${escapeHTML(fullText)}" 
                               data-truncated="${escapeHTML(truncatedText)}" 
                               data-is-truncated="true"
                               class="text-gray-600 text-sm font-medium leading-relaxed transition-all duration-300">
                                ${truncatedText}
                            </p>
                            ${isLongText ? `
                                <button onclick="toggleEventTextByChar('${descId}', this)" class="text-purple-600 font-bold text-xs mt-1 hover:underline focus:outline-none">
                                    Read More
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="p-6 pt-0 mt-auto">
                        <button 
                            data-title="${safeTitle}" 
                            data-date="${safeDate}"
                            data-location="${safeLocation}"
                            data-slots="${safeSlots}"
                            data-price="${eventPrice}"
                            data-passes="${safePasses}"
                            onclick="openBookingModal(this.dataset.title, this.dataset.date, this.dataset.location, this.dataset.slots, this.dataset.price, this.dataset.passes)" 
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

// 3. Dynamic UI Helpers & Modal Controls
function updatePayButton(price) {
    const paySubmitBtn = document.getElementById('pay-submit-btn');
    if (paySubmitBtn) {
        paySubmitBtn.innerText = `Pay ₹${price} & Book Seat`;
    }
}

function openBookingModal(title, date, location, rawTimeSlots, price, rawPasses) {
    selectedWorkshop = {
        title: title || "",
        date: date || "",
        location: location || "Hyderabad (Venue TBA)",
        price: parseInt(price) || 0
    };

    const modalTitle = document.getElementById('modal-workshop-title');
    const bookingModal = document.getElementById('booking-modal');
    const timeSelect = document.getElementById('cust-time');
    const passesContainer = document.getElementById('modal-passes-container');
    const paySubmitBtn = document.getElementById('pay-submit-btn');

    if (modalTitle) modalTitle.innerText = selectedWorkshop.title;
    
    // Parse ticket passes array
    let passes = [];
    try {
        passes = rawPasses ? JSON.parse(rawPasses) : [];
    } catch(e) {
        console.error("Error parsing passes JSON:", e);
    }

    // Render Ticket Passes
    if (passesContainer) {
        if (passes.length > 0) {
            let passesHTML = '';
            passes.forEach((pass, index) => {
                const isChecked = index === 0 ? 'checked' : '';
                passesHTML += `
                    <label class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition">
                        <div class="flex items-center gap-3">
                            <input type="radio" name="pass_type" value="${pass.price}" data-pass-name="${pass.name}" ${isChecked} class="w-4 h-4 text-pink-500 bg-transparent border-white/20 focus:ring-pink-500 focus:ring-2" onchange="updatePayButton(${pass.price})">
                            <span class="font-bold text-gray-200 text-sm">${pass.name}</span>
                        </div>
                        <span class="font-bold text-pink-400">₹${pass.price}</span>
                    </label>
                `;
            });
            passesContainer.innerHTML = passesHTML;
            if (paySubmitBtn) paySubmitBtn.innerText = `Pay ₹${passes[0].price} & Book Seat`;
        } else {
            passesContainer.innerHTML = `<p class="text-gray-400 text-sm italic">Standard Pass - ₹${selectedWorkshop.price}</p>`;
            if (paySubmitBtn) paySubmitBtn.innerText = `Pay ₹${selectedWorkshop.price} & Book Seat`;
        }
    }

    // Render Time Slots
    if (timeSelect) {
        timeSelect.innerHTML = '<option value="" disabled selected class="text-gray-900">Select a time slot</option>';
        let slots = [];
        try {
            slots = rawTimeSlots ? JSON.parse(rawTimeSlots) : [];
        } catch(e) {
            console.error("Error parsing time slots JSON:", e);
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

// 4. Razorpay Payment & Database Insertion
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

    const selectedPassEl = document.querySelector('input[name="pass_type"]:checked');
    const finalPrice = selectedPassEl ? parseInt(selectedPassEl.value) : selectedWorkshop.price;
    const passName = selectedPassEl ? selectedPassEl.getAttribute('data-pass-name') : 'Standard Pass';

    const options = {
        "key": "rzp_live_TGEvaJciOnGGP3", 
        "amount": finalPrice * 100, 
        "currency": "INR",
        "name": "Viansh Art Workshop",
        "description": `Ticket for ${selectedWorkshop.title} (${passName})`,
        "prefill": { "name": name, "email": email, "contact": phone },
        "theme": { "color": "#eab308" },
        "handler": async function (response) {
            
            const { data, error } = await supabaseClientReg
                .from('registrations')
                .insert([{
                    full_name: name,
                    email: email,
                    phone: phone,
                    workshop_title: `${selectedWorkshop.title} - ${passName}`,
                    workshop_date: selectedWorkshop.date,
                    time_slot: selectedTime, 
                    payment_id: response.razorpay_payment_id,
                    amount: finalPrice,
                    status: 'paid',
                    location: selectedWorkshop.location
                }])
                .select();

            if (error) {    
                alert("DB Error: " + error.message + " | Code: " + error.code);
                console.error(error);
            } else {
                closeModal();
                
                generateTicket(
                    name, 
                    `${selectedWorkshop.title} (${passName})`, 
                    selectedWorkshop.date, 
                    selectedTime, 
                    response.razorpay_payment_id,
                    response.razorpay_payment_id
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

// 5. Ticket Modal & QR Generator
function generateTicket(name, title, date, time, paymentId, qrData) {
    document.getElementById('ticket-name').innerText = name || '---';
    document.getElementById('ticket-event').innerText = title || '---';
    document.getElementById('ticket-date').innerText = date || '---';
    document.getElementById('ticket-time').innerText = time || '---';
    document.getElementById('ticket-id').innerText = paymentId || '---';

    const qrContainer = document.getElementById('ticket-qrcode');
    if (qrContainer) {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: qrData || paymentId,
            width: 110,
            height: 110
        });
    }

    const ticketModal = document.getElementById('ticket-modal');
    if (ticketModal) ticketModal.classList.remove('hidden');
}

function closeTicket() {
    const ticketModal = document.getElementById('ticket-modal');
    if (ticketModal) ticketModal.classList.add('hidden');
}

function downloadTicketImage() {
    const ticketElement = document.getElementById('ticket-content');
    if (!ticketElement) return;

    const noPrintElements = ticketElement.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.style.display = 'none');

    html2canvas(ticketElement, { scale: 2, useCORS: true }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Viansh_Ticket_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        noPrintElements.forEach(el => el.style.display = '');
    }).catch(err => {
        console.error("Error generating ticket image:", err);
        noPrintElements.forEach(el => el.style.display = '');
    });
}

// Initializer Call
fetchEvents();