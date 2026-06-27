/* globals AFRAME, THREE */

AFRAME.registerComponent('tap-place', {
  init() {
    const scene = this.el.sceneEl;

    // Змінна для зберігання поточного активного сигналу для кожного світлофора
    // Ми будемо зберігати стан на самому об'єкті

    // Функція створення світлофора
    function createTrafficLight(position) {
      const group = document.createElement('a-entity');
      group.classList.add('traffic-light');
      group.setAttribute('position', position);

      // Ніжка
      const pole = document.createElement('a-cylinder');
      pole.setAttribute('position', '0 -0.5 0');
      pole.setAttribute('radius', '0.08');
      pole.setAttribute('height', '1');
      pole.setAttribute('color', '#333333');
      group.appendChild(pole);

      // Три кулі
      const colors = [
        { on: '#FF0000', off: '#888888' },
        { on: '#FFCC00', off: '#888888' },
        { on: '#00FF00', off: '#888888' }
      ];
      const positions = [0.8, 0.2, -0.4]; // Y

      const lights = [];
      positions.forEach((yPos, index) => {
        const sphere = document.createElement('a-sphere');
        sphere.setAttribute('position', `0 ${yPos} 0`);
        sphere.setAttribute('radius', '0.25');
        sphere.setAttribute('color', colors[index].off);
        sphere.setAttribute('emissive', '#000000');
        sphere.setAttribute('emissive-intensity', '0');
        sphere.dataset.index = index;
        sphere.classList.add('light-bulb');
        group.appendChild(sphere);
        lights.push(sphere);
      });

      // Функція активації сигналу (зберігаємо на групі)
      group.activateLight = function(index) {
        lights.forEach((light, i) => {
          if (i === index) {
            light.setAttribute('color', colors[i].on);
            light.setAttribute('emissive', colors[i].on);
            light.setAttribute('emissive-intensity', '0.5');
          } else {
            light.setAttribute('color', colors[i].off);
            light.setAttribute('emissive', '#000000');
            light.setAttribute('emissive-intensity', '0');
          }
        });
        group.dataset.activeSignal = index;
      };

      // Початково вмикаємо червоний
      group.activateLight(0);

      return group;
    }

    // Обробник кліку для розміщення та перемикання
    scene.addEventListener('click', (event) => {
      if (!event.detail || !event.detail.intersection) return;

      const point = event.detail.intersection.point;

      // Перевіряємо, чи клікнули на лампочку світлофора
      const clickedEl = event.detail.intersection.object.el;
      if (clickedEl && clickedEl.classList && clickedEl.classList.contains('light-bulb')) {
        // Знаходимо батьківський світлофор
        const lightGroup = clickedEl.closest('.traffic-light');
        if (lightGroup) {
          const currentIndex = parseInt(clickedEl.dataset.index, 10);
          const nextIndex = (currentIndex + 1) % 3;
          lightGroup.activateLight(nextIndex);
          return; // Не створюємо новий світлофор
        }
      }

      // Якщо клікнули не на світлофор — створюємо новий
      const newLight = createTrafficLight({
        x: point.x,
        y: point.y,
        z: point.z
      });

      // Випадкове обертання
      const rotY = Math.random() * 360;
      newLight.setAttribute('rotation', `0 ${rotY} 0`);

      // Масштаб (можна змінити)
      newLight.setAttribute('scale', '0.5 0.5 0.5');

      scene.appendChild(newLight);
    });
  }
});
