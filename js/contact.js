document.addEventListener('DOMContentLoaded', () => {
    // Comment Form
    const commentForm = document.getElementById('comment-form');
    const commentMessageDiv = document.getElementById('comment-message');

    // Newsletter Form
    const newsletterForm = document.getElementById('newsletter-form');
    const newsletterMessageDiv = document.getElementById('newsletter-message');

    // Auto-fill hidden fields
    const deviceInfo = document.getElementById('device-info');
    const browserInfo = document.getElementById('browser-info');

    if (deviceInfo) {
        deviceInfo.value = navigator.platform || 'Unknown';
    }

    if (browserInfo) {
        browserInfo.value = navigator.userAgent;
    }

    // Determine API Base URL
    // If we are on http(s), use relative path. If on file://, use localhost:8000
    const API_BASE = window.location.protocol.startsWith('http') ? '' : 'http://localhost:8000';

    // Handler for Comment Form
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(commentForm);
            const data = Object.fromEntries(formData.entries());

            if (!data.message) {
                showMessage(commentMessageDiv, getCurrentLang() === 'nl' ? 'Vul alstublieft een bericht in.' : 'Please enter a message.', 'error');
                return;
            }

            // Add language info
            data.language = getCurrentLang();

            submitData(`${API_BASE}/api/comment`, data, commentForm, commentMessageDiv);
        });
    }

    // Handler for Newsletter Form
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(newsletterForm);
            const data = Object.fromEntries(formData.entries());

            if (!data.email) {
                showMessage(newsletterMessageDiv, getCurrentLang() === 'nl' ? 'Vul alstublieft een emailadres in.' : 'Please enter an email address.', 'error');
                return;
            }
            // Add language info
            data.language = getCurrentLang();

            submitData(`${API_BASE}/api/subscribe`, data, newsletterForm, newsletterMessageDiv);
        });
    }

    function submitData(url, data, form, messageDiv) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = getCurrentLang() === 'nl' ? 'Versturen...' : 'Sending...';
        submitBtn.disabled = true;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (response.ok) {
                    const successMsg = getCurrentLang() === 'nl'
                        ? 'Bedankt! Het is opgeslagen.'
                        : 'Thank you! It has been saved.';
                    showMessage(messageDiv, successMsg, 'success');
                    form.reset();
                } else {
                    throw new Error('Server returned ' + response.status);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                const errorMsg = getCurrentLang() === 'nl'
                    ? 'Er ging iets mis. Controleer of de server draait.'
                    : 'Something went wrong. Please check if the server is running.';
                showMessage(messageDiv, errorMsg, 'error');
            })
            .finally(() => {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            });
    }

    function showMessage(element, text, type) {
        if (!element) return;
        element.textContent = text;
        element.className = 'form-message ' + type;

        // Auto hide after 5 seconds
        setTimeout(() => {
            if (element.className.includes('success')) {
                element.textContent = '';
                element.className = 'form-message';
            }
        }, 5000); // 5 seconds
    }

    function getCurrentLang() {
        return window.location.pathname.includes('/en/') ? 'en' : 'nl';
    }
});
