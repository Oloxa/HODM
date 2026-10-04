/**
 * Selected Work — 3D Perspective Sticky Scroll Showcase Engine
 * Inspired by futuristic cinematic reference layout.
 * Features:
 * - Smooth scroll-driven 3D layered card progression (Card 1 -> Card 7)
 * - Hardware-accelerated translate3d, rotateY, scale, opacity, and blur depth
 * - Creative Space 9:16 vertical video support with single-video autoplay & auto-pause
 * - Responsive desktop/tablet/mobile handling with zero horizontal overflow
 * - Natural unpinning and scroll release directly into the footer after the final card
 */

(function () {
    'use strict';

    function initSelectedWorkShowcases() {
        const sections = document.querySelectorAll('.selected-work-section');
        if (!sections.length) return;

        sections.forEach(section => {
            if (section.dataset.swInitialized === 'true') return;
            section.dataset.swInitialized = 'true';

            const stickyFrame = section.querySelector('.selected-work-sticky-frame');
            const cardsTrack = section.querySelector('.sw-cards-track');
            const cards = Array.from(section.querySelectorAll('.sw-card'));
            const isCreativeSpace = section.classList.contains('sw-creative-space');
            const activeIndexEl = section.querySelector('.sw-active-index');
            const totalCountEl = section.querySelector('.sw-total-count');
            const prevBtn = section.querySelector('.sw-prev-btn');
            const nextBtn = section.querySelector('.sw-next-btn');
            const dots = Array.from(section.querySelectorAll('.sw-dot'));
            const progressFill = section.querySelector('.sw-progress-fill');

            if (!cards.length || !stickyFrame) return;

            const cardCount = cards.length;
            if (totalCountEl) {
                totalCountEl.textContent = String(cardCount).padStart(2, '0');
            }

            // Dynamically scale track height for faster, snappier scroll travel across cards
            const vhPerCard = isCreativeSpace ? 25 : 34;
            section.style.height = `${(cardCount * vhPerCard) + 50}vh`;

            // Set up videos and interactive hover playback for Creative Space
            if (isCreativeSpace) {
                cards.forEach((card, idx) => {
                    const video = card.querySelector('video');
                    if (video) {
                        video.muted = true;
                        video.defaultMuted = true;
                        video.playsInline = true;
                        video.setAttribute('playsinline', '');
                        video.setAttribute('webkit-playsinline', '');
                        video.setAttribute('muted', '');
                        video.loop = true;
                        video.preload = 'auto';

                        const handleHoverPlay = () => {
                            card.classList.add('is-hover-playing');
                            video.muted = true;
                            video.defaultMuted = true;
                            if (video.readyState === 0) {
                                video.load();
                            }
                            const playPromise = video.play();
                            if (playPromise !== undefined) {
                                playPromise.catch(() => {});
                            }
                        };

                        const handleHoverLeave = () => {
                            card.classList.remove('is-hover-playing');
                            // If this card is not the active center card, pause it when mouse leaves
                            if (idx !== currentActiveIndex) {
                                video.pause();
                            }
                        };

                        card.addEventListener('mouseenter', handleHoverPlay);
                        card.addEventListener('mouseleave', handleHoverLeave);
                        card.addEventListener('pointerenter', handleHoverPlay);
                        card.addEventListener('pointerleave', handleHoverLeave);

                        // Clicking any visible card centers and focuses it
                        card.addEventListener('click', (e) => {
                            if (idx !== currentActiveIndex) {
                                e.preventDefault();
                                scrollToCard(idx);
                            }
                        });
                    }
                });
            }

            let currentCardFloat = 0;
            let currentActiveIndex = 0;
            let isTicking = false;
            let isSectionInView = false;

            // IntersectionObserver to pause media when completely out of viewport
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        isSectionInView = entry.isIntersecting;
                        if (!isSectionInView && isCreativeSpace) {
                            cards.forEach(card => {
                                const v = card.querySelector('video');
                                if (v && !v.paused) v.pause();
                            });
                        } else if (isSectionInView) {
                            requestTick();
                        }
                    });
                }, { threshold: [0, 0.05, 0.2, 0.5] });

                observer.observe(section);
            } else {
                isSectionInView = true;
            }

            // Calculate card transforms based on continuous float index [0 to cardCount - 1]
            function renderCards(cardFloat) {
                const isMobile = window.innerWidth <= 768;
                const isSmallMobile = window.innerWidth <= 480;

                // Spacing and perspective parameters
                const stepX = isCreativeSpace
                    ? (isSmallMobile ? 220 : (isMobile ? 260 : Math.min(window.innerWidth * 0.26, 350)))
                    : (isSmallMobile ? 280 : (isMobile ? 340 : Math.min(window.innerWidth * 0.38, 520)));

                const zDepthMultiplier = isCreativeSpace ? 130 : 160;
                const rotateMultiplier = isCreativeSpace ? 14 : 16;

                cards.forEach((card, i) => {
                    const delta = i - cardFloat;
                    const absDelta = Math.abs(delta);

                    if (absDelta > 2.5) {
                        card.style.opacity = '0';
                        card.style.pointerEvents = 'none';
                        card.style.transform = `translate3d(${delta > 0 ? 800 : -800}px, -50%, -300px) scale(0.6)`;
                        card.style.visibility = 'hidden';
                        return;
                    }

                    card.style.visibility = 'visible';

                    // Compute smooth 3D transforms
                    const tx = delta * stepX;
                    const tz = -Math.pow(absDelta, 1.25) * zDepthMultiplier;
                    const ry = Math.max(-28, Math.min(28, delta * -rotateMultiplier));
                    const scale = Math.max(0.65, 1 - absDelta * (isCreativeSpace ? 0.12 : 0.14));

                    // Opacity falloff
                    let opacity = 1;
                    if (absDelta > 0.4) {
                        opacity = Math.max(0, 1 - (absDelta - 0.4) * 0.58);
                    }

                    // Blur falloff
                    const blurPx = absDelta > 0.5 ? Math.min(6, (absDelta - 0.5) * 4) : 0;

                    // Layering z-index
                    const zIndex = Math.round(40 - absDelta * 12);

                    card.style.transform = `translate3d(calc(-50% + ${tx.toFixed(1)}px), -50%, ${tz.toFixed(1)}px) rotateY(${ry.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
                    card.style.opacity = opacity.toFixed(2);
                    card.style.filter = blurPx > 0.2 ? `blur(${blurPx.toFixed(1)}px)` : 'none';
                    card.style.zIndex = String(zIndex);
                    card.style.pointerEvents = absDelta < 1.6 ? 'auto' : 'none';

                    if (absDelta < 0.45) {
                        card.classList.add('is-active-card');
                    } else {
                        card.classList.remove('is-active-card');
                    }
                });

                // Update Active Index and UI Indicators
                const newActiveIndex = Math.min(cardCount - 1, Math.max(0, Math.round(cardFloat)));
                if (newActiveIndex !== currentActiveIndex) {
                    currentActiveIndex = newActiveIndex;

                    if (activeIndexEl) {
                        activeIndexEl.textContent = String(currentActiveIndex + 1).padStart(2, '0');
                    }

                    dots.forEach((dot, idx) => {
                        if (idx === currentActiveIndex) {
                            dot.classList.add('active');
                            dot.setAttribute('aria-current', 'true');
                        } else {
                            dot.classList.remove('active');
                            dot.removeAttribute('aria-current');
                        }
                    });

                    // Manage Creative Space Video Autoplay (Only active video plays!)
                    if (isCreativeSpace) {
                        cards.forEach((card, idx) => {
                            const video = card.querySelector('video');
                            if (!video) return;

                            if (idx === currentActiveIndex) {
                                if (video.paused && isSectionInView) {
                                    video.muted = true;
                                    const playPromise = video.play();
                                    if (playPromise !== undefined) {
                                        playPromise.catch(() => {});
                                    }
                                }
                            } else {
                                if (!video.paused) {
                                    video.pause();
                                }
                            }
                        });
                    }
                }

                // Update continuous progress bar fill
                if (progressFill) {
                    const normProgress = cardCount > 1 ? (cardFloat / (cardCount - 1)) * 100 : 100;
                    progressFill.style.width = `${Math.min(100, Math.max(0, normProgress)).toFixed(1)}%`;
                }
            }

            function updateScroll() {
                const rect = section.getBoundingClientRect();
                const totalScrollDistance = section.offsetHeight - window.innerHeight;

                if (totalScrollDistance <= 0) {
                    isTicking = false;
                    return;
                }

                // Calculate progress within the sticky section
                // rect.top is 0 when the section hits top of viewport
                const rawProgress = (-rect.top) / totalScrollDistance;
                const clampedProgress = Math.max(0, Math.min(1, rawProgress));
                const targetCardFloat = clampedProgress * (cardCount - 1);

                currentCardFloat = targetCardFloat;
                renderCards(currentCardFloat);

                isTicking = false;
            }

            function requestTick() {
                if (!isTicking) {
                    window.requestAnimationFrame(updateScroll);
                    isTicking = true;
                }
            }

            window.addEventListener('scroll', requestTick, { passive: true });
            window.addEventListener('resize', requestTick, { passive: true });

            // Interactive Navigation: Previous and Next buttons
            function scrollToCard(targetIndex) {
                const clamped = Math.max(0, Math.min(cardCount - 1, targetIndex));
                const totalScrollDistance = section.offsetHeight - window.innerHeight;
                const sectionTop = section.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop);
                const targetScrollY = sectionTop + (clamped / (cardCount - 1)) * totalScrollDistance;

                window.scrollTo({
                    top: targetScrollY,
                    behavior: 'smooth'
                });
            }

            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    scrollToCard(currentActiveIndex - 1);
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    scrollToCard(currentActiveIndex + 1);
                });
            }

            dots.forEach((dot, idx) => {
                dot.addEventListener('click', (e) => {
                    e.preventDefault();
                    scrollToCard(idx);
                });
            });

            // Initial frame setup
            updateScroll();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSelectedWorkShowcases);
    } else {
        initSelectedWorkShowcases();
    }
})();
