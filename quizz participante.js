const supabase = supabase.createClient('https://dfkxlugytntvmrhjdmfg.supabase.co', 'sb_publishable_JsRpqD8vOrG84KtPbR97Ng_Aq9ZpZlO');
const urlParams = new URLSearchParams(window.location.search);
const quizId = urlParams.get('id');

let quizData = null;
let currentQuestionIndex = 0;
let score = 0;
let timer;
let pName = "";
let pAccount = "";

async function startQuiz() {
    pName = document.getElementById('p-name').value;
    pAccount = document.getElementById('p-account').value;
    
    if (!pName || pAccount.length < 1 || pAccount.length > 3) return alert("Datos inválidos");

    const { data: existing } = await supabase
        .from('results')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('account', pAccount);

    if (existing && existing.length > 0) {
        return alert("Esta cuenta ya resolvió el cuestionario.");
    }

    const { data: quiz, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

    if (error || !quiz) return alert("Cuestionario no encontrado");

    quizData = quiz;
    document.getElementById('registration').style.display = 'none';
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('quiz-title').innerText = quiz.title;
    
    showQuestion();
}

function showQuestion() {
    if (currentQuestionIndex >= quizData.questions.length) return finishQuiz();

    const q = quizData.questions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.pregunta;
    
    let optionsHtml = '';
    q.opciones.forEach((opt, index) => {
        optionsHtml += `<button onclick="answerQuestion(${index})">${opt}</button>`;
    });
    document.getElementById('options').innerHTML = optionsHtml;
    document.getElementById('feedback').innerText = "";
    
    let timeLeft = 45;
    document.getElementById('timer').innerText = `${timeLeft}s`;
    clearInterval(timer);
    
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = `${timeLeft}s`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            answerQuestion(-1);
        }
    }, 1000);
}

window.answerQuestion = (selectedIndex) => {
    clearInterval(timer);
    const correctIndex = quizData.questions[currentQuestionIndex].correcta;
    const feedbackEl = document.getElementById('feedback');
    
    document.querySelectorAll('#options button').forEach(b => b.disabled = true);
    
    if (selectedIndex === correctIndex) {
        feedbackEl.innerText = "¡Correcto!";
        feedbackEl.style.color = "green";
        score++;
    } else {
        feedbackEl.innerText = "Incorrecto o Tiempo Agotado";
        feedbackEl.style.color = "red";
    }

    currentQuestionIndex++;
    setTimeout(showQuestion, 1500); 
};

async function finishQuiz() {
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';
    document.getElementById('final-score').innerText = `Tu nota es: ${score} / 5`;

    await supabase.from('results').insert([{
        quiz_id: quizId,
        creator_username: quizData.creator_username,
        name: pName,
        account: pAccount,
        score: score
    }]);
}
