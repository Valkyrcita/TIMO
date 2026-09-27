let supabase = null;
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

async function initSupabase() {
    const SUPABASE_URL = 'https://dfkxlugytntvmrhjdmfg.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO';

    try {
        if (!window.supabase || !window.supabase.createClient) {
            console.error('❌ Supabase SDK no está cargado');
            return false;
        }

        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('✅ Supabase inicializado');
        return true;
    } catch (error) {
        console.error('❌ Error inicializando Supabase:', error);
        return false;
    }
}

async function init() {
    console.log('🚀 Inicializando quiz.js...');
    console.log('Quiz ID:', quizId);
    
    const ready = await initSupabase();
    if (!ready) {
        const titleHeader = document.getElementById('quiz-title-header');
        if (titleHeader) titleHeader.innerText = 'Error: Supabase no disponible';
        return;
    }

    if (!quizId) {
        const titleHeader = document.getElementById('quiz-title-header');
        if (titleHeader) titleHeader.innerText = 'URL Inválida - No hay ID de quiz';
        return;
    }

    try {
        console.log('📤 Buscando quiz con ID:', quizId);
        const { data, error } = await supabase
            .from('quizzes')
            .select('*')
            .eq('id', quizId)
            .single();

        console.log('📥 Respuesta Supabase:', { data, error });

        if (error) {
            console.error('❌ Error Supabase:', error);
            const titleHeader = document.getElementById('quiz-title-header');
            if (titleHeader) titleHeader.innerText = `Error: ${error.message}`;
            return;
        }

        if (!data) {
            const titleHeader = document.getElementById('quiz-title-header');
            if (titleHeader) titleHeader.innerText = 'Quiz no encontrado';
            return;
        }

        quizData = data;
        console.log('✅ Quiz cargado:', quizData.title);
        const titleHeader = document.getElementById('quiz-title-header');
        if (titleHeader) titleHeader.innerText = quizData.title ?? 'Cuestionario';
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        const titleHeader = document.getElementById('quiz-title-header');
        if (titleHeader) titleHeader.innerText = `Error: ${error.message}`;
    }
}

init();

async function startQuiz() {
    console.log('🎯 Iniciando quiz...');
    
    if (!supabase) {
        alert('Supabase no está disponible.');
        return;
    }

    participantInfo.name = document.getElementById('p-name')?.value.trim() ?? '';
    participantInfo.account = document.getElementById('p-account')?.value.trim() ?? '';

    console.log('Datos del participante:', participantInfo);

    if (!participantInfo.name || !participantInfo.account) {
        alert('Llena tus datos para continuar.');
        return;
    }

    try {
        console.log('📤 Verificando si la cuenta ya realizó el quiz...');
        const { data, error } = await supabase
            .from('results')
            .select('id')
            .eq('quiz_id', quizId)
            .eq('account', participantInfo.account);

        console.log('📥 Respuesta:', { data, error });

        if (error) {
            console.error('Error validando:', error);
            alert('No se pudo validar la participación: ' + error.message);
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

        console.log('✅ Iniciando cuestionario');
        document.getElementById('registration').style.display = 'none';
        document.getElementById('quiz-container').style.display = 'block';
        showQuestion();
    } catch (error) {
        console.error('Error en startQuiz:', error);
        alert('Error al iniciar el quiz: ' + (error?.message || 'desconocido'));
    }
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
    console.log(`Pregunta ${currentQIndex + 1}:`, q.pregunta);
    
    const questionText = document.getElementById('question-text');
    if (questionText) questionText.innerText = `${currentQIndex + 1}. ${q.pregunta}`;
    
    const feedback = document.getElementById('feedback');
    if (feedback) {
        feedback.innerText = '';
        feedback.className = '';
    }

    const optsContainer = document.getElementById('options-container');
    if (!optsContainer) return;
    optsContainer.innerHTML = '';

    q.opciones.forEach((opt, index) => {
        optsContainer.innerHTML += `<button class="btn-option" id="btn-${index}" type="button" onclick="checkAnswer(${index})">${opt}</button>`;
    });

    timeLeft = 45;
    const timer = document.getElementById('timer');
    if (timer) timer.innerText = String(timeLeft);
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft -= 1;
        if (timer) timer.innerText = String(timeLeft);
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
    buttons.forEach((button) => button.disabled = true);

    const isCorrect = selectedIndex === q.correcta;
    const feedbackDiv = document.getElementById('feedback');

    if (isCorrect) {
        score += 1;
        if (feedbackDiv) feedbackDiv.innerText = '¡Respuesta Correcta! ✅';
        if (feedbackDiv) feedbackDiv.style.color = '#22c55e';
        const btn = document.getElementById(`btn-${selectedIndex}`);
        if (btn) btn.classList.add('correct-ans');
    } else {
        if (feedbackDiv) feedbackDiv.innerText = `Incorrecto ❌. La correcta era: ${q.opciones[q.correcta]}`;
        if (feedbackDiv) feedbackDiv.style.color = '#dc3545';
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
    console.log('🏁 Quiz finalizado');
    console.log('Puntuación:', score);
    console.log('Tiempo total:', totalTime);
    
    if (!quizData || !supabase) return;

    const quizContainer = document.getElementById('quiz-container');
    const resultContainer = document.getElementById('result-container');
    if (quizContainer) quizContainer.style.display = 'none';
    if (resultContainer) resultContainer.style.display = 'block';

    const totalQuestions = Array.isArray(quizData.questions) ? quizData.questions.length : 0;
    const finalScore = document.getElementById('final-score');
    const finalTime = document.getElementById('final-time');
    if (finalScore) finalScore.innerText = `${score} / ${totalQuestions}`;
    if (finalTime) finalTime.innerText = `Tiempo total: ${totalTime} segundos`;

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

    console.log('📤 Guardando resultado:', payload);

    try {
        const { error } = await supabase.from('results').insert([payload]);
        
        if (error) {
            console.error('❌ Error guardando resultado:', error);
            alert('El quiz terminó pero no se guardó el resultado.\nError: ' + error.message);
            return;
        }
        
        console.log('✅ Resultado guardado correctamente');
    } catch (error) {
        console.error('❌ Error en finishQuiz:', error);
        alert('No se pudo guardar tu resultado: ' + (error?.message || 'desconocido'));
    }
}

window.startQuiz = startQuiz;
