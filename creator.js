let supabase = null;
let currentUsername = null;

function generateQuestionBlocks() {
    const qContainer = document.getElementById('questions-container');
    if (!qContainer) return;

    qContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        qContainer.insertAdjacentHTML('beforeend', `
            <div class="question-block">
                <h3>Pregunta ${i}</h3>
                <input type="text" class="q-text" placeholder="Enunciado de la pregunta" required>
                <input type="text" class="q-opt0" placeholder="Opción 1" required>
                <input type="text" class="q-opt1" placeholder="Opción 2" required>
                <input type="text" class="q-opt2" placeholder="Opción 3 (Opcional)">
                <input type="text" class="q-opt3" placeholder="Opción 4 (Opcional)">
                <select class="q-correct">
                    <option value="0">La respuesta correcta es la Opción 1</option>
                    <option value="1">La respuesta correcta es la Opción 2</option>
                    <option value="2">La respuesta correcta es la Opción 3</option>
                    <option value="3">La respuesta correcta es la Opción 4</option>
                </select>
            </div>
        `);
    }
}

async function initSupabase() {
    const SUPABASE_URL = 'https://dfkxlugytntvmrhjdmfg.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO';

    try {
        if (!window.supabase || !window.supabase.createClient) {
            console.error('❌ Supabase SDK no está cargado en window.supabase');
            console.log('window.supabase:', window.supabase);
            return false;
        }

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase client creado correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Supabase:', error);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOMContentLoaded - iniciando aplicación');
    generateQuestionBlocks();
    
    const ready = await initSupabase();
    if (!ready) {
        const authSection = document.getElementById('auth-section');
        if (authSection) {
            authSection.innerHTML = '<p style="color:red; font-size:16px;">❌ Error de conexión con Supabase.\n<br>Recarga la página o abre la consola (F12) para ver detalles.</p>';
        }
    } else {
        console.log('✅ Aplicación lista');
    }
});

async function login() {
    console.log('🔐 Iniciando login...');
    
    if (!supabase) {
        console.error('❌ Supabase no está inicializado');
        alert('Supabase no está inicializado. Recarga la página.');
        return;
    }

    const user = document.getElementById('username')?.value.trim() ?? '';
    const pass = document.getElementById('password')?.value.trim() ?? '';

    console.log('Usuario ingresado:', user);

    if (!user || !pass) {
        alert('Completa usuario y contraseña.');
        return;
    }

    try {
        console.log('📤 Enviando consulta a Supabase...');
        console.log('Buscando:', { username: user, password: pass });
        
        const { data, error } = await supabase
            .from('creators')
            .select('*')
            .eq('username', user)
            .eq('password', pass);

        console.log('📥 Respuesta de Supabase:');
        console.log('  data:', data);
        console.log('  error:', error);

        if (error) {
            console.error('❌ Error Supabase:', error);
            alert(`Error al consultar BD: ${error.message}\n\nRevisa:\n1. La tabla 'creators' existe\n2. RLS está deshabilitado o permite SELECT\n3. El usuario/contraseña existen`);
            return;
        }

        if (!data || data.length === 0) {
            console.warn('⚠️ No se encontraron usuarios con esas credenciales');
            alert('Credenciales incorrectas.\n\nDatos de prueba:\nUsuario: admin\nContraseña: admin123');
            return;
        }

        currentUsername = data[0].username;
        console.log('✅ Login exitoso. Usuario:', currentUsername);
        
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('welcome-msg').innerText = `Hola, ${currentUsername}`;
        await loadStats();
    } catch (error) {
        console.error('❌ Error inesperado en login:', error);
        alert('Error inesperado: ' + (error?.message || 'desconocido'));
    }
}

document.getElementById('quiz-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('📝 Creando nuevo quiz...');

    if (!supabase) {
        alert('Supabase no está disponible.');
        return;
    }

    if (!currentUsername) {
        alert('Debes iniciar sesión antes de crear un quiz.');
        return;
    }

    const title = document.getElementById('quiz-title')?.value.trim() ?? '';
    if (!title) {
        alert('Ingresa un título para el cuestionario.');
        return;
    }

    const questions = [];
    const blocks = document.querySelectorAll('.question-block');

    for (const block of blocks) {
        const questionText = block.querySelector('.q-text')?.value.trim() ?? '';
        const options = [
            block.querySelector('.q-opt0')?.value.trim() ?? '',
            block.querySelector('.q-opt1')?.value.trim() ?? '',
            block.querySelector('.q-opt2')?.value.trim() ?? '',
            block.querySelector('.q-opt3')?.value.trim() ?? ''
        ].filter((opt) => opt !== '');

        if (!questionText && options.length === 0) continue;

        if (!questionText || options.length < 2) {
            alert('Cada pregunta debe tener texto y al menos dos opciones válidas.');
            return;
        }

        const correctIndex = Number(block.querySelector('.q-correct')?.value ?? 0);
        if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
            alert('Selecciona una opción correcta válida para cada pregunta.');
            return;
        }

        questions.push({
            pregunta: questionText,
            opciones: options,
            correcta: correctIndex
        });
    }

    if (questions.length === 0) {
        alert('Debes completar al menos una pregunta.');
        return;
    }

    try {
        console.log('📤 Insertando quiz en Supabase...');
        const { data, error } = await supabase
            .from('quizzes')
            .insert([{ creator_username: currentUsername, title, questions }])
            .select();

        console.log('📥 Respuesta:', { data, error });

        if (error || !data || data.length === 0) {
            console.error('Error guardando quiz:', error);
            alert(`No se pudo guardar el cuestionario.\nError: ${error?.message || 'desconocido'}`);
            return;
        }

        console.log('✅ Quiz creado con ID:', data[0].id);
        const quizLink = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, '')}quiz.html?id=${data[0].id}`;
        const linkDiv = document.getElementById('link-container');
        if (linkDiv) {
            linkDiv.style.display = 'block';
            linkDiv.innerHTML = `<strong>✅ Enlace directo (cópialo):</strong><br><a href="${quizLink}" target="_blank" rel="noopener noreferrer">${quizLink}</a>`;
        }

        document.getElementById('quiz-form')?.reset();
        generateQuestionBlocks();
        await loadStats();
        alert('✅ Cuestionario creado exitosamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al crear cuestionario: ' + (error?.message || 'desconocido'));
    }
});

async function loadStats() {
    console.log('📊 Cargando estadísticas...');
    if (!supabase || !currentUsername) return;

    try {
        const { data, error } = await supabase
            .from('results')
            .select('*, quizzes(title)')
            .eq('creator_username', currentUsername)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error cargando estadísticas:', error);
            return;
        }

        const list = document.getElementById('stats-list');
        if (!list) return;
        list.innerHTML = '';

        if (!data || data.length === 0) {
            list.innerHTML = '<p>No hay resultados aún.</p>';
            return;
        }

        console.log(`✅ ${data.length} resultados cargados`);

        data.forEach((res) => {
            const details = Array.isArray(res.answers_detail) ? res.answers_detail : [];
            const detailsHtml = details.map((ans, idx) => {
                const selectedText = ans && ans.selectedText ? ans.selectedText : 'Nada';
                const correctText = ans && ans.correctText ? ans.correctText : 'N/A';
                const statusClass = ans && ans.isCorrect ? 'correct-text' : 'wrong-text';
                const statusText = ans && ans.isCorrect ? 'Correcta' : `Incorrecta (Marcó: ${selectedText} | Era: ${correctText})`;
                return `<div>P${idx + 1}: <span class="${statusClass}">${statusText}</span> [${ans?.timeTaken ?? 0}s]</div>`;
            }).join('');

            const quizTitle = res.quizzes && res.quizzes.title ? res.quizzes.title : 'Quiz';

            list.innerHTML += `
                <div class="stat-item">
                    <strong>Quiz:</strong> ${quizTitle}<br>
                    <strong>Participante:</strong> ${res.name ?? ''} (Cuenta: ${res.account ?? ''})<br>
                    <strong>Nota:</strong> ${res.score ?? 0} / ${res.total_questions ?? 5} | <strong>Tiempo Total:</strong> ${res.total_time ?? 0}s
                    <div class="stat-details">${detailsHtml || '<span>No hay detalle disponible.</span>'}</div>
                </div>
            `;
        });
    } catch (error) {
        console.error('Error en loadStats:', error);
    }
}

window.login = login;
window.loadStats = loadStats;
