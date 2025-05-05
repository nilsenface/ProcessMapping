<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../includes/db_functions.php';

// Get all data from the database
$data = getAllData();

// Return as JSON
echo json_encode($data);
?>
