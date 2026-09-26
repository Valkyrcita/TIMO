// Este archivo se mantiene solo por compatibilidad.
// La lógica real del participante está en quiz.js para evitar duplicar
// funciones y anular el estado global del cuestionario.
// Si se carga antes que quiz.js, puede provocar que startQuiz, answerQuestion
// y finishQuiz se re-definan y rompan el flujo del login/inicio del quiz.

if (typeof window.startQuiz !== 'function') {
    window.startQuiz = function () {
        alert('No se pudo inicializar el cuestionario. Revisa que quiz.js esté cargado antes de este archivo.');
    };
}
