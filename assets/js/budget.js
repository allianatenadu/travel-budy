// Budget page functionality
class BudgetPage {
    constructor() {
        this.api = window.TravelBuddyAPI;
        this.currentBudget = null;
        this.currentTripId = null;
        this.categories = [];
        this.expenses = [];
        this.init();
    }

    async init() {
        await this.loadTrips();
        this.bindEvents();
        this.initializeDefaultCategories();
    }

    async loadTrips() {
        try {
            const trips = this.api.getTrips();
            this.populateTripSelector(trips);
        } catch (error) {
            console.error('Error loading trips:', error);
        }
    }

    populateTripSelector(trips) {
        const selector = Utils.$('#trip-selector');
        if (!selector) return;

        const tripsHTML = trips.map(trip => 
            `<option value="${trip.id}">${trip.name || 'Untitled Trip'} - ${trip.destination || 'No destination'}</option>`
        ).join('');

        selector.innerHTML = `
            <option value="">Create new budget or select a trip</option>
            ${tripsHTML}
        `;
    }

    bindEvents() {
        // Trip selection
        const tripSelector = Utils.$('#trip-selector');
        if (tripSelector) {
            tripSelector.addEventListener('change', (e) => {
                const tripId = e.target.value;
                if (tripId) {
                    this.loadTripBudget(parseInt(tripId));
                } else {
                    this.createNewBudget();
                }
            });
        }

        // New budget button
        const newBudgetBtn = Utils.$('#new-budget-btn');
        if (newBudgetBtn) {
            newBudgetBtn.addEventListener('click', () => {
                this.createNewBudget();
            });
        }

        // Add category button
        const addCategoryBtn = Utils.$('#add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.showCategoryModal();
            });
        }

        // Add expense
        const addExpenseBtn = Utils.$('#add-expense-btn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                this.addExpense();
            });
        }

        // Category form
        const categoryForm = Utils.$('#category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCategory();
            });
        }

        // Modal events
        this.bindModalEvents();

        // Auto-set today's date for expense date
        const expenseDate = Utils.$('#expense-date');
        if (expenseDate) {
            expenseDate.value = new Date().toISOString().split('T')[0];
        }
    }

    bindModalEvents() {
        const modal = Utils.$('#category-modal');
        const closeBtn = modal?.querySelector('.close');
        const cancelBtn = modal?.querySelector('[data-dismiss="modal"]');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Utils.closeModal('#category-modal');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                Utils.closeModal('#category-modal');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    Utils.closeModal('#category-modal');
                }
            });
        }
    }

    initializeDefaultCategories() {
        this.categories = [
            { id: 1, name: 'Transportation', budget: 500, spent: 0, icon: 'fas fa-plane' },
            { id: 2, name: 'Accommodation', budget: 800, spent: 0, icon: 'fas fa-bed' },
            { id: 3, name: 'Food & Dining', budget: 400, spent: 0, icon: 'fas fa-utensils' },
            { id: 4, name: 'Activities', budget: 300, spent: 0, icon: 'fas fa-ticket-alt' }
        ];
        
        this.renderCategories();
        this.updateBudgetOverview();
        this.populateExpenseCategories();
    }

    createNewBudget() {
        this.currentTripId = null;
        this.currentBudget = null;
        this.initializeDefaultCategories();
        Utils.showToast('New budget created', 'info');
    }

    async loadTripBudget(tripId) {
        this.currentTripId = tripId;
        
        try {
            const budget = this.api.getBudget(tripId);
            
            if (budget) {
                this.currentBudget = budget;
                this.categories = budget.categories || [];
                this.expenses = budget.expenses || [];
            } else {
                // Create new budget for this trip
                this.currentBudget = {
                    tripId: tripId,
                    categories: [...this.categories],
                    expenses: []
                };
                this.expenses = [];
            }
            
            this.renderCategories();
            this.renderExpenses();
            this.updateBudgetOverview();
            this.populateExpenseCategories();
            
        } catch (error) {
            console.error('Error loading budget:', error);
            Utils.showToast('Failed to load budget', 'error');
        }
    }

    renderCategories() {
        const container = Utils.$('#categories-grid');
        if (!container) return;

        if (this.categories.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wallet"></i>
                    <h4>No budget categories</h4>
                    <p>Add categories to start tracking your expenses</p>
                    <button class="btn btn-primary" onclick="budgetPage.showCategoryModal()">
                        Add Category
                    </button>
                </div>
            `;
            return;
        }

        const categoriesHTML = this.categories.map(category => {
            const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
            const remaining = Math.max(0, category.budget - category.spent);
            const isOverBudget = category.spent > category.budget;
            
            return `
                <div class="category-card ${isOverBudget ? 'over-budget' : ''}">
                    <div class="category-header">
                        <div class="category-info">
                            <div class="category-icon">
                                <i class="${category.icon}"></i>
                            </div>
                            <div class="category-details">
                                <h4>${category.name}</h4>
                                <div class="category-budget">
                                    Budget: ${this.api.formatCurrency(category.budget)}
                                </div>
                            </div>
                        </div>
                        <div class="category-actions">
                            <button class="btn-icon" onclick="budgetPage.editCategory(${category.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" onclick="budgetPage.deleteCategory(${category.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="category-progress">
                        <div class="category-progress-bar">
                            <div class="category-progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                        </div>
                        <div class="category-progress-text">
                            <span class="spent-amount">${this.api.formatCurrency(category.spent)}</span>
                            <span class="remaining-amount">
                                ${isOverBudget ? 
                                    `Over by ${this.api.formatCurrency(category.spent - category.budget)}` :
                                    `${this.api.formatCurrency(remaining)} left`
                                }
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = categoriesHTML;
    }

    renderExpenses() {
        const container = Utils.$('#expenses-list');
        if (!container) return;

        if (this.expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h4>No expenses recorded</h4>
                    <p>Start tracking your spending by adding expenses</p>
                </div>
            `;
            return;
        }

        const expensesHTML = this.expenses.map((expense, index) => `
            <div class="expense-item">
                <div class="expense-details">
                    <div class="expense-description">${expense.description}</div>
                    <div class="expense-meta">
                        <span class="expense-date">${Utils.formatDate(expense.date)}</span>
                        <span class="expense-category">${expense.category}</span>
                    </div>
                </div>
                <div class="expense-amount">${this.api.formatCurrency(expense.amount)}</div>
                <div class="expense-actions">
                    <button class="expense-action-btn edit" onclick="budgetPage.editExpense(${index})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="expense-action-btn delete" onclick="budgetPage.deleteExpense(${index})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = expensesHTML;
    }

    updateBudgetOverview() {
        const totalBudget = this.categories.reduce((sum, cat) => sum + cat.budget, 0);
        const totalSpent = this.categories.reduce((sum, cat) => sum + cat.spent, 0);
        const remaining = totalBudget - totalSpent;
        const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        // Update overview cards
        const totalBudgetEl = Utils.$('#total-budget');
        const totalSpentEl = Utils.$('#total-spent');
        const remainingBudgetEl = Utils.$('#remaining-budget');
        const progressFill = Utils.$('#budget-progress-fill');
        const progressText = Utils.$('#budget-progress-text');

        if (totalBudgetEl) totalBudgetEl.textContent = this.api.formatCurrency(totalBudget);
        if (totalSpentEl) totalSpentEl.textContent = this.api.formatCurrency(totalSpent);
        if (remainingBudgetEl) {
            remainingBudgetEl.textContent = this.api.formatCurrency(remaining);
            remainingBudgetEl.className = `amount ${remaining < 0 ? 'spent' : 'remaining'}`;
        }
        if (progressFill) progressFill.style.width = `${Math.min(percentage, 100)}%`;
        if (progressText) {
            progressText.textContent = `${percentage.toFixed(1)}% of budget used`;
        }
    }

    populateExpenseCategories() {
        const select = Utils.$('#expense-category');
        if (!select) return;

        const optionsHTML = this.categories.map(category => 
            `<option value="${category.name}">${category.name}</option>`
        ).join('');

        select.innerHTML = `
            <option value="">Select Category</option>
            ${optionsHTML}
        `;
    }

    showCategoryModal() {
        // Reset form
        const form = Utils.$('#category-form');
        if (form) {
            form.reset();
        }

        Utils.openModal('#category-modal');
    }

    saveCategory() {
        const form = Utils.$('#category-form');
        if (!form || !Utils.validateForm(form)) {
            return;
        }

        const formData = Utils.getFormData(form);
        const category = {
            id: Date.now(),
            name: formData['category-name'],
            budget: parseFloat(formData['category-budget']),
            spent: 0,
            icon: formData['category-icon']
        };

        this.categories.push(category);
        this.renderCategories();
        this.updateBudgetOverview();
        this.populateExpenseCategories();
        this.saveBudgetData();

        Utils.closeModal('#category-modal');
        Utils.showToast('Category added successfully', 'success');
    }

    addExpense() {
        const description = Utils.$('#expense-description')?.value.trim();
        const amount = parseFloat(Utils.$('#expense-amount')?.value);
        const category = Utils.$('#expense-category')?.value;
        const date = Utils.$('#expense-date')?.value;

        if (!description || !amount || !category || !date) {
            Utils.showToast('Please fill in all expense fields', 'error');
            return;
        }

        if (amount <= 0) {
            Utils.showToast('Amount must be greater than 0', 'error');
            return;
        }

        const expense = {
            id: Date.now(),
            description,
            amount,
            category,
            date
        };

        this.expenses.push(expense);

        // Update category spent amount
        const categoryObj = this.categories.find(cat => cat.name === category);
        if (categoryObj) {
            categoryObj.spent += amount;
        }

        // Clear form
        Utils.$('#expense-description').value = '';
        Utils.$('#expense-amount').value = '';
        Utils.$('#expense-category').value = '';
        Utils.$('#expense-date').value = new Date().toISOString().split('T')[0];

        this.renderExpenses();
        this.renderCategories();
        this.updateBudgetOverview();
        this.saveBudgetData();

        Utils.showToast('Expense added successfully', 'success');
    }

    deleteExpense(index) {
        const expense = this.expenses[index];
        if (!expense) return;

        if (confirm(`Delete expense "${expense.description}"?`)) {
            // Update category spent amount
            const categoryObj = this.categories.find(cat => cat.name === expense.category);
            if (categoryObj) {
                categoryObj.spent -= expense.amount;
            }

            this.expenses.splice(index, 1);
            
            this.renderExpenses();
            this.renderCategories();
            this.updateBudgetOverview();
            this.saveBudgetData();

            Utils.showToast('Expense deleted', 'info');
        }
    }

    deleteCategory(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        if (confirm(`Delete category "${category.name}"? This will also delete all expenses in this category.`)) {
            // Remove expenses in this category
            this.expenses = this.expenses.filter(expense => expense.category !== category.name);
            
            // Remove category
            this.categories = this.categories.filter(cat => cat.id !== categoryId);

            this.renderCategories();
            this.renderExpenses();
            this.updateBudgetOverview();
            this.populateExpenseCategories();
            this.saveBudgetData();

            Utils.showToast('Category deleted', 'info');
        }
    }

    saveBudgetData() {
        if (this.currentTripId) {
            const budgetData = {
                tripId: this.currentTripId,
                categories: this.categories,
                expenses: this.expenses,
                updatedAt: new Date().toISOString()
            };

            this.api.saveBudget(budgetData);
        }
    }

    // Method to export budget data
    exportBudget() {
        const budgetData = {
            categories: this.categories,
            expenses: this.expenses,
            summary: {
                totalBudget: this.categories.reduce((sum, cat) => sum + cat.budget, 0),
                totalSpent: this.categories.reduce((sum, cat) => sum + cat.spent, 0),
                exportDate: new Date().toISOString()
            }
        };

        const dataStr = JSON.stringify(budgetData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = 'budget-export.json';
        link.click();
    }

    // Method to generate budget report
    generateReport() {
        const totalBudget = this.categories.reduce((sum, cat) => sum + cat.budget, 0);
        const totalSpent = this.categories.reduce((sum, cat) => sum + cat.spent, 0);
        
        const reportHTML = `
            <div class="budget-report">
                <h2>Budget Report</h2>
                <div class="report-summary">
                    <p><strong>Total Budget:</strong> ${this.api.formatCurrency(totalBudget)}</p>
                    <p><strong>Total Spent:</strong> ${this.api.formatCurrency(totalSpent)}</p>
                    <p><strong>Remaining:</strong> ${this.api.formatCurrency(totalBudget - totalSpent)}</p>
                </div>
                <div class="report-categories">
                    <h3>Category Breakdown</h3>
                    ${this.categories.map(cat => `
                        <div class="report-category">
                            <h4>${cat.name}</h4>
                            <p>Budget: ${this.api.formatCurrency(cat.budget)}</p>
                            <p>Spent: ${this.api.formatCurrency(cat.spent)}</p>
                            <p>Remaining: ${this.api.formatCurrency(cat.budget - cat.spent)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <html>
                <head><title>Budget Report</title></head>
                <body>${reportHTML}</body>
            </html>
        `);
        newWindow.document.close();
    }
}

// Initialize budget page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.budgetPage = new BudgetPage();
});

// Add budget-specific styles
const budgetStyles = `
    .over-budget {
        border-color: var(--error-color) !important;
        background: rgba(239, 68, 68, 0.05) !important;
    }
    
    .over-budget .category-progress-fill {
        background: var(--error-color) !important;
    }
    
    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-secondary);
    }
    
    .empty-state i {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }
    
    .empty-state h4 {
        color: var(--text-primary);
        margin-bottom: 1rem;
    }
    
    .empty-state p {
        margin-bottom: 1.5rem;
        max-width: 300px;
        margin-left: auto;
        margin-right: auto;
    }
    
    .budget-report {
        padding: 2rem;
        font-family: Arial, sans-serif;
    }
    
    .report-summary {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 2rem;
    }
    
    .report-category {
        border: 1px solid #ddd;
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 4px;
    }
    
    .report-category h4 {
        margin-top: 0;
        color: #333;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = budgetStyles;
document.head.appendChild(styleSheet);