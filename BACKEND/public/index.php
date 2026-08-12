<?php

//region 1 - Headers CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Responde a requisições Preflight (OPTIONS) do navegador/React Native
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
//endregion

//region 2 - Arquivos
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../src/Services/BrapiService.php";
require_once __DIR__ . "/../src/Controllers/AlertController.php";

$method = $_SERVER["REQUEST_METHOD"];
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
//endregion

//region 3 - Controllers
$alertaController = new AlertController($pdo);
$brapiService = new BrapiService();
//endregion

//region 4 - Rotas

// GET /api/cotacao?tickers=PETR4,VALE3
if ($method === "GET" && $path === '/api/cotacao') {
    $tickers = $_GET['tickers'] ?? 'PETR4';
    $dados = $brapiService->buscarCotacao($tickers);
    echo json_encode($dados);
    exit;
}

// GET /api/alertas
if ($method === 'GET' && $path === '/api/alertas') {
    $alertaController->listar();
    exit;
}

// POST /api/alertas
if ($method === 'POST' && $path === '/api/alertas') {
    $alertaController->criar();
    exit;
}

// DELETE /api/alertas/{id}
if ($method === 'DELETE' && $path === '/api/alertas/{id}') {
    $alertaController->deletar();
    exit;
}

// Se nenhuma rota corresponder, retorna 404
http_response_code(404);
echo json_encode(['sucesso' => false, 'mensagem' => 'Rota não encontrada.']);