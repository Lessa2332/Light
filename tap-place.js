/* globals AFRAME, THREE */

AFRAME.registerComponent('tap-place', {
  init() {
    const scene = this.el.sceneEl;

    // Функція створення реалістичного світлофора висотою рівно 1.5 метра
    function createTrafficLight(position) {
      const group = document.createElement('a-entity');
      group.classList.add('traffic-light');
      group.setAttribute('position', position);

      // 1. Стовпчик (висота 0.9м)
      const pole = document.createElement('a-cylinder');
      pole.setAttribute('position', '0 0.45 0'); // Центр стовпчика на висоті 0.45м
      pole.setAttribute('radius', '0.04');
      pole.setAttribute('height', '0.9');
      pole.setAttribute('color', '#333333');
      group.appendChild(pole);

      // 2. Основний корпус (висота 0.6м). Загальна висота: 0.9 + 0.6 = 1.5м
      const body = document.createElement('a-box');
      body.setAttribute('position', '0 1.2 0'); // Центр корпусу на висоті 1.2м
      body.setAttribute('width', '0.3');
      body.setAttribute('height', '0.6');
      body.setAttribute('depth', '0.15');
      body.setAttribute('color', '#1a1a1a');
      // ВАЖЛИВО: додаємо cantap, щоб клік по корпусу теж фіксувався
      body.classList.add('light-body', 'cantap'); 
      group.appendChild(body);

      // 3. Кольори та позиції лінз (відносно землі)
      const colors = [
        { on: '#FF0000', off: '#4a0000', hex: '#FF0000' }, // Червоний
        { on: '#FFCC00', off: '#4a4a00', hex: '#FFCC00' }, // Жовтий
        { on: '#00FF00', off: '#002200', hex: '#00FF00' }  // Зелений
      ];
      const positions = [1.4, 1.2, 1.0]; // Y позиції (верхня на 1.4м, нижня на 1.0м)

      const lights = [];
      
      positions.forEach((yPos, index) => {
        // Захисні козирки для реалістичності
        const visor = document.createElement('a-cylinder');
        visor.setAttribute('position', `0 ${yPos + 0.02} 0.08`);
        visor.setAttribute('rotation', '90 0 0');
        visor.setAttribute('theta-start', '90');
        visor.setAttribute('theta-length', '180');
        visor.setAttribute('radius', '0.08');
        visor.setAttribute('height', '0.05');
        visor.setAttribute('color', '#1a1a1a');
        group.appendChild(visor);

        // Сама лінза (лампочка)
        const sphere = document.createElement('a-sphere');
        sphere.setAttribute('position', `0 ${yPos} 0.08`);
        sphere.setAttribute('radius', '0.06');
        sphere.setAttribute('color', colors[index].off);
        sphere.setAttribute('emissive', colors[index].hex);
        sphere.setAttribute('emissive-intensity', '0');
        sphere.dataset.index = index;
        // ВАЖЛИВО: додаємо cantap для взаємодії
        sphere.classList.add('light-bulb', 'cantap');
        group.appendChild(sphere);
        lights.push(sphere);
      });

      // Функція активації сигналу з анімацією
      group.activateLight = function(index) {
        lights.forEach((light, i) => {
          if (i === index) {
            light.setAttribute('color', colors[i].on);
            // Додаємо плавну пульсацію увімкненого сигналу
            light.setAttribute('animation', 'property: material.emissiveIntensity; from: 0.8; to: 1.5; dir: alternate; dur: 600; loop: true');
          } else {
            // Вимикаємо анімацію та світло для інших
            light.removeAttribute('animation');
            light.setAttribute('color', colors[i].off);
            light.setAttribute('emissive-intensity', '0.1'); // Ледь помітний відблиск
          }
        });
        group.dataset.activeSignal = index;
      };

      // Початково вмикаємо червоний
      group.activateLight(0);

      return group;
    }

    // Обробник кліків
    scene.addEventListener('click', (event) => {
      if (!event.detail || !event.detail.intersection) return;

      const clickedEl = event.detail.intersection.object.el;

      // 1. Перевіряємо, чи клікнули на світлофор (по лінзі АБО по корпусу)
      if (clickedEl && (clickedEl.classList.contains('light-bulb') || clickedEl.classList.contains('light-body'))) {
        const lightGroup = clickedEl.closest('.traffic-light');
        if (lightGroup) {
          const currentIndex = parseInt(lightGroup.dataset.activeSignal, 10);
          const nextIndex = (currentIndex + 1) % 3;
          lightGroup.activateLight(nextIndex);
          return; // Виходимо, щоб не поставити новий світлофор
        }
      }

      // 2. Якщо клікнули на землю — ставимо новий світлофор
      if (clickedEl && clickedEl.id === 'ground') {
        const point = event.detail.intersection.point;
        
        const newLight = createTrafficLight({
          x: point.x,
          y: point.y,
          z: point.z
        });

        // Випадкове обертання навколо своєї осі, щоб не всі дивились в один бік
        const rotY = Math.random() * 360;
        newLight.setAttribute('rotation', `0 ${rotY} 0`);

        // Ми більше НЕ використовуємо scale. Об'єкт згенеровано одразу у масштабі 1:1 (1.5м)
        scene.appendChild(newLight);
      }
    });
  }
});
