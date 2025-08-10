// Trip Planning page functionality
class PlanningPage {
    constructor() {
        this.api = window.TravelBuddyAPI;
        this.currentTrip = {
            days: []
        };
        this.isEditing = false;
        this.editingTripId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkForPrefilledData();
        this.loadEditingTrip();
        this.initializeDays();
    }

    bindEvents() {
        // Form submission
        const tripForm = Utils.$('#trip-form');
        if (tripForm) {
            tripForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // Date validation
        this.bindDateValidation();

        // Action buttons
        this.bindActionButtons();

        // Dynamic day management
        this.bindDayManagement();
    }

    bindDateValidation() {
        const startDateInput = Utils.$('#start-date');
        const endDateInput = Utils.$('#end-date');

        if (startDateInput && endDateInput) {
            startDateInput.addEventListener('change', () => {
                this.validateDates();
                this.updateDaysBasedOnDates();
            });

            endDateInput.addEventListener('change', () => {
                this.validateDates();
                this.updateDaysBasedOnDates();
            });
        }
    }

    bindActionButtons() {
        const saveDraftBtn = Utils.$('#save-draft-btn');
        const saveTripBtn = Utils.$('#save-trip-btn');
        const generateSuggestionsBtn = Utils.$('#generate-suggestions');
        const addDayBtn = Utils.$('#add-day-btn');

        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveTrip('draft'));
        }

        if (saveTripBtn) {
            saveTripBtn.addEventListener('click', () => this.saveTrip('planned'));
        }

        if (generateSuggestionsBtn) {
            generateSuggestionsBtn.addEventListener('click', () => this.generateAISuggestions());
        }

        if (addDayBtn) {
            addDayBtn.addEventListener('click', () => this.addDay());
        }
    }

    bindDayManagement() {
        const itineraryContainer = Utils.$('#itinerary-container');
        if (itineraryContainer) {
            itineraryContainer.addEventListener('click', (e) => {
                if (e.target.matches('.remove-day-btn')) {
                    const dayIndex = parseInt(e.target.dataset.dayIndex);
                    this.removeDay(dayIndex);
                } else if (e.target.matches('.add-activity-btn')) {
                    const dayIndex = parseInt(e.target.dataset.dayIndex);
                    this.showAddActivityForm(dayIndex);
                } else if (e.target.matches('.save-activity-btn')) {
                    const dayIndex = parseInt(e.target.dataset.dayIndex);
                    this.saveActivity(dayIndex);
                } else if (e.target.matches('.cancel-activity-btn')) {
                    const dayIndex = parseInt(e.target.dataset.dayIndex);
                    this.cancelAddActivity(dayIndex);
                } else if (e.target.matches('.remove-activity-btn')) {
                    const dayIndex = parseInt(e.target.dataset.dayIndex);
                    const activityIndex = parseInt(e.target.dataset.activityIndex);
                    this.removeActivity(dayIndex, activityIndex);
                }
            });
        }
    }

    checkForPrefilledData() {
        // Check if coming from destinations page
        const planningDestination = Utils.storage.get('planningDestination');
        if (planningDestination) {
            const destinationInput = Utils.$('#destination');
            if (destinationInput) {
                destinationInput.value = `${planningDestination.name}, ${planningDestination.country}`;
            }
            Utils.storage.remove('planningDestination');
        }

        // Check URL parameters for editing
        const urlParams = Utils.getQueryParams();
        if (urlParams.edit) {
            this.editingTripId = parseInt(urlParams.edit);
            this.isEditing = true;
        }
    }

    loadEditingTrip() {
        if (this.isEditing && this.editingTripId) {
            const trip = this.api.getTrip(this.editingTripId);
            if (trip) {
                this.populateFormWithTrip(trip);
                this.currentTrip = { ...trip };
            }
        }
    }

    populateFormWithTrip(trip) {
        // Populate basic trip info
        const fields = {
            'trip-name': trip.name,
            'destination': trip.destination,
            'start-date': trip.startDate,
            'end-date': trip.endDate,
            'travelers': trip.travelers,
            'budget': trip.budget
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = Utils.$(`#${fieldId}`);
            if (field && value) {
                field.value = value;
            }
        });

        // Populate trip types
        if (trip.types) {
            trip.types.forEach(type => {
                const checkbox = Utils.$(`input[type="checkbox"][value="${type}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }

        // Update page title
        const pageTitle = Utils.$('.page-header h1');
        if (pageTitle) {
            pageTitle.textContent = 'Edit Trip';
        }
    }

    initializeDays() {
        if (this.currentTrip.days && this.currentTrip.days.length > 0) {
            this.renderDays();
        } else {
            // Add first day by default
            this.addDay();
        }
    }

    validateDates() {
        const startDate = Utils.$('#start-date')?.value;
        const endDate = Utils.$('#end-date')?.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (start < today) {
                Utils.showToast('Start date cannot be in the past', 'error');
                return false;
            }

            if (end <= start) {
                Utils.showToast('End date must be after start date', 'error');
                return false;
            }

            return true;
        }

        return false;
    }

    updateDaysBasedOnDates() {
        const startDate = Utils.$('#start-date')?.value;
        const endDate = Utils.$('#end-date')?.value;

        if (startDate && endDate && this.validateDates()) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            // Adjust days array to match date range
            while (this.currentTrip.days.length < daysDiff) {
                this.currentTrip.days.push({
                    dayNumber: this.currentTrip.days.length + 1,
                    activities: []
                });
            }

            while (this.currentTrip.days.length > daysDiff) {
                this.currentTrip.days.pop();
            }

            this.renderDays();
        }
    }

    addDay() {
        const dayNumber = this.currentTrip.days.length + 1;
        this.currentTrip.days.push({
            dayNumber: dayNumber,
            activities: []
        });
        this.renderDays();
    }

    removeDay(dayIndex) {
        if (this.currentTrip.days.length <= 1) {
            Utils.showToast('Trip must have at least one day', 'warning');
            return;
        }

        this.currentTrip.days.splice(dayIndex, 1);
        
        // Renumber remaining days
        this.currentTrip.days.forEach((day, index) => {
            day.dayNumber = index + 1;
        });

        this.renderDays();
    }

    renderDays() {
        const container = Utils.$('#itinerary-container');
        if (!container) return;

        const daysHTML = this.currentTrip.days.map((day, dayIndex) => `
            <div class="day-container" data-day-index="${dayIndex}">
                <div class="day-header">
                    <div class="day-title">
                        <div class="day-number">${day.dayNumber}</div>
                        <span>Day ${day.dayNumber}</span>
                    </div>
                    <div class="day-actions">
                        <button type="button" class="btn btn-outline btn-day-action add-activity-btn" data-day-index="${dayIndex}">
                            <i class="fas fa-plus"></i> Add Activity
                        </button>
                        ${this.currentTrip.days.length > 1 ? `
                            <button type="button" class="btn btn-danger btn-day-action remove-day-btn" data-day-index="${dayIndex}">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="activities-list">
                    ${this.renderActivities(day.activities, dayIndex)}
                </div>
                <div class="add-activity-form" id="add-activity-form-${dayIndex}" style="display: none;">
                    ${this.renderAddActivityForm(dayIndex)}
                </div>
            </div>
        `).join('');

        container.innerHTML = daysHTML;
    }

    renderActivities(activities, dayIndex) {
        if (!activities || activities.length === 0) {
            return `
                <div class="no-activities">
                    <p>No activities planned for this day</p>
                </div>
            `;
        }

        return activities.map((activity, activityIndex) => `
            <div class="activity-item">
                <div class="activity-header">
                    <div class="activity-title">${activity.name}</div>
                    <div class="activity-time">${activity.time || 'All day'}</div>
                </div>
                ${activity.description ? `<div class="activity-description">${activity.description}</div>` : ''}
                <div class="activity-actions">
                    <button type="button" class="btn btn-outline btn-sm remove-activity-btn" 
                            data-day-index="${dayIndex}" data-activity-index="${activityIndex}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderAddActivityForm(dayIndex) {
        return `
            <h4>Add Activity</h4>
            <div class="form-grid">
                <div class="form-group">
                    <label>Activity Name</label>
                    <input type="text" id="activity-name-${dayIndex}" placeholder="e.g., Visit Eiffel Tower" required>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <input type="time" id="activity-time-${dayIndex}">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="activity-description-${dayIndex}" rows="3" placeholder="Optional details about the activity"></textarea>
                </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary cancel-activity-btn" data-day-index="${dayIndex}">
                    Cancel
                </button>
                <button type="button" class="btn btn-primary save-activity-btn" data-day-index="${dayIndex}">
                    Add Activity
                </button>
            </div>
        `;
    }

    showAddActivityForm(dayIndex) {
        const form = Utils.$(`#add-activity-form-${dayIndex}`);
        if (form) {
            form.style.display = 'block';
            form.classList.add('expanded');
            
            // Focus on the name input
            const nameInput = Utils.$(`#activity-name-${dayIndex}`);
            if (nameInput) {
                nameInput.focus();
            }
        }
    }

    saveActivity(dayIndex) {
        const nameInput = Utils.$(`#activity-name-${dayIndex}`);
        const timeInput = Utils.$(`#activity-time-${dayIndex}`);
        const descriptionInput = Utils.$(`#activity-description-${dayIndex}`);

        if (!nameInput?.value.trim()) {
            Utils.showToast('Activity name is required', 'error');
            return;
        }

        const activity = {
            name: nameInput.value.trim(),
            time: timeInput?.value || '',
            description: descriptionInput?.value.trim() || ''
        };

        this.currentTrip.days[dayIndex].activities.push(activity);
        this.renderDays();
        Utils.showToast('Activity added successfully', 'success');
    }

    cancelAddActivity(dayIndex) {
        const form = Utils.$(`#add-activity-form-${dayIndex}`);
        if (form) {
            form.style.display = 'none';
            form.classList.remove('expanded');
        }
    }

    removeActivity(dayIndex, activityIndex) {
        this.currentTrip.days[dayIndex].activities.splice(activityIndex, 1);
        this.renderDays();
        Utils.showToast('Activity removed', 'info');
    }

    handleFormSubmit() {
        const form = Utils.$('#trip-form');
        if (!form || !Utils.validateForm(form)) {
            return;
        }

        if (!this.validateDates()) {
            return;
        }

        this.saveTrip('planned');
    }

    saveTrip(status = 'draft') {
        const form = Utils.$('#trip-form');
        if (!form) return;

        const formData = Utils.getFormData(form);
        
        // Get selected trip types
        const selectedTypes = Array.from(form.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        const tripData = {
            ...formData,
            types: selectedTypes,
            days: this.currentTrip.days,
            status: status,
            id: this.editingTripId || undefined
        };

        try {
            const tripId = this.api.saveTrip(tripData);
            
            const message = this.isEditing ? 
                `Trip updated successfully` : 
                `Trip ${status === 'draft' ? 'saved as draft' : 'saved'} successfully`;
            
            Utils.showToast(message, 'success');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Error saving trip:', error);
            Utils.showToast('Failed to save trip', 'error');
        }
    }

    async generateAISuggestions() {
        const generateBtn = Utils.$('#generate-suggestions');
        if (!generateBtn) return;

        // Show loading state
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<div class="loading"></div> Generating...';
        generateBtn.disabled = true;

        try {
            const formData = Utils.getFormData(Utils.$('#trip-form'));
            const suggestions = await this.api.getAISuggestions(formData);
            
            this.showSuggestionsPanel(suggestions);
            Utils.showToast('AI suggestions generated!', 'success');
            
        } catch (error) {
            console.error('Error generating suggestions:', error);
            Utils.showToast('Failed to generate suggestions', 'error');
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }

    showSuggestionsPanel(suggestions) {
        // Create suggestions panel if it doesn't exist
        let panel = Utils.$('#suggestions-panel');
        if (!panel) {
            panel = Utils.createElement('div', {
                id: 'suggestions-panel',
                class: 'suggestions-panel'
            });
            document.body.appendChild(panel);
        }

        const panelHTML = `
            <div class="suggestions-header">
                <h3><i class="fas fa-magic"></i> AI Suggestions</h3>
                <button class="close-suggestions btn-icon">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="suggestions-content">
                <div class="suggestion-category">
                    <h4>Recommended Activities</h4>
                    ${suggestions.activities.map(activity => `
                        <div class="suggestion-item" data-type="activity" data-suggestion='${JSON.stringify(activity)}'>
                            <div class="suggestion-title">${activity.name}</div>
                            <div class="suggestion-description">${activity.description}</div>
                            <div class="suggestion-meta">
                                <span class="suggestion-type">${activity.type}</span>
                                <span>${activity.time}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        panel.innerHTML = panelHTML;
        panel.classList.add('open');

        // Bind events
        const closeBtn = panel.querySelector('.close-suggestions');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                panel.classList.remove('open');
            });
        }

        // Bind suggestion item clicks
        const suggestionItems = panel.querySelectorAll('.suggestion-item');
        suggestionItems.forEach(item => {
            item.addEventListener('click', () => {
                const suggestion = JSON.parse(item.dataset.suggestion);
                this.applySuggestion(suggestion, item.dataset.type);
            });
        });
    }

    applySuggestion(suggestion, type) {
        if (type === 'activity' && this.currentTrip.days.length > 0) {
            // Add to first day that has space or create new day
            let targetDayIndex = 0;
            
            // Find day with fewer than 4 activities
            for (let i = 0; i < this.currentTrip.days.length; i++) {
                if (this.currentTrip.days[i].activities.length < 4) {
                    targetDayIndex = i;
                    break;
                }
            }

            const activity = {
                name: suggestion.name,
                description: suggestion.description,
                time: suggestion.time || ''
            };

            this.currentTrip.days[targetDayIndex].activities.push(activity);
            this.renderDays();
            
            Utils.showToast(`Added "${suggestion.name}" to Day ${targetDayIndex + 1}`, 'success');
        }
    }

    // Method to export trip data
    exportTrip() {
        const tripData = {
            ...Utils.getFormData(Utils.$('#trip-form')),
            days: this.currentTrip.days
        };

        const dataStr = JSON.stringify(tripData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${tripData['trip-name'] || 'trip'}-plan.json`;
        link.click();
    }

    // Method to import trip data
    importTrip(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const tripData = JSON.parse(e.target.result);
                this.populateFormWithTrip(tripData);
                this.currentTrip.days = tripData.days || [];
                this.renderDays();
                Utils.showToast('Trip imported successfully', 'success');
            } catch (error) {
                Utils.showToast('Invalid trip file', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize planning page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.planningPage = new PlanningPage();
});

// Add planning-specific styles
const planningStyles = `
    .no-activities {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
        font-style: italic;
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }
    
    .suggestions-panel {
        position: fixed;
        right: -400px;
        top: 70px;
        width: 380px;
        height: calc(100vh - 70px);
        background: var(--bg-primary);
        box-shadow: var(--shadow-lg);
        transition: right var(--transition-normal);
        overflow-y: auto;
        z-index: 50;
        border-left: 1px solid var(--border-color);
    }
    
    .suggestions-panel.open {
        right: 0;
    }
    
    .suggestions-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        background: var(--bg-secondary);
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .close-suggestions {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all var(--transition-fast);
    }
    
    .close-suggestions:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
    }
    
    @media (max-width: 768px) {
        .suggestions-panel {
            width: 100%;
            right: -100%;
        }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = planningStyles;
document.head.appendChild(styleSheet);