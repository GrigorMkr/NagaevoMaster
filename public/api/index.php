<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');

$upstream = getenv('NAGAEVOMASTER_API_UPSTREAM') ?: 'https://api.nagaevomaster.ru/api';
$requestUri = $_SERVER['REQUEST_URI'] ?? '/api';
$path = parse_url($requestUri, PHP_URL_PATH) ?? '/api';
$query = parse_url($requestUri, PHP_URL_QUERY);

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
$forwardHeaders = [];

$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? null;
if (is_string($contentType) && $contentType !== '') {
    $forwardHeaders[] = 'Content-Type: ' . $contentType;
}

if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
    $forwardHeaders[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
}

if (!empty($_SERVER['HTTP_COOKIE'])) {
    $forwardHeaders[] = 'Cookie: ' . $_SERVER['HTTP_COOKIE'];
}

$body = in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)
    ? file_get_contents('php://input')
    : null;

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_HTTPHEADER => $forwardHeaders,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_FOLLOWLOCATION => false,
]);

if (is_string($body) && $body !== '') {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

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
    if (stripos($headerLine, 'Content-Length:') === 0) {
        continue;
    }
    header($headerLine, false);
}

echo $responseBody;
