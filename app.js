document.addEventListener('DOMContentLoaded', function() {
    // API Configuration
    const API_BASE_URL = 'http://localhost:8000';
    let currentUser = null;
    
    // DOM Elements
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const transactionModal = document.getElementById('transaction-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const transactionForm = document.getElementById('transaction-form');
    const bookSearchInput = document.getElementById('book-search');
    const searchBtn = document.getElementById('search-btn');
    const servicesContainer = document.getElementById('services-container');
    const booksContainer = document.getElementById('books-container');
    const bookSelectionGroup = document.getElementById('book-selection-group');
    const selectedBook = document.getElementById('selected-book');
    
    // Initialize the application
    initApp();
    
    function initApp() {
        // Load initial data
        loadServices();
        loadBooks();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Modal handling
        loginBtn.addEventListener('click', () => toggleModal(loginModal));
        closeModalButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                loginModal.style.display = 'none';
                transactionModal.style.display = 'none';
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) loginModal.style.display = 'none';
            if (e.target === transactionModal) transactionModal.style.display = 'none';
        });
        
        // Form submissions
        loginForm.addEventListener('submit', handleLogin);
        registerForm.addEventListener('submit', handleRegistration);
        transactionForm.addEventListener('submit', handleTransaction);
        
        // Search functionality
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchBooks(bookSearchInput.value);
        });
        
        bookSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchBooks(bookSearchInput.value);
            }
        });
    }
    
    // Modal functions
    function toggleModal(modal) {
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
        } else {
            modal.style.display = 'block';
        }
    }
    
    // API Functions
    async function loadServices() {
        try {
            const response = await fetch(`${API_BASE_URL}/services/`);
            if (!response.ok) throw new Error('Failed to load services');
            
            const services = await response.json();
            renderServices(services);
        } catch (error) {
            console.error('Error loading services:', error);
            showError('Failed to load services. Please try again later.');
        }
    }
    
    async function loadBooks(searchTerm = '') {
        try {
            let url = `${API_BASE_URL}/books/`;
            if (searchTerm) {
                url += `?search=${encodeURIComponent(searchTerm)}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load books');
            
            const books = await response.json();
            renderBooks(books);
        } catch (error) {
            console.error('Error loading books:', error);
            showError('Failed to load books. Please try again later.');
        }
    }
    
    async function searchBooks(term) {
        if (!term.trim()) {
            loadBooks();
            return;
        }
        
        await loadBooks(term);
    }
    
    // Render Functions
    function renderServices(services) {
        servicesContainer.innerHTML = '';
        
        services.forEach(service => {
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            serviceCard.dataset.serviceId = service.id;
            
            serviceCard.innerHTML = `
                <div class="service-icon">
                    <i class="fas ${getServiceIcon(service.name)}"></i>
                </div>
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div class="price">$${service.price.toFixed(2)}</div>
                <button class="btn btn-secondary btn-service">Book Now</button>
            `;
            
            servicesContainer.appendChild(serviceCard);
        });
        
        // Add event listeners to service buttons
        document.querySelectorAll('.btn-service').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!currentUser) {
                    alert('Please login to book services');
                    toggleModal(loginModal);
                    return;
                }
                
                const card = e.target.closest('.service-card');
                const serviceId = card.dataset.serviceId;
                const serviceName = card.querySelector('h3').textContent;
                const servicePrice = card.querySelector('.price').textContent;
                
                prepareTransactionModal(serviceId, serviceName, servicePrice);
            });
        });
    }
    
    function renderBooks(books) {
        booksContainer.innerHTML = '';
        
        if (books.length === 0) {
            booksContainer.innerHTML = '<p class="no-books">No books found. Please try a different search.</p>';
            return;
        }
        
        books.forEach(book => {
            const bookCard = document.createElement('div');
            bookCard.className = 'book-card';
            bookCard.dataset.bookId = book.id;
            
            bookCard.innerHTML = `
                <div class="book-cover" style="background-image: url('${getBookCover(book.title, book.author)}')"></div>
                <div class="book-info">
                    <h3>${book.title}</h3>
                    <p>by ${book.author}</p>
                    <p>${book.genre}</p>
                    <p>Published: ${book.publication_year}</p>
                    <p class="availability">Available: ${book.available}/${book.quantity}</p>
                </div>
            `;
            
            booksContainer.appendChild(bookCard);
        });
    }
    
    function prepareTransactionModal(serviceId, serviceName, servicePrice) {
        document.getElementById('transaction-title').textContent = serviceName;
        document.getElementById('service-id').value = serviceId;
        
        const detailsDiv = document.getElementById('transaction-details');
        detailsDiv.innerHTML = `
            <p><strong>Service:</strong> ${serviceName}</p>
            <p><strong>Price:</strong> ${servicePrice}</p>
        `;
        
        // Show book selection only for borrowing service (ID 3 in our example)
        if (parseInt(serviceId) === 3) {
            bookSelectionGroup.style.display = 'block';
            loadAvailableBooksForSelection();
        } else {
            bookSelectionGroup.style.display = 'none';
            document.getElementById('book-id').value = '';
        }
        
        toggleModal(transactionModal);
    }
    
    async function loadAvailableBooksForSelection() {
        try {
            const response = await fetch(`${API_BASE_URL}/books/`);
            if (!response.ok) throw new Error('Failed to load books');
            
            const books = await response.json();
            const availableBooks = books.filter(book => book.available > 0);
            
            selectedBook.innerHTML = '';
            if (availableBooks.length === 0) {
                selectedBook.innerHTML = '<option value="">No books available</option>';
                return;
            }
            
            selectedBook.innerHTML = '<option value="">Select a book to borrow</option>';
            availableBooks.forEach(book => {
                const option = document.createElement('option');
                option.value = book.id;
                option.textContent = `${book.title} by ${book.author}`;
                selectedBook.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading available books:', error);
            selectedBook.innerHTML = '<option value="">Error loading books</option>';
        }
    }
    
    // Form Handlers
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // In a real app, you would validate and send to backend
        // This is a simplified version for demonstration
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo purposes, we'll just set a mock user
            currentUser = {
                id: 1,
                email: email,
                full_name: "Demo User"
            };
            
            alert('Login successful!');
            loginModal.style.display = 'none';
            updateUIForLoggedInUser();
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }
    
    async function handleRegistration(e) {
        e.preventDefault();
        
        const formData = {
            full_name: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            membership_type: "basic"
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/users/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Registration failed');
            }
            
            const userData = await response.json();
            currentUser = userData;
            
            alert('Registration successful! You are now logged in.');
            registerForm.reset();
            updateUIForLoggedInUser();
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'Registration failed. Please try again.');
        }
    }
    
    async function handleTransaction(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Please login to complete this transaction');
            toggleModal(transactionModal);
            toggleModal(loginModal);
            return;
        }
        
        const serviceId = document.getElementById('service-id').value;
        const bookId = selectedBook.value || null;
        
        try {
            const response = await fetch(`${API_BASE_URL}/transactions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: currentUser.id,
                    service_id: parseInt(serviceId),
                    book_id: bookId ? parseInt(bookId) : null
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Transaction failed');
            }
            
            const transactionData = await response.json();
            
            alert(`Transaction completed successfully! Transaction ID: ${transactionData.id}`);
            transactionModal.style.display = 'none';
            transactionForm.reset();
            
            // Refresh data
            loadServices();
            loadBooks();
        } catch (error) {
            console.error('Transaction error:', error);
            alert(error.message || 'Transaction failed. Please try again.');
        }
    }
    
    // Helper Functions
    function getServiceIcon(serviceName) {
        if (serviceName.includes('Browsing')) return 'fa-search';
        if (serviceName.includes('Membership')) return 'fa-id-card';
        if (serviceName.includes('Borrowing')) return 'fa-exchange-alt';
        return 'fa-book';
    }
    
    function getBookCover(title, author) {
        // In a real app, you would have actual book covers
        // This generates a placeholder based on book details
        const colors = ['3498db', '2ecc71', 'e74c3c', '9b59b6', 'f1c40f', '1abc9c'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `https://via.placeholder.com/300x200/${color}/ffffff?text=${encodeURIComponent(title.substring(0, 15) + '...'}`;
    }
    
    function updateUIForLoggedInUser() {
        if (currentUser) {
            loginBtn.textContent = 'My Account';
            // You would add more UI updates here
        }
    }
    
    function showError(message) {
        // In a real app, you'd have a better error display system
        alert(message);
    }
});