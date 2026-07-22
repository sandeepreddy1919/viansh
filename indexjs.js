// TOGGLE READ MORE FUNCTION
        function toggleReadMore(textId, buttonElement) {
            const textElement = document.getElementById(textId);
            textElement.classList.toggle('line-clamp-4');
            if (textElement.classList.contains('line-clamp-4')) {
                buttonElement.innerHTML = '+ READ MORE';
            } else {
                buttonElement.innerHTML = '- READ LESS';
            }
        }

        // HERO SCROLL ANIMATION & INTERSECTION OBSERVER
        document.addEventListener("DOMContentLoaded", () => {
            
            // Intersection Observer for the Bento Grid (Events)
            const revealItems = document.querySelectorAll('.reveal-item');
            const scrollObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target); 
                    }
                });
            }, { root: null, threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

            revealItems.forEach(item => scrollObserver.observe(item));

            // Hero Track logic
            const track = document.getElementById('hero-track');
            const cards = document.querySelectorAll('.stack-card');
            const text1 = document.getElementById('text-phase-1');
            const text2 = document.getElementById('text-phase-2');

            function generateScatterCoordinates() {
                const isMobile = window.innerWidth < 768;
                return [
                    { x: isMobile ? -26 : -36, y: isMobile ? -32 : -28, rot: -12 }, 
                    { x: isMobile ?  26 :  36, y: isMobile ? -34 : -32, rot: 14  }, 
                    { x: isMobile ? -28 : -38, y: isMobile ?  30 :  28, rot: -8  }, 
                    { x: isMobile ?  28 :  38, y: isMobile ?  32 :  30, rot: 10  }, 
                    { x: isMobile ? -34 : -44, y: isMobile ? -4  : -2,  rot: -18 }, 
                    { x: isMobile ?  34 :  44, y: isMobile ?  6  :  2,  rot: 16  }  
                ];
            }

            let scatterTargets = generateScatterCoordinates();
            window.addEventListener('resize', () => { scatterTargets = generateScatterCoordinates(); });

            window.addEventListener('scroll', () => {
                if (!track) return;

                const rect = track.getBoundingClientRect();
                const totalScrollableHeight = rect.height - window.innerHeight;
                
                let progress = -rect.top / totalScrollableHeight;
                progress = Math.max(0, Math.min(1, progress));

                // TIMELINE PHASE 1
                if (progress < 0.38) {
                    text1.style.opacity = 1 - (progress * 2.5);
                    text1.style.transform = `scale(${1 - (progress * 0.2)})`;
                    text2.style.opacity = 0;
                } else if (progress >= 0.38 && progress < 0.70) {
                    text1.style.opacity = 0;
                    const text2Progress = (progress - 0.38) / (0.60 - 0.38);
                    const text2Ease = Math.min(1, Math.max(0, text2Progress));
                    text2.style.opacity = text2Ease;
                    text2.style.transform = `scale(${0.95 + (text2Ease * 0.05)})`;
                } else {
                    text1.style.opacity = 0;
                    text2.style.opacity = 1;
                    text2.style.transform = 'scale(1)';
                }

                // TIMELINE PHASE 2
                cards.forEach((card, idx) => {
                    const entryStart = idx * (0.24 / cards.length);
                    const entryEnd = entryStart + 0.12;
                    const scatterStart = 0.42;
                    const scatterEnd = 0.75;

                    let currentX = 0, currentY = 0, currentRot = 0, currentScale = 1, currentOpacity = 0;

                    if (progress < entryStart) {
                        currentY = 120; currentScale = 0.7; currentOpacity = 0;
                    } 
                    else if (progress >= entryStart && progress < entryEnd) {
                        const p = (progress - entryStart) / (entryEnd - entryStart);
                        const easeOutCubic = 1 - Math.pow(1 - p, 3);
                        currentY = 120 * (1 - easeOutCubic);
                        currentScale = 0.7 + (0.3 * easeOutCubic);
                        currentOpacity = easeOutCubic;
                        currentRot = ((idx % 2 === 0 ? 1 : -1) * (idx * 2.5)) * easeOutCubic;
                    } 
                    else if (progress >= entryEnd && progress < scatterStart) {
                        currentY = 0; currentX = 0; currentScale = 1; currentOpacity = 1;
                        currentRot = (idx % 2 === 0 ? 1 : -1) * (idx * 2.5);
                    } 
                    else if (progress >= scatterStart && progress <= scatterEnd) {
                        const p = (progress - scatterStart) / (scatterEnd - scatterStart);
                        const easeOutQuart = 1 - Math.pow(1 - p, 4);
                        const coordinate = scatterTargets[idx % scatterTargets.length];
                        currentX = coordinate.x * easeOutQuart;
                        currentY = coordinate.y * easeOutQuart;
                        const naturalDeckRot = (idx % 2 === 0 ? 1 : -1) * (idx * 2.5);
                        currentRot = naturalDeckRot + (coordinate.rot * easeOutQuart);
                        currentScale = 1 + (0.1 * easeOutQuart);
                        currentOpacity = 1;
                    } 
                    else {
                        const coordinate = scatterTargets[idx % scatterTargets.length];
                        currentX = coordinate.x; currentY = coordinate.y;
                        currentRot = ((idx % 2 === 0 ? 1 : -1) * (idx * 2.5)) + coordinate.rot;
                        currentScale = 1.1; currentOpacity = 1;
                    }

                    card.style.transform = `translate(calc(-50% + ${currentX}vw), calc(-50% + ${currentY}vh)) rotate(${currentRot}deg) scale(${currentScale})`;
                    card.style.opacity = currentOpacity;
                });
            });

            window.dispatchEvent(new Event('scroll'));
        });