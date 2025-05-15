const app=document.getElementById('app');

// Adventure mode configuration, similar to Python Config.ADVENTURE_STAGES
const ADVENTURE_STAGES = [
  { name: "Etapa 1", tables: [2,3,4], required: 5, color: "#e3f2fd" },
  { name: "Etapa 2", tables: [5,6,7], required: 5, color: "#ffe0b2" },
  { name: "Jefe Final", tables: [], required: 0, color: "#ef9a9a" }
];

let stageIndex = 0;
let adventureQuestions = [];
let adventureErrors = [];

const difficultyLevels={
  'Fácil':{time:25,score:1},
  'Medio':{time:15,score:2},
  'Difícil':{time:7,score:3}
};

let playerName='';
let mode='';
let difficulty='Medio';
let score=0;
let lives=3;
let current=[2,2];
let timeLimit=25;
let timerId=null;

function saveRecord(name,score){
  const rec=JSON.parse(localStorage.getItem('records')||'[]');
  rec.push({name,score,date:new Date().toISOString()});
  rec.sort((a,b)=>b.score-a.score);
  localStorage.setItem('records',JSON.stringify(rec.slice(0,5)));
}

function showRecords(){
  const rec=JSON.parse(localStorage.getItem('records')||'[]');
  if(!rec.length){alert('Aún no hay puntuaciones');return;}
  let msg=rec.map((r,i)=>`${i+1}. ${r.name} — ${r.score} pts`).join('\n');
  alert(msg);
}

function home(){
  clearInterval(timerId);
  app.innerHTML=`
    <div id="game-area">
      <h1 style="color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.6);">🔢 ¡Multiplica y Diviértete! 🔢</h1>
      <input id="name" placeholder="Ingresa tu nombre">
      <div>
        <button onclick="startMenu()">Iniciar</button>
      </div>
    </div>`;
}

function startMenu(){
  playerName=document.getElementById('name').value.trim();
  if(!playerName){alert('Ingresa tu nombre');return;}
  showMenu();
}

function showMenu(){
  app.innerHTML=`
    <div id="game-area">
      <h1>¡Hola, ${playerName}! ¿Listo para multiplicar?</h1>
      <button onclick="chooseDifficulty('Contrarreloj')">Contrarreloj</button>
      <button onclick="startAdventure()">Aventura</button>
      <button onclick="repasar()">Repasar Tabla</button>
      <button onclick="startScary()">Scary Mode</button>
      <button onclick="showRecords()">Récords</button>
      <button onclick="home()">Salir</button>
    </div>`;
}

function chooseDifficulty(selectedMode){
  mode=selectedMode;
  app.innerHTML=`
    <div id="game-area">
      <h1>Elige dificultad</h1>
      ${Object.keys(difficultyLevels).map(d=>`<button onclick="startGame('${d}')">${d}</button>`).join('')}
      <button onclick="showMenu()">Volver</button>
    </div>`;
}

function repasar(){
  let tbl=prompt('¿Qué tabla (1-10) quieres repasar?');
  tbl=parseInt(tbl);
  if(!tbl||tbl<1||tbl>10)return;
  mode='Repasar';
  current=[tbl,1]; // se ajustará en nextQuestion
  startGame('Medio',tbl);
}

function startScary(){
  mode='Scary';
  lives=1;
  startGame('Medio');
}

function startGame(diff,reviewTable=null){
  difficulty=diff;
  score=0;
  lives= (mode==='Scary')?1:3;
  timeLimit=difficultyLevels[diff].time;
  app.innerHTML=`
    <div id="game-area">
      <div>Jugador: ${playerName} | Puntos: <span id="score">0</span> ${mode==='Scary'?'':`| Vidas: <span id="lives">${'❤️'.repeat(lives)}</span>`}</div>
      <div id="progress" style="${mode==='Contrarreloj'?'':'display:none'}"><div id="progress-inner"></div></div>
      <div id="question">Pregunta</div>
      <input id="answer" type="number" placeholder="Tu respuesta">
      <button onclick="checkAnswer()">Responder</button>
      <div id="feedback"></div>
      <button onclick="showMenu()">Volver al menú</button>
    </div>`;
  nextQuestion(reviewTable);
  if(mode==='Contrarreloj')startTimer();
  document.getElementById('answer').focus();
}

function startTimer(){
  let remaining=timeLimit;
  const bar=document.getElementById('progress-inner');
  bar.style.width='100%';
  timerId=setInterval(()=>{
    remaining-=0.2;
    bar.style.width=(remaining/timeLimit*100)+'%';
    if(remaining<=0){
      clearInterval(timerId);
      checkAnswer(true);
    }
  },200);
}

function randomInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

function nextQuestion(reviewTable=null){
  if(timerId&&mode==='Contrarreloj'){clearInterval(timerId);startTimer();}
  let a,b;
  if(reviewTable){a=reviewTable;b=randomInt(1,10);}
  else{a=randomInt(1,10);b=randomInt(1,10);}
  current=[a,b];
  document.getElementById('question').textContent=`¿Cuánto es ${a} × ${b}?`;
  document.getElementById('answer').value='';
  document.getElementById('feedback').textContent='';
  document.getElementById('answer').focus();
}

function checkAnswer(timeout=false){
  if(mode==='Contrarreloj'&&timerId){clearInterval(timerId);}
  let correct=false;
  if(!timeout){
    const val=parseInt(document.getElementById('answer').value);
    correct=(val===current[0]*current[1]);
  }
  if(correct){
    score+=difficultyLevels[difficulty].score;
    document.getElementById('score').textContent=score;
    document.getElementById('feedback').textContent='👍';
    if(mode==='Contrarreloj'){
      timeLimit=Math.max(3,timeLimit-0.2);
    }
    setTimeout(()=>nextQuestion(mode==='Repasar'?current[0]:null),800);
  }else{
    if(mode==='Scary'){
      showJumpscare();
      saveRecord(playerName,score);
      setTimeout(()=>showMenu(),1500);
      return;
    }
    lives--;
    if(lives<=0){
      alert('Fin del juego. Puntos: '+score);
      saveRecord(playerName,score);
      home();
    }else{
      document.getElementById('lives').textContent = '❤️'.repeat(lives);
      document.getElementById('feedback').textContent='💔';
      setTimeout(()=>nextQuestion(mode==='Repasar'?current[0]:null),800);
    }
  }
}

function showJumpscare(){
  // Preload a random image and sound
  const pics = ['jump1.png','jump2.png','jump3.png','jump4.png','jump5.png'];
  const imgSrc = 'assets/' + pics[Math.floor(Math.random()*pics.length)];
  const sound = new Audio('assets/scream1.mp3');
  const overlay = document.createElement('div');
  overlay.className = 'overlay shake';
  // Create image element
  const img = document.createElement('img');
  img.src = imgSrc;
  overlay.appendChild(img);
  document.body.appendChild(overlay);
  // Play sound when metadata loaded
  sound.addEventListener('canplaythrough', () => {
    sound.play().catch(()=>{});
  });
  // Remove overlay after sound ends or after 1s if sound fails
  sound.addEventListener('ended', () => {
    document.body.removeChild(overlay);
  });
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }, 1500);
}

home();

// --- Aventura handlers ---

function startAdventure(){
  clearInterval(timerId);
  mode = 'Aventura';
  stageIndex = 0;
  adventureErrors = [];
  score = 0;
  lives = 3;
  setupStage();
}

function setupStage(){
  clearInterval(timerId);
  const stage = ADVENTURE_STAGES[stageIndex];
  app.innerHTML=`
    <div id="game-area" style="background:${stage.color}">
      <div>Jugador: ${playerName} | Puntos: <span id="score">${score}</span> | Vidas: <span id="lives">${'❤️'.repeat(lives)}</span></div>
      <h1>${stage.name}</h1>
      <div id="question">Cargando...</div>
      <input id="answer" type="number" placeholder="Tu respuesta">
      <button onclick="checkAdventureAnswer()">Responder</button>
      <button onclick="showMenu()">Volver al menú</button>
      <div id="feedback"></div>
    </div>`;
  generateAdventureQuestions(stage);
  nextAdventureQuestion();
}

function generateAdventureQuestions(stage){
  adventureQuestions = [];
  if(stage.name === "Jefe Final"){
    if(adventureErrors.length === 0){
      victoryAdventure();
      return;
    }
    adventureQuestions = [...adventureErrors];
  } else {
    for(let i=0;i<stage.required;i++){
      const a = stage.tables[Math.floor(Math.random()*stage.tables.length)];
      const b = difficulty === 'Difícil' ? randomInt(2,9) : randomInt(1,10);
      adventureQuestions.push([a,b]);
    }
  }
}

function nextAdventureQuestion(){
  if(adventureQuestions.length === 0){
    stageIndex++;
    setupStage();
    return;
  }
  const [a,b] = adventureQuestions.shift();
  document.getElementById('question').textContent = `¿Cuánto es ${a} × ${b}?`;
  document.getElementById('answer').value='';
  document.getElementById('feedback').textContent='';
  document.getElementById('answer').focus();
  current = [a,b];
}

function checkAdventureAnswer(){
  const val = parseInt(document.getElementById('answer').value);
  const [a,b] = current;
  if(val === a*b){
    score++;
    document.getElementById('score').textContent = score;
    document.getElementById('feedback').textContent = '👍';
  } else {
    adventureErrors.push([a,b]);
    lives--;
    document.getElementById('lives').textContent = '❤️'.repeat(lives);
    document.getElementById('feedback').textContent = '💔';
    if(lives <=0){
      alert(`Fin de la aventura. Puntos: ${score}`);
      saveRecord(playerName,score);
      showMenu();
      return;
    }
  }
  setTimeout(nextAdventureQuestion,800);
}

function victoryAdventure(){
  alert(`¡Victoria en la aventura con ${score} puntos!`);
  saveRecord(playerName,score);
  showMenu();
}