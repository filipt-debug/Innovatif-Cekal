// CR Dashboard Controller
class Dashboard {
    constructor() {
        // Define available CRs
        this.crDefinitions = [
            {
                id: 'cr-leak-test',
                title: 'Reduce In-Process Leak Tests 1-3',
                subtitle: 'Reduce leak tests, keep final test at 100%',
                file: 'cr-leak-test.html',
                category: 'Process Optimization'
            }
            // Add more CRs here as they are created
        ];

        this.init();
    }

    init() {
        this.loadData();
        this.renderCRList();
        this.renderSummary();
        this.renderComments();
        this.bindEvents();
    }

    // Local Storage Management
    loadData() {
        const stored = localStorage.getItem('crDashboardData');
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            this.data = {
                crs: {}
            };
            // Initialize data for each CR
            this.crDefinitions.forEach(cr => {
                this.data.crs[cr.id] = {
                    scores: { effort: null, efficiency: null, risk: null },
                    comments: [],
                    slideComments: {},
                    status: 'not-started',
                    lastViewed: null
                };
            });
            this.saveData();
        }

        // Ensure all CRs exist in data with slideComments
        this.crDefinitions.forEach(cr => {
            if (!this.data.crs[cr.id]) {
                this.data.crs[cr.id] = {
                    scores: { effort: null, efficiency: null, risk: null },
                    comments: [],
                    slideComments: {},
                    status: 'not-started',
                    lastViewed: null
                };
            }
            // Ensure slideComments exists for migration
            if (!this.data.crs[cr.id].slideComments) {
                this.data.crs[cr.id].slideComments = {};
            }
        });
    }

    saveData() {
        localStorage.setItem('crDashboardData', JSON.stringify(this.data));
    }

    // Render CR List
    renderCRList() {
        const container = document.getElementById('crList');
        const countEl = document.getElementById('crCount');

        countEl.textContent = `${this.crDefinitions.length}`;

        container.innerHTML = this.crDefinitions.map(cr => {
            const crData = this.data.crs[cr.id] || { scores: {}, comments: [], slideComments: {}, status: 'not-started' };
            const scores = crData.scores;
            const commentCount = this.getTotalCommentCount(crData);

            return `
                <div class="cr-card" data-cr-id="${cr.id}">
                    <div class="cr-card-header">
                        <div>
                            <div class="cr-card-title">${cr.title}</div>
                            <div class="cr-card-subtitle">${cr.subtitle}</div>
                        </div>
                        <span class="cr-status ${crData.status}">${this.getStatusLabel(crData.status)}</span>
                    </div>

                    <div class="cr-scores">
                        <div class="score-item effort">
                            <div class="score-label">Effort</div>
                            <div class="score-value ${scores.effort === null ? 'not-set' : ''}">${scores.effort !== null ? scores.effort : '-'}</div>
                            <div class="score-bar">
                                <div class="score-bar-fill" style="width: ${scores.effort ? scores.effort * 10 : 0}%"></div>
                            </div>
                        </div>
                        <div class="score-item efficiency">
                            <div class="score-label">Efficiency</div>
                            <div class="score-value ${scores.efficiency === null ? 'not-set' : ''}">${scores.efficiency !== null ? scores.efficiency : '-'}</div>
                            <div class="score-bar">
                                <div class="score-bar-fill" style="width: ${scores.efficiency ? scores.efficiency * 10 : 0}%"></div>
                            </div>
                        </div>
                        <div class="score-item risk">
                            <div class="score-label">Risk</div>
                            <div class="score-value ${scores.risk === null ? 'not-set' : ''}">${scores.risk !== null ? scores.risk : '-'}</div>
                            <div class="score-bar">
                                <div class="score-bar-fill" style="width: ${scores.risk ? scores.risk * 10 : 0}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="cr-card-footer">
                        <div class="cr-comments-preview">
                            <strong>${commentCount}</strong> comment${commentCount !== 1 ? 's' : ''}
                        </div>
                        <a href="${cr.file}" class="btn-view">
                            Open presentation
                            <span>→</span>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
    }

    getTotalCommentCount(crData) {
        let count = crData.comments ? crData.comments.length : 0;
        if (crData.slideComments) {
            Object.values(crData.slideComments).forEach(slideComments => {
                count += slideComments.length;
            });
        }
        return count;
    }

    getStatusLabel(status) {
        const labels = {
            'not-started': 'Not started',
            'pending': 'Under review',
            'reviewed': 'Reviewed'
        };
        return labels[status] || status;
    }

    // Render Summary
    renderSummary() {
        const container = document.getElementById('summaryGrid');

        let totalCRs = this.crDefinitions.length;
        let reviewedCount = 0;
        let avgEffort = 0;
        let avgEfficiency = 0;
        let avgRisk = 0;
        let scoredCount = 0;

        this.crDefinitions.forEach(cr => {
            const crData = this.data.crs[cr.id];
            if (crData) {
                if (crData.status === 'reviewed') reviewedCount++;
                if (crData.scores.effort !== null) {
                    avgEffort += crData.scores.effort;
                    avgEfficiency += crData.scores.efficiency || 0;
                    avgRisk += crData.scores.risk || 0;
                    scoredCount++;
                }
            }
        });

        if (scoredCount > 0) {
            avgEffort = (avgEffort / scoredCount).toFixed(1);
            avgEfficiency = (avgEfficiency / scoredCount).toFixed(1);
            avgRisk = (avgRisk / scoredCount).toFixed(1);
        }

        container.innerHTML = `
            <div class="summary-card">
                <div class="label">Total CRs</div>
                <div class="value highlight">${totalCRs}</div>
            </div>
            <div class="summary-card">
                <div class="label">Reviewed</div>
                <div class="value">${reviewedCount}</div>
                <div class="subtext">of ${totalCRs}</div>
            </div>
            <div class="summary-card">
                <div class="label">Avg Effort</div>
                <div class="value">${scoredCount > 0 ? avgEffort : '-'}</div>
            </div>
            <div class="summary-card">
                <div class="label">Avg Efficiency</div>
                <div class="value">${scoredCount > 0 ? avgEfficiency : '-'}</div>
            </div>
            <div class="summary-card">
                <div class="label">Avg Risk</div>
                <div class="value">${scoredCount > 0 ? avgRisk : '-'}</div>
            </div>
        `;
    }

    // Render Comments
    renderComments() {
        const container = document.getElementById('allComments');

        let allComments = [];

        this.crDefinitions.forEach(cr => {
            const crData = this.data.crs[cr.id];
            if (crData) {
                // Legacy comments
                if (crData.comments) {
                    crData.comments.forEach(comment => {
                        allComments.push({
                            ...comment,
                            crId: cr.id,
                            crTitle: cr.title,
                            slideNum: null
                        });
                    });
                }
                // Slide-specific comments
                if (crData.slideComments) {
                    Object.entries(crData.slideComments).forEach(([slideNum, comments]) => {
                        comments.forEach(comment => {
                            allComments.push({
                                ...comment,
                                crId: cr.id,
                                crTitle: cr.title,
                                slideNum: parseInt(slideNum)
                            });
                        });
                    });
                }
            }
        });

        // Sort by timestamp, newest first
        allComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (allComments.length === 0) {
            container.innerHTML = '<p class="empty-state">No comments yet. Comments are added during presentations.</p>';
            return;
        }

        container.innerHTML = allComments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-cr">${comment.crTitle}${comment.slideNum ? ` (Slide ${comment.slideNum})` : ''}</span>
                    <span class="comment-time">${this.formatTime(comment.timestamp)}</span>
                </div>
                <p class="comment-text">${this.escapeHtml(comment.text)}</p>
            </div>
        `).join('');
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

    // Event Bindings
    bindEvents() {
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => this.exportReport());

        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal());
        document.getElementById('crModal').addEventListener('click', (e) => {
            if (e.target.id === 'crModal') this.closeModal();
        });
    }

    closeModal() {
        document.getElementById('crModal').classList.remove('active');
    }

    // Export Report
    exportReport() {
        let report = '# Change Request Review Report\n';
        report += `Generated: ${new Date().toLocaleString('en-US')}\n\n`;
        report += '---\n\n';

        this.crDefinitions.forEach(cr => {
            const crData = this.data.crs[cr.id];
            report += `## ${cr.title}\n`;
            report += `${cr.subtitle}\n\n`;

            report += `**Status:** ${this.getStatusLabel(crData.status)}\n\n`;

            report += `**Scores:**\n`;
            report += `- Effort: ${crData.scores.effort !== null ? crData.scores.effort + '/10' : 'Not set'}\n`;
            report += `- Efficiency: ${crData.scores.efficiency !== null ? crData.scores.efficiency + '/10' : 'Not set'}\n`;
            report += `- Risk: ${crData.scores.risk !== null ? crData.scores.risk + '/10' : 'Not set'}\n\n`;

            const totalComments = this.getTotalCommentCount(crData);
            if (totalComments > 0) {
                report += `**Comments:**\n`;
                // Legacy comments
                if (crData.comments) {
                    crData.comments.forEach(c => {
                        report += `- [${this.formatTime(c.timestamp)}] ${c.text}\n`;
                    });
                }
                // Slide comments
                if (crData.slideComments) {
                    Object.entries(crData.slideComments).forEach(([slideNum, comments]) => {
                        comments.forEach(c => {
                            report += `- [Slide ${slideNum}] [${this.formatTime(c.timestamp)}] ${c.text}\n`;
                        });
                    });
                }
            } else {
                report += `**Comments:** None\n`;
            }

            report += '\n---\n\n';
        });

        // Download as text file
        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cr-review-report-${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
