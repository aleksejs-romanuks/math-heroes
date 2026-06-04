/*
 * Math Heroes – a kid-friendly math game.
 * Three modes:
 *   - Addition / Subtraction: pick the correct answer out of 3 options.
 *   - Compare: pick the correct sign (<, =, >).
 * Difficulty controls the biggest number used (up to 10 / 20 / 100).
 */

// ---------- Page elements ----------
const splashPage = document.getElementById('splash-page');
const countdownPage = document.getElementById('countdown-page');
const gamePage = document.getElementById('game-page');
const scorePage = document.getElementById('score-page');

// Splash
const startForm = document.getElementById('start-form');
const modeOptions = document.querySelectorAll('.mode-option');
const levelOptions = document.querySelectorAll('.level-option');
const amountOptions = document.querySelectorAll('.amount-option');
const bestLineValue = document.querySelector('.best-line-value');

// Header
const homeBtn = document.getElementById('home-btn');

// Countdown
const countdown = document.querySelector('.countdown');

// Game
const itemContainer = document.getElementById('item-container');
const timerDisplay = document.getElementById('timer-display');
const rightScoreEl = document.getElementById('right-score');
const wrongScoreEl = document.getElementById('wrong-score');
const optionsFooter = document.getElementById('options-footer');
const compareFooter = document.getElementById('compare-footer');
const optionButtons = document.querySelectorAll('.option-btn');
const signButtons = document.querySelectorAll('.sign-btn');

// Score
const starsEl = document.getElementById('stars');
const scoreMessageEl = document.getElementById('score-message');
const finalTimeEl = document.querySelector('.final-time');
const correctCountEl = document.querySelector('.correct-count');
const baseTimeEl = document.querySelector('.base-time');
const bestTimeEl = document.querySelector('.best-time');

// ---------- Game state ----------
let gameMode = 'addition';   // 'addition' | 'subtraction' | 'compare'
let maxNumber = 10;          // difficulty: 10 | 20 | 100
let questionAmount = 5;
let equationsArray = [];
let playerGuessArray = [];
let currentEquationIndex = 0;
let valueY = 0;

let rightCount = 0;
let wrongCount = 0;

// Timer
let timer;
let timePlayed = 0;
let penaltyTime = 0;
let finalTime = 0;

let bestScores = {};

// ---------- Helpers ----------
function getRandomInt(max) {
    return Math.floor(Math.random() * (max + 1));
}

function bestKey() {
    return `${gameMode}-${maxNumber}-${questionAmount}`;
}

// ---------- Best scores (local storage) ----------
function getSavedBestScores() {
    try {
        bestScores = JSON.parse(localStorage.getItem('mathHeroesBest')) || {};
    } catch (e) {
        bestScores = {};
    }
    refreshBestLine();
}

function refreshBestLine() {
    const best = bestScores[bestKey()];
    bestLineValue.textContent = best ? `${best}s` : '–';
}

function updateBestScore() {
    const key = bestKey();
    const previous = bestScores[key];
    const display = finalTime.toFixed(1);
    if (previous === undefined || finalTime < Number(previous)) {
        bestScores[key] = display;
        localStorage.setItem('mathHeroesBest', JSON.stringify(bestScores));
    }
}

// ---------- Sound ----------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(freq = 600, type = 'sine', duration = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    osc.start();
    osc.stop(now + duration);
}

function playFeedbackSound(isCorrect) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const now = audioCtx.currentTime;
    if (isCorrect) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start();
        osc.stop(now + 0.3);
    } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start();
        osc.stop(now + 0.2);
    }
    osc.connect(gain);
    gain.connect(audioCtx.destination);
}

// ---------- Equation generation ----------
function compareSign(a, b) {
    if (a > b) return '>';
    if (a < b) return '<';
    return '=';
}

// Build three answer choices (numbers as strings) with exactly one correct.
// Distractors stay within [0, cap] so no option exceeds the difficulty.
function makeOptions(correct, cap) {
    const options = new Set([correct]);
    const offsets = [-3, -2, -1, 1, 2, 3];
    while (options.size < 3) {
        const offset = offsets[getRandomInt(offsets.length - 1)];
        const candidate = correct + offset;
        if (candidate >= 0 && candidate <= cap) options.add(candidate);
    }
    return shuffle([...options]).map(String);
}

function createEquations() {
    equationsArray = [];
    playerGuessArray = [];
    currentEquationIndex = 0;

    if (gameMode === 'compare') {
        for (let i = 0; i < questionAmount; i++) {
            let a = getRandomInt(maxNumber);
            let b = getRandomInt(maxNumber);
            // Make equal cases appear more often so '=' is used.
            if (getRandomInt(3) === 0) b = a;
            equationsArray.push({
                parts: [`${a}`, '?', `${b}`],
                evaluated: compareSign(a, b),
            });
        }
        return;
    }

    // Addition / Subtraction: show "a ? b = ?" and pick the correct result.
    // Difficulty caps the RESULT (not the operands), so e.g. "Up to 10"
    // allows 8 + 2 but never 8 + 3.
    for (let i = 0; i < questionAmount; i++) {
        let a, b, symbol, result;

        if (gameMode === 'addition') {
            symbol = '+';
            a = getRandomInt(maxNumber);
            b = getRandomInt(maxNumber - a); // keep a + b within maxNumber
            result = a + b;
        } else {
            symbol = '−';
            a = getRandomInt(maxNumber);
            b = getRandomInt(a); // keep b <= a so the result stays within maxNumber
            result = a - b;
        }

        equationsArray.push({
            parts: [`${a}`, symbol, `${b}`, '=', '?'],
            evaluated: `${result}`,
            options: makeOptions(result, maxNumber),
        });
    }
}

// ---------- Render equations ----------
function equationsToDOM() {
    const scrollSurface = document.querySelector('.scroll-surface');
    equationsArray.forEach((equation, index) => {
        const item = document.createElement('div');
        item.classList.add('item');
        if (index === 0) item.classList.add('item-active');

        const grid = document.createElement('div');
        grid.classList.add('equation-grid');

        equation.parts.forEach(part => {
            const span = document.createElement('h1');
            span.textContent = part;
            if (part === '?') span.classList.add('mystery');
            grid.appendChild(span);
        });

        item.appendChild(grid);
        scrollSurface.appendChild(item);
    });
}

function populateGamePage() {
    itemContainer.textContent = '';

    const scrollSurface = document.createElement('div');
    scrollSurface.classList.add('scroll-surface');
    itemContainer.appendChild(scrollSurface);

    const topSpacer = document.createElement('div');
    topSpacer.classList.add('height-240');
    scrollSurface.appendChild(topSpacer);

    createEquations();
    equationsToDOM();

    const bottomSpacer = document.createElement('div');
    bottomSpacer.classList.add('height-500');
    scrollSurface.appendChild(bottomSpacer);
}

// Update the answer buttons for the current question (add/sub modes).
function renderOptions() {
    if (gameMode === 'compare') return;
    const equation = equationsArray[currentEquationIndex];
    if (!equation) return;
    optionButtons.forEach((btn, i) => {
        btn.textContent = equation.options[i];
        btn.dataset.value = equation.options[i];
    });
}

// ---------- Timer ----------
function startTimer() {
    clearInterval(timer);
    timePlayed = 0;
    penaltyTime = 0;
    finalTime = 0;
    timerDisplay.textContent = '⏱️ 0.0s';
    timer = setInterval(addTime, 100);
}

function addTime() {
    timePlayed += 0.1;
    timerDisplay.textContent = `⏱️ ${timePlayed.toFixed(1)}s`;
    checkFinished();
}

function checkFinished() {
    if (playerGuessArray.length === questionAmount) {
        clearInterval(timer);
        equationsArray.forEach((equation, index) => {
            if (equation.evaluated !== playerGuessArray[index]) {
                penaltyTime += 0.5;
            }
        });
        finalTime = timePlayed + penaltyTime;
        scoresToDOM();
    }
}

// ---------- Answer handling ----------
function advance(playerAnswer) {
    const currentEquation = equationsArray[currentEquationIndex];
    if (!currentEquation) return;

    const isCorrect = currentEquation.evaluated === playerAnswer;
    playFeedbackSound(isCorrect);

    const itemElements = document.querySelectorAll('.item');
    const currentItem = itemElements[currentEquationIndex];

    if (currentItem) {
        currentItem.classList.add(isCorrect ? 'answered-right' : 'answered-wrong');
        // Reveal the correct value/sign in place of the '?'.
        const mystery = currentItem.querySelector('.mystery');
        if (mystery) {
            mystery.textContent = currentEquation.evaluated;
            mystery.classList.remove('mystery');
        }
    }

    if (isCorrect) {
        rightCount++;
        rightScoreEl.textContent = `⭐ ${rightCount}`;
    } else {
        wrongCount++;
        wrongScoreEl.textContent = `💧 ${wrongCount}`;
        timerDisplay.classList.remove('penalty-flash');
        void timerDisplay.offsetWidth;
        timerDisplay.classList.add('penalty-flash');
    }

    // Scroll to next equation.
    valueY += 80;
    const scrollSurface = document.querySelector('.scroll-surface');
    if (scrollSurface) scrollSurface.style.transform = `translateY(-${valueY}px)`;

    if (currentItem) currentItem.classList.remove('item-active');
    currentEquationIndex++;
    if (itemElements[currentEquationIndex]) {
        itemElements[currentEquationIndex].classList.add('item-active');
    }

    playerGuessArray.push(playerAnswer);
    renderOptions();
    checkFinished();
}

function flashButton(btn, isCorrect) {
    if (!btn) return;
    btn.classList.remove('btn-success-flash', 'btn-error-flash');
    void btn.offsetWidth;
    btn.classList.add(isCorrect ? 'btn-success-flash' : 'btn-error-flash');
    setTimeout(() => btn.classList.remove('btn-success-flash', 'btn-error-flash'), 400);
}

function selectOption(value, button) {
    const current = equationsArray[currentEquationIndex];
    if (current) flashButton(button, current.evaluated === value);
    advance(value);
}

function selectSign(sign, button) {
    const current = equationsArray[currentEquationIndex];
    if (current) flashButton(button, current.evaluated === sign);
    advance(sign);
}

optionButtons.forEach(btn => {
    btn.addEventListener('click', () => selectOption(btn.dataset.value, btn));
});
signButtons.forEach(btn => {
    btn.addEventListener('click', () => selectSign(btn.dataset.sign, btn));
});

// ---------- Score page ----------
function scoresToDOM() {
    updateBestScore();

    const total = questionAmount;
    const ratio = total > 0 ? rightCount / total : 0;
    let stars = '⭐';
    let message = 'Good try!';
    if (ratio === 1) { stars = '⭐⭐⭐'; message = 'Perfect! You\'re a Math Hero! 🦸'; }
    else if (ratio >= 0.7) { stars = '⭐⭐'; message = 'Awesome work!'; }
    else if (ratio >= 0.4) { stars = '⭐'; message = 'Nice effort!'; }
    else { stars = '✨'; message = 'Keep practicing, you\'ve got this!'; }

    starsEl.textContent = stars;
    scoreMessageEl.textContent = message;
    finalTimeEl.textContent = `${finalTime.toFixed(1)}s`;
    correctCountEl.textContent = `${rightCount}/${total}`;
    baseTimeEl.textContent = `${timePlayed.toFixed(1)}s`;
    bestTimeEl.textContent = `${bestScores[bestKey()]}s`;

    itemContainer.scrollTo({ top: 0, behavior: 'instant' });
    gamePage.hidden = true;
    scorePage.hidden = false;
}

function playAgain() {
    scorePage.hidden = true;
    splashPage.hidden = false;
    homeBtn.hidden = true;
    equationsArray = [];
    playerGuessArray = [];
    valueY = 0;
    refreshBestLine();
}

function goHome() {
    clearInterval(timer);
    countdownPage.hidden = true;
    gamePage.hidden = true;
    scorePage.hidden = true;
    splashPage.hidden = false;
    homeBtn.hidden = true;
    equationsArray = [];
    playerGuessArray = [];
    valueY = 0;
    refreshBestLine();
}

// ---------- Countdown ----------
function countdownStart() {
    let count = 3;
    countdown.textContent = count;
    playBeep(600, 'sine', 0.1);
    pop(countdown);

    const ticker = setInterval(() => {
        count--;
        if (count === 0) {
            countdown.textContent = 'GO!';
            playBeep(1200, 'square', 0.8);
            pop(countdown);
        } else if (count === -1) {
            showGamePage();
            clearInterval(ticker);
        } else {
            countdown.textContent = count;
            playBeep(600, 'sine', 0.1);
            pop(countdown);
        }
    }, 1000);
}

function pop(el) {
    el.classList.remove('pop-in');
    void el.offsetWidth;
    el.classList.add('pop-in');
}

function showGamePage() {
    gamePage.hidden = false;
    countdownPage.hidden = true;

    // Show the right controls for the chosen mode.
    if (gameMode === 'compare') {
        optionsFooter.hidden = true;
        compareFooter.hidden = false;
    } else {
        optionsFooter.hidden = false;
        compareFooter.hidden = true;
        renderOptions();
    }

    valueY = 0;
    const scrollSurface = document.querySelector('.scroll-surface');
    if (scrollSurface) scrollSurface.style.transform = 'translateY(0px)';

    rightCount = 0;
    wrongCount = 0;
    rightScoreEl.textContent = '⭐ 0';
    wrongScoreEl.textContent = '💧 0';

    // Timer runs from the very first second.
    startTimer();
}

function showCountdown() {
    countdownPage.hidden = false;
    splashPage.hidden = true;
    homeBtn.hidden = false;
    populateGamePage();
    countdownStart();
}

// ---------- Splash interactions ----------
modeOptions.forEach(option => {
    option.addEventListener('click', () => {
        modeOptions.forEach(o => o.classList.remove('selected-mode'));
        option.classList.add('selected-mode');
        gameMode = option.dataset.mode;
        refreshBestLine();
    });
});

levelOptions.forEach(option => {
    option.addEventListener('click', () => {
        levelOptions.forEach(o => o.classList.remove('selected-level'));
        option.classList.add('selected-level');
        maxNumber = Number(option.dataset.level);
        refreshBestLine();
    });
});

amountOptions.forEach(option => {
    option.addEventListener('click', () => {
        amountOptions.forEach(o => o.classList.remove('selected-amount'));
        option.classList.add('selected-amount');
        questionAmount = Number(option.dataset.amount);
        refreshBestLine();
    });
});

startForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    showCountdown();
});

homeBtn.addEventListener('click', goHome);
document.getElementById('play-again-btn').addEventListener('click', playAgain);
document.getElementById('home-again-btn').addEventListener('click', goHome);

// ---------- Init ----------
getSavedBestScores();
