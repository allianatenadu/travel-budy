// Utility Functions for TravelBuddy App

// DOM Utilities
const Utils = {
    // DOM Selection
    $(selector) {
        return document.querySelector(selector);
    },

    $$(selector) {
        return document.querySelectorAll(selector);
    },

    // Element creation with attributes and content
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'class') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });

        if (content) {
            element.innerHTML = content;
        }

        return element;
    },

    // Show/hide elements with animation
    show(element, animation = 'fadeIn') {
        element.style.display = 'block';
        element.classList.add(animation);
        setTimeout(() => element.classList.remove(animation), 500);
    },

    hide(element, animation = 'fadeOut') {
        element.classList.add(animation);
        setTimeout(() => {
            element.style.display = 'none';
            element.classList.remove(animation);
        }, 500);
    },

    // Loading state management
    showLoading(container, message = 'Loading...') {
        const loadingHTML = `
            <div class="loading-container" style="text-align: center; padding: 3rem;">
                <div class="loading"></div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">${message}</p>
            </div>
        `;
        container.innerHTML = loadingHTML;
    },

    hideLoading(container) {
        const loading = container.querySelector('.loading-container');
        if (loading) {
            loading.remove();
        }
    },

    // Form utilities
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    },

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showFieldError(input, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });
        
        return isValid;
    },

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('error');
        const errorElement = this.createElement('div', { class: 'field-error' }, message);
        field.parentNode.appendChild(errorElement);
    },

    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    },

    // Date utilities
    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options })
            .format(new Date(date));
    },

    formatRelativeDate(date) {
        const now = new Date();
        const targetDate = new Date(date);
        const diffTime = targetDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `${Math.abs(diffDays)} days ago`;
        } else if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Tomorrow';
        } else if (diffDays <= 7) {
            return `In ${diffDays} days`;
        } else {
            return this.formatDate(date);
        }
    },

    getTripStatus(startDate, endDate) {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (now < start) return 'upcoming';
        if (now >= start && now <= end) return 'ongoing';
        return 'completed';
    },

    // Currency utilities
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },

    // String utilities
    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    },

    // Array utilities
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    },

    sortBy(array, key, direction = 'asc') {
        return array.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            
            if (direction === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    },

    // Local Storage utilities
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.error('Error removing from localStorage:', error);
            }
        },

        clear() {
            try {
                localStorage.clear();
            } catch (error) {
                console.error('Error clearing localStorage:', error);
            }
        }
    },

    // Event utilities
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Modal utilities
    openModal(modalId) {
        const modal = this.$(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            modal.classList.add('fadeIn');
        }
    },

    closeModal(modalId) {
        const modal = this.$(modalId);
        if (modal) {
            modal.classList.add('fadeOut');
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('fadeIn', 'fadeOut');
                document.body.style.overflow = '';
            }, 300);
        }
    },

    // Toast notifications
    showToast(message, type = 'info', duration = 3000) {
        const toast = this.createElement('div', {
            class: `toast toast-${type}`,
            style: 'position: fixed; top: 20px; right: 20px; z-index: 1001; padding: 1rem 1.5rem; border-radius: 8px; color: white; max-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'
        }, message);

        // Set background color based on type
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        toast.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(toast);
        toast.classList.add('slideIn');

        setTimeout(() => {
            toast.classList.add('fadeOut');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    // Animation utilities
    animateValue(element, start, end, duration = 1000) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = current;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    },

    // Color utilities
    getRandomColor() {
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // URL utilities
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (let [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    setQueryParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    },

    removeQueryParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    },

    // Image utilities
    createImagePlaceholder(width = 300, height = 200, text = '') {
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial, sans-serif" font-size="14">${text || `${width}x${height}`}</text></svg>`;
    },

    // Device detection
    isMobile() {
        return window.innerWidth <= 768;
    },

    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },

    isDesktop() {
        return window.innerWidth > 1024;
    }
};

// CSS animations
const style = document.createElement('style');
style.textContent = `
    .fadeIn { animation: fadeIn 0.3s ease-in-out; }
    .fadeOut { animation: fadeOut 0.3s ease-in-out; }
    .slideIn { animation: slideIn 0.3s ease-out; }
    .slideUp { animation: slideUp 0.3s ease-out; }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
    }
    
    @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .field-error {
        color: var(--error-color);
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-1);
    }
    
    .error {
        border-color: var(--error-color) !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
    
    .loading-container .loading {
        margin: 0 auto;
    }
`;
document.head.appendChild(style);

// Export Utils globally
window.Utils = Utils;