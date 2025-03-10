import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';

@Component({
    selector: 'app-webgl-globe',
    template:
        '<div #rendererContainer (mousedown)="onMouseDown($event)" (mousemove)="onMouseMove($event)" (mouseup)="onMouseUp()" (wheel)="onMouseWheel($event)"></div>',
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

    ngOnInit() {
        this.initThreeJS();
        this.renderFlights();
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
        const earthTexture = textureLoader.load('/earth_atmos_2048.jpg');

        const earthGeometry = new THREE.SphereGeometry(5, 50, 50);
        const earthMaterial = new THREE.MeshBasicMaterial({
            map: earthTexture,
        });
        this.earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
        this.scene.add(this.earthMesh);

        this.flightGroup = new THREE.Group();
        this.earthMesh.add(this.flightGroup);

        this.camera.position.z = 10;
        this.animate();
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        this.renderer.render(this.scene, this.camera);
    };

    async fetchFlightData() {
        const response = await fetch(
            'https://opensky-network.org/api/states/all'
        );
        const data = await response.json();
        return data.states;
    }

    latLonToSphere(lat: number, lon: number, radius: number) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        return {
            x: radius * Math.sin(phi) * Math.cos(theta),
            y: radius * Math.cos(phi),
            z: radius * Math.sin(phi) * Math.sin(theta),
        };
    }

    async renderFlights() {
        const flights = await this.fetchFlightData();
        const airplaneGeometry = new THREE.SphereGeometry(0.1, 10, 10);
        const airplaneMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
        });

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
            ]: [
                string,
                string,
                string,
                number,
                number,
                number,
                number,
                number
            ]) => {
                if (lat && lon) {
                    const pos = this.latLonToSphere(lat, lon, 5.1);
                    const airplane = new THREE.Mesh(
                        airplaneGeometry,
                        airplaneMaterial
                    );
                    airplane.position.set(pos.x, pos.y, pos.z);
                    this.flightGroup.add(airplane);
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
        const intersects = raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
            console.log('Flight clicked:', intersects[0].object);
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
        this.camera.position.z += event.deltaY * 0.01;
        this.camera.position.z = Math.max(
            3,
            Math.min(20, this.camera.position.z)
        );
    }
}
