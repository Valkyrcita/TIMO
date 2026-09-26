if (!window.supabase) {
    throw new Error('Supabase no está cargado. Debe inicializarse antes de cargar quiz.js.');
}

const supabase = window.supabase;

const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');

let quizData = null;
let currentQuestionIndex = 0;
let score = 0;
let timer;
let pName = '';
let pAccount = '';

async function startQuiz() {
    pName = document.getElementById('p-name')?.value.trim() ?? '';
    pAccount = document.getElementById('p-account')?.value.trim() ?? '';

    if (!pName || !pAccount || pAccount.length > 3 || !/^\d+$/.test(pAccount)) {
        alert('Datos inválidos. El nombre es obligatorio y la cuenta debe tener 1 a 3 dígitos.');
        return;
    }

    if (!quizId) {
        alert('Falta el identificador del cuestionario.');
        return;
    }

    const { data: existing, error: existingError } = await supabase
        .from('results')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('account', pAccount);

    if (existingError) {
        console.error(existingError);
        alert('No se pudo validar intentos previos.');
        return;
    }

    if (existing && existing.length > 0) {
        alert('Esta cuenta ya resolvió el cuestionario.');
        return;
    }

    const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

    if (error || !quiz) {
        console.error(error);
        alert('Cuestionario no encontrado');
        return;
    }

    if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        alert('El cuestionario no tiene preguntas.');
        return;
    }

    quizData = quiz;
    currentQuestionIndex = 0;
    score = 0;

    const registration = document.getElementById('registration');
    const quizContainer = document.getElementById('quiz-container');
    const quizTitle = document.getElementById('quiz-title');

    if (registration) registration.style.display = 'none';
    if (quizContainer) quizContainer.style.display = 'block';
    if (quizTitle) quizTitle.innerText = quiz.title;

    showQuestion();
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>\"']/g, (m) => map[m]);
}

function showQuestion() {
    if (!quizData || !Array.isArray(quizData.questions) || currentQuestionIndex >= quizData.questions.length) {
        finishQuiz();
        return;
    }

    const q = quizData.questions[currentQuestionIndex];

    if (!q || !q.pregunta || !Array.isArray(q.opciones)) {
        console.error('Pregunta inválida:', q);
        finishQuiz();
        return;
    }

    const questionText = document.getElementById('question-text');
    if (questionText) {
        questionText.innerText = q.pregunta;
        questionText.textContent = q.pregunta;
    }

    const optionsContainer = document.getElementById('options');
    if (!optionsContainer) return;
    optionsContainer.innerHTML = '';

    q.opciones.forEach((opt, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = opt;
        button.onclick = () => answerQuestion(index);
        button.style.margin = '0.5rem 0';
        button.style.padding = '0.75rem';
        button.style.width = '100%';
        optionsContainer.appendChild(button);
    });

    const feedback = document.getElementById('feedback');
    if (feedback) {
        feedback.innerText = '';
        feedback.textContent = '';
        feedback.style.color = '';
    }

    let timeLeft = 45;
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.innerText = `${timeLeft}s`;
    clearInterval(timer);

    timer = setInterval(() => {
        timeLeft -= 1;
        if (timerEl) timerEl.innerText = `${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            answerQuestion(-1);
        }
    }, 1000);
}

function answerQuestion(selectedIndex) {
    clearInterval(timer);

    if (!quizData || !Array.isArray(quizData.questions) || currentQuestionIndex >= quizData.questions.length) {
        return;
    }

    const currentQuestion = quizData.questions[currentQuestionIndex];
    const correctIndex = currentQuestion?.correcta;
    const feedbackEl = document.getElementById('feedback');

    document.querySelectorAll('#options button').forEach((button) => {
        button.disabled = true;
    });

    if (selectedIndex === correctIndex) {
        if (feedbackEl) {
            feedbackEl.innerText = '¡Correcto!';
            feedbackEl.textContent = '¡Correcto!';
            feedbackEl.style.color = 'green';
        }
        score += 1;
    } else {
        if (feedbackEl) {
            feedbackEl.innerText = 'Incorrecto o Tiempo Agotado';
            feedbackEl.textContent = 'Incorrecto o Tiempo Agotado';
            feedbackEl.style.color = 'red';
        }
    }

    currentQuestionIndex += 1;
    setTimeout(showQuestion, 1500);
}

async function finishQuiz() {
    if (!quizData) return;

    const quizContainer = document.getElementById('quiz-container');
    const resultContainer = document.getElementById('result-container');

    if (quizContainer) quizContainer.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'block';

    const totalQuestions = Array.isArray(quizData.questions) ? quizData.questions.length : 0;
    const finalScore = document.getElementById('final-score');
    if (finalScore) {
        finalScore.innerText = `Tu nota es: ${score} / ${totalQuestions}`;
        finalScore.textContent = `Tu nota es: ${score} / ${totalQuestions}`;
    }

    if (totalQuestions === 0 || !quizData.creator_username) {
        console.error('Datos inválidos para guardar resultado');
        return;
    }

    const { error } = await supabase.from('results').insert([{
        quiz_id: quizId,
        creator_username: quizData.creator_username,
        name: pName,
        account: pAccount,
        score: score,
        total_questions: totalQuestions
    }]);

    if (error) {
        console.error(error);
        alert('No se pudo guardar tu resultado.');
    }
}

window.startQuiz = startQuiz;
window.answerQuestion = answerQuestion;
