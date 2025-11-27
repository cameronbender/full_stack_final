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
                        alert('Login successful!');
                        window.location.href = 'profile.html';
                    } else {
                        alert(data.error || 'Login failed');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
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

                try {
                    const response = await fetch(`${API_URL}/contact`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, email, subject, message })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert('Message sent successfully!');
                        form.reset();
                    } else {
                        alert(data.error || 'Failed to send message');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('An error occurred. Please try again.');
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
                            grid.appendChild(card);
                        });
                    }
                })
                .catch(err => console.error('Error loading proposals:', err));
        }
    }

    // --- Profile Page Logic ---
    if (document.title.includes('Profile')) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            alert('You must be logged in to view this page.');
            window.location.href = 'login.html';
        } else {
            const nameEl = document.getElementById('profile-name');
            const emailEl = document.getElementById('profile-email');
            if (nameEl) nameEl.textContent = user.name;
            if (emailEl) emailEl.textContent = user.email;

            const logoutBtn = document.getElementById('nav-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('user');
                    alert('Logged out successfully.');
                    window.location.href = 'index.html';
                });
            }
        }
    }
});
