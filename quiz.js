const supabase = window.supabase.createClient("TU_URL", "TU_KEY");
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');

let quizData = null;
let currentQIndex = 0;
let score = 0;
let totalTime = 0;
let timerInterval;
let timeLeft = 45;
let participantInfo = {};
let answersDetail = []; // Guarda el historial de lo que responde

// Cargar título inicial
async function init() {
    if(!quizId) return document.getElementById('quiz-title-header').innerText = "URL Inválida";
    const { data } = await supabase.from('quizzes').select('*').eq('id', quizId).single();
    if(data) {
        quizData = data;
        document.getElementById('quiz-title-header').innerText = quizData.title;
    } else {
        document.getElementById('quiz-title-header').innerText = "Quiz no encontrado";
    }
}
init();

async function startQuiz() {
    participantInfo.name = document.getElementById('p-name').value.trim();
    participantInfo.account = document.getElementById('p-account').value.trim();
    
    if (!participantInfo.name || participantInfo.account.length < 1) return alert("Llena tus datos");

    // Prevenir doble participación
    const { data } = await supabase.from('results').select('id').eq('quiz_id', quizId).eq('account', participantInfo.account);
    if (data && data.length > 0) return alert("Esta cuenta ya realizó este quiz.");

    document.getElementById('registration').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    showQuestion();
}

function showQuestion() {
    if (currentQIndex >= quizData.questions.length) return finishQuiz();

    const q = quizData.questions[currentQIndex];
    document.getElementById('question-text').innerText = `${currentQIndex + 1}. ${q.pregunta}`;
    document.getElementById('feedback').innerText = "";
    document.getElementById('feedback').className = "";
    
    const optsContainer = document.getElementById('options-container');
    optsContainer.innerHTML = '';
    q.opciones.forEach((opt, index) => {
        optsContainer.innerHTML += `<button class="btn-option" id="btn-${index}" onclick="checkAnswer(${index})">${opt}</button>`;
    });

    timeLeft = 45;
    document.getElementById('timer').innerText = timeLeft;
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = timeLeft;
        if (timeLeft <= 0) checkAnswer(-1); // Tiempo agotado
    }, 1000);
}

function checkAnswer(selectedIndex) {
    clearInterval(timerInterval);
    const q = quizData.questions[currentQIndex];
    const timeTaken = 45 - timeLeft;
    totalTime += timeTaken;
    
    // Bloquear botones
    const buttons = document.querySelectorAll('.btn-option');
    buttons.forEach(b => b.disabled = true);

    const isCorrect = (selectedIndex === q.correcta);
    const feedbackDiv = document.getElementById('feedback');

    if (isCorrect) {
        score++;
        feedbackDiv.innerText = "¡Respuesta Correcta! ✅";
        feedbackDiv.style.color = "#28a745";
        document.getElementById(`btn-${selectedIndex}`).classList.add('correct-ans');
    } else {
        feedbackDiv.innerText = `Incorrecto ❌. La correcta era: ${q.opciones[q.correcta]}`;
        feedbackDiv.style.color = "#dc3545";
        if(selectedIndex !== -1) document.getElementById(`btn-${selectedIndex}`).classList.add('wrong-ans');
        document.getElementById(`btn-${q.correcta}`).classList.add('correct-ans');
    }

    // Guardar detalle para las estadísticas del creador
    answersDetail.push({
        questionIndex: currentQIndex,
        selectedText: selectedIndex === -1 ? "Tiempo Agotado" : q.opciones[selectedIndex],
        correctText: q.opciones[q.correcta],
        isCorrect: isCorrect,
        timeTaken: timeTaken
    });

    currentQIndex++;
    // Pausa de 3 segundos para que vean la solución (como en Telegram)
    setTimeout(showQuestion, 3000); 
}

async function finishQuiz() {
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';
    
    document.getElementById('final-score').innerText = `${score} / ${quizData.questions.length}`;
    document.getElementById('final-time').innerText = `Tiempo total: ${totalTime} segundos`;

    // Enviar resultados al backend
    await supabase.from('results').insert([{
        quiz_id: quizId,
        creator_username: quizData.creator_username,
        name: participantInfo.name,
        account: participantInfo.account,
        score: score,
        total_time: totalTime,
        answers_detail: answersDetail
    }]);
}
