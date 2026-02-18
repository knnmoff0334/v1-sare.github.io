// ===== ASAL SAYI USTASI - OYUN MOTORU =====

// Oyun durumu
let state = {
    difficulty: 'easy',
    questions: [],
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    lives: 3,
    totalQuestions: 15,
    answered: false,
    stats: loadStats()
};

// ===== İSTATİSTİK YÖNETİMİ =====
function loadStats() {
    try {
        const saved = localStorage.getItem('asalUstasiStats');
        return saved ? JSON.parse(saved) : { bestScore: 0, gamesPlayed: 0 };
    } catch { return { bestScore: 0, gamesPlayed: 0 }; }
}

function saveStats() {
    try {
        localStorage.setItem('asalUstasiStats', JSON.stringify(state.stats));
    } catch {}
}

function updateHomeStats() {
    const el = document.getElementById('home-stats');
    if (state.stats.gamesPlayed > 0) {
        el.style.display = 'flex';
        document.getElementById('home-best').textContent = state.stats.bestScore;
        document.getElementById('home-played').textContent = state.stats.gamesPlayed;
    }
}

// ===== ZORLUK SEÇİMİ =====
function selectDifficulty(diff) {
    state.difficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.diff === diff);
    });
}

// ===== SORU FİLTRELEME =====
function filterQuestions(diff) {
    // Tüm soruları karıştır ve zorluk seviyesine göre filtrele
    const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);

    if (diff === 'easy') {
        // Kolay: İlk 160 soru (temel sorular)
        return shuffled.slice(0, Math.min(shuffled.length, 160));
    } else if (diff === 'medium') {
        // Orta: Tüm sorular
        return shuffled;
    } else {
        // Zor: Tüm sorular, ama daha fazla soru
        return shuffled;
    }
}

// ===== EKRAN GEÇİŞLERİ =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    screen.classList.add('active');
    // Animasyon tetikle
    screen.style.animation = 'none';
    screen.offsetHeight; // reflow
    screen.style.animation = 'fadeIn 0.4s ease';
}

// ===== OYUNU BAŞLAT =====
function startGame() {
    const pool = filterQuestions(state.difficulty);
    const totalQ = state.difficulty === 'easy' ? 15 : state.difficulty === 'medium' ? 18 : 20;

    state.questions = pool.slice(0, totalQ);
    state.currentIndex = 0;
    state.score = 0;
    state.correctCount = 0;
    state.wrongCount = 0;
    state.lives = 3;
    state.totalQuestions = totalQ;
    state.answered = false;

    showScreen('screen-game');
    updateHeader();
    showQuestion();
}

// ===== HEADER GÜNCELLE =====
function updateHeader() {
    document.getElementById('score').textContent = state.score;
    document.getElementById('progress-text').textContent =
        `${state.currentIndex + 1}/${state.totalQuestions}`;
    const pct = ((state.currentIndex) / state.totalQuestions) * 100;
    document.getElementById('progress-fill').style.width = pct + '%';

    // Canlar
    const livesEl = document.getElementById('lives-display');
    let hearts = '';
    for (let i = 0; i < 3; i++) {
        if (i < state.lives) {
            hearts += '<span class="heart">❤️</span>';
        } else {
            hearts += '<span class="heart lost">🖤</span>';
        }
    }
    livesEl.innerHTML = hearts;
}

// ===== SORUYU GÖSTER =====
function showQuestion() {
    if (state.currentIndex >= state.totalQuestions || state.lives <= 0) {
        endGame();
        return;
    }

    state.answered = false;
    const q = state.questions[state.currentIndex];

    document.getElementById('question-number').textContent =
        `Soru ${state.currentIndex + 1} / ${state.totalQuestions}`;
    document.getElementById('question-text').textContent = q.q;

    // Şıkları oluştur
    const letters = ['A', 'B', 'C', 'D'];
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';

    q.o.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="opt-letter">${letters[i]}</span><span>${opt}</span>`;
        btn.onclick = () => selectAnswer(i);
        grid.appendChild(btn);
    });

    // İpucu ve sonraki butonu gizle
    document.getElementById('hint-box').style.display = 'none';
    document.getElementById('btn-next').style.display = 'none';

    // Soru kartı animasyonu
    const card = document.getElementById('question-card');
    card.style.animation = 'none';
    card.offsetHeight;
    card.style.animation = 'popIn 0.4s ease';

    updateHeader();
}

// ===== CEVAP SEÇ =====
function selectAnswer(index) {
    if (state.answered) return;
    state.answered = true;

    const q = state.questions[state.currentIndex];
    const buttons = document.querySelectorAll('.option-btn');
    const isCorrect = index === q.a;

    // Tüm butonları devre dışı bırak
    buttons.forEach(btn => btn.classList.add('disabled'));

    // Doğru cevabı göster
    buttons[q.a].classList.add('correct');

    if (isCorrect) {
        // DOĞRU CEVAP
        state.score++;
        state.correctCount++;
        playCorrectEffect();
    } else {
        // YANLIŞ CEVAP
        state.wrongCount++;
        state.lives--;
        buttons[index].classList.add('wrong');

        // Can kaybı animasyonu
        const hearts = document.querySelectorAll('.heart');
        if (hearts[state.lives]) {
            hearts[state.lives].classList.add('breaking');
            setTimeout(() => {
                hearts[state.lives].classList.remove('breaking');
                hearts[state.lives].classList.add('lost');
                hearts[state.lives].textContent = '🖤';
            }, 600);
        }

        // İpucu göster
        showHint(q.h);
    }

    // Skoru güncelle
    document.getElementById('score').textContent = state.score;

    // Sonraki butonunu göster
    setTimeout(() => {
        const nextBtn = document.getElementById('btn-next');
        if (state.lives <= 0) {
            nextBtn.textContent = 'Sonuçları Gör 🏁';
        } else if (state.currentIndex >= state.totalQuestions - 1) {
            nextBtn.textContent = 'Sonuçları Gör 🏁';
        } else {
            nextBtn.textContent = 'Sonraki Soru ➡️';
        }
        nextBtn.style.display = 'block';
    }, 400);
}

// ===== İPUCU GÖSTER =====
function showHint(text) {
    const hintBox = document.getElementById('hint-box');
    document.getElementById('hint-text').textContent = text;
    hintBox.style.display = 'flex';
    hintBox.style.animation = 'none';
    hintBox.offsetHeight;
    hintBox.style.animation = 'slideUp 0.4s ease';
}

// ===== DOĞRU CEVAP EFEKTİ =====
function playCorrectEffect() {
    // Küçük konfeti efekti
    launchMiniConfetti();
}

// ===== SONRAKİ SORU =====
function nextQuestion() {
    state.currentIndex++;
    showQuestion();
}

// ===== OYUN BİTİŞİ =====
function endGame() {
    // İstatistikleri güncelle
    state.stats.gamesPlayed++;
    if (state.score > state.stats.bestScore) {
        state.stats.bestScore = state.score;
    }
    saveStats();

    showScreen('screen-result');

    const pct = Math.round((state.correctCount / state.totalQuestions) * 100);

    // Rozet bul
    let badge = BADGES[0];
    for (const b of BADGES) {
        if (state.score >= b.min) badge = b;
    }

    // Sonuç ekranını doldur
    document.getElementById('result-emoji').textContent = badge.emoji;
    document.getElementById('result-title').textContent = badge.title;
    document.getElementById('result-message').textContent = badge.msg;
    document.getElementById('rs-score').textContent = state.score;
    document.getElementById('rs-correct').textContent = state.correctCount;
    document.getElementById('rs-wrong').textContent = state.wrongCount;
    document.getElementById('rs-percent').textContent = pct + '%';

    // Rozet
    const badgeEl = document.getElementById('result-badge');
    if (state.score >= state.stats.bestScore && state.stats.gamesPlayed > 1) {
        badgeEl.innerHTML = `🎉 YENİ REKOR! En yüksek puanın: ${state.score}`;
    } else {
        badgeEl.innerHTML = `${badge.emoji} Rozet: ${badge.title}`;
    }

    // Eğlenceli bilgi
    const fact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
    document.getElementById('result-fact').innerHTML = `<strong>Biliyor muydun?</strong><br>${fact}`;

    // Yüksek puan ise konfeti
    if (pct >= 60) {
        launchConfetti();
    }
}

// ===== ANA SAYFAYA DÖN =====
function goHome() {
    updateHomeStats();
    showScreen('screen-home');
}

// ===== KONFETİ SİSTEMİ =====
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let confettiPieces = [];
let confettiAnimId = null;

function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfetti);
resizeConfetti();

function createConfettiPiece(x, y) {
    const colors = ['#6C5CE7', '#00CEC9', '#FD79A8', '#FDCB6E', '#00B894', '#E17055', '#A29BFE'];
    return {
        x: x || Math.random() * confettiCanvas.width,
        y: y || -10,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
    };
}

function animateConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiPieces = confettiPieces.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.rotation += p.rotSpeed;
        p.opacity -= 0.003;

        if (p.opacity <= 0 || p.y > confettiCanvas.height + 20) return false;

        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rotation * Math.PI) / 180);
        confettiCtx.globalAlpha = p.opacity;
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confettiCtx.restore();

        return true;
    });

    if (confettiPieces.length > 0) {
        confettiAnimId = requestAnimationFrame(animateConfetti);
    }
}

function launchConfetti() {
    confettiPieces = [];
    for (let i = 0; i < 150; i++) {
        setTimeout(() => {
            confettiPieces.push(createConfettiPiece(
                confettiCanvas.width / 2 + (Math.random() - 0.5) * 300,
                confettiCanvas.height * 0.3
            ));
        }, i * 15);
    }
    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
    animateConfetti();
}

function launchMiniConfetti() {
    for (let i = 0; i < 20; i++) {
        confettiPieces.push(createConfettiPiece(
            confettiCanvas.width / 2 + (Math.random() - 0.5) * 200,
            confettiCanvas.height * 0.4
        ));
    }
    if (!confettiAnimId || confettiPieces.length <= 20) {
        if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
        animateConfetti();
    }
}

// ===== BAŞLANGIÇ =====
updateHomeStats();
