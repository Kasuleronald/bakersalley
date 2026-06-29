
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

function user_has_bcrypt_hash($hash) {
    return is_string($hash) && strpos($hash, '$2y$') === 0;
}

function save_db($path, $db) {
    file_put_contents($path, json_encode($db, JSON_PRETTY_PRINT), LOCK_EX);
}

function normalize_multitenant_db($db) {
    if (!is_array($db)) {
        $db = [];
    }

    if (!isset($db['users']) || !is_array($db['users'])) {
        $db['users'] = [];
    }

    if (!isset($db['organizations']) || !is_array($db['organizations'])) {
        $db['organizations'] = [[
            "id" => "org-default",
            "name" => "Default Organization",
            "status" => "Active",
            "subscriptionTier" => "Enterprise",
            "createdAt" => date('c')
        ]];
    }

    if (!isset($db['tenants']) || !is_array($db['tenants'])) {
        $legacy = $db;
        unset($legacy['users'], $legacy['organizations'], $legacy['tenants'], $legacy['__meta'], $legacy['last_init']);

        $db['tenants'] = [
            "org-default" => $legacy
        ];
    }

    foreach ($db['users'] as &$u) {
        if (!isset($u['orgId']) || !$u['orgId']) {
            $u['orgId'] = 'org-default';
        }
    }
    unset($u);

    return $db;
}

function call_gemini_proxy($apiKey, $model, $prompt, $systemInstruction = '', $responseMimeType = '') {
    if (!$apiKey) {
        return ["ok" => false, "status" => 500, "error" => "GEMINI_API_KEY is not configured on server"];
    }

    $url = "https://generativelanguage.googleapis.com/v1beta/models/" . rawurlencode($model) . ":generateContent?key=" . rawurlencode($apiKey);

    $payload = [
        "contents" => [[
            "parts" => [["text" => $prompt]]
        ]]
    ];

    if ($systemInstruction) {
        $payload["systemInstruction"] = [
            "parts" => [["text" => $systemInstruction]]
        ];
    }

    if ($responseMimeType) {
        $payload["generationConfig"] = ["responseMimeType" => $responseMimeType];
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);

    $responseBody = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($responseBody === false) {
        return ["ok" => false, "status" => 502, "error" => $curlErr ?: "Failed to call Gemini API"];
    }

    $decoded = json_decode($responseBody, true);
    if ($httpCode >= 400) {
        $errMsg = $decoded['error']['message'] ?? 'Gemini API error';
        return ["ok" => false, "status" => 502, "error" => $errMsg];
    }

    $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
    return ["ok" => true, "status" => 200, "text" => $text];
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
$GEMINI_API_KEY = env_or_default('GEMINI_API_KEY', null);

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
            "orgId" => env_or_default('BAKERY_BOOTSTRAP_ORG_ID', 'org-default'),
            "passwordHash" => password_hash($bootstrapPassword, PASSWORD_BCRYPT),
            "role" => "Admin",
            "department" => "SuperAdmin"
        ];
    }

    file_put_contents($DATA_FILE, json_encode([
        "users" => $initialUsers,
        "organizations" => [[
            "id" => "org-default",
            "name" => env_or_default('BAKERY_BOOTSTRAP_ORG_NAME', 'Default Organization'),
            "status" => "Active",
            "subscriptionTier" => "Enterprise",
            "createdAt" => date('c')
        ]],
        "tenants" => [
            "org-default" => [
                "ingredients" => [],
                "skus" => [],
                "sales" => [],
                "transactions" => [],
                "productionLogs" => []
            ]
        ],
        "last_init" => date('Y-m-d H:i:s')
    ]));
}

$action = $_GET['action'] ?? '';

switch($action) {
    case 'ping':
        if (!$provided_key || !hash_equals($API_KEY, $provided_key)) {
            json_response(401, ["status" => "error", "message" => "Unauthorized"]);
        }
        json_response(200, ["status" => "ok", "time" => date('c')]);
        break;

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

        $db = normalize_multitenant_db(json_decode(file_get_contents($DATA_FILE), true));
        save_db($DATA_FILE, $db);
        $user = null;
        foreach($db['users'] as $u) {
            if ($u['identity'] === $identity) {
                $user = $u;
                break;
            }
        }

        $isAuthenticated = false;
        if ($user) {
            $hash = $user['passwordHash'] ?? '';
            if (user_has_bcrypt_hash($hash)) {
                $isAuthenticated = password_verify($password, $hash);
            } else if (is_string($hash) && hash_equals($hash, $password)) {
                $isAuthenticated = true;
                foreach ($db['users'] as &$dbUser) {
                    if (($dbUser['id'] ?? '') === ($user['id'] ?? '')) {
                        $dbUser['passwordHash'] = password_hash($password, PASSWORD_BCRYPT);
                        $user['passwordHash'] = $dbUser['passwordHash'];
                        break;
                    }
                }
                unset($dbUser);
                save_db($DATA_FILE, $db);
            }
        }

        if ($isAuthenticated) {
            $payload = [
                "uid" => $user['id'],
                "role" => $user['role'],
                "orgId" => ($user['orgId'] ?? 'org-default'),
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

    case 'register':
        $raw_input = file_get_contents('php://input');
        $input = json_decode($raw_input, true);
        $name = trim((string)($input['name'] ?? ''));
        $identity = trim((string)($input['identity'] ?? ''));
        $password = (string)($input['password'] ?? '');

        if ($name === '' || $identity === '' || $password === '') {
            json_response(400, ["status" => "error", "message" => "Name, identity, and password are required."]);
        }
        if (strlen($password) < 8) {
            json_response(400, ["status" => "error", "message" => "Password must be at least 8 characters."]);
        }

        $db = normalize_multitenant_db(json_decode(file_get_contents($DATA_FILE), true));
        $orgId = 'org-default';

        foreach ($db['users'] as $u) {
            if (strtolower((string)($u['identity'] ?? '')) === strtolower($identity)) {
                json_response(409, ["status" => "error", "message" => "Identity already exists."]);
            }
        }

        $newUser = [
            "id" => "u-" . time() . "-" . mt_rand(1000, 9999),
            "name" => $name,
            "identity" => $identity,
            "orgId" => $orgId,
            "passwordHash" => password_hash($password, PASSWORD_BCRYPT),
            "role" => "Staff",
            "department" => "Administration",
            "authorityLimit" => 0,
            "mfaEnabled" => false,
            "hasConsentedToPrivacy" => true
        ];

        $db['users'][] = $newUser;
        save_db($DATA_FILE, $db);
        unset($newUser['passwordHash']);
        json_response(201, ["status" => "success", "user" => $newUser]);
        break;

    case 'ai_proxy':
        $token_payload = verify_token($auth_header, $TOKEN_SECRET);
        if (!$token_payload) {
            json_response(403, ["status" => "error", "message" => "Session expired or invalid"]);
        }

        $raw_input = file_get_contents('php://input');
        $input = json_decode($raw_input, true);
        $prompt = trim((string)($input['prompt'] ?? ''));
        $model = trim((string)($input['model'] ?? 'gemini-2.0-flash'));
        $responseMimeType = trim((string)($input['responseMimeType'] ?? ''));
        $systemInstruction = trim((string)($input['systemInstruction'] ?? ''));

        if ($prompt === '') {
            json_response(400, ["status" => "error", "message" => "Prompt is required"]);
        }

        $aiResult = call_gemini_proxy($GEMINI_API_KEY, $model, $prompt, $systemInstruction, $responseMimeType);
        if (!$aiResult['ok']) {
            json_response($aiResult['status'], ["status" => "error", "message" => $aiResult['error']]);
        }

        json_response(200, ["status" => "success", "text" => $aiResult['text']]);
        break;

    case 'read':
        $token_payload = verify_token($auth_header, $TOKEN_SECRET);
        if (!$token_payload) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Session expired or invalid"]);
            exit;
        }

        $db = normalize_multitenant_db(json_decode(file_get_contents($DATA_FILE), true));
        save_db($DATA_FILE, $db);

        $orgId = $token_payload['orgId'] ?? 'org-default';
        $tenantData = $db['tenants'][$orgId] ?? [];
        echo json_encode($tenantData);
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
            $db = normalize_multitenant_db(json_decode(file_get_contents($DATA_FILE), true));
            $orgId = $token_payload['orgId'] ?? 'org-default';
            $db['tenants'][$orgId] = $data_to_save;
            save_db($DATA_FILE, $db);
            echo json_encode(["status" => "success", "user" => $token_payload['name']]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Invalid Action"]);
        break;
}
?>
