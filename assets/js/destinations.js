// Destinations page functionality
class DestinationsPage {
    constructor() {
        this.api = window.TravelBuddyAPI;
        this.currentFilters = {};
        this.currentSearchQuery = '';
        this.allDestinations = [];
        this.init();
    }

    async init() {
        await this.loadDestinations();
        this.bindEvents();
        this.checkForSelectedDestination();
    }

    async loadDestinations() {
        const container = Utils.$('#destinations-grid');
        if (!container) return;

        // Show loading state
        this.showLoadingState(container);

        try {
            this.allDestinations = await this.api.getDestinations();
            this.renderDestinations(this.allDestinations);
        } catch (error) {
            console.error('Error loading destinations:', error);
            this.renderError(container, 'Failed to load destinations');
        }
    }

    showLoadingState(container) {
        const skeletonHTML = Array.from({ length: 6 }, () => `
            <div class="destination-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                </div>
            </div>
        `).join('');

        container.innerHTML = skeletonHTML;
    }

    renderDestinations(destinations) {
        const container = Utils.$('#destinations-grid');
        if (!container) return;

        if (!destinations || destinations.length === 0) {
            this.renderNoResults(container);
            return;
        }

        const destinationsHTML = destinations.map(destination => `
            <div class="destination-card" data-destination-id="${destination.id}">
                <div class="destination-image">
                    <img src="${destination.image}" alt="${destination.name}" loading="lazy">
                    <div class="destination-badge">${destination.budget}</div>
                </div>
                <div class="destination-content">
                    <div class="destination-header">
                        <div>
                            <h3 class="destination-title">${destination.name}</h3>
                            <p class="destination-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${destination.country}
                            </p>
                        </div>
                        <div class="destination-rating">
                            <i class="fas fa-star"></i>
                            ${destination.rating}
                        </div>
                    </div>
                    <p class="destination-description">
                        ${Utils.truncateText(destination.description, 120)}
                    </p>
                    <div class="destination-tags">
                        ${destination.types.map(type => 
                            `<span class="destination-tag">${type}</span>`
                        ).join('')}
                    </div>
                    <div class="destination-footer">
                        <div class="destination-price">
                            ${this.api.formatCurrency(destination.averageCost)}
                            <span class="currency">/day</span>
                        </div>
                        <div class="destination-actions">
                            <button class="btn-icon favorite" data-destination-id="${destination.id}" title="Add to favorites">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button class="btn-icon share" data-destination-id="${destination.id}" title="Share">
                                <i class="fas fa-share"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = destinationsHTML;
        this.bindDestinationEvents();
        this.updateFavoriteStates();
    }

    renderNoResults(container) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No destinations found</h3>
                <p>Try adjusting your search criteria or browse all destinations</p>
                <button class="btn btn-outline" onclick="destinationsPage.clearFilters()">
                    Clear Filters
                </button>
            </div>
        `;
    }

    renderError(container, message) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Oops!</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }

    bindEvents() {
        // Search functionality
        const searchInput = Utils.$('#destination-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.currentSearchQuery = e.target.value;
                this.performSearch();
            }, 300));
        }

        // Filter functionality
        this.bindFilterEvents();

        // Modal events
        this.bindModalEvents();
    }

    bindFilterEvents() {
        const filters = ['continent-filter', 'budget-filter', 'type-filter'];
        
        filters.forEach(filterId => {
            const filterElement = Utils.$(`#${filterId}`);
            if (filterElement) {
                filterElement.addEventListener('change', (e) => {
                    const filterType = filterId.replace('-filter', '');
                    this.currentFilters[filterType] = e.target.value;
                    this.performSearch();
                });
            }
        });
    }

    bindDestinationEvents() {
        // Destination card clicks
        const destinationCards = Utils.$$('.destination-card');
        destinationCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.btn-icon')) return;
                
                const destinationId = card.dataset.destinationId;
                this.showDestinationModal(destinationId);
            });
        });

        // Favorite buttons
        const favoriteButtons = Utils.$$('.btn-icon.favorite');
        favoriteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const destinationId = btn.dataset.destinationId;
                this.toggleFavorite(destinationId);
            });
        });

        // Share buttons
        const shareButtons = Utils.$$('.btn-icon.share');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const destinationId = btn.dataset.destinationId;
                this.shareDestination(destinationId);
            });
        });
    }

    bindModalEvents() {
        const modal = Utils.$('#destination-modal');
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Utils.closeModal('#destination-modal');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Utils.closeModal('#destination-modal');
                }
            });
        }
    }

    async performSearch() {
        const filteredDestinations = await this.api.searchDestinations(
            this.currentSearchQuery,
            this.currentFilters
        );
        this.renderDestinations(filteredDestinations);
    }

    async showDestinationModal(destinationId) {
        const destination = await this.api.getDestination(destinationId);
        if (!destination) return;

        const modalBody = Utils.$('#modal-body');
        if (!modalBody) return;

        const modalHTML = `
            <div class="destination-modal-header">
                <img src="${destination.image}" alt="${destination.name}" class="destination-modal-image">
            </div>
            <div class="modal-content-body">
                <h2 class="destination-modal-title">${destination.name}</h2>
                <p class="destination-modal-location">
                    <i class="fas fa-map-marker-alt"></i>
                    ${destination.country}, ${destination.continent}
                </p>
                <div class="destination-modal-rating">
                    <div class="rating-stars">
                        ${this.renderStars(destination.rating)}
                    </div>
                    <span class="rating-text">${destination.rating} out of 5</span>
                </div>
                <p class="destination-modal-description">${destination.description}</p>
                
                <div class="destination-highlights">
                    <h4>Top Attractions</h4>
                    <div class="highlights-grid">
                        ${destination.attractions?.map(attraction => `
                            <div class="highlight-item">
                                <div class="highlight-icon">
                                    <i class="fas fa-map-pin"></i>
                                </div>
                                <span>${attraction}</span>
                            </div>
                        `).join('') || '<p>No attractions listed</p>'}
                    </div>
                </div>

                <div class="destination-info-grid">
                    <div class="info-item">
                        <h5>Best Time to Visit</h5>
                        <p>${destination.bestTime || 'Year-round'}</p>
                    </div>
                    <div class="info-item">
                        <h5>Average Daily Cost</h5>
                        <p>${this.api.formatCurrency(destination.averageCost)}</p>
                    </div>
                    <div class="info-item">
                        <h5>Travel Style</h5>
                        <p>${destination.budget}</p>
                    </div>
                    <div class="info-item">
                        <h5>Activities</h5>
                        <p>${destination.types.join(', ')}</p>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" onclick="destinationsPage.addToWishlist(${destination.id})">
                    <i class="fas fa-heart"></i> Add to Wishlist
                </button>
                <button class="btn btn-primary" onclick="destinationsPage.planTripToDestination(${destination.id})">
                    <i class="fas fa-route"></i> Plan Trip Here
                </button>
            </div>
        `;

        modalBody.innerHTML = modalHTML;
        Utils.openModal('#destination-modal');
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let starsHTML = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }

        return starsHTML;
    }

    toggleFavorite(destinationId) {
        const favorites = Utils.storage.get('favorites', []);
        const isFavorited = favorites.includes(parseInt(destinationId));
        
        if (isFavorited) {
            const index = favorites.indexOf(parseInt(destinationId));
            favorites.splice(index, 1);
            Utils.showToast('Removed from favorites', 'info');
        } else {
            favorites.push(parseInt(destinationId));
            Utils.showToast('Added to favorites', 'success');
        }
        
        Utils.storage.set('favorites', favorites);
        this.updateFavoriteStates();
    }

    updateFavoriteStates() {
        const favorites = Utils.storage.get('favorites', []);
        const favoriteButtons = Utils.$$('.btn-icon.favorite');
        
        favoriteButtons.forEach(btn => {
            const destinationId = parseInt(btn.dataset.destinationId);
            const isFavorited = favorites.includes(destinationId);
            
            btn.classList.toggle('favorited', isFavorited);
            btn.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
        });
    }

    shareDestination(destinationId) {
        const destination = this.allDestinations.find(d => d.id === parseInt(destinationId));
        if (!destination) return;

        const shareData = {
            title: `Check out ${destination.name}!`,
            text: `I found this amazing destination: ${destination.name}, ${destination.country}`,
            url: `${window.location.origin}/destinations.html#destination-${destinationId}`
        };

        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareData.url).then(() => {
                Utils.showToast('Link copied to clipboard!', 'success');
            }).catch(() => {
                Utils.showToast('Unable to share', 'error');
            });
        }
    }

    addToWishlist(destinationId) {
        this.toggleFavorite(destinationId);
        Utils.closeModal('#destination-modal');
    }

    planTripToDestination(destinationId) {
        const destination = this.allDestinations.find(d => d.id === parseInt(destinationId));
        if (!destination) return;

        // Store destination data for trip planning
        Utils.storage.set('planningDestination', {
            id: destination.id,
            name: destination.name,
            country: destination.country,
            averageCost: destination.averageCost
        });

        // Navigate to planning page
        window.location.href = 'planning.html';
    }

    clearFilters() {
        this.currentFilters = {};
        this.currentSearchQuery = '';
        
        // Reset form elements
        const searchInput = Utils.$('#destination-search');
        if (searchInput) searchInput.value = '';
        
        const filterSelects = Utils.$$('select[id$="-filter"]');
        filterSelects.forEach(select => select.value = '');
        
        // Show all destinations
        this.renderDestinations(this.allDestinations);
    }

    checkForSelectedDestination() {
        // Check if there's a selected destination from home page
        const selectedDestinationId = Utils.storage.get('selectedDestination');
        if (selectedDestinationId) {
            Utils.storage.remove('selectedDestination');
            setTimeout(() => {
                this.showDestinationModal(selectedDestinationId);
            }, 500);
        }

        // Check URL hash for direct destination links
        const hash = window.location.hash;
        if (hash.startsWith('#destination-')) {
            const destinationId = hash.replace('#destination-', '');
            setTimeout(() => {
                this.showDestinationModal(destinationId);
            }, 500);
        }
    }

    // Method to refresh destinations
    async refreshDestinations() {
        this.api.cache.delete('destinations');
        await this.loadDestinations();
    }
}

// Initialize destinations page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.destinationsPage = new DestinationsPage();
});

// Add additional CSS for modal and animations
const destinationStyles = `
    .destination-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
        padding: 1.5rem;
        background: var(--bg-secondary);
        border-radius: 8px;
    }
    
    .info-item h5 {
        color: var(--primary-color);
        margin-bottom: 0.5rem;
        font-size: var(--font-size-sm);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .info-item p {
        color: var(--text-primary);
        font-weight: 600;
        margin: 0;
    }
    
    .rating-stars {
        color: var(--accent-color);
        margin-right: 0.5rem;
    }
    
    .destination-modal-rating {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
    }
    
    .no-results,
    .error-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
    }
    
    .no-results i,
    .error-state i {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }
    
    .no-results h3,
    .error-state h3 {
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = destinationStyles;
document.head.appendChild(styleSheet);