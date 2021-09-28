
precision highp float;

uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vPUv;
varying vec2 vUv;

void main() {
	vec4 color = vec4(0.0);
	vec2 uv = vUv;
	vec2 puv = vPUv;

	// Pixel color
	vec4 colA = texture2D(uTexture, puv);

	// // Greyscale
	// float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
	// vec4 colB = vec4(grey, grey, grey, 1.0);

	// Purple 
	float purple = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;
	vec4 colB = vec4(purple, purple, purple, 1.0);

	// Circle
	float border = 0.3;
	float radius = 0.5;
	float dist = radius - distance(uv, vec2(0.5));
	float t = smoothstep(0.0, border, dist);

	// Final color
	// color = colB;
	color = colA;
	color.a = t;

	// color.r = sin(uTime);

	gl_FragColor = color;

    // gl_FragColor = vec4(1.0);
}