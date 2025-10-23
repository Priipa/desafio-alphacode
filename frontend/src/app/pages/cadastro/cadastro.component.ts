import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidatorFn,
  AsyncValidatorFn,
  ValidationErrors
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Usuario, UsuarioData } from '../../services/usuario';
import { Title } from '@angular/platform-browser';
import { map, of, switchMap, timer } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-cadastro',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cadastro.html',
  styleUrls: ['./cadastro.css']
})
export class CadastroComponent implements OnInit {

  cadastroForm!: FormGroup;
  editando: boolean = false;
  usuarioId: number | null = null;

  // mensagens independentes (topo e lista)
  mensagemFormulario: { tipo: string, texto: string } | null = null;
  mensagemLista: { tipo: string, texto: string } | null = null;

  usuarios: UsuarioData[] = [];

  // ===== Helpers genéricos =====

  /** normaliza espaços (colapsa múltiplos e trim) */
  private normalizeSpaces(v: string): string {
    return (v ?? '').replace(/\s+/g, ' ').trim();
  }

  // ===== Nome completo =====

  /** Validador: 2+ palavras, letras com acentos + hífen/apóstrofo internos */
  private fullNameValidator(): ValidatorFn {
    return control => {
      const raw = (control.value ?? '').toString();
      const v = this.normalizeSpaces(raw);
      if (!v) return { required: true };

      const parts = v.split(' ');
      if (parts.length < 2) return { fullnameParts: true };

      const tokenRe = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
      for (const p of parts) if (!tokenRe.test(p)) return { invalidChars: true };
      return null;
    };
  }

  onNomeBlur(): void {
    const ctrl = this.cadastroForm.get('nome');
    const cur = ctrl?.value ?? '';
    const norm = this.normalizeSpaces(cur);
    if (ctrl && cur !== norm) ctrl.setValue(norm, { emitEvent: false });
  }

  // ===== Data de Nascimento (dd/mm/aaaa) =====

  /** Checa bissexto */
  private isLeapYear(y: number): boolean {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  }

  /** Valida formato dd/mm/aaaa e existência real da data */
  private isValidBrDateStr(s: string): boolean {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
    if (!m) return false;
    const d = +m[1], mo = +m[2], y = +m[3];
    if (y < 1899) return false; // sanidade
    if (mo < 1 || mo > 12) return false;
    const monthLen = [31, this.isLeapYear(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return d >= 1 && d <= monthLen[mo - 1];
  }

  /** Converte dd/mm/aaaa => Date (local) */
  private brStrToDate(s: string): Date | null {
    if (!this.isValidBrDateStr(s)) return null;
    const [dd, mm, yyyy] = s.split('/').map(n => +n);
    return new Date(yyyy, mm - 1, dd);
  }

  /** Converte ISO (yyyy-mm-dd) => dd/mm/aaaa */
  private isoToBr(iso: string): string {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const [y, m, d] = iso.split('-').map(n => +n);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  }

  /** Converte Date => ISO (yyyy-mm-dd) */
  private dateToIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** Validador composto da data de nascimento */
  private birthDateBrValidator(): ValidatorFn {
    return control => {
      const raw = (control.value ?? '').toString().trim();
      if (!raw) return { required: true };

      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return { invalidFormat: true };
      if (!this.isValidBrDateStr(raw)) return { invalidDate: true };

      const d = this.brStrToDate(raw)!;

      // não pode ser hoje nem futuro
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (d >= todayOnly) return { futureOrToday: true };

      return null;
    };
  }

  onBirthBlur(): void {
    const ctrl = this.cadastroForm.get('data_nascimento');
    const v = (ctrl?.value ?? '').toString().trim();
    if (!v) return;
    // normaliza: já está dd/mm/aaaa — apenas garante zeros à esquerda
    const m = /^(\d{1,2})[^\d]?(\d{1,2})[^\d]?(\d{4})$/.exec(v.replace(/\s+/g, ''));
    if (m) {
      const dd = String(+m[1]).padStart(2, '0');
      const mm = String(+m[2]).padStart(2, '0');
      const yyyy = m[3];
      const norm = `${dd}/${mm}/${yyyy}`;
      if (norm !== v) ctrl?.setValue(norm, { emitEvent: false });
    }
  }

  // ===== E-mail =====

  /** Validador síncrono de formato (sem espaços, 1 @, ponto depois do @) */
  private emailStrictValidator(): ValidatorFn {
    return control => {
      const raw = (control.value ?? '').toString();
      const v = raw.trim();
      if (!v) return { required: true };
      if (/\s/.test(v)) return { emailSpaces: true };

      const atCount = (v.match(/@/g) || []).length;
      if (atCount !== 1) return { emailAtCount: true };

      const [local, domain] = v.split('@');
      if (!local || !domain) return { emailBasic: true };
      if (!domain.includes('.')) return { emailNoDotAfterAt: true };

      // Usa também o Validators.email nativo (no initForm)
      return null;
    };
  }

  /** Validador assíncrono de unicidade (ignora o próprio id) */
  private emailUniqueValidator(): AsyncValidatorFn {
    return (control) => {
      const raw = (control.value ?? '').toString().trim().toLowerCase();
      if (!raw) return of(null);
      // debounce leve para evitar flood
      return timer(300).pipe(
        switchMap(() => this.usuarioService.listarUsuarios()),
        map((lista: any[]) => {
          const myId = this.usuarioId;
          const found = (lista || []).some(u =>
            (u?.email ?? '').toString().trim().toLowerCase() === raw &&
            Number(u?.id) !== Number(myId)
          );
          return found ? { emailNotUnique: true } as ValidationErrors : null;
        })
      );
    };
  }

  // ===== Profissão =====

  /** Letras com acentos + espaços + separadores comuns de cargo */
  private profissaoValidator(): ValidatorFn {
    const re = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s\-\.'\/&()]+$/; // inclui números para níveis (ex.: Analista 2)
    return control => {
      const v = (control.value ?? '').toString().trim();
      if (!v) return { required: true };
      if (v.length < 3) return { minlength: { requiredLength: 3, actualLength: v.length } };
      if (v.length > 155) return { maxlength: { requiredLength: 155, actualLength: v.length } };
      if (!re.test(v)) return { invalidChars: true };
      return null;
    };
  }

  onProfissaoBlur(): void {
    const ctrl = this.cadastroForm.get('profissao');
    const norm = this.normalizeSpaces(ctrl?.value ?? '');
    if (ctrl && ctrl.value !== norm) ctrl.setValue(norm, { emitEvent: false });
  }

  // ===== Telefone / Celular (máscaras) =====

  /** Só dígitos */
  private onlyDigits(s: string): string {
    return (s ?? '').replace(/\D+/g, '');
  }

  private formatTelefone(digits: string): string {
    const v = digits.slice(0, 10); // 2 + 8
    if (v.length <= 2) return `(${v}`;
    if (v.length <= 6) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  }

  private formatCelular(digits: string): string {
    const v = digits.slice(0, 11); // 2 + 9
    if (v.length <= 2) return `(${v}`;
    if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  }

  onTelefoneInput(evt: Event): void {
    const ctrl = this.cadastroForm.get('telefone');
    const raw = (evt.target as HTMLInputElement).value;
    const digits = this.onlyDigits(raw);
    const masked = this.formatTelefone(digits);
    if (ctrl) ctrl.setValue(masked, { emitEvent: false });
  }

  onCelularInput(evt: Event): void {
    const ctrl = this.cadastroForm.get('celular');
    const raw = (evt.target as HTMLInputElement).value;
    const digits = this.onlyDigits(raw);
    const masked = this.formatCelular(digits);
    if (ctrl) ctrl.setValue(masked, { emitEvent: false });
  }

  private telefoneOptionalValidator(): ValidatorFn {
  const re = /^\(\d{2}\) \d{4}-\d{4}$/;
  return control => {
    const raw = (control.value ?? '').toString().trim();
    const digits = raw.replace(/\D+/g, ''); // remove tudo que não é número
    if (!digits) return null; // se o usuário só abriu parêntese ou deixou vazio, está ok
    return re.test(raw) ? null : { telInvalid: true };
  };
}

onBirthInput(evt: Event): void {
  const ctrl = this.cadastroForm.get('data_nascimento');
  const raw = (evt.target as HTMLInputElement).value;
  const digits = raw.replace(/\D+/g, '').slice(0, 8); // mantém só números (máx. 8)
  let masked = digits;

  if (digits.length > 4) masked = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
  else if (digits.length > 2) masked = `${digits.slice(0,2)}/${digits.slice(2)}`;

  if (ctrl) ctrl.setValue(masked, { emitEvent: false });
}


  private celularRequiredValidator(): ValidatorFn {
    const re = /^\(\d{2}\) \d{5}-\d{4}$/;
    return control => {
      const v = (control.value ?? '').toString().trim();
      if (!v) return { required: true };
      return re.test(v) ? null : { celInvalid: true };
    };
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly usuarioService: Usuario,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly titleService: Title
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle('Cadastro de Contatos');
    this.initForm();

    this.route.queryParams.subscribe(params => {
      if (params['updated'] === '1') {
        this.setMensagemFormulario('success', 'Contato atualizado com sucesso.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.router.navigate([], { queryParams: { updated: null }, queryParamsHandling: 'merge' });
        setTimeout(() => this.setMensagemFormulario('', ''), 3000);
      }
    });

    this.checkEditMode();
    this.carregarUsuarios();
  }

  // Inicializa o formulário
  initForm(): void {
    this.cadastroForm = this.fb.group({
      id: [null],
      nome: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
          this.fullNameValidator()
        ]
      ],
      email: this.fb.control(
        '',
        {
          validators: [
            Validators.required,
            Validators.email,          // validação nativa
            this.emailStrictValidator() // regras adicionais
          ],
          asyncValidators: [this.emailUniqueValidator()],
          updateOn: 'blur' // para unicidade, evitar flood
        }
      ),
      data_nascimento: [
        '',
        [this.birthDateBrValidator()] // inclui required, formato, futuro/hoje e limite
      ],
      profissao: [
        '',
        [this.profissaoValidator()]
      ],
      telefone: [
        '',
        [this.telefoneOptionalValidator()], // opcional (vazio é ok)
      ],
      celular: [
        '',
        [this.celularRequiredValidator()] // obrigatório
      ],
      check1: [false],
      check2: [false],
      check3: [false]
    });
  }

  // Verifica se a rota possui um ID para carregar dados para edição
  checkEditMode(): void {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (id) {
        this.editando = true;
        this.usuarioId = id;
        this.titleService.setTitle('Editar Contato');
        this.carregarUsuarioParaEdicao(id);
      } else {
        this.editando = false;
        this.usuarioId = null;
        this.titleService.setTitle('Cadastro de Contatos');
        this.cadastroForm.reset({ check1: false, check2: false, check3: false });
        this.cadastroForm.markAsUntouched();
      }
    });
  }

  // Helpers de conversão (mantidos por estarem corretos)
  private snToBool(v: unknown): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 's';
    if (typeof v === 'number') return v === 1;
    return false;
  }
  private boolToSn(v: unknown): 's' | 'n' {
    return this.snToBool(v) ? 's' : 'n';
  }

  // Carrega os dados do usuário para preencher o formulário (Edição)
  carregarUsuarioParaEdicao(id: number): void {
    this.usuarioService.obterUsuario(id).subscribe({
      next: (raw) => {
        const data = Array.isArray(raw) ? raw[0] : raw;

        const usuarioFormatado = {
          id: data.id,
          nome: data.nome,
          email: (data.email ?? '').toString().trim(),
          data_nascimento: this.isoToBr(data.data_nascimento),
          profissao: data.profissao,
          telefone: data.telefone,
          celular: data.celular,
          check1: this.snToBool(data.check1),
          check2: this.snToBool(data.check2),
          check3: this.snToBool(data.check3),
        };

        this.usuarioId = data.id;
        this.cadastroForm.patchValue(usuarioFormatado);
        this.cadastroForm.markAsUntouched();
        this.cadastroForm.markAsPristine();
      },
      error: () => this.setMensagemFormulario('danger', 'Erro ao carregar dados para edição.')
    });
  }

  // Lógica de listagem
  carregarUsuarios(): void {
  this.usuarioService.listarUsuarios().subscribe({
    next: (data) => {
      this.usuarios = (data || []).map((u: any) => ({
        ...u,
        // converte ISO -> BR para exibição na tabela
        data_nascimento: this.isoToBr(u?.data_nascimento),
        check1: this.snToBool(u?.check1),
        check2: this.snToBool(u?.check2),
        check3: this.snToBool(u?.check3),
      })) as UsuarioData[];
    },
    error: (err) => {
      console.error('Erro ao carregar lista inicial:', err);
    }
  });
}

  // Gerencia a exclusão
  deletarUsuario(id: number | undefined): void {
    if (id === undefined) return;
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      this.usuarioService.deletarUsuario(id).subscribe({
        next: () => {
          this.setMensagemLista('danger', 'Contato excluído com sucesso.');
          this.carregarUsuarios();
          if (this.usuarioId === id) this.router.navigate(['/cadastro']);
        },
        error: () => this.setMensagemLista('danger', 'Erro ao excluir contato. Tente novamente.')
      });
    }
  }

  // Navega para a tela de edição
  editarUsuario(id: number | undefined): void {
    if (id === undefined) return;
    this.router.navigate(['/cadastro', id]);
  }

  // Submissão principal do formulário (BUG FIX - Salvar Alterações)
  onSubmit(): void {
    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    // Normalizações de campos
    const nomeCtrl = this.cadastroForm.get('nome');
    if (nomeCtrl) {
      const norm = this.normalizeSpaces(nomeCtrl.value ?? '');
      if (nomeCtrl.value !== norm) nomeCtrl.setValue(norm, { emitEvent: false });
    }
    const profCtrl = this.cadastroForm.get('profissao');
    if (profCtrl) {
      const norm = this.normalizeSpaces(profCtrl.value ?? '');
      if (profCtrl.value !== norm) profCtrl.setValue(norm, { emitEvent: false });
    }

    // Telefones: aplica default se vazio
    const telCtrl = this.cadastroForm.get('telefone');
    if (telCtrl && !this.normalizeSpaces(telCtrl.value ?? '')) {
      telCtrl.setValue('(00) 0000-0000', { emitEvent: false });
    }

    // Data: converter dd/mm/aaaa -> yyyy-mm-dd para API
    const dataCtrl = this.cadastroForm.get('data_nascimento');
    let dataIso = '';
    if (dataCtrl) {
      const d = this.brStrToDate((dataCtrl.value ?? '').toString());
      if (!d) {
        this.setMensagemFormulario('danger', 'Data de nascimento inválida.');
        return;
      }
      dataIso = this.dateToIso(d);
    }

    const formVal = this.cadastroForm.value;

    // Monta payload mantendo booleans; o PHP converte para 's'/'n' se necessário
    const payload = {
      ...formVal,
      id: this.usuarioId || formVal.id,
      data_nascimento: dataIso,
      telefone: this.cadastroForm.get('telefone')?.value,
      celular: this.cadastroForm.get('celular')?.value,
      check1: !!formVal.check1,
      check2: !!formVal.check2,
      check3: !!formVal.check3,
    };

    // DECISÃO: insert vs update
    if (this.editando && payload.id) {
      this.usuarioService.atualizarUsuario(payload.id, payload).subscribe({
        next: () => {
          this.setMensagemFormulario('success', 'Contato atualizado com sucesso.');
          this.carregarUsuarios();
          this.router.navigate(['/cadastro'], { queryParams: { updated: '1' } });
        },
        error: () => this.setMensagemFormulario('danger', 'Erro ao atualizar contato.')
      });
    } else {
      this.usuarioService.salvarUsuario(payload).subscribe({
        next: () => {
          this.setMensagemFormulario('success', 'Contato cadastrado com sucesso.');
          this.cadastroForm.reset({ check1: false, check2: false, check3: false });
          this.carregarUsuarios();
        },
        error: () => this.setMensagemFormulario('danger', 'Erro ao cadastrar contato.')
      });
    }
  }

  // mensagens (topo)
  setMensagemFormulario(tipo: string, texto: string): void {
    this.mensagemFormulario = { tipo, texto };
    setTimeout(() => { this.mensagemFormulario = null; }, 5000);
  }

  // mensagens (lista)
  setMensagemLista(tipo: string, texto: string): void {
    this.mensagemLista = { tipo, texto };
    setTimeout(() => { this.mensagemLista = null; }, 5000);
  }

  // Getters para template
  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.cadastroForm.controls as { [key: string]: AbstractControl<any, any> };
  }
  get nome() { return this.cadastroForm.get('nome'); }
}
