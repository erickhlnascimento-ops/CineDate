const SUPABASE_URL = "https://bavyzurelzrrhccjlkla.supabase.co";

const SUPABASE_KEY = "sb_publishable__Q2IrEk0oJ9jCe2GtezMRQ_887DYKe5";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

console.log("CineDate conectado ao Supabase!");

/*async function testarConexao() {
    const { data, error } = await supabaseClient
        .from("filmes")
        .select("*");

    if (error) {
        console.error("Erro ao consultar filmes:", error.message);
        return;
    }

    console.log("Conexão com o banco funcionando!");
    console.log("Filmes cadastrados:", data);
}

testarConexao();

async function verificarAutenticacao() {

    const { data, error } = await supabaseClient.auth.getSession();

    console.log("Sessão atual:", data.session);

    if (error) {
        console.error("Erro:", error);
    }

    if (!data.session) {
        console.warn("Usuário não está autenticado!");
    } else {
        console.log("Usuário autenticado!");
    }
}

verificarAutenticacao();*/