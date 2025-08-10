// Home page functionality
class HomePage {
    constructor() {
        this.api = window.TravelBuddyAPI;
        this.init();
    }

    async init() {
        await this.loadPopularDestinations();
        this.bindEvents();
        this.initAnimations();
    }

    async loadPopularDestinations() {
        const container = Utils.$('#popular-destinations');
        if (!container) return;

        // Show loading state
        Utils.showLoading(container, 'Loading destinations...');

        try {
            const destinations = await this.api.getDestinations();
            // Show only first 6 destinations as "popular"
            const popularDestinations = destinations.slice(0, 6);
            
            setTimeout(() => {
                this.renderDestinations(container, popularDestinations);
            }, 500); // Simulate loading delay
        } catch (error) {
            console.error('Error loading destinations:', error);
            this.renderError(container, 'Failed to load destinations');
        }
    }

    renderDestinations(container, destinations) {
        if (!destinations || destinations.length === 0) {
            container.innerHTML = `
                <div class="no-destinations">
                    <i class="fas fa-map-marked-alt"></i>
                    <h3>No destinations available</h3>
                    <p>Check back later for amazing travel destinations!</p>
                </div>
            `;
            return;
        }

        const destinationsHTML = destinations.map(destination => `
            <div class="destination-card" data-destination-id="${destination.id}">
                <img src="${destination.image}" alt="${destination.name}" loading="lazy">
                <div class="destination-overlay">
                    <h3>${destination.name}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${destination.country}</p>
                    <div class="destination-price">From ${this.api.formatCurrency(destination.averageCost)}/day</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = destinationsHTML;
        this.bindDestinationEvents(container);
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

    bindDestinationEvents(container) {
        const destinationCards = container.querySelectorAll('.destination-card');
        
        destinationCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const destinationId = card.dataset.destinationId;
                this.handleDestinationClick(destinationId);
            });

            // Add hover animations
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    handleDestinationClick(destinationId) {
        // Store selected destination and navigate to destinations page
        Utils.storage.set('selectedDestination', destinationId);
        window.location.href = 'destinations.html#destination-' + destinationId;
    }

    bindEvents() {
        // Hero CTA buttons
        const planTripBtn = Utils.$('a[href="planning.html"]');
        const exploreBtn = Utils.$('a[href="destinations.html"]');

        if (planTripBtn) {
            planTripBtn.addEventListener('click', (e) => {
                this.trackEvent('hero_plan_trip_click');
            });
        }

        if (exploreBtn) {
            exploreBtn.addEventListener('click', (e) => {
                this.trackEvent('hero_explore_destinations_click');
            });
        }

        // Feature cards animation on scroll
        this.setupScrollAnimations();

        // Quick actions
        this.bindQuickActions();
    }

    bindQuickActions() {
        const actionCards = Utils.$$('.action-card');
        
        actionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const href = card.getAttribute('href');
                if (href) {
                    this.trackEvent('quick_action_click', { action: href });
                }
            });
        });
    }

    initAnimations() {
        // Stagger animation for feature cards
        const featureCards = Utils.$$('.feature-card');
        featureCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });

        // Animate statistics if present
        this.animateStats();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe elements that should animate on scroll
        const animateElements = Utils.$$('.feature-card, .action-card, .destination-card');
        animateElements.forEach(el => observer.observe(el));
    }

    animateStats() {
        const stats = [
            { element: Utils.$('#users-count'), target: 10000, suffix: '+' },
            { element: Utils.$('#trips-count'), target: 50000, suffix: '+' },
            { element: Utils.$('#countries-count'), target: 150, suffix: '+' }
        ];

        stats.forEach(stat => {
            if (stat.element) {
                Utils.animateValue(stat.element, 0, stat.target, 2000);
                setTimeout(() => {
                    stat.element.textContent += stat.suffix;
                }, 2000);
            }
        });
    }

    trackEvent(eventName, data = {}) {
        // Analytics tracking - replace with your analytics service
        console.log('Track event:', eventName, data);
        
        // Example: Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                page_title: document.title,
                page_location: window.location.href,
                ...data
            });
        }
    }

    // Method to refresh popular destinations
    async refreshDestinations() {
        const container = Utils.$('#popular-destinations');
        if (container) {
            this.api.cache.delete('destinations'); // Clear cache
            await this.loadPopularDestinations();
        }
    }

    // Method to show welcome message for new users
    showWelcomeMessage() {
        const isFirstVisit = !Utils.storage.get('hasVisited');
        
        if (isFirstVisit) {
            Utils.storage.set('hasVisited', true);
            
            setTimeout(() => {
                Utils.showToast(
                    'Welcome to TravelBuddy! Start planning your next adventure.',
                    'success',
                    5000
                );
            }, 1000);
        }
    }

    // Method to handle newsletter signup (if present)
    handleNewsletterSignup(email) {
        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Utils.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Simulate newsletter signup
        Utils.showToast('Thank you for subscribing to our newsletter!', 'success');
        
        // Track signup
        this.trackEvent('newsletter_signup', { email: email });
    }
}

// Initialize home page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const homePage = new HomePage();
    
    // Show welcome message for new users
    homePage.showWelcomeMessage();
    
    // Make available globally for debugging
    window.HomePage = homePage;
});

// Add CSS animations for scroll effects
const scrollAnimationStyles = `
    .animate-in {
        animation: slideInUp 0.6s ease-out;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .error-state,
    .no-destinations {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
    }
    
    .error-state i,
    .no-destinations i {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }
    
    .error-state h3,
    .no-destinations h3 {
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = scrollAnimationStyles;
document.head.appendChild(styleSheet);