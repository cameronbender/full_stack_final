document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';

    // --- Signup Page Logic ---
    const signupForm = document.querySelector('form[action="signup"]');

    if (document.title.includes('Sign Up')) {
        const form = document.querySelector('.login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                if (password !== confirmPassword) {
                    alert('Passwords do not match!');
                    return;
                }

                try {
                    const response = await fetch(`${API_URL}/signup`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ full_name: name, email, password })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert('Signup successful! Please login.');
                        window.location.href = 'login.html';
                    } else {
                        alert(data.error || 'Signup failed');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
                }
            });
        }
    }

    // --- Login Page Logic ---
    if (document.title.includes('Login')) {
        const form = document.querySelector('.login-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                        showNotification('Login successful!');
                        setTimeout(() => {
                            window.location.href = 'profile.html';
                        }, 1000);
                    } else {
                        showNotification(data.error || 'Login failed', true);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('An error occurred. Please try again.', true);
                }
            });
        }
    }

    // --- Contact Page Logic ---
    if (document.title.includes('Work With Us')) {
        const form = document.querySelector('.contact-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const subject = document.getElementById('subject').value;
                const message = document.getElementById('message').value;

                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';

                try {
                    const response = await fetch(`${API_URL}/contact`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, subject, message })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        showNotification('Message sent successfully!');
                        form.reset();
                    } else {
                        showNotification(data.error || 'Failed to send message', true);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    showNotification('An error occurred. Please try again.', true);
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }
    }

    // --- Education Page Logic ---
    if (document.title.includes('Education')) {
        const grid = document.querySelector('.card-grid-education');
        if (grid) {
            // Fetch proposals
            fetch(`${API_URL}/proposals`)
                .then(res => res.json())
                .then(proposals => {
                    if (proposals.length > 0) {
                        grid.innerHTML = '';
                        proposals.forEach(proposal => {
                            const col = document.createElement('div');
                            col.className = 'col-lg-4 col-md-6 mb-4';
                            const card = document.createElement('div');
                            card.className = 'card';
                            card.innerHTML = `
                                <div class="card-body">
                                    <span class="status-badge ${proposal.status.toLowerCase()}">${proposal.status}</span>
                                    <h2 class="card-title">${proposal.title}</h2>
                                    <p><strong>Name:</strong> ${proposal.author_name}</p>
                                    <p><strong>Institution:</strong> ${proposal.institution}</p>
                                    <p><strong>Supervisor:</strong> ${proposal.supervisor}</p>
                                    <a class="pdf-button" href="${API_URL}/pdf/${proposal.pdf_id}" target="_blank" rel="noopener">Open PDF</a>
                                </div>
                            `;
                            col.appendChild(card);
                            grid.appendChild(col);
                        });
                    }
                })
                .catch(err => console.error('Error loading proposals:', err));
        }
    }

    // --- Notification System (Global) ---
    function showNotification(message, isError = false) {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : ''}`;
        notification.innerHTML = `
        <span class="notification-icon">${isError ? '❌' : '✓'}</span>
        <span class="notification-message">${message}</span>
    `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Make showNotification globally accessible
    window.showNotification = showNotification;

    // --- Navigation Update Function ---
        function updateNavigation() {
            // Find login link - it might have href="login.html" or href="#" (if already converted to logout)
            const loginLink = document.querySelector('a.login-link');
            if (!loginLink) return;

            const user = JSON.parse(localStorage.getItem('user'));

            // Remove existing event listeners by cloning the element
            const newLoginLink = loginLink.cloneNode(true);
            loginLink.parentNode.replaceChild(newLoginLink, loginLink);

            if (user) {
                // User is logged in - change to logout
                newLoginLink.textContent = 'Logout';
                newLoginLink.href = '#';
                newLoginLink.classList.add('logout-link');
                newLoginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('user');
                    showNotification('Logged out successfully!');
                    // Update navigation immediately
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 500);
                });
            } else {
                // User is not logged in - keep as login
                newLoginLink.textContent = 'Login';
                newLoginLink.href = 'login.html';
                newLoginLink.classList.remove('logout-link');
            }
        }

        async function loadUserWorks(userId) {
            const worksGrid = document.getElementById('works-grid');
            if (!worksGrid) return;

            try {
                // Get the logged-in user's full name
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || !user.name) {
                    return;
                }

                // Fetch all proposals
                const response = await fetch(`${API_URL}/proposals`);
                if (response.ok) {
                    const proposals = await response.json();
                    // Filter proposals where author_name matches the user's full_name
                    // Compare case-insensitively and trim whitespace
                    const userProposals = proposals.filter(p => {
                        const proposalName = (p.author_name || '').trim().toLowerCase();
                        const userName = (user.name || '').trim().toLowerCase();
                        return proposalName === userName;
                    });

                    if (userProposals.length > 0) {
                        worksGrid.innerHTML = '';
                        userProposals.forEach(proposal => {
                            const workItem = document.createElement('div');
                            workItem.className = 'work-item';
                            workItem.innerHTML = `
                            <div class="work-icon">📄</div>
                            <div class="work-content">
                                <h4>${proposal.title}</h4>
                                <p>${proposal.institution} • ${proposal.status}</p>
                            </div>
                        `;
                            workItem.addEventListener('click', () => {
                                window.open(`${API_URL}/pdf/${proposal.pdf_id}`, '_blank');
                            });
                            worksGrid.appendChild(workItem);
                        });
                    } else {
                        // Show default message if no works found
                        worksGrid.innerHTML = `
                        <div class="work-item">
                            <div class="work-icon">📄</div>
                            <div class="work-content">
                                <h4>No active works</h4>
                                <p>Your contributions and proposals will appear here</p>
                            </div>
                        </div>
                    `;
                    }
                }
            } catch (error) {
                console.error('Error loading user works:', error);
            }
        }

    // --- Profile Page Logic ---
        if (document.title.includes('Profile')) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                showNotification('You must be logged in to view this page.', true);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                // Update profile name and email in new locations
                const nameDisplayEl = document.getElementById('profile-name-display');
                const emailDisplayEl = document.getElementById('profile-email-display');
                const nameEl = document.getElementById('profile-name');
                const emailEl = document.getElementById('profile-email');
                const initialEl = document.getElementById('profile-initial');

                if (nameDisplayEl) nameDisplayEl.textContent = user.name || 'User';
                if (emailDisplayEl) emailDisplayEl.textContent = user.email || '';
                if (nameEl) nameEl.textContent = user.name || 'User';
                if (emailEl) emailEl.textContent = user.email || '';

                // Set avatar initial
                if (initialEl && user.name) {
                    initialEl.textContent = user.name.charAt(0).toUpperCase();
                }

                // Load user's works/proposals if available
                loadUserWorks(user.id || user.email);
            }
        }

    // Call updateNavigation on page load
    updateNavigation();
});
