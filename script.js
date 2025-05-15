let bestScore = 0;
let userName = "";
let level = 1;
let lines = 6;
let scoreToLevelUp = 300;
let lineInterval = null;
let timerInterval = null;
let hideLevelInterval = null;
let hideNotificationInterval = null;

let linesTillCrash = 0;
let highscore = 0;
let bombsAvailable = 0;
let timeBonusesAvailable = 0;
let bombMode = false;

const rows = 23;
const cols = 16;
const initialFilledRows = 4;

const colors = [
  {
    color: "red",
    hex: "#f2055c",
  },
  {
    color: "purple",
    hex: "#730260",
  },
  {
    color: "yellow",
    hex: "#f29f05",
  },
  {
    color: "green",
    hex: "#05f205",
  },
  {
    color: "blue",
    hex: "#0ffbff",
  },
];

const levels = [
  { level: 1, score: 300, lines: 6, time: 90, colors: 3, lineInterval: 5000 },
  { level: 2, score: 700, lines: 9, time: 80, colors: 3, lineInterval: 5000 },
  { level: 3, score: 1200, lines: 12, time: 75, colors: 4, lineInterval: 4500 },
  { level: 4, score: 1800, lines: 15, time: 70, colors: 4, lineInterval: 4000 },
  { level: 5, score: 2500, lines: 18, time: 65, colors: 4, lineInterval: 4000 },
  { level: 6, score: 3300, lines: 20, time: 60, colors: 5, lineInterval: 3500 },
  { level: 7, score: 4200, lines: 22, time: 55, colors: 5, lineInterval: 3000 },
  { level: 8, score: 5200, lines: 23, time: 50, colors: 5, lineInterval: 2500 },
  { level: 9, score: 6300, lines: 23, time: 45, colors: 5, lineInterval: 2000 },
  {
    level: 10,
    score: 7500,
    lines: 23,
    time: 40,
    colors: 5,
    lineInterval: 1500,
  },
];

// BASICS
function showGameWindow() {
  $("#game-container").css("display", "flex");
}

function startButtonVisibility(visible) {
  if (visible) {
    $("#start-container").css("display", "flex");
    $("#game-container").hide();
  } else {
    $("#start-container").hide();
  }
}

function turnOffMusic() {
  const music = $("#music");
  music[0].pause();
  $("#audio-off").css("display", "block");
  $("#audio-on").css("display", "none");
}

function turnOnMusic() {
  const music = $("#music");
  music[0].play();
  $("#audio-off").css("display", "none");
  $("#audio-on").css("display", "block");
}

function startTimer(seconds) {
  clearInterval(timerInterval);

  let counter = seconds || levels[level - 1].time;
  const timerElement = $("#remaining-time");
  timerElement.text("00:" + counter);

  timerInterval = setInterval(function () {
    counter--;

    if (counter <= 0) {
      clearInterval(timerInterval);
      timerElement.text("Time's up!");
      gameOver();
      return;
    }

    if (linesTillCrash == 23) {
      gameOver();
    }

    timerElement.text(counter < 10 ? "00:0" + counter : "00:" + counter);
  }, 1000);
}

// ADD USERNAME
function addUsername() {
  const usernameInput = $("#username").val();
  const userNameHolder = $("#username-holder");

  if (usernameInput) {
    userName = usernameInput;
    userNameHolder.show();
    userNameHolder.text(usernameInput);

    $("#username-form").hide();
    console.log(usernameInput);
  } else {
    alert("Please enter a username.");
  }
}

// POINTS

function changeHighscore(points) {
  const pointsElement = $("#high-score");
  const currentPoints = parseInt(pointsElement.text());

  const newPoints = currentPoints + points;
  pointsElement.text(newPoints);

  if (newPoints >= scoreToLevelUp) {
    increaseLevel();
  }
}

function checkIfHighestScore() {
  const currentPoints = parseInt($(".high-score").text());
  if (currentPoints > bestScore) {
    bestScore = currentPoints;
    $(".best-score").text(bestScore);
  }
}

// LEVEL UP
function increaseLevel() {
  if (level === 10) {
    winningTheGame();
    return;
  }
  clearInterval(timerInterval);
  clearInterval(lineInterval);
  clearInterval(hideNotificationInterval);
  clearInterval(hideLevelInterval);

  const levelElement = $("#level");
  let currentLevel = parseInt(levelElement.text());
  currentLevel++;
  levelElement.text(currentLevel);

  level = currentLevel;
  scoreToLevelUp = levels[currentLevel - 1].score;
  lines = levels[currentLevel - 1].lines;
  $("#lines-counter").text(lines);
  showLevelUpModal();
  newBoard();

  startTimer(levels[currentLevel - 1].time);
  if (level === 4 || level === 8) {
    bombsAvailable++;
    timeBonusesAvailable++;

    $("#bomb-btn").prop("disabled", false);
    $("#bomb-btn").addClass("active");
    $("#bomb-btn span").text(bombsAvailable);

    $("#time-btn").prop("disabled", false);
    $("#time-btn").addClass("active");
    $("#time-btn span").text(timeBonusesAvailable);
  }

  lineInterval = setInterval(() => {
    if (lines > 0) {
      addNewLine();
      reorderBlocks();
    }
  }, levels[currentLevel - 1].lineInterval);
}

// GAME LOGIC
function newBoard() {
  const grid = $("#game-grid");
  grid.empty();
  const colorsNumber = levels[level - 1].colors;
  const colorsToUse = colors.slice(0, colorsNumber);

  for (let row = 0; row < initialFilledRows; row++) {
    for (let col = 0; col < cols; col++) {
      const colorObj =
        colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
      const block = $("<div></div>")
        .addClass("block")
        .css("background-color", colorObj.hex)
        .attr("data-color", colorObj.color)
        .attr("data-row", row)
        .attr("data-col", col)
        .css("grid-row", rows - row) // a legalsó data-row = 0 → grid-row: 23
        .css("grid-column", col + 1); // grid oszlop 1-alapú
      grid.append(block);
    }
  }
}

// LINES
function decreaseLines() {
  const linesElement = $("#lines-counter");
  let currentLines = parseInt(linesElement.text());
  currentLines--;
  linesElement.text(currentLines);

  lines = currentLines;
}

function addNewLine() {
  const colorsNumber = levels[level - 1].colors;
  const colorsToUse = colors.slice(0, colorsNumber);

  if (lines > 0) {
    $(".block").each(function () {
      const block = $(this);
      const currentRow = parseInt(block.attr("data-row"));
      const newRow = currentRow + 1;

      if (newRow < rows) {
        block.attr("data-row", newRow);
        block.css("grid-row", rows - newRow);
      } else {
        block.remove();
      }
    });
    decreaseLines();
    linesTillCrash++;
  }

  for (let col = 0; col < cols; col++) {
    const colorObj =
      colorsToUse[Math.floor(Math.random() * colorsToUse.length)];
    const block = $("<div></div>")
      .addClass("block")
      .css("background-color", colorObj.hex)
      .attr("data-color", colorObj.color)
      .attr("data-row", 0)
      .attr("data-col", col)
      .css("grid-row", rows - 0)
      .css("grid-column", col + 1)
      .css("opacity", 0);

    $("#game-grid").append(block);
    block.animate({ opacity: 1 }, 300);
  }
}

// BLOCKS
function removeConnectedBlocks(clickedBlock) {
  const color = clickedBlock.attr("data-color");
  const startRow = parseInt(clickedBlock.attr("data-row"));
  const startCol = parseInt(clickedBlock.attr("data-col"));
  const music = $("#fading-music");

  let visited = {};
  let stack = [{ row: startRow, col: startCol }];
  let toRemove = [];

  while (stack.length > 0) {
    const { row, col } = stack.pop();
    const key = `${row}-${col}`;
    if (visited[key]) continue;
    visited[key] = true;

    const block = $(`.block[data-row=${row}][data-col=${col}]`);
    if (block.length && block.attr("data-color") === color) {
      toRemove.push(block);

      stack.push({ row: row - 1, col: col });
      stack.push({ row: row + 1, col: col });
      stack.push({ row: row, col: col - 1 });
      stack.push({ row: row, col: col + 1 });
    }
  }

  if (toRemove.length >= 3) {
    const avgRow =
      toRemove.reduce((sum, b) => sum + parseInt(b.attr("data-row")), 0) /
      toRemove.length;
    const avgCol =
      toRemove.reduce((sum, b) => sum + parseInt(b.attr("data-col")), 0) /
      toRemove.length;

    let blocksRemoved = 0;
    const score = toRemove.length * 10;

    showFloatingScore(Math.floor(avgRow), Math.floor(avgCol), score);

    toRemove.forEach((b) => {
      music[0].load();
      music[0].play();

      b.css({
        transition: "transform 0.3s, opacity 0.2s",
        transform: "scale(0)",
        opacity: 0,
      });

      setTimeout(() => {
        b.remove();
        blocksRemoved++;
        if (blocksRemoved === toRemove.length) {
          dropBlocks();
        }
      }, 200);
    });
    changeHighscore(toRemove.length * 10);
    dropBlocks();
  }
}

function reorderBlocks() {
  for (let col = 0; col < cols; col++) {
    const columnBlocks = [];

    $(".block").each(function () {
      const block = $(this);
      if (parseInt(block.attr("data-col")) === col) {
        columnBlocks.push(block);
      }
    });

    columnBlocks.sort((a, b) => {
      return parseInt(a.attr("data-row")) - parseInt(b.attr("data-row"));
    });

    let targetRow = 0;
    for (const block of columnBlocks) {
      block.attr("data-row", targetRow);
      block.css("grid-row", rows - targetRow);
      targetRow++;
    }
  }
}

function dropBlocks() {
  let hasMoved = true;

  while (hasMoved) {
    hasMoved = false;

    for (let row = 1; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const block = $(`.block[data-row=${row}][data-col=${col}]`);
        if (!block.length) continue;

        const below = $(`.block[data-row=${row - 1}][data-col=${col}]`);

        if (below.length === 0) {
          block.attr("data-row", row - 1);
          block.css("grid-row", rows - (row - 1));
          hasMoved = true;
          continue;
        }

        if (col > 0) {
          const left = $(`.block[data-row=${row}][data-col=${col - 1}]`);
          const belowLeft = $(
            `.block[data-row=${row - 1}][data-col=${col - 1}]`
          );
          if (left.length === 0 && belowLeft.length === 0) {
            block.attr("data-col", col - 1);
            block.attr("data-row", row - 1);
            block.css("grid-column", col);
            block.css("grid-row", rows - (row - 1));
            hasMoved = true;
            continue;
          }
        }

        if (col < cols - 1) {
          const right = $(`.block[data-row=${row}][data-col=${col + 1}]`);
          const belowRight = $(
            `.block[data-row=${row - 1}][data-col=${col + 1}]`
          );
          if (right.length === 0 && belowRight.length === 0) {
            block.attr("data-col", col + 1);
            block.attr("data-row", row - 1);
            block.css("grid-column", col + 2);
            block.css("grid-row", rows - (row - 1));
            hasMoved = true;
            continue;
          }
        }
      }
    }
    reorderBlocks();
  }
}

// MODALS
function showLevelUpModal() {
  const modal = $("#level-up-modal");
  const music = $("#level-up-music");
  music[0].load();
  music[0].play();
  modal.show();
  modal.css("display", "flex");
  hideLevelInterval = setInterval(() => {
    modal.hide();
  }, 2000);
}

function showGameOverModal() {
  const modal = $("#game-over-modal");
  modal.show();
  modal.css("display", "flex");
  console.log("Game Over Modal");
}

// BONUS FUNCTIONS

function showFloatingScore(row, col, score) {
  const blockSize = 22;

  const top = (rows - row - 3) * blockSize;
  const left = (col + 2) * blockSize;

  if (score >= 80) {
    const scoreElement = $(
      "<div class='floating-score hundred'>" +
        "<span>+</span>" +
        score +
        "</div>"
    ).css({
      top: top + "px",
      left: left + "px",
    });
    $("#game-grid").append(scoreElement);
    setTimeout(() => scoreElement.remove(), 2000);
  } else {
    const scoreElement = $(
      "<div class='floating-score'>" + "<span>+</span>" + score + "</div>"
    ).css({
      top: top + "px",
      left: left + "px",
    });
    $("#game-grid").append(scoreElement);

    setTimeout(() => scoreElement.remove(), 1000);
  }
}

function useBomb() {
  if (bombsAvailable <= 0) return;
  const notification = $("#bomb-notification");
  bombMode = true;
  bombsAvailable--;
  notification.css("display", "flex");

  if (bombsAvailable === 0) {
    $("#bomb-btn").prop("disabled", true);
    $("#bomb-btn").removeClass("active");
  }
  $("#bomb-btn span").text(bombsAvailable);
}

function explode(centerBlock) {
  const row = parseInt(centerBlock.attr("data-row"));
  const col = parseInt(centerBlock.attr("data-col"));
  const music = $("#bomb-music");
  const notification = $("#bomb-notification");

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      const b = $(`.block[data-row=${r}][data-col=${c}]`);
      if (b.length) {
        b.css({
          transition: "transform 0.2s, opacity 0.2s",
          transform: "scale(0)",
          opacity: 0,
        });
        setTimeout(() => b.remove(), 200);
      }
    }
  }

  music[0].load();
  music[0].play();
  notification.hide();

  changeHighscore(90);
  dropBlocks();
  reorderBlocks();
}

function useTimeBonus() {
  if (timeBonusesAvailable <= 0) return;
  clearInterval(hideNotificationInterval);
  const notification = $("#time-notification");
  notification.css("display", "flex");
  timeBonusesAvailable--;

  if (timeBonusesAvailable === 0) {
    $("#time-btn").prop("disabled", true);
    $("#time-btn").removeClass("active");
  }
  $("#time-btn span").text(timeBonusesAvailable);
  addTimeBonus(10);
}

function addTimeBonus(seconds) {
  const timerText = $("#remaining-time").text();
  const parts = timerText.split(":");
  const notification = $("#time-notification");

  let total = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  total += seconds;
  clearInterval(timerInterval);
  startTimer(total);
  hideNotificationInterval = setInterval(() => {
    notification.hide();
  }, 2000);
}

// WINNING, ENDING, GAME OVER, START

function winningTheGame() {}

function gameOver() {
  console.log("Game Over");
}

function endGame() {
  clearInterval(lineInterval);
  clearInterval(timerInterval);
  level = 1;
  lines = 6;
  highscore = 0;
  bombsAvailable = 0;
  timeBonusesAvailable = 0;
  scoreToLevelUp = levels[level - 1].score;

  const levelElement = $("#level");
  levelElement.text(level);
  const linesElement = $("#lines-counter");
  linesElement.text(lines);
  const scoreElement = $("#high-score");
  scoreElement.text(highscore);
  scoreToLevelUp = levels[level - 1].score;
  $("#bomb-btn").prop("disabled", true);
  $("#bomb-btn").removeClass("active");
  $("#bomb-btn span").text(bombsAvailable);

  $("#time-btn").prop("disabled", true);
  $("#time-btn").removeClass("active");
  $("#time-btn span").text(timeBonusesAvailable);
  startButtonVisibility(true);
}

function startGame() {
  startButtonVisibility(false);
  showGameWindow();
  startTimer();
  newBoard();
}

// -----------------------
$(document).ready(function () {
  startButtonVisibility(true);
  if (lines === 0) {
    gameOver();
  }
});

$(document).on("click", "#start-btn", function () {
  lineInterval = setInterval(() => {
    if (lines > 0) {
      addNewLine();
    }
    reorderBlocks();
  }, levels[level - 1].lineInterval);
});

$(document).on("click", ".block", function () {
  const block = $(this);

  if (bombMode) {
    bombMode = false;
    explode(block);
    return;
  }

  removeConnectedBlocks(block);
});
