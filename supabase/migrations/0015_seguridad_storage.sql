-- Ejecuta este script en Supabase: panel del proyecto > SQL Editor > New query > pegar y ejecutar.
-- Endurece el bucket de fotos: solo imágenes reales (no SVG, que puede llevar código
-- incrustado) y un límite de tamaño por archivo.

update storage.buckets
set file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'inmuebles';
