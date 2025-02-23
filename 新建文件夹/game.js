const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#00FFFF', // Start with cyan background
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let level = 1;
let stage = 1;
let lives = 3;
let questionText;
let answerButtons = [];
let selectedLanguage = 'english'; // Default language
const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']; // Colorful colors

// Language-specific text
const languageText = {
    english: {
        madeBy: 'Made by William',
        stage: 'Stage',
        level: 'Level',
        lives: 'Lives',
        gameOver: 'Game Over',
        restart: 'Restart',
        clearCache: 'Clear Cache',
        clearCacheWarning: 'Warning: This will delete your game progress!',
        confirm: 'Confirm',
        cancel: 'Cancel',
        youWin: 'You Win! 100,000 Aura'
    },
    chinese: {
        madeBy: '由威廉制作',
        stage: '阶段',
        level: '等级',
        lives: '生命',
        gameOver: '游戏结束',
        restart: '重新开始',
        clearCache: '清除缓存',
        clearCacheWarning: '警告：这将删除您的游戏进度！',
        confirm: '确认',
        cancel: '取消',
        youWin: '你赢了！100,000 灵气'
    },
    japanese: {
        madeBy: 'ウィリアム作成',
        stage: 'ステージ',
        level: 'レベル',
        lives: 'ライフ',
        gameOver: 'ゲームオーバー',
        restart: '再開',
        clearCache: 'キャッシュをクリア',
        clearCacheWarning: '警告：これによりゲームの進捗が削除されます！',
        confirm: '確認',
        cancel: 'キャンセル',
        youWin: 'あなたの勝ち！100,000 オーラ'
    },
    korean: {
        madeBy: '윌리엄 제작',
        stage: '스테이지',
        level: '레벨',
        lives: '생명',
        gameOver: '게임 오버',
        restart: '재시작',
        clearCache: '캐시 지우기',
        clearCacheWarning: '경고: 이 작업은 게임 진행 상황을 삭제합니다!',
        confirm: '확인',
        cancel: '취소',
        youWin: '당신이 이겼습니다! 100,000 오라'
    }
};

// 100 unique questions with clear context
const questions = [
    { question: "Which punctuation is missing: 'Hello __ world'", options: [",", ".", "!", "?"], answer: "," },
    { question: "Which punctuation is missing: 'How are you __'", options: [".", "!", "?", ","], answer: "?" },
    { question: "Which punctuation is missing: 'I love coding __'", options: [".", "!", "?", ","], answer: "!" },
    { question: "Which punctuation is missing: 'The sky is blue __'", options: [".", "!", "?", ","], answer: "." },
    { question: "Which punctuation is missing: 'Wow __ that's amazing'", options: [",", ".", "!", "?"], answer: "!" },
    { question: "Which punctuation is missing: 'What is your name __'", options: [".", "!", "?", ","], answer: "?" },
    { question: "Which punctuation is missing: 'Let's go to the park __'", options: [".", "!", "?", ","], answer: "." },
    { question: "Which punctuation is missing: 'This is so exciting __'", options: [".", "!", "?", ","], answer: "!" },
    { question: "Which punctuation is missing: 'She said __ Hello __'", options: ["'", '"', ".", ","], answer: '"' },
    { question: "Which punctuation is missing: 'The cat __ sat on the mat'", options: [",", ".", "!", "?"], answer: "," },
    // Add 90 more questions here...
];

// Punctuation marks grouped by difficulty
const punctuationMarks = {
    easy: ['.', ',', '!', '?'],
    medium: [';', ':', '"', "'"],
    hard: ['(', ')', '—', '…']
};

function preload() {
    this.load.image('button', 'button.png');
}

function create() {
    // Show language selection menu at the start
    if (!localStorage.getItem("language")) {
        showLanguageMenu.call(this);
    } else {
        selectedLanguage = localStorage.getItem("language");
        startGame.call(this);
    }
}

function showLanguageMenu() {
    const languages = ['english', 'chinese', 'japanese', 'korean'];
    languages.forEach((lang, index) => {
        let button = this.add.text(300, 200 + index * 50, lang.toUpperCase(), {
            fontSize: '24px',
            fill: '#FFF',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .on('pointerdown', () => {
                selectedLanguage = lang;
                localStorage.setItem("language", lang);
                this.scene.restart(); // Restart the scene to apply the selected language
            });
    });
}

function startGame() {
    loadProgress(); // Load saved progress
    this.cameras.main.setBackgroundColor('#00FFFF'); // Set initial background to cyan
    this.add.text(20, 20, languageText[selectedLanguage].madeBy, { fontSize: '20px', fill: '#FFF' });
    this.stageText = this.add.text(20, 50, `${languageText[selectedLanguage].stage}: ${stage}`, { fontSize: '20px', fill: '#FFF' });
    this.levelText = this.add.text(20, 80, `${languageText[selectedLanguage].level}: ${level}`, { fontSize: '20px', fill: '#FFF' });
    this.livesText = this.add.text(20, 110, `${languageText[selectedLanguage].lives}: ${lives}`, { fontSize: '20px', fill: '#FFF' });

    // Add Clear Cache button
    let clearCacheButton = this.add.text(600, 20, languageText[selectedLanguage].clearCache, {
        fontSize: '20px',
        fill: '#FFF',
        backgroundColor: '#333',
        padding: { x: 10, y: 5 }
    })
        .setInteractive()
        .on('pointerdown', () => showClearCacheWarning.call(this));

    questionText = this.add.text(200, 200, '', {
        fontSize: '24px',
        fill: '#FFF',
        wordWrap: { width: 600 } // Ensure text wraps within the screen
    });
    generateQuestion.call(this);
}

function showClearCacheWarning() {
    // Destroy existing warning elements if any
    if (this.warningText) this.warningText.destroy();
    if (this.confirmButton) this.confirmButton.destroy();
    if (this.cancelButton) this.cancelButton.destroy();

    // Create warning text
    this.warningText = this.add.text(200, 300, languageText[selectedLanguage].clearCacheWarning, {
        fontSize: '24px',
        fill: '#FFF',
        wordWrap: { width: 400 }
    });

    // Create confirm button
    this.confirmButton = this.add.text(300, 400, languageText[selectedLanguage].confirm, {
        fontSize: '24px',
        fill: '#FFF',
        backgroundColor: '#333',
        padding: { x: 10, y: 5 }
    })
        .setInteractive()
        .on('pointerdown', () => {
            localStorage.clear(); // Clear all saved progress
            this.scene.restart(); // Restart the game
        });

    // Create cancel button
    this.cancelButton = this.add.text(500, 400, languageText[selectedLanguage].cancel, {
        fontSize: '24px',
        fill: '#FFF',
        backgroundColor: '#333',
        padding: { x: 10, y: 5 }
    })
        .setInteractive()
        .on('pointerdown', () => {
            this.warningText.destroy();
            this.confirmButton.destroy();
            this.cancelButton.destroy();
        });
}

function generateQuestion() {
    if (level > 100) {
        // Player has completed all 100 questions
        this.add.text(200, 300, languageText[selectedLanguage].youWin, { fontSize: '40px', fill: '#FFF' });
        return;
    }

    let questionData = questions[level - 1]; // Get the current question
    let correctAnswer = questionData.answer;
    let answers = [correctAnswer];
    
    // Add random incorrect answers based on difficulty
    while (answers.length < 4) {
        let randomMark = Phaser.Math.RND.pick(punctuationMarks[getDifficulty()]);
        if (!answers.includes(randomMark)) {
            answers.push(randomMark);
        }
    }
    Phaser.Utils.Array.Shuffle(answers);

    questionText.setText(questionData.question);

    answerButtons.forEach(button => button.destroy());
    answerButtons = [];
    
    for (let i = 0; i < answers.length; i++) {
        let btn = this.add.text(200, 250 + i * 50, answers[i], {
            fontSize: '24px',
            fill: '#FFF',
            backgroundColor: '#333',
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .on('pointerdown', () => checkAnswer.call(this, answers[i], correctAnswer));
        answerButtons.push(btn);
    }
}

function getDifficulty() {
    if (stage <= 3) return 'easy';
    if (stage <= 6) return 'medium';
    return 'hard'; // Stage 7 and above
}

function checkAnswer(selected, correct) {
    if (selected === correct) {
        level++;
        if (level % 10 === 1) {
            stage++;
            let randomColor = colors[Math.floor(Math.random() * colors.length)];
            this.cameras.main.setBackgroundColor(randomColor); // Change background every 10 levels
        }
        this.levelText.setText(`${languageText[selectedLanguage].level}: ${level}`);
        this.stageText.setText(`${languageText[selectedLanguage].stage}: ${stage}`);
        saveProgress(); // Auto-save progress
        generateQuestion.call(this);
    } else {
        lives--;
        if (lives < 0) lives = 0; // Prevent lives from going below 0
        this.livesText.setText(`${languageText[selectedLanguage].lives}: ${lives}`);
        if (lives === 0) {
            gameOver.call(this);
        } else {
            saveProgress(); // Auto-save progress
            generateQuestion.call(this);
        }
    }
}

function gameOver() {
    this.add.text(300, 300, languageText[selectedLanguage].gameOver, { fontSize: '40px', fill: '#FFF' });
    
    // Add restart button
    let restartButton = this.add.text(350, 400, languageText[selectedLanguage].restart, {
        fontSize: '24px',
        fill: '#FFF',
        backgroundColor: '#333',
        padding: { x: 10, y: 5 }
    })
        .setInteractive()
        .on('pointerdown', () => {
            localStorage.clear(); // Clear saved progress
            this.scene.restart(); // Restart the game
        });
}

// Save progress to localStorage
function saveProgress() {
    localStorage.setItem("stage", stage);
    localStorage.setItem("level", level);
    localStorage.setItem("lives", lives);
}

// Load progress from localStorage
function loadProgress() {
    if (localStorage.getItem("stage")) {
        stage = parseInt(localStorage.getItem("stage"));
        level = parseInt(localStorage.getItem("level"));
        lives = parseInt(localStorage.getItem("lives"));
    }
}

function update() {}