-- Crear tabla de creadores
CREATE TABLE creators (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL
);

-- Crear tabla de cuestionarios (hasta 4 opciones por pregunta)
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_username TEXT REFERENCES creators(username),
  title TEXT NOT NULL,
  questions JSONB NOT NULL
);

-- Crear tabla de resultados con detalles de tiempo y respuestas
CREATE TABLE results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id),
  creator_username TEXT REFERENCES creators(username),
  name TEXT NOT NULL,
  account TEXT NOT NULL,
  score INT NOT NULL,
  total_time INT NOT NULL,
  answers_detail JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Quitar restricciones para funcionamiento simple desde GitHub Pages
ALTER TABLE creators DISABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
