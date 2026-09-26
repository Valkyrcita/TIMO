const SUPABASE_URL = 'https://dfkxlugytntvmrhjdmfg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO';

function ensureSupabaseClient() {
    if (window.supabase) {
        return window.supabase;
    }

    if (typeof supabase === 'undefined') {
        const message = 'Supabase SDK no está cargado. Revisa que el CDN esté incluido antes de creator.js.';
        console.error(message);
        throw new Error(message);
    }

    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return window.supabase;
}

let currentUserId = null;
let currentUsername = null;

async function login() {
    try {
        const client = ensureSupabaseClient();
        const user = document.getElementById('username')?.value.trim() ?? '';
        const pass = document.getElementById('password')?.value ?? '';

        if (!user || !pass || user.length > 100) {
            alert('Completa usuario y contraseña');
            return;
        }

        const { data, error } = await client
            .from('creators')
            .select('id, username')
            .eq('username', user)
            .eq('password', pass)
            .limit(1);

        if (error) {
            console.error('Error al consultar creators:', error);
            alert('Error al iniciar sesión: ' + (error.message || 'Consulta inválida'));
            return;
        }

        if (!data || !data.length) {
            alert('Usuario o contraseña incorrectos');
            return;
        }

        currentUserId = data[0].id ?? null;
        currentUsername = data[0].username;

        const authSection = document.getElementById('auth-section');
        const dashboard = document.getElementById('dashboard');
        const welcomeMsg = document.getElementById('welcome-msg');

        if (authSection) authSection.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        if (welcomeMsg) welcomeMsg.textContent = `Hola, ${currentUsername}`;

        await loadStats();
    } catch (error) {
        console.error('Login failed:', error);
        alert(error?.message || 'No se pudo iniciar sesión');
    }
}

const quizForm = document.getElementById('quiz-form');
if (quizForm) {
    quizForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!currentUsername) {
            alert('Debes iniciar sesión antes de crear un cuestionario');
            return;
        }

        const questions = [];
        let invalidBlock = false;

        document.querySelectorAll('.question-block').forEach((block) => {
            const questionText = block.querySelector('.q-text')?.value.trim() ?? '';
            const optionOne = block.querySelector('.q-opt1')?.value.trim() ?? '';
            const optionTwo = block.querySelector('.q-opt2')?.value.trim() ?? '';
            const correctValue = block.querySelector('.q-correct')?.value;
            const correctIndex = Number(correctValue);
            const empty = !questionText && !optionOne && !optionTwo;

            if (empty) return;
            if (!questionText || !optionOne || !optionTwo ||
                questionText.length > 500 || optionOne.length > 300 ||
                optionTwo.length > 300 || ![0, 1].includes(correctIndex)) {
                invalidBlock = true;
                return;
            }

            questions.push({
                pregunta: questionText,
                opciones: [optionOne, optionTwo],
                correcta: correctIndex
            });
        });

        if (invalidBlock) {
            alert('Completa correctamente cada pregunta iniciada.');
            return;
        }

        if (!questions.length) {
            alert('Debes completar al menos una pregunta');
            return;
        }

        const title = document.getElementById('quiz-title')?.value.trim() ?? '';
        if (!title || title.length > 200) {
            alert('Ingresa un título válido (máximo 200 caracteres)');
            return;
        }

        try {
            const client = ensureSupabaseClient();

            const { data, error } = await client
                .from('quizzes')
                .insert([{ creator_username: currentUsername, title, questions, total_questions: questions.length }])
                .select('id')
                .single();

            if (error || !data?.id) {
                console.error('Error al guardar quiz:', error);
                alert('Error al guardar el cuestionario');
                return;
            }

            const quizUrl = new URL('quizz.html', window.location.href);
            quizUrl.searchParams.set('id', data.id);

            const linkContainer = document.getElementById('link-container');
            if (linkContainer) {
                linkContainer.replaceChildren(document.createTextNode('Enlace para compartir: '));
                const link = document.createElement('a');
                link.href = quizUrl.href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = quizUrl.href;
                linkContainer.appendChild(link);
            }

            quizForm.reset();
            await loadStats();
        } catch (error) {
            console.error('Error creando cuestionario:', error);
            alert(error?.message || 'No se pudo crear el cuestionario');
        }
    });
}

async function loadStats() {
    if (!currentUsername) return;

    try {
        const client = ensureSupabaseClient();

        const { data, error } = await client
            .from('results')
            .select('account, name, score, total_questions')
            .eq('creator_username', currentUsername);

        if (error) {
            console.error('Error cargando estadísticas:', error);
            return;
        }

        const list = document.getElementById('stats-list');
        if (!list) return;
        list.replaceChildren();

        if (!data?.length) {
            list.appendChild(document.createElement('li')).textContent = 'No hay resultados aún';
            return;
        }

        data.forEach((result) => {
            const item = document.createElement('li');
            item.textContent = `Cuenta ${result.account ?? ''} (${result.name ?? ''}) - Nota: ${result.score ?? 0}/${result.total_questions ?? '?'}`;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Error en loadStats:', error);
    }
}

window.login = login;
window.ensureSupabaseClient = ensureSupabaseClient;
