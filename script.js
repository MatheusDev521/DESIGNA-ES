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
// BLOCOS SALVOS
// ============================================================
const CHAVE_SALVOS = "designacoesSalvas";
let blocosSalvos = [];
let editandoId = null;

function textoLocais(locais) {
    const nomes = locais.map(l => nomesLocais[l]);
    if (nomes.length <= 1) return nomes.join("");
    return nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1];
}

function persistirSalvos() {
    try { localStorage.setItem(CHAVE_SALVOS, JSON.stringify(blocosSalvos)); } catch (e) { }
}

function carregarSalvos() {
    try { blocosSalvos = JSON.parse(localStorage.getItem(CHAVE_SALVOS)) || []; }
    catch (e) { blocosSalvos = []; }
}

function limparFormulario() {
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

    editandoId = null;
    atualizarLocais();
    atualizarInformativo();
    sincronizarDesignacoes();
}

// ============================================================
// GERAR PDF (usado pelo botão IMPRIMIR e pelos blocos salvos)
// ============================================================
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const URL_BACKEND = "https://designa-es-back-end.onrender.com";

async function baixarPdf(dados, rota = "/gerar-pdf", nomeArquivo = null) {
    try {
        mostrarLoading("Gerando PDF...");

        const response = await fetch(URL_BACKEND + rota, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        });

        if (!response.ok) throw new Error("Erro ao gerar PDF");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        if (nomeArquivo) {
            a.download = nomeArquivo;
        } else {
            const [ano, mes, dia] = dados.semana.split("-");
            const nomeMes = MESES[parseInt(mes) - 1];
            a.download = `Designações - ${dia} de ${nomeMes}.pdf`;
        }

        a.click();
        URL.revokeObjectURL(url);

    } catch (err) {
        alert("ERRO DE CONEXÃO! TENTE NOVAMENTE...");
        console.error(err);
    } finally {
        escondiLoading();
    }
}

function imprimirBlocoSalvo(reg) {
    baixarPdf({
        semana: reg.semana,
        locais: [...reg.locais],
        designacoes: reg.designacoes.map(d => ({ ...d, data: reg.semana, locais: [] }))
    });
}

async function imprimirTodosSalvos() {
    if (blocosSalvos.length === 0) {
        alert("Não há designações salvas para imprimir.");
        return;
    }

    const blocos = [...blocosSalvos]
        .sort((a, b) => a.semana.localeCompare(b.semana))
        .map(reg => ({
            semana: reg.semana,
            locais: [...reg.locais],
            designacoes: reg.designacoes.map(d => ({ ...d }))
        }));

    await baixarPdf({ blocos }, "/gerar-pdf-todos", "Designações - Todas.pdf");
}

function criarBlocoSalvo(reg) {
    const [ano, mes, dia] = reg.semana.split("-");
    const qtd = reg.designacoes.length;

    const det = document.createElement("details");
    det.className = "bloco-salvo";
    det.dataset.id = reg.id;

    const sum = document.createElement("summary");
    const data = document.createElement("span");
    data.className = "bloco-data";
    data.textContent = `📅 ${dia}/${mes}/${ano}`;
    const meta = document.createElement("span");
    meta.className = "bloco-meta";
    meta.textContent = `${textoLocais(reg.locais)} · ${qtd} designaç${qtd === 1 ? "ão" : "ões"}`;
    sum.append(data, meta);

    const corpo = document.createElement("div");
    corpo.className = "bloco-corpo";

    const ul = document.createElement("ul");
    reg.designacoes.forEach(d => {
        const li = document.createElement("li");

        li.append(`${d.numero ? d.numero + " - " : ""}${d.parte || "Sem tipo"}: `);

        const nome = document.createElement("strong");
        nome.textContent = d.nome;
        li.appendChild(nome);

        if (d.ajudante) {
            li.append(" (ajudante: ");
            const ajudante = document.createElement("strong");
            ajudante.textContent = d.ajudante;
            li.appendChild(ajudante);
            li.append(")");
        }

        ul.appendChild(li);
    });

    const acoes = document.createElement("div");
    acoes.className = "bloco-acoes";

    const btnEditar = document.createElement("button");
    btnEditar.className = "bloco-btn bloco-editar";
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => editarBlocoSalvo(reg));

    const btnExcluir = document.createElement("button");
    btnExcluir.className = "bloco-btn bloco-excluir";
    btnExcluir.textContent = "Excluir";
    btnExcluir.addEventListener("click", () => excluirBlocoSalvo(reg));

    acoes.append(btnEditar, btnExcluir);
    corpo.append(ul, acoes);
    det.append(sum, corpo);

    // Wrapper com o botão de imprimir que surge ao lado direito (hover)
    const wrap = document.createElement("div");
    wrap.className = "bloco-salvo-wrap";

    const lateral = document.createElement("div");
    lateral.className = "bloco-salvo-acoes";

    const btnImprimir = document.createElement("button");
    btnImprimir.className = "btn-imprimir-bloco";
    btnImprimir.title = "Imprimir esta data";
    btnImprimir.innerHTML = `
        <svg viewBox="0 0 83.806 83.806" xmlns="http://www.w3.org/2000/svg">
            <path d="M73.908,13.162h-5.381V8.784c0-3.936-3.202-7.139-7.138-7.139H22.416c-3.937,0-7.139,3.203-7.139,7.139v4.378H9.898 C4.44,13.162,0,17.601,0,23.058v32.271c0,5.458,4.44,9.898,9.898,9.898h5.379v9.795c0,3.937,3.202,7.139,7.139,7.139h38.973 c3.936,0,7.138-3.202,7.138-7.139v-9.795h5.381c5.458,0,9.898-4.44,9.898-9.898v-32.27C83.806,17.602,79.366,13.162,73.908,13.162z M21.278,8.784c0-0.628,0.511-1.139,1.139-1.139H61.39c0.627,0,1.138,0.511,1.138,1.139v19.451c0,0.627-0.511,1.138-1.138,1.138 H22.416c-0.628,0-1.139-0.51-1.139-1.138V8.784H21.278z M62.527,75.023c0,0.628-0.511,1.139-1.138,1.139H22.416 c-0.628,0-1.139-0.511-1.139-1.139V56.882c0-0.628,0.511-1.139,1.139-1.139h38.973c0.627,0,1.138,0.511,1.138,1.139V75.023z M77.806,55.329c0,2.149-1.749,3.898-3.898,3.898h-5.381v-2.345c0-3.937-3.202-7.139-7.138-7.139H22.416 c-3.937,0-7.139,3.202-7.139,7.139v2.346H9.898C7.749,59.228,6,57.479,6,55.33V23.059c0-2.148,1.749-3.896,3.898-3.896h5.379v9.073 c0,3.936,3.202,7.138,7.139,7.138h38.973c3.936,0,7.138-3.202,7.138-7.138v-9.074h5.381c2.149,0,3.898,1.748,3.898,3.896V55.329z"></path>
            <rect x="26.5" y="58.852" width="30.882" height="6"></rect>
            <rect x="26.5" y="67.763" width="30.882" height="6"></rect>
        </svg>
    `;
    btnImprimir.addEventListener("click", (e) => {
        e.preventDefault();
        imprimirBlocoSalvo(reg);
    });

    lateral.appendChild(btnImprimir);
    wrap.append(det, lateral);
    return wrap;
}

function renderizarBlocosSalvos() {
    const zona = document.getElementById("blocosSalvos");
    zona.innerHTML = "";
    blocosSalvos.sort((a, b) => a.semana.localeCompare(b.semana));
    blocosSalvos.forEach(reg => zona.appendChild(criarBlocoSalvo(reg)));
    document.getElementById("salvosWrapper").classList.toggle("tem-blocos", blocosSalvos.length > 0);
}

async function excluirBlocoSalvo(reg) {
    const [ano, mes, dia] = reg.semana.split("-");
    const ok = await confirmarAcao(`Tem certeza que deseja excluir as designações do dia ${dia}/${mes}/${ano}?`);
    if (!ok) return;

    blocosSalvos = blocosSalvos.filter(b => b.id !== reg.id);
    if (editandoId === reg.id) editandoId = null;
    persistirSalvos();
    renderizarBlocosSalvos();
}

async function editarBlocoSalvo(reg) {
    const temConteudo = [...document.querySelectorAll(".campo-nome")].some(i => i.value.trim());
    if (temConteudo) {
        const ok = await confirmarAcao("O formulário atual será substituído. Continuar?");
        if (!ok) return;
    }

    limparFormulario();

    document.getElementById("SemanaDesignacao").value = reg.semana;
    ["principal", "salaB", "salaC"].forEach(id => {
        document.getElementById(id).checked = reg.locais.includes(id);
    });

    reg.designacoes.forEach((d, i) => {
        let card;
        if (i === 0) {
            card = document.getElementById("designacao1");
        } else {
            const novo = criarContainerDesignacao();
            const todos = document.querySelectorAll(".container-designacao");
            const ref = todos.length ? todos[todos.length - 1] : document.getElementById("container");
            ref.insertAdjacentElement("afterend", novo);
            card = novo.querySelector(".designacao");
        }
        card.querySelector(".campo-nome").value = d.nome;
        card.querySelector(".campo-ajudante").value = d.ajudante;
        card.querySelector(".campo-parte").value = d.parte;
        card.querySelector(".NumeroParte").value = d.numero;
    });

    atualizarLocais();
    atualizarInformativo();
    sincronizarDesignacoes();
    editandoId = reg.id;

    document.querySelector(".semana-wrapper").scrollIntoView({ behavior: "smooth", block: "start" });
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
                text: `Designação de ${nome} - ${dataFormatada}`
            });
        } else {
            // Fallback: abre a imagem em nova aba para salvar/compartilhar manualmente
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        }

    } catch (err) {
        if (err.name !== "AbortError") {
            alert("ERRO DE CONEXÃO! TENTE NOVAMENTE...");
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

    carregarSalvos();
    renderizarBlocosSalvos();

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

    // IMPRIMIR (na área das designações salvas): gera um único PDF com todos os blocos salvos
    document.getElementById("imprimir").addEventListener("click", async (e) => {
        e.preventDefault();
        await imprimirTodosSalvos();
    });

    document.getElementById("salvar").addEventListener("click", (e) => {
        e.preventDefault();

        dadosFormulario.semana = document.getElementById("SemanaDesignacao").value;
        atualizarLocais();
        sincronizarDesignacoes();

        if (!dadosFormulario.semana) { alert("Informe a data das designações."); return; }
        if (dadosFormulario.locais.length === 0) { alert("Selecione ao menos um local."); return; }
        if (dadosFormulario.designacoes.some(d => !d.nome)) { alert("Preencha o nome em todas as designações."); return; }

        const registro = {
            id: editandoId ?? Date.now(),
            semana: dadosFormulario.semana,
            locais: [...dadosFormulario.locais],
            designacoes: dadosFormulario.designacoes.map(({ numero, nome, ajudante, parte }) =>
                ({ numero, nome, ajudante, parte }))
        };

        const idx = blocosSalvos.findIndex(b => b.id === registro.id);
        if (idx >= 0) blocosSalvos[idx] = registro;
        else blocosSalvos.push(registro);

        persistirSalvos();
        limparFormulario();
        renderizarBlocosSalvos();

        document.querySelector(`.bloco-salvo[data-id="${registro.id}"]`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    document.getElementById("refazer").addEventListener("click", async (e) => {
        e.preventDefault();

        const ok = await confirmarAcao("Tem certeza que deseja Limpar todos os dados preenchidos?");
        if (!ok) return;

        limparFormulario();

        window.scrollTo({ top: 0, behavior: "smooth" });
    });

});