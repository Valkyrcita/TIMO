// Usar la instancia global de Supabase que ya está cargada.
const SUPABASE_URL = 'https://dfkxlugytntvmrhjdmfg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO';

if (!window.supabase) {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

let currentUserId = null;
let currentUsername = null;

async function login() {
    const user = document.getElementById('username')?.value.trim() ?? '';
    const pass = document.getElementById('password')?.value ?? '';

    if (!user || !pass || user.length > 100) {
        alert('Completa usuario y contraseña');
        return;
    }

    const { data, error } = await window.supabase
        .from('creators')
        .select('id, username')
        .eq('username', user)
        .eq('password', pass);

    if (error) {
        console.error(error);
        alert('Error al iniciar sesión');
        return;
    }

    if (!data?.length) {
        alert('Usuario o contraseña incorrectos');
        return;
    }

    currentUserId = data[0].id ?? null;
    currentUsername = data[0].username;
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('welcome-msg').textContent = `Hola, ${currentUsername}`;
    await loadStats();
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

        const { data, error } = await window.supabase
            .from('quizzes')
            .insert([{ creator_username: currentUsername, title, questions, total_questions: questions.length }])
            .select('id')
            .single();

        if (error || !data?.id) {
            console.error(error);
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
    });
}

async function loadStats() {
    if (!currentUsername) return;

    const { data, error } = await window.supabase
        .from('results')
        .select('account, name, score, total_questions')
        .eq('creator_username', currentUsername);

    if (error) {
        console.error(error);
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
}

window.login = login;
