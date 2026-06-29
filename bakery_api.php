
<?php
/**
 * BakersAlley Enterprise Backend - Security Hardened v3.2
 * -----------------------------------------
 * Features: env-based secrets, allowlist CORS, login rate limiting, RBAC interlocks.
 */

$DATA_FILE = "bakery_ledger_master.json";
$RATE_LIMIT_FILE = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "bakersalley_login_rate_limit.json";

function env_or_default($key, $default = null) {
    $value = getenv($key);
    if ($value === false || $value === '') return $default;
    return $value;
}

function json_response($status, $payload, $extra_headers = []) {
    http_response_code($status);
    foreach ($extra_headers as $name => $value) {
        header($name . ': ' . $value);
    }
    echo json_encode($payload);
    exit;
}

function get_allowed_origins() {
    $raw = env_or_default('BAKERY_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173');
    $parts = array_filter(array_map('trim', explode(',', $raw)));
    return array_values($parts);
}

function apply_cors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = get_allowed_origins();

    header('Content-Type: application/json');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Bakery-Key, Authorization');
    header('Vary: Origin');

    if ($origin && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        if (!$origin || !in_array($origin, $allowed, true)) {
            json_response(403, ["status" => "error", "message" => "CORS origin not allowed"]);
        }
        http_response_code(204);
        exit;
    }

    if ($origin && !in_array($origin, $allowed, true)) {
        json_response(403, ["status" => "error", "message" => "CORS origin not allowed"]);
    }
}

function read_rate_limit_state($path) {
    if (!file_exists($path)) return [];
    $raw = file_get_contents($path);
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function write_rate_limit_state($path, $state) {
    file_put_contents($path, json_encode($state, JSON_PRETTY_PRINT), LOCK_EX);
}

function rate_limit_key($identity) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown-ip';
    return strtolower(trim($identity)) . '|' . $ip;
}

function check_login_rate_limit($path, $identity, $max_attempts, $window_seconds, $lockout_seconds) {
    $state = read_rate_limit_state($path);
    $key = rate_limit_key($identity);
    $now = time();

    if (!isset($state[$key])) {
        return ["allowed" => true, "retryAfter" => 0];
    }

    $entry = $state[$key];
    $locked_until = (int)($entry['lockedUntil'] ?? 0);
    if ($locked_until > $now) {
        return ["allowed" => false, "retryAfter" => $locked_until - $now];
    }

    $attempts = isset($entry['attempts']) && is_array($entry['attempts']) ? $entry['attempts'] : [];
    $attempts = array_values(array_filter($attempts, function($ts) use ($now, $window_seconds) {
        return ((int)$ts) >= ($now - $window_seconds);
    }));

    if (count($attempts) >= $max_attempts) {
        $entry['lockedUntil'] = $now + $lockout_seconds;
        $entry['attempts'] = $attempts;
        $state[$key] = $entry;
        write_rate_limit_state($path, $state);
        return ["allowed" => false, "retryAfter" => $lockout_seconds];
    }

    if (!empty($attempts) || !empty($entry)) {
        $entry['attempts'] = $attempts;
        $entry['lockedUntil'] = 0;
        $state[$key] = $entry;
        write_rate_limit_state($path, $state);
    }

    return ["allowed" => true, "retryAfter" => 0];
}

function record_login_failure($path, $identity, $max_attempts, $window_seconds, $lockout_seconds) {
    $state = read_rate_limit_state($path);
    $key = rate_limit_key($identity);
    $now = time();

    $entry = $state[$key] ?? ["attempts" => [], "lockedUntil" => 0];
    $attempts = isset($entry['attempts']) && is_array($entry['attempts']) ? $entry['attempts'] : [];
    $attempts = array_values(array_filter($attempts, function($ts) use ($now, $window_seconds) {
        return ((int)$ts) >= ($now - $window_seconds);
    }));
    $attempts[] = $now;

    $entry['attempts'] = $attempts;
    if (count($attempts) >= $max_attempts) {
        $entry['lockedUntil'] = $now + $lockout_seconds;
    }

    $state[$key] = $entry;
    write_rate_limit_state($path, $state);
}

function clear_login_rate_limit($path, $identity) {
    $state = read_rate_limit_state($path);
    $key = rate_limit_key($identity);
    if (isset($state[$key])) {
        unset($state[$key]);
        write_rate_limit_state($path, $state);
    }
}

apply_cors();

$TOKEN_SECRET = env_or_default('BAKERY_TOKEN_SECRET', null);
if (!$TOKEN_SECRET || strlen($TOKEN_SECRET) < 32) {
    json_response(500, [
        "status" => "error",
        "message" => "Server token secret is missing or too short. Set BAKERY_TOKEN_SECRET (min 32 chars)."
    ]);
}

$API_KEY = env_or_default('BAKERY_API_KEY', $TOKEN_SECRET);
$LOGIN_MAX_ATTEMPTS = (int)env_or_default('BAKERY_LOGIN_MAX_ATTEMPTS', '5');
$LOGIN_WINDOW_SECONDS = (int)env_or_default('BAKERY_LOGIN_WINDOW_SECONDS', '900');
$LOGIN_LOCKOUT_SECONDS = (int)env_or_default('BAKERY_LOGIN_LOCKOUT_SECONDS', '900');

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
    $bootstrapPassword = env_or_default('BAKERY_BOOTSTRAP_ADMIN_PASSWORD', null);
    $initialUsers = [];
    if ($bootstrapPassword) {
        $initialUsers[] = [
            "id" => "u-admin",
            "name" => env_or_default('BAKERY_BOOTSTRAP_ADMIN_NAME', 'System Admin'),
            "identity" => env_or_default('BAKERY_BOOTSTRAP_ADMIN_IDENTITY', 'admin@bakery.com'),
            "passwordHash" => password_hash($bootstrapPassword, PASSWORD_BCRYPT),
            "role" => "Admin",
            "department" => "SuperAdmin"
        ];
    }

    file_put_contents($DATA_FILE, json_encode([
        "ingredients" => [],
        "skus" => [],
        "sales" => [],
        "transactions" => [],
        "productionLogs" => [],
        "users" => $initialUsers,
        "last_init" => date('Y-m-d H:i:s')
    ]));
}

$action = $_GET['action'] ?? '';

switch($action) {
    case 'login':
        $raw_input = file_get_contents('php://input');
        $input = json_decode($raw_input, true);
        $identity = trim((string)($input['identity'] ?? ''));
        $password = $input['password'] ?? '';

        $limit = check_login_rate_limit(
            $RATE_LIMIT_FILE,
            $identity,
            $LOGIN_MAX_ATTEMPTS,
            $LOGIN_WINDOW_SECONDS,
            $LOGIN_LOCKOUT_SECONDS
        );

        if (!$limit['allowed']) {
            json_response(
                429,
                ["status" => "error", "message" => "Too many login attempts. Please retry later."],
                ["Retry-After" => (string)$limit['retryAfter']]
            );
        }

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
            $signature = hash_hmac('sha256', $base64_payload, $TOKEN_SECRET);
            $token = $base64_payload . "." . $signature;

            clear_login_rate_limit($RATE_LIMIT_FILE, $identity);

            // Sanitize user for frontend
            unset($user['passwordHash']);
            echo json_encode(["status" => "success", "token" => $token, "user" => $user]);
        } else {
            record_login_failure(
                $RATE_LIMIT_FILE,
                $identity,
                $LOGIN_MAX_ATTEMPTS,
                $LOGIN_WINDOW_SECONDS,
                $LOGIN_LOCKOUT_SECONDS
            );
            json_response(401, ["status" => "error", "message" => "Invalid credentials"]);
        }
        break;

    case 'read':
        if (!$provided_key || !hash_equals($API_KEY, $provided_key)) {
            http_response_code(401); exit;
        }
        echo file_get_contents($DATA_FILE);
        break;

    case 'write':
        $token_payload = verify_token($auth_header, $TOKEN_SECRET);
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
