/* globals AFRAME, THREE */

AFRAME.registerComponent('tap-place', {
  init() {
    this.scene = this.el.sceneEl;
    this.audioCtx = null;
    this.trafficLights = [];

    this.playClick = () => {
      if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.1);
    };

    const createTrafficLight = (position) => {
      if (this.trafficLights.length >= 5) {
        const oldestLight = this.trafficLights.shift();
        if (oldestLight.intervalId) clearInterval(oldestLight.intervalId);
        oldestLight.parentNode.removeChild(oldestLight);
      }

      const group = document.createElement('a-entity');
      group.classList.add('traffic-light');
      group.setAttribute('position', position);
      group.activeIndex = 0; // Зберігаємо стан прямо на об'єкті
      group.intervalId = null;

      // Зебра: тепер починається від 0 і йде "назад" (від'ємні Z), світлофор в точці 0
      const crosswalk = document.createElement('a-entity');
      for (let i = 0; i < 10; i++) {
        const stripe = document.createElement('a-box');
        stripe.setAttribute('position', `0 0.01 ${-i * 0.5 - 0.5}`); 
        stripe.setAttribute('width', '2');
        stripe.setAttribute('height', '0.02');
        stripe.setAttribute('depth', '0.3');
        stripe.setAttribute('color', '#ffffff');
        crosswalk.appendChild(stripe);
      }
      group.appendChild(crosswalk);

      const pole = document.createElement('a-cylinder');
      pole.setAttribute('position', '0 0.6 0');
      pole.setAttribute('radius', '0.05');
      pole.setAttribute('height', '1.2');
      pole.setAttribute('color', '#333');
      group.appendChild(pole);

      const body = document.createElement('a-box');
      body.setAttribute('position', '0 1.6 0');
      body.setAttribute('width', '0.4');
      body.setAttribute('height', '0.8');
      body.setAttribute('depth', '0.2');
      body.setAttribute('color', '#1a1a1a');
      body.classList.add('light-body', 'cantap');
      group.appendChild(body);

      const positions = [1.85, 1.6, 1.35];
      const lights = [];
      positions.forEach((y, i) => {
        const sphere = document.createElement('a-sphere');
        sphere.setAttribute('position', `0 ${y} 0.11`);
        sphere.setAttribute('radius', '0.08');
        sphere.setAttribute('color', '#222');
        sphere.classList.add('light-bulb', 'cantap');
        sphere.lightIndex = i; // Ідентифікатор лампи
        group.appendChild(sphere);
        lights.push(sphere);
      });

      // Функція перемикання
      group.updateLight = function() {
        this.activeIndex = (this.activeIndex + 1) % 3;
        const index = this.activeIndex;
        
        lights.forEach((l, i) => {
          const color = i === 0 ? '#ff0000' : i === 1 ? '#ffcc00' : '#00ff00';
          l.setAttribute('color', i === index ? color : '#222');
          l.setAttribute('material', 'emissive', i === index ? color : '#000');
          l.setAttribute('material', 'emissiveIntensity', i === index ? 2 : 0);
        });

        if (this.intervalId) clearInterval(this.intervalId);
        if (index === 2) {
          let timer = 10;
          this.intervalId = setInterval(() => {
            timer--;
            this.playClick(); // Ми звертаємось до методу компонента через замикання
            if (timer <= 0) clearInterval(this.intervalId);
          }, 1000);
        }
      };

      // Ініціалізація кольору
      group.updateLight(); // Вмикає червоний
      // Трохи хак: відразу перемикаємо, бо функція при ініціалізації робить +1
      group.activeIndex = -1; 
      group.updateLight();

      this.trafficLights.push(group);
      return group;
    };

    this.scene.addEventListener('click', (e) => {
      if (!e.detail.intersection) return;
      const el = e.detail.intersection.object.el;

      if (el && (el.classList.contains('light-bulb') || el.classList.contains('light-body'))) {
        const group = el.closest('.traffic-light');
        group.updateLight();
        return;
      }

      if (el && el.id === 'ground') {
        const p = e.detail.intersection.point;
        const newLight = createTrafficLight(`${p.x} ${p.y} ${p.z}`);
        this.scene.appendChild(newLight);
      }
    });
  }
});
