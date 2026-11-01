// =========================================
// CINEDATE - NOSSAS MEMÓRIAS
// Integração com Supabase
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

    const listaMemorias = document.getElementById("listaMemorias");
    const estadoVazio = document.getElementById("estadoVazio");

    const totalFilmes = document.getElementById("totalFilmes");
    const totalSessoes = document.getElementById("totalSessoes");
    const mediaCasal = document.getElementById("mediaCasal");
    const contadorMemorias = document.getElementById("contadorMemorias");

    // =========================================
    // CARREGAR FILMES DO SUPABASE
    // =========================================

    async function carregarFilmes() {

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
            console.error("Erro ao carregar memórias:", error);
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

    // =========================================
    // MOSTRAR ERRO
    // =========================================

    function mostrarErro() {

        listaMemorias.hidden = true;
        estadoVazio.hidden = false;

        estadoVazio.querySelector("h3").textContent =
            "Não foi possível carregar as memórias";

        estadoVazio.querySelector("p").textContent =
            "Verifique sua conexão e tente novamente.";

        totalFilmes.textContent = "—";
        totalSessoes.textContent = "—";
        mediaCasal.textContent = "—";
        contadorMemorias.textContent = "Erro ao carregar";
    }

    // =========================================
    // ESCAPAR HTML
    // =========================================

    function escaparHTML(valor) {

        return String(valor ?? "").replace(/[&<>"']/g, caractere => {

            const entidades = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entidades[caractere];
        });
    }

    // =========================================
    // FORMATAR DATA
    // =========================================

    function obterData(filme) {

        if (!filme.data) {
            return null;
        }

        // Evita que datas do tipo YYYY-MM-DD
        // apareçam com um dia a menos.

        const partes = String(filme.data).split("-");

        if (partes.length === 3) {

            const ano = Number(partes[0]);
            const mes = Number(partes[1]) - 1;
            const dia = Number(partes[2]);

            const data = new Date(ano, mes, dia);

            if (!Number.isNaN(data.getTime())) {
                return data;
            }
        }

        const data = new Date(filme.data);

        return Number.isNaN(data.getTime())
            ? null
            : data;
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

    // =========================================
    // NOTAS
    // =========================================

    function obterNota(valor) {

        if (
            valor === null ||
            valor === undefined ||
            valor === ""
        ) {
            return null;
        }

        const nota = Number(valor);

        if (
            !Number.isFinite(nota) ||
            nota < 0 ||
            nota > 10
        ) {
            return null;
        }

        return nota;
    }

    function calcularMedia(filme) {

        const nota1 = obterNota(filme.nota1);
        const nota2 = obterNota(filme.nota2);

        const notas = [nota1, nota2].filter(
            nota => nota !== null
        );

        if (notas.length === 0) {
            return null;
        }

        return notas.reduce(
            (soma, nota) => soma + nota,
            0
        ) / notas.length;
    }

    function formatarNota(nota) {

        return nota === null
            ? "Não avaliado"
            : `${nota.toFixed(1)}/10`;
    }

    // =========================================
    // CRIAR PÔSTER
    // =========================================

    function criarPoster(url, titulo) {

        const poster = document.createElement("div");

        poster.className = "memory-poster";

        const endereco = String(url || "").trim();

        if (
            endereco.startsWith("https://") ||
            endereco.startsWith("http://")
        ) {

            const imagem = document.createElement("img");

            imagem.src = endereco;
            imagem.alt = `Pôster de ${titulo}`;
            imagem.loading = "lazy";

            imagem.addEventListener("error", () => {

                poster.replaceChildren();
                poster.textContent = "🎬";

            }, { once: true });

            poster.appendChild(imagem);

        } else {

            poster.textContent = "🎬";
        }

        return poster;
    }

    // =========================================
    // INFORMAÇÕES DO FILME
    // =========================================

    function obterAno(filme) {

        if (filme.ano) {
            return filme.ano;
        }

        const data = obterData(filme);

        return data ? data.getFullYear() : "";
    }

    // =========================================
    // CRIAR CARTÃO DA MEMÓRIA
    // =========================================

    function criarMemoria(filme) {

        const entrada = document.createElement("article");

        entrada.className = "memory-entry";

        const data = obterData(filme);

        const titulo = filme.titulo || "Filme sem título";

        const nota1 = obterNota(filme.nota1);
        const nota2 = obterNota(filme.nota2);

        const media = calcularMedia(filme);

        const cinema = filme.local || "";
        const comentario = filme.comentario || "";
        const ano = obterAno(filme);

        const dataHTML = escaparHTML(formatarData(data));
        const tituloHTML = escaparHTML(titulo);
        const anoHTML = escaparHTML(ano);
        const cinemaHTML = escaparHTML(cinema);
        const comentarioHTML = escaparHTML(comentario);

        entrada.innerHTML = `
            <p class="memory-date">${dataHTML}</p>

            <div class="memory-card">

                <div class="memory-poster">
                    🎬
                </div>

                <div class="memory-content">

                    <div class="memory-title-row">

                        <div>
                            <h3 class="memory-title">
                                ${tituloHTML}
                            </h3>

                            ${anoHTML
                                ? `<p class="memory-year">${anoHTML}</p>`
                                : ""
                            }
                        </div>

                        <div class="memory-average">
                            ${media === null
                                ? "—"
                                : `★ ${media.toFixed(1)}`
                            }
                        </div>

                    </div>

                    <p class="memory-cinema">

                        ${cinemaHTML
                            ? `🍿 ${cinemaHTML}`
                            : "🎬 Uma sessão para guardar na memória"
                        }

                    </p>

                    <div class="memory-notes">

                        <div class="memory-note">

                            <p class="memory-note-label">
                                Sua nota
                            </p>

                            <p class="memory-note-value">
                                ${escaparHTML(formatarNota(nota1))}
                            </p>

                        </div>

                        <div class="memory-note">

                            <p class="memory-note-label">
                                Nota dela
                            </p>

                            <p class="memory-note-value">
                                ${escaparHTML(formatarNota(nota2))}
                            </p>

                        </div>

                    </div>

                    ${comentario
                        ? `
                            <div class="memory-comment">

                                <p class="memory-comment-label">
                                    NOSSA LEMBRANÇA
                                </p>

                                <p>${comentarioHTML}</p>

                            </div>
                        `
                        : ""
                    }

                </div>

            </div>
        `;

        // Inserir pôster real do filme.

        const posterProvisorio =
            entrada.querySelector(".memory-poster");

        const poster = criarPoster(
            filme.poster,
            titulo
        );

        posterProvisorio.replaceWith(poster);

        return entrada;
    }

    // =========================================
    // ATUALIZAR ESTATÍSTICAS
    // =========================================

    function atualizarEstatisticas(filmes) {

        totalFilmes.textContent = filmes.length;

        // Conta datas diferentes de sessões.

        const datasSessoes = new Set();

        filmes.forEach(filme => {

            const data = obterData(filme);

            if (data) {

                datasSessoes.add(
                    `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`
                );
            }
        });

        totalSessoes.textContent = datasSessoes.size;

        // Média das avaliações disponíveis.

        const medias = filmes
            .map(calcularMedia)
            .filter(media => media !== null);

        if (medias.length === 0) {

            mediaCasal.textContent = "—";

        } else {

            const soma = medias.reduce(
                (total, nota) => total + nota,
                0
            );

            mediaCasal.textContent =
                (soma / medias.length).toFixed(1);
        }

        contadorMemorias.textContent =
            `${filmes.length} ${filmes.length === 1
                ? "memória"
                : "memórias"
            }`;
    }

    // =========================================
    // RENDERIZAR LINHA DO TEMPO
    // =========================================

    function renderizarMemorias(filmes) {

        atualizarEstatisticas(filmes);

        listaMemorias.replaceChildren();

        if (filmes.length === 0) {

            listaMemorias.hidden = true;
            estadoVazio.hidden = false;

            return;
        }

        estadoVazio.hidden = true;
        listaMemorias.hidden = false;

        const filmesOrdenados = [...filmes].sort((a, b) => {

            const dataA = obterData(a);
            const dataB = obterData(b);

            if (!dataA && !dataB) {
                return 0;
            }

            if (!dataA) {
                return 1;
            }

            if (!dataB) {
                return -1;
            }

            return dataB.getTime() - dataA.getTime();
        });

        filmesOrdenados.forEach(filme => {

            listaMemorias.appendChild(
                criarMemoria(filme)
            );
        });
    }

    // =========================================
    // INICIALIZAÇÃO
    // =========================================

    const filmes = await carregarFilmes();

    if (filmes !== null) {
        renderizarMemorias(filmes);
    }

});