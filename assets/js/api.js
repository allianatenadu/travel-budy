// API Module - Handles all data operations with local JSON storage
class TravelBuddyAPI {
    constructor() {
        this.baseURL = '/assets/data';
        this.cache = new Map();
        this.initializeLocalStorage();
    }

    // Initialize localStorage with default data if empty
    initializeLocalStorage() {
        if (!localStorage.getItem('travelbuddy_trips')) {
            localStorage.setItem('travelbuddy_trips', JSON.stringify([]));
        }
        if (!localStorage.getItem('travelbuddy_user_profile')) {
            localStorage.setItem('travelbuddy_user_profile', JSON.stringify({
                name: 'John Doe',
                email: 'john.doe@example.com',
                bio: 'Passionate traveler exploring the world one city at a time',
                preferences: {
                    currency: 'USD',
                    language: 'en',
                    travelStyle: 'comfort',
                    activities: ['culture', 'adventure']
                }
            }));
        }
        if (!localStorage.getItem('travelbuddy_budgets')) {
            localStorage.setItem('travelbuddy_budgets', JSON.stringify([]));
        }
    }

    // Generic fetch method with caching
    async fetchJSON(endpoint) {
        if (this.cache.has(endpoint)) {
            return this.cache.get(endpoint);
        }

        try {
            const response = await fetch(`${this.baseURL}/${endpoint}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(endpoint, data);
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            // Return fallback data for better UX
            return this.getFallbackData(endpoint);
        }
    }

    // Fallback data for when JSON files are unavailable
    getFallbackData(endpoint) {
        const fallbacks = {
            destinations: [
                {
                    id: 1,
                    name: 'Paris',
                    country: 'France',
                    continent: 'Europe',
                    description: 'The City of Light, famous for its art, fashion, and cuisine.',
                    image: 'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=800',
                    rating: 4.8,
                    budget: 'Mid-range',
                    types: ['Culture', 'City'],
                    attractions: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame Cathedral'],
                    bestTime: 'April to October',
                    averageCost: 150
                },
                {
                    id: 2,
                    name: 'Tokyo',
                    country: 'Japan',
                    continent: 'Asia',
                    description: 'A bustling metropolis blending tradition and modernity.',
                    image: 'https://images.pexels.com/photos/248195/pexels-photo-248195.jpeg?auto=compress&cs=tinysrgb&w=800',
                    rating: 4.9,
                    budget: 'Mid-range',
                    types: ['Culture', 'City', 'Food'],
                    attractions: ['Tokyo Tower', 'Senso-ji Temple', 'Shibuya Crossing'],
                    bestTime: 'March to May, September to November',
                    averageCost: 180
                },
                {
                    id: 3,
                    name: 'Bali',
                    country: 'Indonesia',
                    continent: 'Asia',
                    description: 'Tropical paradise with stunning beaches and rich culture.',
                    image: 'https://images.pexels.com/photos/2474691/pexels-photo-2474691.jpeg?auto=compress&cs=tinysrgb&w=800',
                    rating: 4.7,
                    budget: 'Budget',
                    types: ['Beach', 'Nature', 'Culture'],
                    attractions: ['Tanah Lot Temple', 'Ubud Rice Terraces', 'Mount Batur'],
                    bestTime: 'April to October',
                    averageCost: 80
                }
            ],
            activities: [
                { id: 1, name: 'City Walking Tour', type: 'Culture', duration: '3 hours', cost: 25 },
                { id: 2, name: 'Museum Visit', type: 'Culture', duration: '2 hours', cost: 15 },
                { id: 3, name: 'Local Food Tour', type: 'Food', duration: '4 hours', cost: 60 },
                { id: 4, name: 'Beach Day', type: 'Beach', duration: 'Full day', cost: 30 }
            ]
        };
        return fallbacks[endpoint] || [];
    }

    // Destinations API
    async getDestinations() {
        return await this.fetchJSON('destinations');
    }

    async getDestination(id) {
        const destinations = await this.getDestinations();
        return destinations.find(dest => dest.id === parseInt(id));
    }

    async searchDestinations(query, filters = {}) {
        const destinations = await this.getDestinations();
        let filtered = destinations;

        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            filtered = filtered.filter(dest => 
                dest.name.toLowerCase().includes(searchTerm) ||
                dest.country.toLowerCase().includes(searchTerm) ||
                dest.description.toLowerCase().includes(searchTerm)
            );
        }

        // Apply filters
        if (filters.continent) {
            filtered = filtered.filter(dest => dest.continent === filters.continent);
        }
        if (filters.budget) {
            filtered = filtered.filter(dest => dest.budget === filters.budget);
        }
        if (filters.type) {
            filtered = filtered.filter(dest => dest.types.includes(filters.type));
        }

        return filtered;
    }

    // Activities API
    async getActivities() {
        return await this.fetchJSON('activities');
    }

    async getActivitiesByType(type) {
        const activities = await this.getActivities();
        return activities.filter(activity => activity.type === type);
    }

    // Trips API (Local Storage)
    getTrips() {
        const trips = localStorage.getItem('travelbuddy_trips');
        return trips ? JSON.parse(trips) : [];
    }

    getTrip(id) {
        const trips = this.getTrips();
        return trips.find(trip => trip.id === parseInt(id));
    }

    saveTrip(tripData) {
        const trips = this.getTrips();
        
        if (tripData.id) {
            // Update existing trip
            const index = trips.findIndex(trip => trip.id === tripData.id);
            if (index !== -1) {
                trips[index] = { ...trips[index], ...tripData, updatedAt: new Date().toISOString() };
            }
        } else {
            // Create new trip
            const newTrip = {
                ...tripData,
                id: Date.now(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: tripData.status || 'draft'
            };
            trips.push(newTrip);
        }

        localStorage.setItem('travelbuddy_trips', JSON.stringify(trips));
        return tripData.id || trips[trips.length - 1].id;
    }

    deleteTrip(id) {
        const trips = this.getTrips();
        const filtered = trips.filter(trip => trip.id !== parseInt(id));
        localStorage.setItem('travelbuddy_trips', JSON.stringify(filtered));
        return true;
    }

    // User Profile API
    getUserProfile() {
        const profile = localStorage.getItem('travelbuddy_user_profile');
        return profile ? JSON.parse(profile) : null;
    }

    updateUserProfile(profileData) {
        const currentProfile = this.getUserProfile();
        const updatedProfile = { ...currentProfile, ...profileData };
        localStorage.setItem('travelbuddy_user_profile', JSON.stringify(updatedProfile));
        return updatedProfile;
    }

    // Budget API
    getBudgets() {
        const budgets = localStorage.getItem('travelbuddy_budgets');
        return budgets ? JSON.parse(budgets) : [];
    }

    getBudget(tripId) {
        const budgets = this.getBudgets();
        return budgets.find(budget => budget.tripId === parseInt(tripId));
    }

    saveBudget(budgetData) {
        const budgets = this.getBudgets();
        const existingIndex = budgets.findIndex(b => b.tripId === budgetData.tripId);
        
        if (existingIndex !== -1) {
            budgets[existingIndex] = { ...budgets[existingIndex], ...budgetData };
        } else {
            budgets.push({
                id: Date.now(),
                ...budgetData,
                createdAt: new Date().toISOString()
            });
        }
        
        localStorage.setItem('travelbuddy_budgets', JSON.stringify(budgets));
        return true;
    }

    // Statistics API
    getTripStatistics() {
        const trips = this.getTrips();
        const budgets = this.getBudgets();
        
        const stats = {
            totalTrips: trips.length,
            upcomingTrips: trips.filter(trip => {
                const startDate = new Date(trip.startDate);
                const now = new Date();
                return startDate > now && trip.status !== 'completed';
            }).length,
            completedTrips: trips.filter(trip => trip.status === 'completed').length,
            countriesVisited: [...new Set(trips.map(trip => trip.destination.split(',')[1]?.trim() || ''))].filter(Boolean).length,
            totalSpent: budgets.reduce((sum, budget) => {
                return sum + (budget.expenses?.reduce((expSum, exp) => expSum + exp.amount, 0) || 0);
            }, 0)
        };
        
        return stats;
    }

    // AI Suggestions (Mock implementation)
    async getAISuggestions(tripData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const suggestions = {
            activities: [
                { name: 'Morning City Walk', description: 'Start your day exploring the historic downtown area', type: 'Culture', time: '09:00' },
                { name: 'Local Market Visit', description: 'Experience local culture at the main marketplace', type: 'Culture', time: '11:00' },
                { name: 'Traditional Lunch', description: 'Try authentic local cuisine at a recommended restaurant', type: 'Food', time: '13:00' },
                { name: 'Museum Tour', description: 'Visit the most popular museum in the area', type: 'Culture', time: '15:00' }
            ],
            restaurants: [
                { name: 'Local Bistro', type: 'Traditional', rating: 4.5, price: '$$' },
                { name: 'Street Food Market', type: 'Casual', rating: 4.3, price: '$' },
                { name: 'Fine Dining Restaurant', type: 'Upscale', rating: 4.8, price: '$$$' }
            ],
            accommodations: [
                { name: 'Downtown Hotel', type: 'Hotel', rating: 4.4, price: '$$$' },
                { name: 'Cozy B&B', type: 'Bed & Breakfast', rating: 4.6, price: '$$' },
                { name: 'Modern Hostel', type: 'Hostel', rating: 4.2, price: '$' }
            ]
        };
        
        return suggestions;
    }

    // Utility methods
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }
}

// Export singleton instance
window.TravelBuddyAPI = new TravelBuddyAPI();