<?php
// Força o relatório de erros
error_reporting(E_ALL);
ini_set('display_errors', 0); // Não exibe erros na resposta
ini_set('log_errors', 1);

// Headers devem ser os primeiros outputs
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Função para respostas padronizadas
function jsonResponse($success, $data = [], $error = null, $statusCode = 200) {
    http_response_code($statusCode);
    exit(json_encode([
        'success' => $success,
        'buttons' => $data,
        'error' => $error
    ]));
}

try {
    // Configurações
    $db_path = realpath(__DIR__.'/../db/buttons.db');
    $upload_dir = realpath(__DIR__.'/../img/ico/');
    
    // Verifica se os diretórios existem
    if (!file_exists($db_path)) {
        jsonResponse(false, [], 'Database file not found', 500);
    }
    
    if (!is_writable($upload_dir)) {
        jsonResponse(false, [], 'Upload directory not writable', 500);
    }

    // Conexão com o banco
    $db = new SQLite3($db_path);
    $db->enableExceptions(true);

    // Processa a ação
    $action = $_GET['action'] ?? '';
    $input = json_decode(file_get_contents('php://input'), true) ?: [];

    switch ($action) {
        case 'get':
            $stmt = $db->prepare("SELECT * FROM buttons WHERE is_active = 1");
            $result = $stmt->execute();
            $buttons = [];
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $buttons[] = $row;
            }
            jsonResponse(true, $buttons);
            break;

        case 'add':
            $required = ['title', 'url', 'icon'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    jsonResponse(false, [], "Missing field: $field", 400);
                }
            }

            $stmt = $db->prepare("
                INSERT INTO buttons (title, url, icon, description) 
                VALUES (:title, :url, :icon, :description)
            ");
            
            $stmt->bindValue(':title', trim($input['title']));
            $stmt->bindValue(':url', trim($input['url']));
            $stmt->bindValue(':icon', trim($input['icon']));
            $stmt->bindValue(':description', trim($input['description'] ?? ''));
            
            if ($stmt->execute()) {
                jsonResponse(true, ['id' => $db->lastInsertRowID()]);
            }
            break;

        case 'upload_icon':
            if (empty($_FILES['icon'])) {
                jsonResponse(false, [], 'No file uploaded', 400);
            }

            // ... (código de validação de imagem anterior) ...
            
            break;

        default:
            jsonResponse(false, [], 'Invalid action', 400);
    }

} catch (Exception $e) {
    jsonResponse(false, [], $e->getMessage(), 500);
}