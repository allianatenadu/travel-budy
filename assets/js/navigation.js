// Navigation functionality
class Navigation {
    constructor() {
        this.init();
        this.bindEvents();
    }

    init() {
        this.navbar = Utils.$('.navbar');
        this.navMenu = Utils.$('#nav-menu');
        this.navToggle = Utils.$('#nav-toggle');
        this.navLinks = Utils.$$('.nav-link');
        
        this.setActiveNavLink();
        this.setupMobileMenu();
    }

    bindEvents() {
        // Mobile menu toggle
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }

        // Close mobile menu when clicking on links
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.navbar.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle window resize
        window.addEventListener('resize', Utils.debounce(() => {
            if (window.innerWidth > 767) {
                this.closeMobileMenu();
            }
        }, 250));

        // Navbar scroll effect
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleNavbarScroll();
        }, 100));
    }

    setActiveNavLink() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';

        this.navLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            
            if (linkHref === currentPage || 
                (currentPage === '' && linkHref === 'index.html') ||
                (currentPage === '/' && linkHref === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    setupMobileMenu() {
        // Ensure proper initial state
        if (this.navMenu) {
            this.navMenu.classList.remove('active');
        }
    }

    toggleMobileMenu() {
        if (this.navMenu && this.navToggle) {
            const isActive = this.navMenu.classList.contains('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }

    openMobileMenu() {
        if (this.navMenu && this.navToggle) {
            this.navMenu.classList.add('active');
            this.navToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Animate hamburger bars
            this.animateHamburger(true);
        }
    }

    closeMobileMenu() {
        if (this.navMenu && this.navToggle) {
            this.navMenu.classList.remove('active');
            this.navToggle.classList.remove('active');
            document.body.style.overflow = '';
            
            // Animate hamburger bars
            this.animateHamburger(false);
        }
    }

    animateHamburger(isOpen) {
        const bars = this.navToggle.querySelectorAll('.bar');
        
        if (isOpen) {
            bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    }

    handleNavbarScroll() {
        const scrolled = window.scrollY > 50;
        
        if (scrolled) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
    }

    // Public method to navigate to a page
    navigateTo(page) {
        window.location.href = page;
    }

    // Public method to highlight active nav item
    setActive(page) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === page) {
                link.classList.add('active');
            }
        });
    }
}

// Breadcrumb functionality
class Breadcrumb {
    constructor() {
        this.init();
    }

    init() {
        this.container = Utils.$('.breadcrumb');
        if (this.container) {
            this.render();
        }
    }

    render() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(segment => segment);
        const breadcrumbs = this.generateBreadcrumbs(segments);
        
        this.container.innerHTML = breadcrumbs.map(crumb => 
            crumb.url ? 
            `<a href="${crumb.url}" class="breadcrumb-link">${crumb.text}</a>` :
            `<span class="breadcrumb-current">${crumb.text}</span>`
        ).join('<span class="breadcrumb-separator">/</span>');
    }

    generateBreadcrumbs(segments) {
        const breadcrumbs = [{ text: 'Home', url: 'index.html' }];
        
        const pageNames = {
            'destinations': 'Destinations',
            'planning': 'Plan Trip',
            'dashboard': 'My Trips',
            'budget': 'Budget',
            'profile': 'Profile',
            'about': 'About'
        };

        segments.forEach((segment, index) => {
            const isLast = index === segments.length - 1;
            const text = pageNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
            
            breadcrumbs.push({
                text: text,
                url: isLast ? null : segments.slice(0, index + 1).join('/') + '.html'
            });
        });

        return breadcrumbs;
    }
}

// Search functionality for navigation
class NavigationSearch {
    constructor() {
        this.init();
    }

    init() {
        this.searchInput = Utils.$('#nav-search');
        this.searchResults = Utils.$('#nav-search-results');
        
        if (this.searchInput) {
            this.bindEvents();
            this.setupPages();
        }
    }

    setupPages() {
        this.pages = [
            { title: 'Home', url: 'index.html', description: 'Welcome to TravelBuddy' },
            { title: 'Destinations', url: 'destinations.html', description: 'Explore amazing destinations' },
            { title: 'Plan Trip', url: 'planning.html', description: 'Create your perfect itinerary' },
            { title: 'My Trips', url: 'dashboard.html', description: 'Manage your travel plans' },
            { title: 'Budget', url: 'budget.html', description: 'Track your travel expenses' },
            { title: 'Profile', url: 'profile.html', description: 'Manage your account settings' },
            { title: 'About', url: 'about.html', description: 'Learn more about TravelBuddy' }
        ];
    }

    bindEvents() {
        this.searchInput.addEventListener('input', Utils.debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300));

        this.searchInput.addEventListener('focus', () => {
            this.showSearchResults();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-search-container')) {
                this.hideSearchResults();
            }
        });
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.hideSearchResults();
            return;
        }

        const results = this.searchPages(query);
        this.renderSearchResults(results);
        this.showSearchResults();
    }

    searchPages(query) {
        const searchTerm = query.toLowerCase();
        return this.pages.filter(page => 
            page.title.toLowerCase().includes(searchTerm) ||
            page.description.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
    }

    renderSearchResults(results) {
        if (!this.searchResults) return;

        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-no-results">
                    <p>No pages found</p>
                </div>
            `;
            return;
        }

        this.searchResults.innerHTML = results.map(result => `
            <a href="${result.url}" class="search-result-item">
                <div class="search-result-title">${result.title}</div>
                <div class="search-result-description">${result.description}</div>
            </a>
        `).join('');
    }

    showSearchResults() {
        if (this.searchResults) {
            this.searchResults.style.display = 'block';
        }
    }

    hideSearchResults() {
        if (this.searchResults) {
            this.searchResults.style.display = 'none';
        }
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Navigation();
    new Breadcrumb();
    new NavigationSearch();
});

// Export for external use
window.Navigation = Navigation;
window.Breadcrumb = Breadcrumb;
window.NavigationSearch = NavigationSearch;