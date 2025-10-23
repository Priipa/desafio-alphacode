import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { CadastroComponent } from './cadastro.component';

// Mocks Simples para os serviços injetados
const mockRouter = { navigate: jasmine.createSpy('navigate') };
const mockActivatedRoute = {
  // Retorna um Observable que emite um objeto vazio (sem ID na rota)
  params: of({}), 
  snapshot: {} 
};
const mockTitleService = { setTitle: jasmine.createSpy('setTitle') };
// MOCK para seu serviço de API
const mockUsuarioService = jasmine.createSpyObj('Usuario', ['listarUsuarios', 'obterUsuario', 'deletarUsuario', 'salvarUsuario']);
// Simula que a lista inicial está vazia para não dar erro
mockUsuarioService.listarUsuarios.and.returnValue(of([]));

describe('Cadastro', () => {
  let component: CadastroComponent;
  let fixture: ComponentFixture<CadastroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroComponent, ReactiveFormsModule],

      // 4. PROVIDERS: Forneça todos os serviços injetados no construtor
      providers: [
        FormBuilder, // FormBuilder é um serviço Angular que precisa ser fornecido
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Title, useValue: mockTitleService },
        { provide: 'Usuario', useValue: mockUsuarioService }, // Adapte o nome do token do seu serviço, se necessário
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
