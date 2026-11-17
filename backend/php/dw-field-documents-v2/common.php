<?php
declare(strict_types=1);
const DW_DOCUMENT_PROJECT = 'https://bsqfobdjzszompyvgxxk.supabase.co';
const DW_DOCUMENT_ORIGIN = 'https://denniswieringa1967-del.github.io';
const DW_DOCUMENT_MAX_BYTES = 8388608;
function dw_document_private_dir(): string { return dirname(__DIR__, 3) . '/dw-document-private'; }
function dw_document_headers(): void {
    ini_set('display_errors', '0');
    header('Cache-Control: no-store, private, max-age=0');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('X-Robots-Tag: noindex, nofollow, noarchive');
}
function dw_document_https(): bool {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['REQUEST_SCHEME'] ?? '') === 'https' || ($_SERVER['SERVER_PORT'] ?? '') == 443;
}
function dw_document_authorization(): string {
    // Some PHP/FastCGI hosting strips Authorization before PHP receives it.
    // The equivalent private header carries the same short-lived user JWT.
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($auth === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp((string) $name, 'Authorization') === 0) { $auth = $value; break; }
        }
    }
    if ($auth === '') $auth = $_SERVER['HTTP_X_DW_AUTHORIZATION'] ?? '';
    if (!is_string($auth) || !preg_match('/^Bearer [A-Za-z0-9_.-]{20,9000}$/D', $auth)) throw new RuntimeException('Meld je eerst aan bij DW Flow.', 401);
    return $auth;
}
function dw_document_key_valid(string $key): bool {
    if (preg_match('/^sb_publishable_[A-Za-z0-9_-]{12,}$/D', $key)) return true;
    $parts = explode('.', $key);
    if (count($parts) !== 3) return false;
    $payload = strtr($parts[1], '-_', '+/');
    $decoded = json_decode((string) base64_decode($payload . str_repeat('=', (4 - strlen($payload) % 4) % 4), true), true);
    return is_array($decoded) && ($decoded['role'] ?? '') === 'anon';
}
function dw_document_backend(array $config, string $auth, array $body, bool $sanitizer = false): array {
    if (!function_exists('curl_init') || !dw_document_key_valid((string) ($config['public_key'] ?? ''))) throw new RuntimeException('Documentverbinding niet ingesteld.', 503);
    $headers = ['Content-Type: application/json', 'Authorization: ' . $auth, 'apikey: ' . $config['public_key']];
    if ($sanitizer) {
        if (!preg_match('/^[a-f0-9]{64}$/D', (string) ($config['sanitizer_secret'] ?? ''))) throw new RuntimeException('Documentverwerker niet ingesteld.', 503);
        $headers[] = 'X-DW-Sanitizer: ' . $config['sanitizer_secret'];
    }
    $handle = curl_init(DW_DOCUMENT_PROJECT . '/functions/v1/dw-field-visit');
    $received = '';
    curl_setopt_array($handle, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($body, JSON_THROW_ON_ERROR), CURLOPT_HTTPHEADER => $headers, CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 45, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$received): int { if (strlen($received) + strlen($chunk) > 1048576) return 0; $received .= $chunk; return strlen($chunk); }]);
    $success = curl_exec($handle); $status = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE); curl_close($handle);
    if ($success === false) throw new RuntimeException('Beveiligde documentverbinding tijdelijk niet beschikbaar.', 503);
    $data = json_decode($received, true);
    if ($status < 200 || $status >= 300 || !is_array($data) || isset($data['error'])) {
        if ($status === 401 || $status === 403) throw new RuntimeException('Geen toegang tot dit dossier, bezoek of deze aanlevering.', 403);
        throw new RuntimeException('Documentontvangst niet bevestigd. Probeer niet direct opnieuw; controleer eerst het dossier.', 502);
    }
    return $data;
}
function dw_document_config(): array {
    $path = dw_document_private_dir() . '/config.php';
    if (!is_file($path)) throw new RuntimeException('Documentverwerker nog niet ingesteld.', 503);
    $config = require $path;
    if (!is_array($config)) throw new RuntimeException('Documentinstelling niet beschikbaar.', 503);
    return $config;
}
function dw_document_json(array $body, int $status = 200): never {
    http_response_code($status); header('Content-Type: application/json; charset=UTF-8'); echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); exit;
}
