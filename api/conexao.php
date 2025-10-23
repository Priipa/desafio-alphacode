<?php
// Define as informações de conexão
$host = "localhost";
$port = "3307"; // Porta padrão do XAMPP para MySQL é 3307
$user = "root";
$pass = "";
$db   = "desafio_alphacode"; // Nome do banco de dados

// Tenta estabelecer a conexão usando MySQLi
$conexao = new mysqli($host, $user, $pass, $db, $port);

// Verifica se a conexão foi bem-sucedida
if ($conexao->connect_error) {
    die(json_encode(["erro" => "Falha na conexão com o banco de dados: " . $conexao->connect_error]));
}

// Configura o cabeçalho para permitir que o Angular acesse a API (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// O XAMPP usa o MySQLi por padrão para PHP >= 7
// Verificação de método HTTP para pre-flight request do CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}