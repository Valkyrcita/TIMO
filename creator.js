const SUPABASE_URL = 'https://dfkxlugytntvmrhjdmfg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let currentUsername = null;

// Generar campos para 5 preguntas automáticamente
const qContainer = document.getElementById('questions-container');
for(let i=1; i<=5; i++) {
    qContainer.innerHTML += `
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
    </div>`;
}

async function login() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    
    const { data } = await supabase.from('creators').select('*').eq('username', user).eq('password', pass);
    
    if (data && data.length > 0) {
        currentUsername = data[0].username;
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('welcome-msg').innerText = `Hola, ${currentUsername}`;
        loadStats();
    } else {
        alert("Credenciales incorrectas");
    }
}

document.getElementById('quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const questions = [];
    const blocks = document.querySelectorAll('.question-block');
    
    blocks.forEach(block => {
        // Filtrar opciones vacías si solo pusieron 2 o 3 opciones
        let opciones = [
            block.querySelector('.q-opt0').value, block.querySelector('.q-opt1').value,
            block.querySelector('.q-opt2').value, block.querySelector('.q-opt3').value
        ].filter(opt => opt.trim() !== "");

        questions.push({
            pregunta: block.querySelector('.q-text').value,
            opciones: opciones,
            correcta: parseInt(block.querySelector('.q-correct').value)
        });
    });

    const title = document.getElementById('quiz-title').value;
    const { data, error } = await supabase.from('quizzes').insert([{ creator_username: currentUsername, title: title, questions: questions }]).select();

    if (error) return alert("Error al guardar");

    const link = `${window.location.origin}${window.location.pathname.replace('index.html','')}quiz.html?id=${data[0].id}`;
    const linkDiv = document.getElementById('link-container');
    linkDiv.style.display = 'block';
    linkDiv.innerHTML = `<strong>Enlace directo (cópialo):</strong><br><a href="${link}" target="_blank">${link}</a>`;
});

async function loadStats() {
    const { data } = await supabase.from('results').select('*, quizzes(title)').eq('creator_username', currentUsername).order('created_at', { ascending: false });
    const list = document.getElementById('stats-list');
    list.innerHTML = '';
    
    if (!data || data.length === 0) return list.innerHTML = '<p>No hay resultados aún.</p>';

    data.forEach((res) => {
        let detailsHtml = res.answers_detail.map((ans, idx) => `
            <div>P${idx+1}: <span class="${ans.isCorrect ? 'correct-text' : 'wrong-text'}">
            ${ans.isCorrect ? 'Correcta' : `Incorrecta (Marcó: ${ans.selectedText \vert{}\vert{} 'Nada'} \vert{} Era:${ans.correctText})`}
            </span> [${ans.timeTaken}s]</div>
        `).join('');

        list.innerHTML += `
        <div class="stat-item">
            <strong>Quiz:</strong> ${res.quizzes.title}<br>
            <strong>Participante:</strong> ${res.name} (Cuenta: ${res.account})<br>
            <strong>Nota:</strong> ${res.score} / 5 | <strong>Tiempo Total:</strong> ${res.total_time}s
            <div class="stat-details">${detailsHtml}</div>
        </div>`;
    });
}
window.login = login;
window.ensureSupabaseClient = ensureSupabaseClient;
