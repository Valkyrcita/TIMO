# 📚 Guía de Configuración - TIMO

## ⚠️ PROBLEMA CRÍTICO ENCONTRADO Y SOLUCIONADO

El motivo por el que **no pasabas de la pantalla de creador** era que **la tabla `creators` en Supabase no existía** o estaba vacía sin usuarios registrados.

---

## 🔧 PASO 1: Configurar las tablas en Supabase

### Ir a tu proyecto en Supabase:
1. Accede a [supabase.com](https://supabase.com)
2. Ve al proyecto TIMO
3. Ve a la sección **SQL Editor**
4. Copia y ejecuta el siguiente SQL:

```sql
-- Tabla para creadores
CREATE TABLE creators (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para cuestionarios
CREATE TABLE quizzes (
  id BIGSERIAL PRIMARY KEY,
  creator_username TEXT NOT NULL,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (creator_username) REFERENCES creators(username)
);

-- Tabla para resultados
CREATE TABLE results (
  id BIGSERIAL PRIMARY KEY,
  quiz_id BIGINT NOT NULL,
  creator_username TEXT NOT NULL,
  name TEXT NOT NULL,
  account TEXT NOT NULL,
  score INT NOT NULL,
  total_time INT NOT NULL,
  answers_detail JSONB NOT NULL,
  total_questions INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
  FOREIGN KEY (creator_username) REFERENCES creators(username)
);

-- Índices para mejorar performance
CREATE INDEX idx_results_creator ON results(creator_username);
CREATE INDEX idx_results_quiz ON results(quiz_id);
CREATE INDEX idx_quizzes_creator ON quizzes(creator_username);
```

---

## 👤 PASO 2: Crear un usuario creador

Ejecuta en el **SQL Editor** de Supabase:

```sql
-- Insertar un usuario de prueba
INSERT INTO creators (username, password) 
VALUES ('admin', 'admin123');

-- O si quieres otro usuario
INSERT INTO creators (username, password) 
VALUES ('creador1', 'micontraseña');
```

**Ahora podrás usar:**
- **Usuario:** admin
- **Contraseña:** admin123

---

## 🛡️ PASO 3: Configurar Row Level Security (RLS)

En la sección **Authentication > Policies** en Supabase, habilita RLS para mayor seguridad:

### Para tabla `creators`:
```sql
CREATE POLICY "Allow public select on creators"
ON creators FOR SELECT TO anon, authenticated
USING (true);
```

### Para tabla `quizzes`:
```sql
CREATE POLICY "Allow public select on quizzes"
ON quizzes FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow insert on quizzes"
ON quizzes FOR INSERT TO anon, authenticated
WITH CHECK (true);
```

### Para tabla `results`:
```sql
CREATE POLICY "Allow public select on results"
ON results FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Allow insert on results"
ON results FOR INSERT TO anon, authenticated
WITH CHECK (true);
```

---

## 🚀 PASO 4: Probar la aplicación

1. **Abre** `index.html` en tu navegador
2. **Ingresa:**
   - Usuario: `admin`
   - Contraseña: `admin123`
3. **Deberías ver** el panel de creador ✅

---

## 📋 CAMBIOS REALIZADOS EN EL CÓDIGO

### ✅ **creator.js**
- ✓ Mejor validación de inicialización de Supabase
- ✓ Mensajes de error más claros (con instrucciones)
- ✓ Console.log para debugging
- ✓ Try-catch blocks en todas las operaciones Supabase

### ✅ **quiz.js**
- ✓ Mejor manejo de errores en la carga del quiz
- ✓ Validaciones más robustas
- ✓ Logs para debugging

---

## ❌ PROBLEMAS COMUNES Y SOLUCIONES

### "No hay conexión con Supabase"
- Recarga la página (la librería de Supabase CDN puede tardar en cargar)
- Verifica que tienes conexión a Internet
- Abre la consola (F12 → Console) y busca errores

### "Credenciales incorrectas" 
- Verifica que creaste usuarios en la tabla `creators`
- Usa el usuario `admin` con contraseña `admin123` para probar
- Revisa las mayúsculas/minúsculas

### "Tabla creators no encontrada"
- Ejecuta el SQL del PASO 1 para crear las tablas
- Asegúrate de estar ejecutando el SQL en el proyecto correcto

### El quiz se ve pero no guarda resultados
- Verifica que la tabla `results` existe (PASO 1)
- Abre la consola (F12) y busca errores de Supabase

---

## 🔗 URL de Supabase para tu proyecto
```
https://dfkxlugytntvmrhjdmfg.supabase.co
```

---

## 📝 NOTAS IMPORTANTES

⚠️ **SEGURIDAD:** Las contraseñas se guardan en texto plano en este código de ejemplo. Para producción, implementa:
- Hash de contraseñas (bcrypt)
- JWT tokens
- Autenticación segura de Supabase

---

¡**Debería funcionar ahora!** 🎉
