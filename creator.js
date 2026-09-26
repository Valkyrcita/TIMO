const supabase = window.supabase.createClient(
    'https://dfkxlugytntvmrhjdmfg.supabase.co',
    'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO'
);

let currentUserId = null;
let currentUsername = null;

async function login() {
    const user = document.getElementById('username')?.value.trim();
    const pass = document.getElementById('password')?.value.trim();

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
        alert('Error al iniciar sesión');
        return;
    }

    if (!data || data.length === 0) {
        alert('Usuario o contraseña incorrectos');
        return;
    }

    currentUsername = data[0].username;
    const authSection = document.getElementById('auth-section');
    const dashboard = document.getElementById('dashboard');
    const welcomeMsg = document.getElementById('welcome-msg');

    if (authSection) authSection.style.display = 'none';
    if (dashboard) dashboard.style.display = 'block';
    if (welcomeMsg) welcomeMsg.innerText = `Hola, ${currentUsername}`;

    loadStats();
}

const quizForm = document.getElementById('quiz-form');
if (quizForm) {
    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const questions = [];
        const blocks = document.querySelectorAll('.question-block');

        blocks.forEach((block) => {
            const questionText = block.querySelector('.q-text')?.value.trim();
            const optionOne = block.querySelector('.q-opt1')?.value.trim();
            const optionTwo = block.querySelector('.q-opt2')?.value.trim();
            const correctIndex = Number(block.querySelector('.q-correct')?.value ?? 0);

            if (!questionText || !optionOne || !optionTwo) return;

            questions.push({
                pregunta: questionText,
                opciones: [optionOne, optionTwo],
                correcta: correctIndex
            });
        });

        if (questions.length === 0) {
            alert('Debes completar al menos una pregunta');
            return;
        }

        const title = document.getElementById('quiz-title')?.value.trim();
        if (!title) {
            alert('Ingresa un título para el cuestionario');
            return;
        }

        const { data, error } = await supabase
            .from('quizzes')
            .insert([{ 
                creator_username: currentUsername, 
                title, 
                questions,
                total_questions: questions.length
            }])
            .select();

        if (error) {
            console.error(error);
            alert('Error al guardar el cuestionario');
            return;
        }

        if (!data || data.length === 0) {
            alert('Error al obtener el ID del cuestionario');
            return;
        }

        const quizUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname.replace(/index\.html$/i, '')}quizz.html?id=${data[0].id}`;
        const linkContainer = document.getElementById('link-container');

        if (linkContainer) {
            linkContainer.innerHTML = `Enlace para compartir: <a href="${quizUrl}" target="_blank" rel="noopener noreferrer">${quizUrl}</a>`;
        }

        // Limpiar formulario
        quizForm.reset();
        
        // Recargar estadísticas
        loadStats();
    });
}

async function loadStats() {
    if (!currentUsername) return;

    const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('creator_username', currentUsername);

    if (error) {
        console.error(error);
        return;
    }

    const list = document.getElementById('stats-list');
    if (!list) return;

    list.innerHTML = '';
    
    if (!data || data.length === 0) {
        list.innerHTML = '<li>No hay resultados aún</li>';
        return;
    }
    
    data.forEach((result) => {
        const totalQuestions = result.total_questions || '?';
        list.innerHTML += `<li>Cuenta ${result.account} (${result.name}) - Nota: ${result.score}/${totalQuestions}</li>`;
    });
}
