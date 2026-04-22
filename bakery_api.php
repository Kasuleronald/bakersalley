
<?php
/**
 * BakersAlley Enterprise Backend - Security Hardened v3.1
 * -----------------------------------------
 * Features: JWT-style session tokens, RBAC Interlocks, Bcrypt hashing.
 */

$SECRET_KEY = "BAKERY_SECURE_9921_PRO"; 
$DATA_FILE = "bakery_ledger_master.json";
$BACKUP_DIR = "backups/";
$MAX_BACKUPS = 50;

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Bakery-Key, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$provided_key = $_SERVER['HTTP_X_BAKERY_KEY'] ?? $_GET['key'] ?? '';
$auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

// Helper: Verify Session Token
function verify_token($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 2) return false;
    $payload = json_decode(base64_decode($parts[0]), true);
    $signature = $parts[1];
    if (hash_hmac('sha256', $parts[0], $secret) !== $signature) return false;
    if (isset($payload['exp']) && $payload['exp'] < time()) return false;
    return $payload;
}

if (!file_exists($DATA_FILE)) {
    file_put_contents($DATA_FILE, json_encode([
        "ingredients" => [],
        "skus" => [],
        "sales" => [],
        "transactions" => [],
        "productionLogs" => [],
        "users" => [
            // Default Admin for First-Time Setup (Password: admin123)
            ["id" => "u-admin", "name" => "System Admin", "identity" => "admin@bakery.com", "passwordHash" => password_hash("admin123", PASSWORD_BCRYPT), "role" => "Admin", "department" => "SuperAdmin"]
        ],
        "last_init" => date('Y-m-d H:i:s')
    ]));
}

$action = $_GET['action'] ?? '';

switch($action) {
    case 'login':
        $raw_input = file_get_contents('php://input');
        $input = json_decode($raw_input, true);
        $identity = $input['identity'] ?? '';
        $password = $input['password'] ?? '';

        $db = json_decode(file_get_contents($DATA_FILE), true);
        $user = null;
        foreach($db['users'] as $u) {
            if ($u['identity'] === $identity) {
                $user = $u;
                break;
            }
        }

        if ($user && password_verify($password, $user['passwordHash'])) {
            $payload = [
                "uid" => $user['id'],
                "role" => $user['role'],
                "name" => $user['name'],
                "exp" => time() + (8 * 3600) // 8 hour session
            ];
            $base64_payload = base64_encode(json_encode($payload));
            $signature = hash_hmac('sha256', $base64_payload, $SECRET_KEY);
            $token = $base64_payload . "." . $signature;

            // Sanitize user for frontend
            unset($user['passwordHash']);
            echo json_encode(["status" => "success", "token" => $token, "user" => $user]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
        }
        break;

    case 'read':
        if ($provided_key !== $SECRET_KEY) {
            http_response_code(401); exit;
        }
        echo file_get_contents($DATA_FILE);
        break;

    case 'write':
        $token_payload = verify_token($auth_header, $SECRET_KEY);
        if (!$token_payload) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Session expired or invalid"]);
            exit;
        }

        // RBAC Interlock: Only Admin/Manager can write to master ledger
        if (!in_array($token_payload['role'], ['Admin', 'Manager', 'Managing Director'])) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Insufficient permissions for write action."]);
            exit;
        }

        $raw_input = file_get_contents('php://input');
        $json_payload = json_decode($raw_input, true);
        $data_to_save = isset($json_payload['data']) ? $json_payload['data'] : $json_payload;

        if ($data_to_save && is_array($data_to_save)) {
            $json_string = json_encode($data_to_save, JSON_PRETTY_PRINT);
            file_put_contents($DATA_FILE, $json_string, LOCK_EX);
            echo json_encode(["status" => "success", "user" => $token_payload['name']]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid Action"]);
        break;
}
?>
