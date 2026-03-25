// Workshop Facilitation JS Enhancements

document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Navigation Toggle --- 
    const navToggle = document.querySelector('.mobile-nav-toggle');
    const primaryNav = document.querySelector('header nav'); // Target the nav element
    const bodyEl = document.body;

    if (navToggle && primaryNav) {
        navToggle.addEventListener('click', () => {
            primaryNav.classList.toggle('nav-active');
            navToggle.classList.toggle('active'); // For styling the toggle itself (e.g., X icon)
            bodyEl.classList.toggle('nav-open'); // Optional: Prevent body scroll when nav is open
            
            // ARIA attribute for accessibility
            const isExpanded = primaryNav.classList.contains('nav-active');
            navToggle.setAttribute('aria-expanded', isExpanded);
        });
        
        // Close nav when a link is clicked (optional, good for single-page apps or long pages)
        primaryNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (primaryNav.classList.contains('nav-active')) {
                    primaryNav.classList.remove('nav-active');
                    navToggle.classList.remove('active');
                    bodyEl.classList.remove('nav-open');
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    // --- Intersection Observer for Animations --- 
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null, // relative to document viewport 
            rootMargin: '0px',
            threshold: 0.1 // % of item visible
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Stop observing once animated
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        animatedElements.forEach(el => {
            observer.observe(el);
        });

    } else {
        // Fallback for browsers that don't support IntersectionObserver
        animatedElements.forEach(el => {
            el.classList.add('is-visible'); // Make them visible anyway
        });
    }
    
    // --- Update Copyright Year (moved from inline scripts) ---
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
    
    // --- Phone Number Rendering (anti-scraping) ---
    const phoneEl = document.getElementById('phone-number');
    if (phoneEl) {
        const p = ['+3','2 4','78',' 56',' 27',' 46'];
        const num = p.join('');
        const link = document.createElement('a');
        link.href = 'tel:' + num.replace(/\s/g, '');
        link.textContent = num;
        phoneEl.appendChild(link);
    }

    // --- Protected Name Rendering (anti-scraping) ---
    document.querySelectorAll('.protected-name').forEach(el => {
        el.textContent = [el.dataset.f, el.dataset.m, el.dataset.l, el.dataset.s].join('');
    });

    // --- Method Finder Wizard ---
    const wizard = document.getElementById('finder-wizard');
    if (wizard) {
        const answers = {};
        const steps = wizard.querySelectorAll('.finder-step');
        const result = document.getElementById('finder-result');
        const rec = document.getElementById('finder-recommendation');

        wizard.addEventListener('click', (e) => {
            const btn = e.target.closest('.finder-option');
            if (!btn) return;

            const step = btn.closest('.finder-step');
            const stepNum = parseInt(step.dataset.step);
            answers[stepNum] = btn.dataset.value;

            // Highlight selected
            step.querySelectorAll('.finder-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');

            // Show next step or result
            setTimeout(() => {
                step.style.display = 'none';
                const next = wizard.querySelector('[data-step="' + (stepNum + 1) + '"]');
                if (next) {
                    next.style.display = '';
                } else {
                    showRecommendation();
                }
            }, 200);
        });

        wizard.querySelector('.finder-reset')?.addEventListener('click', () => {
            result.style.display = 'none';
            steps.forEach((s, i) => {
                s.style.display = i === 0 ? '' : 'none';
                s.querySelectorAll('.finder-option').forEach(b => b.classList.remove('selected'));
            });
        });

        function showRecommendation() {
            const challenge = answers[1];
            const size = answers[2];
            const setting = answers[3];

            const methods = getRecommendation(challenge, size, setting);
            let html = '';
            methods.forEach(m => {
                html += '<div class="finder-rec-card">';
                html += '<strong>' + m.name + '</strong>';
                html += '<p>' + m.reason + '</p>';
                if (m.link) html += '<a href="' + m.link + '">Learn more &rarr;</a>';
                html += '</div>';
            });
            rec.innerHTML = html;
            result.style.display = '';
        }

        function getRecommendation(challenge, size, setting) {
            const recs = [];

            // Primary recommendation based on challenge + size
            if (challenge === 'alignment' && (size === 'large' || size === 'xlarge')) {
                recs.push({ name: 'Open Space Technology', reason: 'Self-organizing format that scales to hundreds. Surfaces real priorities from the group.', link: 'open-space-technology.html' });
            } else if (challenge === 'alignment') {
                recs.push({ name: 'Liberating Structures', reason: 'Structured sequences like 1-2-4-All and Min Specs get everyone contributing to a shared direction.', link: 'liberating-structures-facilitation.html' });
            } else if (challenge === 'decisions') {
                recs.push({ name: 'Consent Decision Making', reason: 'Moves past deadlock by focusing on "good enough for now, safe enough to try" rather than perfect consensus.', link: 'consent-decision-making.html' });
            } else if (challenge === 'innovation') {
                if (size === 'small' || size === 'medium') {
                    recs.push({ name: 'LEGO\u00ae Serious Play\u00ae', reason: 'Hands-on building activates different thinking pathways. Surfaces insights words alone can\'t reach.', link: 'lego-serious-play.html' });
                } else {
                    recs.push({ name: 'Open Space Technology', reason: 'Passion-driven self-organization surfaces unexpected combinations and breakthrough ideas.', link: 'open-space-technology.html' });
                }
            } else if (challenge === 'team-building') {
                if (size === 'small') {
                    recs.push({ name: 'LEGO\u00ae Serious Play\u00ae', reason: 'Building models of roles, challenges, and aspirations creates deeper connection than any icebreaker.', link: 'lego-serious-play.html' });
                } else {
                    recs.push({ name: 'Liberating Structures', reason: 'Techniques like Troika Consulting and Impromptu Networking build connections through real work.', link: 'liberating-structures-facilitation.html' });
                }
            } else if (challenge === 'change') {
                if (size === 'large' || size === 'xlarge') {
                    recs.push({ name: 'Open Space Technology', reason: 'Creates ownership of the change agenda. People work on what they care about most.', link: 'open-space-technology.html' });
                } else {
                    recs.push({ name: 'Liberating Structures', reason: 'Ecocycle Planning and other structures help teams see where they are and what needs to shift.', link: 'liberating-structures-facilitation.html' });
                }
            }

            // Secondary recommendation
            if (setting === 'virtual' && !recs.some(r => r.name.includes('Liberating'))) {
                recs.push({ name: 'Liberating Structures', reason: 'Works exceptionally well in virtual settings with breakout rooms.', link: 'liberating-structures-facilitation.html' });
            } else if (challenge !== 'decisions' && size !== 'large' && size !== 'xlarge') {
                recs.push({ name: 'Visual Facilitation', reason: 'Making thinking visible helps any group stay aligned and remember what was discussed.' });
            }

            return recs;
        }
    }

    // --- Contact Form Submission ---
    // Check if we were redirected back from Formspree with success
    if (window.location.search.includes('success=true')) {
        const contactForm = document.getElementById('contact-form');
        const successMessage = document.getElementById('form-success-message');
        
        if (contactForm && successMessage) {
            contactForm.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Scroll to the success message
            successMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }

}); 