const SUPABASE_URL = 'https://dfkxlugytntvmrhjdmfg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO';

const supabase = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
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

generateQuestionBlocks();

async function login() {
    if (!supabase) {
        alert('No hay conexión con Supabase disponible.');
        return;
    }

    const user = document.getElementById('username')?.value.trim() ?? '';
    const pass = document.getElementById('password')?.value.trim() ?? '';

    if (!user || !pass) {
        alert('Completa usuario y contraseña');
        return;
    }

    const { data, error } = await supabase
        .from('creators')
        .select('*')
        .eq('username', user)
        .eq('password', pass);

    if (error) {
        console.error(error);
        alert('Error al iniciar sesión: ' + error.message);
        return;
    }

    if (!data || data.length === 0) {
        alert('Credenciales incorrectas');
        return;
    }

    currentUsername = data[0].username;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('welcome-msg').innerText = `Hola, ${currentUsername}`;
    await loadStats();
}

document.getElementById('quiz-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!supabase) {
        alert('No hay conexión con Supabase disponible.');
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

    const { data, error } = await supabase
        .from('quizzes')
        .insert([{ creator_username: currentUsername, title, questions }])
        .select();

    if (error || !data || data.length === 0) {
        console.error(error);
        alert('Error al guardar el cuestionario.');
        return;
    }

    const quizLink = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, '')}quiz.html?id=${data[0].id}`;
    const linkDiv = document.getElementById('link-container');
    if (linkDiv) {
        linkDiv.style.display = 'block';
        linkDiv.innerHTML = `<strong>Enlace directo (cópialo):</strong><br><a href="${quizLink}" target="_blank" rel="noopener noreferrer">${quizLink}</a>`;
    }

    document.getElementById('quiz-form')?.reset();
    generateQuestionBlocks();
    await loadStats();
});

async function loadStats() {
    if (!supabase || !currentUsername) return;

    const { data, error } = await supabase
        .from('results')
        .select('*, quizzes(title)')
        .eq('creator_username', currentUsername)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const list = document.getElementById('stats-list');
    if (!list) return;
    list.innerHTML = '';

    if (!data || data.length === 0) {
        list.innerHTML = '<p>No hay resultados aún.</p>';
        return;
    }

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
}

window.login = login;
