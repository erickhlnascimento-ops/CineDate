
// ==========================================
// CINEDATE - CADASTRO DE FILMES
// Integração com Supabase
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.querySelector(".movie-form");

    if (!formulario) return;

    // Campos do formulário
    const titulo = document.getElementById("titulo");
    const ano = document.getElementById("ano");
    const genero = document.getElementById("genero");
    const poster = document.getElementById("poster");

    const data = document.getElementById("data");
    const cinema = document.getElementById("cinema");
    const tipo = document.getElementById("tipo");

    const nota1 = document.getElementById("nota1");
    const nota2 = document.getElementById("nota2");

    const comentario = document.getElementById("comentario");

    const mediaPreview = document.querySelector(".average-preview");

    // ==========================================
    // CONFIGURAR DATA
    // ==========================================

    if (data) {
        const hoje = new Date();

        const anoAtual = hoje.getFullYear();
        const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
        const diaAtual = String(hoje.getDate()).padStart(2, "0");

        data.max = `${anoAtual}-${mesAtual}-${diaAtual}`;
    }

    // ==========================================
    // CALCULAR MÉDIA
    // ==========================================

    function calcularMedia() {

        if (!mediaPreview) return;

        if (nota1.value === "" || nota2.value === "") {

            mediaPreview.innerHTML = `
                <span class="average-icon">♡</span>

                <div>
                    <strong>Nossa nota será especial!</strong>

                    <p>
                        Selecione as duas notas para visualizar
                        a média das avaliações.
                    </p>
                </div>
            `;

            return;
        }

        const primeiraNota = Number(nota1.value);
        const segundaNota = Number(nota2.value);

        const media = (primeiraNota + segundaNota) / 2;

        mediaPreview.innerHTML = `
            <span class="average-icon">⭐</span>

            <div>
                <strong>Média do casal: ${media.toFixed(1)} / 10</strong>

                <p>
                    Sua nota: ${primeiraNota}/10 ·
                    Nota dela: ${segundaNota}/10
                </p>
            </div>
        `;
    }

    nota1.addEventListener("change", calcularMedia);
    nota2.addEventListener("change", calcularMedia);

    // ==========================================
    // VALIDAR ANO
    // ==========================================

    ano.addEventListener("input", () => {

        if (ano.value === "") {
            ano.setCustomValidity("");
            return;
        }

        const anoInformado = Number(ano.value);
        const anoAtual = new Date().getFullYear();

        if (
            !Number.isInteger(anoInformado) ||
            anoInformado < 1888 ||
            anoInformado > anoAtual + 10
        ) {
            ano.setCustomValidity(
                "Informe um ano de lançamento válido."
            );
        } else {
            ano.setCustomValidity("");
        }
    });

    // ==========================================
    // SALVAR FILME NO SUPABASE
    // ==========================================

    formulario.addEventListener("submit", async (evento) => {

        evento.preventDefault();

        if (!formulario.reportValidity()) return;

        const primeiraNota = Number(nota1.value);
        const segundaNota = Number(nota2.value);

        if (
            primeiraNota < 1 ||
            primeiraNota > 10 ||
            segundaNota < 1 ||
            segundaNota > 10
        ) {
            alert("As notas devem estar entre 1 e 10.");
            return;
        }

        const anoAtual = new Date().getFullYear();

        if (ano.value) {

            const anoInformado = Number(ano.value);

            if (
                !Number.isInteger(anoInformado) ||
                anoInformado < 1888 ||
                anoInformado > anoAtual + 10
            ) {
                alert("Informe um ano de lançamento válido.");
                ano.focus();
                return;
            }
        }

        const botaoSalvar = formulario.querySelector(
            'button[type="submit"]'
        );

        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";

        let filmeId = null;

        try {

            // 1. Preparar os dados do filme

            const novoFilme = {
                titulo: titulo.value.trim(),

                ano: ano.value
                    ? Number(ano.value)
                    : null,

                genero: genero.value || null,

                poster: poster.value.trim() || null,

                data_sessao: data.value || null,

                local: cinema.value.trim() || null,

                tipo: tipo.value || null,

                comentario: comentario.value.trim() || null
            };

            // 2. Inserir o filme no banco

            const { data: filmeSalvo, error: erroFilme } =
                await supabaseClient
                    .from("filmes")
                    .insert(novoFilme)
                    .select("id")
                    .single();

            if (erroFilme) {
                throw erroFilme;
            }

            filmeId = filmeSalvo.id;

            // 3. Preparar as avaliações

            const avaliacoes = [
                {
                    filme_id: filmeId,
                    avaliador: "Pessoa 1",
                    nota: primeiraNota
                },
                {
                    filme_id: filmeId,
                    avaliador: "Pessoa 2",
                    nota: segundaNota
                }
            ];

            // 4. Inserir as duas avaliações

            const { error: erroAvaliacoes } =
                await supabaseClient
                    .from("avaliacoes")
                    .insert(avaliacoes);

            if (erroAvaliacoes) {
                throw erroAvaliacoes;
            }

            // 5. Calcular a média

            const media = (primeiraNota + segundaNota) / 2;

            console.log("Filme cadastrado:", filmeSalvo);
            console.log("Avaliações cadastradas:", avaliacoes);

            // 6. Confirmar cadastro

            alert(
                `Filme cadastrado com sucesso! 🎬\n\n` +
                `Título: ${novoFilme.titulo}\n` +
                `Média do casal: ${media.toFixed(1)}/10`
            );

            // 7. Limpar formulário

            formulario.reset();

            calcularMedia();

            titulo.focus();

        } catch (erro) {

            console.error("Erro ao cadastrar filme:", erro);

            // Se o filme foi salvo, mas as avaliações falharam,
            // tentar remover o filme para evitar cadastro incompleto.

            if (filmeId) {

                const { error: erroExclusao } = await supabaseClient
                    .from("filmes")
                    .delete()
                    .eq("id", filmeId);

                if (erroExclusao) {
                    console.error(
                        "Não foi possível remover o filme incompleto:",
                        erroExclusao
                    );
                }
            }

            alert(
                "Não foi possível cadastrar o filme.\n\n" +
                "Verifique o Console (F12) para identificar o erro."
            );

        } finally {

            botaoSalvar.disabled = false;

            botaoSalvar.innerHTML = `
                <span>♡</span>
                Salvar filme
            `;
        }

    });

});