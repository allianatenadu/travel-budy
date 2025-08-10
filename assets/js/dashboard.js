// Dashboard page functionality
class DashboardPage {
    constructor() {
        this.api = window.TravelBuddyAPI;
        this.currentFilter = 'all';
        this.currentSort = 'date-desc';
        this.currentSearch = '';
        this.allTrips = [];
        this.init();
    }

    async init() {
        await this.loadTrips();
        this.loadStatistics();
        this.bindEvents();
    }

    async loadTrips() {
        try {
            this.allTrips = this.api.getTrips();
            this.renderTrips(this.allTrips);
            this.updateFilterCounts();
        } catch (error) {
            console.error('Error loading trips:', error);
            this.renderError('Failed to load trips');
        }
    }

    loadStatistics() {
        const stats = this.api.getTripStatistics();
        
        // Update stat cards with animation
        this.updateStatCard('total-trips', stats.totalTrips);
        this.updateStatCard('countries-visited', stats.countriesVisited);
        this.updateStatCard('total-spent', this.api.formatCurrency(stats.totalSpent));
        this.updateStatCard('upcoming-trips', stats.upcomingTrips);
    }

    updateStatCard(elementId, value) {
        const element = Utils.$(`#${elementId}`);
        if (element) {
            if (typeof value === 'number' && elementId !== 'total-spent') {
                Utils.animateValue(element, 0, value, 1000);
            } else {
                element.textContent = value;
            }
        }
    }

    bindEvents() {
        // Filter tabs
        const filterTabs = Utils.$$('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setActiveFilter(e.target.dataset.filter);
            });
        });

        // Search
        const searchInput = Utils.$('#trip-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentSearch = e.target.value;
                this.filterAndRenderTrips();
            }, 300));
        }

        // Sort
        const sortSelect = Utils.$('#trip-sort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.filterAndRenderTrips();
            });
        }

        // Modal events
        this.bindModalEvents();
    }

    bindModalEvents() {
        const modal = Utils.$('#trip-modal');
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Utils.closeModal('#trip-modal');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Utils.closeModal('#trip-modal');
                }
            });
        }
    }

    setActiveFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        Utils.$$('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            }
        });

        this.filterAndRenderTrips();
    }

    filterAndRenderTrips() {
        let filteredTrips = [...this.allTrips];

        // Apply status filter
        if (this.currentFilter !== 'all') {
            filteredTrips = filteredTrips.filter(trip => {
                const status = this.getTripStatus(trip);
                return status === this.currentFilter;
            });
        }

        // Apply search filter
        if (this.currentSearch) {
            const searchTerm = this.currentSearch.toLowerCase();
            filteredTrips = filteredTrips.filter(trip => 
                trip.name?.toLowerCase().includes(searchTerm) ||
                trip.destination?.toLowerCase().includes(searchTerm)
            );
        }

        // Apply sorting
        filteredTrips = this.sortTrips(filteredTrips, this.currentSort);

        this.renderTrips(filteredTrips);
    }

    getTripStatus(trip) {
        if (trip.status === 'draft') return 'draft';
        
        const now = new Date();
        const startDate = new Date(trip.startDate);
        const endDate = new Date(trip.endDate);
        
        if (now < startDate) return 'upcoming';
        if (now >= startDate && now <= endDate) return 'ongoing';
        return 'completed';
    }

    sortTrips(trips, sortBy) {
        return trips.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate);
                case 'date-asc':
                    return new Date(a.createdAt || a.startDate) - new Date(b.createdAt || b.startDate);
                case 'name-asc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '');
                default:
                    return 0;
            }
        });
    }

    renderTrips(trips) {
        const container = Utils.$('#trips-grid');
        const noTripsElement = Utils.$('#no-trips');
        
        if (!container) return;

        if (!trips || trips.length === 0) {
            container.innerHTML = '';
            if (noTripsElement) {
                noTripsElement.style.display = 'block';
            }
            return;
        }

        if (noTripsElement) {
            noTripsElement.style.display = 'none';
        }

        const tripsHTML = trips.map(trip => this.renderTripCard(trip)).join('');
        container.innerHTML = tripsHTML;
        
        this.bindTripCardEvents();
    }

    renderTripCard(trip) {
        const status = this.getTripStatus(trip);
        const statusClass = status;
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);
        
        const dayCount = trip.days?.length || 0;
        const activityCount = trip.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;
        
        return `
            <div class="trip-card" data-trip-id="${trip.id}">
                <div class="trip-card-header">
                    <i class="fas fa-map-marked-alt"></i>
                    <div class="trip-status ${statusClass}">${statusText}</div>
                </div>
                <div class="trip-card-content">
                    <div class="trip-card-header-info">
                        <div>
                            <h3 class="trip-title">${trip.name || 'Untitled Trip'}</h3>
                            <p class="trip-destination">
                                <i class="fas fa-map-marker-alt"></i>
                                ${trip.destination || 'No destination'}
                            </p>
                        </div>
                    </div>
                    <div class="trip-dates">
                        <i class="fas fa-calendar"></i>
                        ${trip.startDate ? Utils.formatDate(trip.startDate) : 'No date'} - 
                        ${trip.endDate ? Utils.formatDate(trip.endDate) : 'No date'}
                    </div>
                    <div class="trip-summary">
                        <div class="trip-summary-item">
                            <span class="trip-summary-value">${dayCount}</span>
                            <span class="trip-summary-label">Days</span>
                        </div>
                        <div class="trip-summary-item">
                            <span class="trip-summary-value">${activityCount}</span>
                            <span class="trip-summary-label">Activities</span>
                        </div>
                        <div class="trip-summary-item">
                            <span class="trip-summary-value">${trip.travelers || 1}</span>
                            <span class="trip-summary-label">Travelers</span>
                        </div>
                    </div>
                    <div class="trip-actions">
                        <button class="trip-action-btn view" data-trip-id="${trip.id}" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="trip-action-btn edit" data-trip-id="${trip.id}" title="Edit Trip">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="trip-action-btn delete" data-trip-id="${trip.id}" title="Delete Trip">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    bindTripCardEvents() {
        // Trip card clicks (view details)
        const tripCards = Utils.$$('.trip-card');
        tripCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.trip-action-btn')) return;
                
                const tripId = card.dataset.tripId;
                this.showTripModal(tripId);
            });
        });

        // Action buttons
        const actionButtons = Utils.$$('.trip-action-btn');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tripId = btn.dataset.tripId;
                const action = btn.classList.contains('view') ? 'view' :
                              btn.classList.contains('edit') ? 'edit' : 'delete';
                
                this.handleTripAction(action, tripId);
            });
        });
    }

    handleTripAction(action, tripId) {
        switch (action) {
            case 'view':
                this.showTripModal(tripId);
                break;
            case 'edit':
                this.editTrip(tripId);
                break;
            case 'delete':
                this.deleteTrip(tripId);
                break;
        }
    }

    showTripModal(tripId) {
        const trip = this.api.getTrip(parseInt(tripId));
        if (!trip) return;

        const modalBody = Utils.$('#modal-body');
        if (!modalBody) return;

        const status = this.getTripStatus(trip);
        const statusClass = status;
        const statusText = status.charAt(0).toUpperCase() + status.slice(1);

        const modalHTML = `
            <div class="trip-detail-header">
                <div class="trip-detail-title">
                    <h2>${trip.name || 'Untitled Trip'}</h2>
                    <div class="trip-detail-meta">
                        <span class="trip-status ${statusClass}">${statusText}</span>
                        <span class="trip-destination">
                            <i class="fas fa-map-marker-alt"></i>
                            ${trip.destination || 'No destination'}
                        </span>
                        <span class="trip-dates">
                            <i class="fas fa-calendar"></i>
                            ${trip.startDate ? Utils.formatDate(trip.startDate) : 'No date'} - 
                            ${trip.endDate ? Utils.formatDate(trip.endDate) : 'No date'}
                        </span>
                    </div>
                </div>
                <div class="trip-detail-actions">
                    <button class="btn btn-outline" onclick="dashboardPage.editTrip(${trip.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="dashboardPage.deleteTrip(${trip.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            
            ${trip.days && trip.days.length > 0 ? `
                <div class="trip-itinerary">
                    <h3>Itinerary</h3>
                    ${trip.days.map(day => `
                        <div class="itinerary-day">
                            <h4 class="itinerary-day-title">
                                <span class="day-number">${day.dayNumber}</span>
                                Day ${day.dayNumber}
                            </h4>
                            <div class="itinerary-activities">
                                ${day.activities && day.activities.length > 0 ? 
                                    day.activities.map(activity => `
                                        <div class="activity-item">
                                            <div class="activity-time">${activity.time || 'All day'}</div>
                                            <div class="activity-name">${activity.name}</div>
                                            ${activity.description ? `<div class="activity-description">${activity.description}</div>` : ''}
                                        </div>
                                    `).join('') :
                                    '<p class="no-activities">No activities planned</p>'
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : '<p>No itinerary planned yet.</p>'}
            
            ${trip.types && trip.types.length > 0 ? `
                <div class="trip-types">
                    <h4>Trip Types</h4>
                    <div class="trip-tags">
                        ${trip.types.map(type => `<span class="trip-tag">${type}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        modalBody.innerHTML = modalHTML;
        Utils.openModal('#trip-modal');
    }

    editTrip(tripId) {
        window.location.href = `planning.html?edit=${tripId}`;
    }

    deleteTrip(tripId) {
        const trip = this.api.getTrip(parseInt(tripId));
        if (!trip) return;

        const confirmMessage = `Are you sure you want to delete "${trip.name || 'this trip'}"? This action cannot be undone.`;
        
        if (confirm(confirmMessage)) {
            try {
                this.api.deleteTrip(tripId);
                Utils.showToast('Trip deleted successfully', 'success');
                
                // Refresh the trips list
                this.loadTrips();
                this.loadStatistics();
                
                // Close modal if open
                Utils.closeModal('#trip-modal');
                
            } catch (error) {
                console.error('Error deleting trip:', error);
                Utils.showToast('Failed to delete trip', 'error');
            }
        }
    }

    updateFilterCounts() {
        const statusCounts = {
            all: this.allTrips.length,
            upcoming: 0,
            ongoing: 0,
            completed: 0,
            draft: 0
        };

        this.allTrips.forEach(trip => {
            const status = this.getTripStatus(trip);
            statusCounts[status]++;
        });

        // Update filter tab text with counts
        Utils.$$('.filter-tab').forEach(tab => {
            const filter = tab.dataset.filter;
            const count = statusCounts[filter] || 0;
            const baseText = tab.textContent.replace(/\s*\(\d+\)$/, '');
            tab.textContent = `${baseText} (${count})`;
        });
    }

    renderError(message) {
        const container = Utils.$('#trips-grid');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                </div>
            `;
        }
    }

    // Method to export all trips
    exportTrips() {
        const dataStr = JSON.stringify(this.allTrips, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'my-trips.json';
        link.click();
    }

    // Method to refresh trips
    async refreshTrips() {
        await this.loadTrips();
        this.loadStatistics();
        Utils.showToast('Trips refreshed', 'success');
    }

    // Method to duplicate a trip
    duplicateTrip(tripId) {
        const trip = this.api.getTrip(parseInt(tripId));
        if (!trip) return;

        const duplicatedTrip = {
            ...trip,
            id: undefined, // Remove ID so it gets a new one
            name: `${trip.name} (Copy)`,
            status: 'draft',
            createdAt: undefined,
            updatedAt: undefined
        };

        try {
            this.api.saveTrip(duplicatedTrip);
            Utils.showToast('Trip duplicated successfully', 'success');
            this.loadTrips();
            this.loadStatistics();
        } catch (error) {
            console.error('Error duplicating trip:', error);
            Utils.showToast('Failed to duplicate trip', 'error');
        }
    }
}

// Initialize dashboard page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardPage = new DashboardPage();
});

// Add dashboard-specific styles
const dashboardStyles = `
    .trip-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
    }
    
    .trip-tag {
        background: var(--primary-color);
        color: var(--text-inverse);
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: var(--font-size-xs);
        font-weight: 500;
    }
    
    .trip-types {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
    }
    
    .trip-types h4 {
        margin-bottom: 0.75rem;
        color: var(--text-primary);
    }
    
    .no-activities {
        color: var(--text-muted);
        font-style: italic;
        padding: 1rem;
        text-align: center;
    }
    
    .error-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
    }
    
    .error-state i {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }
    
    .error-state h3 {
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = dashboardStyles;
document.head.appendChild(styleSheet);