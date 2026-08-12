import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { App } from './app';
import { routes } from './app.routes';
import { CollectionService } from './collection.service';

describe('Collections', () => {
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter(routes),
        {
          provide: CollectionService,
          useValue: {
            watchOwned: () => of(new Set<number>()),
            setOwned: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('shows Luis Pokemon grouped by generation', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject((await import('@angular/router')).Router);
    await router.navigateByUrl('/luis');
    fixture.detectChanges();

    httpTesting.expectOne('https://pokeapi.co/api/v2/generation/1').flush({
      pokemon_species: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon-species/1/' }],
    });
    httpTesting.expectOne('https://pokeapi.co/api/v2/pokemon-species?limit=1').flush({ count: 1025 });
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Bulbasaur');
  });

  it('requests legendary and mythical species for Martin', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject((await import('@angular/router')).Router);
    await router.navigateByUrl('/martin');
    fixture.detectChanges();

    const request = httpTesting.expectOne('https://graphql.pokeapi.co/v1beta2');
    expect(request.request.body.query).toContain('is_legendary');
    expect(request.request.body.query).toContain('is_mythical');
    request.flush({ data: { pokemon_species: [{ id: 144, name: 'articuno' }, { id: 151, name: 'mew' }] } });
    httpTesting.expectOne('https://pokeapi.co/api/v2/generation/1').flush({
      pokemon_species: [
        { name: 'articuno', url: 'https://pokeapi.co/api/v2/pokemon-species/144/' },
        { name: 'mew', url: 'https://pokeapi.co/api/v2/pokemon-species/151/' },
      ],
    });
    fixture.detectChanges();
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Articuno');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Mew');
  });
});
