import { Component } from '@angular/core';
import { WebglGlobeComponent } from './webgl-globe/webgl-globe.component';

@Component({
    selector: 'app-root',
    imports: [WebglGlobeComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    title = 'flight-tracker';
}
