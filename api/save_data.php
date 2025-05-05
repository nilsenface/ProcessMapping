<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db_functions.php';

// Get the raw POST data
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

// Validate data
if (!$data || !isset($data['processes']) || !isset($data['systems']) || !isset($data['vendors'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid data format']);
    exit;
}

// Save data to database
$result = saveData($data);

if ($result) {
    echo json_encode(['success' => true, 'message' => 'Data updated successfully']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save data']);
}
?>
