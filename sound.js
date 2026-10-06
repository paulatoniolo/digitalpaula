/* SOUND DESIGN de digitalpaula (2026-10-06). Paleta "data / glitch minimal", todo
   sintetizado en vivo con Web Audio: cero archivos de audio. Probado y elegido en
   sound-lab.html (ahi estan todas las variantes; para cambiar una, se copia su funcion aca).

   - Arranca APAGADO. El boton ".snd-btn" ("// sound off" / "// sound on") lo prende y se
     recuerda (localStorage). Si quedo prendido, el navegador igual exige un gesto: el primer
     click o tecla de la visita despierta el audio.
   - Prendido = ambiente de fondo en loop + sonidos de interfaz:
       tick      cada letra del texto mono que se escribe (lo llaman los typewriters: dpTick())
       hover     al entrar con el mouse a links, botones, filas, logos (solo con mouse)
       click     al tocar links y botones
       open      se abre un proyecto (overlay #workOverlay)        -> "encendido de sistema"
       close     se cierra el proyecto / la galeria
       gallery   se abre la galeria del logofolio (#lfgGal)         -> "destello de datos"
       menu      se abre / cierra el menu lateral
   - Los overlays se escuchan con MutationObserver sobre su clase "open": no hace falta tocar
     el codigo que los abre. */
(function(){
  const KEY = 'dpSound';
  let CTX = null, BUS = null, ON = false, pararAmb = null;
  try{ ON = localStorage.getItem(KEY) === 'on'; }catch(e){}
  const E = 0.001;
  const rnd = a => a[Math.floor(Math.random() * a.length)];

  function ctx(){
    if(!CTX){
      const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return null;
      CTX = new AC();
      // refuerzo + limitador: fuerte sin saturar cuando se pisan varios sonidos
      const comp = CTX.createDynamicsCompressor();
      comp.threshold.value = -10; comp.knee.value = 6; comp.ratio.value = 12; comp.attack.value = 0.002; comp.release.value = 0.12;
      comp.connect(CTX.destination);
      BUS = CTX.createGain(); BUS.gain.value = 2.2; BUS.connect(comp);
    }
    if(CTX.state === 'suspended') CTX.resume();
    return CTX;
  }
  function pip(c, d, t, f, dur, g, type){
    const o = c.createOscillator(), v = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    v.gain.setValueAtTime(E, t); v.gain.linearRampToValueAtTime(g, t + 0.0008);
    v.gain.exponentialRampToValueAtTime(E, t + dur);
    o.connect(v).connect(d); o.start(t); o.stop(t + dur + 0.01);
  }
  let NB = null;
  function noise(c){
    if(NB) return NB;
    NB = c.createBuffer(1, c.sampleRate, c.sampleRate); const x = NB.getChannelData(0);
    for(let i = 0; i < x.length; i++) x[i] = Math.random() * 2 - 1;
    return NB;
  }
  function burst(c, d, t, dur, g, hp){
    const s = c.createBufferSource(); s.buffer = noise(c);
    const h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = hp || 3000;
    const v = c.createGain(); v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(E, t + dur);
    s.connect(h).connect(v).connect(d); s.start(t, Math.random() * .5); s.stop(t + dur + 0.01);
  }

  const S = {
    tick(c, d){ pip(c, d, c.currentTime, rnd([4186, 4699, 5274, 6272]), 0.006, 0.05); },
    hover(c, d){ pip(c, d, c.currentTime, rnd([1760, 2093, 2637]), 0.03, 0.05); },
    click(c, d){ const t = c.currentTime;
      const o = c.createOscillator(), v = c.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.04);
      v.gain.setValueAtTime(0.22, t); v.gain.exponentialRampToValueAtTime(E, t + 0.06);
      o.connect(v).connect(d); o.start(t); o.stop(t + 0.07);
      burst(c, d, t, 0.008, 0.18, 4000); },
    // abrir: golpe grave cortito + dos pips limpios en octava ("encendido de sistema")
    open(c, d){ const t = c.currentTime;
      const o = c.createOscillator(), v = c.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
      v.gain.setValueAtTime(0.5, t); v.gain.exponentialRampToValueAtTime(E, t + 0.16);
      o.connect(v).connect(d); o.start(t); o.stop(t + 0.18);
      pip(c, d, t + 0.05, 4186, 0.05, 0.12); pip(c, d, t + 0.1, 8372, 0.08, 0.07); },
    // cerrar: el mismo gesto al reves (pips que bajan + golpe al final, mas suave) -> hace juego
    close(c, d){ const t = c.currentTime;
      pip(c, d, t, 8372, 0.04, 0.06); pip(c, d, t + 0.045, 4186, 0.05, 0.1);
      const o = c.createOscillator(), v = c.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(120, t + 0.09); o.frequency.exponentialRampToValueAtTime(40, t + 0.2);
      v.gain.setValueAtTime(E, t + 0.09); v.gain.linearRampToValueAtTime(0.35, t + 0.095); v.gain.exponentialRampToValueAtTime(E, t + 0.22);
      o.connect(v).connect(d); o.start(t + 0.09); o.stop(t + 0.24); },
    gallery(c, d){ const t = c.currentTime;
      const dl = c.createDelay(); dl.delayTime.value = 0.09; const fb = c.createGain(); fb.gain.value = 0.32;
      const wet = c.createGain(); wet.gain.value = 0.5; dl.connect(fb).connect(dl); dl.connect(wet).connect(d);
      setTimeout(() => { try{ dl.disconnect(); fb.disconnect(); wet.disconnect(); }catch(e){} }, 1500);
      [2093, 2637, 3136, 4186, 5274].forEach((f, i) => { pip(c, d, t + i * 0.032, f, 0.09, 0.11); pip(c, dl, t + i * 0.032, f, 0.09, 0.11); }); },
    menuOpen(c, d){ const t = c.currentTime; pip(c, d, t, 1318, 0.02, 0.05, 'square'); pip(c, d, t + 0.04, 2637, 0.03, 0.05, 'square'); },
    menuClose(c, d){ const t = c.currentTime; pip(c, d, t, 2637, 0.02, 0.05, 'square'); pip(c, d, t + 0.04, 1318, 0.03, 0.05, 'square'); },
    toggleOn(c, d){ const t = c.currentTime; pip(c, d, t, 1000, 0.03, 0.12); pip(c, d, t + 0.06, 2000, 0.05, 0.12); },
    toggleOff(c, d){ const t = c.currentTime; pip(c, d, t, 2000, 0.03, 0.1); pip(c, d, t + 0.06, 1000, 0.05, 0.1); },
  };

  // ambiente: pad de dos sierras (110 Hz) por un pasabajos que respira + seno en 220 +
  // cama de ruido de datos + pips sueltos al azar
  function ambiente(){
    const c = ctx(); if(!c) return null;
    const t = c.currentTime, bus = c.createGain(); bus.gain.setValueAtTime(E, t); bus.gain.exponentialRampToValueAtTime(0.28, t + 3);   // bajado de 0.8 (Paula: "muy fuerte") bus.connect(BUS);
    const nodos = [];
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 4; lp.connect(bus);
    const lfo = c.createOscillator(), lfoG = c.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 450;
    lfo.connect(lfoG).connect(lp.frequency); lfo.start(t); nodos.push(lfo);
    [[110, .045, 'sawtooth'], [110.6, .045, 'sawtooth'], [55, .07, 'sine']].forEach(([f, g, ty]) => {
      const o = c.createOscillator(), v = c.createGain(); o.type = ty; o.frequency.value = f; v.gain.value = g; o.connect(v).connect(lp); o.start(t); nodos.push(o); });
    { const o = c.createOscillator(), v = c.createGain(); o.frequency.value = 220.3; v.gain.value = 0.025; o.connect(v).connect(bus); o.start(t); nodos.push(o); }
    const s = c.createBufferSource(); s.buffer = noise(c); s.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 6000; bp.Q.value = 3;
    const nv = c.createGain(); nv.gain.value = 0.02; s.connect(bp).connect(nv).connect(bus); s.start(t); nodos.push(s);
    const sembrar = (desde, hasta) => { for(let x = desde + 0.3; x < hasta; x += 0.25 + Math.random() * 1.6) pip(c, bus, x, rnd([2093, 3136, 4186, 5274, 6272]), 0.012, 0.05); };
    let hasta = t + 4; sembrar(t, hasta);
    const iv = setInterval(() => { sembrar(Math.max(hasta, c.currentTime), c.currentTime + 4); hasta = c.currentTime + 4; }, 3000);
    return () => { clearInterval(iv); const n = c.currentTime; bus.gain.cancelScheduledValues(n); bus.gain.setValueAtTime(Math.max(bus.gain.value, E), n);
      bus.gain.exponentialRampToValueAtTime(E, n + 1); nodos.forEach(o => o.stop(n + 1.1)); setTimeout(() => bus.disconnect(), 1300); };
  }

  // reproducir (solo prendido y con el audio ya despierto); tope de frecuencia por sonido
  const ultimo = {};
  function play(k, min){
    if(!ON || !CTX || CTX.state !== 'running') return;
    const ahora = performance.now(); if(min && ahora - (ultimo[k] || 0) < min) return; ultimo[k] = ahora;
    try{ S[k](CTX, BUS); }catch(e){}
  }
  window.dpTick = () => play('tick', 22);

  /* ---------- boton ---------- */
  const botones = [...document.querySelectorAll('.snd-btn')];
  function pintar(){ botones.forEach(b => { b.classList.toggle('on', ON); b.setAttribute('aria-pressed', ON); b.querySelector('.snd-st').textContent = ON ? 'on' : 'off'; }); }
  function arrancarAmb(){ if(ON && !pararAmb && !document.hidden) pararAmb = ambiente(); }
  function frenarAmb(){ if(pararAmb){ pararAmb(); pararAmb = null; } }
  botones.forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    ON = !ON; try{ localStorage.setItem(KEY, ON ? 'on' : 'off'); }catch(err){}
    const c = ctx(); pintar();
    if(!c) return;
    const sonar = () => { try{ S[ON ? 'toggleOn' : 'toggleOff'](c, BUS); }catch(err){} ON ? arrancarAmb() : frenarAmb(); };
    c.state === 'running' ? sonar() : c.resume().then(sonar);
  }));
  pintar();
  // quedo prendido de otra visita: se despierta con el primer gesto
  if(ON){
    const despertar = () => { const c = ctx(); if(c) c.resume().then(arrancarAmb);
      removeEventListener('pointerdown', despertar, true); removeEventListener('keydown', despertar, true); };
    addEventListener('pointerdown', despertar, true); addEventListener('keydown', despertar, true);
  }
  document.addEventListener('visibilitychange', () => { document.hidden ? frenarAmb() : arrancarAmb(); });

  /* ---------- hover y click (delegados) ---------- */
  const SEL = 'a, button, .wrow, .wrow-thumb, .lfg-cell, .lfg-ir, .lfx, [data-hover], select, input, textarea, .lt-dd-opt';
  // estos ya suenan con su propia transicion (abrir proyecto / galeria): sin click encima
  const ABRE = '.wrow, .lfg-cell.tiene-gal, .lfg-ir';
  if(matchMedia('(hover:hover)').matches){
    let actual = null;
    document.addEventListener('mouseover', e => {
      const el = e.target.closest && e.target.closest(SEL);
      if(el === actual) return; actual = el;
      if(el && !el.closest('.snd-btn')) play('hover', 45);
    }, true);
  }
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest && e.target.closest(SEL);
    if(!el || el.closest('.snd-btn') || el.closest(ABRE)) return;
    play('click', 40);
  }, true);

  /* ---------- transiciones: se escucha la clase "open" de cada overlay ---------- */
  function vigilar(el, alAbrir, alCerrar){
    if(!el) return;
    let abierto = el.classList.contains('open');
    new MutationObserver(() => {
      const ahora = el.classList.contains('open'); if(ahora === abierto) return; abierto = ahora;
      play(ahora ? alAbrir : alCerrar, 120);
    }).observe(el, {attributes: true, attributeFilter: ['class']});
  }
  vigilar(document.getElementById('workOverlay'), 'open', 'close');
  vigilar(document.getElementById('lfgGal'), 'gallery', 'close');
  vigilar(document.getElementById('menuPanel'), 'menuOpen', 'menuClose');
})();
