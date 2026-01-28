// Review Panel Controller
class ReviewPanel {
    constructor() {
        this.crId = document.querySelector('.presentation').dataset.crId;
        this.panel = document.getElementById('reviewPanel');
        this.toggle = document.getElementById('panelToggle');
        this.saveIndicator = document.getElementById('saveIndicator');
        this.currentSlide = 1;

        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.renderComments();
        this.renderBubbles();
        this.updateScoreDisplays();
        this.updateStatus();
        this.updateSlideIndicator();
    }

    // Data Management
    loadData() {
        const stored = localStorage.getItem('crDashboardData');
        if (stored) {
            this.allData = JSON.parse(stored);
        } else {
            this.allData = { crs: {} };
        }

        if (!this.allData.crs[this.crId]) {
            this.allData.crs[this.crId] = {
                scores: { effort: null, efficiency: null, risk: null },
                comments: [],
                slideComments: {},
                status: 'not-started',
                lastViewed: null
            };
        }

        // Ensure slideComments exists (migration)
        if (!this.allData.crs[this.crId].slideComments) {
            this.allData.crs[this.crId].slideComments = {};
        }

        this.crData = this.allData.crs[this.crId];

        // Update last viewed
        this.crData.lastViewed = new Date().toISOString();
        this.saveData();
    }

    saveData() {
        this.allData.crs[this.crId] = this.crData;
        localStorage.setItem('crDashboardData', JSON.stringify(this.allData));
        this.showSaveIndicator();
    }

    showSaveIndicator() {
        this.saveIndicator.textContent = 'Saving...';
        this.saveIndicator.className = 'save-indicator saving';

        setTimeout(() => {
            this.saveIndicator.textContent = 'Saved!';
            this.saveIndicator.className = 'save-indicator saved';

            setTimeout(() => {
                this.saveIndicator.textContent = 'Auto-saved';
                this.saveIndicator.className = 'save-indicator';
            }, 1500);
        }, 300);
    }

    // Event Bindings
    bindEvents() {
        // Panel toggle
        this.toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });

        // Prevent clicks inside panel from closing it
        this.panel.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.panel.classList.contains('open') &&
                !this.panel.contains(e.target) &&
                !this.toggle.contains(e.target) &&
                !e.target.closest('.comment-bubble')) {
                this.closePanel();
            }
        });

        // Minimize button
        document.getElementById('panelMinimize').addEventListener('click', () => this.minimizePanel());

        // Score sliders
        ['Effort', 'Efficiency', 'Risk'].forEach(type => {
            const slider = document.getElementById(`score${type}`);
            const display = document.getElementById(`${type.toLowerCase()}Display`);

            // Set initial value from data
            const currentValue = this.crData.scores[type.toLowerCase()];
            if (currentValue !== null) {
                slider.value = currentValue;
                display.textContent = currentValue;
            }

            slider.addEventListener('input', (e) => {
                display.textContent = e.target.value;
            });

            slider.addEventListener('change', (e) => {
                this.crData.scores[type.toLowerCase()] = parseInt(e.target.value);
                this.updateStatusIfNeeded();
                this.saveData();
            });
        });

        // Add comment
        document.getElementById('addCommentBtn').addEventListener('click', () => this.addComment());

        // Comment input - add on Enter (with Shift for new line)
        document.getElementById('commentInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.addComment();
            }
        });

        // Status select
        document.getElementById('statusSelect').addEventListener('change', (e) => {
            this.crData.status = e.target.value;
            this.saveData();
        });

        // Keyboard shortcut to toggle panel (P key)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P') {
                if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
                    this.togglePanel();
                }
            }
        });

        // Listen for slide changes from the presentation
        this.observeSlideChanges();
    }

    observeSlideChanges() {
        // Watch for changes to the current slide indicator
        const slideCounter = document.getElementById('currentSlide');
        if (slideCounter) {
            const observer = new MutationObserver(() => {
                const newSlide = parseInt(slideCounter.textContent);
                if (newSlide !== this.currentSlide) {
                    this.currentSlide = newSlide;
                    this.onSlideChange();
                }
            });
            observer.observe(slideCounter, { childList: true, characterData: true, subtree: true });
        }

        // Also check on keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ') {
                setTimeout(() => {
                    const slideCounter = document.getElementById('currentSlide');
                    if (slideCounter) {
                        const newSlide = parseInt(slideCounter.textContent);
                        if (newSlide !== this.currentSlide) {
                            this.currentSlide = newSlide;
                            this.onSlideChange();
                        }
                    }
                }, 100);
            }
        });
    }

    onSlideChange() {
        this.updateSlideIndicator();
        this.renderComments();
        this.renderBubbles();
    }

    updateSlideIndicator() {
        const indicator = document.getElementById('slideIndicator');
        if (indicator) {
            indicator.textContent = `(Slide ${this.currentSlide})`;
        }
    }

    // Panel Controls
    togglePanel() {
        if (this.panel.classList.contains('open')) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    openPanel() {
        this.panel.classList.add('open');
        this.toggle.classList.add('active');
    }

    closePanel() {
        this.panel.classList.remove('open');
        this.toggle.classList.remove('active');
    }

    minimizePanel() {
        this.panel.classList.toggle('minimized');
    }

    // Score Management
    updateScoreDisplays() {
        ['effort', 'efficiency', 'risk'].forEach(type => {
            const slider = document.getElementById(`score${type.charAt(0).toUpperCase() + type.slice(1)}`);
            const display = document.getElementById(`${type}Display`);
            const value = this.crData.scores[type];

            if (value !== null) {
                slider.value = value;
                display.textContent = value;
            } else {
                display.textContent = '-';
            }
        });
    }

    updateStatusIfNeeded() {
        // Auto-update status to "pending" when scoring starts
        if (this.crData.status === 'not-started') {
            this.crData.status = 'pending';
            document.getElementById('statusSelect').value = 'pending';
        }
    }

    updateStatus() {
        document.getElementById('statusSelect').value = this.crData.status;
    }

    // Comment Management (Slide-specific)
    addComment() {
        const input = document.getElementById('commentInput');
        const text = input.value.trim();

        if (!text) return;

        const comment = {
            id: Date.now(),
            text: text,
            timestamp: new Date().toISOString()
        };

        // Add to slide-specific comments
        if (!this.crData.slideComments[this.currentSlide]) {
            this.crData.slideComments[this.currentSlide] = [];
        }
        this.crData.slideComments[this.currentSlide].push(comment);

        this.saveData();
        this.renderComments();
        this.renderBubbles();

        input.value = '';
        input.focus();

        // Auto-update status
        this.updateStatusIfNeeded();
    }

    deleteComment(commentId) {
        // Remove from slide comments
        if (this.crData.slideComments[this.currentSlide]) {
            this.crData.slideComments[this.currentSlide] =
                this.crData.slideComments[this.currentSlide].filter(c => c.id !== commentId);
        }
        // Also check legacy comments
        if (this.crData.comments) {
            this.crData.comments = this.crData.comments.filter(c => c.id !== commentId);
        }

        this.saveData();
        this.renderComments();
        this.renderBubbles();
    }

    renderComments() {
        const container = document.getElementById('commentsList');
        const slideComments = this.crData.slideComments[this.currentSlide] || [];

        if (slideComments.length === 0) {
            container.innerHTML = '<p class="comments-empty">No comments for this slide</p>';
            return;
        }

        // Sort by newest first
        const sorted = [...slideComments].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        container.innerHTML = sorted.map(comment => `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-time">${this.formatTime(comment.timestamp)}</div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                <button class="delete-comment" onclick="reviewPanel.deleteComment(${comment.id})" title="Delete">&times;</button>
            </div>
        `).join('');
    }

    // Comment Bubbles (displayed in presentation area)
    renderBubbles() {
        const container = document.getElementById('commentBubbles');
        if (!container) return;

        const slideComments = this.crData.slideComments[this.currentSlide] || [];

        if (slideComments.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Show only the most recent 3 comments as bubbles
        const recentComments = [...slideComments]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 3);

        container.innerHTML = recentComments.map((comment, index) => `
            <div class="comment-bubble" style="--bubble-index: ${index}">
                <div class="bubble-content">
                    <span class="bubble-text">${this.truncateText(comment.text, 80)}</span>
                    <span class="bubble-time">${this.formatTime(comment.timestamp)}</span>
                </div>
            </div>
        `).join('');

        // Add click handler to bubbles to open panel
        container.querySelectorAll('.comment-bubble').forEach(bubble => {
            bubble.addEventListener('click', () => this.openPanel());
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return this.escapeHtml(text);
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.reviewPanel = new ReviewPanel();
});
