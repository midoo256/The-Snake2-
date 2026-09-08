
/* =================================
   CANVAS
   ================================= */

const canvas =
    document.getElementById("game");

const ctx =
    canvas.getContext(
        "2d",
        {
            alpha: false
        }
    );

ctx.imageSmoothingEnabled = false;


/* =================================
   UI
   ================================= */

const scoreElement =
    document.getElementById("score");

const highScoreElement =
    document.getElementById("highScore");

const gameOver =
    document.getElementById("gameOver");

const finalScore =
    document.getElementById("finalScore");

const feedbackText =
    document.getElementById("feedbackText");

const lifeFeedback =
    document.getElementById("lifeFeedback");

const deathHeartOverlay =
    document.getElementById(
        "deathHeartOverlay"
    );


const heartElements = [

    document.getElementById("heart1"),

    document.getElementById("heart2"),

    document.getElementById("heart3")

];


/* =================================
   GAME SETTINGS
   ================================= */

const GRID = 32;

let tileSize;

let backgroundCache = null;

let backgroundCacheSize = 0;

let snake;

let food;

let direction;

let nextDirection;

let score = 0;

let highScore =
    Number(
        localStorage.getItem(
            "theSnakeHighScore"
        )
    ) || 0;

let gameRunning = false;

let gameSpeed = 115;

let lastTime = 0;

let lastRenderTime = 0;

const renderInterval =
    1000 / 30;

let animationFrameId = null;

let audioContext = null;

let audioMaster = null;

let feedbackTimer = null;

let gameOverTimeout = null;

let frameScale = 1;

/* =================================
   MENU & DIFFICULTY SYSTEM
   ================================= */

const mainMenu =
    document.getElementById("mainMenu");

const startGameBtn =
    document.getElementById("startGameBtn");

const difficultyMenu =
    document.getElementById("difficultyMenu");

const navbar =
    document.getElementById("navbar");

const gameContainer =
    document.getElementById("gameContainer");

/*
   Difficulty settings

   gameSpeed = milliseconds between moves
   LOWER = FASTER

   obstacleStart:
   score at which obstacles begin

   obstacleEvery:
   how often a new obstacle appears

   maxObstacles:
   maximum number of obstacles
*/

const difficultySettings = {

    easy: {

        name: "EASY",

        startSpeed: 150,

        minSpeed: 85,

        speedStep: 2,

        obstacleStart: 10,

        obstacleEvery: 7,

        maxObstacles: 7,

        bombStart: 18,

        bombEvery: 10,

        foodDifficulty: 0

    },

    medium: {

        name: "MEDIUM",

        startSpeed: 98,

        minSpeed: 55,

        speedStep: 3,

        obstacleStart: 5,

        obstacleEvery: 4,

        maxObstacles: 14,

        bombStart: 10,

        bombEvery: 8,

        foodDifficulty: 1

    },

    hard: {

        name: "HARD",

        startSpeed: 88,

        minSpeed: 32,

        speedStep: 4,

        obstacleStart: 3,

        obstacleEvery: 3,

        maxObstacles: 21,

        bombStart: 10,

        bombEvery: 4,

        foodDifficulty: 2

    },

    extreme: {

        name: "EXTREME",

        startSpeed: 60,

        minSpeed: 20,

        speedStep: 5,

        obstacleStart: 2,

        obstacleEvery: 2,

        maxObstacles: 27,

        bombStart: 5,

        bombEvery: 2,

        foodDifficulty: 4

    }

};

let selectedDifficulty =
    "medium";

let currentDifficulty =
    difficultySettings.medium;


/* =================================
   MENU MUSIC
   ================================= */

let menuMusicTimer = null;

let menuMusicStep = 0;

let menuMusicPlaying = false;


/*
   Original little synth melody.
   No external audio file is required.
*/

const menuMelody = [

    261.63, // C4
    329.63, // E4
    392.00, // G4
    329.63, // E4

    293.66, // D4
    349.23, // F4
    440.00, // A4
    349.23, // F4

    261.63, // C4
    329.63, // E4
    392.00, // G4
    523.25, // C5

    440.00, // A4
    392.00, // G4
    329.63, // E4
    293.66  // D4

];


function playMenuNote() {

    if (
        !menuMusicPlaying
    ) {
        return;
    }

    if (
        !audioContext ||
        !audioMaster
    ) {
        return;
    }

    const frequency =
        menuMelody[
            menuMusicStep %
            menuMelody.length
        ];

    menuMusicStep++;

    tone(
        frequency,
        0.32,
        "sine",
        0.025
    );

    /*
       Soft second note for a richer sound
    */

    setTimeout(
        () => {

            if (
                !menuMusicPlaying
            ) {
                return;
            }

            tone(
                frequency * 2,
                0.18,
                "triangle",
                0.012
            );

        },
        90
    );
}


function startMenuMusic() {

    initAudio();

    if (
        !audioContext
    ) {
        return;
    }

    stopMenuMusic();

    menuMusicPlaying = true;

    menuMusicStep = 0;

    playMenuNote();

    menuMusicTimer =
        setInterval(
            playMenuNote,
            420
        );
}


function stopMenuMusic() {

    menuMusicPlaying = false;

    if (
        menuMusicTimer
    ) {

        clearInterval(
            menuMusicTimer
        );

        menuMusicTimer = null;
    }
}


/* =================================
   SHOW MAIN MENU
   ================================= */

function showMainMenu() {

    /* Stop everything */

    gameRunning = false;

    stopMenuMusic();


    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }


    if (gameOverTimeout) {
        clearTimeout(gameOverTimeout);
        gameOverTimeout = null;
    }

    if (feedbackTimer) {
        clearTimeout(feedbackTimer);
        feedbackTimer = null;
    }


    /* Reset visual/game effects */

    deathAnimation = false;
    specialBombExplosion = false;

    specialBomb = null;

    specialBombParticles = [];

    particles = [];
    foodParticles = [];
    obstacleParticles = [];
    heartParticles = [];

    redFlash = 0;
    obstacleFlash = 0;
    screenShake = 0;

    gameOverReady = false;


    /* Hide game */

    if (gameOver) {
        gameOver.style.display = "none";
    }

    if (navbar) {
        navbar.style.display = "none";
    }

    if (gameContainer) {
        gameContainer.style.display = "none";
    }


    /* Reset MENU completely */

    if (difficultyMenu) {
        difficultyMenu.style.display = "none";
    }

    if (startGameBtn) {
        startGameBtn.style.display = "block";
    }

    if (mainMenu) {
        mainMenu.style.display = "flex";
    }


    /* Start menu music again */

    startMenuMusic();
}


/* =================================
   SHOW DIFFICULTY MENU
   ================================= */
function showDifficultyMenu() {
    initAudio();

    if (startGameBtn) {
        startGameBtn.style.display = "none";
    }

    if (difficultyMenu) {
        difficultyMenu.style.display = "flex";
    }

    startMenuMusic();
}

/* =================================
   HIDE DIFFICULTY MENU
   ================================= */

function hideDifficultyMenu() {

    if (difficultyMenu) {
        difficultyMenu.style.display = "none";
    }

    if (startGameBtn) {
        startGameBtn.style.display = "block";
    }

    startMenuMusic();
}


/* =================================
   START SELECTED DIFFICULTY
   ================================= */

function startSelectedDifficulty(difficulty) {

    if (!difficultySettings[difficulty]) {
        return;
    }

    selectedDifficulty = difficulty;

    currentDifficulty =
        difficultySettings[difficulty];

    stopMenuMusic();

    if (mainMenu) {
        mainMenu.style.display = "none";
    }

    if (navbar) {
        navbar.style.display = "flex";
    }

    if (gameContainer) {
        gameContainer.style.display = "block";
    }

    startGame();
}
/* =================================
   HEART SYSTEM
   ================================= */

const MAX_HEARTS = 3;

let hearts = MAX_HEARTS;

let heartItem = null;

let heartParticles = [];

let heartAnimationTime = 0;

let heartSpawnScore = 5;

let heartSpawnCooldown = 0;


/* =================================
   SPECIAL BOMB SYSTEM
   ================================= */

let specialBomb = null;

let specialBombSpawned = false;

let specialBombParticles = [];

let specialBombExplosion = false;

let specialBombExplosionTimer = 0;

let specialBombExplosionX = 0;

let specialBombExplosionY = 0;


/* =================================
   AUDIO
   ================================= */

function initAudio() {

    if (!audioContext) {

        const AudioCtx =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioCtx)
            return;

        audioContext =
            new AudioCtx();

        audioMaster =
            audioContext.createGain();

        audioMaster.gain.value =
            0.85;

        audioMaster.connect(
            audioContext.destination
        );
    }

    if (
        audioContext &&
        audioContext.state ===
        "suspended"
    ) {

        audioContext.resume();
    }
}


function tone(
    frequency,
    duration,
    type = "square",
    volume = 0.08,
    slideTo = null
) {

    initAudio();

    if (
        !audioContext ||
        !audioMaster
    ) {
        return;
    }

    const now =
        audioContext.currentTime;

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        type;

    oscillator.frequency
        .setValueAtTime(
            frequency,
            now
        );

    if (
        slideTo !== null
    ) {

        oscillator.frequency
            .exponentialRampToValueAtTime(
                Math.max(
                    25,
                    slideTo
                ),
                now + duration
            );
    }

    gain.gain.setValueAtTime(
        0.0001,
        now
    );

    gain.gain
        .exponentialRampToValueAtTime(
            volume,
            now + 0.008
        );

    gain.gain
        .exponentialRampToValueAtTime(
            0.0001,
            now + duration
        );

    oscillator.connect(gain);

    gain.connect(
        audioMaster
    );

    oscillator.start(now);

    oscillator.stop(
        now + duration + 0.015
    );
}


/* =================================
   SPECIAL BOMB SOUND
   ================================= */

function playSpecialBombSound() {

    initAudio();

    if (!audioContext)
        return;

    tone(
        95,
        0.45,
        "sawtooth",
        0.24,
        28
    );

    setTimeout(
        () =>
            tone(
                52,
                0.55,
                "triangle",
                0.20,
                25
            ),
        80
    );

    setTimeout(
        () =>
            tone(
                240,
                0.16,
                "square",
                0.13,
                45
            ),
        140
    );

    setTimeout(
        () =>
            tone(
                700,
                0.08,
                "sawtooth",
                0.07,
                100
            ),
        210
    );

    setTimeout(
        () =>
            tone(
                45,
                0.65,
                "sawtooth",
                0.16,
                22
            ),
        250
    );
}


/* =================================
   HEART DEATH SOUND
   ================================= */

function playHeartBreakSound() {

    initAudio();

    if (!audioContext)
        return;

    tone(
        240,
        0.16,
        "sawtooth",
        0.13,
        105
    );

    setTimeout(
        () =>
            tone(
                145,
                0.20,
                "triangle",
                0.12,
                55
            ),
        80
    );

    setTimeout(
        () =>
            tone(
                75,
                0.34,
                "sawtooth",
                0.09,
                30
            ),
        170
    );

    setTimeout(
        () =>
            tone(
                430,
                0.06,
                "square",
                0.045,
                180
            ),
        215
    );
}


/* =================================
   HEART COLLECT SOUND
   ================================= */

function playHeartPowerupSound() {

    initAudio();

    if (!audioContext)
        return;

    tone(
        440,
        0.08,
        "sine",
        0.065,
        660
    );

    setTimeout(
        () =>
            tone(
                660,
                0.09,
                "triangle",
                0.075,
                880
            ),
        55
    );

    setTimeout(
        () =>
            tone(
                880,
                0.10,
                "triangle",
                0.085,
                1180
            ),
        115
    );

    setTimeout(
        () =>
            tone(
                1180,
                0.18,
                "sine",
                0.06,
                1550
            ),
        175
    );
}


/* =================================
   EXPLOSION SOUND
   ================================= */

function playExplosionSound() {

    initAudio();

    if (!audioContext)
        return;

    tone(
        110,
        0.28,
        "sawtooth",
        0.20,
        38
    );

    tone(
        65,
        0.18,
        "triangle",
        0.13,
        32
    );
}


/* =================================
   LOSE SOUND
   ================================= */

function playLoseSound() {

    initAudio();

    if (!audioContext)
        return;

    tone(
        420,
        0.13,
        "square",
        0.075,
        250
    );

    setTimeout(
        () =>
            tone(
                250,
                0.18,
                "square",
                0.08,
                95
            ),
        105
    );

    setTimeout(
        () =>
            tone(
                115,
                0.30,
                "sawtooth",
                0.07,
                55
            ),
        220
    );
}


/* =================================
   HEART LOSE SOUND
   ================================= */

function playHeartLoseSound() {

    initAudio();

    if (!audioContext)
        return;

    tone(
        310,
        0.11,
        "triangle",
        0.075,
        190
    );

    setTimeout(
        () =>
            tone(
                180,
                0.16,
                "triangle",
                0.065,
                90
            ),
        85
    );
}


function playHeartCollectSound() {

    playHeartPowerupSound();
}


/* =================================
   HEART SPAWN SOUND
   ================================= */

function playHeartSpawnSound() {

    initAudio();

    if (!audioContext)
        return;

    tone(
        360,
        0.10,
        "sine",
        0.045,
        520
    );

    setTimeout(
        () =>
            tone(
                520,
                0.13,
                "sine",
                0.05,
                720
            ),
        80
    );
}


/* =================================
   EAT SOUND
   ================================= */

const eatSoundPatterns = [

    [660, 880],
    [523, 784],
    [740, 988],
    [587, 880],
    [698, 1047],
    [494, 740],
    [622, 932],
    [784, 1175]

];

let eatSoundIndex = 0;


function playEatSound() {

    const pattern =
        eatSoundPatterns[
            eatSoundIndex %
            eatSoundPatterns.length
        ];

    eatSoundIndex++;

    tone(
        pattern[0],
        0.075,
        "square",
        0.055,
        pattern[1]
    );

    setTimeout(
        () =>
            tone(
                pattern[1],
                0.11,
                "triangle",
                0.05
            ),
        58
    );
}


/* =================================
   FEEDBACK
   ================================= */

const feedbackWords = [

    "AMAZING!",
    "AWESOME!",
    "NICE!",
    "YUMMY!",
    "GREAT!",
    "DELICIOUS!",
    "WOW!",
    "PERFECT!"

];

let feedbackIndex = 0;


function showFeedback() {

    const word =
        feedbackWords[
            feedbackIndex %
            feedbackWords.length
        ];

    feedbackIndex++;

    feedbackText.textContent =
        word;

    feedbackText.style.color =
        currentFruit.color;

    feedbackText.classList.remove(
        "show"
    );

    void feedbackText.offsetWidth;

    feedbackText.classList.add(
        "show"
    );

    if (feedbackTimer)
        clearTimeout(
            feedbackTimer
        );

    feedbackTimer =
        setTimeout(
            () => {

                feedbackText
                    .classList
                    .remove("show");

            },
            760
        );
}


function showLifeFeedback(
    text
) {

    lifeFeedback.textContent =
        text;

    lifeFeedback.classList
        .remove("show");

    void lifeFeedback.offsetWidth;

    lifeFeedback.classList
        .add("show");
}


/* =================================
   DEATH HEART ANIMATION
   ================================= */

function showDeathHeart() {

    deathHeartOverlay.classList
        .remove("show");

    void deathHeartOverlay.offsetWidth;

    deathHeartOverlay.classList
        .add("show");

    playHeartBreakSound();

    setTimeout(
        () => {

            deathHeartOverlay.classList
                .remove("show");

        },
        1350
    );
}


/* =================================
   UPDATE HEART UI
   ================================= */

function updateHeartUI(
    animateIndex = -1,
    animationClass = ""
) {

    heartElements.forEach(
        (element, index) => {

            element.classList.remove(
                "empty",
                "losing",
                "gaining"
            );

            if (
                index >= hearts
            ) {

                element.classList.add(
                    "empty"
                );
            }

            if (
                index === animateIndex &&
                animationClass
            ) {

                void element.offsetWidth;

                element.classList.add(
                    animationClass
                );
            }
        }
    );
}


/* =================================
   REMOVE HEART
   ================================= */

function loseHeart() {

    if (
        hearts <= 0
    ) {
        return;
    }

    const lostIndex =
        hearts - 1;

    hearts--;

    updateHeartUI(
        lostIndex,
        "losing"
    );

    playHeartLoseSound();

    showLifeFeedback(
        "−1 LIFE"
    );

    showDeathHeart();
}


/* =================================
   ADD HEART
   ================================= */

function gainHeart() {

    if (
        hearts >= MAX_HEARTS
    ) {

        showLifeFeedback(
            "FULL LIVES"
        );

        return;
    }

    const gainedIndex =
        hearts;

    hearts++;

    updateHeartUI(
        gainedIndex,
        "gaining"
    );

    playHeartPowerupSound();

    showLifeFeedback(
        "+1 LIFE"
    );
}


/* =================================
   FRUITS
   ================================= */

const fruits = [

    {
        type: "apple",
        color: "#ff3030",
        glow: "#ff3030"
    },

    {
        type: "orange",
        color: "#ff8c00",
        glow: "#ff8c00"
    },

    {
        type: "lemon",
        color: "#ffe600",
        glow: "#ffe600"
    },

    {
        type: "strawberry",
        color: "#ff1744",
        glow: "#ff1744"
    },

    {
        type: "grape",
        color: "#9b59ff",
        glow: "#9b59ff"
    },

    {
        type: "watermelon",
        color: "#00dd55",
        glow: "#00ff66"
    }

];


let currentFruit;


/* =================================
   SNAKE COLORS
   ================================= */

const snakeColors = [

    {
        main: "#00ff66",
        body: "#00cc55"
    },

    {
        main: "#00e5ff",
        body: "#00aacc"
    },

    {
        main: "#b000ff",
        body: "#8700cc"
    },

    {
        main: "#ff3cac",
        body: "#d9007f"
    },

    {
        main: "#ff9f00",
        body: "#dd7700"
    },

    {
        main: "#ffe600",
        body: "#d6c000"
    },

    {
        main: "#ff3030",
        body: "#cc2020"
    },

    {
        main: "#ffffff",
        body: "#bbbbbb"
    }

];


let currentSnakeColor;


/* =================================
   OBSTACLES
   ================================= */

let obstacles = [];

let obstacleParticles = [];

let obstacleCount = 0;

let obstacleFlash = 0;


/* =================================
   AUDIO UNLOCK
   ================================= */

document.addEventListener(
    "pointerdown",
    initAudio,
    {
        passive: true
    }
);

document.addEventListener(
    "keydown",
    initAudio,
    {
        passive: true
    }
);


/* =================================
   TOUCH SWIPE
   ================================= */

let touchStartX = 0;

let touchStartY = 0;

let touchActive = false;

let touchDirectionLocked = false;

let touchPointerId = null;


canvas.addEventListener(
    "pointerdown",
    event => {

        if (
            event.pointerType !== "touch"
        ) {
            return;
        }

        if (touchActive) {
            return;
        }

        touchStartX =
            event.clientX;

        touchStartY =
            event.clientY;

        touchActive = true;

        touchDirectionLocked =
            false;

        touchPointerId =
            event.pointerId;

        try {

            canvas.setPointerCapture(
                event.pointerId
            );

        } catch (error) {}

        event.preventDefault();
    },
    {
        passive: false
    }
);


canvas.addEventListener(
    "pointerup",
    event => {

        if (
            event.pointerType !== "touch" ||
            !touchActive ||
            event.pointerId !==
                touchPointerId
        ) {
            return;
        }

        const deltaX =
            event.clientX -
            touchStartX;

        const deltaY =
            event.clientY -
            touchStartY;

        touchActive = false;

        touchPointerId = null;

        try {

            canvas.releasePointerCapture(
                event.pointerId
            );

        } catch (error) {}

        const minSwipeDistance =
            25;

        if (
            Math.abs(deltaX) <
                minSwipeDistance &&
            Math.abs(deltaY) <
                minSwipeDistance
        ) {

            event.preventDefault();

            return;
        }

        if (
            touchDirectionLocked
        ) {

            event.preventDefault();

            return;
        }

        if (
            Math.abs(deltaX) >
            Math.abs(deltaY)
        ) {

            if (
                deltaX > 0
            ) {

                setDirection(1, 0);

            } else {

                setDirection(-1, 0);
            }

        } else {

            if (
                deltaY > 0
            ) {

                setDirection(0, 1);

            } else {

                setDirection(0, -1);
            }
        }

        touchDirectionLocked =
            true;

        event.preventDefault();

    },
    {
        passive: false
    }
);


canvas.addEventListener(
    "pointercancel",
    event => {

        if (
            event.pointerType !== "touch" ||
            event.pointerId !== touchPointerId
        ) {
            return;
        }

        touchActive = false;

        touchDirectionLocked =
            false;

        touchPointerId = null;

    },
    {
        passive: true
    }
);


canvas.addEventListener(
    "lostpointercapture",
    event => {

        if (
            event.pointerId !==
            touchPointerId
        ) {
            return;
        }

        touchActive = false;

        touchPointerId = null;

    },
    {
        passive: true
    }
);


/* =================================
   EFFECTS
   ================================= */

let particles = [];

let foodParticles = [];

let eatColorEffect = 0;

let foodPulse = 0;

let deathAnimation = false;

let deathTimer = 0;

let screenShake = 0;

let redFlash = 0;

let gameOverReady = false;


/* =================================
   SCORE
   ================================= */

highScoreElement.textContent =
    highScore;


/* =================================
   RESIZE
   ================================= */

function resizeCanvas() {

    let width =
        window.innerWidth - 8;

    let height =
        window.innerHeight - 8;

    if (
        window.matchMedia(
            "(max-width: 700px)"
        ).matches
    ) {

        const navbarHeight =
            document.fullscreenElement
                ? 55
                : 55;

        height =
            window.innerHeight -
            navbarHeight -
            8;
    }

    const size =
        Math.min(
            width,
            height
        );

    const newSize =
        Math.max(
            GRID,
            Math.floor(
                size / GRID
            ) * GRID
        );

    if (
        canvas.width ===
            newSize &&
        canvas.height ===
            newSize
    ) {
        return;
    }

    canvas.width =
        newSize;

    canvas.height =
        newSize;

    tileSize =
        canvas.width /
        GRID;

    backgroundCache =
        null;

    backgroundCacheSize =
        0;
}


/* =================================
   START GAME
   ================================= */

/* =================================
   START GAME
   ================================= */

function startGame() {

    stopMenuMusic();

    if (gameOverTimeout) {

        clearTimeout(
            gameOverTimeout
        );

        gameOverTimeout = null;
    }

    if (feedbackTimer) {

        clearTimeout(
            feedbackTimer
        );

        feedbackTimer = null;
    }

    if (
        animationFrameId !== null
    ) {

        cancelAnimationFrame(
            animationFrameId
        );

        animationFrameId = null;
    }

    deathHeartOverlay.classList
        .remove("show");

    snake = [

        { x: 16, y: 16 },
        { x: 15, y: 16 },
        { x: 14, y: 16 },
        { x: 13, y: 16 }

    ];

    direction = {
        x: 1,
        y: 0
    };

    nextDirection = {
        x: 1,
        y: 0
    };

    score = 0;

    /*
       Difficulty speed
    */

    gameSpeed =
        currentDifficulty.startSpeed;

    gameRunning = true;

    lastTime =
        performance.now();

    lastRenderTime = 0;

    particles = [];

    foodParticles = [];

    obstacleParticles = [];

    heartParticles = [];

    specialBombParticles = [];

    obstacles = [];

    obstacleCount = 0;

    obstacleFlash = 0;

    eatColorEffect = 0;

    foodPulse = 0;

    deathAnimation = false;

    deathTimer = 0;

    screenShake = 0;

    redFlash = 0;

    gameOverReady = false;

    hearts = MAX_HEARTS;

    heartItem = null;

    heartAnimationTime = 0;

    heartSpawnScore = 5;

    heartSpawnCooldown = 0;

    specialBomb = null;

    specialBombSpawned = false;

    specialBombExplosion = false;

    specialBombExplosionTimer = 0;

    specialBombExplosionX = 0;

    specialBombExplosionY = 0;

    updateHeartUI();

    feedbackText.classList.remove(
        "show"
    );

    feedbackText.textContent = "";

    lifeFeedback.classList.remove(
        "show"
    );

    lifeFeedback.textContent = "";

    currentSnakeColor =
        snakeColors[0];

    currentFruit =
        fruits[
            Math.floor(
                Math.random() *
                fruits.length
            )
        ];

    scoreElement.textContent =
        score;

    gameOver.style.display =
        "none";

    touchActive = false;

    touchDirectionLocked =
        false;

    touchPointerId = null;

    spawnFood();

    animationFrameId =
        requestAnimationFrame(
            gameLoop
        );
}

/* =================================
   RESPawn AFTER DEATH
   ================================= */

function respawnAfterDeath() {

    if (
        hearts <= 0
    ) {
        return;
    }

    snake = [

        { x: 16, y: 16 },
        { x: 15, y: 16 },
        { x: 14, y: 16 },
        { x: 13, y: 16 }

    ];

    direction = {
        x: 1,
        y: 0
    };

    nextDirection = {
        x: 1,
        y: 0
    };

    deathAnimation = false;

    deathTimer = 0;

    screenShake = 0;

    redFlash = 0;

    particles = [];

    foodParticles = [];

    gameRunning = true;

    lastTime =
        performance.now();

    lastRenderTime = 0;

    touchActive = false;

    touchDirectionLocked =
        false;

    touchPointerId = null;

    placeFoodSafely();

    animationFrameId =
        requestAnimationFrame(
            gameLoop
        );
}



/* =================================
   RESTART GAME
   ================================= */

function restartGame() {

    /*
       PLAY AGAIN uses the same
       difficulty that was selected.
    */

    startGame();
}


/* =================================
   SAFE FOOD POSITION
   ================================= */

function placeFoodSafely() {

    let valid = false;

    let attempts = 0;

    const difficultyLevel =
        currentDifficulty.foodDifficulty || 0;

    const head =
        snake && snake[0]
            ? snake[0]
            : null;

    while (
        !valid &&
        attempts < 1000
    ) {

        attempts++;

        food = {

            x:
                Math.floor(
                    Math.random() *
                    (GRID - 4)
                ) + 2,

            y:
                Math.floor(
                    Math.random() *
                    (GRID - 4)
                ) + 2

        };

        valid =
            !snake.some(
                part =>
                    part.x === food.x &&
                    part.y === food.y
            );

        if (
            valid &&
            obstacles.length
        ) {

            valid =
                !obstacles.some(
                    obstacle =>
                        obstacle.x === food.x &&
                        obstacle.y === food.y
                );
        }

        if (
            valid &&
            heartItem
        ) {

            valid =
                !(
                    heartItem.x === food.x &&
                    heartItem.y === food.y
                );
        }

        if (
            valid &&
            specialBomb
        ) {

            valid =
                !(
                    specialBomb.x === food.x &&
                    specialBomb.y === food.y
                );
        }

        /*
           Make food harder to reach
           on Hard / Extreme.
        */

        if (
            valid &&
            head &&
            difficultyLevel > 0
        ) {

            const distance =
                Math.abs(
                    food.x - head.x
                ) +
                Math.abs(
                    food.y - head.y
                );

            let minimumDistance = 0;

            if (
                difficultyLevel === 1
            ) {

                minimumDistance = 4;

            } else if (
                difficultyLevel === 2
            ) {

                minimumDistance = 7;

            } else if (
                difficultyLevel === 3
            ) {

                minimumDistance = 10;
            }

            if (
                distance < minimumDistance
            ) {

                valid = false;
            }
        }
    }

    if (!valid) {

        food = {
            x: 5,
            y: 5
        };
    }
}

/* =================================
   FOOD
   ================================= */

function spawnFood() {

    placeFoodSafely();

    let nextFruit;

    do {

        nextFruit =
            fruits[
                Math.floor(
                    Math.random() *
                    fruits.length
                )
            ];

    } while (
        fruits.length > 1 &&
        nextFruit.type ===
            currentFruit.type
    );

    currentFruit =
        nextFruit;

    foodPulse = 0;
}


/* =================================
   SPECIAL BOMB POSITION
   ================================= */

function spawnSpecialBomb() {

    if (specialBomb) {
    return;
}

    let valid = false;

    let candidate;

    let attempts = 0;

    while (
        !valid &&
        attempts < 1000
    ) {

        attempts++;

        candidate = {

            x:
                Math.floor(
                    Math.random() *
                    (GRID - 6)
                ) + 3,

            y:
                Math.floor(
                    Math.random() *
                    (GRID - 6)
                ) + 3

        };

        valid =
            !snake.some(
                part =>
                    part.x === candidate.x &&
                    part.y === candidate.y
            );

        if (
            valid &&
            food
        ) {

            valid =
                !(
                    food.x === candidate.x &&
                    food.y === candidate.y
                );
        }

        if (
            valid &&
            heartItem
        ) {

            valid =
                !(
                    heartItem.x === candidate.x &&
                    heartItem.y === candidate.y
                );
        }

        if (valid) {

            valid =
                !obstacles.some(
                    obstacle =>
                        obstacle.x === candidate.x &&
                        obstacle.y === candidate.y
                );
        }

        if (
            valid &&
            snake[0]
        ) {

            const distance =
                Math.abs(
                    candidate.x -
                    snake[0].x
                ) +
                Math.abs(
                    candidate.y -
                    snake[0].y
                );

            if (
                distance < 9
            ) {

                valid = false;
            }
        }
    }

    if (!valid)
        return;

    specialBomb = {

        x: candidate.x,

        y: candidate.y,

        age: 0,

        pulse: 0,

        rotation: 0

    };

    specialBombSpawned = true;

    createSpecialBombAppearEffect(
        candidate.x,
        candidate.y
    );
}


/* =================================
   SPECIAL BOMB APPEAR EFFECT
   ================================= */

function createSpecialBombAppearEffect(
    x,
    y
) {

    const centerX =
        x * tileSize +
        tileSize / 2;

    const centerY =
        y * tileSize +
        tileSize / 2;

    for (
        let i = 0;
        i < 55;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            Math.random() *
            5 +
            2;

        specialBombParticles.push({

            x: centerX,

            y: centerY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                Math.random() *
                5 +
                2,

            life: 1,

            color:
                Math.random() > 0.5
                    ? "#ff003c"
                    : "#ffcc00"

        });
    }

    screenShake = 8;
}


/* =================================
   DRAW SPECIAL BOMB
   ================================= */

function drawSpecialBomb() {

    if (
    !specialBomb ||
    specialBombExplosion ||
    deathAnimation
) {
    return;
}

    const x =
        specialBomb.x *
        tileSize +
        tileSize / 2;

    const y =
        specialBomb.y *
        tileSize +
        tileSize / 2;

    specialBomb.age += frameScale;

    specialBomb.pulse +=
        frameScale *
        0.13;

    specialBomb.rotation +=
        frameScale *
        0.025;

    const pulse =
        1 +
        Math.sin(
            specialBomb.pulse
        ) *
        0.09;

    const size =
        tileSize *
        1.15 *
        pulse;

    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.rotate(
        specialBomb.rotation
    );

    /* Outer energy glow */

    ctx.shadowBlur =
        35;

    ctx.shadowColor =
        "#ff003c";

    ctx.strokeStyle =
        "rgba(255,0,60,0.85)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        size * 0.64,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.shadowBlur =
        0;

    /* Main black/red core */

    const gradient =
        ctx.createRadialGradient(
            -size * 0.16,
            -size * 0.18,
            size * 0.05,
            0,
            0,
            size * 0.60
        );

    gradient.addColorStop(
        0,
        "#ff334f"
    );

    gradient.addColorStop(
        0.35,
        "#7a001d"
    );

    gradient.addColorStop(
        0.72,
        "#190008"
    );

    gradient.addColorStop(
        1,
        "#030303"
    );

    ctx.fillStyle =
        gradient;

    ctx.shadowBlur =
        28;

    ctx.shadowColor =
        "#ff003c";

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        size * 0.52,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur =
        0;

    ctx.strokeStyle =
        "#ff1744";

    ctx.lineWidth = 2;

    ctx.stroke();


    /* Warning symbol */

    ctx.fillStyle =
        "#ffcc00";

    ctx.strokeStyle =
        "#ffea70";

    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.moveTo(
        0,
        -size * 0.30
    );

    ctx.lineTo(
        size * 0.27,
        size * 0.22
    );

    ctx.lineTo(
        -size * 0.27,
        size * 0.22
    );

    ctx.closePath();

    ctx.fill();

    ctx.stroke();


    ctx.fillStyle =
        "#160000";

    ctx.font =
        `900 ${Math.max(8, tileSize * 0.25)}px Arial`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "!",
        0,
        size * 0.055
    );


    /* Top fuse */

    ctx.strokeStyle =
        "#ffcc00";

    ctx.lineWidth =
        Math.max(
            2,
            tileSize * 0.07
        );

    ctx.beginPath();

    ctx.moveTo(
        -size * 0.10,
        -size * 0.46
    );

    ctx.quadraticCurveTo(
        size * 0.04,
        -size * 0.66,
        size * 0.20,
        -size * 0.56
    );

    ctx.stroke();


    /* Fuse spark */

    const spark =
        0.65 +
        Math.sin(
            specialBomb.pulse * 2
        ) *
        0.35;

    ctx.globalAlpha =
        spark;

    ctx.fillStyle =
        "#ffffff";

    ctx.shadowBlur =
        18;

    ctx.shadowColor =
        "#ffcc00";

    ctx.beginPath();

    ctx.arc(
        size * 0.20,
        -size * 0.56,
        size * 0.09,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;

    ctx.restore();
}


/* =================================
   SPECIAL BOMB EXPLOSION
   ================================= */

function createSpecialBombExplosion() {

    if (
        specialBombExplosion
    ) {
        return;
    }

    specialBombExplosion = true;

    specialBombExplosionTimer = 0;

    specialBombExplosionX =
        specialBomb.x *
        tileSize +
        tileSize / 2;

    specialBombExplosionY =
        specialBomb.y *
        tileSize +
        tileSize / 2;

    specialBomb = null;

    gameRunning = false;

    hearts = 0;

    updateHeartUI();

    playSpecialBombSound();

    screenShake = 42;

    redFlash = 1;

    specialBombParticles = [];

    particles = [];

    foodParticles = [];

    obstacleParticles = [];

    /* Huge explosion particles */

    for (
        let i = 0;
        i < 180;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            Math.random() *
            15 +
            3;

        specialBombParticles.push({

            x:
                specialBombExplosionX,

            y:
                specialBombExplosionY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                Math.random() *
                10 +
                2,

            life: 1,

            color:
                Math.random() > 0.35
                    ? "#ff3030"
                    : Math.random() > 0.5
                        ? "#ffcc00"
                        : "#ffffff"

        });
    }

    /* Secondary sparks */

    for (
        let i = 0;
        i < 100;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            Math.random() *
            8 +
            1;

        specialBombParticles.push({

            x:
                specialBombExplosionX,

            y:
                specialBombExplosionY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                Math.random() *
                5 +
                1,

            life: 1,

            color:
                "#ffffff"

        });
    }

    finalScore.textContent =
        score;

    gameOverReady = true;

    if (gameOverTimeout) {

        clearTimeout(
            gameOverTimeout
        );
    }

    gameOverTimeout =
        setTimeout(
            () => {

                gameOverTimeout =
                    null;

                gameOver.style.display =
                    "flex";

            },
            1050
        );
}


/* =================================
   UPDATE SPECIAL BOMB PARTICLES
   ================================= */

function updateSpecialBombParticles() {

    specialBombParticles.forEach(
        particle => {

            particle.x +=
                particle.vx;

            particle.y +=
                particle.vy;

            particle.vx *=
                0.965;

            particle.vy *=
                0.965;

            particle.vy +=
                0.055;

            particle.life -=
                specialBombExplosion
                    ? 0.018
                    : 0.035;

            particle.size *=
                specialBombExplosion
                    ? 0.985
                    : 0.97;

        }
    );

    specialBombParticles =
        specialBombParticles.filter(
            particle =>
                particle.life > 0
        );
}


/* =================================
   DRAW SPECIAL BOMB EXPLOSION
   ================================= */

function drawSpecialBombExplosion() {

    if (
        !specialBombExplosion
    ) {
        return;
    }

    const progress =
        Math.min(
            1,
            specialBombExplosionTimer /
            1.05
        );

    const maxRadius =
        tileSize *
        9.5;

    const radius =
        maxRadius *
        Math.min(
            1,
            progress * 1.65
        );

    ctx.save();

    ctx.globalCompositeOperation =
        "lighter";

    /* Main shockwave */

    ctx.globalAlpha =
        Math.max(
            0,
            0.9 -
            progress * 0.9
        );

    ctx.strokeStyle =
        "#ff3030";

    ctx.lineWidth =
        tileSize *
        0.20;

    ctx.shadowBlur =
        45;

    ctx.shadowColor =
        "#ff003c";

    ctx.beginPath();

    ctx.arc(
        specialBombExplosionX,
        specialBombExplosionY,
        radius,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    /* Second shockwave */

    const radius2 =
        maxRadius *
        Math.max(
            0,
            progress * 1.15 -
            0.20
        );

    ctx.globalAlpha =
        Math.max(
            0,
            0.65 -
            progress * 0.65
        );

    ctx.strokeStyle =
        "#ffcc00";

    ctx.lineWidth =
        tileSize *
        0.10;

    ctx.shadowBlur =
        35;

    ctx.shadowColor =
        "#ffcc00";

    ctx.beginPath();

    ctx.arc(
        specialBombExplosionX,
        specialBombExplosionY,
        radius2,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    /* Bright center */

    const centerRadius =
        Math.max(
            0,
            tileSize *
            2.2 *
            (1 - progress)
        );

    const gradient =
        ctx.createRadialGradient(
            specialBombExplosionX,
            specialBombExplosionY,
            0,
            specialBombExplosionX,
            specialBombExplosionY,
            centerRadius
        );

    gradient.addColorStop(
        0,
        "rgba(255,255,255,0.98)"
    );

    gradient.addColorStop(
        0.22,
        "rgba(255,230,100,0.95)"
    );

    gradient.addColorStop(
        0.55,
        "rgba(255,50,30,0.75)"
    );

    gradient.addColorStop(
        1,
        "rgba(255,0,0,0)"
    );

    ctx.globalAlpha =
        1;

    ctx.fillStyle =
        gradient;

    ctx.beginPath();

    ctx.arc(
        specialBombExplosionX,
        specialBombExplosionY,
        centerRadius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


/* =================================
   HEART POSITION
   ================================= */

function spawnHeart() {

    if (heartItem)
        return;

    if (hearts >= MAX_HEARTS)
        return;

    let valid = false;

    let candidate;

    let attempts = 0;

    while (
        !valid &&
        attempts < 700
    ) {

        attempts++;

        candidate = {

            x:
                Math.floor(
                    Math.random() *
                    (GRID - 6)
                ) + 3,

            y:
                Math.floor(
                    Math.random() *
                    (GRID - 6)
                ) + 3

        };

        valid =
            !snake.some(
                part =>
                    part.x ===
                        candidate.x &&
                    part.y ===
                        candidate.y
            );

        if (
            valid &&
            food
        ) {

            valid =
                !(
                    candidate.x ===
                        food.x &&
                    candidate.y ===
                        food.y
                );
        }

        if (valid) {

            valid =
                !obstacles.some(
                    obstacle =>
                        obstacle.x ===
                            candidate.x &&
                        obstacle.y ===
                            candidate.y
                );
        }

        if (
            valid &&
            specialBomb
        ) {

            valid =
                !(
                    specialBomb.x ===
                        candidate.x &&
                    specialBomb.y ===
                        candidate.y
                );
        }

        if (
            valid &&
            snake[0]
        ) {

            const distance =
                Math.abs(
                    candidate.x -
                    snake[0].x
                ) +
                Math.abs(
                    candidate.y -
                    snake[0].y
                );

            if (
                distance < 10
            ) {
                valid = false;
            }
        }
    }

    if (!valid)
        return;

    heartItem = {

        x: candidate.x,

        y: candidate.y,

        age: 0,

        pulse: 0

    };

    heartAnimationTime = 0;

    heartParticles = [];

    createHeartSpawnEffect(
        candidate.x,
        candidate.y
    );

    playHeartSpawnSound();
}


/* =================================
   HEART SPAWN EFFECT
   ================================= */

function createHeartSpawnEffect(
    x,
    y
) {

    const centerX =
        x * tileSize +
        tileSize / 2;

    const centerY =
        y * tileSize +
        tileSize / 2;

    for (
        let i = 0;
        i < 22;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            Math.random() *
            2.8 +
            1.2;

        heartParticles.push({

            x: centerX,

            y: centerY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                Math.random() *
                3.5 +
                1.5,

            life: 1,

            color:
                Math.random() >
                0.45
                    ? "#ff4966"
                    : "#ff8aa0"

        });
    }
}


/* =================================
   HEART COLLECT EFFECT
   ================================= */

function createHeartCollectEffect(
    x,
    y
) {

    const centerX =
        x * tileSize +
        tileSize / 2;

    const centerY =
        y * tileSize +
        tileSize / 2;

    for (
        let i = 0;
        i < 60;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            Math.random() *
            8 +
            2;

        heartParticles.push({

            x: centerX,

            y: centerY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                Math.random() *
                7 +
                2,

            life: 1,

            color:
                Math.random() >
                0.45
                    ? "#ff4966"
                    : Math.random() >
                        0.5
                            ? "#ffffff"
                            : "#ffb3c0"

        });
    }

    screenShake = 5;

    eatColorEffect = 1;
}


/* =================================
   UPDATE HEART PARTICLES
   ================================= */

function updateHeartParticles() {

    heartParticles.forEach(
        particle => {

            particle.x +=
                particle.vx;

            particle.y +=
                particle.vy;

            particle.vx *=
                0.95;

            particle.vy *=
                0.95;

            particle.vy +=
                0.035;

            particle.life -=
                0.032;

            particle.size *=
                0.975;

        }
    );

    heartParticles =
        heartParticles.filter(
            particle =>
                particle.life > 0
        );
}


/* =================================
   DRAW HEART
   ================================= */

function drawHeartItem() {

    if (
        !heartItem ||
        deathAnimation ||
        specialBombExplosion
    ) {
        return;
    }

    const x =
        heartItem.x *
        tileSize +
        tileSize / 2;

    const y =
        heartItem.y *
        tileSize +
        tileSize / 2;

    heartItem.pulse +=
        frameScale *
        0.11;

    heartItem.age +=
        frameScale;

    const pulse =
        1 +
        Math.sin(
            heartItem.pulse
        ) *
        0.13;

    const floatY =
        Math.sin(
            heartItem.pulse *
            0.65
        ) *
        tileSize *
        0.08;

    const scale =
        pulse *
        Math.min(
            1,
            heartItem.age / 12
        );

    ctx.save();

    ctx.translate(
        x,
        y + floatY
    );

    ctx.scale(
        scale,
        scale
    );

    ctx.shadowBlur =
        28;

    ctx.shadowColor =
        "#ff4966";

    ctx.fillStyle =
        "#ff4966";

    ctx.beginPath();

    const s =
        tileSize *
        0.32;

    ctx.moveTo(
        0,
        s * 0.85
    );

    ctx.bezierCurveTo(
        -s * 1.25,
        s * 0.05,
        -s * 0.78,
        -s * 0.85,
        0,
        -s * 0.35
    );

    ctx.bezierCurveTo(
        s * 0.78,
        -s * 0.85,
        s * 1.25,
        s * 0.05,
        0,
        s * 0.85
    );

    ctx.fill();

    ctx.shadowBlur =
        0;

    ctx.fillStyle =
        "rgba(255,255,255,0.78)";

    ctx.beginPath();

    ctx.arc(
        -s * 0.32,
        -s * 0.28,
        s * 0.12,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.restore();
}


/* =================================
   DRAW HEART PARTICLES
   ================================= */

function drawHeartParticles() {

    heartParticles.forEach(
        particle => {

            ctx.globalAlpha =
                particle.life;

            ctx.fillStyle =
                particle.color;

            ctx.shadowBlur =
                15;

            ctx.shadowColor =
                particle.color;

            ctx.beginPath();

            ctx.arc(
                particle.x,
                particle.y,
                particle.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );

    ctx.globalAlpha = 1;

    ctx.shadowBlur = 0;
}


/* =================================
   CHECK HEART
   ================================= */

function checkHeartCollision(
    head
) {

    if (!heartItem)
        return false;

    return (
        heartItem.x ===
            head.x &&
        heartItem.y ===
            head.y
    );
}


/* =================================
   HEART SPAWN CONTROL
   ================================= */

function checkHeartSpawn() {

    if (heartItem)
        return;

    if (hearts >= MAX_HEARTS)
        return;

    if (score < heartSpawnScore)
        return;

    spawnHeart();

    heartSpawnScore =
        score + 5;
}


/* =================================
   OBSTACLE SYSTEM
   ================================= */

/* =================================
   OBSTACLE DIFFICULTY
   ================================= */

function shouldAddObstacle() {

    return (

        score >=
            currentDifficulty.obstacleStart

        &&

        (
            score -
            currentDifficulty.obstacleStart
        ) %
        currentDifficulty.obstacleEvery ===
            0

    );
}


function addObstacle() {

    if (
        obstacleCount >=
        currentDifficulty.maxObstacles
    ) {
        return;
    }

    let valid = false;

    let newObstacle;

    let attempts = 0;

    while (
        !valid &&
        attempts < 300
    ) {

        attempts++;

        newObstacle = {

            x:
                Math.floor(
                    Math.random() *
                    (GRID - 4)
                ) + 2,

            y:
                Math.floor(
                    Math.random() *
                    (GRID - 4)
                ) + 2

        };

        valid =
            !snake.some(
                part =>
                    part.x ===
                        newObstacle.x &&
                    part.y ===
                        newObstacle.y
            );

        if (
            valid &&
            food
        ) {

            valid =
                !(
                    newObstacle.x ===
                        food.x &&
                    newObstacle.y ===
                        food.y
                );
        }

        if (
            valid &&
            heartItem
        ) {

            valid =
                !(
                    newObstacle.x ===
                        heartItem.x &&
                    newObstacle.y ===
                        heartItem.y
                );
        }

        if (
            valid &&
            specialBomb
        ) {

            valid =
                !(
                    newObstacle.x ===
                        specialBomb.x &&
                    newObstacle.y ===
                        specialBomb.y
                );
        }

        if (valid) {

            valid =
                !obstacles.some(
                    obstacle =>
                        obstacle.x ===
                            newObstacle.x &&
                        obstacle.y ===
                            newObstacle.y
                );
        }

        if (
            valid &&
            snake[0]
        ) {

            const distance =
                Math.abs(
                    newObstacle.x -
                    snake[0].x
                ) +
                Math.abs(
                    newObstacle.y -
                    snake[0].y
                );

            if (
                distance < 4
            ) {
                valid = false;
            }
        }
    }

    if (!valid)
        return;

    obstacles.push(
        newObstacle
    );

    obstacleCount++;

    createObstacleAppearEffect(
        newObstacle.x,
        newObstacle.y
    );
}


/* =================================
   OBSTACLE APPEAR EFFECT
   ================================= */

function createObstacleAppearEffect(
    x,
    y
) {

    const centerX =
        x * tileSize +
        tileSize / 2;

    const centerY =
        y * tileSize +
        tileSize / 2;

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            Math.random() *
            3 +
            1;

        obstacleParticles.push({

            x: centerX,

            y: centerY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                Math.random() *
                4 +
                2,

            life: 1,

            color:
                "#ff8c00"

        });
    }
}


/* =================================
   OBSTACLE EXPLOSION
   ================================= */

function createObstacleExplosion(
    obstacle
) {

    screenShake = 20;

    obstacleFlash = 1;

    playExplosionSound();

    for (
        let i = 0;
        i < 35;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            Math.random() *
            8 +
            2;

        obstacleParticles.push({

            x:
                obstacle.x *
                tileSize +
                tileSize / 2,

            y:
                obstacle.y *
                tileSize +
                tileSize / 2,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                Math.random() *
                7 +
                2,

            life: 1,

            color:
                Math.random() > 0.5
                    ? "#ff3030"
                    : "#ff9f00"

        });
    }
}


/* =================================
   OBSTACLE COLLISION
   ================================= */

function checkObstacleCollision(
    head
) {

    return obstacles.some(
        obstacle =>
            obstacle.x ===
                head.x &&
            obstacle.y ===
                head.y
    );
}


/* =================================
   SPECIAL BOMB COLLISION
   ================================= */

function checkSpecialBombCollision(
    head
) {

    if (!specialBomb)
        return false;

    return (
        specialBomb.x === head.x &&
        specialBomb.y === head.y
    );
}


/* =================================
   DRAW OBSTACLES
   ================================= */

function drawObstacles() {

    if (
        deathAnimation ||
        specialBombExplosion
    ) {
        return;
    }

    obstacles.forEach(
        obstacle => {

            const x =
                obstacle.x *
                tileSize +
                tileSize / 2;

            const y =
                obstacle.y *
                tileSize +
                tileSize / 2;

            const size =
                tileSize * 0.62;

            ctx.save();

            ctx.translate(
                x,
                y
            );

            ctx.rotate(
                Math.PI / 4
            );

            ctx.shadowBlur = 18;

            ctx.shadowColor =
                "#ff3030";

            ctx.fillStyle =
                "#161616";

            ctx.strokeStyle =
                "#ff3030";

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.roundRect(
                -size / 2,
                -size / 2,
                size,
                size,
                tileSize * 0.10
            );

            ctx.fill();

            ctx.stroke();

            ctx.shadowBlur = 0;

            ctx.strokeStyle =
                "#ff9f00";

            ctx.lineWidth = 2;

            ctx.beginPath();

            ctx.moveTo(
                -size * 0.28,
                -size * 0.10
            );

            ctx.lineTo(
                size * 0.05,
                size * 0.22
            );

            ctx.lineTo(
                size * 0.27,
                -size * 0.25
            );

            ctx.stroke();

            ctx.restore();

        }
    );
}


/* =================================
   EAT ANIMATION
   ================================= */

function createEatEffect(
    x,
    y
) {

    const centerX =
        x * tileSize +
        tileSize / 2;

    const centerY =
        y * tileSize +
        tileSize / 2;

    for (
        let i = 0;
        i < 30;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            Math.random() *
            5 +
            2;

        foodParticles.push({

            x: centerX,

            y: centerY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size:
                Math.random() *
                5 +
                2,

            life: 1,

            color:
                currentFruit.color

        });
    }

    eatColorEffect = 1;
}


/* =================================
   DEATH EXPLOSION
   ================================= */

function createDeathExplosion() {

    deathAnimation = true;

    deathTimer = 0;

    screenShake = 20;

    redFlash = 1;

    snake.forEach(
        part => {

            const x =
                part.x *
                tileSize +
                tileSize / 2;

            const y =
                part.y *
                tileSize +
                tileSize / 2;

            for (
                let i = 0;
                i < 8;
                i++
            ) {

                const angle =
                    Math.random() *
                    Math.PI * 2;

                const speed =
                    Math.random() *
                    7 +
                    2;

                particles.push({

                    x: x,

                    y: y,

                    vx:
                        Math.cos(angle) *
                        speed,

                    vy:
                        Math.sin(angle) *
                        speed,

                    size:
                        Math.random() *
                        7 +
                        2,

                    life: 1

                });
            }
        }
    );
}


/* =================================
   UPDATE PARTICLES
   ================================= */

function updateParticles() {

    particles.forEach(
        p => {

            p.x += p.vx;

            p.y += p.vy;

            p.vx *= 0.97;

            p.vy *= 0.97;

            p.vy += 0.08;

            p.life -= 0.025;

            p.size *= 0.985;

        }
    );

    particles =
        particles.filter(
            p =>
                p.life > 0
        );


    foodParticles.forEach(
        p => {

            p.x += p.vx;

            p.y += p.vy;

            p.vx *= 0.96;

            p.vy *= 0.96;

            p.life -= 0.035;

            p.size *= 0.97;

        }
    );

    foodParticles =
        foodParticles.filter(
            p =>
                p.life > 0
        );


    obstacleParticles.forEach(
        p => {

            p.x += p.vx;

            p.y += p.vy;

            p.vx *= 0.97;

            p.vy *= 0.97;

            p.vy += 0.06;

            p.life -= 0.025;

            p.size *= 0.975;

        }
    );

    obstacleParticles =
        obstacleParticles.filter(
            p =>
                p.life > 0
        );


    updateHeartParticles();

    updateSpecialBombParticles();
}


/* =================================
   DRAW PARTICLES
   ================================= */

function drawParticles() {

    particles.forEach(
        p => {

            ctx.globalAlpha =
                p.life;

            ctx.fillStyle =
                currentSnakeColor.main;

            ctx.shadowBlur = 15;

            ctx.shadowColor =
                currentSnakeColor.main;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );


    foodParticles.forEach(
        p => {

            ctx.globalAlpha =
                p.life;

            ctx.fillStyle =
                p.color ||
                currentFruit.color;

            ctx.shadowBlur = 15;

            ctx.shadowColor =
                p.color ||
                currentFruit.glow;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );


    obstacleParticles.forEach(
        p => {

            ctx.globalAlpha =
                p.life;

            ctx.fillStyle =
                p.color;

            ctx.shadowBlur = 18;

            ctx.shadowColor =
                p.color;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );


    specialBombParticles.forEach(
        p => {

            ctx.globalAlpha =
                p.life;

            ctx.fillStyle =
                p.color;

            ctx.shadowBlur =
                25;

            ctx.shadowColor =
                p.color;

            ctx.beginPath();

            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI * 2
            );

            ctx.fill();

        }
    );


    ctx.globalAlpha = 1;

    ctx.shadowBlur = 0;
}


/* =================================
   UPDATE GAME
   ================================= */

function update() {

    if (
        specialBombExplosion
    ) {
        return;
    }

    touchDirectionLocked = false;

    direction =
        nextDirection;

    const head = {

        x:
            snake[0].x +
            direction.x,

        y:
            snake[0].y +
            direction.y

    };


    if (
        head.x < 0 ||
        head.x >= GRID ||
        head.y < 0 ||
        head.y >= GRID
    ) {

        die("wall");

        return;
    }


    /* SPECIAL BOMB CHECK */

    if (
        checkSpecialBombCollision(
            head
        )
    ) {

        createSpecialBombExplosion();

        return;
    }


    const hitObstacle =
        obstacles.find(
            obstacle =>
                obstacle.x ===
                    head.x &&
                obstacle.y ===
                    head.y
        );


    if (
        hitObstacle
    ) {

        createObstacleExplosion(
            hitObstacle
        );

        obstacles =
            obstacles.filter(
                obstacle =>
                    obstacle !==
                    hitObstacle
            );

        die("bomb");

        return;
    }


    const willEat =
        head.x === food.x &&
        head.y === food.y;


    const willGetHeart =
        checkHeartCollision(
            head
        );


    const bodyLimit =
        willEat
            ? snake.length
            : snake.length - 1;


    for (
        let i = 0;
        i < bodyLimit;
        i++
    ) {

        const part =
            snake[i];

        if (
            part.x === head.x &&
            part.y === head.y
        ) {

            die("self");

            return;
        }
    }


    snake.unshift(
        head
    );


    if (
        willGetHeart
    ) {

        const collectedHeart =
            heartItem;

        createHeartCollectEffect(
            collectedHeart.x,
            collectedHeart.y
        );

        heartItem = null;

        heartAnimationTime = 0;

        gainHeart();

    }


    if (
        willEat
    ) {

        createEatEffect(
            food.x,
            food.y
        );

        playEatSound();

        showFeedback();

        score++;

        scoreElement.textContent =
            score;


        let newColor;

        do {

            newColor =
                snakeColors[
                    Math.floor(
                        Math.random() *
                        snakeColors.length
                    )
                ];

        } while (
            snakeColors.length > 1 &&
            newColor.main ===
                currentSnakeColor.main
        );


        currentSnakeColor =
            newColor;


        if (
            score > highScore
        ) {

            highScore =
                score;

            localStorage.setItem(
                "theSnakeHighScore",
                highScore
            );

            highScoreElement.textContent =
                highScore;
        }


       gameSpeed =
    Math.max(
        currentDifficulty.minSpeed,
        currentDifficulty.startSpeed -
        score *
        currentDifficulty.speedStep
    );


        if (
            shouldAddObstacle()
        ) {

            addObstacle();
        }


        spawnFood();

        checkHeartSpawn();


       /* =================================
   SPECIAL BOMB
   ================================= */

if (
    score >= currentDifficulty.bombStart &&
    !specialBomb &&
    (
        score -
        currentDifficulty.bombStart
    ) %
    currentDifficulty.bombEvery === 0
) {

    spawnSpecialBomb();

}


    } else {

        snake.pop();
    }
}


/* =================================
   DIE
   ================================= */

function die(
    reason = "self"
) {

    if (
        deathAnimation ||
        specialBombExplosion
    ) {
        return;
    }

    gameRunning = false;

    loseHeart();


    if (
        reason !== "bomb"
    ) {

        playLoseSound();
    }


    createDeathExplosion();


    if (
        gameOverTimeout
    ) {

        clearTimeout(
            gameOverTimeout
        );
    }


    gameOverTimeout =
        setTimeout(
            () => {

                gameOverTimeout =
                    null;

                if (
                    gameRunning
                ) {
                    return;
                }


                if (
                    hearts > 0
                ) {

                    respawnAfterDeath();

                    return;
                }


                finalScore.textContent =
                    score;

                gameOverReady =
                    true;

                gameOver.style.display =
                    "flex";

            },
            1050
        );
}


/* =================================
   BACKGROUND
   ================================= */

function drawBackground() {

    if (
        !backgroundCache ||
        backgroundCacheSize !==
            canvas.width
    ) {

        backgroundCache =
            document.createElement(
                "canvas"
            );

        backgroundCache.width =
            canvas.width;

        backgroundCache.height =
            canvas.height;

        const bgCtx =
            backgroundCache.getContext(
                "2d"
            );

        bgCtx.fillStyle =
            "#090909";

        bgCtx.fillRect(
            0,
            0,
            backgroundCache.width,
            backgroundCache.height
        );

        bgCtx.strokeStyle =
            "#111";

        bgCtx.lineWidth = 1;

        for (
            let i = 0;
            i <= GRID;
            i++
        ) {

            bgCtx.beginPath();

            bgCtx.moveTo(
                i * tileSize,
                0
            );

            bgCtx.lineTo(
                i * tileSize,
                backgroundCache.height
            );

            bgCtx.stroke();


            bgCtx.beginPath();

            bgCtx.moveTo(
                0,
                i * tileSize
            );

            bgCtx.lineTo(
                backgroundCache.width,
                i * tileSize
            );

            bgCtx.stroke();
        }

        backgroundCacheSize =
            canvas.width;
    }


    ctx.drawImage(
        backgroundCache,
        0,
        0
    );
}


/* =================================
   DRAW FOOD
   ================================= */

function drawFood() {

    if (
        deathAnimation ||
        specialBombExplosion
    )
        return;

    const pulse =
        1 +
        Math.sin(foodPulse) *
        0.10;

    const x =
        food.x *
        tileSize +
        tileSize / 2;

    const y =
        food.y *
        tileSize +
        tileSize / 2;

    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.scale(
        pulse,
        pulse
    );

    const type =
        currentFruit.type;


    if (
        type === "apple"
    ) {

        ctx.shadowBlur = 25;
        ctx.shadowColor = "#ff3030";
        ctx.fillStyle = "#ff3030";

        ctx.beginPath();

        ctx.arc(
            -tileSize * 0.08,
            0,
            tileSize * 0.27,
            0,
            Math.PI * 2
        );

        ctx.arc(
            tileSize * 0.08,
            0,
            tileSize * 0.27,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            0,
            tileSize * 0.08,
            tileSize * 0.30,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
            0,
            -tileSize * 0.22
        );

        ctx.lineTo(
            tileSize * 0.05,
            -tileSize * 0.38
        );

        ctx.stroke();

        ctx.fillStyle = "#00dd55";

        ctx.beginPath();

        ctx.ellipse(
            tileSize * 0.14,
            -tileSize * 0.34,
            tileSize * 0.14,
            tileSize * 0.06,
            -0.4,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    else if (
        type === "orange"
    ) {

        ctx.shadowBlur = 25;
        ctx.shadowColor = "#ff8c00";
        ctx.fillStyle = "#ff8c00";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            tileSize * 0.31,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            0,
            -tileSize * 0.28
        );

        ctx.lineTo(
            tileSize * 0.04,
            -tileSize * 0.38
        );

        ctx.stroke();

        ctx.fillStyle = "#00dd55";

        ctx.beginPath();

        ctx.ellipse(
            tileSize * 0.12,
            -tileSize * 0.34,
            tileSize * 0.13,
            tileSize * 0.055,
            -0.5,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    else if (
        type === "lemon"
    ) {

        ctx.shadowBlur = 25;
        ctx.shadowColor = "#ffe600";
        ctx.fillStyle = "#ffe600";

        ctx.beginPath();

        ctx.ellipse(
            0,
            0,
            tileSize * 0.36,
            tileSize * 0.24,
            -0.25,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#d0a900";
        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            -tileSize * 0.20,
            tileSize * 0.05
        );

        ctx.lineTo(
            tileSize * 0.20,
            -tileSize * 0.05
        );

        ctx.stroke();

    }


    else if (
        type === "strawberry"
    ) {

        ctx.shadowBlur = 25;
        ctx.shadowColor = "#ff1744";
        ctx.fillStyle = "#ff1744";

        ctx.beginPath();

        ctx.moveTo(
            0,
            tileSize * 0.32
        );

        ctx.bezierCurveTo(
            -tileSize * 0.34,
            tileSize * 0.02,
            -tileSize * 0.28,
            -tileSize * 0.24,
            0,
            -tileSize * 0.18
        );

        ctx.bezierCurveTo(
            tileSize * 0.28,
            -tileSize * 0.24,
            tileSize * 0.34,
            tileSize * 0.02,
            0,
            tileSize * 0.32
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.fillStyle = "#00dd55";

        ctx.beginPath();

        ctx.moveTo(
            -tileSize * 0.20,
            -tileSize * 0.18
        );

        ctx.lineTo(
            0,
            -tileSize * 0.35
        );

        ctx.lineTo(
            tileSize * 0.20,
            -tileSize * 0.18
        );

        ctx.lineTo(
            0,
            -tileSize * 0.12
        );

        ctx.closePath();

        ctx.fill();

        ctx.fillStyle = "#ffe600";

        for (
            let i = 0;
            i < 5;
            i++
        ) {

            const sx =
                (i - 2) *
                tileSize * 0.10;

            const sy =
                tileSize *
                (
                    0.00 +
                    Math.abs(i - 2) *
                    0.04
                );

            ctx.beginPath();

            ctx.ellipse(
                sx,
                sy,
                tileSize * 0.025,
                tileSize * 0.045,
                0,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }

    }


    else if (
        type === "grape"
    ) {

        ctx.shadowBlur = 25;
        ctx.shadowColor = "#9b59ff";
        ctx.fillStyle = "#9b59ff";

        const grapeSize =
            tileSize * 0.11;

        const grapes = [

            [-0.14, -0.14],
            [0.14, -0.14],
            [-0.21, 0.02],
            [0, 0.02],
            [0.21, 0.02],
            [-0.14, 0.18],
            [0.14, 0.18],
            [0, 0.32]

        ];

        grapes.forEach(
            position => {

                ctx.beginPath();

                ctx.arc(
                    position[0] *
                        tileSize,

                    position[1] *
                        tileSize,

                    grapeSize,

                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }
        );

        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#8b5a2b";
        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.moveTo(
            0,
            -tileSize * 0.18
        );

        ctx.lineTo(
            tileSize * 0.06,
            -tileSize * 0.36
        );

        ctx.stroke();

        ctx.fillStyle = "#00dd55";

        ctx.beginPath();

        ctx.ellipse(
            tileSize * 0.13,
            -tileSize * 0.31,
            tileSize * 0.13,
            tileSize * 0.06,
            -0.5,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    else if (
        type === "watermelon"
    ) {

        ctx.shadowBlur = 25;
        ctx.shadowColor = "#00ff66";
        ctx.fillStyle = "#00dd55";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            tileSize * 0.32,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#ff4d6d";

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            tileSize * 0.23,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle = "#050505";

        const seeds = [

            [-0.10, -0.08],
            [0.10, -0.08],
            [-0.13, 0.10],
            [0.13, 0.10],
            [0, 0.18]

        ];

        seeds.forEach(
            seed => {

                ctx.beginPath();

                ctx.ellipse(
                    seed[0] *
                        tileSize,

                    seed[1] *
                        tileSize,

                    tileSize * 0.025,

                    tileSize * 0.045,

                    0,
                    0,
                    Math.PI * 2
                );

                ctx.fill();
            }
        );

        ctx.strokeStyle = "#00ff66";
        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            tileSize * 0.32,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }


    ctx.restore();
}


/* =================================
   DRAW SNAKE
   ================================= */

function drawSnake() {

    const alpha =
        deathAnimation
            ? Math.max(
                0,
                1 -
                deathTimer * 2
            )
            : 1;

    ctx.globalAlpha =
        alpha;

    snake.forEach(
        (part, index) => {

            let color;

            if (
                eatColorEffect > 0
            ) {

                color =
                    index === 0
                        ? "#ffffff"
                        : currentSnakeColor.main;

            } else {

                color =
                    index === 0
                        ? currentSnakeColor.main
                        : currentSnakeColor.body;
            }

            ctx.fillStyle =
                color;

            ctx.shadowBlur =
                index === 0
                    ? 18
                    : 8;

            ctx.shadowColor =
                color;

            const padding =
                tileSize * 0.07;

            ctx.beginPath();

            ctx.roundRect(

                part.x *
                    tileSize +
                    padding,

                part.y *
                    tileSize +
                    padding,

                tileSize -
                    padding * 2,

                tileSize -
                    padding * 2,

                tileSize * 0.18

            );

            ctx.fill();

        }
    );

    ctx.shadowBlur = 0;

    ctx.globalAlpha = 1;

    if (!deathAnimation)
        drawEyes();
}


/* =================================
   EYES
   ================================= */

function drawEyes() {

    const head =
        snake[0];

    ctx.fillStyle =
        "#050505";

    let eye1;

    let eye2;


    if (
        direction.x === 1
    ) {

        eye1 = {
            x:
                head.x *
                tileSize +
                tileSize * 0.72,
            y:
                head.y *
                tileSize +
                tileSize * 0.30
        };

        eye2 = {
            x:
                head.x *
                tileSize +
                tileSize * 0.72,
            y:
                head.y *
                tileSize +
                tileSize * 0.70
        };

    }


    else if (
        direction.x === -1
    ) {

        eye1 = {
            x:
                head.x *
                tileSize +
                tileSize * 0.28,
            y:
                head.y *
                tileSize +
                tileSize * 0.30
        };

        eye2 = {
            x:
                head.x *
                tileSize +
                tileSize * 0.28,
            y:
                head.y *
                tileSize +
                tileSize * 0.70
        };

    }


    else if (
        direction.y === -1
    ) {

        eye1 = {
            x:
                head.x *
                tileSize +
                tileSize * 0.30,
            y:
                head.y *
                tileSize +
                tileSize * 0.28
        };

        eye2 = {
            x:
                head.x *
                tileSize +
                tileSize * 0.70,
            y:
                head.y *
                tileSize +
                tileSize * 0.28
        };

    }


    else {

        eye1 = {
            x:
                head.x *
                tileSize +
                tileSize * 0.30,
            y:
                head.y *
                tileSize +
                tileSize * 0.72
        };

        eye2 = {
            x:
                head.x *
                tileSize +
                tileSize * 0.70,
            y:
                head.y *
                tileSize +
                tileSize * 0.72
        };
    }


    ctx.beginPath();

    ctx.arc(
        eye1.x,
        eye1.y,
        tileSize * 0.075,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        eye2.x,
        eye2.y,
        tileSize * 0.075,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


/* =================================
   DRAW
   ================================= */

function draw() {

    ctx.save();


    if (
        screenShake > 0
    ) {

        ctx.translate(

            (Math.random() - 0.5) *
                screenShake,

            (Math.random() - 0.5) *
                screenShake

        );

        screenShake *=
            Math.pow(
                0.88,
                frameScale
            );

        if (
            screenShake < 0.2
        ) {

            screenShake = 0;
        }
    }


    drawBackground();

    drawObstacles();

    drawFood();

    drawHeartItem();

    drawSpecialBomb();

    drawSnake();

    drawParticles();

    drawHeartParticles();

    drawSpecialBombExplosion();


    if (
        redFlash > 0
    ) {

        ctx.fillStyle =
            `rgba(
                255,
                0,
                0,
                ${redFlash * 0.22}
            )`;

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        redFlash *=
            Math.pow(
                0.90,
                frameScale
            );
    }


    if (
        obstacleFlash > 0
    ) {

        ctx.fillStyle =
            `rgba(
                255,
                120,
                0,
                ${obstacleFlash * 0.18}
            )`;

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        obstacleFlash *=
            Math.pow(
                0.88,
                frameScale
            );
    }


    /* SPECIAL BOMB FINAL FLASH */

    if (
        specialBombExplosion
    ) {

        const progress =
            Math.min(
                1,
                specialBombExplosionTimer /
                1.05
            );

        const flash =
            Math.max(
                0,
                0.45 -
                progress * 0.45
            );

        ctx.fillStyle =
            `rgba(
                255,
                40,
                0,
                ${flash}
            )`;

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );
    }


    ctx.restore();
}


/* =================================
   GAME LOOP
   ================================= */

function gameLoop(time) {

    const elapsed =
        Math.min(
            time - lastTime,
            250
        );

    frameScale =
        Math.max(
            0,
            elapsed
        ) / 16.6667;

    updateParticles();

    foodPulse +=
        Math.max(
            0,
            elapsed
        ) * 0.0048;


    if (
        heartItem
    ) {

        heartAnimationTime +=
            Math.max(
                0,
                elapsed
            );
    }


    if (
        eatColorEffect > 0
    ) {

        eatColorEffect *=
            Math.pow(
                0.91,
                frameScale
            );

        if (
            eatColorEffect < 0.02
        ) {

            eatColorEffect = 0;
        }
    }


    if (
        deathAnimation
    ) {

        deathTimer +=
            Math.max(
                0,
                elapsed
            ) / 1000;
    }


    if (
        specialBombExplosion
    ) {

        specialBombExplosionTimer +=
            Math.max(
                0,
                elapsed
            ) / 1000;

    }


    if (
        gameRunning
    ) {

        if (
            elapsed >=
            gameSpeed
        ) {

            update();

            lastTime =
                time;
        }
    }


    if (
        lastRenderTime === 0 ||
        time -
            lastRenderTime >=
            renderInterval
    ) {

        draw();

        lastRenderTime =
            time;
    }


    if (
        gameRunning ||
        particles.length > 0 ||
        foodParticles.length > 0 ||
        obstacleParticles.length > 0 ||
        heartParticles.length > 0 ||
        specialBombParticles.length > 0 ||
        redFlash > 0 ||
        obstacleFlash > 0 ||
        specialBombExplosion
    ) {

        animationFrameId =
            requestAnimationFrame(
                gameLoop
            );

    } else {

        animationFrameId =
            null;
    }
}


/* =================================
   KEYBOARD
   ================================= */

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();


        if (
            key === "w" ||
            key === "arrowup"
        ) {

            event.preventDefault();

            if (
                nextDirection.y !== 1
            ) {

                nextDirection = {
                    x: 0,
                    y: -1
                };
            }
        }


        else if (
            key === "s" ||
            key === "arrowdown"
        ) {

            event.preventDefault();

            if (
                nextDirection.y !== -1
            ) {

                nextDirection = {
                    x: 0,
                    y: 1
                };
            }
        }


        else if (
            key === "a" ||
            key === "arrowleft"
        ) {

            event.preventDefault();

            if (
                nextDirection.x !== 1
            ) {

                nextDirection = {
                    x: -1,
                    y: 0
                };
            }
        }


        else if (
            key === "d" ||
            key === "arrowright"
        ) {

            event.preventDefault();

            if (
                nextDirection.x !== -1
            ) {

                nextDirection = {
                    x: 1,
                    y: 0
                };
            }
        }


        else if (
            key === " " &&
            !gameRunning &&
            gameOverReady
        ) {

            event.preventDefault();

            restartGame();
        }

    }
);


/* =================================
   DIRECTION
   ================================= */

function setDirection(
    x,
    y
) {

    if (
        x === -nextDirection.x &&
        y === -nextDirection.y
    ) {

        return;
    }

    nextDirection = {
        x: x,
        y: y
    };
}


/* =================================
   FULLSCREEN
   ================================= */

async function toggleFullscreen() {

    try {

        const isFullscreen =
            document.fullscreenElement ||
            document.webkitFullscreenElement;

        if (!isFullscreen) {

            document.body.classList.add(
                "mobileFullscreen"
            );

            if (
                document.documentElement.requestFullscreen
            ) {

                try {

                    await document.documentElement
                        .requestFullscreen();

                } catch (error) {

                    console.log(
                        "Fullscreen API unavailable"
                    );

                }

            } else if (
                document.documentElement.webkitRequestFullscreen
            ) {

                try {

                    document.documentElement
                        .webkitRequestFullscreen();

                } catch (error) {

                    console.log(
                        "Webkit fullscreen unavailable"
                    );

                }

            }

        } else {

            document.body.classList.remove(
                "mobileFullscreen"
            );

            if (
                document.exitFullscreen
            ) {

                try {

                    await document.exitFullscreen();

                } catch (error) {}

            } else if (
                document.webkitExitFullscreen
            ) {

                try {

                    document.webkitExitFullscreen();

                } catch (error) {}

            }

        }

    } catch (error) {

        document.body.classList.toggle(
            "mobileFullscreen"
        );

    }

    setTimeout(() => {

        resizeCanvas();

        if (
            snake &&
            food
        ) {

            draw();

        }

    }, 150);
}

/* =================================
   FULLSCREEN CHANGE
   ================================= */

document.addEventListener(
    "fullscreenchange",
    () => {

        resizeCanvas();

        if (
            snake &&
            food
        ) {

            draw();
        }

    }
);


/* =================================
   RESIZE
   ================================= */

window.addEventListener(
    "resize",
    () => {

        resizeCanvas();

        if (
            snake &&
            food
        ) {

            draw();
        }

    }
);


document.addEventListener(
    "visibilitychange",
    () => {

        lastTime =
            performance.now();

        touchActive = false;

        touchDirectionLocked =
            false;

        touchPointerId = null;

    },
    {
        passive: true
    }
);


/* =================================
   INITIALIZE MENU
   ================================= */

resizeCanvas();

/*
   Game must NOT start automatically.
   Show the main menu first.
*/

gameRunning = false;

gameOverReady = false;

if (navbar) {

    navbar.style.display =
        "none";
}

if (gameContainer) {

    gameContainer.style.display =
        "none";
}

if (mainMenu) {

    mainMenu.style.display =
        "flex";
}

if (difficultyMenu) {

    difficultyMenu.style.display =
        "none";
}

/*
   Menu music starts after the user
   interacts with the page.
*/

document.addEventListener(
    "pointerdown",
    () => {

        if (
            mainMenu.style.display !==
            "none"
        ) {

            startMenuMusic();
        }

    },
    {
        passive: true
    }
);
