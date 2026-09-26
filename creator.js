// Inicializar Supabase
const supabase = supabase.createClient('https://dfkxlugytntvmrhjdmfg.supabase.co', 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO');
let currentUserId = null;

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        alert("Error de acceso: " + error.message);
    } else {
        currentUserId = data.user.id;
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadStats();
    }
}

document.getElementById('quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const questions = [];
    const blocks = document.querySelectorAll('.question-block');
    
    blocks.forEach(block => {
        questions.push({
            pregunta: block.querySelector('.q-text').value,
            opciones: [block.querySelector('.q-opt1').value, block.querySelector('.q-opt2').value],
            correcta: parseInt(block.querySelector('.q-correct').value)
        });
    });

    const title = document.getElementById('quiz-title').value;

    const { data, error } = await supabase
        .from('quizzes')
        .insert([{ creator_id: currentUserId, title: title, questions: questions }])
        .select();

    if (error) return alert("Error al guardar");

    // Genera el enlace basado en la URL actual de GitHub Pages
    const link = `${window.location.origin}${window.location.pathname.replace('index.html','')}quiz.html?id=${data[0].id}`;
    document.getElementById('link-container').innerHTML = `Enlace para compartir: <a href="${link}" target="_blank">${link}</a>`;
});

async function loadStats() {
    const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('creator_id', currentUserId);

    if (error) return;

    const list = document.getElementById('stats-list');
    list.innerHTML = '';
    data.forEach((result) => {
        list.innerHTML += `<li>Cuenta ${result.account} (${result.name}) - Nota: ${result.score}/5</li>`;
    });
}
