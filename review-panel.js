// Review Panel Controller
class ReviewPanel {
    constructor() {
        this.crId = document.querySelector('.presentation').dataset.crId;
        this.panel = document.getElementById('reviewPanel');
        this.toggle = document.getElementById('panelToggle');
        this.saveIndicator = document.getElementById('saveIndicator');

        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.renderComments();
        this.updateScoreDisplays();
        this.updateStatus();
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
                status: 'not-started',
                lastViewed: null
            };
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
        this.saveIndicator.textContent = 'Sparar...';
        this.saveIndicator.className = 'save-indicator saving';

        setTimeout(() => {
            this.saveIndicator.textContent = 'Sparat!';
            this.saveIndicator.className = 'save-indicator saved';

            setTimeout(() => {
                this.saveIndicator.textContent = 'Sparas automatiskt';
                this.saveIndicator.className = 'save-indicator';
            }, 1500);
        }, 300);
    }

    // Event Bindings
    bindEvents() {
        // Panel toggle
        this.toggle.addEventListener('click', () => this.togglePanel());

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
    }

    // Panel Controls
    togglePanel() {
        this.panel.classList.toggle('open');
        this.toggle.classList.toggle('active');
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

    // Comment Management
    addComment() {
        const input = document.getElementById('commentInput');
        const text = input.value.trim();

        if (!text) return;

        const comment = {
            id: Date.now(),
            text: text,
            timestamp: new Date().toISOString()
        };

        this.crData.comments.push(comment);
        this.saveData();
        this.renderComments();

        input.value = '';
        input.focus();

        // Auto-update status
        this.updateStatusIfNeeded();
    }

    deleteComment(commentId) {
        this.crData.comments = this.crData.comments.filter(c => c.id !== commentId);
        this.saveData();
        this.renderComments();
    }

    renderComments() {
        const container = document.getElementById('commentsList');

        if (this.crData.comments.length === 0) {
            container.innerHTML = '<p class="comments-empty">Inga kommentarer ännu</p>';
            return;
        }

        // Sort by newest first
        const sorted = [...this.crData.comments].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        container.innerHTML = sorted.map(comment => `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-time">${this.formatTime(comment.timestamp)}</div>
                <div class="comment-text">${this.escapeHtml(comment.text)}</div>
                <button class="delete-comment" onclick="reviewPanel.deleteComment(${comment.id})" title="Ta bort">&times;</button>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString('sv-SE', {
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
