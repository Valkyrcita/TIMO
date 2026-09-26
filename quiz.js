const SUPABASE_URL = 'https://dfkxlugytntvmrhjdmfg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO';

const supabase = window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');

let quizData = null;
let currentQIndex = 0;
let score = 0;
let totalTime = 0;
let timerInterval;
let timeLeft = 45;
let participantInfo = {};
let answersDetail = [];

async function init() {
    if (!supabase) {
        alert('No hay conexión con Supabase disponible.');
        return;
    }

    if (!quizId) {
        document.getElementById('quiz-title-header').innerText = 'URL Inválida';
        return;
    }

    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

    if (error || !data) {
        console.error(error);
        document.getElementById('quiz-title-header').innerText = 'Quiz no encontrado';
        return;
    }

    quizData = data;
    document.getElementById('quiz-title-header').innerText = quizData.title ?? 'Cuestionario';
}

init();

async function startQuiz() {
    if (!supabase) {
        alert('No hay conexión con Supabase disponible.');
        return;
    }

    participantInfo.name = document.getElementById('p-name')?.value.trim() ?? '';
    participantInfo.account = document.getElementById('p-account')?.value.trim() ?? '';

    if (!participantInfo.name || !participantInfo.account) {
        alert('Llena tus datos para continuar.');
        return;
    }

    const { data, error } = await supabase
        .from('results')
        .select('id')
        .eq('quiz_id', quizId)
        .eq('account', participantInfo.account);

    if (error) {
        console.error(error);
        alert('No se pudo validar la participación.');
        return;
    }

    if (data && data.length > 0) {
        alert('Esta cuenta ya realizó este quiz.');
        return;
    }

    if (!quizData || !Array.isArray(quizData.questions)) {
        alert('El cuestionario no está disponible.');
        return;
    }

    document.getElementById('registration').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    if (!quizData || !Array.isArray(quizData.questions)) {
        finishQuiz();
        return;
    }

    if (currentQIndex >= quizData.questions.length) {
        finishQuiz();
        return;
    }

    const q = quizData.questions[currentQIndex];
    document.getElementById('question-text').innerText = `${currentQIndex + 1}. ${q.pregunta}`;
    document.getElementById('feedback').innerText = '';
    document.getElementById('feedback').className = '';

    const optsContainer = document.getElementById('options-container');
    optsContainer.innerHTML = '';

    q.opciones.forEach((opt, index) => {
        optsContainer.innerHTML += `<button class="btn-option" id="btn-${index}" type="button" onclick="checkAnswer(${index})">${opt}</button>`;
    });

    timeLeft = 45;
    document.getElementById('timer').innerText = timeLeft;
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft -= 1;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) checkAnswer(-1);
    }, 1000);
}

function checkAnswer(selectedIndex) {
    clearInterval(timerInterval);

    if (!quizData || !Array.isArray(quizData.questions) || currentQIndex >= quizData.questions.length) {
        return;
    }

    const q = quizData.questions[currentQIndex];
    const timeTaken = 45 - timeLeft;
    totalTime += timeTaken;

    const buttons = document.querySelectorAll('.btn-option');
    buttons.forEach((button) => {
        button.disabled = true;
    });

    const isCorrect = selectedIndex === q.correcta;
    const feedbackDiv = document.getElementById('feedback');

    if (isCorrect) {
        score += 1;
        feedbackDiv.innerText = '¡Respuesta Correcta! ✅';
        feedbackDiv.style.color = '#22c55e';
        const btn = document.getElementById(`btn-${selectedIndex}`);
        if (btn) btn.classList.add('correct-ans');
    } else {
        feedbackDiv.innerText = `Incorrecto ❌. La correcta era: ${q.opciones[q.correcta]}`;
        feedbackDiv.style.color = '#dc3545';
        if (selectedIndex !== -1) {
            const wrongBtn = document.getElementById(`btn-${selectedIndex}`);
            if (wrongBtn) wrongBtn.classList.add('wrong-ans');
        }
        const correctBtn = document.getElementById(`btn-${q.correcta}`);
        if (correctBtn) correctBtn.classList.add('correct-ans');
    }

    answersDetail.push({
        questionIndex: currentQIndex,
        selectedText: selectedIndex === -1 ? 'Tiempo Agotado' : q.opciones[selectedIndex],
        correctText: q.opciones[q.correcta],
        isCorrect,
        timeTaken
    });

    currentQIndex += 1;
    setTimeout(showQuestion, 3000);
}

async function finishQuiz() {
    if (!quizData || !supabase) return;

    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';

    const totalQuestions = Array.isArray(quizData.questions) ? quizData.questions.length : 0;
    document.getElementById('final-score').innerText = `${score} / ${totalQuestions}`;
    document.getElementById('final-time').innerText = `Tiempo total: ${totalTime} segundos`;

    const payload = {
        quiz_id: quizId,
        creator_username: quizData.creator_username,
        name: participantInfo.name,
        account: participantInfo.account,
        score: score,
        total_time: totalTime,
        answers_detail: answersDetail,
        total_questions: totalQuestions
    };

    const { error } = await supabase.from('results').insert([payload]);
    if (error) {
        console.error(error);
        alert('No se pudo guardar tu resultado.');
    }
}

window.startQuiz = startQuiz;
