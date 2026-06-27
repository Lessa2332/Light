/* globals AFRAME, THREE */

AFRAME.registerComponent('tap-place', {
  init() {
    this.scene = this.el.sceneEl;
    this.audioCtx = null;
    this.trafficLights = [];

    // Звук пікання
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

    const createTrafficLight = (position, rotationY) => {
      // Обмеження до 5 штук і повне очищення таймерів старого світлофора
      if (this.trafficLights.length >= 5) {
        const oldest = this.trafficLights.shift();
        clearTimeout(oldest.timeout1);
        clearTimeout(oldest.timeout2);
        clearTimeout(oldest.timeout3);
        clearInterval(oldest.beepInterval);
        oldest.parentNode.removeChild(oldest);
      }

      const group = document.createElement('a-entity');
      group.classList.add('traffic-light');
      group.setAttribute('position', position);
      group.setAttribute('rotation', `0 ${rotationY} 0`);

      // Зебра від світлофора ДО камери
      const crosswalk = document.createElement('a-entity');
      for (let i = 0; i < 10; i++) {
        const stripe = document.createElement('a-box');
        stripe.setAttribute('position', `0 0.01 ${i * 0.5 + 0.5}`); 
        stripe.setAttribute('width', '2');
        stripe.setAttribute('height', '0.02');
        stripe.setAttribute('depth', '0.3');
        stripe.setAttribute('color', '#ffffff');
        crosswalk.appendChild(stripe);
      }
      group.appendChild(crosswalk);

      // Стовп
      const pole = document.createElement('a-cylinder');
      pole.setAttribute('position', '0 0.6 0');
      pole.setAttribute('radius', '0.05');
      pole.setAttribute('height', '1.2');
      pole.setAttribute('color', '#333333');
      group.appendChild(pole);

      // Корпус
      const body = document.createElement('a-box');
      body.setAttribute('position', '0 1.6 0');
      body.setAttribute('width', '0.4');
      body.setAttribute('height', '0.8');
      body.setAttribute('depth', '0.2');
      body.setAttribute('color', '#1a1a1a');
      group.appendChild(body);

      // Лінзи
      const positions = [1.85, 1.6, 1.35];
      const lights = [];
      positions.forEach((y) => {
        const sphere = document.createElement('a-sphere');
        sphere.setAttribute('position', `0 ${y} 0.11`);
        sphere.setAttribute('radius', '0.08');
        sphere.setAttribute('color', '#222222');
        group.appendChild(sphere);
        lights.push(sphere);
      });

      const triggerSound = this.playClick;

      // Надійна функція для зміни кольору
      const setLight = (activeIndex) => {
        lights.forEach((l, i) => {
          const isActive = (i === activeIndex);
          const color = i === 0 ? '#ff0000' : i === 1 ? '#ffcc00' : '#00ff00';
          
          // Встановлюємо властивості так, щоб A-Frame гарантовано їх оновив
          l.setAttribute('color', isActive ? color : '#222222');
          l.setAttribute('material', 'emissive', isActive ? color : '#000000');
          l.setAttribute('material', 'emissiveIntensity', isActive ? 2 : 0);
        });
      };

      // АВТОМАТИЧНИЙ ЦИКЛ СВІТЛОФОРА
      group.startCycle = () => {
        // 1. Вмикаємо Червоний на 5 секунд
        setLight(0);
        
        group.timeout1 = setTimeout(() => {
          // 2. Вмикаємо Жовтий на 2 секунди
          setLight(1);
          
          group.timeout2 = setTimeout(() => {
            // 3. Вмикаємо Зелений на 5 секунд
            setLight(2);
            
            // Запускаємо звук пікання для зеленого (5 разів)
            let beeps = 5;
            triggerSound(); // Перший пік одразу
            group.beepInterval = setInterval(() => {
              beeps--;
              if (beeps > 0) {
                triggerSound();
              } else {
                clearInterval(group.beepInterval);
              }
            }, 1000);

            group.timeout3 = setTimeout(() => {
              // Повертаємось на початок (Червоний)
              group.startCycle();
            }, 5000);

          }, 2000); // 2000 мс = 2 сек (Жовтий)

        }, 5000); // 5000 мс = 5 сек (Червоний)
      };

      // Запускаємо цикл одразу при появі світлофора
      group.startCycle();
      
      this.trafficLights.push(group);
      return group;
    };

    // Обробник кліку тільки для встановлення світлофора
    this.scene.addEventListener('click', (e) => {
      // Якщо це перший клік, ініціалізуємо аудіо контекст для iOS
      if (!this.audioCtx) {
         this.playClick();
      }

      if (!e.detail.intersection) return;
      const el = e.detail.intersection.object.el;
      
      // Якщо клікнули по землі - ставимо новий світлофор
      if (el && el.id === 'ground') {
        const p = e.detail.intersection.point;
        
        // Розвертаємо світлофор на камеру
        const cam = this.scene.camera;
        const camPos = new THREE.Vector3();
        cam.getWorldPosition(camPos);
        
        const dx = camPos.x - p.x;
        const dz = camPos.z - p.z;
        const angleRad = Math.atan2(dx, dz);
        const angleDeg = angleRad * (180 / Math.PI);

        const newLight = createTrafficLight(`${p.x} ${p.y} ${p.z}`, angleDeg);
        this.scene.appendChild(newLight);
      }
    });
  }
});
