
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 1. Defina a interface para o modelo de dados (BOA PRÁTICA)
export interface UsuarioData {
  id?: number;
  nome: string;
  email: string;
  data_nascimento: string;
  profissao: string;
  telefone: string;
  celular: string;
  check1: boolean; // Usaremos boolean (true/false) no front-end
  check2: boolean;
  check3: boolean;
}

@Injectable({
  providedIn: 'root'
})
// USANDO O NOME DA CLASSE CORRETO: Usuario
export class Usuario { 
  
  // ATENÇÃO: Defina a URL para o seu arquivo PHP
  // Se a porta do seu Apache não for 80, adicione-a aqui (ex: :8080)
  private readonly apiUrl = 'http://localhost/desafio-alphacode/api/usuarios.php'; 

  constructor(private readonly http: HttpClient) {}

  // 1. CREATE/UPDATE (Salvar um novo usuário ou editar um existente)
  // Usamos a interface UsuarioData para evitar conflito com o nome da classe 'Usuario'
  salvarUsuario(usuario: UsuarioData): Observable<any> {
    return this.http.post<any>(this.apiUrl, usuario); 
  }
  atualizarUsuario(id: number, usuario: UsuarioData): Observable<any> {
  // Pode ser PUT; se seu PHP só aceita POST, mantenha POST e trate por id no backend
  return this.http.put<any>(`${this.apiUrl}?id=${id}`, usuario);
}

  // 2. READ (Ler todos os usuários)
  listarUsuarios(): Observable<UsuarioData[]> {
    return this.http.get<UsuarioData[]>(this.apiUrl);
  }
  
  // 3. READ (Ler um único usuário pelo ID)
  obterUsuario(id: number): Observable<UsuarioData> {
    return this.http.get<UsuarioData>(`${this.apiUrl}?id=${id}`);
  }

  // 4. DELETE (Deletar um usuário)
  deletarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}