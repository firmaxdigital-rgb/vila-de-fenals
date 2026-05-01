CREATE TABLE public.reservations (
  reservation_code text PRIMARY KEY,
  platform text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (opcional pero recomendado)
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública o autenticada (necesario si usas la anon key desde Next.js)
CREATE POLICY "Permitir lectura de reservas"
ON public.reservations
FOR SELECT
TO public
USING (true);

-- Política para permitir que el Service Role modifique
CREATE POLICY "Permitir gestión total al admin"
ON public.reservations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
