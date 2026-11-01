// ==========================================
// CINEDATE - RANKING
// Integração com Supabase
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {

    const campeaoTitulo = document.getElementById("campeaoTitulo");
    const campeaoDescricao = document.getElementById("campeaoDescricao");
    const campeaoNota = document.getElementById("campeaoNota");
    const campeaoPoster = document.getElementById("campeaoPoster");

    const totalAvaliados = document.getElementById("totalAvaliados");
    const mediaGeral = document.getElementById("mediaGeral");
    const notaMaisAlta = document.getElementById("notaMaisAlta");

    const podio = document.getElementById("podio");
    const listaRanking = document.getElementById("listaRanking");
    const rankingVazio = document.getElementById("rankingVazio");

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
    // CARREGAR FILMES DO SUPABASE
    // ==========================================

    async function carregarRanking() {

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
            console.error("Erro ao carregar ranking:", error);

            mostrarErro();

            return;
        }

        const filmes = data.map(filme => {

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
                Number.isFinite(nota2) &&
                nota1 >= 1 && nota1 <= 10 &&
                nota2 >= 1 && nota2 <= 10;

            if (!notasValidas) {
                return null;
            }

            return {
                ...filme,
                nota1,
                nota2,
                media: Number(((nota1 + nota2) / 2).toFixed(2)),
                menorNota: Math.min(nota1, nota2)
            };

        }).filter(Boolean);

        iniciarRanking(filmes);
    }

    // ==========================================
    // MOSTRAR ERRO
    // ==========================================

    function mostrarErro() {

        campeaoTitulo.textContent =
            "Não foi possível carregar o ranking.";

        campeaoDescricao.textContent =
            "Verifique sua conexão e tente novamente.";

        campeaoNota.textContent = "—";

        totalAvaliados.textContent = "—";
        mediaGeral.textContent = "—";
        notaMaisAlta.textContent = "—";

        podio.replaceChildren();
        listaRanking.replaceChildren();

        rankingVazio.hidden = false;

        rankingVazio.querySelector("h3").textContent =
            "Erro ao carregar o ranking";

        rankingVazio.querySelector("p").textContent =
            "Não foi possível consultar os dados do Supabase.";
    }

    // ==========================================
    // ORDENAR RANKING
    // ==========================================

    function ordenarRanking(filmes) {

        return filmes.sort((a, b) => {

            if (b.media !== a.media) {
                return b.media - a.media;
            }

            if (b.menorNota !== a.menorNota) {
                return b.menorNota - a.menorNota;
            }

            return String(a.titulo || "").localeCompare(
                String(b.titulo || ""),
                "pt-BR"
            );
        });
    }

    // ==========================================
    // PREPARAR IMAGEM
    // ==========================================

    function criarImagem(url, titulo, classe) {

        const container = document.createElement("div");

        container.className = classe;

        const endereco = String(url || "").trim();

        const urlValida =
            endereco.startsWith("https://") ||
            endereco.startsWith("http://");

        if (!urlValida) {

            container.textContent = "🎬";
            container.classList.add("poster-sem-imagem");

            return container;
        }

        const imagem = document.createElement("img");

        imagem.src = endereco;
        imagem.alt = `Pôster de ${titulo}`;
        imagem.loading = "lazy";
        imagem.referrerPolicy = "no-referrer";

        imagem.addEventListener("error", () => {

            container.replaceChildren();
            container.textContent = "🎬";
            container.classList.add("poster-sem-imagem");

        }, { once: true });

        container.appendChild(imagem);

        return container;
    }

    // ==========================================
    // ATUALIZAR CAMPEÃO
    // ==========================================

    function atualizarCampeao(filmes) {

        if (filmes.length === 0) {

            campeaoTitulo.textContent =
                "Nosso próximo favorito está esperando...";

            campeaoDescricao.textContent =
                "Cadastrem filmes e avaliem cada sessão para descobrir " +
                "qual será o campeão de vocês.";

            campeaoNota.textContent = "—";

            campeaoPoster.replaceChildren();

            const placeholder = document.createElement("div");

            placeholder.className = "champion-poster-placeholder";
            placeholder.textContent = "🎬";

            campeaoPoster.appendChild(placeholder);

            const coroa = document.createElement("div");

            coroa.className = "champion-crown";
            coroa.textContent = "👑";

            campeaoPoster.appendChild(coroa);

            return;
        }

        const campeao = filmes[0];

        campeaoTitulo.textContent =
            campeao.titulo || "Filme sem título";

        campeaoDescricao.textContent =
            `${campeao.nota1}/10 para você e ` +
            `${campeao.nota2}/10 para ela. ` +
            "O favorito do casal, segundo as avaliações de vocês!";

        campeaoNota.textContent = campeao.media.toFixed(1);

        campeaoPoster.replaceChildren();

        const poster = criarImagem(
            campeao.poster,
            campeao.titulo || "Filme",
            "champion-poster"
        );

        const conteudoPoster = poster.firstElementChild;

        if (conteudoPoster) {

            campeaoPoster.appendChild(conteudoPoster);

        } else {

            const placeholder = document.createElement("div");

            placeholder.className = "champion-poster-placeholder";
            placeholder.textContent = "🎬";

            campeaoPoster.appendChild(placeholder);
        }

        const coroa = document.createElement("div");

        coroa.className = "champion-crown";
        coroa.textContent = "👑";

        campeaoPoster.appendChild(coroa);
    }

    // ==========================================
    // ESTATÍSTICAS
    // ==========================================

    function atualizarEstatisticas(filmes) {

        totalAvaliados.textContent = filmes.length;

        if (filmes.length === 0) {

            mediaGeral.textContent = "—";
            notaMaisAlta.textContent = "—";

            return;
        }

        const soma = filmes.reduce(
            (total, filme) => total + filme.media,
            0
        );

        mediaGeral.textContent =
            (soma / filmes.length).toFixed(1);

        const maiorNota = Math.max(
            ...filmes.map(filme => filme.media)
        );

        notaMaisAlta.textContent =
            maiorNota.toFixed(1);
    }

    // ==========================================
    // CARTÃO DO PÓDIO
    // ==========================================

    function criarCartaoPodio(filme, posicao) {

        const classes = [
            "first-place",
            "second-place",
            "third-place"
        ];

        const medalhas = ["🥇", "🥈", "🥉"];

        const cartao = document.createElement("article");

        cartao.className =
            `podium-card ${classes[posicao]}`;

        const poster = criarImagem(
            filme.poster,
            filme.titulo || "Filme",
            "podium-poster"
        );

        const ano = filme.ano
            ? String(filme.ano)
            : "Ano não informado";

        cartao.innerHTML = `
            <div class="podium-position">${medalhas[posicao]}</div>

            <h3>${escaparHTML(filme.titulo || "Filme sem título")}</h3>

            <p class="podium-year">${escaparHTML(ano)}</p>

            <div class="podium-score">
                ${filme.media.toFixed(1)}
                <small>/ 10</small>
            </div>

            <div class="podium-notes">
                <span>Você: ${filme.nota1}/10</span>
                <span>Ela: ${filme.nota2}/10</span>
            </div>
        `;

        const posicaoEl =
            cartao.querySelector(".podium-position");

        const tituloEl = cartao.querySelector("h3");

        tituloEl.before(posicaoEl);

        const anoEl = cartao.querySelector(".podium-year");

        anoEl.before(poster);

        return cartao;
    }

    // ==========================================
    // RENDERIZAR PÓDIO
    // ==========================================

    function renderizarPodio(filmes) {

        podio.replaceChildren();

        filmes.slice(0, 3).forEach((filme, indice) => {

            podio.appendChild(
                criarCartaoPodio(filme, indice)
            );

        });

        if (filmes.length === 0) {

            const mensagem = document.createElement("p");

            mensagem.className = "podium-empty";

            mensagem.textContent =
                "O pódio aparecerá aqui quando vocês cadastrarem filmes.";

            podio.appendChild(mensagem);
        }
    }

    // ==========================================
    // RENDERIZAR TABELA
    // ==========================================

    function renderizarTabela(filmes) {

        listaRanking.replaceChildren();

        rankingVazio.hidden = filmes.length > 0;

        filmes.forEach((filme, indice) => {

            const linha = document.createElement("tr");

            const titulo = escaparHTML(
                filme.titulo || "Filme sem título"
            );

            const ano = filme.ano
                ? escaparHTML(filme.ano)
                : "—";

            const poster = criarImagem(
                filme.poster,
                titulo,
                "ranking-mini-poster"
            );

            linha.innerHTML = `
                <td>
                    <span class="ranking-position">
                        #${indice + 1}
                    </span>
                </td>

                <td>
                    <div class="ranking-movie-cell">

                        <div class="ranking-poster-slot"></div>

                        <div>
                            <span class="ranking-movie-title">
                                ${titulo}
                            </span>

                            <span class="ranking-movie-year">
                                ${ano}
                            </span>
                        </div>

                    </div>
                </td>

                <td>${filme.nota1}/10</td>

                <td>${filme.nota2}/10</td>

                <td class="ranking-average">
                    ${filme.media.toFixed(1)}
                </td>
            `;

            linha.querySelector(".ranking-poster-slot")
                .replaceWith(poster);

            listaRanking.appendChild(linha);
        });
    }

    // ==========================================
    // INICIALIZAR RANKING
    // ==========================================

    function iniciarRanking(filmes) {

        const ranking = ordenarRanking(filmes);

        atualizarCampeao(ranking);
        atualizarEstatisticas(ranking);
        renderizarPodio(ranking);
        renderizarTabela(ranking);
    }

    // ==========================================
    // EXECUTAR
    // ==========================================

    await carregarRanking();

});