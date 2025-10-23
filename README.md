<p align="center">
  <img src="/capa_readme.png" alt="Alphacode IT Solutions Capa" width="80%"/> 
</p>

---

# Desafio Alphacode — Full Stack (Angular + PHP API) 👩‍💻

Aplicação **full stack** composta por:
- **Frontend:** Angular (standalone) com Bootstrap
- **Backend/API:** PHP (procedural) com MySQL (**porta 3307** no XAMPP)

O objetivo é implementar um **CRUD de usuários** com formulário validado no frontend e uma API REST no backend.

---

## 🔧 Stack

# 🛠️ Stack

| Frontend | Backend |
| :--- | :--- |
| **Tecnologia Principal:** | **Tecnologia Principal:** |
| - Angular | - PHP (compatível com XAMPP) |
| - Bootstrap | - MySQL (porta `3307`) |
| - HTTPClient para consumo da API | - MySQLi + endpoints REST em `api/usuarios.php` |
| - Estrutura principal em `frontend` | - CORS habilitado em `api/conexao.php` |

---

## 🗂️ Estrutura do projeto

```
desafio-alphacode/
├─ api/
│  ├─ conexao.php        # Conexão MySQL (porta 3307) + headers CORS
│  └─ usuarios.php       # Endpoints REST (GET, POST, PUT, DELETE)
└─ frontend/
   └─ src/
      ├─ styles.css
      └─ app/
         ├─ app.config.ts
         ├─ app.html
         ├─ app.routes.ts
         ├─ app.ts
         ├─ pages/
         │  └─ cadastro/
         │     ├─ cadastro.component.ts
         │     ├─ cadastro.html
         │     └─ cadastro.spec.ts
         ├─ services/
         │   ├─ usuario.ts
         │   └─ usuario.spec.ts
         └─ assets/
         │   ├─ editar.png
         │   ├─ excluir.png
         │   ├─ logo_alphadoce.png
         └─  └─ logo_rodape_alphadoce.png
```

---

## 🧩 Banco de dados

No XAMPP, o **MySQL está na porta 3307**. A conexão é definida em `api/conexao.php`:

```php
$host = "localhost";
$port = "3307";
$user = "root";
$pass = "";
$db   = "desafio_alphacode";
```

### Estrutura da tabela `usuarios`
Equivalentemente ao print anexo, a tabela possui:

| Campo           | Tipo              | Nulo | Observação                |
|-----------------|-------------------|------|---------------------------|
| id              | INT(11)           | Não  | PK, AUTO_INCREMENT        |
| nome            | VARCHAR(255)      | Não  |                           |
| email           | VARCHAR(155)      | Não  |                           |
| data_nascimento | DATE              | Não  |                           |
| profissao       | VARCHAR(75)       | Não  |                           |
| telefone        | VARCHAR(20)       | Não  |                           |
| celular         | VARCHAR(20)       | Não  |                           |
| check1          | ENUM('s','n')     | Não  |                           |
| check2          | ENUM('s','n')     | Não  |                           |
| check3          | ENUM('s','n')     | Não  |                           |

**SQL de criação:**

```sql
CREATE DATABASE IF NOT EXISTS desafio_alphacode CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE desafio_alphacode;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT(11) NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(155) NOT NULL,
  data_nascimento DATE NOT NULL,
  profissao VARCHAR(75) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  celular VARCHAR(20) NOT NULL,
  check1 ENUM('s','n') NOT NULL,
  check2 ENUM('s','n') NOT NULL,
  check3 ENUM('s','n') NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

---

## ▶️ Como executar

### 1) Backend (API PHP no XAMPP)

1. **Instale e inicie** o XAMPP (Apache + MySQL).  
2. Garanta que o **MySQL rode na porta 3307** (como no seu ambiente).  
3. Crie o banco e a tabela usando o SQL acima (via phpMyAdmin ou cliente MySQL).  
4. Copie esta pasta do projeto para o diretório do Apache. Ex.:  
   - Windows: `C:\xampp\htdocs\desafio-alphacode`
5. A API ficará disponível em:  
   `http://localhost/desafio-alphacode/api/usuarios.php`

> Os **headers CORS** já estão configurados em `api/conexao.php`.

### 2) Frontend (Angular)

```bash
cd frontend
npm install
npm start
# abre em http://localhost:4200
```

O serviço `src/app/services/usuario.ts` já aponta para a URL da API:

```ts
apiUrl = 'http://localhost/desafio-alphacode/api/usuarios.php';
```

---

## 🔗 Endpoints da API (`api/usuarios.php`)

Todos retornam/recebem **JSON**.

### Listar usuários
```
GET /api/usuarios.php
```

### Obter um usuário por ID
```
GET /api/usuarios.php?id=1
```

### Criar usuário
```
POST /api/usuarios.php
Content-Type: application/json

{campos do usuário}
```

### Atualizar usuário (por ID)
```
PUT /api/usuarios.php?id=1
Content-Type: application/json

{campos do usuário}
```

### Excluir usuário
```
DELETE /api/usuarios.php?id=1
```

> No backend, os *checks* são persistidos como `'s'`/`'n'`, enquanto no frontend são **booleanos** (`true`/`false`). A conversão é feita na API.



---

## 🎨 UI / Regras de validação (Frontend)

- **Data de nascimento:** `dd/mm/aaaa`, data válida, não futura
- **Telefone/Celular:** máscara `(dd) xxxxx-xxxx`
- **Tabela:** bordas retas, header azul `#068ed0`, texto branco
- **Feedbacks:** mensagens de sucesso/erro e marcação de campos inválidos

---

## 🛠️ Troubleshooting

- **Erro de conexão ao MySQL:** confirme a porta `3307` em `api/conexao.php` e no XAMPP.
- **CORS:** já configurado; se alterar a origem, ajuste os headers em `conexao.php`.
- **API 404:** confira a pasta dentro de `htdocs` e a URL base `http://localhost/desafio-alphacode/`.

---


**Créditos:** Projeto didático para o desafio Alphacode.
