import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebglGlobeComponent } from './webgl-globe.component';

describe('WebglGlobeComponent', () => {
  let component: WebglGlobeComponent;
  let fixture: ComponentFixture<WebglGlobeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebglGlobeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebglGlobeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
