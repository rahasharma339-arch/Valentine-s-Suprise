(function () {
  'use strict';

  // State
  let hisName = '';
  let herName = '';
  let points = 0;

  // Surprise unlock
  const TARGET_POINTS = 300;

  // Scoring (replayable — points always increase)
  const MAZE_POINTS = 80;
  const QUIZ_POINTS_PER = 10; // 10 questions, 10 seconds each
  const PUZZLE_POINTS = 90;
  const SCRAMBLE_POINTS = 60;
  const MATH_POINTS_PER = 10;
  const MATH_POINTS_MAX = 100;
  const CATCH_POINTS_PER_HEART = 10;

  // Elements
  const nameScreen = document.getElementById('name-screen');
  const valentineScreen = document.getElementById('valentine-screen');
  const gameScreen = document.getElementById('game-screen');
  const winScreen = document.getElementById('win-screen');
  const messageScreen = document.getElementById('message-screen');
  const nameForm = document.getElementById('name-form');
  const pointsValue = document.getElementById('points-value');
  const pageTitle = document.getElementById('page-title');
  const claimSurpriseBtn = document.getElementById('claim-surprise');
  const winNamesEl = document.querySelector('.win-names');
  const seeMessageBtn = document.getElementById('see-message');
  const replayBtn = document.getElementById('replay');
  const messageBoyfriendEl = document.getElementById('message-boyfriend');

  const valentineBoyfriend = document.getElementById('valentine-boyfriend');
  const valentineYes = document.getElementById('valentine-yes');
  const valentineNo = document.getElementById('valentine-no');
  const valentineActions = document.getElementById('valentine-actions');
  const valentineStatus = document.getElementById('valentine-status');

  const mazeModal = document.getElementById('maze-modal');
  const mazeTimerEl = document.getElementById('maze-timer');
  const mazeCanvas = document.getElementById('maze-canvas');
  const mazeStatus = document.getElementById('maze-status');
  const quizModal = document.getElementById('quiz-modal');
  const quizQuestion = document.getElementById('quiz-question');
  const quizOptions = document.getElementById('quiz-options');
  const quizFeedback = document.getElementById('quiz-feedback');
  const quizTimerEl = document.getElementById('quiz-timer');
  const puzzleModal = document.getElementById('puzzle-modal');
  const puzzleGrid = document.getElementById('puzzle-grid');
  const puzzleTimerEl = document.getElementById('puzzle-timer');

  const scrambleModal = document.getElementById('scramble-modal');
  const scrambleWordEl = document.getElementById('scramble-word');
  const scrambleInput = document.getElementById('scramble-input');
  const scrambleSubmit = document.getElementById('scramble-submit');
  const scrambleStatus = document.getElementById('scramble-status');
  const scrambleTimerEl = document.getElementById('scramble-timer');

  const mathModal = document.getElementById('math-modal');
  const mathTimerEl = document.getElementById('math-timer');
  const mathQuestionEl = document.getElementById('math-question');
  const mathInput = document.getElementById('math-input');
  const mathSubmit = document.getElementById('math-submit');
  const mathStatus = document.getElementById('math-status');

  const catchModal = document.getElementById('catch-modal');
  const catchTimerEl = document.getElementById('catch-timer');
  const catchLivesEl = document.getElementById('catch-lives');
  const catchScoreEl = document.getElementById('catch-score');
  const catchCanvas = document.getElementById('catch-canvas');
  const catchStatus = document.getElementById('catch-status');

  // Collector layer
  const collectorLayer = document.getElementById('collector-layer');
  const collectorHearts = document.getElementById('collector-hearts');
  const bonusPop = document.getElementById('bonus-pop');
  const heartBasket = document.getElementById('heart-basket');

  // Quiz
  /** @type {Array<{q: string; options: string[]; correct: number; hidden: string;}>} */
  let quizQuestions = [];
  let quizIndex = 0;
  let quizTimeLeft = 10;
  let quizTimer = null;
  let quizAnswered = false;

  // Puzzle
  let puzzleBoard = [];
  let puzzleSolved = false;
  let puzzleTimeLeft = 90;
  let puzzleTimer = null;

  // Word scramble
  const SCRAMBLE_WORDS = ['VALENTINE', 'CHOCOLATE', 'FOREVER', 'CUPID', 'HUGS'];
  let scrambleIndex = 0;
  let scrambleDone = false;
  let scrambleTimeLeft = 60;
  let scrambleTimer = null;

  // Math sprint
  let mathTimeLeft = 60;
  let mathCorrect = 0;
  let mathEarned = 0;
  let mathTimer = null;
  let currentMathAnswer = null;

  // Maze
  /** @type {{grid:number[][], rows:number, cols:number, cell:number, player:{r:number,c:number}, goal:{r:number,c:number}}} */
  let maze = null;
  let mazeTimeLeft = 45;
  let mazeTimer = null;
  let mazeHasFocus = false;

  // Catch the Hearts
  let catchBasketX = 0;
  let catchLives = 3;
  let catchScore = 0;
  let catchTimeLeft = 60;
  let catchTimer = null;
  let catchGameLoop = null;
  let catchFalling = [];
  let catchRunning = false;
  const CATCH_BASKET_W = 72;
  const CATCH_BASKET_H = 28;
  const CATCH_ITEM_SIZE = 28;
  const CATCH_FALL_SPEED = 2.2;
  const CATCH_SPAWN_INTERVAL = 1100;
  const CATCH_BOMB_CHANCE = 0.28;

  // --- Name form ---
  nameForm.addEventListener('submit', function (e) {
    e.preventDefault();
    hisName = document.getElementById('his-name').value.trim();
    herName = document.getElementById('her-name').value.trim();

    if (!hisName) hisName = 'Your Love';
    if (!herName) herName = 'Your Girlfriend';

    pageTitle.textContent = `Valentine's surprise for ${hisName}`;
    winNamesEl.textContent = `${hisName} & ${herName} 💕`;
    quizQuestions = buildQuizQuestions(hisName, herName);
    nameScreen.classList.remove('active');
    valentineBoyfriend.textContent = hisName;
    valentineStatus.textContent = '';
    valentineScreen.classList.add('active');
  });

  // --- Points & claim ---
  function addPoints(amount) {
    points += amount;
    pointsValue.textContent = points;
    pointsValue.classList.remove('points-pop');
    // reflow for animation restart
    void pointsValue.offsetWidth;
    pointsValue.classList.add('points-pop');
    if (points >= TARGET_POINTS) {
      claimSurpriseBtn.disabled = false;
      claimSurpriseBtn.textContent = 'Claim my surprise! 💕';
    }
  }

  claimSurpriseBtn.addEventListener('click', function () {
    if (points < TARGET_POINTS) return;
    stopHeartCollectors();
    gameScreen.classList.remove('active');
    winScreen.classList.add('active');
    spawnConfetti();
  });

  const messageRevealWrap = document.getElementById('message-reveal-wrap');
  const revealMessageBtn = document.getElementById('reveal-message-btn');

  seeMessageBtn.addEventListener('click', function () {
    winScreen.classList.remove('active');
    messageScreen.classList.add('active');
    buildJumbledMessage();
  });

  function jumbleWord(str) {
    if (str.length <= 2) return str;
    const letters = str.split('');
    shuffle(letters);
    const out = letters.join('');
    return out === str ? jumbleWord(str) : out;
  }

  function buildJumbledMessage() {
    var bf = hisName || 'You';
    var gf = herName || 'Rutuja';
    var lines = [
      bf + ', you just made it through all the games—and you make every day feel like a win.',
      "Thank you for being you. Here's to more adventures, more laughs, and more love.",
      "Happy Valentine's Day. Love you always.",
      '— ' + gf + ' 💕'
    ];
    messageRevealWrap.innerHTML = '';
    lines.forEach(function (line, lineIndex) {
      var p = document.createElement('p');
      if (lineIndex === 3) p.className = 'signature';
      var tokens = line.match(/\S+|\s+/g) || [];
      tokens.forEach(function (token) {
        if (/^\s+$/.test(token)) {
          p.appendChild(document.createTextNode(token));
        } else {
          var real = token;
          var jumbled = real.length > 1 ? jumbleWord(real) : real;
          var span = document.createElement('span');
          span.className = 'message-word';
          span.setAttribute('data-real', real);
          span.textContent = jumbled;
          p.appendChild(span);
        }
      });
      messageRevealWrap.appendChild(p);
    });
    revealMessageBtn.style.display = '';
    revealMessageBtn.disabled = false;
  }

  revealMessageBtn.addEventListener('click', function () {
    revealMessageBtn.disabled = true;
    revealMessageBtn.style.display = 'none';
    var words = messageRevealWrap.querySelectorAll('.message-word');
    var delay = 0;
    var step = 90;
    words.forEach(function (span) {
      setTimeout(function () {
        span.textContent = span.getAttribute('data-real');
        span.classList.add('revealed');
      }, delay);
      delay += step;
    });
  });

  replayBtn.addEventListener('click', function () {
    points = 0;
    stopAllTimers();
    stopHeartCollectors();
    quizIndex = 0;
    quizAnswered = false;
    quizTimeLeft = 10;
    puzzleSolved = false;
    scrambleIndex = 0;
    scrambleDone = false;
    maze = null;
    catchRunning = false;
    catchLives = 3;
    catchScore = 0;
    pointsValue.textContent = '0';
    claimSurpriseBtn.disabled = true;
    claimSurpriseBtn.textContent = 'Claim my surprise!';
    messageScreen.classList.remove('active');
    winScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    nameScreen.classList.add('active');
    resetPuzzle();
    resetScramble();
    resetMath();
    resetMaze();
    resetCatch();
  });

  // --- Modals open/close ---
  function openModal(modal) {
    modal.classList.add('active');
  }

  function closeModal(modal) {
    modal.classList.remove('active');
    if (modal === mathModal) resetMath();
    if (modal === quizModal) stopQuizTimer();
    if (modal === puzzleModal) stopPuzzleTimer();
    if (modal === scrambleModal) stopScrambleTimer();
    if (modal === mazeModal) stopMazeTimer();
    if (modal === catchModal) stopCatchGame();
  }

  document.querySelectorAll('.modal-close').forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeModal(btn.closest('.modal'));
    });
  });

  document.querySelectorAll('.game-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.classList.contains('btn-game')) {
        const game = card.getAttribute('data-game');
        if (game === 'maze') {
          initMaze();
          openModal(mazeModal);
        } else if (game === 'quiz') {
          initQuiz();
          openModal(quizModal);
        } else if (game === 'puzzle') {
          initPuzzle();
          openModal(puzzleModal);
        } else if (game === 'scramble') {
          initScramble();
          openModal(scrambleModal);
        } else if (game === 'math') {
          initMath();
          openModal(mathModal);
        } else if (game === 'catch') {
          initCatch();
          openModal(catchModal);
        }
      }
    });
  });

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // --- Quiz ---
  function buildQuizQuestions(bfName, gfName) {
    const gf = gfName || 'your girlfriend';
    const bf = bfName || 'you';

    return [
      {
        q: `Where did you and ${gf} met for the first time?`,
        options: ['In a bar for date', 'At college', 'At a wedding', 'In a bookstore'],
        correct: 0,
        hidden: 'hehe we met on hinge'
      },
      {
        q: `What is ${gf}'s favourite food?`,
        options: ['Paneer', 'Bhindi', 'Pasta', 'Biryani'],
        correct: 1,
        hidden: 'heheeee you Mr. gluteneee'
      },
      {
        q: `What kind of feeling does ${gf} have for you, ${bf}?`,
        options: ['Like 💖', 'Meh 😐', 'Confused 🤔', 'Angry 😤'],
        correct: 0,
        hidden: 'Hate you'
      },
      {
        q: 'Why are you so positive about this relationship?',
        options: ['Just feel it', 'Because I read it somewhere', 'Because of luck', 'No idea'],
        correct: 0,
        hidden: 'Aww....'
      },
      {
        q: `Finance check: If you invest ₹1,000 at 10% simple interest for 2 years, you get…`,
        options: ['₹1,100', '₹1,200', '₹1,210', '₹2,000'],
        correct: 1,
        hidden: 'Look at you… Warren Buffett.'
      },
      {
        q: `What should you do when ${gf} is stressed?`,
        options: ['Listen and hug', 'Disappear', 'Say “relax”', 'Give a lecture'],
        correct: 0,
        hidden: 'Hug coupon unlocked.'
      },
      {
        q: `Finance check: Diversification means…`,
        options: ['All money in one stock', 'Spreading risk', 'Only cash', 'Only crypto'],
        correct: 1,
        hidden: 'Risk manager mode: ON.'
      },
      {
        q: `Which one is a \"green flag\" in a relationship?`,
        options: ['Honesty', 'Ghosting', 'Jealous games', 'Silent treatment'],
        correct: 0,
        hidden: 'Good answer… keep it up.'
      },
      {
        q: `Finance check: Emergency fund is best described as…`,
        options: ['Money for parties', 'Backup cash for surprises', 'Loan EMI', 'Vacation budget'],
        correct: 1,
        hidden: 'Prepared AND cute.'
      },
      {
        q: `Final one: ${bf} + ${gf} =`,
        options: ['Best team', 'Forever', '💕', 'All of the above'],
        correct: 3,
        hidden: 'Aww. Now go win the games.'
      }
    ];
  }

  function initQuiz() {
    quizIndex = 0;
    quizFeedback.classList.add('hidden');
    if (!quizQuestions.length) quizQuestions = buildQuizQuestions(hisName, herName);
    showQuizQuestion();
  }

  function showQuizQuestion() {
    if (quizIndex >= quizQuestions.length) {
      closeModal(quizModal);
      return;
    }

    const item = quizQuestions[quizIndex];
    quizQuestion.textContent = item.q;
    quizFeedback.classList.add('hidden');
    quizFeedback.classList.remove('correct', 'wrong');
    quizOptions.innerHTML = '';
    quizAnswered = false;
    startQuizTimer();

    item.options.forEach(function (opt, i) {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.type = 'button';
      btn.addEventListener('click', function () {
        if (quizAnswered) return;
        quizAnswered = true;
        stopQuizTimer();
        // lock options
        for (let j = 0; j < quizOptions.children.length; j++) {
          quizOptions.children[j].disabled = true;
        }

        const gotIt = i === item.correct;
        if (gotIt) btn.classList.add('correct');
        else btn.classList.add('wrong');

        let msg = '';
        if (gotIt) {
          addPoints(QUIZ_POINTS_PER);
          msg = `Correct! +${QUIZ_POINTS_PER} points — ${item.hidden}`;
          quizFeedback.classList.add('correct');
        } else {
          msg = `Oops! — ${item.hidden}`;
          quizFeedback.classList.add('wrong');
        }

        quizFeedback.textContent = msg;
        quizFeedback.classList.remove('hidden');

        quizIndex++;
        setTimeout(function () {
          showQuizQuestion();
        }, 1400);
      });
      quizOptions.appendChild(btn);
    });
  }

  function startQuizTimer() {
    stopQuizTimer();
    quizTimeLeft = 10;
    quizTimerEl.textContent = `${quizTimeLeft}s`;
    quizTimer = setInterval(function () {
      quizTimeLeft--;
      quizTimerEl.textContent = `${quizTimeLeft}s`;
      if (quizTimeLeft <= 0) {
        stopQuizTimer();
        if (quizAnswered) return;
        quizAnswered = true;
        // timeout: show hidden message and move on
        const item = quizQuestions[quizIndex];
        for (let j = 0; j < quizOptions.children.length; j++) {
          quizOptions.children[j].disabled = true;
        }
        quizFeedback.textContent = `Time's up! — ${item.hidden}`;
        quizFeedback.classList.remove('hidden');
        quizFeedback.classList.add('wrong');
        quizIndex++;
        setTimeout(function () {
          showQuizQuestion();
        }, 900);
      }
    }, 1000);
  }

  function stopQuizTimer() {
    if (quizTimer) {
      clearInterval(quizTimer);
      quizTimer = null;
    }
  }

  // --- Puzzle (sliding 8-puzzle) ---
  function initPuzzle() {
    puzzleSolved = false;
    startPuzzleTimer();
    // Start solved and do random valid moves to guarantee solvable
    puzzleBoard = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 = blank
    let blank = 8;
    for (let i = 0; i < 120; i++) {
      const moves = getAdjacentIndices(blank);
      const next = moves[Math.floor(Math.random() * moves.length)];
      [puzzleBoard[blank], puzzleBoard[next]] = [puzzleBoard[next], puzzleBoard[blank]];
      blank = next;
    }
    renderPuzzle();
  }

  function resetPuzzle() {
    puzzleGrid.innerHTML = '';
  }

  function renderPuzzle() {
    puzzleGrid.innerHTML = '';
    puzzleBoard.forEach(function (val, idx) {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'puzzle-piece';
      tile.dataset.idx = String(idx);
      tile.dataset.val = String(val);
      if (val === 0) {
        tile.classList.add('blank');
        tile.textContent = '';
        tile.disabled = true;
      } else {
        tile.textContent = String(val);
      }
      tile.addEventListener('click', onPuzzleTileClick);
      puzzleGrid.appendChild(tile);
    });
  }

  function getAdjacentIndices(i) {
    const adj = [];
    const row = Math.floor(i / 3);
    const col = i % 3;
    if (row > 0) adj.push(i - 3);
    if (row < 2) adj.push(i + 3);
    if (col > 0) adj.push(i - 1);
    if (col < 2) adj.push(i + 1);
    return adj;
  }

  function isPuzzleSolved() {
    for (let i = 0; i < 8; i++) {
      if (puzzleBoard[i] !== i + 1) return false;
    }
    return puzzleBoard[8] === 0;
  }

  function onPuzzleTileClick(e) {
    if (puzzleSolved) return;
    const idx = parseInt(e.currentTarget.dataset.idx, 10);
    const blank = puzzleBoard.indexOf(0);
    if (!getAdjacentIndices(blank).includes(idx)) return;

    [puzzleBoard[blank], puzzleBoard[idx]] = [puzzleBoard[idx], puzzleBoard[blank]];
    renderPuzzle();

    // enable blank button after re-render
    const blankBtn = puzzleGrid.querySelector('.puzzle-piece.blank');
    if (blankBtn) blankBtn.disabled = true;

    if (isPuzzleSolved()) {
      puzzleSolved = true;
      stopPuzzleTimer();
      addPoints(PUZZLE_POINTS);
      setTimeout(function () {
        closeModal(puzzleModal);
      }, 700);
    }
  }

  function startPuzzleTimer() {
    stopPuzzleTimer();
    puzzleTimeLeft = 90;
    puzzleTimerEl.textContent = `${puzzleTimeLeft}s`;
    puzzleTimer = setInterval(function () {
      puzzleTimeLeft--;
      puzzleTimerEl.textContent = `${puzzleTimeLeft}s`;
      if (puzzleTimeLeft <= 0) {
        stopPuzzleTimer();
        puzzleSolved = true;
        // time out (no points)
        setTimeout(function () {
          closeModal(puzzleModal);
        }, 600);
      }
    }, 1000);
  }

  function stopPuzzleTimer() {
    if (puzzleTimer) {
      clearInterval(puzzleTimer);
      puzzleTimer = null;
    }
  }

  // --- Word scramble ---
  function initScramble() {
    scrambleIndex = 0;
    scrambleDone = false;
    scrambleInput.value = '';
    scrambleStatus.textContent = '';
    startScrambleTimer();
    showScrambleWord();
  }

  function resetScramble() {
    stopScrambleTimer();
    scrambleInput.value = '';
    scrambleStatus.textContent = '';
    scrambleWordEl.textContent = '';
    scrambleTimerEl.textContent = '60s';
  }

  function scrambleWord(word) {
    const chars = word.split('');
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const out = chars.join('');
    return out === word ? scrambleWord(word) : out;
  }

  function showScrambleWord() {
    const word = SCRAMBLE_WORDS[scrambleIndex];
    scrambleWordEl.textContent = scrambleWord(word);
    scrambleStatus.textContent = `Word ${scrambleIndex + 1} of ${SCRAMBLE_WORDS.length}`;
    scrambleInput.value = '';
    scrambleInput.focus();
  }

  scrambleSubmit.addEventListener('click', function () {
    if (scrambleDone) return;
    const guess = (scrambleInput.value || '').trim().toUpperCase();
    const answer = SCRAMBLE_WORDS[scrambleIndex];
    if (!guess) return;

    if (guess === answer) {
      scrambleIndex++;
      if (scrambleIndex >= SCRAMBLE_WORDS.length) {
        scrambleDone = true;
        scrambleWordEl.textContent = '✅ Completed!';
        stopScrambleTimer();
        addPoints(SCRAMBLE_POINTS);
        scrambleStatus.textContent = `Perfect! +${SCRAMBLE_POINTS} points`;
        setTimeout(function () {
          closeModal(scrambleModal);
        }, 900);
      } else {
        showScrambleWord();
      }
    } else {
      scrambleStatus.textContent = 'Nope — try again 😉';
    }
  });

  scrambleInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      scrambleSubmit.click();
    }
  });

  function startScrambleTimer() {
    stopScrambleTimer();
    scrambleTimeLeft = 60;
    scrambleTimerEl.textContent = `${scrambleTimeLeft}s`;
    scrambleTimer = setInterval(function () {
      scrambleTimeLeft--;
      scrambleTimerEl.textContent = `${scrambleTimeLeft}s`;
      if (scrambleTimeLeft <= 0) {
        stopScrambleTimer();
        scrambleDone = true;
        scrambleStatus.textContent = `Time's up!`;
        setTimeout(function () {
          closeModal(scrambleModal);
        }, 700);
      }
    }, 1000);
  }

  function stopScrambleTimer() {
    if (scrambleTimer) {
      clearInterval(scrambleTimer);
      scrambleTimer = null;
    }
  }

  // --- Math sprint ---
  function initMath() {
    resetMath();
    nextMathQuestion();
    startMathTimer();
    mathInput.focus();
  }

  function resetMath() {
    if (mathTimer) {
      clearInterval(mathTimer);
      mathTimer = null;
    }
    mathTimeLeft = 60;
    mathCorrect = 0;
    mathEarned = 0;
    currentMathAnswer = null;
    mathTimerEl.textContent = '60s';
    mathQuestionEl.textContent = '';
    mathInput.value = '';
    mathStatus.textContent = '';
    mathSubmit.textContent = 'Go';
  }

  function startMathTimer() {
    mathTimerEl.textContent = `${mathTimeLeft}s`;
    mathTimer = setInterval(function () {
      mathTimeLeft--;
      mathTimerEl.textContent = `${mathTimeLeft}s`;
      if (mathTimeLeft <= 0) {
        clearInterval(mathTimer);
        mathTimer = null;
        finishMathRun();
      }
    }, 1000);
  }

  function nextMathQuestion() {
    const pick = Math.random();
    let q = '';
    let ans = 0;

    // Finance-flavoured but still quick mental math.
    if (pick < 0.34) {
      // Simple interest: P * R * T / 100
      const P = [500, 800, 1000, 1500, 2000][Math.floor(Math.random() * 5)];
      const R = [5, 8, 10, 12][Math.floor(Math.random() * 4)];
      const T = [1, 2, 3][Math.floor(Math.random() * 3)];
      q = `SI on ₹${P} @ ${R}% for ${T}y = ?`;
      ans = (P * R * T) / 100;
    } else if (pick < 0.67) {
      // Percentage off / markup
      const base = [200, 250, 300, 400, 500][Math.floor(Math.random() * 5)];
      const pct = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
      q = `${pct}% of ₹${base} = ?`;
      ans = (pct * base) / 100;
    } else {
      // Monthly savings goal
      const goal = [12000, 18000, 24000, 30000][Math.floor(Math.random() * 4)];
      const months = [3, 4, 6][Math.floor(Math.random() * 3)];
      q = `Save ₹${goal} in ${months} months → per month = ?`;
      ans = goal / months;
    }
    currentMathAnswer = ans;
    mathQuestionEl.textContent = q;
    mathInput.value = '';
  }

  function finishMathRun() {
    mathSubmit.disabled = true;
    mathInput.disabled = true;

    mathStatus.textContent = `Time! Correct: ${mathCorrect}. You earned +${mathEarned} points.`;

    setTimeout(function () {
      mathSubmit.disabled = false;
      mathInput.disabled = false;
      closeModal(mathModal);
    }, 1200);
  }

  function submitMathAnswer() {
    if (mathTimeLeft <= 0 || currentMathAnswer === null) return;
    const val = Number(mathInput.value);
    if (!Number.isFinite(val)) return;

    if (val === currentMathAnswer) {
      mathCorrect++;
      if (mathEarned < MATH_POINTS_MAX) {
        const add = Math.min(MATH_POINTS_PER, MATH_POINTS_MAX - mathEarned);
        mathEarned += add;
        addPoints(add);
      }
      mathStatus.textContent = `✅ Correct! (+${MATH_POINTS_PER}, max ${MATH_POINTS_MAX})`;
    } else {
      mathStatus.textContent = '❌ Not quite — next one!';
    }
    nextMathQuestion();
  }

  mathSubmit.addEventListener('click', function () {
    if (!mathTimer) {
      initMath();
      return;
    }
    submitMathAnswer();
  });

  mathInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitMathAnswer();
    }
  });

  // --- Fun click hearts ---
  (function attachClickHearts() {
    const hearts = ['💕', '💖', '💝', '💗', '🌸', '✨'];
    document.addEventListener('click', function (e) {
      // keep it subtle on form controls
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'button' || tag === 'summary') return;

      const el = document.createElement('div');
      el.className = 'click-heart';
      el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.fontSize = `${14 + Math.floor(Math.random() * 10)}px`;
      document.body.appendChild(el);
      setTimeout(function () {
        el.remove();
      }, 950);
    });
  })();

  // --- Valentine screen: runaway NO ---
  (function initValentineScreen() {
    function randomWithinViewport(w, h) {
      const pad = 12;
      const maxX = Math.max(pad, window.innerWidth - w - pad);
      const maxY = Math.max(pad, window.innerHeight - h - pad);
      const x = pad + Math.floor(Math.random() * (maxX - pad + 1));
      const y = pad + Math.floor(Math.random() * (maxY - pad + 1));
      return { x, y };
    }

    function moveNoButton() {
      const btnRect = valentineNo.getBoundingClientRect();
      const w = btnRect.width;
      const h = btnRect.height;
      const pos = randomWithinViewport(w, h);
      // Run anywhere on the screen
      valentineNo.style.position = 'fixed';
      valentineNo.style.left = `${pos.x}px`;
      valentineNo.style.top = `${pos.y}px`;
    }

    valentineNo.addEventListener('mouseenter', moveNoButton);
    valentineNo.addEventListener('mousemove', moveNoButton);
    valentineNo.addEventListener('click', moveNoButton);
    // Mobile: run away when trying to tap
    valentineNo.addEventListener('touchstart', function (e) {
      e.preventDefault();
      moveNoButton();
    }, { passive: false });

    valentineYes.addEventListener('click', function () {
      valentineStatus.textContent = "Okayyy 💕 Let's begin!";
      setTimeout(function () {
        valentineScreen.classList.remove('active');
        gameScreen.classList.add('active');
        startHeartCollectors();
      }, 650);
    });

    // Put the NO button somewhere cheeky initially
    setTimeout(moveNoButton, 50);
    window.addEventListener('resize', function () {
      // keep it visible on resize
      setTimeout(moveNoButton, 50);
    });
  })();

  // --- Maze game ---
  function initMaze() {
    resetMaze();
    maze = makeMaze(15, 15);
    mazeTimeLeft = 45;
    mazeTimerEl.textContent = `${mazeTimeLeft}s`;
    mazeStatus.textContent = 'Move the heart to the 💘';
    drawMaze();
    startMazeTimer();
    mazeHasFocus = true;
  }

  function resetMaze() {
    stopMazeTimer();
    mazeStatus.textContent = '';
    mazeTimerEl.textContent = '45s';
    mazeHasFocus = false;
  }

  function startMazeTimer() {
    stopMazeTimer();
    mazeTimer = setInterval(function () {
      mazeTimeLeft--;
      mazeTimerEl.textContent = `${mazeTimeLeft}s`;
      if (mazeTimeLeft <= 0) {
        stopMazeTimer();
        mazeStatus.textContent = "Time's up!";
        setTimeout(function () {
          closeModal(mazeModal);
        }, 700);
      }
    }, 1000);
  }

  function stopMazeTimer() {
    if (mazeTimer) {
      clearInterval(mazeTimer);
      mazeTimer = null;
    }
  }

  function makeMaze(rows, cols) {
    // 0 = empty, 1 = wall
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 1));

    function carve(r, c) {
      grid[r][c] = 0;
      const dirs = [
        [0, 2],
        [0, -2],
        [2, 0],
        [-2, 0]
      ];
      shuffle(dirs);
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr <= 0 || nc <= 0 || nr >= rows - 1 || nc >= cols - 1) continue;
        if (grid[nr][nc] === 1) {
          grid[r + dr / 2][c + dc / 2] = 0;
          carve(nr, nc);
        }
      }
    }

    // Ensure odd dimensions carving works best
    carve(1, 1);
    // Open start and goal
    grid[1][1] = 0;
    grid[rows - 2][cols - 2] = 0;

    return {
      grid,
      rows,
      cols,
      cell: Math.floor(mazeCanvas.width / cols),
      player: { r: 1, c: 1 },
      goal: { r: rows - 2, c: cols - 2 }
    };
  }

  function drawMaze() {
    if (!maze) return;
    const ctx = mazeCanvas.getContext('2d');
    const cell = maze.cell;
    ctx.clearRect(0, 0, mazeCanvas.width, mazeCanvas.height);

    // background
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 0, mazeCanvas.width, mazeCanvas.height);

    // walls
    ctx.fillStyle = 'rgba(190, 18, 60, 0.25)';
    for (let r = 0; r < maze.rows; r++) {
      for (let c = 0; c < maze.cols; c++) {
        if (maze.grid[r][c] === 1) {
          ctx.fillRect(c * cell, r * cell, cell, cell);
        }
      }
    }

    // goal
    ctx.font = `${Math.max(14, Math.floor(cell * 0.8))}px ${getComputedStyle(document.body).fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💘', (maze.goal.c + 0.5) * cell, (maze.goal.r + 0.5) * cell);

    // player
    ctx.fillText('💗', (maze.player.c + 0.5) * cell, (maze.player.r + 0.5) * cell);
  }

  function tryMoveMaze(dr, dc) {
    if (!maze || !mazeHasFocus) return;
    const nr = maze.player.r + dr;
    const nc = maze.player.c + dc;
    if (nr < 0 || nc < 0 || nr >= maze.rows || nc >= maze.cols) return;
    if (maze.grid[nr][nc] === 1) return;
    maze.player.r = nr;
    maze.player.c = nc;
    drawMaze();

    if (nr === maze.goal.r && nc === maze.goal.c) {
      stopMazeTimer();
      mazeStatus.textContent = `You did it! +${MAZE_POINTS} points`;
      addPoints(MAZE_POINTS);
      setTimeout(function () {
        closeModal(mazeModal);
      }, 800);
    }
  }

  document.addEventListener('keydown', function (e) {
    if (!mazeModal.classList.contains('active')) return;
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') tryMoveMaze(-1, 0);
    if (key === 'arrowdown' || key === 's') tryMoveMaze(1, 0);
    if (key === 'arrowleft' || key === 'a') tryMoveMaze(0, -1);
    if (key === 'arrowright' || key === 'd') tryMoveMaze(0, 1);
  });

  document.querySelectorAll('.maze-arrow').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const dir = btn.getAttribute('data-dir');
      if (dir === 'up') tryMoveMaze(-1, 0);
      if (dir === 'down') tryMoveMaze(1, 0);
      if (dir === 'left') tryMoveMaze(0, -1);
      if (dir === 'right') tryMoveMaze(0, 1);
    });
  });

  // --- Catch the Hearts ---
  function initCatch() {
    stopCatchGame();
    if (!catchCanvas || !catchTimerEl || !catchLivesEl || !catchScoreEl || !catchStatus) return;
    catchRunning = true;
    catchBasketX = (catchCanvas.width - CATCH_BASKET_W) / 2;
    catchLives = 3;
    catchScore = 0;
    catchTimeLeft = 60;
    catchFalling = [];
    catchLivesEl.textContent = '❤️❤️❤️';
    catchScoreEl.textContent = '0';
    catchStatus.textContent = 'Catch hearts, avoid bombs!';
    catchTimerEl.textContent = '60s';

    catchTimer = setInterval(function () {
      catchTimeLeft--;
      catchTimerEl.textContent = catchTimeLeft + 's';
      if (catchTimeLeft <= 0) {
        endCatchGame(true);
      }
    }, 1000);

    let lastSpawn = 0;
    function spawnItem(timestamp) {
      if (!catchRunning) return;
      if (timestamp - lastSpawn > CATCH_SPAWN_INTERVAL) {
        lastSpawn = timestamp;
        const isBomb = Math.random() < CATCH_BOMB_CHANCE;
        catchFalling.push({
          x: Math.random() * (catchCanvas.width - CATCH_ITEM_SIZE),
          y: -CATCH_ITEM_SIZE,
          bomb: isBomb
        });
      }
      catchGameLoop = requestAnimationFrame(spawnItem);
    }
    catchGameLoop = requestAnimationFrame(spawnItem);
    drawCatch();
  }

  function drawCatch() {
    if (!catchRunning || !catchCanvas) return;
    const ctx = catchCanvas.getContext('2d');
    const w = catchCanvas.width;
    const h = catchCanvas.height;
    ctx.fillStyle = 'rgba(255, 245, 245, 0.98)';
    ctx.fillRect(0, 0, w, h);

    // basket
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(catchBasketX, h - CATCH_BASKET_H - 12, CATCH_BASKET_W, CATCH_BASKET_H);
    ctx.fillStyle = '#fda4af';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🧺', catchBasketX + CATCH_BASKET_W / 2, h - CATCH_BASKET_H / 2 - 12);

    // falling items
    ctx.font = (CATCH_ITEM_SIZE - 4) + 'px sans-serif';
    catchFalling.forEach(function (item) {
      ctx.fillText(item.bomb ? '💣' : '💗', item.x + CATCH_ITEM_SIZE / 2, item.y + CATCH_ITEM_SIZE / 2);
    });
  }

  function updateCatch() {
    if (!catchRunning || !catchCanvas) return;
    const w = catchCanvas.width;
    const h = catchCanvas.height;
    const basketLeft = catchBasketX;
    const basketRight = catchBasketX + CATCH_BASKET_W;
    const basketTop = h - CATCH_BASKET_H - 12;

    for (let i = catchFalling.length - 1; i >= 0; i--) {
      const item = catchFalling[i];
      item.y += CATCH_FALL_SPEED;

      if (item.y > h) {
        catchFalling.splice(i, 1);
        continue;
      }

      const itemCenterX = item.x + CATCH_ITEM_SIZE / 2;
      const itemBottom = item.y + CATCH_ITEM_SIZE;
      if (itemBottom >= basketTop && item.y <= basketTop + CATCH_BASKET_H && itemCenterX >= basketLeft && itemCenterX <= basketRight) {
        catchFalling.splice(i, 1);
        if (item.bomb) {
          catchLives--;
          catchLivesEl.textContent = '❤️'.repeat(catchLives);
          if (catchLives <= 0) {
            endCatchGame(false);
            return;
          }
        } else {
          catchScore += CATCH_POINTS_PER_HEART;
          catchScoreEl.textContent = catchScore;
          addPoints(CATCH_POINTS_PER_HEART);
        }
      }
    }
    drawCatch();
  }

  function endCatchGame(timeUp) {
    catchRunning = false;
    if (catchTimer) {
      clearInterval(catchTimer);
      catchTimer = null;
    }
    if (catchGameLoop) {
      cancelAnimationFrame(catchGameLoop);
      catchGameLoop = null;
    }
    catchStatus.textContent = timeUp ? 'Time\'s up! Score: ' + catchScore : 'Bomb! Final score: ' + catchScore;
    setTimeout(function () {
      closeModal(catchModal);
    }, 1200);
  }

  function stopCatchGame() {
    catchRunning = false;
    if (catchTimer) {
      clearInterval(catchTimer);
      catchTimer = null;
    }
    if (catchGameLoop) {
      cancelAnimationFrame(catchGameLoop);
      catchGameLoop = null;
    }
    if (catchTimerEl) catchTimerEl.textContent = '60s';
    if (catchLivesEl) catchLivesEl.textContent = '❤️❤️❤️';
    if (catchScoreEl) catchScoreEl.textContent = '0';
    if (catchStatus) catchStatus.textContent = '';
  }

  function resetCatch() {
    stopCatchGame();
  }

  document.addEventListener('keydown', function (e) {
    if (!catchModal || !catchModal.classList.contains('active') || !catchRunning) return;
    const key = e.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') {
      e.preventDefault();
      catchBasketX = Math.max(0, catchBasketX - 24);
    }
    if (key === 'arrowright' || key === 'd') {
      e.preventDefault();
      catchBasketX = Math.min(catchCanvas.width - CATCH_BASKET_W, catchBasketX + 24);
    }
  });

  if (document.querySelector('.catch-move.left')) {
    document.querySelector('.catch-move.left').addEventListener('click', function () {
      if (catchRunning && catchCanvas) catchBasketX = Math.max(0, catchBasketX - 24);
    });
  }
  if (document.querySelector('.catch-move.right')) {
    document.querySelector('.catch-move.right').addEventListener('click', function () {
      if (catchRunning && catchCanvas) catchBasketX = Math.min(catchCanvas.width - CATCH_BASKET_W, catchBasketX + 24);
    });
  }

  (function catchGameLoopRunner() {
    function step() {
      if (catchRunning) updateCatch();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })();

  function stopAllTimers() {
    stopQuizTimer();
    stopPuzzleTimer();
    stopScrambleTimer();
    stopMazeTimer();
    stopCatchGame();
    if (mathTimer) {
      clearInterval(mathTimer);
      mathTimer = null;
    }
  }

  // --- Heart collectors (ambient + tiny bonus points) ---
  let collectorSpawnTimer = null;
  let collectorRunning = false;

  function startHeartCollectors() {
    if (collectorRunning) return;
    collectorRunning = true;
    if (collectorLayer) collectorLayer.classList.remove('hidden');
    collectorSpawnTimer = setInterval(function () {
      if (!gameScreen.classList.contains('active')) return;
      spawnCollectorHeart();
    }, 900);
  }

  function stopHeartCollectors() {
    collectorRunning = false;
    if (collectorLayer) collectorLayer.classList.add('hidden');
    if (collectorSpawnTimer) {
      clearInterval(collectorSpawnTimer);
      collectorSpawnTimer = null;
    }
    if (collectorHearts) collectorHearts.innerHTML = '';
  }

  function spawnCollectorHeart() {
    if (!collectorHearts || !heartBasket) return;
    const heart = document.createElement('div');
    heart.className = 'collector-heart';
    heart.textContent = Math.random() < 0.8 ? '💗' : '💘';
    const x = Math.floor(10 + Math.random() * (window.innerWidth - 20));
    heart.style.left = `${x}px`;
    heart.style.top = `-30px`;
    heart.style.animationDuration = `${4.5 + Math.random() * 2.5}s`;
    collectorHearts.appendChild(heart);

    // Pull to basket after a short while (looks like collecting)
    const collectAt = 2200 + Math.random() * 2000;
    setTimeout(function () {
      if (!collectorRunning) return;
      if (!heart.isConnected) return;
      const basketRect = heartBasket.getBoundingClientRect();
      const current = heart.getBoundingClientRect();
      const dx = basketRect.left + basketRect.width / 2 - (current.left + current.width / 2);
      const dy = basketRect.top + basketRect.height / 2 - (current.top + current.height / 2);
      heart.style.transition = 'transform 700ms ease-in, opacity 700ms ease-in';
      heart.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
      heart.style.opacity = '0';

      // Tiny bonus points sometimes
      if (Math.random() < 0.55) {
        const bonus = 1 + Math.floor(Math.random() * 3); // 1..3
        addPoints(bonus);
        showBonus(`+${bonus}`);
      }

      setTimeout(function () {
        heart.remove();
      }, 750);
    }, collectAt);

    heart.addEventListener('animationend', function () {
      heart.remove();
    });
  }

  function showBonus(text) {
    if (!bonusPop) return;
    bonusPop.textContent = text;
    bonusPop.classList.remove('hidden');
    bonusPop.style.animation = 'none';
    void bonusPop.offsetWidth;
    bonusPop.style.animation = '';
    setTimeout(function () {
      bonusPop.classList.add('hidden');
    }, 900);
  }

  // --- Confetti ---
  function spawnConfetti() {
    const container = document.querySelector('.confetti');
    const colors = ['#e11d48', '#fb7185', '#fbbf24', '#fda4af'];
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div');
      el.style.cssText =
        'position:absolute;width:8px;height:8px;border-radius:50%;left:' +
        Math.random() * 100 +
        '%;top:-20px;animation:confettiFall ' +
        (2 + Math.random() * 2) +
        's ease-in-out ' +
        Math.random() * 0.5 +
        's forwards;background:' +
        colors[Math.floor(Math.random() * colors.length)] +
        ';';
      container.appendChild(el);
      setTimeout(function () {
        el.remove();
      }, 4000);
    }
  }
})();
