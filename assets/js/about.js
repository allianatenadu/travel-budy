// About page functionality
class AboutPage {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.initAnimations();
        this.loadDynamicContent();
    }

    bindEvents() {
        // Contact form
        const contactForm = Utils.$('.contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm(e.target);
            });
        }

        // Team member interactions
        this.bindTeamMemberEvents();

        // Scroll animations
        this.setupScrollAnimations();
    }

    bindTeamMemberEvents() {
        const teamMembers = Utils.$$('.team-member');
        teamMembers.forEach(member => {
            member.addEventListener('mouseenter', () => {
                this.animateTeamMember(member, true);
            });

            member.addEventListener('mouseleave', () => {
                this.animateTeamMember(member, false);
            });
        });

        // Social links
        const socialLinks = Utils.$$('.social-links a');
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = this.getSocialPlatform(link);
                this.trackSocialClick(platform);
                Utils.showToast(`Opening ${platform} profile`, 'info');
            });
        });
    }

    animateTeamMember(member, isHover) {
        const img = member.querySelector('img');
        const socialLinks = member.querySelector('.social-links');
        
        if (isHover) {
            img.style.transform = 'scale(1.05) rotate(2deg)';
            socialLinks.style.transform = 'translateY(-5px)';
            socialLinks.style.opacity = '1';
        } else {
            img.style.transform = 'scale(1) rotate(0deg)';
            socialLinks.style.transform = 'translateY(0)';
            socialLinks.style.opacity = '0.8';
        }
    }

    getSocialPlatform(link) {
        const href = link.getAttribute('href') || '';
        const icon = link.querySelector('i');
        
        if (icon.classList.contains('fa-linkedin')) return 'LinkedIn';
        if (icon.classList.contains('fa-twitter')) return 'Twitter';
        if (icon.classList.contains('fa-github')) return 'GitHub';
        if (icon.classList.contains('fa-dribbble')) return 'Dribbble';
        
        return 'Social Media';
    }

    trackSocialClick(platform) {
        // Analytics tracking
        console.log('Social click:', platform);
    }

    handleContactForm(form) {
        if (!Utils.validateForm(form)) {
            return;
        }

        const formData = Utils.getFormData(form);
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<div class="loading"></div> Sending...';
        submitBtn.disabled = true;

        // Simulate form submission
        setTimeout(() => {
            this.processContactForm(formData);
            
            // Reset form and button
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    processContactForm(formData) {
        // In a real app, this would send data to a server
        console.log('Contact form submitted:', formData);
        
        // Store in localStorage for demo purposes
        const contacts = Utils.storage.get('contact_submissions', []);
        contacts.push({
            ...formData,
            timestamp: new Date().toISOString()
        });
        Utils.storage.set('contact_submissions', contacts);

        Utils.showToast('Message sent successfully! We\'ll get back to you soon.', 'success', 5000);
        
        // Track form submission
        this.trackContactSubmission(formData);
    }

    trackContactSubmission(formData) {
        // Analytics tracking
        console.log('Contact form submission:', {
            subject: formData.subject || 'general',
            timestamp: new Date().toISOString()
        });
    }

    initAnimations() {
        // Animate statistics
        this.animateStatistics();
        
        // Stagger animations for feature items
        this.staggerFeatureAnimations();
        
        // Animate value items
        this.animateValueItems();
    }

    animateStatistics() {
        const stats = [
            { element: Utils.$('.stat-item:nth-child(1) h3'), target: 10000, suffix: '+' },
            { element: Utils.$('.stat-item:nth-child(2) h3'), target: 50000, suffix: '+' },
            { element: Utils.$('.stat-item:nth-child(3) h3'), target: 150, suffix: '+' }
        ];

        // Use Intersection Observer to trigger animations when visible
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    stats.forEach(stat => {
                        if (stat.element && entry.target.contains(stat.element)) {
                            Utils.animateValue(stat.element, 0, stat.target, 2000);
                            setTimeout(() => {
                                if (stat.element.textContent === stat.target.toString()) {
                                    stat.element.textContent += stat.suffix;
                                }
                            }, 2000);
                        }
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const missionSection = Utils.$('.mission-section');
        if (missionSection) {
            observer.observe(missionSection);
        }
    }

    staggerFeatureAnimations() {
        const featureItems = Utils.$$('.feature-item');
        featureItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.6s ease-out';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }

    animateValueItems() {
        const valueItems = Utils.$$('.value-item');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        valueItems.forEach(item => observer.observe(item));
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);

        // Observe sections for scroll animations
        const sections = Utils.$$('.mission-section, .features-section, .team-section, .values-section, .contact-section');
        sections.forEach(section => observer.observe(section));
    }

    loadDynamicContent() {
        // Load testimonials or reviews if available
        this.loadTestimonials();
        
        // Load company news or updates
        this.loadCompanyUpdates();
        
        // Update copyright year
        this.updateCopyrightYear();
    }

    loadTestimonials() {
        // This would typically fetch from an API
        const testimonials = [
            {
                name: 'Sarah Johnson',
                role: 'Travel Blogger',
                content: 'TravelBuddy has revolutionized how I plan my trips. The AI suggestions are spot-on!',
                rating: 5
            },
            {
                name: 'Mike Chen',
                role: 'Business Traveler',
                content: 'The budget tracking feature saved me hundreds of dollars on my last business trip.',
                rating: 5
            }
        ];

        // If there's a testimonials section, populate it
        const testimonialsSection = Utils.$('#testimonials-section');
        if (testimonialsSection) {
            this.renderTestimonials(testimonials);
        }
    }

    renderTestimonials(testimonials) {
        const testimonialsHTML = testimonials.map(testimonial => `
            <div class="testimonial-card">
                <div class="testimonial-content">
                    <p>"${testimonial.content}"</p>
                </div>
                <div class="testimonial-author">
                    <h4>${testimonial.name}</h4>
                    <p>${testimonial.role}</p>
                    <div class="testimonial-rating">
                        ${Array.from({ length: testimonial.rating }, () => '<i class="fas fa-star"></i>').join('')}
                    </div>
                </div>
            </div>
        `).join('');

        const testimonialsContainer = Utils.$('#testimonials-container');
        if (testimonialsContainer) {
            testimonialsContainer.innerHTML = testimonialsHTML;
        }
    }

    loadCompanyUpdates() {
        // This would typically fetch from a blog API or CMS
        const updates = [
            {
                title: 'New AI Features Released',
                date: '2025-01-15',
                summary: 'We\'ve enhanced our AI recommendation engine with better personalization.'
            },
            {
                title: 'Mobile App Coming Soon',
                date: '2025-01-10',
                summary: 'Our mobile app is in final testing and will be available next month.'
            }
        ];

        // If there's an updates section, populate it
        const updatesSection = Utils.$('#company-updates');
        if (updatesSection) {
            this.renderCompanyUpdates(updates);
        }
    }

    renderCompanyUpdates(updates) {
        const updatesHTML = updates.map(update => `
            <div class="update-item">
                <div class="update-date">${Utils.formatDate(update.date)}</div>
                <h4>${update.title}</h4>
                <p>${update.summary}</p>
            </div>
        `).join('');

        const updatesContainer = Utils.$('#updates-container');
        if (updatesContainer) {
            updatesContainer.innerHTML = updatesHTML;
        }
    }

    updateCopyrightYear() {
        const currentYear = new Date().getFullYear();
        const copyrightElements = Utils.$$('.footer-bottom p');
        
        copyrightElements.forEach(element => {
            if (element.textContent.includes('2025')) {
                element.textContent = element.textContent.replace('2025', currentYear);
            }
        });
    }

    // Method to show company timeline
    showTimeline() {
        const timeline = [
            { year: '2023', event: 'TravelBuddy founded with a vision to simplify travel planning' },
            { year: '2024', event: 'Launched AI-powered trip recommendations' },
            { year: '2024', event: 'Reached 10,000 active users' },
            { year: '2025', event: 'Expanding to mobile platforms' }
        ];

        const timelineHTML = `
            <div class="company-timeline">
                <h3>Our Journey</h3>
                ${timeline.map(item => `
                    <div class="timeline-item">
                        <div class="timeline-year">${item.year}</div>
                        <div class="timeline-event">${item.event}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Show in modal or dedicated section
        const modal = Utils.createElement('div', { class: 'timeline-modal' }, timelineHTML);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 100);

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.remove(), 300);
            }
        });
    }

    // Method to show job openings
    showCareers() {
        const careers = [
            {
                title: 'Senior Frontend Developer',
                location: 'Remote',
                type: 'Full-time',
                description: 'Join our team to build amazing user experiences for travelers worldwide.'
            },
            {
                title: 'Travel Content Specialist',
                location: 'New York, NY',
                type: 'Full-time',
                description: 'Help create engaging content and destination guides for our users.'
            },
            {
                title: 'Data Scientist',
                location: 'San Francisco, CA',
                type: 'Full-time',
                description: 'Work on our AI recommendation engine and travel data analytics.'
            }
        ];

        const careersHTML = `
            <div class="careers-section">
                <h3>Join Our Team</h3>
                <p>We're always looking for talented individuals who share our passion for travel and technology.</p>
                ${careers.map(job => `
                    <div class="job-listing">
                        <h4>${job.title}</h4>
                        <div class="job-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                            <span><i class="fas fa-clock"></i> ${job.type}</span>
                        </div>
                        <p>${job.description}</p>
                        <button class="btn btn-outline">Apply Now</button>
                    </div>
                `).join('')}
            </div>
        `;

        Utils.showToast('Careers section would open here', 'info');
    }
}

// Initialize about page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aboutPage = new AboutPage();
});

// Add about-specific styles
const aboutStyles = `
    .animate-in {
        animation: slideInUp 0.8s ease-out;
    }
    
    .fade-in {
        animation: fadeIn 1s ease-out;
    }
    
    .testimonial-card {
        background: var(--bg-primary);
        border-radius: 12px;
        padding: 2rem;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-color);
        margin-bottom: 1.5rem;
    }
    
    .testimonial-content {
        margin-bottom: 1.5rem;
    }
    
    .testimonial-content p {
        font-style: italic;
        font-size: var(--font-size-lg);
        line-height: var(--line-height-relaxed);
    }
    
    .testimonial-author h4 {
        margin-bottom: 0.25rem;
        color: var(--text-primary);
    }
    
    .testimonial-author p {
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }
    
    .testimonial-rating {
        color: var(--accent-color);
    }
    
    .company-timeline {
        max-width: 600px;
        margin: 0 auto;
        padding: 2rem;
    }
    
    .timeline-item {
        display: flex;
        align-items: center;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: 8px;
        border-left: 4px solid var(--primary-color);
    }
    
    .timeline-year {
        font-weight: 700;
        color: var(--primary-color);
        margin-right: 1rem;
        min-width: 60px;
    }
    
    .timeline-event {
        color: var(--text-primary);
        line-height: var(--line-height-relaxed);
    }
    
    .timeline-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .timeline-modal.show {
        opacity: 1;
    }
    
    .job-listing {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        border: 1px solid var(--border-color);
    }
    
    .job-listing h4 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .job-meta {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
    }
    
    .job-meta span {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .update-item {
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        border-left: 4px solid var(--primary-color);
    }
    
    .update-date {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }
    
    .update-item h4 {
        margin-bottom: 0.5rem;
        color: var(--text-primary);
    }
    
    .update-item p {
        color: var(--text-secondary);
        line-height: var(--line-height-relaxed);
        margin: 0;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = aboutStyles;
document.head.appendChild(styleSheet);