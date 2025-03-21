import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
    selector: 'app-webgl-globe',
    template:
        '<div #rendererContainer (mousedown)="onMouseDown($event)" (mousemove)="onMouseMove($event)" (mouseup)="onMouseUp()" (wheel)="onMouseWheel($event)" (touchstart)="onTouchStart($event)" (touchmove)="onTouchMove($event)" (touchend)="onTouchEnd()"></div><div id="tooltip" style="position: absolute; display: none; background: white; padding: 5px; border: 1px solid black;"></div>',
    styleUrls: ['./webgl-globe.component.css'],
})
export class WebglGlobeComponent implements OnInit {
    @ViewChild('rendererContainer', { static: true })
    rendererContainer!: ElementRef;
    scene!: THREE.Scene;
    camera!: THREE.PerspectiveCamera;
    renderer!: THREE.WebGLRenderer;
    earthMesh!: THREE.Mesh;
    flightGroup!: THREE.Group;
    isDragging = false;
    previousMouseX = 0;
    previousMouseY = 0;
    airplaneTexture!: THREE.Texture;
    flightCache: any[] = [];
    lastFetchTime: number = 0;
    cacheDuration = 15000; // Cache data for 15 seconds
    flightDataMap: Map<THREE.Object3D, any> = new Map();
    private initialPinchDistance: number = 0;
    private initialCameraZ: number = 0;
    private rotationCooldown: number = 0;
    private readonly ROTATION_COOLDOWN_DURATION = 500; // 500ms cooldown

    ngOnInit() {
        this.initThreeJS();
        this.loadAirplaneTexture();
        this.renderFlights();
        setInterval(() => this.updateFlightData(), 30000);
    }

    initThreeJS() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.rendererContainer.nativeElement.appendChild(
            this.renderer.domElement
        );

        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load('earth_atmos_2048.jpg');

        const earthGeometry = new THREE.SphereGeometry(5, 50, 50);
        const earthMaterial = new THREE.MeshBasicMaterial({
            map: earthTexture,
        });
        this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        this.scene.add(this.earthMesh);

        this.flightGroup = new THREE.Group();
        this.earthMesh.add(this.flightGroup);

        // Center the globe on San Diego (32.6831°N, 117.4746°W)
        const targetPos = this.latLonToSphere(32.6831, -117.4746, 5);
        this.earthMesh.rotation.y = -targetPos.x * 0.1;
        this.earthMesh.rotation.x = targetPos.y * 0.1;

        this.camera.position.z = 10;
        this.animate();
        this.renderer.domElement.addEventListener('click', (event) =>
            this.onMouseClick(event)
        );
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
    };

    loadAirplaneTexture() {
        const textureLoader = new THREE.TextureLoader();
        this.airplaneTexture = textureLoader.load('plane64.png');
    }

    async fetchFlightData() {
        const currentTime = Date.now();
        if (
            this.flightCache &&
            currentTime - this.lastFetchTime < this.cacheDuration
        ) {
            return this.flightCache;
        }

        // const response = await fetch(
        //     'https://opensky-network.org/api/states/all'
        // );
        const response = await fetch(location.pathname + 'flights.json');
        const data = await response.json();
        this.flightCache = data.states;
        this.lastFetchTime = currentTime;
        return this.flightCache;
    }

    latLonToSphere(lat: number, lon: number, radius: number) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = -lon * (Math.PI / 180); // Adjusted for sphere orientation
        return new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    async renderFlights() {
        const flights = await this.fetchFlightData();
        this.flightGroup.clear(); // Clear previous flight markers
        this.flightDataMap.clear();

        flights.forEach(
            ([
                icao,
                callsign,
                origin_country,
                time_position,
                last_contact,
                lon,
                lat,
                altitude,
                on_ground,
                velocity,
                true_track,
            ]: [
                string,
                string,
                string,
                number,
                number,
                number,
                number,
                number,
                boolean,
                number,
                number
            ]) => {
                if (lat && lon && !on_ground) {
                    const pos = this.latLonToSphere(lat, lon, 5.1);
                    const airplaneMaterial = new THREE.SpriteMaterial({
                        map: this.airplaneTexture,
                        rotation: true_track - 45, // Adjusted for angle of airplane image
                    });

                    const airplane = new THREE.Sprite(airplaneMaterial);
                    airplane.scale.set(0.1, 0.1, 1);
                    airplane.position.copy(pos);
                    this.flightGroup.add(airplane);
                    this.flightDataMap.set(airplane, {
                        callsign,
                        altitude,
                        velocity,
                    });
                }
            }
        );
    }

    onMouseClick(event: MouseEvent) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(
            this.flightGroup.children
        );

        if (intersects.length > 0) {
            const flight = intersects[0].object;
            const data = this.flightDataMap.get(flight);

            if (data) {
                this.showTooltip(
                    event.clientX,
                    event.clientY,
                    `Callsign: ${data.callsign}<br>Altitude: ${data.altitude}m<br>Velocity: ${data.velocity}m/s`
                );
            }
        } else {
            this.hideTooltip();
        }
    }

    showTooltip(x: number, y: number, content: string) {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.innerHTML = content;
            tooltip.style.left = `${x + 10}px`;
            tooltip.style.top = `${y + 10}px`;
            tooltip.style.display = 'block';
        }
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    onMouseDown(event: MouseEvent) {
        this.isDragging = true;
        this.previousMouseX = event.clientX;
        this.previousMouseY = event.clientY;
    }

    onMouseMove(event: MouseEvent) {
        if (this.isDragging) {
            const deltaX = event.clientX - this.previousMouseX;
            const deltaY = event.clientY - this.previousMouseY;

            this.earthMesh.rotation.y += deltaX * 0.005;
            this.earthMesh.rotation.x += deltaY * 0.005;

            this.previousMouseX = event.clientX;
            this.previousMouseY = event.clientY;
        }
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onMouseWheel(event: WheelEvent) {
        this.camera.position.z += event.deltaY * 0.005;
        this.camera.position.z = Math.max(
            5.2,
            Math.min(20, this.camera.position.z)
        );
    }

    onTouchStart(event: TouchEvent) {
        event.preventDefault();
        this.isDragging = true;

        // Check for airplane touch first
        const touch = event.touches[0];
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(
            this.flightGroup.children
        );

        if (Date.now() < this.rotationCooldown) {
            return;
        }

        if (intersects.length > 0) {
            const flight = intersects[0].object;
            const data = this.flightDataMap.get(flight);

            if (data) {
                this.showTooltip(
                    touch.clientX,
                    touch.clientY,
                    `Callsign: ${data.callsign}<br>Altitude: ${data.altitude}m<br>Velocity: ${data.velocity}m/s`
                );
                // Set rotation cooldown
                this.rotationCooldown =
                    Date.now() + this.ROTATION_COOLDOWN_DURATION;
                return; // Don't proceed with rotation/zoom if we touched an airplane
            }
        } else {
            this.hideTooltip();
        }

        if (event.touches.length === 2) {
            // Pinch to zoom
            this.initialPinchDistance = this.getPinchDistance(event.touches);
            this.initialCameraZ = this.camera.position.z;
            // Set rotation cooldown when starting pinch zoom
            this.rotationCooldown =
                Date.now() + this.ROTATION_COOLDOWN_DURATION;
        } else if (event.touches.length === 1) {
            // Single touch for rotation
            this.previousMouseX = event.touches[0].clientX;
            this.previousMouseY = event.touches[0].clientY;
        }
    }

    onTouchMove(event: TouchEvent) {
        event.preventDefault();

        // Update tooltip position if it's visible
        // const tooltip = document.getElementById('tooltip');
        // if (tooltip && tooltip.style.display === 'block') {
        //     const touch = event.touches[0];
        //     this.showTooltip(touch.clientX, touch.clientY, tooltip.innerHTML);
        // }

        if (event.touches.length === 2) {
            // Handle pinch zoom
            const currentPinchDistance = this.getPinchDistance(event.touches);
            const pinchDelta = currentPinchDistance - this.initialPinchDistance;
            const zoomFactor = 0.01;

            this.camera.position.z =
                this.initialCameraZ - pinchDelta * zoomFactor;
            this.camera.position.z = Math.max(
                5.2,
                Math.min(20, this.camera.position.z)
            );
        } else if (event.touches.length === 1) {
            // Handle rotation only if not in cooldown
            if (Date.now() >= this.rotationCooldown) {
                const deltaX = event.touches[0].clientX - this.previousMouseX;
                const deltaY = event.touches[0].clientY - this.previousMouseY;

                this.earthMesh.rotation.y += deltaX * 0.005;
                this.earthMesh.rotation.x += deltaY * 0.005;

                this.previousMouseX = event.touches[0].clientX;
                this.previousMouseY = event.touches[0].clientY;
            }
        }
    }

    onTouchEnd() {
        this.isDragging = false;
        this.initialPinchDistance = 0;
        this.initialCameraZ = 0;
        // Don't reset rotation cooldown here - let it expire naturally
    }

    private getPinchDistance(touches: TouchList): number {
        const touch1 = touches[0];
        const touch2 = touches[1];
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    async updateFlightData() {
        await this.renderFlights();
    }
}
