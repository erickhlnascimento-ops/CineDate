// ==========================================
// CINEDATE - AUTENTICAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

    const formulario = document.getElementById("loginForm");
    const email = document.getElementById("email");
    const senha = document.getElementById("senha");

    const mensagem = document.getElementById("loginMensagem");
    const botao = document.getElementById("loginButton");

    // Verificar se já existe uma sessão

    const { data } = await supabaseClient.auth.getSession();

    if (data.session) {
        window.location.replace("../index.html");
        return;
    }

    // Realizar login

    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        mensagem.textContent = "";

        botao.disabled = true;
        botao.innerHTML = "Entrando...";

        try {

            const { data, error } = await supabaseClient.auth.signInWithPassword({

                email: email.value.trim(),
                password: senha.value

            });

            if (error) {
                throw error;
            }

            console.log("Login realizado com sucesso!");

            window.location.replace("../index.html");

        } catch (erro) {

            console.error("Erro no login:", erro);

            mensagem.textContent =
                "E-mail ou senha incorretos. Verifique seus dados.";

        } finally {

            botao.disabled = false;

            botao.innerHTML = `
                Entrar no CineDate
                <span>→</span>
            `;

        }

    });

});