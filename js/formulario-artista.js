import { supabase } from './supabase-config.js';

// ============================================================================
// 1. CONFIGURAÇÕES
// ============================================================================
const GOOGLE_CLIENT_ID = "130491079643-5sp71k2uuugqo9i87g9nrk622u6t6v7f.apps.googleusercontent.com";
const GAS_URL = "https://script.google.com/macros/s/AKfycbzkevlfKYBEMGICxcnqzPKeiov1gP30opUfwH0tp0FdxEVQVG0iOOgj6vyLrxDYMJIN/exec";
const TEMPO_SESSAO_MS = 30 * 60 * 1000;

// URL do Google Forms para upload em massa
const GOOGLE_FORMS_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe4iNNJnqX9AQ6OGgQp2WrIv8JEQ9yzTQ_w30oNRgpDEDE-OA/viewform?usp=pp_url";
const FORMS_ENTRY_ID = "entry.58717963";

let timerExpiracao;
let googleInicializado = false;

// Elementos do DOM
const telaLogin = document.getElementById('tela-login');
const mainContent = document.getElementById('main-content');
const formatoSelect = document.getElementById('formato-projeto');
const containerFaixas = document.getElementById('container-faixas');
const btnAddFaixa = document.getElementById('btn-add-faixa');
const containerProdutores = document.getElementById('container-produtores');
const containerMusicos = document.getElementById('container-musicos');

// ============================================================================
// 2. SISTEMA DE LOGIN GOOGLE
// ============================================================================
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

window.onload = () => {
    setTimeout(verificarSessao, 500);
    atualizarInterfaceFaixas();
    // Adiciona uma linha inicial na ficha técnica se estiver vazio
    if (containerProdutores.children.length === 0) document.getElementById('btn-add-produtor').click();
    if (containerMusicos.children.length === 0) document.getElementById('btn-add-musico').click();
};

// ============================================================================
// 3. LÓGICA DE INTERFACE (PESSOAS E FAIXAS)
// ============================================================================

// Função para controlar visibilidade dos campos de upload de áudio e do aviso
function toggleAudioUploadFields() {
    const isSingle = formatoSelect.value === 'SINGLE';
    const audioInputs = document.querySelectorAll('.audio-file-container');
    const avisoMassa = document.getElementById('aviso-upload-massa');
    
    audioInputs.forEach(container => {
        container.classList.toggle('hidden', !isSingle);
    });
    
    if (avisoMassa) {
        avisoMassa.classList.toggle('hidden', isSingle);
    }
}

// Criação de Participantes da Faixa (Autores, Interpretes, Feats)
function criarParticipanteFaixa() {
    const div = document.createElement('div');
    div.className = 'grid grid-cols-1 sm:grid-cols-12 gap-2 bg-zinc-950/40 p-3 rounded-lg border border-zinc-700/30 participante-faixa-item mt-2';
    div.innerHTML = `
        <div class="sm:col-span-4"><input type="text" placeholder="Nome Completo" class="input-nome-completo input-dark w-full px-3 py-2 rounded-lg text-sm"></div>
        <div class="sm:col-span-4"><input type="text" placeholder="Nome Artístico" class="input-nome-artistico input-dark w-full px-3 py-2 rounded-lg text-sm"></div>
        <div class="sm:col-span-3">
            <select class="input-papel-participante input-dark w-full px-3 py-2 rounded-lg text-sm">
                <option value="AUTOR">Autor/Compositor</option>
                <option value="INTERPRETE">Intérprete</option>
                <option value="FEAT">Feat</option>
            </select>
        </div>
        <div class="sm:col-span-1 flex items-center justify-center"><button type="button" class="text-red-400 btn-remover-elemento text-xl">&times;</button></div>
    `;
    return div;
}

function criarCardFaixa(index) {
    const div = document.createElement('div');
    div.className = 'p-4 sm:p-5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl space-y-4 faixa-item';
    div.innerHTML = `
        <div class="flex justify-between items-center border-b border-zinc-800 pb-2">
            <h3 class="font-bold text-indigo-400">Faixa ${index}</h3>
            ${index > 1 ? `<button type="button" class="text-red-400 text-xs btn-remover-elemento">Excluir Faixa</button>` : ''}
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="block text-xs font-semibold text-zinc-400 mb-1">Título da Música</label>
            <input type="text" required class="input-titulo-faixa input-dark w-full px-4 py-2 rounded-xl"></div>
            <div class="audio-file-container">
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Arquivo (Opcional se usar Link)</label>
                <input type="file" accept="audio/*" class="input-arquivo-faixa w-full text-xs text-zinc-400 file:mr-2 file:py-2 file:px-3 file:bg-indigo-500/20 file:text-indigo-300 file:border-0 file:rounded-lg">
            </div>
        </div>
        <div class="bg-zinc-800/30 p-3 rounded-xl border border-zinc-700/30">
            <div class="flex justify-between items-center mb-2"><label class="text-xs font-bold text-zinc-300">CRÉDITOS DA FAIXA</label>
            <button type="button" class="btn-add-participante-faixa text-[10px] bg-zinc-700 px-2 py-1 rounded">+ Pessoa</button></div>
            <div class="container-participantes-faixa space-y-2"></div>
        </div>
        <div><label class="block text-xs font-semibold text-zinc-400 mb-1">Letra</label>
        <textarea class="input-letra-faixa input-dark w-full px-4 py-2 rounded-xl h-24 resize-none"></textarea></div>
    `;
    div.querySelector('.container-participantes-faixa').appendChild(criarParticipanteFaixa());
    return div;
}

function atualizarInterfaceFaixas() {
    if (formatoSelect.value === 'SINGLE') {
        containerFaixas.innerHTML = '';
        containerFaixas.appendChild(criarCardFaixa(1));
        btnAddFaixa.classList.add('hidden');
    } else {
        btnAddFaixa.classList.remove('hidden');
    }
    toggleAudioUploadFields();
}

function criarCardPessoa(tipo) {
    const isProdutor = tipo === 'produtor';
    const div = document.createElement('div');
    div.className = `grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800/50 ${tipo}-item`;
    div.innerHTML = `
        <div class="sm:col-span-4"><input type="text" placeholder="Nome Completo" class="input-nome-completo input-dark w-full px-4 py-2 rounded-xl text-sm"></div>
        <div class="sm:col-span-4"><input type="text" placeholder="Nome Artístico" class="input-nome-artistico input-dark w-full px-4 py-2 rounded-xl text-sm"></div>
        <div class="sm:col-span-3"><input type="text" placeholder="${isProdutor ? 'Papel' : 'Instrumento'}" class="input-papel-pessoa input-dark w-full px-4 py-2 rounded-xl text-sm"></div>
        <div class="sm:col-span-1 flex items-center justify-center"><button type="button" class="text-red-400 btn-remover-elemento text-xl">&times;</button></div>
    `;
    return div;
}

// Listeners de Interface
formatoSelect.addEventListener('change', atualizarInterfaceFaixas);
document.getElementById('btn-add-faixa').addEventListener('click', () => containerFaixas.appendChild(criarCardFaixa(containerFaixas.querySelectorAll('.faixa-item').length + 1)));
document.getElementById('btn-add-produtor').addEventListener('click', () => containerProdutores.appendChild(criarCardPessoa('produtor')));
document.getElementById('btn-add-musico').addEventListener('click', () => containerMusicos.appendChild(criarCardPessoa('musico')));

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-add-participante-faixa')) {
        e.target.closest('.bg-zinc-800\\/30').querySelector('.container-participantes-faixa').appendChild(criarParticipanteFaixa());
    }
    if (e.target.classList.contains('btn-remover-elemento')) {
        const item = e.target.closest('.faixa-item') || e.target.closest('div[class*="-item"]') || e.target.closest('.participante-faixa-item');
        if (item) item.remove();
        document.querySelectorAll('.faixa-item h3').forEach((h3, i) => h3.textContent = `Faixa ${i + 1}`);
    }
});

// ============================================================================
// 4. FUNÇÕES DE UPLOAD (CHUNKED)
// ============================================================================
async function fazerUploadDrive(arquivo, nomeProjeto, progressoBase, progressoRange) {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB
    const totalChunks = Math.ceil(arquivo.size / CHUNK_SIZE);

    const readChunk = (start, end) => {
        return new Promise((resolve, reject) => {
            const blob = arquivo.slice(start, end);
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, arquivo.size);
        const base64Chunk = await readChunk(start, end);

        const payload = {
            fileName: arquivo.name,
            mimeType: arquivo.type || 'application/octet-stream',
            projectName: nomeProjeto,
            chunkIndex: i,
            totalChunks: totalChunks,
            chunkData: base64Chunk
        };

        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Falha ao enviar bloco ${i}: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        if (result.status !== 'success') {
            throw new Error(`Erro no servidor ao enviar bloco ${i}: ${result.message || 'desconhecido'}`);
        }

        const progresso = progressoBase + ((i + 1) / totalChunks) * progressoRange;
        const barra = document.getElementById('barra-progresso');
        if (barra) barra.style.width = `${progresso}%`;
    }
}

// ============================================================================
// 5. FUNÇÕES AUXILIARES DE STATUS E DATAS
// ============================================================================
async function obterOuCriarPessoa(dados) {
    const { nome_completo, nome_artistico } = dados;
    if (!nome_completo && !nome_artistico) return null;
    const busca = (nome_completo || nome_artistico).trim();
    const { data } = await supabase.from('pessoas').select('id').eq('nome_completo', busca).maybeSingle();
    if (data) return data.id;
    const { data: n, error } = await supabase.from('pessoas').insert({ nome_completo: busca, nome_artistico: nome_artistico?.trim() || null }).select('id').single();
    if (error) throw error;
    return n.id;
}

function calcularDataLancamento(teveUploadAudio) {
    const hoje = new Date();
    const dias = teveUploadAudio ? 30 : 50;
    hoje.setDate(hoje.getDate() + dias);
    return hoje.toISOString().split('T')[0];
}

function calcularStatusGeral(teveCapaUpload, teveAudioUpload) {
    return (teveCapaUpload || teveAudioUpload) ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM';
}

// ============================================================================
// 6. SUBMIT (SALVAMENTO NO SUPABASE)
// ============================================================================
document.getElementById('form-artista').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-enviar');
    btn.disabled = true;
    document.getElementById('area-status').classList.remove('hidden');

    try {
        const nomeProj = document.getElementById('nome-projeto').value.trim();
        const artista = document.getElementById('artista-principal').value.trim();
        const linkBackup = document.getElementById('backup-url').value.trim();
        const arquivoCapa = document.getElementById('arquivo-capa').files[0];
        const faixasEls = document.querySelectorAll('.faixa-item');
        const formato = formatoSelect.value;
        const isSingle = formato === 'SINGLE';

        // Verifica se houve upload de áudio (apenas se SINGLE)
        const houveUploadAudio = isSingle ? Array.from(faixasEls).some(el => el.querySelector('.input-arquivo-faixa').files.length > 0) : false;
        const houveUploadCapa = !!arquivoCapa;

        const dataLancamento = calcularDataLancamento(houveUploadAudio);
        const statusGeral = calcularStatusGeral(houveUploadCapa, houveUploadAudio);
        const gen = (document.getElementById('genero-projeto').value + ' / ' + document.getElementById('subgenero-projeto').value).trim();

        // 1. Criar Projeto
        const { data: projeto, error: errP } = await supabase.from('projetos').insert({
            nome_projeto: nomeProj,
            titulo: artista,
            formato: formato,
            genero_subgenero: gen,
            release_texto: document.getElementById('release-projeto').value,
            spotify_id: document.getElementById('id-spotify').value,
            apple_music_id: document.getElementById('id-apple').value,
            backup_url: linkBackup || null,
            data_lancamento: dataLancamento,
            capa_status: houveUploadCapa ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM',
            audio_status: isSingle ? (houveUploadAudio ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM') : 'AGUARDANDO_UPLOAD',
            status_geral: statusGeral
        }).select('id').single();
        if (errP) throw errP;

        // 2. Ficha Técnica (produtores e músicos)
        const equipe = [...document.querySelectorAll('.produtor-item'), ...document.querySelectorAll('.musico-item')];
        for (let el of equipe) {
            const nc = el.querySelector('.input-nome-completo').value;
            const na = el.querySelector('.input-nome-artistico').value;
            if (!nc && !na) continue;
            const pId = await obterOuCriarPessoa({ nome_completo: nc, nome_artistico: na });
            await supabase.from('projeto_participantes').insert({
                projeto_id: projeto.id,
                pessoa_id: pId,
                papel: el.classList.contains('produtor-item') ? 'PRODUTOR_MUSICAL' : 'MUSICO',
                instrumento: el.querySelector('.input-papel-pessoa').value
            });
        }

        // 3. Upload da Capa (se houver)
        if (arquivoCapa) {
            await fazerUploadDrive(arquivoCapa, nomeProj, 0, 30);
            const agora = new Date().toISOString();
            await supabase.from('projetos').update({
                capa_status: 'CONCLUIDO',
                capa_data_inicio: agora,
                capa_data_conclusao: agora
            }).eq('id', projeto.id);
        }

        // 4. Salvar Faixas (e upload dos áudios apenas se SINGLE)
        for (let [i, el] of faixasEls.entries()) {
            const audioFile = isSingle ? el.querySelector('.input-arquivo-faixa').files[0] : null;
            const audioStatus = isSingle ? (audioFile ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM') : 'AGUARDANDO_UPLOAD';

            const { data: faixa, error: errF } = await supabase.from('faixas').insert({
                projeto_id: projeto.id,
                numero_faixa: i + 1,
                titulo: el.querySelector('.input-titulo-faixa').value,
                letra: el.querySelector('.input-letra-faixa').value,
                audio_status: audioStatus
            }).select('id').single();
            if (errF) throw errF;

            // Participantes da Faixa
            const parts = el.querySelectorAll('.participante-faixa-item');
            for (let pEl of parts) {
                const nc = pEl.querySelector('.input-nome-completo').value;
                const na = pEl.querySelector('.input-nome-artistico').value;
                if (!nc && !na) continue;
                const pId = await obterOuCriarPessoa({ nome_completo: nc, nome_artistico: na });
                await supabase.from('projeto_participantes').insert({
                    projeto_id: projeto.id,
                    faixa_id: faixa.id,
                    pessoa_id: pId,
                    papel: pEl.querySelector('.input-papel-participante').value
                });
            }

            // Upload do Áudio (apenas se SINGLE e houver arquivo)
            if (isSingle && audioFile) {
                const progresso = 30 + ((i + 1) / faixasEls.length) * 70;
                await fazerUploadDrive(audioFile, nomeProj, 30, 70);
                const agora = new Date().toISOString();
                await supabase.from('faixas').update({
                    audio_status: 'CONCLUIDO',
                    audio_data_inicio: agora,
                    audio_data_conclusao: agora
                }).eq('id', faixa.id);
            }
        }

        // 5. Atualizar status geral do áudio do projeto (apenas se SINGLE)
        if (isSingle) {
            const { data: faixasDoProjeto, error: buscaErr } = await supabase
                .from('faixas')
                .select('audio_status')
                .eq('projeto_id', projeto.id);
            if (buscaErr) throw buscaErr;
            const statuses = faixasDoProjeto.map(f => f.audio_status);
            const audioStatusProjeto = statuses.length > 0 && statuses.every(s => s === 'CONCLUIDO') ? 'CONCLUIDO' :
                                       statuses.some(s => s === 'EM_ANDAMENTO' || s === 'CONCLUIDO') ? 'EM_ANDAMENTO' :
                                       'AINDA_NAO_TEM';
            await supabase.from('projetos').update({ audio_status: audioStatusProjeto }).eq('id', projeto.id);
        }

        // Após tudo salvo, redirecionar se for EP/ÁLBUM
        if (!isSingle) {
            const formsUrl = `${GOOGLE_FORMS_URL}&${FORMS_ENTRY_ID}=${projeto.id}`;
            window.location.href = formsUrl;
        } else {
            alert('Lançamento enviado com sucesso! 🎉');
            window.location.reload();
        }
    } catch (err) {
        alert('Erro: ' + err.message);
        console.error(err);
    } finally {
        btn.disabled = false;
    }
});
