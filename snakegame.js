
function Game({ gameStartData, canvas, snakeLength, controlKeys, debugWindow, onGameEndAction }) {

  //CALLBACK FUNC IF GAME ENDED
  this.onGameEndAction = onGameEndAction;
  this.gameOver = false;
  this.ctrlFdbElement = document.getElementsByClassName('ctrl');
  //Save to the local storage
  this.debugDiv = debugWindow[0];
  this.scoreDiv = debugWindow[1];
  this.controlKeys = controlKeys;
  this.snkLength = snakeLength;

  this.playerName = gameStartData.name;
  this.sizeX = gameStartData.mapWidth;
  this.sizeY = gameStartData.mapHeight;
  this.unit = gameStartData.mapUnit;
  this.startFps = gameStartData.difficulty;// frame per second
  this.fps = gameStartData.difficulty;// frame per second
  this.speedChangeRequest = false;

  this.canvas = canvas;
  this.cxt = this.canvas.getContext ("2d");
  this.border = this.unit*2;
  this.canvas.width = this.sizeX * this.unit + this.border; // a pálya méretének beállítása
  this.canvas.height = this.sizeY * this.unit + this.border;

  this.px = getRandomInt(this.sizeX); //snake on the middle
  this.py = getRandomInt(this.sizeY); // this on the middle
  this.vx = 0;
  this.vy = 0;
  this.nextVx = 1;
  this.nextVy = 0;
  this.trail = [];
  this.score =  0;
  // map 0 empty 1 snake trail 2 snake head 9 food
  this.map = new Array(this.sizeX).fill().map(()=>new Array(this.sizeY).fill(0)); // empty map
  this.mapX = this.sizeX + "x" + this.sizeY;
  this.generateFood();

  //Snake next direction queues
  this.ctrlQueue = [];
  this.ctrlQueValid = [];

  // ADD gamepad monitoring
  this.gamepadCtrl = new GamepadCTRL({
    onAxisChange: (directionCommand) => { this.onKeyChange(directionCommand); }
  });

  // ADD keyboard monitoring
  this.keyBoardCtrl = new keyboardCTRL({
    controlKeys : this.controlKeys,
    onKeyChange: (directionCommand) => { this.onKeyChange(directionCommand); }
  });

};

Game.prototype.onKeyChange = function(directionCommand) {

  this.ctrlQueue = directionCommand;
  console.log(this.ctrlQueue);
  this.validateDir(this.ctrlQueue);
};

Game.prototype.pauseGame = function() {
  if (this.SessionId) {
    clearInterval(this.SessionId);
  } // pause game
  this.isRunning = false;
};

Game.prototype.endGame = function() {
  if (this.SessionId) {
    clearInterval(this.SessionId);
  } // pause game
};

Game.prototype.continueGame = function() {
  this.SessionId = setInterval(this.updateGame.bind(this), 1000/this.fps); // start game
};

Game.prototype.updateGame = function() {
  if(this.speedChangeRequest) {
    this.pauseGame();
  //  this.fps = this.fps + this.score*0.05;
    this.speedChangeRequest = false;
    this.continueGame();
  }
  this.clearBoard();
  this.moveSnake();
  this.drawBoard(this.border);
  this.isRunning = true;
};

Game.prototype.clearBoard = function() {
    this.cxt.clearRect (0, 0, this.canvas.width, this.canvas.height);
};


Game.prototype.getDirVector = function(dir) {
  switch (dir) {
    case "UP":
      return {x: 0,y: -1};
      break;
    case "LEFT":
      return {x: -1,y: 0};
      break;
    case "DOWN":
      return {x: 0,y: 1};
      break;
    case "RIGHT":
      return {x: 1,y: 0};
      break;
    default:
      return {x: null, y: null};
  }
};

Game.prototype.getCurrentDirinString = function() {
  if (this.vx === 0 && this.vy === -1 ){
    this.currentDir = "UP";
  }
  if (this.vx === -1 && this.vy === 0 ){
    this.currentDir = "LEFT";
  }
  if (this.vx === 0 && this.vy === 1 ){
    this.currentDir = "DOWN";
  }
  if (this.vx === 1 && this.vy === 0 ){
    this.currentDir = "RIGHT";
  }
};

Game.prototype.validateDir = function(directionCommand) {
  // check if the snake can go this direction and makes a
  this.ctrlQueValid = [];
    for (var i = 0; i < directionCommand.length; i++) {
      this.ctrlQueValid[i] = directionCommand[i];
    }
    for (var i = 0; i < directionCommand.length; i++) {
      var vector = this.getDirVector(directionCommand[i]);
      if ((this.vx === (-1*vector.x) && this.vy === 0) || (this.vy === (-1*vector.y) && this.vx === 0)) {
        this.ctrlQueValid.removeElement(directionCommand[i]);
      }
    }
  if (this.ctrlQueValid.length > 0) {
    this.nextVx = this.getDirVector(this.ctrlQueValid[this.ctrlQueValid.length-1]).x;
    this.nextVy = this.getDirVector(this.ctrlQueValid[this.ctrlQueValid.length-1]).y;
  }
};

Game.prototype.moveSnake = function() {
  // read next position and increment position by speed
  console.log("nextVx", this.nextVx, "nextVy", this.nextVy);
  this.vx = this.nextVx;
  this.vy = this.nextVy;
  this.getCurrentDirinString();

  // move snake
  this.px += this.vx;
  this.py += this.vy;

  // goes out on map edge come in opposite side
  if (this.px<0) {
    this.px = this.sizeX-1;
  }
  if (this.px > this.sizeX-1) {
    this.px = 0;
  }

  if (this.py<0) {
    this.py = this.sizeY-1;
  }
  if (this.py>this.sizeY-1) {
    this.py = 0;
  }

  //console.log("current vector",(this.getDirVector(this.currentDir)).x);
  while (this.snkLength <= this.trail.length) {
  //  console.log("this.trail", this.trail);
    this.map[this.trail[0].x][this.trail[0].y] = 0; // 0 for empty
    this.trail.shift();
  }

  for (var i = 0; i < this.trail.length; i++) {
    this.map[this.px][this.py] = 2; // 2 for Snake head
    this.map[this.trail[i].x][this.trail[i].y] = 1; // 1 for snake trail

    if (this.px === this.trail[i].x && this.py === this.trail[i].y)  {
      //If snake meets itself length reduced to 1 and score reduced to 0
      this.result = {
        name: this.playerName,
        score: this.score,
        mapSize: this.sizeX + "x" + this.sizeY
      };
      this.onGameEndAction();
    }
  }

  this.trail.push({ x: this.px, y: this.py });

  // if snake eat the food
  if (this.px === this.fx && this.py === this.fy) {
    this.snkLength++;// growing snake
  //  this.score += Math.floor(100 * this.fps / (5*(this.sizeX * this.sizeY))); //  plus 1 point
    this.score += Math.floor(this.fps); //  plus 1 point
    this.generateFood(); // generate new apple pos
    this.fps *= 1.04 ;//  plus 1 point
    this.speedChangeRequest = true;
  }

  this.debugDiv.innerHTML =
    '<div class="text-center">Debug</div>' +
    "<br>Position X: " + createDivForDebug(this.px) +
    "<br>Position Y: " + createDivForDebug(this.py) +
    "<br>Direction X: " + createDivForDebug(this.vx) +
    "<br>Direction Y: " + createDivForDebug(this.vy) +
    "<br>Food X: " + createDivForDebug(this.fx) +
    "<br>Food Y: " + createDivForDebug(this.fy) +
    "<br>FPS: " + createDivForDebug(this.fps) +
    "<br>Dir cmd: " + createDivForDebug(this.ctrlQueue) +
    "<br>Dir cmd valid: " + createDivForDebug(this.ctrlQueValid) +
    "<br> Current direction: " + createDivForDebug(this.currentDir)+
    "<br> Trail length " + createDivForDebug(this.trail.length)+
    "<br> snkLength " + createDivForDebug(this.snkLength);
};

Game.prototype.drawBoard = function(offset) {
  const color = "rgba(0,0,0,1)";
  const cxt = this.cxt;
  cxt.fillStyle = color;
  cxt.fillRect (0, 0, this.canvas.width, this.canvas.height);
  const scoreText = this.playerName + ": " + this.score;
  const difficulty = "Level: "+ Math.floor(this.fps);
  const fontSize = offset/4;
  //this.scoreDiv.innerText = this.playerName + "'s score: " + this.score;
  let baseOffset = {};
  baseOffset.x = offset/2;
  baseOffset.y = offset/2;
  for (var x=0; x < this.sizeX; x++) {
    for (var y=0; y < this.sizeY; y++)  {
      if (this.map[x][y] === 9)  { // 9 draw food
        this.drawPixel(baseOffset, x, y, "rgba(170,0,0,1)", this.unit);
      }

      if (this.map[x][y] === 1) { // snake trail
        this.drawPixel(baseOffset, x, y, "rgba(10,150,10,0.7)", this.unit, this.unit * 0.01);
      }
        if (this.map[x][y] === 2) { //snake head
          this.drawPixel(baseOffset, x, y, "rgba(50,150,50,1)", this.unit);
        }
      //chess board pattern for empty fields
      if (this.map[x][y] === 0) {
        if ( (x + y) % 2 === 0) {
          this.drawPixel(baseOffset, x, y, "rgba(10,30,10,0.5)", this.unit);
        }
        if ((x + y) % 2 === 1) { //chess table pattern
          this.drawPixel(baseOffset, x, y, "rgba(10,26,10,0.5)", this.unit);
        }
      }
    }
  }

  cxt.font = fontSize + "px Operator Mono SSm A";
  cxt.fillStyle = "white";
  cxt.fillText(scoreText, this.canvas.width/10*2, fontSize/4*5);
  cxt.fillText(difficulty, this.canvas.width/10*7, fontSize/4*5);

};

Game.prototype.outPutText = function() {

};

Game.prototype.generateFood = function() {
  this.fx = getRandomInt(this.sizeX);
  this.fy = getRandomInt(this.sizeY);
  var foodOnSnake = false;
  //If food is on snake generate again
  for (var i = 0; i < this.trail.length; i++) {
    if (this.fx === this.trail[i].x && this.fy === this.trail[i].y) {
      foodOnSnake = true;
      break;
    }
  }
  if (foodOnSnake) {
    this.generateFood();
  }

  this.map[this.fx][this.fy] = 9; // put food on the map
};

Game.prototype.drawCircle = function(posy, posY, color, size, offset) {
  if (typeof offset === 'undefined' || !offset) var offset = 0;
  this.cxt.fillStyle = color;
  this.cxt.beginPath();
  this.cxt.arc(posy * size + size/2 + offset, posY * size + size/2 + offset,  size/2 - 2 * offset, 0, Math.PI*2, true);
  this.cxt.closePath();
  this.cxt.fill();
};

Game.prototype.drawPixel = function(offsetBase, posy, posY, color, size, offsetRect) {
  if (typeof offsetRect === 'undefined' || !offsetRect) var offsetRect = 0;
  let startx = offsetBase.x;
  let starty = offsetBase.y;
  let x = posy * size + offsetRect + startx;
  let y = posY * size + offsetRect + starty;
  this.cxt.fillStyle = color;
  this.cxt.fillRect (x, y, size - 2 * offsetRect, size - 2 * offsetRect);
};
