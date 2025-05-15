
const app=document.getElementById('app');

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
      <h1>Bienvenido a Tablas Mult</h1>
      <input id="name" placeholder="Ingresa tu nombre">
      <div>
        <button onclick="startMenu()">Iniciar</button>
      </div>
    </div>`;
}

function startMenu(){
  playerName=document.getElementById('name').value.trim();
  if(!playerName){alert('Ingresa tu nombre');return;}
  app.innerHTML=`
    <div id="game-area">
      <h1>Hola, ${playerName}</h1>
      <button onclick="chooseDifficulty('Contrarreloj')">Contrarreloj</button>
      <button onclick="chooseDifficulty('Aventura')">Aventura</button>
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
      <button onclick="startMenu()">Volver</button>
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
      <div>Jugador: ${playerName} | Puntos: <span id="score">0</span> ${mode==='Scary'?'':'| Vidas: <span id="lives">${lives}</span>'}</div>
      <div id="progress" style="${mode==='Contrarreloj'?'':'display:none'}"><div id="progress-inner"></div></div>
      <div id="question">Pregunta</div>
      <input id="answer" type="number" placeholder="Tu respuesta">
      <button onclick="checkAnswer()">Responder</button>
      <div id="feedback"></div>
      <button onclick="home()">Volver al inicio</button>
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
      setTimeout(()=>home(),1500);
      return;
    }
    lives--;
    if(lives<=0){
      alert('Fin del juego. Puntos: '+score);
      saveRecord(playerName,score);
      home();
    }else{
      document.getElementById('lives').textContent=lives;
      document.getElementById('feedback').textContent='💔';
      setTimeout(()=>nextQuestion(mode==='Repasar'?current[0]:null),800);
    }
  }
}

function showJumpscare(){
  const overlay=document.createElement('div');
  overlay.className='overlay';
  const img=document.createElement('img');
  const pics=['jump1.png','jump2.png','jump3.png','jump4.png','jump5.png'];
  img.src='assets/'+pics[Math.floor(Math.random()*pics.length)];
  overlay.appendChild(img);
  document.body.appendChild(overlay);
  const audio=new Audio('assets/scream1.mp3');audio.play();
  setTimeout(()=>{document.body.removeChild(overlay);},1000);
}

home();
