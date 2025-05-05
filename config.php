<?php
//
// MongoDB connection configuration
require_once __DIR__ . '/vendor/autoload.php'; // Include Composer autoloader

use MongoDB\Client;
use MongoDB\Driver\ServerApi;

// Database connection details
$uri = 'mongodb+srv://GitHub_db:iioeI7i6gdQccDG8@cluster0.uarvxrl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Set the Stable API version
$apiVersion = new ServerApi(ServerApi::V1);

// Create a new client and connect to the server
$mongoClient = new Client($uri, [], ['serverApi' => $apiVersion]);

// Select database and collection
$database = $mongoClient->selectDatabase('business_process_db');
$collection = $database->selectCollection('data');

// Initialize database with default data if empty
function initializeDatabase($collection) {
    // Check if collection is empty
    $count = $collection->countDocuments([]);
    
    if ($count === 0) {
        $initialData = [
            'processes' => [
                [
                    'id' => 'p1',
                    'name' => 'Customer Onboarding',
                    'subProcesses' => [
                        [
                            'id' => 'sp1',
                            'name' => 'Identity Verification',
                            'systems' => ['s1', 's3', 's5'],
                            'vendors' => ['v2']
                        ],
                        [
                            'id' => 'sp2',
                            'name' => 'Account Setup',
                            'systems' => ['s1', 's5'],
                            'vendors' => []
                        ]
                    ]
                ],
                [
                    'id' => 'p2',
                    'name' => 'Order Processing',
                    'subProcesses' => [
                        [
                            'id' => 'sp3',
                            'name' => 'Order Validation',
                            'systems' => ['s2', 's5'],
                            'vendors' => ['v1']
                        ]
                    ]
                ],
                [
                    'id' => 'p3',
                    'name' => 'Inventory Management',
                    'subProcesses' => []
                ],
                [
                    'id' => 'p4',
                    'name' => 'Financial Reporting',
                    'subProcesses' => []
                ]
            ],
            'systems' => [
                ['id' => 's1', 'name' => 'CRM System'],
                ['id' => 's2', 'name' => 'ERP Platform'],
                ['id' => 's3', 'name' => 'Customer Portal'],
                ['id' => 's4', 'name' => 'Business Intelligence Tool'],
                ['id' => 's5', 'name' => 'Enterprise Core System']
            ],
            'vendors' => [
                ['id' => 'v1', 'name' => 'Cloud Provider'],
                ['id' => 'v2', 'name' => 'Payment Gateway'],
                ['id' => 'v3', 'name' => 'Logistics Partner']
            ]
        ];
        
        $collection->insertOne($initialData);
        return true;
    }
    
    return false;
}

// Try to initialize the database
try {
    initializeDatabase($collection);
} catch (Exception $e) {
    // Log error but don't display to users
    error_log("Database initialization error: " . $e->getMessage());
}
?>
