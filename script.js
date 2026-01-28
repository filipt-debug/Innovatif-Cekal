// Presentation Controller
class Presentation {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.totalSlides = this.slides.length;
        this.currentSlide = 1;
        this.isAnimating = false;

        this.init();
    }

    init() {
        this.createNavDots();
        this.bindEvents();
        this.updateUI();
        this.animateSlide(1);
    }

    createNavDots() {
        const nav = document.getElementById('slideNav');
        for (let i = 1; i <= this.totalSlides; i++) {
            const dot = document.createElement('div');
            dot.className = 'dot' + (i === 1 ? ' active' : '');
            dot.dataset.slide = i;
            dot.addEventListener('click', () => this.goToSlide(i));
            nav.appendChild(dot);
        }
    }

    bindEvents() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevSlide();
            } else if (e.key === 'Home') {
                e.preventDefault();
                this.goToSlide(1);
            } else if (e.key === 'End') {
                e.preventDefault();
                this.goToSlide(this.totalSlides);
            } else if (e.key >= '1' && e.key <= '9') {
                const slideNum = parseInt(e.key);
                if (slideNum <= this.totalSlides) {
                    this.goToSlide(slideNum);
                }
            }
        });

        // Button navigation
        document.getElementById('prevBtn').addEventListener('click', () => this.prevSlide());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSlide());

        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        });

        // Click on slide content area to advance (optional)
        document.querySelectorAll('.slide-content').forEach(content => {
            content.addEventListener('click', (e) => {
                // Only advance if clicking on the slide itself, not interactive elements
                if (e.target === content || e.target.closest('.slide-content') === content) {
                    const rect = content.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    if (clickX > rect.width / 2) {
                        this.nextSlide();
                    }
                }
            });
        });
    }

    handleSwipe(startX, endX) {
        const threshold = 50;
        const diff = startX - endX;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.nextSlide();
            } else {
                this.prevSlide();
            }
        }
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides && !this.isAnimating) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    prevSlide() {
        if (this.currentSlide > 1 && !this.isAnimating) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    goToSlide(slideNum) {
        if (slideNum === this.currentSlide || this.isAnimating) return;

        this.isAnimating = true;
        const direction = slideNum > this.currentSlide ? 'next' : 'prev';

        // Update slide classes
        this.slides.forEach((slide, index) => {
            const slideIndex = index + 1;
            slide.classList.remove('active', 'prev');

            if (slideIndex === slideNum) {
                slide.classList.add('active');
            } else if (slideIndex < slideNum) {
                slide.classList.add('prev');
            }
        });

        this.currentSlide = slideNum;
        this.updateUI();
        this.animateSlide(slideNum);

        setTimeout(() => {
            this.isAnimating = false;
        }, 500);
    }

    updateUI() {
        // Update progress bar
        const progress = (this.currentSlide / this.totalSlides) * 100;
        document.getElementById('progress').style.width = `${progress}%`;

        // Update slide counter
        document.getElementById('currentSlide').textContent = this.currentSlide;
        document.getElementById('totalSlides').textContent = this.totalSlides;

        // Update navigation buttons
        document.getElementById('prevBtn').disabled = this.currentSlide === 1;
        document.getElementById('nextBtn').disabled = this.currentSlide === this.totalSlides;

        // Update nav dots
        document.querySelectorAll('.slide-nav .dot').forEach((dot, index) => {
            dot.classList.toggle('active', index + 1 === this.currentSlide);
        });
    }

    animateSlide(slideNum) {
        const slide = document.querySelector(`[data-slide="${slideNum}"]`);
        if (!slide) return;

        // Animate counters
        const counters = slide.querySelectorAll('.counter');
        counters.forEach(counter => {
            this.animateCounter(counter);
        });

        // Re-trigger bar animations
        const bars = slide.querySelectorAll('.test-bar, .bar-fill');
        bars.forEach(bar => {
            bar.style.animation = 'none';
            bar.offsetHeight; // Trigger reflow
            bar.style.animation = '';
        });
    }

    animateCounter(element) {
        const target = parseFloat(element.dataset.target);
        const decimals = parseInt(element.dataset.decimals) || 0;
        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = target * easeOut;

            element.textContent = current.toFixed(decimals);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target.toFixed(decimals);
            }
        };

        requestAnimationFrame(animate);
    }
}

// Initialize presentation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Presentation();
});

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.presentation')) {
        e.preventDefault();
    }
});

// Full screen toggle with F key
document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }
});
