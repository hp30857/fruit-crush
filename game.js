//== 果果消消乐 game.js ==
var N=6,CS=50,G=3;
var FRUITS=[
  {e:'🍎',n:'苹果'},{e:'🍊',n:'橙子'},{e:'🍋',n:'柠檬'},
  {e:'🍇',n:'葡萄'},{e:'🍓',n:'草莓'},{e:'🍑',n:'桃子'},
  {e:'🥝',n:'猕猴桃'},{e:'🍉',n:'西瓜'},{e:'🍒',n:'樱桃'},{e:'🍌',n:'香蕉'}
];
var NAMES='苹果园,橙子林,柠檬田,葡萄架,草莓地,桃子山,猕猴桃谷,西瓜田,樱桃园,芒果林,椰子岛,热带果园,菠萝山,蓝莓谷,石榴园,香蕉林,荔枝园,火龙果园,百香果园,丰收祭,杏花村,无花果林,柿子坡,山楂谷,杨梅岭,枇杷山,甘蔗田,蜜瓜园,红枣林,桂花园,桑葚岭,橄榄坡,青梅谷,海棠苑,琵琶洲,榴莲山,山竹岛,莲雾湾,释迦林,红毛丹园,仙境果园,金色麦田,彩虹农场,月光葡萄园,翡翠柠檬林,水晶草莓谷,玛瑙桃子山,琥珀猕猴园,珍珠西瓜田,珊瑚樱桃林,黄金芒果岛,白金椰子林,钻石菠萝岭,红宝石蓝莓谷,蓝宝石石榴园,紫晶香蕉林,绿玉荔枝园,星光火龙果园,云海百香果园,太阳丰收祭,远古果园,失落农场,遗忘森林,风暴果园,雷霆山谷,极光果园,迷雾农场,深渊森林,火焰山谷,寒冰果园,神圣农场,巨龙果园,凤凰山谷,独角兽果园,狮鹫农场,巨蛇森林,海妖果园,妖精山谷,矮人农场,精灵果园,无尽果园,极限农场,终极森林,顶点山谷,王者果园,至尊农场,传说森林,神话山谷,史诗果园,永恒农场,奇迹森林,命运山谷,荣耀果园,胜利农场,梦想森林,希望山谷,勇气果园,智慧农场,力量森林,终点山谷'.split(',');

function getLevel(lv){
  var t=(lv-1)/99;
  return {
    name:NAMES[lv-1]||'第'+lv+'关',
    targetScore:Math.round(3000+(150000-3000)*Math.pow(t,1.6)),
    maxMoves:Math.round(30-(30-12)*t),
    timeLimit:Math.round(150-(150-45)*t),
    cType:lv%3!==0?(lv%10):-1,
    cCount:lv%3!==0?Math.round(10+t*60):0,
    fruitTypes:lv<=10?4:lv<=25?5:lv<=45?6:lv<=70?7:8
  };
}

var save=JSON.parse(localStorage.getItem('fc_save')||'{"unlocked":1,"stars":[],"coins":500,"power":[3,1,2,2]}');
if(!save.stars||!save.stars.length)save.stars=Array(100).fill(0);
function sv(){localStorage.setItem('fc_save',JSON.stringify(save))}

//== 音效 ==
var SOUND=true,_ctx=null;
function play(f,d,v,t){
  if(!SOUND)return;d=d||0.08;v=v||0.06;t=t||'sine';
  try{
    if(!_ctx)_ctx=new(window.AudioContext||window.webkitAudioContext)();
    if(_ctx.state==='suspended')_ctx.resume();
    var o=_ctx.createOscillator(),g=_ctx.createGain();
    o.type=t;o.frequency.value=f;
    g.gain.setValueAtTime(v,_ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,_ctx.currentTime+d);
    o.connect(g);g.connect(_ctx.destination);
    o.start();o.stop(_ctx.currentTime+d);
  }catch(e){}
}
var SFX={
  tap:function(){play(660,0.12,0.04)},
  swap:function(){play(440,0.15,0.05,'triangle');setTimeout(function(){play(550,0.12,0.04,'triangle')},80)},
  pop:function(){play(1100,0.12,0.06);setTimeout(function(){play(1400,0.08,0.04)},60)},
  combo:function(){play(900,0.1,0.05);setTimeout(function(){play(1200,0.1,0.05)},100);setTimeout(function(){play(1600,0.15,0.06)},200)},
  win:function(){[523,659,784,1047,1319].forEach(function(f,i){setTimeout(function(){play(f,0.25,0.08)},i*150)})}
};

//== 游戏状态 ==
var lv=1,gc=null,gs=0,gm=0,gt=0,gcl=0,gsr=-1,gsc=-1,gbu=false,gcb=false;
var gd=[],gcs=[],gti=null,gp=0;

//== 页面 ==
function goPage(id){
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active')});
  var el=document.getElementById(id);if(el)el.classList.add('active');
  if(id==='home'){document.getElementById('hlv').textContent=save.unlocked;document.getElementById('hcoin').textContent=save.coins}
  if(id==='levels')rLv();if(id==='shop')rSh();if(id!=='game'&&id!=='intro')stT();
}
var _pendingLv=1;
// 关卡预览
function showIntro(lvl){
  _pendingLv=lvl;
  var cfg=getLevel(lvl);
  document.getElementById('ilv').textContent='第 '+lvl+' 关 · '+cfg.name;
  document.getElementById('imv').textContent='步数：'+cfg.maxMoves;
  document.getElementById('ibig').textContent=cfg.maxMoves;
  if(cfg.cType>=0){
    var f=FRUITS[cfg.cType];
    document.getElementById('imiss').innerHTML='<span class=\"im-icon\">'+f.e+'</span><span>收集 '+f.n+'：'+cfg.cCount+'</span>';
  }else{
    document.getElementById('imiss').innerHTML='<span>目标分数：'+cfg.targetScore+'</span>';
  }
  document.getElementById('iextra').innerHTML='<span>⏱ '+Math.floor(cfg.timeLimit/60)+':'+(cfg.timeLimit%60<10?'0':'')+cfg.timeLimit%60+'</span>';
  var b=document.getElementById('iboard');b.innerHTML='';
  var types=cfg.fruitTypes;
  for(var i=0;i<36;i++){
    var c=document.createElement('div');c.className='ic';
    c.textContent=FRUITS[Math.floor(Math.random()*types)].e;b.appendChild(c);
  }
  goPage('intro');
}
// 预览页按钮 → 用存储的关卡号
function goStart(){goGame(_pendingLv)}
// 首页按钮 → 预览页
function goPlay(){showIntro(save.unlocked)}

//== 关卡地图 ==
function rLv(){
  document.getElementById('lpg').textContent='第 '+(gp+1)+'/5 页';
  var g=document.getElementById('lgrid');g.innerHTML='';
  var s=gp*20+1,e=Math.min(s+19,100);
  for(var i=s;i<=e;i++){
    var d=document.createElement('div');d.className='ld';
    if(i<=save.unlocked)d.classList.add(i===save.unlocked?'cur':'done');
    else d.classList.add('lock');
    var st=save.stars[i-1]||0;
    d.innerHTML=i+(st>0?'<div class="lds">'+'★'.repeat(st)+'</div>':'');
    if(i<=save.unlocked)d.onclick=(function(li){return function(){goGame(li)}})(i);
    g.appendChild(d);
  }
  var nav=document.getElementById('lnav');nav.innerHTML='';
  if(gp>0){var b1=document.createElement('button');b1.textContent='← 上一页';b1.onclick=function(){gp--;rLv()};nav.appendChild(b1)}
  if(gp<4){var b2=document.createElement('button');b2.textContent='下一页 →';b2.onclick=function(){gp++;rLv()};nav.appendChild(b2)}
  var bk=document.createElement('button');bk.textContent='← 返回';bk.className='back-btn';bk.onclick=function(){gp=0;goPage('home')};nav.appendChild(bk);
}

//== 商店 ==
function rSh(){
  document.getElementById('scoin').textContent=save.coins;
  var items=[
    {i:'🔧',n:'铲子',d:'移除一个水果',c:200,t:0},{i:'💣',n:'炸弹',d:'消除3×3范围',c:400,t:1},
    {i:'❄',n:'冰冻',d:'冻结一列',c:300,t:2},{i:'🔀',n:'洗牌',d:'重新排列棋盘',c:250,t:3}
  ];
  var sl=document.getElementById('slist');sl.innerHTML='';
  items.forEach(function(it){
    var r=document.createElement('div');r.className='sitem';
    r.innerHTML='<span class="si">'+it.i+'</span><div style="flex:1"><div class="sn">'+it.n+'</div><div class="sd">'+it.d+'</div></div><button class="sb">◈ '+it.c+'</button>';
    r.querySelector('button').onclick=function(){
      if(save.coins>=it.c){save.coins-=it.c;save.power[it.t]++;sv();rSh();rPw()}
    };
    sl.appendChild(r);
  });
}

//== 进入关卡 ==
function goGame(lvl){
  stT();lv=lvl;gc=getLevel(lvl);_chkDone=false;
  gs=0;gm=gc.maxMoves;gt=gc.timeLimit;gcl=0;gsr=-1;gsc=-1;gbu=false;gcb=false;
  goPage('game');
  document.getElementById('glv').textContent='第 '+lvl+' 关 · '+gc.name;
  genB();renB(true);upUI();rPw();staT();
}
function staT(){stT();gti=setInterval(function(){
  if(gbu||_rendering)return;
  var active=document.getElementById('game').classList.contains('active');
  if(!active)return;
  if(gt>0){gt--;upUI()}
  chkE();
},1000)}
function stT(){if(gti){clearInterval(gti);gti=null}}
function goPause(){stT();showModal('⏸','暂停中','',[],function(){staT();closeModal()})}

//== 棋盘 ==
function genB(){
  gd=[];
  for(var r=0;r<N;r++){gd[r]=[];
    for(var c=0;c<N;c++){
      var t;
      do{t=Math.floor(Math.random()*gc.fruitTypes)}while(nI(r,c,t));
      gd[r][c]=t;
    }
  }
}
function nI(r,c,t){
  if(c>=2&&gd[r][c-1]===t&&gd[r][c-2]===t)return true;
  if(r>=2&&gd[r-1]&&gd[r-1][c]===t&&gd[r-2]&&gd[r-2][c]===t)return true;
  return false;
}
var _rendering=false;
function renB(an){
  if(_rendering)return;_rendering=true;
  var b=document.getElementById('board'),frag=document.createDocumentFragment();
  gcs=[];
  for(var r=0;r<N;r++){gcs[r]=[];
    for(var c=0;c<N;c++){
      var f=FRUITS[gd[r][c]],cell=document.createElement('div');
      cell.className='cell c'+gd[r][c]+'b';cell.textContent=f.e;
      if(an)cell.style.animation='drop .35s ease-out '+(r*0.03+c*0.015).toFixed(2)+'s both';
      cell.onclick=(function(rr,cc){return function(){onT(rr,cc)}})(r,c);
      frag.appendChild(cell);gcs[r][c]=cell;
    }
  }
  b.innerHTML='';b.appendChild(frag);
  if(an){var cs=b.querySelectorAll('.cell');
    if(cs.length>1){cs[0].classList.add('hint');cs[1].classList.add('hint')}
  }
  resetHint();_rendering=false;
}
function upUI(){
  document.getElementById('gsc').textContent=gs;
  document.getElementById('gmv').textContent=gm;
  var m=Math.floor(gt/60),s=gt%60;
  document.getElementById('gtm').textContent=m+':'+(s<10?'0':'')+s;
  document.getElementById('gtm').style.color=gt<=10?'#e04060':'#c83050';
  document.getElementById('gtg').textContent=gc.targetScore;
  if(gc.cType>=0){
    var f=FRUITS[gc.cType];
    document.getElementById('gclt').textContent='收集 '+f.e+f.n;
    document.getElementById('gcln').textContent=gcl+'/'+gc.cCount;
    document.getElementById('gclb').style.width=(Math.min(1,gcl/gc.cCount)*100)+'%';
    document.getElementById('gcdiv').style.display='flex';
  }else{document.getElementById('gcdiv').style.display='none'}
}
function rPw(){
  var icons=['🔧','💣','❄','🔀'],acts=[uSh,uBo,uFr,uSf];
  var p=document.getElementById('gpwrs');p.innerHTML='';
  icons.forEach(function(ico,i){
    var b=document.createElement('div');b.className='pw';
    b.innerHTML=ico+'<span class="pwb">'+save.power[i]+'</span>';
    b.onclick=acts[i];p.appendChild(b);
  });
}

//== 点击+滑动 ==
var swR=-1,swC=-1,swX=0,swY=0;
function onT(r,c){
  if(gbu)return;SFX.tap();
  if(gsr<0)sel(r,c);
  else if(gsr===r&&gsc===c)des();
  else if(Math.abs(gsr-r)+Math.abs(gsc-c)===1)dSw(gsr,gsc,r,c);
  else{des();sel(r,c)}
}
function sel(r,c){gsr=r;gsc=c;var cell=gcs[r][c];if(cell)cell.classList.add('sel')}
function des(){var cell=gcs[gsr]&&gcs[gsr][gsc];if(cell)cell.classList.remove('sel');gsr=-1;gsc=-1}
function iSw(){
  var board=document.getElementById('board'),dc=null,hm=false;
  board.addEventListener('pointerdown',function(e){
    if(gbu)return;var cell=e.target.closest('.cell');if(!cell)return;
    var idx=Array.from(board.children).indexOf(cell);if(idx<0)return;
    swR=Math.floor(idx/N);swC=idx%N;swX=e.clientX;swY=e.clientY;dc=cell;hm=false;
    cell.style.transition='none';cell.style.zIndex='5';
  });
  board.addEventListener('pointermove',function(e){
    if(!dc||gbu)return;
    var dx=e.clientX-swX,dy=e.clientY-swY;
    if(Math.abs(dx)+Math.abs(dy)>8)hm=true;
    if(hm){var m=CS*0.6;dc.style.transform='translate('+Math.max(-m,Math.min(m,dx))+'px,'+Math.max(-m,Math.min(m,dy))+'px)'}
  });
  board.addEventListener('pointerup',function(e){
    if(dc){dc.style.transition='transform .15s ease-out';dc.style.transform='';dc.style.zIndex=''}
    if(gbu||swR<0){dc=null;return}
    var dx=e.clientX-swX,dy=e.clientY-swY;
    if(hm&&Math.abs(dx)+Math.abs(dy)>12){
      var tr=swR,tc=swC;
      if(Math.abs(dx)>Math.abs(dy))tc+=dx>0?1:-1;else tr+=dy>0?1:-1;
      if(tr>=0&&tr<N&&tc>=0&&tc<N&&Math.abs(tr-swR)+Math.abs(tc-swC)===1){des();dSw(swR,swC,tr,tc)}
    }
    dc=null;swR=-1;
  });
  board.addEventListener('pointerleave',function(){
    if(dc){dc.style.transition='transform .15s ease-out';dc.style.transform='';dc.style.zIndex=''}
    dc=null;swR=-1;
  });
}

//== 交换 ==
function dSw(r1,c1,r2,c2){
  gbu=true;gcb=false;des();
  var t=gd[r1][c1];gd[r1][c1]=gd[r2][c2];gd[r2][c2]=t;
  aSw(r1,c1,r2,c2).then(function(){
    var m=mats();
    if(m.size>0){
      gm--;SFX.swap();upUI();
      if(!gcb){sTst(m.size);SFX.combo();gcb=true}
      dRm(m).then(function(){chkE()});
    }else{
      aSw(r2,c2,r1,c1).then(function(){
        var t2=gd[r1][c1];gd[r1][c1]=gd[r2][c2];gd[r2][c2]=t2;
        gbu=false;resetHint();chkNo();
      });
      return;
    }
    gbu=false;resetHint();chkNo();
  });
}
function aSw(r1,c1,r2,c2){
  return new Promise(function(res){
    var a=gcs[r1][c1],b=gcs[r2][c2];if(!a||!b){res();return}
    var pa=a.getBoundingClientRect(),pb=b.getBoundingClientRect();
    gcs[r1][c1]=b;gcs[r2][c2]=a;
    var dx=pb.left-pa.left,dy=pb.top-pa.top;
    a.style.transition='transform .16s';a.style.transform='translate('+dx+'px,'+dy+'px)';
    b.style.transition='transform .16s';b.style.transform='translate('+(-dx)+'px,'+(-dy)+'px)';
    setTimeout(function(){a.style.transition='';a.style.transform='';b.style.transition='';b.style.transform='';res()},170);
  });
}

//== 匹配 ==
function mats(){
  var s=new Set();
  for(var r=0;r<N;r++)for(var c=0;c<N-2;c++){
    var t=gd[r][c];if(t<0)continue;var n=1;
    while(c+n<N&&gd[r][c+n]===t)n++;
    if(n>=3)for(var i=0;i<n;i++)s.add(r+','+(c+i));
    if(n>1)c+=n-2;
  }
  for(var c=0;c<N;c++)for(var r=0;r<N-2;r++){
    var t=gd[r][c];if(t<0)continue;var n=1;
    while(r+n<N&&gd[r+n][c]===t)n++;
    if(n>=3)for(var i=0;i<n;i++)s.add((r+i)+','+c);
    if(n>1)r+=n-2;
  }
  return s;
}

//== 消除 ==
function dRm(m){
  return new Promise(function(res){
    m.forEach(function(k){
      var p=k.split(','),r=parseInt(p[0]),c=parseInt(p[1]);
      if(gd[r][c]===gc.cType)gcl++;scorePop(r,c,100);
    });
    gs+=m.size*100;SFX.pop();upUI();
    aSh(m).then(function(){
      m.forEach(function(k){var p=k.split(',');gd[parseInt(p[0])][parseInt(p[1])]=-1});
      grav();renB(false);
      var nx=mats();if(nx.size>0){SFX.combo();dRm(nx).then(res)}else res();
    });
  });
}
function aSh(m){
  return new Promise(function(res){
    var t=m.size,d=0;if(t===0){res();return}
    m.forEach(function(k){
      var p=k.split(','),r=parseInt(p[0]),c=parseInt(p[1]);
      var cell=gcs[r]&&gcs[r][c];
      if(cell){
        cell.style.transition='transform .3s ease-out,opacity .3s';
        cell.style.transform='scale(1.4)';
        cell.style.opacity='0';
      }
      setTimeout(function(){if(++d>=t)res()},320);
    });
  });
}
function grav(){
  for(var c=0;c<N;c++){
    var col=[];
    for(var r=N-1;r>=0;r--){if(gd[r][c]>=0)col.push(gd[r][c])}
    while(col.length<N)col.push(Math.floor(Math.random()*gc.fruitTypes));
    for(var r=0;r<N;r++)gd[r][c]=col[N-1-r];
  }
}

//== 胜负 ==
var _chkDone=false;
function chkE(){
  if(_chkDone)return;
  var scoreWin=gs>=gc.targetScore;
  var collWin=gcl>=gc.cCount;
  var win=(gc.cType<0)?scoreWin:(scoreWin||collWin);
  if(win){
    _chkDone=true;stT();SFX.win();
    var st=(scoreWin&&collWin)?3:(scoreWin||collWin)?2:1;
    if(st>(save.stars[lv-1]||0))save.stars[lv-1]=st;
    save.coins+=st*100;if(lv>=save.unlocked&&lv<100)save.unlocked=lv+1;sv();
    showModal('🏆','关卡通过！',gc.name+' · 第 '+lv+' 关',
      ['评分 '+'★'.repeat(st)+'☆'.repeat(3-st),'◈ +'+(st*100)+' 果汁','得分 '+gs],
      [{t:'▶ 下一关',p:true,a:function(){closeModal();goGame(Math.min(lv+1,100))}},
       {t:'🗺 地图',p:false,a:function(){closeModal();goPage('levels')}}]);
  }else if(gm<=0||gt<=0){
    stT();
    showModal(gt<=0?'⏰':'🔢',gt<=0?'时间到了！':'步数用完了！',
      gc.name+' · 第 '+lv+' 关',['得分 '+gs+'/'+gc.targetScore],
      [{t:'🔄 重试',p:true,a:function(){closeModal();goGame(lv)}},
       {t:'🗺 地图',p:false,a:function(){closeModal();goPage('levels')}}]);
  }
}

//== 提示+无步检测 ==
function findHint(){
  for(var r=0;r<N;r++)for(var c=0;c<N;c++){
    if(c+1<N){
      var t=gd[r][c];gd[r][c]=gd[r][c+1];gd[r][c+1]=t;
      if(mats().size>0){gd[r][c+1]=gd[r][c];gd[r][c]=t;return{r:r,c:c,r2:r,c2:c+1}}
      gd[r][c+1]=gd[r][c];gd[r][c]=t;
    }
    if(r+1<N){
      var t=gd[r][c];gd[r][c]=gd[r+1][c];gd[r+1][c]=t;
      if(mats().size>0){gd[r+1][c]=gd[r][c];gd[r][c]=t;return{r:r,c:c,r2:r+1,c2:c}}
      gd[r+1][c]=gd[r][c];gd[r][c]=t;
    }
  }
  return null;
}
var hintTimer=null;
function resetHint(){
  if(hintTimer)clearTimeout(hintTimer);
  document.querySelectorAll('.cell.hint').forEach(function(c){c.classList.remove('hint')});
  hintTimer=setTimeout(function(){
    if(gbu||!document.getElementById('game').classList.contains('active'))return;
    var h=findHint();
    if(h){var a=gcs[h.r]&&gcs[h.r][h.c],b=gcs[h.r2]&&gcs[h.r2][h.c2];if(a)a.classList.add('hint');if(b)b.classList.add('hint')}
  },4000);
}
function chkNo(){
  if(!findHint()){
    setTimeout(function(){
      var b=document.getElementById('board');b.classList.add('no-moves-flash');
      setTimeout(function(){b.classList.remove('no-moves-flash');uSf()},1500);
    },600);
  }
}

//== 道具 ==
function uSh(){
  if(!save.power[0]||gbu)return;save.power[0]--;sv();rPw();
  gd[Math.floor(Math.random()*N)][Math.floor(Math.random()*N)]=Math.floor(Math.random()*gc.fruitTypes);
  renB(false);
}
function uBo(){
  if(!save.power[1]||gbu||gsr<0)return;save.power[1]--;sv();rPw();
  gbu=true;des();var m=new Set();
  for(var dr=-1;dr<=1;dr++)for(var dc=-1;dc<=1;dc++){
    var tr=gsr+dr,tc=gsc+dc;if(tr>=0&&tr<N&&tc>=0&&tc<N)m.add(tr+','+tc);
  }
  dRm(m).then(function(){gbu=false;chkE()});
}
function uFr(){
  if(!save.power[2]||gbu)return;save.power[2]--;sv();rPw();
  var col=Math.floor(Math.random()*N),t=Math.floor(Math.random()*gc.fruitTypes);
  for(var r=0;r<N;r++)gd[r][col]=t;renB(false);
}
function uSf(){
  if(!save.power[3]||gbu)return;save.power[3]--;sv();rPw();
  var all=[];
  for(var r=0;r<N;r++)for(var c=0;c<N;c++)all.push(gd[r][c]);
  for(var i=all.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=all[i];all[i]=all[j];all[j]=t}
  var idx=0;for(var r=0;r<N;r++)for(var c=0;c<N;c++)gd[r][c]=all[idx++];
  renB(false);
}

//== 特效 ==
function scorePop(r,c,pts){
  try{
    var cell=gcs[r]&&gcs[r][c];if(!cell)return;
    var board=document.getElementById('board'),br=board.getBoundingClientRect();
    var cr=cell.getBoundingClientRect();
    var el=document.createElement('div');el.className='score-pop';el.textContent='+'+pts;
    el.style.left=(cr.left+cr.width/2-br.left-20)+'px';
    el.style.top=(cr.top-br.top-10)+'px';
    board.appendChild(el);setTimeout(function(){el.remove()},700);
  }catch(e){}
}
function sTst(cnt){
  var msgs=cnt>=15?['🔥 不可思议!','💥 超级连击!']:cnt>=10?['⚡ Amazing!','🌟 太棒了!']:cnt>=6?['✨ Great!','👏 漂亮!']:['👍 Nice!','🎯 Good!'];
  var t=document.createElement('div');t.className='toast';t.textContent=msgs[Math.floor(Math.random()*msgs.length)];
  document.getElementById('game').appendChild(t);setTimeout(function(){t.remove()},1000);
}
function sparkleBurst(x,y,count){
  var board=document.getElementById('board'),colors=['#ff8090','#ffb080','#ffe080','#ff80b0','#ffa0c0','#fff'];
  for(var i=0;i<count;i++){
    var s=document.createElement('div');s.className='sparkle';
    s.style.left=(x-board.getBoundingClientRect().left)+'px';
    s.style.top=(y-board.getBoundingClientRect().top)+'px';
    s.style.background=colors[Math.floor(Math.random()*colors.length)];
    s.style.width=s.style.height=(4+Math.random()*8)+'px';
    var ang=Math.random()*Math.PI*2,dist=20+Math.random()*50;
    s.style.transform='translate('+Math.cos(ang)*dist+'px,'+Math.sin(ang)*dist+'px)';
    board.appendChild(s);setTimeout(function(s2){return function(){s2.remove()}}(s),600);
  }
}

//== 弹窗 ==
function showModal(icon,title,sub,lines,btns){
  var h='<div class="ov" onclick="event.stopPropagation()"><div class="md"><div class="mi">'+icon+'</div><div class="mt">'+title+'</div><div class="ms">'+sub+'</div>';
  if(lines&&lines.length)lines.forEach(function(l){h+='<div class="mr">'+l+'</div>'});
  if(btns&&btns.length)btns.forEach(function(b){h+='<button class="mb '+(b.p?'mp':'mn')+'" id="mbtn_'+b.t+'">'+b.t+'</button>'});
  h+='</div></div>';document.getElementById('modals').innerHTML=h;
  if(btns&&btns.length)btns.forEach(function(b){var el=document.getElementById('mbtn_'+b.t);if(el)el.onclick=b.a});
}
function closeModal(){document.getElementById('modals').innerHTML=''}

function goSettings(){
  var cls=SOUND?'on':'off';
  var h='<div class="ov" onclick="closeModal()"><div class="md" onclick="event.stopPropagation()"><div class="mi">⚙</div><div class="mt">设置</div>';
  h+='<div class="setrow"><span>🔊 音效</span><div class="toggle '+cls+'" id="togg"></div></div>';
  h+='<button class="mb mn" onclick="closeModal()" style="margin-top:12px">关闭</button></div></div>';
  document.getElementById('modals').innerHTML=h;
  document.getElementById('togg').onclick=function(){SOUND=!SOUND;this.className='toggle '+(SOUND?'on':'off')};
}

//== 启动 ==
iSw();goPage('home');
