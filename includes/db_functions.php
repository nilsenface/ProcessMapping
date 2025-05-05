<?php
require_once __DIR__ . '/../config.php';

/**
 * Get all data from the database
 * @return array The complete data structure
 */
function getAllData() {
    global $collection;
    
    try {
        $data = $collection->findOne([]);
        if ($data) {
            return iterator_to_array($data);
        } else {
            return [
                'processes' => [],
                'systems' => [],
                'vendors' => []
            ];
        }
    } catch (Exception $e) {
        error_log("Error fetching data: " . $e->getMessage());
        return [
            'processes' => [],
            'systems' => [],
            'vendors' => []
        ];
    }
}

/**
 * Save data to the database
 * @param array $data The data to save
 * @return bool Success or failure
 */
function saveData($data) {
    global $collection;
    
    try {
        // Find existing document
        $existingData = $collection->findOne([]);
        
        if ($existingData) {
            // Update existing document
            $result = $collection->replaceOne(
                ['_id' => $existingData->_id],
                $data
            );
        } else {
            // Insert new document
            $result = $collection->insertOne($data);
        }
        
        return true;
    } catch (Exception $e) {
        error_log("Error saving data: " . $e->getMessage());
        return false;
    }
}

/**
 * Generate a unique ID for a new item
 * @param string $type The type of item (process, system, vendor)
 * @param array $items The existing items of this type
 * @return string The new ID
 */
function generateId($type, $items) {
    $prefix = '';
    switch ($type) {
        case 'process':
            $prefix = 'p';
            break;
        case 'system':
            $prefix = 's';
            break;
        case 'vendor':
            $prefix = 'v';
            break;
        case 'sub-process':
            $prefix = 'sp';
            break;
    }
    
    $maxNum = 0;
    foreach ($items as $item) {
        $idNum = (int) substr($item['id'], strlen($prefix));
        if ($idNum > $maxNum) {
            $maxNum = $idNum;
        }
    }
    
    return $prefix . ($maxNum + 1);
}
?>
