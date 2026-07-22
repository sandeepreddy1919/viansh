 // 1. Initialize Supabase with a unique variable name to prevent naming collisions
        const supabaseUrl = 'https://nzlnilejmrsmvaambkip.supabase.co';
        const supabaseKey = 'sb_publishable_sDau1lh7K-BZmQKs8OEA2A_xmmtg6pO'; 
        const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

        let selectedWorkshopTitle = "";

        // 2. Fetch Events dynamically from Supabase
        async function fetchEvents() {
            const { data: events, error } = await supabaseClient
                .from('events') 
                .select('*');

            const container = document.getElementById('events-container');
            const loadingText = document.getElementById('loading-text');

            if (error) {
                console.error('Error fetching events:', error);
                loadingText.innerText = "Failed to load events.";
                return;
            }

            loadingText.style.display = 'none';

            if (!events || events.length === 0) {
                loadingText.style.display = 'block';
                loadingText.innerText = "No upcoming workshops found.";
                return;
            }

            events.forEach(event => {
                container.innerHTML += `
                    <div class="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between group">
                        <div>
                            <div class="overflow-hidden h-56">
                                <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
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
                            <button onclick="openBookingModal('${event.title}')" class="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition">
                                Book Now
                            </button>
                        </div>
                    </div>
                `;
            });
        }

        // 3. Modal Controls
        function openBookingModal(title) {
            selectedWorkshopTitle = title;
            document.getElementById('modal-workshop-title').innerText = title;
            document.getElementById('booking-modal').classList.remove('hidden');
        }

        function closeModal() {
            document.getElementById('booking-modal').classList.add('hidden');
            document.getElementById('registration-form').reset();
        }

        // 4. Razorpay Payment & Database Insert
        function initiatePayment(e) {
            e.preventDefault();

            const name = document.getElementById('cust-name').value;
            const email = document.getElementById('cust-email').value;
            const phone = document.getElementById('cust-phone').value;

            const options = {
                "key": "rzp_live_TGEvaJciOnGGP3",
                "amount": 100,
                "currency": "INR",
                "name": "Viansh Art Workshop",
                "description": `Ticket for ${selectedWorkshopTitle}`,
                "prefill": { "name": name, "email": email, "contact": phone },
                "theme": { "color": "#db2777" },
                "handler": async function (response) {
                    
                    const { data, error } = await supabaseClient
                        .from('registrations')
                        .insert([{
                            full_name: name,
                            email: email,
                            phone: phone,
                            workshop_title: selectedWorkshopTitle,
                            payment_id: response.razorpay_payment_id,
                            amount: 1,
                            status: 'paid'
                        }]);

                    if (error) {
                        alert("Payment successful, but failed to save registration. Please contact support.");
                        console.error(error);
                    } else {
                        closeModal();
                        alert("🎉 Payment Successful! Your seat is reserved.");
                    }
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        }

        // Run fetch on load
        fetchEvents();