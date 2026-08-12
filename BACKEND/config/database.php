<?php

    // #region 1. Configurações de banco de dados MySQL
    $servidor = '127.0.0.1';
    $porta = '3306';
    $banco = 'investmind';
    $usuario = 'root';
    $senha = '1234';
    #endregion

    // #region 2. Conexão com o banco de dados usando PDO
    try {
        $pdo = new PDO("mysql:host=$servidor;port=$porta;dbname=$banco;charset=utf8mb4", $usuario, $senha, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'sucesso' => false,
            'erro' => 'Falha na conexão com o banco de dados MySQL',
            'detalhes' => $e->getMessage()
        ]);
        exit;
    }
    #endregion

?>