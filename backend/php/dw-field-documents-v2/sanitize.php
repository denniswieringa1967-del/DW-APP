<?php
declare(strict_types=1);
// Only newly rendered JPEG pixels are embedded. No original PDF objects are copied.
function dw_document_pdf(array $pages): string {
    if (count($pages) < 1 || count($pages) > 20) throw new RuntimeException('Kies een document met 1 tot 20 pagina’s.', 400);
    $objects = [1 => '<< /Type /Catalog /Pages 2 0 R >>']; $kids = []; $next = 3;
    foreach ($pages as $page) {
        [$jpeg, $width, $height] = $page; $pageId = $next++; $imageId = $next++; $streamId = $next++; $kids[] = $pageId . ' 0 R';
        $w = sprintf('%.3F', $width * 0.75); $h = sprintf('%.3F', $height * 0.75);
        $stream = "q\n$w 0 0 $h 0 0 cm\n/Im0 Do\nQ\n";
        $objects[$pageId] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 $w $h] /Resources << /XObject << /Im0 $imageId 0 R >> >> /Contents $streamId 0 R >>";
        $objects[$imageId] = '<< /Type /XObject /Subtype /Image /Width ' . $width . ' /Height ' . $height . ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' . strlen($jpeg) . ">>\nstream\n" . $jpeg . "\nendstream";
        $objects[$streamId] = '<< /Length ' . strlen($stream) . ">>\nstream\n" . $stream . 'endstream';
    }
    $objects[2] = '<< /Type /Pages /Count ' . count($kids) . ' /Kids [' . implode(' ', $kids) . '] >>'; ksort($objects);
    $pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"; $offsets = [0];
    foreach ($objects as $id => $object) { $offsets[$id] = strlen($pdf); $pdf .= "$id 0 obj\n$object\nendobj\n"; }
    $xref = strlen($pdf); $count = count($objects) + 1; $pdf .= "xref\n0 $count\n0000000000 65535 f \n";
    for ($i = 1; $i < $count; $i++) $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
    $pdf .= "trailer\n<< /Size $count /Root 1 0 R >>\nstartxref\n$xref\n%%EOF\n";
    if (strlen($pdf) > DW_DOCUMENT_MAX_BYTES) throw new RuntimeException('Document is na verwerking groter dan 8 MB.', 400);
    return $pdf;
}
function dw_document_sanitize(string $path, string $mime, string $scratch): string {
    if (!class_exists('Imagick') || !class_exists('finfo')) throw new RuntimeException('Documentverwerker niet beschikbaar.', 503);
    $allowed = ['application/pdf' => 'pdf', 'image/png' => 'png', 'image/jpeg' => 'jpeg'];
    if (!isset($allowed[$mime]) || (new finfo(FILEINFO_MIME_TYPE))->file($path) !== $mime) throw new RuntimeException('Kies een geldige PDF, JPG of PNG.', 400);
    $size = filesize($path); if (!$size || $size > DW_DOCUMENT_MAX_BYTES) throw new RuntimeException('Kies een bestand van maximaal 8 MB.', 400);
    if ($mime !== 'application/pdf') { $info = @getimagesize($path); if (!$info || $info[0] < 1 || $info[1] < 1 || $info[0] * $info[1] > 20000000) throw new RuntimeException('Afbeelding te groot of ongeldig.', 400); }
    @set_time_limit(30);
    $oldLimits = [];
    foreach (['MEMORY' => 67108864, 'MAP' => 134217728, 'DISK' => 67108864, 'THREAD' => 1, 'TIME' => 20, 'WIDTH' => 5000, 'HEIGHT' => 5000, 'LISTLENGTH' => 21] as $resource => $limit) {
        $name = 'Imagick::RESOURCETYPE_' . $resource; if (defined($name)) { $type = constant($name); $oldLimits[$type] = Imagick::getResourceLimit($type); Imagick::setResourceLimit($type, min($limit, $oldLimits[$type] > 0 ? $oldLimits[$type] : $limit)); }
    }
    $oldRegistry = null;
    if (method_exists('Imagick', 'getRegistry')) { try { $oldRegistry = Imagick::getRegistry('temporary-path'); } catch (Throwable $e) {} }
    if (method_exists('Imagick', 'setRegistry')) Imagick::setRegistry('temporary-path', $scratch);
    $images = new Imagick(); $pages = []; $bytes = 0; $pixels = 0;
    try {
        $images->setResolution(96, 96);
        $images->readImage($allowed[$mime] . ':' . $path . ($mime === 'application/pdf' ? '[0-20]' : '[0]'));
        if ($images->getNumberImages() < 1 || $images->getNumberImages() > 20) throw new RuntimeException('PDF mag maximaal 20 pagina’s bevatten.', 400);
        foreach ($images as $page) {
            if ($mime !== 'application/pdf') $page->thumbnailImage(2400, 3400, true, true);
            $width = $page->getImageWidth(); $height = $page->getImageHeight();
            $pixels += $width * $height;
            if ($width < 1 || $height < 1 || $width > 2700 || $height > 3800 || $pixels > 60000000) throw new RuntimeException('Documentpagina te groot.', 400);
            $page->transformImageColorspace(Imagick::COLORSPACE_SRGB);
            $flat = new Imagick(); $flat->newImage($width, $height, new ImagickPixel('white')); $flat->setImageColorspace(Imagick::COLORSPACE_SRGB);
            $flat->compositeImage($page, Imagick::COMPOSITE_OVER, 0, 0); $flat->stripImage(); $flat->setImageType(Imagick::IMGTYPE_TRUECOLOR);
            $flat->setImageFormat('JPEG'); $flat->setImageCompressionQuality(80); $jpeg = $flat->getImageBlob(); $flat->clear();
            $bytes += strlen($jpeg); if ($bytes > DW_DOCUMENT_MAX_BYTES) throw new RuntimeException('Document is na verwerking te groot.', 400);
            $pages[] = [$jpeg, $width, $height];
        }
        return dw_document_pdf($pages);
    } catch (ImagickException $e) { throw new RuntimeException('Dit document kan niet worden verwerkt. Kies een onbeschermde PDF, JPG of PNG.', 400); }
    finally { $images->clear(); if (method_exists('Imagick', 'setRegistry') && is_string($oldRegistry) && $oldRegistry !== '') Imagick::setRegistry('temporary-path', $oldRegistry); elseif (method_exists('Imagick', 'deleteRegistry')) Imagick::deleteRegistry('temporary-path'); foreach ($oldLimits as $type => $limit) Imagick::setResourceLimit($type, $limit); }
}
