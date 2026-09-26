const supabase = window.supabase.createClient(
    'https://dfkxlugytntvmrhjdmfg.supabase.co',
    'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO'
);

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
    document.getElementById('registration').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('quiz-title').innerText = quiz.title;

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
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
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

    document.getElementById('question-text').innerText = q.pregunta;
    document.getElementById('question-text').textContent = q.pregunta; // Asegurar seguridad

    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    q.opciones.forEach((opt, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = opt; // Usar textContent en lugar de innerHTML
        button.onclick = () => answerQuestion(index);
        button.style.margin = '0.5rem 0';
        button.style.padding = '0.75rem';
        button.style.width = '100%';
        optionsContainer.appendChild(button);
    });

    document.getElementById('feedback').innerText = '';
    document.getElementById('feedback').textContent = '';

    let timeLeft = 45;
    document.getElementById('timer').innerText = `${timeLeft}s`;
    clearInterval(timer);

    timer = setInterval(() => {
        timeLeft -= 1;
        document.getElementById('timer').innerText = `${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            answerQuestion(-1);
        }
    }, 1000);
}

window.answerQuestion = (selectedIndex) => {
    clearInterval(timer);

    if (!quizData || !Array.isArray(quizData.questions) || currentQuestionIndex >= quizData.questions.length) {
        return;
    }

    const correctIndex = quizData.questions[currentQuestionIndex].correcta;
    const feedbackEl = document.getElementById('feedback');

    document.querySelectorAll('#options button').forEach((button) => {
        button.disabled = true;
    });

    if (selectedIndex === correctIndex) {
        feedbackEl.innerText = '¡Correcto!';
        feedbackEl.textContent = '¡Correcto!';
        feedbackEl.style.color = 'green';
        score += 1;
    } else {
        feedbackEl.innerText = 'Incorrecto o Tiempo Agotado';
        feedbackEl.textContent = 'Incorrecto o Tiempo Agotado';
        feedbackEl.style.color = 'red';
    }

    currentQuestionIndex += 1;
    setTimeout(showQuestion, 1500);
};

async function finishQuiz() {
    if (!quizData) return;

    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';

    const totalQuestions = Array.isArray(quizData.questions) ? quizData.questions.length : 0;
    document.getElementById('final-score').innerText = `Tu nota es: ${score} / ${totalQuestions}`;
    document.getElementById('final-score').textContent = `Tu nota es: ${score} / ${totalQuestions}`;

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
