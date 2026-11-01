// ==========================================
// CINEDATE - FILMES ASSISTIDOS
// Integração com Supabase + Modal de edição
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

    // ==========================================
    // ELEMENTOS DA PÁGINA
    // ==========================================

    const listaFilmes = document.getElementById("listaFilmes");
    const estadoVazio = document.getElementById("estadoVazio");

    const totalFilmes = document.getElementById("totalFilmes");
    const mediaCasal = document.getElementById("mediaCasal");
    const totalFavoritos = document.getElementById("totalFavoritos");

    const pesquisaFilmes = document.getElementById("pesquisaFilmes");
    const filtroGenero = document.getElementById("filtroGenero");
    const ordenacaoFilmes = document.getElementById("ordenacaoFilmes");

    const textoResultados = document.getElementById("textoResultados");
    const tituloEstadoVazio = document.getElementById("tituloEstadoVazio");
    const descricaoEstadoVazio = document.getElementById("descricaoEstadoVazio");

    // Elementos do modal
    const modal = document.getElementById("modalEditarFilme");
    const formEditar = document.getElementById("formEditarFilme");

    const fecharModal = document.getElementById("fecharModal");
    const cancelarEdicao = document.getElementById("cancelarEdicao");
    const salvarEdicao = document.getElementById("salvarEdicao");

    const editarTitulo = document.getElementById("editarTitulo");
    const editarAno = document.getElementById("editarAno");
    const editarGenero = document.getElementById("editarGenero");
    const editarPoster = document.getElementById("editarPoster");
    const editarData = document.getElementById("editarData");
    const editarCinema = document.getElementById("editarCinema");
    const editarTipo = document.getElementById("editarTipo");
    const editarNota1 = document.getElementById("editarNota1");
    const editarNota2 = document.getElementById("editarNota2");
    const editarComentario = document.getElementById("editarComentario");

    let filmes = [];
    let filmeEmEdicao = null;

    // ==========================================
    // CARREGAR FILMES DO SUPABASE
    // ==========================================

    async function carregarFilmes() {

        textoResultados.textContent = "Carregando filmes...";

        const { data, error } = await supabaseClient
            .from("filmes")
            .select(`
                *,
                avaliacoes (
                    avaliador,
                    nota
                )
            `)
            .order("data_sessao", { ascending: false });

        if (error) {
            console.error("Erro ao carregar filmes:", error);
            mostrarErro();
            return;
        }

        filmes = data.map(filme => {

            const avaliacao1 = filme.avaliacoes.find(
                item => item.avaliador === "Pessoa 1"
            );

            const avaliacao2 = filme.avaliacoes.find(
                item => item.avaliador === "Pessoa 2"
            );

            const nota1 = avaliacao1 ? Number(avaliacao1.nota) : null;
            const nota2 = avaliacao2 ? Number(avaliacao2.nota) : null;

            const notasValidas =
                nota1 !== null &&
                nota2 !== null &&
                Number.isFinite(nota1) &&
                Number.isFinite(nota2);

            const media = notasValidas
                ? (nota1 + nota2) / 2
                : null;

            return {
                ...filme,
                cinema: filme.local,
                data: filme.data_sessao,
                nota1,
                nota2,
                media
            };
        });

        renderizarFilmes();
    }

    // ==========================================
    // MOSTRAR ERRO
    // ==========================================

    function mostrarErro() {

        listaFilmes.replaceChildren();
        estadoVazio.hidden = false;

        tituloEstadoVazio.textContent =
            "Não foi possível carregar os filmes.";

        descricaoEstadoVazio.textContent =
            "Verifique sua conexão e tente novamente.";

        textoResultados.textContent =
            "Erro ao carregar o catálogo.";
    }

    // ==========================================
    // FORMATAR DATA
    // ==========================================

    function formatarData(data) {

        if (!data) return "Data não informada";

        const partes = data.split("-");

        if (partes.length !== 3) {
            return "Data não informada";
        }

        const [ano, mes, dia] = partes;

        return `${dia}/${mes}/${ano}`;
    }

    // ==========================================
    // ESCAPAR HTML
    // ==========================================

    function escaparHTML(valor) {

        return String(valor ?? "").replace(
            /[&<>"']/g,
            caractere => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[caractere]
        );
    }

    // ==========================================
    // FORMATAR GÊNERO
    // ==========================================

    function formatarGenero(genero) {

        const generos = {
            acao: "Ação",
            animacao: "Animação",
            aventura: "Aventura",
            comedia: "Comédia",
            drama: "Drama",
            fantasia: "Fantasia",
            ficcao: "Ficção científica",
            romance: "Romance",
            suspense: "Suspense",
            terror: "Terror",
            outro: "Outro"
        };

        return generos[genero] || "Gênero não informado";
    }

    // ==========================================
    // ATUALIZAR ESTATÍSTICAS
    // ==========================================

    function atualizarEstatisticas(filmes) {

        totalFilmes.textContent = filmes.length;

        const filmesComNotas = filmes.filter(
            filme => filme.media !== null
        );

        if (filmesComNotas.length > 0) {

            const soma = filmesComNotas.reduce(
                (total, filme) => total + filme.media,
                0
            );

            mediaCasal.textContent =
                (soma / filmesComNotas.length).toFixed(1);

        } else {
            mediaCasal.textContent = "—";
        }

        const favoritos = filmes.filter(filme =>
            filme.nota1 !== null &&
            filme.nota2 !== null &&
            filme.nota1 >= 9 &&
            filme.nota2 >= 9
        );

        totalFavoritos.textContent = favoritos.length;
    }

    // ==========================================
    // CRIAR CARTÃO
    // ==========================================

    function criarCartao(filme) {

        const titulo = escaparHTML(filme.titulo || "Filme sem título");

        const ano = filme.ano
            ? escaparHTML(filme.ano)
            : "Ano não informado";

        const genero = escaparHTML(formatarGenero(filme.genero));

        const cinema = escaparHTML(
            filme.cinema || "Cinema não informado"
        );

        const dataSessao = escaparHTML(formatarData(filme.data));

        const tipo = escaparHTML(
            filme.tipo
                ? filme.tipo.toUpperCase()
                : "Sessão não informada"
        );

        const comentario = escaparHTML(filme.comentario || "");

        const notaA = filme.nota1;
        const notaB = filme.nota2;

        const media = filme.media !== null
            ? filme.media.toFixed(1)
            : "—";

        const cartao = document.createElement("article");

        cartao.className = "film-card";

        const posterURL = String(filme.poster || "").trim();

        const posterSeguro =
            posterURL.startsWith("https://") ||
            posterURL.startsWith("http://");

        const imagemHTML = posterSeguro
            ? `
                <img
                    class="film-poster"
                    src="${escaparHTML(posterURL)}"
                    alt="Pôster de ${titulo}"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                >
            `
            : `
                <div class="film-poster-placeholder">
                    🎬
                </div>
            `;

        cartao.innerHTML = `

            <div class="film-poster-container">

                ${imagemHTML}

                <div class="film-average-badge">
                    ⭐ ${media}
                </div>

            </div>

            <div class="film-card-content">

                <h3 class="film-title">${titulo}</h3>

                <div class="film-metadata">
                    <span>${ano}</span>
                    <span class="film-genre">${genero}</span>
                </div>

                <div class="film-session">
                    <span>📅 ${dataSessao}</span>
                    <span>🍿 ${cinema}</span>
                    <span>🎥 ${tipo}</span>
                </div>

                <div class="film-ratings">

                    <div class="film-rating">
                        <span>Sua nota</span>
                        <strong>
                            ${notaA !== null ? `${notaA}/10` : "—"}
                        </strong>
                    </div>

                    <div class="film-rating">
                        <span>Nota dela</span>
                        <strong>
                            ${notaB !== null ? `${notaB}/10` : "—"}
                        </strong>
                    </div>

                </div>

                ${comentario
                    ? `<p class="film-comment">💌 ${comentario}</p>`
                    : ""
                }

                <div class="film-card-actions">

                    <button
                        type="button"
                        class="edit-film-button"
                        data-id="${escaparHTML(filme.id)}"
                    >
                        ✏️ Editar
                    </button>

                    <button
                        type="button"
                        class="delete-film-button"
                        data-id="${escaparHTML(filme.id)}"
                    >
                        Excluir filme
                    </button>

                </div>

            </div>
        `;

        const imagem = cartao.querySelector(".film-poster");

        if (imagem) {

            imagem.addEventListener("error", () => {

                const placeholder = document.createElement("div");

                placeholder.className = "film-poster-placeholder";
                placeholder.textContent = "🎬";

                imagem.replaceWith(placeholder);

            }, { once: true });
        }

        return cartao;
    }

    // ==========================================
    // FILTRAR E ORDENAR
    // ==========================================

    function obterFilmesFiltrados() {

        const termo = pesquisaFilmes.value
            .trim()
            .toLocaleLowerCase("pt-BR");

        const generoSelecionado = filtroGenero.value;

        let resultado = filmes.filter(filme => {

            const titulo = String(filme.titulo || "")
                .toLocaleLowerCase("pt-BR");

            const cinema = String(filme.cinema || "")
                .toLocaleLowerCase("pt-BR");

            const correspondePesquisa =
                titulo.includes(termo) ||
                cinema.includes(termo);

            const correspondeGenero =
                !generoSelecionado ||
                filme.genero === generoSelecionado;

            return correspondePesquisa && correspondeGenero;
        });

        switch (ordenacaoFilmes.value) {

            case "recentes":
                resultado.sort((a, b) =>
                    String(b.data || "").localeCompare(String(a.data || ""))
                );
                break;

            case "antigos":
                resultado.sort((a, b) =>
                    String(a.data || "").localeCompare(String(b.data || ""))
                );
                break;

            case "maiorNota":
                resultado.sort((a, b) =>
                    (b.media ?? -1) - (a.media ?? -1)
                );
                break;

            case "menorNota":
                resultado.sort((a, b) =>
                    (a.media ?? Infinity) - (b.media ?? Infinity)
                );
                break;

            case "alfabetica":
                resultado.sort((a, b) =>
                    String(a.titulo || "").localeCompare(
                        String(b.titulo || ""),
                        "pt-BR"
                    )
                );
                break;
        }

        return resultado;
    }

    // ==========================================
    // RENDERIZAR FILMES
    // ==========================================

    function renderizarFilmes() {

        atualizarEstatisticas(filmes);

        const resultado = obterFilmesFiltrados();

        listaFilmes.replaceChildren();

        textoResultados.textContent =
            `${resultado.length} ${
                resultado.length === 1
                    ? "filme encontrado"
                    : "filmes encontrados"
            }`;

        if (resultado.length === 0) {

            estadoVazio.hidden = false;

            if (filmes.length === 0) {

                tituloEstadoVazio.textContent =
                    "Nosso primeiro filme ainda está esperando!";

                descricaoEstadoVazio.textContent =
                    "Cadastre o primeiro filme para começar a construir " +
                    "a história cinematográfica de vocês.";

            } else {

                tituloEstadoVazio.textContent =
                    "Nenhum filme encontrado.";

                descricaoEstadoVazio.textContent =
                    "Tente alterar a pesquisa ou os filtros selecionados.";
            }

            return;
        }

        estadoVazio.hidden = true;

        const fragmento = document.createDocumentFragment();

        resultado.forEach(filme => {
            fragmento.appendChild(criarCartao(filme));
        });

        listaFilmes.appendChild(fragmento);
    }

    // ==========================================
    // ABRIR MODAL DE EDIÇÃO
    // ==========================================

    function abrirModal(filme) {

        filmeEmEdicao = filme;

        editarTitulo.value = filme.titulo || "";
        editarAno.value = filme.ano ?? "";
        editarGenero.value = filme.genero || "outro";
        editarPoster.value = filme.poster || "";
        editarData.value = filme.data || "";
        editarCinema.value = filme.cinema || "";
        editarTipo.value = filme.tipo || "";
        editarNota1.value = filme.nota1 ?? "";
        editarNota2.value = filme.nota2 ?? "";
        editarComentario.value = filme.comentario || "";

        modal.hidden = false;
        document.body.style.overflow = "hidden";

        editarTitulo.focus();
    }

    // ==========================================
    // FECHAR MODAL
    // ==========================================

    function fecharModalEdicao() {

        modal.hidden = true;
        filmeEmEdicao = null;

        formEditar.reset();

        document.body.style.overflow = "";
        salvarEdicao.disabled = false;
        salvarEdicao.textContent = "💜 Salvar alterações";
    }

    fecharModal.addEventListener("click", fecharModalEdicao);

    cancelarEdicao.addEventListener("click", fecharModalEdicao);

    modal.addEventListener("click", evento => {

        if (evento.target === modal) {
            fecharModalEdicao();
        }
    });

    document.addEventListener("keydown", evento => {

        if (evento.key === "Escape" && !modal.hidden) {
            fecharModalEdicao();
        }
    });

    // ==========================================
    // ATUALIZAR AVALIAÇÕES
    // ==========================================

    async function salvarAvaliacao(filmeId, avaliador, nota) {

        const { data: existente, error: erroBusca } = await supabaseClient
            .from("avaliacoes")
            .select("id")
            .eq("filme_id", filmeId)
            .eq("avaliador", avaliador)
            .maybeSingle();

        if (erroBusca) {
            throw erroBusca;
        }

        if (existente) {

            const { error } = await supabaseClient
                .from("avaliacoes")
                .update({ nota })
                .eq("id", existente.id);

            if (error) throw error;

        } else {

            const { error } = await supabaseClient
                .from("avaliacoes")
                .insert({
                    filme_id: filmeId,
                    avaliador,
                    nota
                });

            if (error) throw error;
        }
    }

    // ==========================================
    // SALVAR EDIÇÃO DO FILME
    // ==========================================

    formEditar.addEventListener("submit", async evento => {

        evento.preventDefault();

        if (!filmeEmEdicao) return;

        const titulo = editarTitulo.value.trim();
        const ano = editarAno.value.trim();
        const nota1 = Number(editarNota1.value);
        const nota2 = Number(editarNota2.value);

        if (!titulo) {
            alert("O título do filme é obrigatório.");
            editarTitulo.focus();
            return;
        }

        if (
            ano &&
            (!Number.isInteger(Number(ano)) ||
                Number(ano) < 1888 ||
                Number(ano) > 2100)
        ) {
            alert("Informe um ano válido.");
            editarAno.focus();
            return;
        }

        if (
            editarNota1.value.trim() === "" ||
            editarNota2.value.trim() === "" ||
            !Number.isFinite(nota1) ||
            !Number.isFinite(nota2) ||
            nota1 < 0 ||
            nota1 > 10 ||
            nota2 < 0 ||
            nota2 > 10
        ) {
            alert("As duas notas devem ser números entre 0 e 10.");
            return;
        }

        const filmeId = filmeEmEdicao.id;

        salvarEdicao.disabled = true;
        salvarEdicao.textContent = "Salvando...";

        try {

            // Atualizar informações principais do filme.

            const { error: erroFilme } = await supabaseClient
                .from("filmes")
                .update({
                    titulo,
                    ano: ano ? Number(ano) : null,
                    genero: editarGenero.value,
                    poster: editarPoster.value.trim() || null,
                    data_sessao: editarData.value || null,
                    local: editarCinema.value.trim() || null,
                    tipo: editarTipo.value || null,
                    comentario: editarComentario.value.trim() || null
                })
                .eq("id", filmeId);

            if (erroFilme) throw erroFilme;

            // Atualizar as duas avaliações.

            await salvarAvaliacao(filmeId, "Pessoa 1", nota1);
            await salvarAvaliacao(filmeId, "Pessoa 2", nota2);

            fecharModalEdicao();

            await carregarFilmes();

            alert("Filme atualizado com sucesso! 💜");

        } catch (erro) {

            console.error("Erro ao atualizar filme:", erro);

            alert(
                "Ocorreu um erro ao salvar as alterações. " +
                "Verifique sua conexão e tente novamente. " +
                "Se o filme já foi atualizado, confira também as avaliações."
            );

            salvarEdicao.disabled = false;
            salvarEdicao.textContent = "💜 Salvar alterações";
        }
    });

    // ==========================================
    // EXCLUIR FILME
    // ==========================================

    listaFilmes.addEventListener("click", async evento => {

        // Verificar edição.

        const botaoEditar = evento.target.closest(".edit-film-button");

        if (botaoEditar) {

            const id = botaoEditar.dataset.id;

            const filme = filmes.find(
                item => String(item.id) === id
            );

            if (filme) {
                abrirModal(filme);
            }

            return;
        }

        // Verificar exclusão.

        const botao = evento.target.closest(".delete-film-button");

        if (!botao) return;

        const id = botao.dataset.id;

        const filme = filmes.find(
            item => String(item.id) === id
        );

        if (!filme) return;

        const confirmar = confirm(
            `Deseja realmente excluir "${filme.titulo}"?\n\n` +
            "Essa ação não poderá ser desfeita."
        );

        if (!confirmar) return;

        botao.disabled = true;
        botao.textContent = "Excluindo...";

        const { error } = await supabaseClient
            .from("filmes")
            .delete()
            .eq("id", id);

        if (error) {

            console.error("Erro ao excluir filme:", error);

            alert("Não foi possível excluir o filme.");

            botao.disabled = false;
            botao.textContent = "Excluir filme";

            return;
        }

        alert("Filme excluído com sucesso!");

        await carregarFilmes();
    });

    // ==========================================
    // EVENTOS DOS FILTROS
    // ==========================================

    pesquisaFilmes.addEventListener("input", renderizarFilmes);

    filtroGenero.addEventListener("change", renderizarFilmes);

    ordenacaoFilmes.addEventListener("change", renderizarFilmes);

    // ==========================================
    // INICIALIZAR
    // ==========================================

    await carregarFilmes();

});