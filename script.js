
let filterTimeout = null;
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a'); // Fixed selector
let filterButtons = document.querySelectorAll('.filter-btn');
let projectCards = document.querySelectorAll('.project-box');
let filterStatus = document.querySelector('#filter-status');
const contactForm = document.querySelector('#contact-form');
const contactStatus = document.querySelector('#contact-status');
const project5Img = document.querySelector('#project5-img');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// FormSubmit token: after your first form submission activates your account,
// go to https://formsubmit.co and retrieve your unique token.
// Replace YOUR_FORMSUBMIT_TOKEN with that token to obfuscate your email address.
const CONTACT_ENDPOINT = 'https://formsubmit.co/ajax/ef4a0761b9cd7b3fcc011b10e652c1ab';
const CONTACT_POST_ENDPOINT = 'https://formsubmit.co/ef4a0761b9cd7b3fcc011b10e652c1ab';
const heroTypingTarget = document.querySelector('.text-animation span');
const HERO_TITLES = [
    'Ethical Hacker',
    'Penetration Tester',
    'Red Teaming',
    'Full Stack Developer',
    'Web Application Tester'
];

document.body.classList.add('js-enabled');
startHeroTypingLoop();

if (project5Img) {
    project5Img.addEventListener('error', () => {
        project5Img.style.display = 'none';
    }, { once: true });
}

// Highlight active section in navigation bar
const navLinkMap = new Map();
navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href?.startsWith('#')) {
        navLinkMap.set(href.slice(1), link);
    }
});

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => link.classList.remove('active'));
            const activeLink = navLinkMap.get(entry.target.id);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    });
}, { rootMargin: '-10% 0px -85% 0px', threshold: 0 });

sections.forEach(section => navObserver.observe(section));

requestAnimationFrame(() => {
    const alreadyActive = Array.from(navLinks).some(
        link => link.classList.contains('active')
    );
    if (!alreadyActive) {
        const firstLink = navLinkMap.get(sections[0]?.id);
        if (firstLink) firstLink.classList.add('active');
    }
});

// Toggle mobile menu
menuIcon.addEventListener('click', () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
});

// Close mobile menu after navigation click
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        menuIcon.classList.remove('bx-x');
        navbar.classList.remove('active');
    });
});

// Project category filtering
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        const filter = button.dataset.filter;

        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        filterButtons.forEach(btn => btn.setAttribute('aria-selected', 'false'));
        button.setAttribute('aria-selected', 'true');

        applyProjectFilter(filter);
    });
});

function applyProjectFilter(filter) {
    if (filterTimeout) {
        clearTimeout(filterTimeout);
        filterTimeout = null;
        projectCards.forEach(card => {
            card.classList.remove('is-filtering-out', 'is-filtering-in');
        });
    }

    const visibleCards = [];
    const label = getFilterLabel(filter);

    if (prefersReducedMotion) {
        projectCards.forEach(card => {
            const category = card.dataset.category;
            const shouldShow = filter === 'all' || category === filter;
            card.classList.toggle('hidden', !shouldShow);
            if (shouldShow) {
                visibleCards.push(card);
                card.classList.add('project-visible');
            }
        });
        announceFilterResults(visibleCards.length, label);
        return;
    }

    projectCards.forEach(card => {
        card.classList.add('is-filtering-out');
    });

    filterTimeout = setTimeout(() => {
        let staggerIndex = 0;
        projectCards.forEach(card => {
            const category = card.dataset.category;
            const shouldShow = filter === 'all' || category === filter;

            card.classList.remove('is-filtering-out');
            card.classList.toggle('hidden', !shouldShow);

            if (shouldShow) {
                visibleCards.push(card);
                card.classList.add('project-visible');
                card.style.setProperty('--stagger-delay', `${staggerIndex * 80}ms`);
                card.classList.add('is-filtering-in');
                setTimeout(() => {
                    card.classList.remove('is-filtering-in');
                }, 360);
                staggerIndex += 1;
            } else {
                card.classList.remove('project-visible');
            }
        });

        announceFilterResults(visibleCards.length, label);
        filterTimeout = null;
    }, 180);
}

function announceFilterResults(count, label) {
    const resultText = count === 1 ? '1 project' : `${count} projects`;
    if (filterStatus) {
        filterStatus.textContent = `Showing ${resultText} in ${label}.`;
    }
}

function getFilterLabel(filter) {
    if (filter === 'web') return 'Web Development';
    if (filter === 'software') return 'Software Applications';
    if (filter === 'pentest') return 'Penetration Testing';
    return 'All Projects';
}

// Scroll reveal for sections
if (!prefersReducedMotion) {
    sections.forEach(section => section.classList.add('scroll-reveal'));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    sections.forEach(section => revealObserver.observe(section));
} else {
    sections.forEach(section => {
        section.classList.add('in-view');
    });
}

// Initial project card reveal with staggered animation
if (!prefersReducedMotion) {
    const projectGridObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const visible = Array.from(projectCards).filter(card => !card.classList.contains('hidden'));
                setProjectCardStagger(visible);
                visible.forEach(card => card.classList.add('project-visible'));
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const projectContainer = document.querySelector('.projects-container');
    if (projectContainer) {
        projectGridObserver.observe(projectContainer);
    }
} else {
    projectCards.forEach(card => card.classList.add('project-visible'));
}

let lastSubmissionTime = 0;
const SUBMISSION_COOLDOWN_MS = 30000;

if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFormStatus();

        const now = Date.now();
        if (now - lastSubmissionTime < SUBMISSION_COOLDOWN_MS) {
            setFormStatus('Please wait 30 seconds before sending another message.', 'error');
            return;
        }

        const formData = new FormData(contactForm);
        const websiteTrap = String(formData.get('website') || '').trim();
        if (websiteTrap) {
            setFormStatus('Request blocked.', 'error');
            return;
        }

        const payload = sanitizeFormPayload({
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            subject: formData.get('subject'),
            message: formData.get('message')
        });

        const validationError = validateContactPayload(payload);
        if (validationError) {
            setFormStatus(validationError, 'error');
            return;
        }

        lastSubmissionTime = now;

        // `file://` pages commonly fail CORS for AJAX requests.
        if (window.location.protocol === 'file:') {
            submitViaFormPost(payload);
            setFormStatus('Submitting via secure fallback. Please complete the formsubmit flow in the opened tab.', 'success');
            return;
        }

        try {
            const response = await fetch(CONTACT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    _subject: `Portfolio Contact: ${payload.subject}`,
                    _template: 'table',
                    _replyto: payload.email,
                    _captcha: 'true'
                })
            });

            const responseData = await response.json().catch(() => ({}));
            if (!response.ok || responseData.success === 'false' || responseData.success === false) {
                const errorMessage = responseData.message || 'Submission failed';
                throw new Error(errorMessage);
            }

            if (responseData.message && /activate|confirm|verify/i.test(responseData.message)) {
                setFormStatus('Please verify your FormSubmit activation email first, then try again.', 'error');
                return;
            }

            if (!response.ok) {
                throw new Error('Submission failed');
            }

            setFormStatus('Message sent successfully. I will get back to you soon.', 'success');
            contactForm.reset();
        } catch (error) {
            submitViaFormPost(payload);
            console.error('[ContactForm] AJAX submission failed:', error);
            setFormStatus('Message delivery encountered an issue. Please try the direct email link in the footer.', 'error');
        }
    });
}

function setProjectCardStagger(cards) {
    cards.forEach((card, index) => {
        card.style.setProperty('--stagger-delay', `${index * 90}ms`);
    });
}

function sanitizeFormPayload(payload) {
    const sanitizeText = (value, maxLen = 500) =>
        String(value ?? '')
            .slice(0, maxLen)
            .replace(/[<>"'`{}\\]/g, '')
            .replace(/javascript\s*:/gi, '')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .trim();

    return {
        name: sanitizeText(payload.name, 80),
        email: sanitizeText(payload.email, 120).toLowerCase(),
        phone: sanitizeText(payload.phone, 25),
        subject: sanitizeText(payload.subject, 120),
        message: sanitizeText(payload.message, 2000)
    };
}

function validateContactPayload(payload) {
    if (!payload.name || payload.name.length < 2) return 'Please enter a valid name.';
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return 'Please enter a valid email address.';
    if (!payload.subject || payload.subject.length < 3) return 'Please provide a clear subject.';
    if (!payload.message || payload.message.length < 20) return 'Please provide more detail in your message.';
    if (payload.phone && !/^[0-9+()\-\s]{7,25}$/.test(payload.phone)) return 'Please enter a valid phone number.';
    return '';
}

function setFormStatus(message, type) {
    if (!contactStatus) return;
    contactStatus.textContent = message;
    contactStatus.classList.remove('success', 'error');
    contactStatus.classList.add(type);
}

function clearFormStatus() {
    if (!contactStatus) return;
    contactStatus.textContent = '';
    contactStatus.classList.remove('success', 'error');
}

function submitViaFormPost(payload) {
    const fallbackForm = document.createElement('form');
    fallbackForm.method = 'POST';
    fallbackForm.action = CONTACT_POST_ENDPOINT;
    fallbackForm.target = '_blank';
    fallbackForm.style.display = 'none';

    const fields = {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        subject: payload.subject,
        message: payload.message,
        _subject: `Portfolio Contact: ${payload.subject}`,
        _template: 'table',
        _captcha: 'true',
        _replyto: payload.email
    };

    Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value || '';
        fallbackForm.appendChild(input);
    });

    document.body.appendChild(fallbackForm);
    fallbackForm.submit();
    document.body.removeChild(fallbackForm);
}

function startHeroTypingLoop() {
    if (!heroTypingTarget || !HERO_TITLES.length) return;

    if (prefersReducedMotion) {
        heroTypingTarget.textContent = HERO_TITLES[0];
        return;
    }

    let titleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeBaseSpeed = 78;
    const deleteSpeed = 45;
    const holdDelay = 1300;
    const nextTitleDelay = 250;

    const tick = () => {
        if (!document.body.contains(heroTypingTarget)) return;
        const currentTitle = HERO_TITLES[titleIndex];

        if (!isDeleting) {
            charIndex += 1;
            heroTypingTarget.textContent = currentTitle.slice(0, charIndex);

            if (charIndex >= currentTitle.length) {
                isDeleting = true;
                setTimeout(tick, holdDelay);
                return;
            }

            const speedVariance = Math.floor(Math.random() * 24);
            setTimeout(tick, typeBaseSpeed + speedVariance);
            return;
        }

        charIndex -= 1;
        heroTypingTarget.textContent = currentTitle.slice(0, Math.max(charIndex, 0));

        if (charIndex <= 0) {
            isDeleting = false;
            titleIndex = (titleIndex + 1) % HERO_TITLES.length;
            setTimeout(tick, nextTitleDelay);
            return;
        }

        setTimeout(tick, deleteSpeed);
    };

    tick();
}