precision highp float;

attribute float pindex;
attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
attribute float angle;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform float uTime;
uniform float uRandom;
uniform float uDepth;
uniform float uSize;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uTouch;
uniform float uDispersion;

varying vec2 vPUv;
varying vec2 vUv;

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float snoise_1_2(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
		mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

float random(float n) {
	return fract(sin(n) * 43758.5453123);
}

void main() {
	vUv = uv;

	// Particle uv
	vec2 puv = offset.xy / uTextureSize;
	vPUv = puv;

	// Pixel color
	vec4 colA = texture2D(uTexture, puv);
	float grey = colA.r * 0.21 + colA.g * 0.71 + colA.b * 0.07;

	// Displacement
	vec3 displaced = offset;

	// Movement
	float rndz = (random(pindex) + snoise_1_2(vec2(pindex * 0.1, uTime * 0.1)));

    displaced.yz += sin(pindex * 5.0 + uTime * 1.0) + (offset.xy * rndz * uDispersion) / 100.0 * 0.01;
	displaced.z *= rndz * uDispersion ;
 
	// Randomise
	displaced.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5) * uRandom;
	displaced.z += rndz * (random(pindex) * 2.0 * uDepth);

	// Center
	displaced.xy -= uTextureSize * 0.5;

	// Touch
	float t = texture2D(uTouch, puv).r;
	displaced.z += t * 20.0 ;
	displaced.x += cos(angle) * t * 20.0 ;
	displaced.y += sin(angle) * t * 20.0 ;

	// Particle size
	float psize = (snoise_1_2(vec2(uTime, pindex) * 0.5) + 2.0);
	psize *= max(grey, 0.2);
    psize *= 0.1;
	psize *= uSize;

	// Final position
	vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
	mvPosition.xyz += position * psize;
	vec4 finalPosition = projectionMatrix * mvPosition;

	gl_Position = finalPosition;

}