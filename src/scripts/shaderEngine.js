/**
 * WebGL Shader Background Engine
 * High-performance, zero-video-overhead background loops generated procedurally on the GPU.
 * Uses pure WebGL context with minimal RAM (<25 MB) and zero hardware video decoder overhead.
 */

const VERTEX_SHADER_SOURCE = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = (position + 1.0) * 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const SHADER_AURORA = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    float t = u_time * 0.25;
    
    // Wave layers
    float n1 = noise(st * 2.0 + vec2(t * 0.2, t * 0.15));
    float n2 = noise(st * 4.0 - vec2(t * 0.3, t * 0.1));
    float wave = sin(st.x * 3.0 + n1 * 4.0 + t) * 0.5 + 0.5;
    
    // Color palettes (Deep Violet to Electric Cyan to Emerald)
    vec3 color1 = vec3(0.05, 0.08, 0.22);
    vec3 color2 = vec3(0.0, 0.85, 0.75);
    vec3 color3 = vec3(0.45, 0.15, 0.85);

    vec3 finalColor = mix(color1, color2, wave * n2);
    finalColor = mix(finalColor, color3, n1 * 0.6);

    // Vignette & dark mood
    float vignette = 1.0 - length(vUv - 0.5) * 0.8;
    finalColor *= max(vignette, 0.2);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const SHADER_RAIN = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  float N12(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * 0.8;

    // Dark glass background
    vec3 bg = vec3(0.04, 0.06, 0.12);

    // Glowing bokeh city lights in background
    for(float i=0.0; i<6.0; i++) {
      vec2 pos = vec2(sin(i * 1.5 + t * 0.2) * 0.8, cos(i * 2.3 + t * 0.15) * 0.4);
      float dist = length(uv - pos);
      vec3 lightColor = vec3(0.1 + sin(i)*0.2, 0.4 + cos(i)*0.3, 0.9);
      bg += lightColor * (0.025 / (dist + 0.12));
    }

    // Grid of raindrops
    vec2 st = uv * vec2(12.0, 4.0);
    vec2 id = floor(st);
    st = fract(st) - 0.5;

    float n = N12(id);
    float dropT = fract(t * 0.6 + n * 6.28);
    vec2 dropPos = vec2((n - 0.5) * 0.5, (0.5 - dropT) * 1.8);
    float d = length(st - dropPos);

    float drop = smoothstep(0.08, 0.02, d);
    
    // Water drop refraction highlight
    bg += vec3(0.6, 0.8, 1.0) * drop * 0.7;

    // Subtle dark vignette
    float vig = 1.0 - length(vUv - 0.5) * 0.7;
    bg *= vig;

    gl_FragColor = vec4(bg, 1.0);
  }
`;

const SHADER_EMBERS = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 41.414))) * 43758.5453);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    float t = u_time * 0.6;

    // Warm deep ember gradient
    vec3 color = mix(vec3(0.06, 0.02, 0.04), vec3(0.18, 0.04, 0.02), uv.y);

    // Floating particles
    for (float i = 0.0; i < 35.0; i++) {
      float seed = i * 1.17;
      float speed = 0.15 + rand(vec2(seed, 1.0)) * 0.25;
      float x = rand(vec2(seed, 2.0)) + sin(t * 0.8 + seed) * 0.08;
      float y = fract(t * speed + rand(vec2(seed, 3.0)));

      vec2 particlePos = vec2(x, y);
      float dist = length(uv - particlePos);

      float size = 0.003 + rand(vec2(seed, 4.0)) * 0.005;
      float alpha = smoothstep(size, 0.0, dist);

      // Warm fiery glow (Gold, Orange, Red)
      vec3 emberColor = mix(vec3(1.0, 0.4, 0.1), vec3(1.0, 0.8, 0.2), rand(vec2(seed, 5.0)));
      color += emberColor * alpha * (1.0 - y); // Fade near top
    }

    float vignette = 1.0 - length(vUv - 0.5) * 0.6;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const SHADER_STARS = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * 0.2;

    // Deep space dark cosmic gradient
    vec3 color = vec3(0.02, 0.03, 0.08) + vec3(0.03, 0.01, 0.06) * sin(uv.y + t);

    // Star layer 1 (Small distant stars)
    vec2 grid1 = floor(uv * 30.0);
    float n1 = hash21(grid1);
    if (n1 > 0.92) {
      float twinkle = sin(t * 5.0 + n1 * 6.28) * 0.5 + 0.5;
      color += vec3(0.8, 0.9, 1.0) * twinkle * (n1 - 0.92) * 10.0;
    }

    // Star layer 2 (Larger glowing stars)
    vec2 grid2 = floor((uv + vec2(0.5)) * 15.0);
    float n2 = hash21(grid2);
    if (n2 > 0.95) {
      float twinkle2 = cos(t * 3.0 + n2 * 6.28) * 0.5 + 0.5;
      vec2 st = fract((uv + vec2(0.5)) * 15.0) - 0.5;
      float d = length(st);
      color += vec3(0.4, 0.7, 1.0) * (0.015 / (d + 0.01)) * twinkle2;
    }

    // Soft vignette
    float vignette = 1.0 - length(vUv - 0.5) * 0.7;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;

export const SHADER_PRESETS = {
  aurora: { name: 'Cosmic Aurora', fragmentShader: SHADER_AURORA },
  rain: { name: 'Cyberpunk Rain', fragmentShader: SHADER_RAIN },
  embers: { name: 'Cozy Fireplace', fragmentShader: SHADER_EMBERS },
  stars: { name: 'Deep Space Stars', fragmentShader: SHADER_STARS }
};

export class ShaderEngine {
  constructor(containerEl) {
    this.container = containerEl;
    this.canvas = null;
    this.gl = null;
    this.program = null;
    this.animationFrameId = null;
    this.startTime = Date.now();
    this.isPaused = false;

    this.locations = {
      position: null,
      time: null,
      resolution: null
    };
  }

  init(presetKey = 'aurora') {
    this.destroy(); // Ensure any previous canvas context is cleaned up

    const preset = SHADER_PRESETS[presetKey] || SHADER_PRESETS.aurora;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'background-media shader-canvas';
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.objectFit = 'cover';
    this.canvas.style.pointerEvents = 'none';

    this.container.appendChild(this.canvas);

    this.gl = this.canvas.getContext('webgl', { powerPreference: 'low-power', preserveDrawingBuffer: false }) ||
              this.canvas.getContext('experimental-webgl');

    if (!this.gl) {
      console.warn('WebGL not supported, falling back to static background.');
      return false;
    }

    // Create shaders
    const vertShader = this.compileShader(this.gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fragShader = this.compileShader(this.gl.FRAGMENT_SHADER, preset.fragmentShader);

    if (!vertShader || !fragShader) return false;

    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertShader);
    this.gl.attachShader(this.program, fragShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(this.program));
      return false;
    }

    this.gl.useProgram(this.program);

    // Full-screen quad buffer (-1 to +1)
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]), this.gl.STATIC_DRAW);

    this.locations.position = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(this.locations.position);
    this.gl.vertexAttribPointer(this.locations.position, 2, this.gl.FLOAT, false, 0, 0);

    this.locations.time = this.gl.getUniformLocation(this.program, 'u_time');
    this.locations.resolution = this.gl.getUniformLocation(this.program, 'u_resolution');

    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize);

    this.startTime = Date.now();
    this.isPaused = false;
    this.render();

    return true;
  }

  compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  resize() {
    if (!this.canvas || !this.gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap DPR at 1.5 to save GPU render power
    const width = Math.floor(this.container.clientWidth * dpr);
    const height = Math.floor(this.container.clientHeight * dpr);

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  render() {
    if (this.isPaused || !this.gl || !this.program) return;

    const elapsedTime = (Date.now() - this.startTime) / 1000.0;
    this.gl.uniform1f(this.locations.time, elapsedTime);
    this.gl.uniform2f(this.locations.resolution, this.canvas.width, this.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    this.animationFrameId = requestAnimationFrame(() => this.render());
  }

  pause() {
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.render();
    }
  }

  destroy() {
    this.pause();
    if (this.onResize) {
      window.removeEventListener('resize', this.onResize);
      this.onResize = null;
    }
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
      this.canvas = null;
    }
    this.gl = null;
  }
}
