// Variables globales
let currentSection = 'home';
let score = 0;
let level = 1;
let animationId = null;
let time = 0;

// Paramètres des ondes
const waveParams = {
    frequency1: 2,
    frequency2: 2.5,
    amplitude1: 50,
    amplitude2: 40,
    phase1: 0,
    phase2: Math.PI / 4
};

// Questions du quiz
const quizQuestions = [
    {
        question: "Que se passe-t-il quand deux ondes de même fréquence et amplitude se rencontrent en phase ?",
        options: [
            "Elles s'annulent",
            "Elles s'amplifient (interférence constructive)",
            "Elles restent identiques",
            "Elles changent de fréquence"
        ],
        correct: 1
    },
    {
        question: "Dans une onde stationnaire, les points qui ne bougent jamais sont appelés :",
        options: [
            "Ventres",
            "Nœuds",
            "Crêtes",
            "Vallées"
        ],
        correct: 1
    },
    {
        question: "La distance entre deux nœuds consécutifs dans une onde stationnaire est :",
        options: [
            "Une longueur d'onde complète (λ)",
            "Une demi-longueur d'onde (λ/2)",
            "Deux longueurs d'onde (2λ)",
            "Un quart de longueur d'onde (λ/4)"
        ],
        correct: 1
    }
];

let currentQuiz = 0;
let selectedAnswer = null;
let showResult = false;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    showSection('home');
    updateScoreDisplay();
}

function setupEventListeners() {
    // Navigation modules
    document.querySelectorAll('.module-card').forEach(card => {
        card.addEventListener('click', function() {
            const module = this.getAttribute('data-module');
            if (module === 'quiz') {
                showQuiz();
            } else {
                showSection(module);
            }
        });
    });

    // Boutons retour
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-back');
            if (target === 'home') {
                showSection('home');
            }
        });
    });

    // Contrôles du laboratoire
    setupLabControls();
    
    // Boutons du studio musical
    setupMusicControls();
    
    // Quiz
    setupQuizControls();
}

function showSection(sectionName) {
    // Cacher toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Démarrer l'animation des ondes si on est dans le lab
        if (sectionName === 'lab') {
            startWaveAnimation();
        } else {
            stopWaveAnimation();
        }
    }
}

function setupLabControls() {
    // Contrôle fréquence 1
    const freq1Slider = document.getElementById('freq1');
    const freq1Value = document.getElementById('freq1-value');
    
    freq1Slider.addEventListener('input', function() {
        waveParams.frequency1 = parseFloat(this.value);
        freq1Value.textContent = waveParams.frequency1.toFixed(1);
    });

    // Contrôle amplitude 1
    const amp1Slider = document.getElementById('amp1');
    const amp1Value = document.getElementById('amp1-value');
    
    amp1Slider.addEventListener('input', function() {
        waveParams.amplitude1 = parseInt(this.value);
        amp1Value.textContent = waveParams.amplitude1;
    });

    // Contrôle fréquence 2
    const freq2Slider = document.getElementById('freq2');
    const freq2Value = document.getElementById('freq2-value');
    
    freq2Slider.addEventListener('input', function() {
        waveParams.frequency2 = parseFloat(this.value);
        freq2Value.textContent = waveParams.frequency2.toFixed(1);
    });

    // Contrôle amplitude 2
    const amp2Slider = document.getElementById('amp2');
    const amp2Value = document.getElementById('amp2-value');
    
    amp2Slider.addEventListener('input', function() {
        waveParams.amplitude2 = parseInt(this.value);
        amp2Value.textContent = waveParams.amplitude2;
    });

    // Boutons prédéfinis
    document.getElementById('constructive-btn').addEventListener('click', function() {
        waveParams.frequency1 = 2;
        waveParams.frequency2 = 2;
        waveParams.amplitude1 = 50;
        waveParams.amplitude2 = 50;
        waveParams.phase2 = 0;
        updateSliders();
    });

    document.getElementById('destructive-btn').addEventListener('click', function() {
        waveParams.frequency1 = 2;
        waveParams.frequency2 = 2;
        waveParams.amplitude1 = 50;
        waveParams.amplitude2 = 50;
        waveParams.phase2 = Math.PI;
        updateSliders();
    });
}

function updateSliders() {
    document.getElementById('freq1').value = waveParams.frequency1;
    document.getElementById('freq1-value').textContent = waveParams.frequency1.toFixed(1);
    document.getElementById('amp1').value = waveParams.amplitude1;
    document.getElementById('amp1-value').textContent = waveParams.amplitude1;
    document.getElementById('freq2').value = waveParams.frequency2;
    document.getElementById('freq2-value').textContent = waveParams.frequency2.toFixed(1);
    document.getElementById('amp2').value = waveParams.amplitude2;
    document.getElementById('amp2-value').textContent = waveParams.amplitude2;
}

function setupMusicControls() {
    document.getElementById('octave-btn').addEventListener('click', function() {
        waveParams.frequency1 = 2;
        waveParams.frequency2 = 4;
        updateSliders();
    });

    document.getElementById('fifth-btn').addEventListener('click', function() {
        waveParams.frequency1 = 2;
        waveParams.frequency2 = 3;
        updateSliders();
    });

    document.getElementById('fourth-btn').addEventListener('click', function() {
        waveParams.frequency1 = 3;
        waveParams.frequency2 = 4;
        updateSliders();
    });
}

function setupQuizControls() {
    document.querySelector('.close-quiz').addEventListener('click', function() {
        hideQuiz();
    });
}

function showQuiz() {
    document.getElementById('quiz-section').classList.add('active');
    currentQuiz = 0;
    selectedAnswer = null;
    showResult = false;
    displayCurrentQuestion();
}

function hideQuiz() {
    document.getElementById('quiz-section').classList.remove('active');
    showSection('home');
}

function displayCurrentQuestion() {
    const question = quizQuestions[currentQuiz];
    
    document.getElementById('question-number').textContent = currentQuiz + 1;
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('current-question').textContent = currentQuiz + 1;
    document.getElementById('total-questions').textContent = quizQuestions.length;
    
    // Mettre à jour la barre de progression
    const progressPercent = ((currentQuiz + 1) / quizQuestions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progressPercent}%`;
    
    // Générer les options
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'option';
        button.textContent = option;
        button.addEventListener('click', () => handleQuizAnswer(index));
        optionsContainer.appendChild(button);
    });
    
    // Cacher le résultat
    document.getElementById('quiz-result').style.display = 'none';
}

function handleQuizAnswer(answerIndex) {
    // Empêcher les clics multiples pendant le traitement de la réponse
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.style.pointerEvents = 'none';
    });

    const correctIndex = quizQuestions[currentQuiz].correct;
    const resultDiv = document.getElementById('quiz-result');
    resultDiv.style.display = 'block'; // Afficher le conteneur de résultat

    if (answerIndex === correctIndex) {
        resultDiv.innerHTML = '<div class="success">✅ Excellent ! +10 points</div>';
        score += 10;
        updateScoreDisplay();
        
        // Appliquer le style correct à l'option choisie
        options[answerIndex].classList.add('correct');

        setTimeout(() => {
            if (currentQuiz < quizQuestions.length - 1) {
                currentQuiz++;
                displayCurrentQuestion(); // Afficher la question suivante
            } else {
                // Toutes les questions sont répondues
                level++;
                updateScoreDisplay();
                resultDiv.innerHTML = '<div class="success">🎉 Quiz terminé ! Niveau suivant !</div>';
                setTimeout(() => {
                    hideQuiz(); // Cacher le quiz après un court délai
                }, 2000);
            }
        }, 2000); // Délai avant de passer à la question suivante ou de cacher le quiz
    } else {
        resultDiv.innerHTML = '<div class="error">❌ Essayez encore !</div>';
        // Appliquer le style incorrect à l'option choisie
        options[answerIndex].classList.add('incorrect');
        // Appliquer le style correct à la bonne réponse pour l'indiquer
        options[correctIndex].classList.add('correct');
        
        setTimeout(() => {
            // Réinitialiser les styles et réactiver les boutons pour une nouvelle tentative
            options.forEach(option => {
                option.style.pointerEvents = 'auto'; // Réactiver les clics
                option.classList.remove('correct', 'incorrect'); // Retirer les styles
            });
            resultDiv.style.display = 'none'; // Cacher le résultat
        }, 2000); // Délai avant de permettre une nouvelle tentative
    }
}

function updateScoreDisplay() {
    document.getElementById('score-display').textContent = score;
    document.getElementById('level-display').textContent = level;
    document.getElementById('floating-score').textContent = score;
    document.getElementById('floating-level').textContent = level;
}

function startWaveAnimation() {
    const canvas = document.getElementById('wave-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        const centerY = height / 2;
        
        // Onde 1 (rouge)
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const y1 = centerY + waveParams.amplitude1 * Math.sin(
                (x * waveParams.frequency1 * 2 * Math.PI / width) + 
                (time * 0.02) + 
                waveParams.phase1
            );
            if (x === 0) ctx.moveTo(x, y1);
            else ctx.lineTo(x, y1);
        }
        ctx.stroke();

        // Onde 2 (bleue)
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const y2 = centerY + waveParams.amplitude2 * Math.sin(
                (x * waveParams.frequency2 * 2 * Math.PI / width) + 
                (time * 0.02) + 
                waveParams.phase2
            );
            if (x === 0) ctx.moveTo(x, y2);
            else ctx.lineTo(x, y2);
        }
        ctx.stroke();

        // Onde résultante (jaune)
        ctx.strokeStyle = '#ffd93d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const y1 = waveParams.amplitude1 * Math.sin(
                (x * waveParams.frequency1 * 2 * Math.PI / width) + 
                (time * 0.02) + 
                waveParams.phase1
            );
            const y2 = waveParams.amplitude2 * Math.sin(
                (x * waveParams.frequency2 * 2 * Math.PI / width) + 
                (time * 0.02) + 
                waveParams.phase2
            );
            const y = centerY + y1 + y2;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        time++;
        
        if (currentSection === 'lab') {
            animationId = requestAnimationFrame(animate);
        }
    }
    
    if (currentSection === 'lab') {
        animate();
    }
}

function stopWaveAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}
