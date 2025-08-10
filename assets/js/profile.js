// Profile page functionality
class ProfilePage {
    constructor() {
        this.api = window.TravelBuddyAPI;
        this.currentTab = 'personal';
        this.userProfile = null;
        this.achievements = [];
        this.init();
    }

    async init() {
        this.loadUserProfile();
        this.loadAchievements();
        this.bindEvents();
        this.updateProfileStats();
    }

    loadUserProfile() {
        this.userProfile = this.api.getUserProfile();
        if (this.userProfile) {
            this.populateProfileData();
        }
    }

    populateProfileData() {
        // Update profile header
        const profileName = Utils.$('#profile-name');
        const profileBio = Utils.$('#profile-bio');
        
        if (profileName) profileName.textContent = this.userProfile.name || 'John Doe';
        if (profileBio) profileBio.textContent = this.userProfile.bio || 'Passionate traveler exploring the world';

        // Populate personal info form
        this.populatePersonalForm();
        this.populatePreferencesForm();
    }

    populatePersonalForm() {
        const fields = {
            'first-name': this.userProfile.name?.split(' ')[0] || '',
            'last-name': this.userProfile.name?.split(' ').slice(1).join(' ') || '',
            'email': this.userProfile.email || '',
            'phone': this.userProfile.phone || '',
            'bio': this.userProfile.bio || '',
            'location': this.userProfile.location || '',
            'birthdate': this.userProfile.birthdate || ''
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = Utils.$(`#${fieldId}`);
            if (field) {
                field.value = value;
            }
        });
    }

    populatePreferencesForm() {
        const preferences = this.userProfile.preferences || {};

        // Travel style
        const travelStyle = preferences.travelStyle || 'comfort';
        const travelStyleRadio = Utils.$(`input[name="travel-style"][value="${travelStyle}"]`);
        if (travelStyleRadio) {
            travelStyleRadio.checked = true;
        }

        // Activities
        const activities = preferences.activities || [];
        activities.forEach(activity => {
            const checkbox = Utils.$(`input[type="checkbox"][value="${activity}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });

        // Currency and language
        const currency = Utils.$('#currency');
        const language = Utils.$('#language');
        
        if (currency) currency.value = preferences.currency || 'USD';
        if (language) language.value = preferences.language || 'en';
    }

    loadAchievements() {
        const trips = this.api.getTrips();
        const stats = this.api.getTripStatistics();
        
        this.achievements = [
            {
                id: 'first-trip',
                title: 'First Adventure',
                description: 'Plan your first trip',
                icon: '🎯',
                unlocked: trips.length > 0,
                progress: Math.min(trips.length, 1),
                target: 1
            },
            {
                id: 'trip-master',
                title: 'Trip Master',
                description: 'Plan 10 trips',
                icon: '🏆',
                unlocked: trips.length >= 10,
                progress: Math.min(trips.length, 10),
                target: 10
            },
            {
                id: 'globe-trotter',
                title: 'Globe Trotter',
                description: 'Visit 5 different countries',
                icon: '🌍',
                unlocked: stats.countriesVisited >= 5,
                progress: Math.min(stats.countriesVisited, 5),
                target: 5
            },
            {
                id: 'budget-wise',
                title: 'Budget Wise',
                description: 'Stay within budget on 3 trips',
                icon: '💰',
                unlocked: false, // This would need more complex logic
                progress: 0,
                target: 3
            },
            {
                id: 'early-bird',
                title: 'Early Bird',
                description: 'Plan a trip 6 months in advance',
                icon: '🐦',
                unlocked: false, // This would need more complex logic
                progress: 0,
                target: 1
            },
            {
                id: 'social-traveler',
                title: 'Social Traveler',
                description: 'Plan a group trip with 4+ people',
                icon: '👥',
                unlocked: trips.some(trip => parseInt(trip.travelers) >= 4),
                progress: trips.some(trip => parseInt(trip.travelers) >= 4) ? 1 : 0,
                target: 1
            }
        ];

        this.renderAchievements();
    }

    renderAchievements() {
        const container = Utils.$('#achievements-grid');
        if (!container) return;

        const achievementsHTML = this.achievements.map(achievement => {
            const progressPercentage = (achievement.progress / achievement.target) * 100;
            
            return `
                <div class="achievement-card ${achievement.unlocked ? 'unlocked' : ''}">
                    <div class="achievement-icon">${achievement.icon}</div>
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                    <div class="achievement-progress">
                        <div class="achievement-progress-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="achievement-progress-text">
                        ${achievement.progress}/${achievement.target}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = achievementsHTML;
    }

    updateProfileStats() {
        const stats = this.api.getTripStatistics();
        
        // Update stats in profile header
        const tripsCount = Utils.$('#trips-count');
        const countriesCount = Utils.$('#countries-count');
        const citiesCount = Utils.$('#cities-count');

        if (tripsCount) Utils.animateValue(tripsCount, 0, stats.totalTrips, 1000);
        if (countriesCount) Utils.animateValue(countriesCount, 0, stats.countriesVisited, 1200);
        if (citiesCount) Utils.animateValue(citiesCount, 0, stats.totalTrips * 2, 1400); // Estimate cities
    }

    bindEvents() {
        // Tab switching
        const tabButtons = Utils.$$('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });

        // Form submissions
        this.bindFormEvents();

        // Settings toggles
        this.bindSettingsEvents();

        // Avatar upload
        this.bindAvatarUpload();
    }

    bindFormEvents() {
        // Personal info form
        const personalForm = Utils.$('#personal-form');
        if (personalForm) {
            personalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePersonalInfo();
            });
        }

        // Preferences form
        const preferencesForm = Utils.$('#preferences-form');
        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePreferences();
            });
        }
    }

    bindSettingsEvents() {
        const settingSwitches = Utils.$$('.switch input[type="checkbox"]');
        settingSwitches.forEach(switchEl => {
            switchEl.addEventListener('change', (e) => {
                const settingName = e.target.closest('.setting-item').querySelector('h4').textContent;
                const isEnabled = e.target.checked;
                
                Utils.showToast(
                    `${settingName} ${isEnabled ? 'enabled' : 'disabled'}`,
                    'info'
                );
                
                // Save setting to profile
                this.saveSetting(settingName, isEnabled);
            });
        });
    }

    bindAvatarUpload() {
        const avatarUpload = Utils.$('.avatar-upload');
        if (avatarUpload) {
            avatarUpload.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.handleAvatarUpload(file);
                    }
                };
                input.click();
            });
        }
    }

    switchTab(tabId) {
        this.currentTab = tabId;

        // Update tab buttons
        Utils.$$('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });

        // Update tab panels
        Utils.$$('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
            if (panel.id === tabId) {
                panel.classList.add('active');
            }
        });
    }

    savePersonalInfo() {
        const form = Utils.$('#personal-form');
        if (!form || !Utils.validateForm(form)) {
            return;
        }

        const formData = Utils.getFormData(form);
        
        const updatedProfile = {
            ...this.userProfile,
            name: `${formData['first-name']} ${formData['last-name']}`.trim(),
            email: formData.email,
            phone: formData.phone,
            bio: formData.bio,
            location: formData.location,
            birthdate: formData.birthdate
        };

        try {
            this.userProfile = this.api.updateUserProfile(updatedProfile);
            
            // Update profile header
            const profileName = Utils.$('#profile-name');
            const profileBio = Utils.$('#profile-bio');
            
            if (profileName) profileName.textContent = this.userProfile.name;
            if (profileBio) profileBio.textContent = this.userProfile.bio;
            
            Utils.showToast('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            Utils.showToast('Failed to update profile', 'error');
        }
    }

    savePreferences() {
        const form = Utils.$('#preferences-form');
        if (!form) return;

        const formData = Utils.getFormData(form);
        
        // Get selected activities
        const selectedActivities = Array.from(form.querySelectorAll('input[name="activities"]:checked'))
            .map(cb => cb.value);

        const preferences = {
            travelStyle: formData['travel-style'],
            activities: selectedActivities,
            currency: formData.currency,
            language: formData.language
        };

        const updatedProfile = {
            ...this.userProfile,
            preferences: preferences
        };

        try {
            this.userProfile = this.api.updateUserProfile(updatedProfile);
            Utils.showToast('Preferences saved successfully', 'success');
        } catch (error) {
            console.error('Error saving preferences:', error);
            Utils.showToast('Failed to save preferences', 'error');
        }
    }

    saveSetting(settingName, value) {
        const settings = this.userProfile.settings || {};
        settings[settingName] = value;

        const updatedProfile = {
            ...this.userProfile,
            settings: settings
        };

        this.userProfile = this.api.updateUserProfile(updatedProfile);
    }

    handleAvatarUpload(file) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            Utils.showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            Utils.showToast('Image size must be less than 5MB', 'error');
            return;
        }

        // Create file reader
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            
            // Update profile image
            const profileImage = Utils.$('#profile-image');
            if (profileImage) {
                profileImage.src = imageUrl;
            }

            // Save to profile
            const updatedProfile = {
                ...this.userProfile,
                avatar: imageUrl
            };

            this.userProfile = this.api.updateUserProfile(updatedProfile);
            Utils.showToast('Profile picture updated', 'success');
        };

        reader.readAsDataURL(file);
    }

    // Method to export profile data
    exportProfile() {
        const profileData = {
            ...this.userProfile,
            achievements: this.achievements,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(profileData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'profile-export.json';
        link.click();
    }

    // Method to delete account (with confirmation)
    deleteAccount() {
        const confirmText = 'DELETE';
        const userInput = prompt(
            `This action cannot be undone. All your data will be permanently deleted.\n\nType "${confirmText}" to confirm:`
        );

        if (userInput === confirmText) {
            // Clear all user data
            localStorage.clear();
            
            Utils.showToast('Account deleted successfully', 'info');
            
            // Redirect to home page after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else if (userInput !== null) {
            Utils.showToast('Account deletion cancelled', 'info');
        }
    }

    // Method to reset profile to defaults
    resetProfile() {
        if (confirm('Reset profile to default settings? This cannot be undone.')) {
            const defaultProfile = {
                name: 'John Doe',
                email: 'john.doe@example.com',
                bio: 'Passionate traveler exploring the world one city at a time',
                preferences: {
                    currency: 'USD',
                    language: 'en',
                    travelStyle: 'comfort',
                    activities: ['culture', 'adventure']
                }
            };

            this.userProfile = this.api.updateUserProfile(defaultProfile);
            this.populateProfileData();
            Utils.showToast('Profile reset to defaults', 'info');
        }
    }
}

// Initialize profile page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profilePage = new ProfilePage();
    
    // Bind delete account button
    const deleteAccountBtn = Utils.$('.btn-danger');
    if (deleteAccountBtn && deleteAccountBtn.textContent.includes('Delete Account')) {
        deleteAccountBtn.addEventListener('click', () => {
            window.profilePage.deleteAccount();
        });
    }
});

// Add profile-specific styles
const profileStyles = `
    .tab-panel {
        min-height: 400px;
    }
    
    .achievement-card.unlocked {
        animation: achievementUnlock 0.5s ease-out;
    }
    
    @keyframes achievementUnlock {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .profile-stats .stat {
        transition: all 0.3s ease;
    }
    
    .profile-stats .stat:hover {
        transform: translateY(-2px);
    }
    
    .setting-item {
        transition: all 0.2s ease;
    }
    
    .setting-item:hover {
        transform: translateX(4px);
    }
    
    .avatar-upload {
        transition: all 0.2s ease;
    }
    
    .avatar-upload:hover {
        transform: scale(1.1);
        background: var(--accent-dark);
    }
    
    .danger-zone {
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = profileStyles;
document.head.appendChild(styleSheet);