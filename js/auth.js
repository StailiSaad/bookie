// Authentication Logic

// Handle login
async function handleLogin(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Login successful:', userCredential.user.email);
        
        // Redirect to original page or home
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'index.html';
        window.location.href = redirect;
        
        return true;
    } catch (error) {
        console.error('Login error:', error);
        
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
        }
        
        throw new Error(errorMessage);
    }
}

// Handle signup
async function handleSignup(email, password, displayName) {
    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        await user.updateProfile({
            displayName: displayName
        });
        
        // Create user document in Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            displayName: displayName,
            role: 'customer',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Signup successful:', user.email);
        
        // Redirect to original page or home
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'index.html';
        window.location.href = redirect;
        
        return true;
    } catch (error) {
        console.error('Signup error:', error);
        
        let errorMessage = 'Signup failed. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled.';
                break;
        }
        
        throw new Error(errorMessage);
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        
        // Add required scopes
        provider.addScope('profile');
        provider.addScope('email');
        
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user document exists, create if not
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName,
                role: 'customer',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        console.log('Google sign-in successful:', user.email);
        
        // Redirect to original page or home
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'index.html';
        window.location.href = redirect;
        
        return true;
    } catch (error) {
        console.error('Google sign-in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Google sign-in failed. ' + error.message;
        
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign-in cancelled. Please try again.';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Pop-up blocked. Please allow pop-ups for this site.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'This domain is not authorized. Please contact the administrator.';
        } else if (error.code === 'authoperation-not-allowed') {
            errorMessage = 'Google sign-in is not enabled. Please enable it in Firebase Console.';
        }
        
        throw new Error(errorMessage);
    }
}

// Handle password reset
async function handlePasswordReset(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return true;
    } catch (error) {
        console.error('Password reset error:', error);
        
        let errorMessage = 'Failed to send reset email. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
        }
        
        throw new Error(errorMessage);
    }
}

// Validate email format
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate password strength
function validatePassword(password) {
    return password.length >= 6;
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Hide error message
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

// Initialize auth page
function initAuthPage() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const googleSignInBtn = document.getElementById('google-signin-btn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    
    // Tab switching
    if (loginTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginForm.style.display = 'block';
            signupForm.style.display = 'none';
            hideError('login-error');
            hideError('signup-error');
        });
    }
    
    if (signupTab) {
        signupTab.addEventListener('click', () => {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupForm.style.display = 'block';
            loginForm.style.display = 'none';
            hideError('login-error');
            hideError('signup-error');
        });
    }
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError('login-error');
            
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            // Validation
            if (!validateEmail(email)) {
                showError('login-error', 'Please enter a valid email address.');
                return;
            }
            
            if (!password) {
                showError('login-error', 'Please enter your password.');
                return;
            }
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';
            
            try {
                await handleLogin(email, password);
            } catch (error) {
                showError('login-error', error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }
    
    // Signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError('signup-error');
            
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            
            // Validation
            if (!name) {
                showError('signup-error', 'Please enter your name.');
                return;
            }
            
            if (!validateEmail(email)) {
                showError('signup-error', 'Please enter a valid email address.');
                return;
            }
            
            if (!validatePassword(password)) {
                showError('signup-error', 'Password must be at least 6 characters.');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('signup-error', 'Passwords do not match.');
                return;
            }
            
            // Disable button and show loading
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating account...';
            
            try {
                await handleSignup(email, password, name);
            } catch (error) {
                showError('signup-error', error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    }
    
    // Google Sign-In
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            hideError('login-error');
            hideError('signup-error');
            
            try {
                await handleGoogleSignIn();
            } catch (error) {
                showError('login-error', error.message);
            }
        });
    }
    
    // Forgot password
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            hideError('login-error');
            
            const email = document.getElementById('login-email').value.trim();
            
            if (!validateEmail(email)) {
                showError('login-error', 'Please enter your email address first.');
                return;
            }
            
            try {
                await handlePasswordReset(email);
                alert('Password reset email sent! Please check your inbox.');
            } catch (error) {
                showError('login-error', error.message);
            }
        });
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthPage);
} else {
    initAuthPage();
}
