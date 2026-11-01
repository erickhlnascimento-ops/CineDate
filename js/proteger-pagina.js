document.addEventListener("DOMContentLoaded", async () => {
const { data, error } = await supabaseClient.auth.getSession();


if (error || !data.session) {
    const estaNaPastaPages = window.location.pathname.includes("/pages/");

    const caminhoLogin = estaNaPastaPages
        ? "login.html"
        : "pages/login.html";

    window.location.replace(caminhoLogin);
    return;
}

const logoutButton = document.getElementById("logoutButton");

if (!logoutButton) return;

logoutButton.addEventListener("click", async () => {
    const desejaSair = confirm("Deseja realmente sair da sua conta.");

    if (!desejaSair) return;

    logoutButton.disabled = true;

    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        window.location.replace(
            window.location.pathname.includes("/pages/")
                ? "login.html"
                : "pages/login.html"
        );

    } catch (erro) {
        console.error("Erro ao sair:", erro);
        alert("Não foi possível sair da conta. Tente novamente.");
        logoutButton.disabled = false;
    }
});

});
