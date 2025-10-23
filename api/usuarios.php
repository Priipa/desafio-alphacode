<?php
// Inclui o arquivo de conexão e as configurações de CORS
include_once 'conexao.php';

// Obtém o método HTTP da requisição (GET, POST, PUT, DELETE)
$method = $_SERVER['REQUEST_METHOD'];
$tabela = 'usuarios';

// Função para sanitizar os dados de entrada
function sanitize($conexao, $data) {
    if (is_array($data)) {
        $sanitized_data = [];
        foreach ($data as $key => $value) {
            $sanitized_data[$key] = $conexao->real_escape_string($value);
        }
        return $sanitized_data;
    }
    return $conexao->real_escape_string($data);
}

switch ($method) {
    // ---------------------------------
    // READ (GET) - Listar usuários ou buscar um único usuário
    // ---------------------------------
    case 'GET':
        // Se houver um 'id' na URL (ex: usuarios.php?id=1)
        if (isset($_GET['id'])) {
            $id = sanitize($conexao, $_GET['id']);
            $sql = "SELECT * FROM $tabela WHERE id = $id";
        } else {
            // Caso contrário, lista todos os usuários
            $sql = "SELECT * FROM $tabela ORDER BY id DESC";
        }
        
        $resultado = $conexao->query($sql);
        $usuarios = [];

        if ($resultado) {
            while($row = $resultado->fetch_assoc()) {
                $row['check1'] = ($row['check1'] === 's');
                $row['check2'] = ($row['check2'] === 's');
                $row['check3'] = ($row['check3'] === 's');
                $usuarios[] = $row;
            }
            // Retorna a lista em formato JSON
            echo json_encode($usuarios);
        } else {
            http_response_code(500);
            echo json_encode(array("erro" => "Erro ao buscar usuários: " . $conexao->error));
        }
        break;

    // ---------------------------------
    // CREATE (POST) - Inserir um novo usuário
    // ---------------------------------
    case 'POST':
        // Recebe os dados JSON enviados pelo Angular
        $data = json_decode(file_get_contents("php://input"), true);

        if ($data) {
            // Sanitiza e mapeia os dados para as colunas do DB
            $nome = sanitize($conexao, $data['nome']);
            $email = sanitize($conexao, $data['email']);
            $data_nascimento = sanitize($conexao, $data['data_nascimento']);
            $profissao = sanitize($conexao, $data['profissao']);
            $telefone = sanitize($conexao, $data['telefone']);
            $celular = sanitize($conexao, $data['celular']);
            
            // Os checks vêm como booleanos no Angular (true/false) e precisam ser convertidos para 's' ou 'n'
            $check1 = (isset($data['check1']) && ($data['check1'] === true || $data['check1'] === 's')) ? 's' : 'n';
            $check2 = (isset($data['check2']) && ($data['check2'] === true || $data['check2'] === 's')) ? 's' : 'n';
            $check3 = (isset($data['check3']) && ($data['check3'] === true || $data['check3'] === 's')) ? 's' : 'n';


            $sql = "INSERT INTO $tabela (nome, email, data_nascimento, profissao, telefone, celular, check1, check2, check3)
                    VALUES ('$nome', '$email', '$data_nascimento', '$profissao', '$telefone', '$celular', '$check1', '$check2', '$check3')";
            
            if ($conexao->query($sql) === true) {
                // Retorna sucesso e o ID inserido
                http_response_code(201); // Created
                echo json_encode(array("mensagem" => "Usuário criado com sucesso.", "id" => $conexao->insert_id));
            } else {
                http_response_code(500);
                echo json_encode(array("erro" => "Erro ao criar usuário: " . $conexao->error));
            }
        } else {
            http_response_code(400); // Bad Request
            echo json_encode(array("erro" => "Dados inválidos fornecidos."));
        }
        break;
        
    // ---------------------------------
    // UPDATE (PUT) - Atualizar um usuário existente
    // ---------------------------------
    case 'PUT':
        // O ID é tipicamente passado na URL (ex: usuarios.php?id=1)
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(array("erro" => "ID do usuário é obrigatório para atualização."));
            break;
        }

        $id = sanitize($conexao, $_GET['id']);
        $data = json_decode(file_get_contents("php://input"), true);
        
        if ($data) {
            // Sanitiza e mapeia os dados (mesma lógica do POST)
            $nome = sanitize($conexao, $data['nome']);
            $email = sanitize($conexao, $data['email']);
            $data_nascimento = sanitize($conexao, $data['data_nascimento']);
            $profissao = sanitize($conexao, $data['profissao']);
            $telefone = sanitize($conexao, $data['telefone']);
            $celular = sanitize($conexao, $data['celular']);
            
            $check1 = (isset($data['check1']) && ($data['check1'] === true || $data['check1'] === 's')) ? 's' : 'n';
            $check2 = (isset($data['check2']) && ($data['check2'] === true || $data['check2'] === 's')) ? 's' : 'n';
            $check3 = (isset($data['check3']) && ($data['check3'] === true || $data['check3'] === 's')) ? 's' : 'n';


            $sql = "UPDATE $tabela SET
                    nome = '$nome',
                    email = '$email',
                    data_nascimento = '$data_nascimento',
                    profissao = '$profissao',
                    telefone = '$telefone',
                    celular = '$celular',
                    check1 = '$check1',
                    check2 = '$check2',
                    check3 = '$check3'
                    WHERE id = $id";

            if ($conexao->query($sql) === true) {
                http_response_code(200); // OK
                echo json_encode(array("mensagem" => "Usuário ID $id atualizado com sucesso."));
            } else {
                http_response_code(500);
                echo json_encode(array("erro" => "Erro ao atualizar usuário: " . $conexao->error));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("erro" => "Dados de atualização inválidos."));
        }
        break;

    // ---------------------------------
    // DELETE (DELETE) - Deletar um usuário
    // ---------------------------------
    case 'DELETE':
        // O ID é obrigatório e deve vir na URL
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(array("erro" => "ID do usuário é obrigatório para exclusão."));
            break;
        }

        $id = sanitize($conexao, $_GET['id']);
        $sql = "DELETE FROM $tabela WHERE id = $id";
        
        if ($conexao->query($sql) === true) {
            if ($conexao->affected_rows > 0) {
                http_response_code(200); // OK
                echo json_encode(array("mensagem" => "Usuário ID $id excluído com sucesso."));
            } else {
                http_response_code(404); // Not Found
                echo json_encode(array("erro" => "Usuário com ID $id não encontrado."));
            }
        } else {
            http_response_code(500);
            echo json_encode(array("erro" => "Erro ao excluir usuário: " . $conexao->error));
        }
        break;

    default:
        // Método não permitido
        http_response_code(405);
        echo json_encode(array("erro" => "Método não permitido."));
        break;
}

// Fecha a conexão com o banco de dados
$conexao->close();
