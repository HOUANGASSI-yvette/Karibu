import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublishProperty } from './publish-property';

describe('PublishProperty', () => {
  let component: PublishProperty;
  let fixture: ComponentFixture<PublishProperty>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublishProperty]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublishProperty);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
