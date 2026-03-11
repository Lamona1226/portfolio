
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a'); // Fixed selector
let filterButtons = document.querySelectorAll('.filter-btn');
let projectCards = document.querySelectorAll('.project-box');
let filterStatus = document.querySelector('#filter-status');
const contactForm = document.querySelector('#contact-form');
const contactStatus = document.querySelector('#contact-status');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const CONTACT_ENDPOINT = 'https://formsubmit.co/ajax/aymanahmed20122001@gmail.com';
const CONTACT_POST_ENDPOINT = 'https://formsubmit.co/aymanahmed20122001@gmail.com';
const heroTypingTarget = document.querySelector('.text-animation span');
const HERO_TITLES = [
    'Ethical Hacker',
    'Penetration Tester',
    'Red Teaming',
    'Full Stack Developer',
    'Web Application Tester'
];

document.body.classList.add('js-enabled');
setProjectCardStagger(projectCards);
startHeroTypingLoop();

// Highlight active section in navigation bar
window.onscroll = () => {
    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 150; // Adjust offset for better accuracy
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(links => {
                links.classList.remove('active');
                const activeLink = document.querySelector('header nav a[href*=' + id + ']');
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            });
        }
    });
};

// Toggle mobile menu
menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
};

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

    setTimeout(() => {
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

if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFormStatus();

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
                    _captcha: 'false'
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
            const details = error && error.message ? ` (${error.message})` : '';
            setFormStatus(`AJAX delivery failed, using secure fallback${details}. Please complete submission in the opened tab.`, 'error');
        }
    });
}

function setProjectCardStagger(cards) {
    cards.forEach((card, index) => {
        card.style.setProperty('--stagger-delay', `${index * 90}ms`);
    });
}

function sanitizeFormPayload(payload) {
    const sanitizeText = (value) =>
        String(value || '')
            .replace(/[<>{}]/g, '')
            .replace(/[\u0000-\u001F\u007F]/g, '')
            .trim();

    return {
        name: sanitizeText(payload.name),
        email: sanitizeText(payload.email).toLowerCase(),
        phone: sanitizeText(payload.phone),
        subject: sanitizeText(payload.subject),
        message: sanitizeText(payload.message)
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
        _captcha: 'false',
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