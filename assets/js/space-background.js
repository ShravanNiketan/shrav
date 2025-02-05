particlesJS('particles-js', {
    "particles": {
      "number": {
        "value": 300,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": ["#ffffff", "#37B5FE", "#8C52FF", "#7DD856"]  
      },
      "shape": {
        "type": "circle"
      },
      "opacity": {
        "value": 0.8,
        "random": true,
        "anim": {
          "enable": true,
          "speed": 0.3,
          "opacity_min": 0.1,
          "sync": false
        }
      },
      "size": {
        "value": 2,
        "random": true,
        "anim": {
          "enable": true,
          "speed": 0.5,
          "size_min": 0.1,
          "sync": false
        }
      },
      "line_linked": {
        "enable": false  // Removed interconnections
      },
      "move": {
        "enable": true,
        "speed": 0.7,
        "direction": "none",
        "random": true,
        "straight": false,
        "out_mode": "out",
        "bounce": false,
        "attract": {
          "enable": true,
          "rotateX": 600,
          "rotateY": 1200
        }
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true,
          "mode": "bubble"
        },
        "onclick": {
          "enable": true,
          "mode": "repulse"
        },
        "resize": true
      },
      "modes": {
        "bubble": {
          "distance": 150,
          "size": 4,
          "duration": 2,
          "opacity": 0.8,
          "speed": 1
        },
        "repulse": {
          "distance": 150,
          "duration": 0.4
        }
      }
    },
    "retina_detect": true
  });
  
  // Enhanced background with smoother transitions
  function updateParticlesBackground() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const particlesContainer = document.getElementById('particles-js');
    
    if (isDark) {
      particlesContainer.style.background = 'radial-gradient(circle at center, #0a0619 0%, #000000 100%)';
    } else {
      particlesContainer.style.background = 'radial-gradient(circle at center,rgb(186, 186, 189) 0%,rgb(255, 255, 255) 100%)';
    }
  }
  
  // Listen for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-theme') {
        updateParticlesBackground();
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
  
  // Initial background setup
  updateParticlesBackground();