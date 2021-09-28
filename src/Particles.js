import * as THREE from 'three';

const easeOutSine = (t, b, c, d) => {
	return c * Math.sin(t/d * (Math.PI/2)) + b;
};

export default class Particles {
	constructor(scene, textureLoader, vertexShader, fragmentShader, src) {
        this.scene = scene
        this.textureLoader = textureLoader
        this.vertexShader = vertexShader
        this.fragmentShader = fragmentShader
        this.src = src

		this.size = 64;
		this.maxAge = 120;
		this.radius = 0.15;
        this.dispersion = 100;
        this.disperseDirection = 'in'
		this.touchTrail = [];

		this.initTexture();
	}

    initTexture() {

        this.particleTexture = this.textureLoader.load(this.src)

        this.touchCanvas = document.createElement('canvas');
        this.touchCanvas.width = this.touchCanvas.height = this.size;
        this.ctx = this.touchCanvas.getContext('2d');
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.touchCanvas.width, this.touchCanvas.height);

        this.touchTexture = new THREE.Texture(this.touchCanvas);

        this.touchCanvas.id = 'touchTexture';
        this.touchCanvas.style.width = this.touchCanvas.style.height = `${this.touchCanvas.width}px`;
        // this.touchCanvas.style.display = 'block'
        // this.touchCanvas.style.position = 'fixed'
        // this.touchCanvas.style.zIndex = 100

        // document.getElementById('body').appendChild(this.touchCanvas)

    }

    createParticles(width, height) {

        const numPoints = width * height

        const geometry = new THREE.InstancedBufferGeometry();

        // positions
        const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
        positions.setXYZ(0, -0.5, 0.5, 0.0);
        positions.setXYZ(1, 0.5, 0.5, 0.0);
        positions.setXYZ(2, -0.5, -0.5, 0.0);
        positions.setXYZ(3, 0.5, -0.5, 0.0);
        geometry.setAttribute('position', positions);

        // uvs
        const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
        uvs.setXYZ(0, 0.0, 0.0);
        uvs.setXYZ(1, 1.0, 0.0);
        uvs.setXYZ(2, 0.0, 1.0);
        uvs.setXYZ(3, 1.0, 1.0);
        geometry.setAttribute('uv', uvs);

        // index
        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([ 0, 2, 1, 2, 3, 1 ]), 1));

        const indices = new Uint16Array(numPoints);
        const offsets = new Float32Array(numPoints * 3);
        const angles = new Float32Array(numPoints);

        for (let i = 0; i < numPoints; i++) {
            
            offsets[i * 3 + 0] = i % width;
            offsets[i * 3 + 1] = Math.floor(i / width);

            indices[i] = i;

            angles[i] = Math.random() * Math.PI;
        }

        geometry.setAttribute('pindex', new THREE.InstancedBufferAttribute(indices, 1, false));
        geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(offsets, 3, false));
        geometry.setAttribute('angle', new THREE.InstancedBufferAttribute(angles, 1, false));

        const uniforms = {
            uTime: { value: 0 },
            uRandom: { value: 1.0 },
            uDepth: { value: 2.0 },
            uSize: { value: 10.0 },
            uTextureSize: { value: new THREE.Vector2(width, height) },
            uTexture: { value: this.particleTexture },
            uTouch: { value: this.touchTexture },
            uDispersion : { value: this.dispersion }
        };

        const material = new THREE.RawShaderMaterial({
            uniforms,
            vertexShader: this.vertexShader,
            fragmentShader: this.fragmentShader,
            depthTest: false,
            transparent: true
        });

        this.particles = new THREE.Mesh(geometry, material)
        this.particles.name = 'particlesImage'
        this.scene.add(this.particles)


        // Add touch plane
        this.planeGeometry = new THREE.PlaneBufferGeometry( width, height );
        this.planeMaterial = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
        this.plane = new THREE.Mesh( this.planeGeometry, this.planeMaterial );
        this.plane.position.z += 10
        this.scene.add( this.plane );

    }

    updateTouchTrail(point) {

        let force = 0;
		const last = this.touchTrail[this.touchTrail.length - 1];
		if (last) {
			const dx = last.x - point.x;
			const dy = last.y - point.y;
			const dd = dx * dx + dy * dy;
			force = Math.min(dd * 10000, 1);
		}
		this.touchTrail.push({ x: point.x, y: point.y, age: 0, force });
    }
    
    updateParticles(elapsedTime) {
        
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.touchCanvas.width, this.touchCanvas.height);

        // Update age points
        this.touchTrail.forEach((point, i) => {
            point.age++;
            // Remove old
            if (point.age > this.maxAge) {
                this.touchTrail.splice(i, 1);
            }
        });

        // Update dispersion

        if (this.disperseDirection == 'in') {
            this.dispersion > 0 ? this.dispersion -= 1 : this.dispersion = 0
        }
        else {
            this.dispersion += 1
        }
        
        // Update canvas
        this.touchTrail.forEach((point, i) => {
            this.drawTouch(point);
        });

        // Update texture
        this.touchTexture.needsUpdate = true;
        this.particles.material.uniforms.uTime.value = elapsedTime
        this.particles.material.uniforms.uTouch.value = this.touchTexture
        this.particles.material.uniforms.uDispersion.value = this.dispersion

        console.log()

    }

    drawTouch(point) {
        const pos = {
            x: point.x * this.size,
            y: (1 - point.y) * this.size
        };
    
        let intensity = 1;
        if (point.age < this.maxAge * 0.3) {
            intensity = easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1);
        } else {
            intensity = easeOutSine(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7), 0, 1, 1);
        }
    
        intensity *= point.force;
    
        const radius = this.size * this.radius * intensity;
        const grd = this.ctx.createRadialGradient(pos.x, pos.y, radius * 0.25, pos.x, pos.y, radius);
        grd.addColorStop(0, `rgba(255, 255, 255, 0.2)`);
        grd.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
    
        this.ctx.beginPath();
        this.ctx.fillStyle = grd;
        this.ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    destroyParticles() {
        this.disperseDirection = 'out'

        var self = this;
        setTimeout( function()  {
            const image = self.scene.getObjectByName( "particlesImage" )
            self.scene.remove(image)

            self.disperseDirection = 'in'
        }, 1000)


    }

}