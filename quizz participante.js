function showQuestion() {
    if (!quizData || currentQuestionIndex >= quizData.questions.length) {
        finishQuiz();
        return;
    }

    const q = quizData.questions[currentQuestionIndex];
    document.getElementById('question-text').innerText = q.pregunta;

    let optionsHtml = '';
    q.opciones.forEach((opt, index) => {
        optionsHtml += `<button type="button" class="btn btn-primary" onclick="answerQuestion(${index})">${opt}</button>`;
    });

    document.getElementById('options').innerHTML = optionsHtml;
    document.getElementById('feedback').innerText = '';

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
        feedbackEl.style.color = 'green';
        score += 1;
    } else {
        feedbackEl.innerText = 'Incorrecto o Tiempo Agotado';
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

    const { error } = await supabaseClient.from('results').insert([{
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
