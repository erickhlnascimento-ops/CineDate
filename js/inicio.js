// ==========================================
// CINEDATE - PÁGINA INICIAL
// Integração com Supabase
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

    // ==========================================
    // CARREGAR FILMES DO SUPABASE
    // ==========================================

    async function carregarFilmesInicio() {

        const { data, error } = await supabaseClient
            .from("filmes")
            .select(`
                *,
                avaliacoes (
                    avaliador,
                    nota
                )
            `);

        if (error) {
            console.error("Erro ao carregar filmes:", error);
            mostrarErro();
            return null;
        }

        return data.map(filme => {

            const avaliacao1 = filme.avaliacoes.find(
                item => item.avaliador === "Pessoa 1"
            );

            const avaliacao2 = filme.avaliacoes.find(
                item => item.avaliador === "Pessoa 2"
            );

            return {
                ...filme,

                nota1: avaliacao1
                    ? Number(avaliacao1.nota)
                    : null,

                nota2: avaliacao2
                    ? Number(avaliacao2.nota)
                    : null,

                data: filme.data_sessao,
                cinema: filme.local
            };
        });
    }

    // ==========================================
    // TRATAR ERROS
    // ==========================================

    function mostrarErro() {

        document.getElementById("inicioTotalFilmes").textContent = "—";
        document.getElementById("inicioMediaCasal").textContent = "—";
        document.getElementById("inicioTotalSessoes").textContent = "—";

        document.getElementById("inicioMelhorFilme").textContent =
            "Indisponível";

        document.getElementById("inicioMelhorNota").textContent = "—";

        document.getElementById("inicioRankingFilmes").hidden = true;
        document.getElementById("inicioHistoricoFilmes").hidden = true;

        document.getElementById("inicioRankingVazio").hidden = false;
        document.getElementById("inicioHistoricoVazio").hidden = false;
    }

    // ==========================================
    // VALIDAR NOTAS
    // ==========================================

    function notaValida(valor) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return null;
        }

        const nota = Number(valor);

        return Number.isFinite(nota) && nota >= 0 && nota <= 10
            ? nota
            : null;
    }

    // ==========================================
    // CALCULAR MÉDIA
    // ==========================================

    function mediaFilme(filme) {

        const notas = [
            notaValida(filme.nota1),
            notaValida(filme.nota2)
        ].filter(nota => nota !== null);

        if (notas.length === 0) {
            return null;
        }

        return notas.reduce(
            (soma, nota) => soma + nota,
            0
        ) / notas.length;
    }

    // ==========================================
    // OBTER INFORMAÇÕES
    // ==========================================

    function tituloFilme(filme) {
        return filme.titulo || "Filme sem título";
    }

    function obterDataFilme(filme) {

        const valor = filme.data || filme.criado_em;

        if (!valor) {
            return null;
        }

        // Evita diferenças de fuso horário em datas SQL.

        const partes = String(valor).split("-");

        if (partes.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {

            const data = new Date(
                Number(partes[0]),
                Number(partes[1]) - 1,
                Number(partes[2])
            );

            return Number.isNaN(data.getTime()) ? null : data;
        }

        const data = new Date(valor);

        return Number.isNaN(data.getTime()) ? null : data;
    }

    function escaparHTML(texto) {

        return String(texto ?? "").replace(/[&<>"']/g, caractere => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caractere]);
    }

    function formatarData(data) {

        if (!data) {
            return "Data não informada";
        }

        return data.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
        });
    }

    // ==========================================
    // ORDENAR RANKING
    // ==========================================

    function ordenarRanking(filmes) {

        return filmes
            .map(filme => ({
                filme,
                media: mediaFilme(filme)
            }))
            .filter(item => item.media !== null)
            .sort((a, b) => {

                if (b.media !== a.media) {
                    return b.media - a.media;
                }

                return tituloFilme(a.filme).localeCompare(
                    tituloFilme(b.filme),
                    "pt-BR"
                );
            });
    }

    // ==========================================
    // ATUALIZAR ESTATÍSTICAS
    // ==========================================

    function atualizarEstatisticasInicio(filmes) {

        const total = document.getElementById("inicioTotalFilmes");
        const media = document.getElementById("inicioMediaCasal");
        const sessoes = document.getElementById("inicioTotalSessoes");
        const melhorFilme = document.getElementById("inicioMelhorFilme");
        const melhorNota = document.getElementById("inicioMelhorNota");

        total.textContent = filmes.length;

        const avaliados = ordenarRanking(filmes);

        // Média geral do casal.

        if (avaliados.length > 0) {

            const soma = avaliados.reduce(
                (total, item) => total + item.media,
                0
            );

            media.textContent = (soma / avaliados.length)
                .toFixed(1)
                .replace(".", ",");

        } else {

            media.textContent = "—";
        }

        // Contar datas diferentes de sessões.

        const datas = new Set();

        filmes.forEach(filme => {

            const data = obterDataFilme(filme);

            if (data) {

                datas.add(
                    `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`
                );
            }
        });

        sessoes.textContent = datas.size;

        // Filme favorito.

        if (avaliados.length > 0) {

            const favorito = avaliados[0];

            melhorFilme.textContent =
                tituloFilme(favorito.filme);

            melhorFilme.title =
                tituloFilme(favorito.filme);

            melhorNota.textContent =
                `${favorito.media.toFixed(1).replace(".", ",")} de média`;

        } else {

            melhorFilme.textContent = "Ainda não avaliado";
            melhorFilme.title = "";
            melhorNota.textContent = "Sem notas";
        }
    }

    // ==========================================
    // RENDERIZAR RANKING
    // ==========================================

    function renderizarRankingInicio(filmes) {

        const container = document.getElementById("inicioRankingFilmes");
        const vazio = document.getElementById("inicioRankingVazio");

        const avaliados = ordenarRanking(filmes).slice(0, 4);

        container.replaceChildren();

        if (avaliados.length === 0) {

            container.hidden = true;
            vazio.hidden = false;

            return;
        }

        container.hidden = false;
        vazio.hidden = true;

        avaliados.forEach((item, indice) => {

            const filme = item.filme;

            const cartao = document.createElement("article");

            cartao.className = "movie-card";

            const wrapper = document.createElement("div");

            wrapper.className = "poster-wrapper";

            const imagem = document.createElement("img");

            imagem.className = "movie-poster";
            imagem.alt = `Pôster de ${tituloFilme(filme)}`;
            imagem.loading = "lazy";

            const poster = filme.poster;

            if (poster) {
                imagem.src = poster;
            } else {
                imagem.hidden = true;
            }

            imagem.addEventListener("error", () => {
                imagem.hidden = true;
            }, { once: true });

            const posicao = document.createElement("span");

            posicao.className = indice === 0
                ? "ranking-number first"
                : "ranking-number";

            posicao.textContent =
                String(indice + 1).padStart(2, "0");

            const nota = document.createElement("span");

            nota.className = "movie-rating";

            nota.textContent =
                `★ ${item.media.toFixed(1).replace(".", ",")}`;

            wrapper.append(imagem, posicao, nota);

            const informacoes = document.createElement("div");

            informacoes.className = "movie-info";

            const titulo = document.createElement("h3");

            titulo.textContent = tituloFilme(filme);

            const descricao = document.createElement("p");

            descricao.textContent =
                filme.ano || "Ano não informado";

            const rodape = document.createElement("div");

            rodape.className = "movie-footer";

            const rotulo = document.createElement("span");

            rotulo.textContent = "Nota do casal";

            const notaTexto = document.createElement("span");

            notaTexto.className = "rating-text";

            notaTexto.textContent =
                `${item.media.toFixed(1).replace(".", ",")}/10`;

            rodape.append(rotulo, notaTexto);

            informacoes.append(titulo, descricao, rodape);

            cartao.append(wrapper, informacoes);

            container.appendChild(cartao);
        });
    }

    // ==========================================
    // RENDERIZAR HISTÓRICO
    // ==========================================

    function renderizarHistoricoInicio(filmes) {

        const container = document.getElementById("inicioHistoricoFilmes");
        const vazio = document.getElementById("inicioHistoricoVazio");

        const recentes = [...filmes]
            .sort((a, b) => {

                const dataA = obterDataFilme(a);
                const dataB = obterDataFilme(b);

                if (!dataA && !dataB) return 0;
                if (!dataA) return 1;
                if (!dataB) return -1;

                return dataB.getTime() - dataA.getTime();

            })
            .slice(0, 3);

        container.replaceChildren();

        if (recentes.length === 0) {

            container.hidden = true;
            vazio.hidden = false;

            return;
        }

        container.hidden = false;
        vazio.hidden = true;

        recentes.forEach(filme => {

            const cartao = document.createElement("article");

            cartao.className = "history-card";

            const posterContainer = document.createElement("div");

            posterContainer.className = "history-poster";

            const imagem = document.createElement("img");

            imagem.alt = `Pôster de ${tituloFilme(filme)}`;
            imagem.loading = "lazy";

            if (filme.poster) {
                imagem.src = filme.poster;
            } else {
                imagem.hidden = true;
            }

            imagem.addEventListener("error", () => {
                imagem.hidden = true;
            }, { once: true });

            posterContainer.appendChild(imagem);

            const detalhes = document.createElement("div");

            detalhes.className = "history-details";

            const titulo = document.createElement("h3");

            titulo.textContent = tituloFilme(filme);

            const comentario = document.createElement("p");

            comentario.textContent =
                filme.comentario ||
                "Mais uma história para nossa coleção.";

            const data = document.createElement("span");

            data.className = "history-date";

            data.textContent =
                formatarData(obterDataFilme(filme));

            detalhes.append(titulo, comentario, data);

            const avaliacao = document.createElement("div");

            avaliacao.className = "history-rating";

            const nota = document.createElement("span");

            const media = mediaFilme(filme);

            nota.textContent = media === null
                ? "Sem nota"
                : `★ ${media.toFixed(1).replace(".", ",")}`;

            const legenda = document.createElement("small");

            legenda.textContent = "Nota do casal";

            avaliacao.append(nota, legenda);

            const link = document.createElement("a");

            link.href = "pages/memorias.html";
            link.className = "history-action";
            link.setAttribute("aria-label", "Ver memória");
            link.textContent = "→";

            cartao.append(
                posterContainer,
                detalhes,
                avaliacao,
                link
            );

            container.appendChild(cartao);
        });
    }

    // ==========================================
    // ATUALIZAR PÁGINA INICIAL
    // ==========================================

    async function atualizarInicio() {

        const filmes = await carregarFilmesInicio();

        if (filmes === null) {
            return;
        }

        atualizarEstatisticasInicio(filmes);

        renderizarRankingInicio(filmes);

        renderizarHistoricoInicio(filmes);
    }

    // ==========================================
    // EXECUTAR
    // ==========================================

    await atualizarInicio();

});