import { TestBed } from '@angular/core/testing';

import { Bot } from './bot';

describe('Bot', () => {
  let service: Bot;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Bot);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
