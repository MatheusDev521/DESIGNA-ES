// ============================================================
// DADOS GLOBAIS
// ============================================================
const dadosFormulario = {
    semana: "",
    locais: [],
    designacoes: []
};

let contadorId = 2;

// ============================================================
// UTILITÁRIOS
// ============================================================

function atualizarLocais() {
    dadosFormulario.locais = [];
    if (document.getElementById("principal").checked) dadosFormulario.locais.push("principal");
    if (document.getElementById("salaB").checked) dadosFormulario.locais.push("salaB");
    if (document.getElementById("salaC").checked) dadosFormulario.locais.push("salaC");
}

function sincronizarDesignacoes() {
    dadosFormulario.semana = document.getElementById("SemanaDesignacao").value;

    dadosFormulario.designacoes = [];
    document.querySelectorAll(".designacao").forEach((bloco) => {
        dadosFormulario.designacoes.push({
            numero: bloco.querySelector(".NumeroParte")?.value?.trim() ?? "",
            nome: bloco.querySelector(".campo-nome")?.value?.trim() ?? "",
            ajudante: bloco.querySelector(".campo-ajudante")?.value?.trim() ?? "",
            parte: bloco.querySelector(".campo-parte")?.value ?? "",
            data: dadosFormulario.semana,
            locais: (() => {
                const ls = [];
                bloco.querySelector(".check-principal")?.checked && ls.push("principal");
                bloco.querySelector(".check-salaB")?.checked && ls.push("salaB");
                bloco.querySelector(".check-salaC")?.checked && ls.push("salaC");
                return ls;
            })()
        });
    });
}

// ============================================================
// INFORMATIVO PRÉVIO
// ============================================================

const nomesLocais = {
    principal: "Salão Principal",
    salaB: "Sala B",
    salaC: "Sala C"
};

function atualizarInformativo() {
    const p = document.getElementById("InformativoPrevio");
    const dataVal = document.getElementById("SemanaDesignacao").value;
    const locaisMarcados = dadosFormulario.locais;

    if (!dataVal && locaisMarcados.length === 0) {
        p.textContent = "";
        p.classList.remove("visivel");
        return;
    }

    let dataFormatada = "";
    if (dataVal) {
        const [ano, mes, dia] = dataVal.split("-");
        dataFormatada = `${dia}/${mes}/${ano}`;
    }

    let locaisTexto = "";
    if (locaisMarcados.length > 0) {
        const nomes = locaisMarcados.map(l => nomesLocais[l]);
        if (nomes.length === 1) {
            locaisTexto = nomes[0];
        } else if (nomes.length === 2) {
            locaisTexto = nomes.join(" e ");
        } else {
            locaisTexto = nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
        }
    }

    if (dataFormatada && locaisTexto) {
        p.innerHTML = `📋 Designações do dia <span style="color: #ce9300;">${dataFormatada}</span> no <span style="color: #ce9300; font-weight: bold;">${locaisTexto}</span>.`;
    } else if (dataFormatada) {
        p.innerHTML = `📋 Designações do dia <span style="color: #ce9300;">${dataFormatada}</span>.`;
    } else {
        p.innerHTML = `📋 Designações no <span style="color: #ce9300; font-weight: bold;">${locaisTexto}</span>.`;
    }

    p.classList.add("visivel");
}

// ============================================================
// CAIXA DE CARREGAMENTO
// ============================================================
function mostrarLoading(texto = "Gerando arquivo, aguarde...") {
    const overlay = document.getElementById("loadingOverlay");
    if (!overlay) return;
    overlay.querySelector("p").textContent = texto;
    overlay.classList.add("ativo");
}

function escondiLoading() {
    document.getElementById("loadingOverlay")?.classList.remove("ativo");
}

// ============================================================
// CAIXA DE CONFIRMAÇÃO
// ============================================================
function confirmarAcao(mensagem) {
    return new Promise((resolve) => {
        const overlay = document.getElementById("confirmOverlay");
        const texto = document.getElementById("confirmMensagem");
        const btnConfirmar = document.getElementById("confirmConfirmar");
        const btnCancelar = document.getElementById("confirmCancelar");

        if (!overlay) { resolve(true); return; }

        texto.textContent = mensagem;
        overlay.classList.add("ativo");

        function limpar(resultado) {
            overlay.classList.remove("ativo");
            btnConfirmar.removeEventListener("click", onConfirmar);
            btnCancelar.removeEventListener("click", onCancelar);
            resolve(resultado);
        }

        function onConfirmar() { limpar(true); }
        function onCancelar() { limpar(false); }

        btnConfirmar.addEventListener("click", onConfirmar);
        btnCancelar.addEventListener("click", onCancelar);
    });
}

function registrarListeners(bloco) {
    bloco.querySelectorAll("input, select").forEach(el => {
        el.addEventListener("input", sincronizarDesignacoes);
        el.addEventListener("change", sincronizarDesignacoes);
    });
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
function inicializarPrimeiroBloco() {
    const bloco = document.getElementById("designacao1");

    bloco.querySelector("#nome").classList.add("campo-nome");
    bloco.querySelector("#ajudante").classList.add("campo-ajudante");
    bloco.querySelector("#parte").classList.add("campo-parte");

    const inputNum = document.getElementById("NumeroParte");
    if (inputNum) {
        inputNum.classList.add("NumeroParte");
        inputNum.removeAttribute("id");
    }

    registrarListeners(bloco);
}

// ============================================================
// COMPARTILHAR DESIGNAÇÃO INDIVIDUAL
// ============================================================
async function compartilharDesignacao(blocoCard) {
    dadosFormulario.semana = document.getElementById("SemanaDesignacao").value;
    atualizarLocais();
    sincronizarDesignacoes();

    console.log("locais:", dadosFormulario.locais);

    const nome = blocoCard.querySelector(".campo-nome")?.value?.trim();
    if (!dadosFormulario.semana) { alert("Informe a data das designações."); return; }
    if (dadosFormulario.locais.length === 0) { alert("Selecione ao menos um local."); return; }
    if (!nome) { alert("Preencha o nome desta designação antes de compartilhar."); return; }

    const [ano, mes, dia] = dadosFormulario.semana.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;

    const payload = {
        semana: dadosFormulario.semana,
        locais: dadosFormulario.locais,
        designacao: {
            numero: blocoCard.querySelector(".NumeroParte")?.value?.trim() ?? "",
            nome,
            ajudante: blocoCard.querySelector(".campo-ajudante")?.value?.trim() ?? "",
            parte: blocoCard.querySelector(".campo-parte")?.value ?? "",
        }
    };

    try {
        mostrarLoading("Gerando imagem...");

        const response = await fetch("https://designa-es-back-end.onrender.com/gerar-png", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Erro ao gerar imagem");

        const blob = await response.blob();
        const file = new File([blob], "designacao.png", { type: "image/png" });

        // Web Share API — funciona no mobile e Chrome desktop moderno
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: "Designação",
                text: `Designação de ${nome} — ${dataFormatada}`
            });
        } else {
            // Fallback: abre a imagem em nova aba para salvar/compartilhar manualmente
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }

    } catch (err) {
        if (err.name !== "AbortError") {
            alert("Não foi possível gerar a imagem. Verifique se o back-end está rodando.");
            console.error(err);
        }
    } finally {
        escondiLoading();
    }
}

// ============================================================
// CRIAR NOVO CONTAINER
// ============================================================
function criarContainerDesignacao() {
    const id = contadorId++;

    const container = document.createElement("div");
    container.classList.add("container-designacao");

    const card = document.createElement("div");
    card.classList.add("designacao");
    card.id = `designacao${id}`;

    card.innerHTML = `
        <h3>DESIGNAÇÃO</h3>
        <form>
            <div class="campo">
                <label>NOME</label>
                <input type="text" class="campo-nome" placeholder="Nome do participante" required>
                <label>AJUDANTE</label>
                <input type="text" class="campo-ajudante" placeholder="Nome do ajudante">
            </div>

            <div class="campo">
                <label>TIPO DA PARTE</label>
                <div class="parte-container">
                    <input type="number" class="NumeroParte" min="1" placeholder="Nº" required>
                    <select class="campo-parte" required>
                        <option value="">Selecione</option>
                        <option>Leitura da Bíblia</option>
                        <option>Iniciando conversas</option>
                        <option>Cultivando o interesse</option>
                        <option>Fazendo discípulos</option>
                        <option>Explicando suas crenças</option>
                        <option>Discurso</option>
                    </select>
                </div>
            </div>
        </form>
    `;

    const botoes = document.createElement("div");
    botoes.classList.add("butoes-clone");
    botoes.innerHTML = `
        <button class="btn-adicionar-clone" title="Adicionar Designação">
            <svg viewBox="0 0 24 24" height="50px" width="50px" xmlns="http://www.w3.org/2000/svg">
                <path stroke-width="1.5" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"></path>
                <path stroke-width="1.5" d="M8 12H16"></path>
                <path stroke-width="1.5" d="M12 16V8"></path>
            </svg>
        </button>
        <button class="btn-excluir-clone" title="Remover esta Designação">
            <svg viewBox="0 0 24 24" height="50px" width="50px" xmlns="http://www.w3.org/2000/svg">
                <path stroke-width="1.5" d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"></path>
                <path stroke-width="1.5" d="M8 12H16"></path>
            </svg>
        </button>
        <button class="btn-compartilhar-clone" title="Compartilhar Designação">
            <svg viewBox="0 0 24 24" height="50px" width="50px" xmlns="http://www.w3.org/2000/svg">
                <circle cx="18" cy="5" r="3" stroke-width="1.5" />
                <circle cx="6" cy="12" r="3" stroke-width="1.5" />
                <circle cx="18" cy="19" r="3" stroke-width="1.5" />
                <path stroke-width="1.5" d="M8.59 13.51L15.42 17.49" />
                <path stroke-width="1.5" d="M15.41 6.51L8.59 10.49" />
            </svg>
        </button>
    `;

    botoes.querySelector(".btn-adicionar-clone").addEventListener("click", (e) => {
        e.preventDefault();
        adicionarDesignacao();
    });

    botoes.querySelector(".btn-excluir-clone").addEventListener("click", (e) => {
        e.preventDefault();
        excluirContainer(container);
    });

    botoes.querySelector(".btn-compartilhar-clone").addEventListener("click", (e) => {
        e.preventDefault();
        compartilharDesignacao(card);
    });

    registrarListeners(card);
    container.appendChild(card);
    container.appendChild(botoes);

    return container;
}

// ============================================================
// ADICIONAR
// ============================================================
function adicionarDesignacao() {
    const novoContainer = criarContainerDesignacao();

    const todosContainers = document.querySelectorAll(".container-designacao");
    if (todosContainers.length > 0) {
        todosContainers[todosContainers.length - 1].insertAdjacentElement("afterend", novoContainer);
    } else {
        document.getElementById("container").insertAdjacentElement("afterend", novoContainer);
    }

    sincronizarDesignacoes();
    novoContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ============================================================
// EXCLUIR
// ============================================================
async function excluirContainer(container) {
    const ok = await confirmarAcao("Tem certeza que deseja remover esta designação?");
    if (!ok) return;

    container.remove();
    sincronizarDesignacoes();
}

async function excluirUltimaDesignacao() {
    const containers = document.querySelectorAll(".container-designacao");
    if (containers.length > 0) {
        const ok = await confirmarAcao("Tem certeza que deseja remover esta designação?");
        if (!ok) return;

        containers[containers.length - 1].remove();
        sincronizarDesignacoes();
        return;
    }
    alert("Deve haver ao menos uma designação.");
}

// ============================================================
// EVENTOS PRINCIPAIS
// ============================================================
document.addEventListener("DOMContentLoaded", () => {

    inicializarPrimeiroBloco();

    document.getElementById("SemanaDesignacao").addEventListener("change", (e) => {
        dadosFormulario.semana = e.target.value;
        sincronizarDesignacoes();
        atualizarInformativo();
    });

    ["principal", "salaB", "salaC"].forEach(id => {
        document.getElementById(id).addEventListener("change", () => {
            atualizarLocais();
            atualizarInformativo();
        });
    });

    document.getElementById("adicionarParte").addEventListener("click", (e) => {
        e.preventDefault();
        adicionarDesignacao();
    });

    document.getElementById("excluir").addEventListener("click", (e) => {
        e.preventDefault();
        excluirUltimaDesignacao();
    });

    document.getElementById("compartilhar").addEventListener("click", (e) => {
        e.preventDefault();
        const bloco = document.getElementById("designacao1");
        compartilharDesignacao(bloco);
    });

    document.getElementById("imprimir").addEventListener("click", async (e) => {
        e.preventDefault();

        dadosFormulario.semana = document.getElementById("SemanaDesignacao").value;
        atualizarLocais();
        sincronizarDesignacoes();

        if (!dadosFormulario.semana) { alert("Informe a data das designações."); return; }
        if (dadosFormulario.locais.length === 0) { alert("Selecione ao menos um local."); return; }
        if (dadosFormulario.designacoes.some(d => !d.nome)) { alert("Preencha o nome em todas as designações."); return; }

        try {
            mostrarLoading("Gerando PDF...");

            const response = await fetch("https://designa-es-back-end.onrender.com/gerar-pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dadosFormulario)
            });

            if (!response.ok) throw new Error("Erro ao gerar PDF");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const [ano, mes, dia] = dadosFormulario.semana.split("-");
            const nomeMes = meses[parseInt(mes) - 1];
            a.download = `Designações - ${dia} de ${nomeMes}.pdf`;

            a.click();
            URL.revokeObjectURL(url);

        } catch (err) {
            alert("Não foi possível conectar ao servidor. Verifique se o back-end está rodando.");
            console.error(err);
        } finally {
            escondiLoading();
        }
    });

    document.getElementById("refazer").addEventListener("click", async (e) => {
        e.preventDefault();

        const ok = await confirmarAcao("Tem certeza que deseja refazer? Todos os dados preenchidos serão perdidos.");
        if (!ok) return;

        document.getElementById("SemanaDesignacao").value = "";
        ["principal", "salaB", "salaC"].forEach(id => {
            document.getElementById(id).checked = false;
        });

        document.querySelectorAll(".container-designacao").forEach(c => c.remove());

        const bloco = document.getElementById("designacao1");
        bloco.querySelector(".campo-nome").value = "";
        bloco.querySelector(".campo-ajudante").value = "";
        bloco.querySelector(".campo-parte").value = "";
        bloco.querySelector(".NumeroParte").value = "";

        atualizarLocais();
        atualizarInformativo();
        sincronizarDesignacoes();

        window.scrollTo({ top: 0, behavior: "smooth" });
    });

});