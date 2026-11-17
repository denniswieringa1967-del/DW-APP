<?php
declare(strict_types=1);
require __DIR__ . '/dw-field-documents-v2/common.php';
require __DIR__ . '/dw-field-documents-v2/sanitize.php';
dw_document_headers(); $scratch = null; $oldMask = umask(0077);
try {
    if (!dw_document_https()) throw new RuntimeException('HTTPS vereist.', 403);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (!in_array($origin, [DW_DOCUMENT_ORIGIN, 'https://dw-marketing.nl'], true)) throw new RuntimeException('Deze herkomst is niet toegestaan.', 403);
    header('Access-Control-Allow-Origin: ' . $origin); header('Vary: Origin');
    $method = $_SERVER['REQUEST_METHOD'] ?? '';
    if ($method === 'OPTIONS') {
        $requested = array_filter(array_map('trim', explode(',', strtolower($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'] ?? ''))));
        if (($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'] ?? '') !== 'POST' || array_diff($requested, ['authorization', 'content-type', 'x-dw-authorization'])) throw new RuntimeException('Niet toegestane aanvraag.', 403);
        header('Access-Control-Allow-Methods: POST'); header('Access-Control-Allow-Headers: authorization,content-type,x-dw-authorization'); http_response_code(204); exit;
    }
    if ($method !== 'POST') throw new RuntimeException('POST vereist.', 405);
    $length = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0); if ($length < 1 || $length > 9437184) throw new RuntimeException('Kies een bestand van maximaal 8 MB.', 413);
    $auth = dw_document_authorization(); $config = dw_document_config();
    dw_document_backend($config, $auth, ['op' => 'ping']);
    foreach (array_keys($_POST) as $key) if (!in_array($key, ['lead_id', 'visit_id', 'token', 'consent'], true)) throw new RuntimeException('Onbekend aanleverveld.', 400);
    $lead = $_POST['lead_id'] ?? ''; $visit = $_POST['visit_id'] ?? ''; $token = $_POST['token'] ?? '';
    foreach ([$lead, $visit] as $id) if (!is_string($id) || !preg_match('/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/Di', $id)) throw new RuntimeException('Ongeldig dossier of bezoek.', 400);
    if (($_POST['consent'] ?? '') !== 'true' || !is_string($token) || !preg_match('/^[a-f0-9-]{72}$/Di', $token)) throw new RuntimeException('Controleer toestemming en aanlevering.', 400);
    if (count($_FILES) !== 1 || !isset($_FILES['file']) || !is_array($_FILES['file']) || ($_FILES['file']['error'] ?? -1) !== UPLOAD_ERR_OK) throw new RuntimeException('Bestand niet volledig ontvangen.', 400);
    $file = $_FILES['file']; if (!is_string($file['tmp_name'] ?? null) || !is_uploaded_file($file['tmp_name']) || !is_int($file['size'] ?? null) || $file['size'] < 1 || $file['size'] > DW_DOCUMENT_MAX_BYTES) throw new RuntimeException('Ongeldig bestand of groter dan 8 MB.', 400);
    dw_document_backend($config, $auth, ['op' => 'check_upload', 'lead_id' => $lead, 'visit_id' => $visit, 'token' => $token], true);
    $scratch = dw_document_private_dir() . '/request-' . bin2hex(random_bytes(16)); if (!mkdir($scratch, 0700)) throw new RuntimeException('Tijdelijke verwerking niet beschikbaar.', 503);
    $path = $scratch . '/original'; if (!move_uploaded_file($file['tmp_name'], $path)) throw new RuntimeException('Bestand niet ontvangen.', 503); chmod($path, 0600);
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path); $safe = dw_document_sanitize($path, $mime, $scratch);
    $name = preg_replace('/[\x00-\x1f\x7f]/', '', basename(str_replace('\\', '/', (string) ($file['name'] ?? 'jaarafrekening.pdf'))));
    $result = dw_document_backend($config, $auth, ['op' => 'upload', 'lead_id' => $lead, 'visit_id' => $visit, 'token' => $token, 'consent' => true, 'pdf_base64' => base64_encode($safe), 'original_filename' => substr((string) preg_replace('/[^\x20-\x7e]/', '_', $name), 0, 180)], true);
    if (empty($result['document_id'])) throw new RuntimeException('Documentontvangst niet bevestigd.', 502);
    $out = ['ok' => true, 'document_id' => $result['document_id'], 'duplicate' => (bool) ($result['duplicate'] ?? false)]; $status = 200;
} catch (Throwable $e) {
    $status = in_array($e->getCode(), [400,401,403,405,409,413,502,503], true) ? $e->getCode() : 503;
    $out = ['error' => $e instanceof RuntimeException ? $e->getMessage() : 'Documentverwerker tijdelijk niet beschikbaar.'];
} finally {
    if ($scratch !== null && is_dir($scratch)) { foreach (scandir($scratch) ?: [] as $name) if ($name !== '.' && $name !== '..' && is_file($scratch . '/' . $name)) @unlink($scratch . '/' . $name); @rmdir($scratch); }
    umask($oldMask);
}
dw_document_json($out, $status);
