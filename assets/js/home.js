// Configuration for API keys - works in browser environment
const CONFIG = {
    // Get API key from multiple sources, safely handling browser environment
    UNSPLASH_ACCESS_KEY: (
        // From window.ENV (set by config.js)
        window.ENV?.UNSPLASH_ACCESS_KEY ||
        // From global window object
        window.UNSPLASH_API_KEY ||
        // From environment variables (only if process exists - for build tools)
        (typeof process !== 'undefined' && process.env?.UNSPLASH_ACCESS_KEY) ||
        // Default empty string
        ''
    ),
    
    // Alternative: You can also set it directly here if not using environment variables
    // UNSPLASH_ACCESS_KEY: 'your-actual-unsplash-key-here'
};

// Home page functionality
class HomePage {
    constructor() {
        this.api = window.TravelBuddyAPI;
        // Try to get API key from multiple sources
        this.unsplashAccessKey = this.getUnsplashKey();
        this.init();
    }

    getUnsplashKey() {
        // Try multiple sources for the API key - browser-safe version
        const sources = [
            // From CONFIG object (safest)
            CONFIG.UNSPLASH_ACCESS_KEY,
            // From window.ENV (set by config.js)
            window.ENV?.UNSPLASH_ACCESS_KEY,
            // From global window object
            window.UNSPLASH_API_KEY,
            // From environment variables (only if process exists and is defined)
            (typeof process !== 'undefined' && process?.env?.UNSPLASH_ACCESS_KEY),
            // From localStorage (for testing purposes)
            localStorage.getItem('unsplash_api_key')
        ];

        for (const source of sources) {
            if (source && source !== 'YOUR_UNSPLASH_ACCESS_KEY' && source.length > 10) {
                console.log('🔑 Found Unsplash API key from configuration');
                return source;
            }
        }

        console.log('📸 No valid Unsplash API key found, using fallback images');
        return null;
    }

    async init() {
        await this.loadUnsplashGallery();
        this.bindEvents();
        this.initAnimations();
    }

    async loadUnsplashGallery() {
        const container = document.getElementById('popular-destinations');
        if (!container) return;

        // Show loading state with a beautiful skeleton
        this.showGalleryLoading(container);

        try {
            // Try to load from Unsplash API first
            let photos = await this.fetchUnsplashPhotos();
            
            // If Unsplash fails, use fallback images
            if (!photos || photos.length === 0) {
                photos = this.getFallbackImages();
            }

            setTimeout(() => {
                this.renderPhotoGallery(container, photos);
            }, 800); // Give time for loading animation
        } catch (error) {
            console.error('Error loading gallery:', error);
            // Use fallback images on error
            const fallbackPhotos = this.getFallbackImages();
            this.renderPhotoGallery(container, fallbackPhotos);
        }
    }

    async fetchUnsplashPhotos() {
        // Popular travel destinations to search for
        const destinations = [
            'paris eiffel tower',
            'santorini greece',
            'tokyo japan',
            'bali indonesia',
            'new york city',
            'iceland northern lights',
            'maldives beach',
            'norway fjords',
            'thailand temple',
            'australia sydney',
            'dubai skyline',
            'peru machu picchu'
        ];

        try {
            console.log('🖼️ Attempting to fetch photos from Unsplash...');
            
            // Check if we have a valid API key
            if (!this.unsplashAccessKey) {
                console.log('📸 No Unsplash API key available, using curated fallback images');
                return this.getFallbackImages();
            }

            const photos = [];
            
            // Show API key status (masked for security)
            const maskedKey = this.unsplashAccessKey.substring(0, 8) + '...' + this.unsplashAccessKey.substring(this.unsplashAccessKey.length - 4);
            console.log(`🔑 Using Unsplash API key: ${maskedKey}`);
            
            // Fetch photos for each destination (limit to 6 for performance)
            for (let i = 0; i < Math.min(destinations.length, 6); i++) {
                try {
                    const response = await fetch(
                        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(destinations[i])}&per_page=1&orientation=landscape&order_by=popular`,
                        {
                            headers: {
                                'Authorization': `Client-ID ${this.unsplashAccessKey}`,
                                'Accept-Version': 'v1'
                            }
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data.results && data.results.length > 0) {
                            const photo = data.results[0];
                            photos.push({
                                id: photo.id,
                                title: this.extractLocationName(destinations[i]),
                                description: photo.description || photo.alt_description || destinations[i],
                                imageUrl: photo.urls.regular,
                                thumbnailUrl: photo.urls.small,
                                photographer: photo.user.name,
                                photographerUrl: photo.user.links.html,
                                unsplashUrl: photo.links.html,
                                location: this.extractLocationName(destinations[i]),
                                isUnsplash: true
                            });
                            console.log(`✅ Loaded photo for ${destinations[i]}`);
                        }
                    } else {
                        console.warn(`❌ Unsplash API error for ${destinations[i]}: ${response.status} ${response.statusText}`);
                        
                        // If we get a 401, the API key is likely invalid
                        if (response.status === 401) {
                            console.error('🚫 Invalid Unsplash API key. Please check your configuration.');
                            break; // Stop trying if API key is invalid
                        }
                    }
                } catch (photoError) {
                    console.warn(`Failed to fetch photo for ${destinations[i]}:`, photoError);
                }
            }

            if (photos.length > 0) {
                console.log(`✅ Successfully loaded ${photos.length} photos from Unsplash`);
                return photos;
            } else {
                console.log('📸 No photos loaded from Unsplash, using fallback images');
                return this.getFallbackImages();
            }

        } catch (error) {
            console.error('❌ Unsplash API failed:', error);
            return this.getFallbackImages();
        }
    }

    extractLocationName(searchTerm) {
        // Extract clean location names from search terms
        const locationMap = {
            'paris eiffel tower': 'Paris',
            'santorini greece': 'Santorini',
            'tokyo japan': 'Tokyo',
            'bali indonesia': 'Bali',
            'new york city': 'New York',
            'iceland northern lights': 'Iceland',
            'maldives beach': 'Maldives',
            'norway fjords': 'Norway',
            'thailand temple': 'Thailand',
            'australia sydney': 'Sydney',
            'dubai skyline': 'Dubai',
            'peru machu picchu': 'Machu Picchu'
        };
        return locationMap[searchTerm] || searchTerm.split(' ')[0];
    }

    getFallbackImages() {
        // Completely different high-quality images for the gallery (not from destinations.json)
        return [
            {
                id: 'gallery-1',
                title: 'Swiss Alps',
                description: 'Majestic mountain peaks and pristine alpine lakes',
                imageUrl: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Swiss Alps, Switzerland',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-2',
                title: 'Aurora Borealis',
                description: 'Dancing northern lights over snowy landscapes',
                imageUrl: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/1933239/pexels-photo-1933239.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Finnish Lapland',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-3',
                title: 'Tropical Paradise',
                description: 'Crystal clear waters and overwater bungalows',
                imageUrl: 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Tropical Island',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-4',
                title: 'Ancient Wonders',
                description: 'Historic temples and ancient architecture',
                imageUrl: 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Ancient Temple',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-5',
                title: 'Desert Dunes',
                description: 'Golden sand dunes under starry skies',
                imageUrl: 'https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Sahara Desert',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-6',
                title: 'Coastal Cliffs',
                description: 'Dramatic coastal cliffs and crashing waves',
                imageUrl: 'https://images.pexels.com/photos/1659437/pexels-photo-1659437.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/1659437/pexels-photo-1659437.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Coastal Cliffs',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-7',
                title: 'Cherry Blossoms',
                description: 'Beautiful spring cherry blossoms in full bloom',
                imageUrl: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/2070033/pexels-photo-2070033.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Cherry Blossom Park',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-8',
                title: 'Mountain Lake',
                description: 'Serene mountain lake reflecting snow-capped peaks',
                imageUrl: 'https://images.pexels.com/photos/1840295/pexels-photo-1840295.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/1840295/pexels-photo-1840295.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Mountain Lake',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-9',
                title: 'Rainforest Canopy',
                description: 'Lush green rainforest canopy from above',
                imageUrl: 'https://images.pexels.com/photos/1427107/pexels-photo-1427107.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/1427107/pexels-photo-1427107.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Amazon Rainforest',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-10',
                title: 'City Skyline',
                description: 'Modern city skyline illuminated at night',
                imageUrl: 'https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/1519088/pexels-photo-1519088.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Modern City',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-11',
                title: 'Volcanic Landscape',
                description: 'Dramatic volcanic landscape with flowing lava',
                imageUrl: 'https://images.pexels.com/photos/2422917/pexels-photo-2422917.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/2422917/pexels-photo-2422917.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Volcanic Island',
                photographer: 'Pexels',
                isUnsplash: false
            },
            {
                id: 'gallery-12',
                title: 'Frozen Wilderness',
                description: 'Pristine frozen wilderness with ice formations',
                imageUrl: 'https://images.pexels.com/photos/1571442/pexels-photo-1571442.jpeg?auto=compress&cs=tinysrgb&w=800',
                thumbnailUrl: 'https://images.pexels.com/photos/1571442/pexels-photo-1571442.jpeg?auto=compress&cs=tinysrgb&w=400',
                location: 'Arctic Wilderness',
                photographer: 'Pexels',
                isUnsplash: false
            }
        ];
    }

    // Method to set API key dynamically (for testing)
    setUnsplashKey(apiKey) {
        this.unsplashAccessKey = apiKey;
        localStorage.setItem('unsplash_api_key', apiKey);
        console.log('🔑 Unsplash API key updated');
    }

    // Method to test API key
    async testUnsplashKey() {
        if (!this.unsplashAccessKey) {
            console.log('❌ No API key to test');
            return false;
        }

        try {
            const response = await fetch(
                'https://api.unsplash.com/photos/random?count=1',
                {
                    headers: {
                        'Authorization': `Client-ID ${this.unsplashAccessKey}`,
                        'Accept-Version': 'v1'
                    }
                }
            );

            if (response.ok) {
                console.log('✅ Unsplash API key is valid!');
                return true;
            } else {
                console.log('❌ Unsplash API key is invalid:', response.status);
                return false;
            }
        } catch (error) {
            console.log('❌ Error testing Unsplash API key:', error);
            return false;
        }
    }

    // ... rest of the methods remain the same from the previous version
    showGalleryLoading(container) {
        container.innerHTML = `
            <div class="gallery-loading">
                ${Array.from({length: 6}, (_, i) => `
                    <div class="photo-skeleton" style="animation-delay: ${i * 0.1}s">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-overlay">
                            <div class="skeleton-line title"></div>
                            <div class="skeleton-line subtitle"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPhotoGallery(container, photos) {
        if (!photos || photos.length === 0) {
            container.innerHTML = `
                <div class="gallery-error">
                    <i class="fas fa-camera"></i>
                    <h3>Gallery Unavailable</h3>
                    <p>Unable to load photo gallery at the moment.</p>
                    <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                </div>
            `;
            return;
        }

        // Randomly select 6 photos from the available collection
        const selectedPhotos = this.shuffleArray([...photos]).slice(0, 6);

        const galleryHTML = `
            <div class="photo-gallery">
                ${selectedPhotos.map((photo, index) => `
                    <div class="photo-card" data-photo-id="${photo.id}" style="animation-delay: ${index * 0.1}s">
                        <div class="photo-container">
                            <img src="${photo.thumbnailUrl}" 
                                 alt="${photo.description}" 
                                 data-full-src="${photo.imageUrl}"
                                 loading="lazy"
                                 class="photo-image">
                            <div class="photo-overlay">
                                <div class="photo-info">
                                    <h3 class="photo-title">${photo.title}</h3>
                                    <p class="photo-location">
                                        <i class="fas fa-map-marker-alt"></i>
                                        ${photo.location}
                                    </p>
                                </div>
                                <div class="photo-actions">
                                    <button class="photo-action-btn view-btn" title="View Full Size">
                                        <i class="fas fa-search-plus"></i>
                                    </button>
                                    ${photo.isUnsplash ? `
                                        <a href="${photo.unsplashUrl}" target="_blank" class="photo-action-btn" title="View on Unsplash">
                                            <i class="fas fa-external-link-alt"></i>
                                        </a>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="photo-credit">
                            ${photo.isUnsplash ? `
                                Photo by <a href="${photo.photographerUrl}" target="_blank">${photo.photographer}</a> on Unsplash
                            ` : `
                                Photo by ${photo.photographer}
                            `}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = galleryHTML;
        this.bindGalleryEvents(container);
        this.showGalleryStats(selectedPhotos);
    }

    shuffleArray(array) {
        // Fisher-Yates shuffle algorithm to randomize photo selection
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    showGalleryStats(photos) {
        const unsplashCount = photos.filter(p => p.isUnsplash).length;
        const fallbackCount = photos.filter(p => !p.isUnsplash).length;
        
        // Add a subtle stats indicator
        const statsDiv = document.createElement('div');
        statsDiv.className = 'gallery-stats';
        statsDiv.innerHTML = `
            <div class="stats-content">
                <i class="fas fa-camera"></i>
                <span>${photos.length} stunning destinations</span>
                ${unsplashCount > 0 ? `<span class="unsplash-credit">• ${unsplashCount} via Unsplash</span>` : ''}
            </div>
        `;
        
        const container = document.querySelector('.popular-destinations .container');
        const existing = container.querySelector('.gallery-stats');
        if (existing) existing.remove();
        
        container.appendChild(statsDiv);
    }

    bindGalleryEvents(container) {
        // Full-size image viewing
        const viewButtons = container.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const photoCard = btn.closest('.photo-card');
                const img = photoCard.querySelector('.photo-image');
                const fullSrc = img.dataset.fullSrc;
                const title = photoCard.querySelector('.photo-title').textContent;
                
                this.openLightbox(fullSrc, title);
            });
        });

        // Card click to view destination
        const photoCards = container.querySelectorAll('.photo-card');
        photoCards.forEach(card => {
            card.addEventListener('click', () => {
                const title = card.querySelector('.photo-title').textContent;
                this.handlePhotoClick(title);
            });

            // Hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    openLightbox(imageSrc, title) {
        // Create lightbox overlay
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox-overlay';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img src="${imageSrc}" alt="${title}" class="lightbox-image">
                <div class="lightbox-info">
                    <h3>${title}</h3>
                </div>
                <button class="lightbox-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';

        // Close lightbox events
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const closeEvents = [closeBtn, lightbox];
        
        closeEvents.forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target === element) {
                    document.body.removeChild(lightbox);
                    document.body.style.overflow = 'auto';
                }
            });
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(lightbox);
                document.body.style.overflow = 'auto';
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Animate lightbox in
        setTimeout(() => lightbox.classList.add('active'), 10);
    }

    handlePhotoClick(title) {
        // Navigate to destinations page and search for the location
        const searchQuery = encodeURIComponent(title);
        window.location.href = `destinations.html?search=${searchQuery}`;
        
        // Track the click
        this.trackEvent('gallery_photo_click', { destination: title });
    }

    bindEvents() {
        // Hero CTA buttons
        const planTripBtn = document.querySelector('a[href="planning.html"]');
        const exploreBtn = document.querySelector('a[href="destinations.html"]');

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
        const actionCards = document.querySelectorAll('.action-card');
        
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
        const featureCards = document.querySelectorAll('.feature-card');
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
        const animateElements = document.querySelectorAll('.feature-card, .action-card, .photo-card');
        animateElements.forEach(el => observer.observe(el));
    }

    animateStats() {
        const stats = [
            { element: document.getElementById('users-count'), target: 10000, suffix: '+' },
            { element: document.getElementById('trips-count'), target: 50000, suffix: '+' },
            { element: document.getElementById('countries-count'), target: 150, suffix: '+' }
        ];

        stats.forEach(stat => {
            if (stat.element) {
                this.animateValue(stat.element, 0, stat.target, 2000);
                setTimeout(() => {
                    stat.element.textContent += stat.suffix;
                }, 2000);
            }
        });
    }

    animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                element.textContent = end;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }

    trackEvent(eventName, data = {}) {
        // Analytics tracking
        console.log('Track event:', eventName, data);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                page_title: document.title,
                page_location: window.location.href,
                ...data
            });
        }
    }

    async refreshGallery() {
        const container = document.getElementById('popular-destinations');
        if (container) {
            await this.loadUnsplashGallery();
        }
    }

    showWelcomeMessage() {
        const isFirstVisit = !localStorage.getItem('hasVisited');
        
        if (isFirstVisit) {
            localStorage.setItem('hasVisited', 'true');
            
            setTimeout(() => {
                this.showToast(
                    'Welcome to TravelBuddy! Discover amazing destinations in our photo gallery.',
                    'success',
                    5000
                );
            }, 1000);
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.style.opacity = '1', 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
}

// Initialize home page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const homePage = new HomePage();
    
    // Show welcome message for new users
    homePage.showWelcomeMessage();
    
    // Make available globally for debugging and testing
    window.HomePage = homePage;
    
    // For testing purposes - you can call these in the console:
    // HomePage.setUnsplashKey('your-api-key-here')
    // HomePage.testUnsplashKey()
    // HomePage.refreshGallery()
});

// Add CSS styles for the photo gallery (same as previous version)