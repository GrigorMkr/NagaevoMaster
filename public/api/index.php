<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');

$upstream = getenv('NAGAEVOMASTER_API_UPSTREAM') ?: 'https://api.nagaevomaster.ru/api';
$requestUri = $_SERVER['REQUEST_URI'] ?? '/api';
$path = parse_url($requestUri, PHP_URL_PATH) ?? '/api';
$query = parse_url($requestUri, PHP_URL_QUERY);

function readAuthorizationHeader(): ?string
{
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return (string) $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp((string) $name, 'Authorization') === 0 && is_string($value) && $value !== '') {
                return $value;
            }
        }
    }
    return null;
}

if (!str_starts_with($path, '/api')) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Not found']);
    exit;
}

$targetPath = substr($path, 4);
if ($targetPath === '' || $targetPath === false) {
    $targetPath = '/';
}

$url = $upstream . $targetPath;
if (is_string($query) && $query !== '') {
    $url .= '?' . $query;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
$isMultipart = stripos($contentType, 'multipart/form-data') !== false;

$forwardHeaders = [];

if (!$isMultipart && is_string($contentType) && $contentType !== '') {
    $forwardHeaders[] = 'Content-Type: ' . $contentType;
}

$authorization = readAuthorizationHeader();
if ($authorization !== null) {
    $forwardHeaders[] = 'Authorization: ' . $authorization;
}

if (!empty($_SERVER['HTTP_COOKIE'])) {
    $forwardHeaders[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
}

$ch = curl_init($url);
$curlOptions = [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_HTTPHEADER => $forwardHeaders,
    CURLOPT_TIMEOUT => 300,
    CURLOPT_FOLLOWLOCATION => false,
];

if ($isMultipart && !empty($_FILES)) {
    $postFields = [];
    foreach ($_POST as $key => $value) {
        $postFields[$key] = $value;
    }
    foreach ($_FILES as $key => $file) {
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            continue;
        }
        $postFields[$key] = new CURLFile(
            $file['tmp_name'],
            $file['type'] ?: 'application/octet-stream',
            $file['name'] ?: 'upload',
        );
    }
    $curlOptions[CURLOPT_POSTFIELDS] = $postFields;
} elseif (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $body = file_get_contents('php://input');
    if (is_string($body) && $body !== '') {
        $curlOptions[CURLOPT_POSTFIELDS] = $body;
    }
}

curl_setopt_array($ch, $curlOptions);

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'API gateway error']);
    exit;
}

$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

http_response_code($status);

foreach (explode("\r\n", $rawHeaders) as $headerLine) {
    if ($headerLine === '' || stripos($headerLine, 'HTTP/') === 0) {
        continue;
    }
    if (stripos($headerLine, 'Transfer-Encoding:') === 0) {
        continue;
    }
    if (stripos($headerLine, 'Access-Control-') === 0) {
        continue;
    }
    if (stripos($headerLine, 'Content-Length:') === 0) {
        continue;
    }
    header($headerLine, false);
}

echo $responseBody;
