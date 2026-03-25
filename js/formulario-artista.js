import { supabase } from './supabase-config.js';

// ============================================================================
// CONFIGURAÇÕES GERAIS
// ============================================================================
const GOOGLE_CLIENT_ID = "130491079643-5sp71k2uuugqo9i87g9nrk622u6t6v7f.apps.googleusercontent.com"; 
const GAS_URL = "https://script.google.com/macros/s/AKfycbwLfdrcRFo3kj5rDh2RF54p2wb6aus7t2NjcMU4Ie-CWXH0tTk1THgx-_RzGHCXCcN5/exec";
const TAMANHO_PEDACO = 5 * 1024 * 1024; 
const TEMPO_SESSAO_MS = 30 * 60 * 1000; 

// ============================================================================
// SISTEMA DE LOGIN GOOGLE (FRONT-END)
// ============================================================================
const telaLogin = document.getElementById('tela-login');
const mainContent = document.getElementById('main-content');
let timerExpiracao;
let googleInicializado = false; 

window.handleCredentialResponse = function(response) {
    if (response.credential) {
        localStorage.setItem('polymusic_login_time', Date.now().toString());
        verificarSessao();
    }
};

function carregarBotaoGoogle() {
    if (window.google && window.google.accounts && !googleInicializado) {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById("buttonDiv"),
            { theme: "outline", size: "large", text: "continue_with", width: 280 } 
        );
        googleInicializado = true;
    }
}

function verificarSessao() {
    const loginTime = localStorage.getItem('polymusic_login_time');
    if (loginTime) {
        const tempoPassado = Date.now() - parseInt(loginTime);
        if (tempoPassado < TEMPO_SESSAO_MS) {
            telaLogin.classList.add('hidden');
            mainContent.classList.remove('hidden');
            clearTimeout(timerExpiracao);
            timerExpiracao = setTimeout(encerrarSessao, TEMPO_SESSAO_MS - tempoPassado);
            return;
        }
    }
    mostrarTelaLogin();
}

function encerrarSessao() {
    localStorage.removeItem('polymusic_login_time');
    mostrarTelaLogin();
    alert("⏳ Sua sessão expirou. Por favor, faça login novamente.");
}

function mostrarTelaLogin() {
    telaLogin.classList.remove('hidden');
    mainContent.classList.add('hidden');
    clearTimeout(timerExpiracao);
    carregarBotaoGoogle();
}

window.onload = () => setTimeout(verificarSessao, 500);


// ============================================================================
// LÓGICA DE INTERFACE (DOM) - FAIXAS E METADADOS
// ============================================================================
const formatoSelect = document.getElementById('formato-projeto');
const containerFaixas = document.getElementById('container-faixas');
const btnAddFaixa = document.getElementById('btn-add-faixa');

const containerProdutores = document.getElementById('container-produtores');
const btnAddProdutor = document.getElementById('btn-add-produtor');
const containerMusicos = document.getElementById('container-musicos');
const btnAddMusico = document.getElementById('btn-add-musico');

// Mini-formulário de Participantes DENTRO da faixa (Autores, Interpretes, Feats)
function criarParticipanteFaixa() {
    const div = document.createElement('div');
    div.className = 'grid grid-cols-1 md:grid-cols-12 gap-2 bg-zinc-950/40 p-2 rounded-lg border border-zinc-700/30 participante-faixa-item mt-2';
    div.innerHTML = `
        <div class="md:col-span-4">
            <input type="text" required placeholder="Nome Completo" class="input-nome-completo input-dark w-full px-2 py-1.5 rounded text-xs">
        </div>
        <div class="md:col-span-4">
            <input type="text" required placeholder="Nome Artístico" class="input-nome-artistico input-dark w-full px-2 py-1.5 rounded text-xs">
        </div>
        <div class="md:col-span-3">
            <select class="input-papel-participante input-dark w-full px-2 py-1.5 rounded text-xs">
                <option value="AUTOR">Compositor / Autor</option>
                <option value="INTERPRETE">Intérprete Principal</option>
                <option value="FEAT">Participação (Feat)</option>
            </select>
        </div>
        <div class="md:col-span-1 flex items-center justify-center">
            <button type="button" class="text-red-400 hover:text-red-300 text-lg font-bold btn-remover-elemento" title="Remover">&times;</button>
        </div>
    `;
    return div;
}

// Criação do Card da Faixa
function criarCardFaixa(index) {
    const div = document.createElement('div');
    div.className = 'p-5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl space-y-4 faixa-item relative';
    
    div.innerHTML = `
        <div class="flex justify-between items-center border-b border-zinc-800 pb-2">
            <h3 class="font-bold text-indigo-400">Faixa ${index}</h3>
            ${index > 1 ? `<button type="button" class="text-red-400 text-xs font-bold btn-remover-elemento hover:text-red-300">Remover Faixa</button>` : ''}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Título da Faixa (Obrigatório)</label>
                <input type="text" required class="input-titulo-faixa input-dark w-full px-3 py-2 rounded-lg">
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Arquivo de Áudio</label>
                <input type="file" accept="audio/*" class="input-arquivo-faixa w-full text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:text-indigo-300">
            </div>
        </div>

        <div class="bg-zinc-800/30 p-3 rounded-xl border border-zinc-700/30">
            <div class="flex justify-between items-center mb-2">
                <label class="block text-xs font-semibold text-zinc-300">Autores, Intérpretes e Feats (Desta Faixa)</label>
                <button type="button" class="btn-add-participante-faixa text-[10px] bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded transition">+ Adicionar Pessoa</button>
            </div>
            <div class="container-participantes-faixa space-y-2">
                </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Letra da Música</label>
                <textarea class="input-letra-faixa input-dark w-full px-3 py-2 rounded-lg h-20 resize-none" placeholder="Cole a letra oficial aqui..."></textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Hook TikTok (MM:SS) - Opcional</label>
                <input type="text" class="input-hook-faixa input-dark w-full px-3 py-2 rounded-lg" placeholder="Ex: 01:15">
            </div>
        </div>
    `;

    // Adiciona o primeiro participante vazio por padrão como "AUTOR"
    const containerParts = div.querySelector('.container-participantes-faixa');
    containerParts.appendChild(criarParticipanteFaixa());

    return div;
}

function atualizarInterfaceFaixas() {
    if (formatoSelect.value === 'Single') {
        containerFaixas.innerHTML = '';
        containerFaixas.appendChild(criarCardFaixa(1));
        btnAddFaixa.classList.add('hidden');
    } else {
        btnAddFaixa.classList.remove('hidden');
    }
}

btnAddFaixa.addEventListener('click', () => {
    containerFaixas.appendChild(criarCardFaixa(containerFaixas.querySelectorAll('.faixa-item').length + 1));
});


// Músicos e Produtores (Gerais do Projeto)
function criarCardPessoa(tipo) {
    const isProdutor = tipo === 'produtor';
    const placeholderPapel = isProdutor ? "Papel (Ex: Produtor Musical, Mixagem)" : "Instrumento (Ex: Bateria, Baixo)";
    const div = document.createElement('div');
    div.className = `grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50 ${tipo}-item`;
    
    div.innerHTML = `
        <div class="md:col-span-4">
            <input type="text" required placeholder="Nome Completo" class="input-nome-completo input-dark w-full px-3 py-2 rounded-lg text-sm">
        </div>
        <div class="md:col-span-4">
            <input type="text" required placeholder="Nome Artístico" class="input-nome-artistico input-dark w-full px-3 py-2 rounded-lg text-sm">
        </div>
        <div class="md:col-span-3">
            <input type="text" placeholder="${placeholderPapel}" class="input-papel-pessoa input-dark w-full px-3 py-2 rounded-lg text-sm">
        </div>
        <div class="md:col-span-1 flex items-center justify-center">
            <button type="button" class="text-red-400 hover:text-red-300 text-xl font-bold btn-remover-elemento" title="Excluir">&times;</button>
        </div>
    `;
    return div;
}

btnAddProdutor.addEventListener('click', () => containerProdutores.appendChild(criarCardPessoa('produtor')));
btnAddMusico.addEventListener('click', () => containerMusicos.appendChild(criarCardPessoa('musico')));

// Delegação de Eventos para botões gerados dinamicamente
document.addEventListener('click', (e) => {
    // Adicionar Participante na Faixa
    if (e.target.classList.contains('btn-add-participante-faixa')) {
        const container = e.target.closest('.bg-zinc-800\\/30').querySelector('.container-participantes-faixa');
        container.appendChild(criarParticipanteFaixa());
    }
    // Remover qualquer elemento dinâmico (Faixa, Músico, Autor, etc)
    if (e.target.classList.contains('btn-remover-elemento')) {
        const isFaixa = e.target.closest('.faixa-item');
        e.target.closest('div[class*="-item"]').remove();
        if (isFaixa) {
            document.querySelectorAll('.faixa-item h3').forEach((h3, i) => h3.textContent = `Faixa ${i + 1}`);
        }
    }
});

atualizarInterfaceFaixas();
containerProdutores.appendChild(criarCardPessoa('produtor'));
containerMusicos.appendChild(criarCardPessoa('musico'));
formatoSelect.addEventListener('change', atualizarInterfaceFaixas);


// ============================================================================
// FUNÇÕES DE BANCO (SUPABASE) E GOOGLE DRIVE
// ============================================================================
async function obterOuCriarPessoa(nomeCompleto, nomeArtistico) {
    if (!nomeCompleto || nomeCompleto.trim() === '') return null;
    const { data: pessoaExistente } = await supabase.from('pessoas').select('id').eq('nome_completo', nomeCompleto.trim()).maybeSingle();
    if (pessoaExistente) return pessoaExistente.id;
    const { data: novaPessoa, error } = await supabase.from('pessoas').insert({ nome_completo: nomeCompleto.trim(), nome_artistico: nomeArtistico ? nomeArtistico.trim() : null }).select('id').single();
    if (error) throw new Error("Erro ao criar pessoa: " + error.message);
    return novaPessoa.id;
}

async function verificarProjetoDuplicado(nomeProjeto, artistaPrincipal) {
    const { data } = await supabase.from('projetos').select('id').ilike('nome_projeto', nomeProjeto).ilike('titulo', artistaPrincipal).maybeSingle();
    return data !== null;
}

function atualizarProgresso(porcentagem, texto) {
    document.getElementById('barra-progresso').style.width = `${porcentagem}%`;
    if (texto) document.getElementById('texto-status').textContent = texto;
}

async function fazerUploadDrive(arquivo, nomeProjeto, inicioProgressoGeral, fimProgressoGeral) {
    const payloadInfo = { fileName: arquivo.name, mimeType: arquivo.type || 'application/octet-stream', fileSize: arquivo.size, projectName: nomeProjeto };
    const resPasse = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payloadInfo) });
    const dadosPasse = await resPasse.json();
    if (dadosPasse.status !== 'success') throw new Error("Falha ao autorizar Drive");
    
    const urlUpload = dadosPasse.uploadUrl;
    const tamanhoTotal = arquivo.size;
    let inicio = 0;

    while (inicio < tamanhoTotal) {
        const fim = Math.min(inicio + TAMANHO_PEDACO, tamanhoTotal);
        const pedaco = arquivo.slice(inicio, fim);
        const headers = { 'Content-Range': `bytes ${inicio}-${fim - 1}/${tamanhoTotal}` };

        const resposta = await fetch(urlUpload, { method: 'PUT', headers: headers, body: pedaco });
        if (!resposta.ok && resposta.status !== 308) throw new Error("Erro no envio do pedaço.");
        
        inicio = fim;
        const progressoArquivo = (inicio / tamanhoTotal);
        const progressoReal = inicioProgressoGeral + (progressoArquivo * (fimProgressoGeral - inicioProgressoGeral));
        atualizarProgresso(progressoReal);
    }
}


// ============================================================================
// ENVIO FINAL (SUBMIT)
// ============================================================================
document.getElementById('form-artista').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearTimeout(timerExpiracao);
    
    const nomeProjeto = document.getElementById('nome-projeto').value.trim();
    const artistaPrincipal = document.getElementById('artista-principal').value.trim();
    const btnEnviar = document.getElementById('btn-enviar');
    btnEnviar.disabled = true;
    
    document.getElementById('area-status').classList.remove('hidden');
    atualizarProgresso(5, 'Verificando dados...');

    try {
        const jaExiste = await verificarProjetoDuplicado(nomeProjeto, artistaPrincipal);
        if (jaExiste) throw new Error(`O projeto "${nomeProjeto}" do artista "${artistaPrincipal}" já existe no sistema.`);

        const arquivoCapa = document.getElementById('arquivo-capa').files[0];
        const faixas = document.querySelectorAll('.faixa-item');
        
        let temAlgumAudio = false;
        faixas.forEach(f => { if (f.querySelector('.input-arquivo-faixa').files[0]) temAlgumAudio = true; });
        
        const dataOculta = new Date();
        dataOculta.setDate(dataOculta.getDate() + (temAlgumAudio ? 30 : 45));
        
        atualizarProgresso(10, 'Criando projeto...');

        // 1. SALVAR PROJETO
        const { data: projeto, error: erroProj } = await supabase.from('projetos').insert({
            nome_projeto: nomeProjeto,
            titulo: artistaPrincipal,
            formato: formatoSelect.value,
            spotify_id: document.getElementById('id-spotify').value.trim() || null,
            apple_music_id: document.getElementById('id-apple').value.trim() || null,
            genero: document.getElementById('genero-projeto').value.trim() || null,
            subgenero: document.getElementById('subgenero-projeto').value.trim() || null,
            backup_url: document.getElementById('backup-url').value.trim() || null,
            release_texto: document.getElementById('release-projeto').value.trim() || null,
            data_lancamento: dataOculta.toISOString().split('T')[0],
            capa_status: arquivoCapa ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM',
            audio_status: temAlgumAudio ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM',
            ja_lancado: false
        }).select('id').single();

        if (erroProj) throw erroProj;
        const projetoId = projeto.id;

        // 2. SALVAR FEAT DO PROJETO
        const featProjeto = document.getElementById('feat-projeto').value.trim();
        if (featProjeto && featProjeto.toLowerCase() !== 'nenhum') {
            const listaFeats = featProjeto.split(',');
            for (let f of listaFeats) {
                if (f.trim()) {
                    const pessoaId = await obterOuCriarPessoa(f.trim(), f.trim());
                    await supabase.from('projeto_participantes').insert({ projeto_id: projetoId, faixa_id: null, pessoa_id: pessoaId, papel: 'FEAT' });
                }
            }
        }

        // 3. SALVAR PRODUTORES E MÚSICOS DO PROJETO
        const equipe = [...document.querySelectorAll('.produtor-item'), ...document.querySelectorAll('.musico-item')];
        for (let membro of equipe) {
            const nc = membro.querySelector('.input-nome-completo').value.trim();
            const na = membro.querySelector('.input-nome-artistico').value.trim();
            const papelInput = membro.querySelector('.input-papel-pessoa').value.trim();
            const tipoPapel = membro.classList.contains('produtor-item') ? 'PRODUTOR' : 'MUSICO';
            
            if (nc) {
                const pessoaId = await obterOuCriarPessoa(nc, na);
                await supabase.from('projeto_participantes').insert({ projeto_id: projetoId, pessoa_id: pessoaId, papel: tipoPapel, instrumento: papelInput });
            }
        }

        // 4. PREPARAR UPLOADS E SALVAR FAIXAS
        let totalArquivosParaUpload = (arquivoCapa ? 1 : 0);
        faixas.forEach(f => { if (f.querySelector('.input-arquivo-faixa').files[0]) totalArquivosParaUpload++; });
        let arquivosEnviados = 0;

        if (arquivoCapa) {
            atualizarProgresso(15, 'Enviando Capa...');
            let pInicio = 15 + ((arquivosEnviados / totalArquivosParaUpload) * 75);
            let pFim = 15 + (((arquivosEnviados + 1) / totalArquivosParaUpload) * 75);
            await fazerUploadDrive(arquivoCapa, nomeProjeto, pInicio, pFim);
            arquivosEnviados++;
        }

        for (let i = 0; i < faixas.length; i++) {
            const f = faixas[i];
            const titulo = f.querySelector('.input-titulo-faixa').value.trim();
            const hook = f.querySelector('.input-hook-faixa').value.trim();
            const letra = f.querySelector('.input-letra-faixa').value.trim();
            const arquivoAudio = f.querySelector('.input-arquivo-faixa').files[0];
            
            // Salva a Faixa
            const { data: faixaSalva, error: erroFaixa } = await supabase.from('projeto_faixas').insert({
                projeto_id: projetoId, 
                numero_faixa: i + 1, 
                titulo: titulo,
                hook_tiktok: hook || null,
                letra: letra || null,
                audio_status: arquivoAudio ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM',
                data_upload_audio: arquivoAudio ? new Date().toISOString() : null
            }).select('id').single();
            
            if (erroFaixa) throw erroFaixa;

            // Salva Autores, Intérpretes e Feats DESTA FAIXA
            const participantesFaixa = f.querySelectorAll('.participante-faixa-item');
            for (let pf of participantesFaixa) {
                const nc = pf.querySelector('.input-nome-completo').value.trim();
                const na = pf.querySelector('.input-nome-artistico').value.trim();
                const papelSelecionado = pf.querySelector('.input-papel-participante').value;
                
                if (nc) {
                    const pessoaId = await obterOuCriarPessoa(nc, na);
                    await supabase.from('projeto_participantes').insert({
                        projeto_id: projetoId, 
                        faixa_id: faixaSalva.id, 
                        pessoa_id: pessoaId, 
                        papel: papelSelecionado 
                    });
                }
            }

            // Upload do Áudio
            if (arquivoAudio) {
                atualizarProgresso(15, `Enviando áudio: ${titulo}...`);
                let pInicio = 15 + ((arquivosEnviados / totalArquivosParaUpload) * 75);
                let pFim = 15 + (((arquivosEnviados + 1) / totalArquivosParaUpload) * 75);
                await fazerUploadDrive(arquivoAudio, nomeProjeto, pInicio, pFim);
                arquivosEnviados++;
            }
        }

        atualizarProgresso(100, 'Tudo salvo com sucesso! 🎉');
        document.getElementById('barra-progresso').classList.replace('bg-indigo-500', 'bg-emerald-500');
        
        setTimeout(() => {
            alert("Lançamento enviado com sucesso! Nosso time já recebeu seu material.");
            window.location.reload();
        }, 2000);

    } catch (erro) {
        console.error(erro);
        document.getElementById('area-status').classList.remove('hidden');
        atualizarProgresso(100, 'Ocorreu um erro.');
        document.getElementById('barra-progresso').classList.replace('bg-indigo-500', 'bg-red-500');
        alert("Falha: " + erro.message);
    } finally {
        document.getElementById('btn-enviar').disabled = false;
        timerExpiracao = setTimeout(encerrarSessao, TEMPO_SESSAO_MS);
    }
});
