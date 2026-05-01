document.addEventListener('DOMContentLoaded', () => {
    
    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    const isDark = localStorage.getItem('theme') !== 'light';
    
    if (!isDark) {
        document.body.classList.remove('dark-mode');
        themeBtn.innerText = '🌙 Dark Mode';
    }

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            themeBtn.innerText = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
            console.log("Theme switched to dark");
        } else {
            themeBtn.innerText = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
            console.log("Theme switched to light");
        }
    });

    // Modal Logic (Demo)
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.querySelector('.close-btn');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalActionBtn = document.getElementById('modal-action-btn');
    const modalMsg = document.getElementById('modal-msg');
    const modalInputs = document.querySelectorAll('.modal-input');
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const userGreeting = document.getElementById('user-greeting');
    const logoutBtn = document.getElementById('logout-btn');

    function openModal(type) {
        modalTitle.innerText = type;
        modal.style.display = 'flex';
        modalMsg.style.display = 'none';
        modalInputs.forEach(input => input.value = '');
        console.log(`Opened ${type} modal`);
    }

    // Stats Logic
    let stats = JSON.parse(localStorage.getItem('aletheia_stats')) || { searches: 0, fake: 0, real: 0, history: [] };
    if (!stats.history) stats.history = [];
    
    const statSearches = document.getElementById('stat-searches');
    const statFake = document.getElementById('stat-fake');
    const historySection = document.getElementById('history-section');
    const historyList = document.getElementById('history-list');

    function updateStatsDisplay() {
        if (statSearches && statFake) {
            statSearches.innerText = stats.searches;
            statFake.innerText = stats.fake;
        }
    }

    function renderHistory() {
        if (!userProfile || userProfile.style.display === 'none') {
            if (historySection) historySection.style.display = 'none';
            return;
        }
        
        if (stats.history.length === 0) {
            if (historySection) historySection.style.display = 'none';
            return;
        }

        if (historySection) historySection.style.display = 'block';
        if (historyList) {
            historyList.innerHTML = '';
            stats.history.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-card glass-panel';
                const isFake = item.result === 'FAKE';
                div.innerHTML = `
                    <div class="history-text">"${item.text}"</div>
                    <div class="history-badge ${isFake ? 'fake' : 'real'}">${isFake ? '🔴 FAKE' : '🟢 REAL'}</div>
                `;
                historyList.appendChild(div);
            });
        }
    }

    function saveStats() {
        localStorage.setItem('aletheia_stats', JSON.stringify(stats));
        updateStatsDisplay();
        renderHistory();
    }
    
    // Initial display
    updateStatsDisplay();

    loginBtn.addEventListener('click', () => openModal('Login'));
    registerBtn.addEventListener('click', () => openModal('Register'));

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    modalActionBtn.addEventListener('click', () => {
        console.log("Button clicked in modal");
        modalMsg.style.display = 'block';
        
        const emailInput = document.querySelector('.modal-input[type="text"]').value;
        let username = emailInput;
        if (emailInput.includes('@')) {
            username = emailInput.split('@')[0];
        } else if (!username) {
            username = 'User';
        }

        setTimeout(() => {
            modal.style.display = 'none';
            authButtons.style.display = 'none';
            userProfile.style.display = 'flex';
            userGreeting.innerText = `Hello ${username}`;
            renderHistory();
            console.log("Modal closed, redirect simulated");
        }, 1500);
    });

    logoutBtn.addEventListener('click', () => {
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        userGreeting.innerText = '';
        modalInputs.forEach(input => input.value = '');
        renderHistory();
    });

    // Analyze Logic
    const analyzeBtn = document.getElementById('analyze-btn');
    const newsInput = document.getElementById('news-input');
    const resultSection = document.getElementById('result-section');
    const resultCard = document.getElementById('result-card');
    const loadingSpinner = document.getElementById('loading-spinner');
    const resultContent = document.getElementById('result-content');
    const resultStatus = document.getElementById('result-status');
    const resultConfidence = document.getElementById('result-confidence');
    const resultReason = document.getElementById('result-reason');

    analyzeBtn.addEventListener('click', async () => {
        const text = newsInput.value.trim();
        
        console.log("Analyze Button clicked");

        if (!text) {
            alert("Please enter text");
            return;
        }

        // Show Loading State
        resultSection.style.display = 'block';
        loadingSpinner.style.display = 'flex';
        resultContent.style.display = 'none';
        
        // Reset styles
        resultCard.className = 'result-card glass-panel';

        console.log("Sending request to backend...");

        try {
            const response = await fetch("http://127.0.0.1:5000/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();
            console.log("Response received:", data);
            
            // Update stats if logged in
            if (userProfile.style.display === 'flex') {
                stats.searches += 1;
                if (data.result === 'FAKE') {
                    stats.fake += 1;
                } else {
                    stats.real += 1;
                }
                
                // Add to history
                const snippet = text.length > 60 ? text.substring(0, 60) + '...' : text;
                stats.history.unshift({ text: snippet, result: data.result });
                if (stats.history.length > 5) stats.history.pop(); // Keep only last 5
                
                saveStats();
            }
            
            showResult(data.result, data.confidence, data.explanation);

        } catch (error) {
            console.error("API failed:", error);
            // Fallback result as requested
            showResult('FAKE', 0.90, "No reliable source found (Fallback Result due to API error)");
        }
    });

    function showResult(result, confidence, explanation) {
        loadingSpinner.style.display = 'none';
        resultContent.style.display = 'block';

        const confPercentage = Math.round(confidence * 100);
        resultConfidence.innerText = `Confidence: ${confPercentage}%`;
        resultReason.innerText = explanation;

        if (result === 'FAKE') {
            resultStatus.innerText = '🔴 MISINFORMATION DETECTED';
            resultCard.classList.add('danger');
        } else {
            resultStatus.innerText = '🟢 VERIFIED TRUE';
            resultCard.classList.add('success');
        }
    }
});
