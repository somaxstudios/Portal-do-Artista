import { supabase } from './supabase-config.js';

// === CONFIGURAÇÕES ===
const GAS_URL = "https://script.google.com/macros/s/AKfycbwLfdrcRFo3kj5rDh2RF54p2wb6aus7t2NjcMU4Ie-CWXH0tTk1THgx-_RzGHCXCcN5/exec";
const TAMANHO_PEDACO = 5 * 1024 * 1024; 

// === AUTENTICAÇÃO ===
async function verificarSessao() {
    const { data: { session } } = await supabase.auth.getSession();
    const telaLogin = document.getElementById('tela-login');
    const mainContent = document.getElementById('main-content');

    if (session) {
        telaLogin.classList.add('hidden');
        mainContent.classList.remove('hidden');
    } else {
        telaLogin.classList.remove('hidden');
        mainContent.classList.add('hidden');
    }
}

document.getElementById('btn-login-google').addEventListener('click', async () => {
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
    });
});

verificarSessao();
supabase.auth.onAuthStateChange(() => verificarSessao());


// === DOM ELEMENTS ===
const formatoSelect = document.getElementById('formato-projeto');
const containerFaixas = document.getElementById('container-faixas');
const btnAddFaixa = document.getElementById('btn-add-faixa');

const containerProdutores = document.getElementById('container-produtores');
const btnAddProdutor = document.getElementById('btn-add-produtor');

const containerMusicos = document.getElementById('container-musicos');
const btnAddMusico = document.getElementById('btn-add-musico');

// === LÓGICA DE FAIXAS (S/ Release aqui) ===
function criarCardFaixa(index) {
    const div = document.createElement('div');
    div.className = 'p-5 bg-zinc-900/50 border border-zinc-700/50 rounded-xl space-y-4 faixa-item relative';
    div.innerHTML = `
        <div class="flex justify-between items-center border-b border-zinc-800 pb-2">
            <h3 class="font-bold text-indigo-400">Faixa ${index}</h3>
            ${index > 1 ? `<button type="button" class="text-red-400 text-xs font-bold btn-remover-faixa hover:text-red-300">Remover</button>` : ''}
        </div>
        
        <div>
            <label class="block text-xs font-semibold text-zinc-400 mb-1">Título da Faixa (Obrigatório)</label>
            <input type="text" required class="input-titulo-faixa input-dark w-full px-3 py-2 rounded-lg">
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Intérpretes da Faixa</label>
                <input type="text" class="input-interpretes-faixa input-dark w-full px-3 py-2 rounded-lg" placeholder="Quem canta nesta faixa">
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Compositores / Autores</label>
                <input type="text" class="input-autores-faixa input-dark w-full px-3 py-2 rounded-lg" placeholder="Separados por vírgula">
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Hook TikTok (MM:SS)</label>
                <input type="text" class="input-hook-faixa input-dark w-full px-3 py-2 rounded-lg" placeholder="Ex: 01:15">
            </div>
            <div>
                <label class="block text-xs font-semibold text-zinc-400 mb-1">Arquivo de Áudio</label>
                <input type="file" accept="audio/*" class="input-arquivo-faixa w-full text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:text-indigo-300">
            </div>
        </div>
    `;
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
    const qtd = containerFaixas.querySelectorAll('.faixa-item').length + 1;
    containerFaixas.appendChild(criarCardFaixa(qtd));
});

containerFaixas.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remover-faixa')) {
        e.target.closest('.faixa-item').remove();
        document.querySelectorAll('.faixa-item h3').forEach((h3, i) => h3.textContent = `Faixa ${i + 1}`);
    }
});


// === LÓGICA DE PRODUTORES E MÚSICOS (Separados) ===
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
            <button type="button" class="text-red-400 hover:text-red-300 text-xl font-bold btn-remover-pessoa" title="Excluir">&times;</button>
        </div>
    `;
    return div;
}

btnAddProdutor.addEventListener('click', () => containerProdutores.appendChild(criarCardPessoa('produtor')));
btnAddMusico.addEventListener('click', () => containerMusicos.appendChild(criarCardPessoa('musico')));

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remover-pessoa')) {
        e.target.closest('div[class*="-item"]').remove();
    }
});

// INITIAL SETUP
atualizarInterfaceFaixas();
containerProdutores.appendChild(criarCardPessoa('produtor'));
containerMusicos.appendChild(criarCardPessoa('musico'));
formatoSelect.addEventListener('change', atualizarInterfaceFaixas);


// === FUNÇÕES DE BANCO E DRIVE ===
async function obterOuCriarPessoa(nomeCompleto, nomeArtistico) {
    if (!nomeCompleto || nomeCompleto.trim() === '') return null;
    
    const { data: pessoaExistente } = await supabase
        .from('pessoas')
        .select('id')
        .eq('nome_completo', nomeCompleto.trim())
        .maybeSingle();
        
    if (pessoaExistente) return pessoaExistente.id;

    const { data: novaPessoa, error } = await supabase
        .from('pessoas')
        .insert({ 
            nome_completo: nomeCompleto.trim(),
            nome_artistico: nomeArtistico ? nomeArtistico.trim() : null
        })
        .select('id')
        .single();
        
    if (error) throw new Error("Erro ao criar pessoa: " + error.message);
    return novaPessoa.id;
}

async function verificarProjetoDuplicado(nomeProjeto, artistaPrincipal) {
    const { data } = await supabase
        .from('projetos')
        .select('id')
        .ilike('nome_projeto', nomeProjeto)
        .ilike('titulo', artistaPrincipal)
        .maybeSingle();
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


// === SUBMIT PRINCIPAL ===
document.getElementById('form-artista').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nomeProjeto = document.getElementById('nome-projeto').value.trim();
    const artistaPrincipal = document.getElementById('artista-principal').value.trim();
    const featProjeto = document.getElementById('feat-projeto').value.trim();
    const releaseProjeto = document.getElementById('release-projeto').value.trim();
    
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
        
        const statusCapa = arquivoCapa ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM';
        const statusAudioProjeto = temAlgumAudio ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM';

        atualizarProgresso(10, 'Criando projeto...');

        // 1. SALVAR PROJETO (AGORA COM O RELEASE GERAL)
        const { data: projeto, error: erroProj } = await supabase
            .from('projetos')
            .insert({
                nome_projeto: nomeProjeto,
                titulo: artistaPrincipal,
                formato: formatoSelect.value,
                genero: document.getElementById('genero-projeto').value.trim() || null,
                subgenero: document.getElementById('subgenero-projeto').value.trim() || null,
                backup_url: document.getElementById('backup-url').value.trim() || null,
                release_texto: releaseProjeto || null, // Release salvo aqui
                data_lancamento: dataOculta.toISOString().split('T')[0],
                capa_status: statusCapa,
                audio_status: statusAudioProjeto,
                ja_lancado: false
            })
            .select('id')
            .single();

        if (erroProj) throw erroProj;
        const projetoId = projeto.id;

        // 2. SALVAR FEATS
        if (featProjeto && featProjeto.toLowerCase() !== 'nenhum') {
            const listaFeats = featProjeto.split(',');
            for (let f of listaFeats) {
                if (f.trim()) {
                    const pessoaId = await obterOuCriarPessoa(f.trim(), f.trim());
                    await supabase.from('projeto_participantes').insert({
                        projeto_id: projetoId, faixa_id: null, pessoa_id: pessoaId, papel: 'FEAT'
                    });
                }
            }
        }

        // 3. SALVAR PRODUTORES (PAPEL: PRODUTOR)
        const produtores = document.querySelectorAll('.produtor-item');
        for (let p of produtores) {
            const nc = p.querySelector('.input-nome-completo').value.trim();
            const na = p.querySelector('.input-nome-artistico').value.trim();
            const papel = p.querySelector('.input-papel-pessoa').value.trim();
            if (nc) {
                const pessoaId = await obterOuCriarPessoa(nc, na);
                await supabase.from('projeto_participantes').insert({
                    projeto_id: projetoId, pessoa_id: pessoaId, papel: 'PRODUTOR', instrumento: papel
                });
            }
        }

        // 4. SALVAR MÚSICOS (PAPEL: MUSICO)
        const musicos = document.querySelectorAll('.musico-item');
        for (let m of musicos) {
            const nc = m.querySelector('.input-nome-completo').value.trim();
            const na = m.querySelector('.input-nome-artistico').value.trim();
            const inst = m.querySelector('.input-papel-pessoa').value.trim();
            if (nc) {
                const pessoaId = await obterOuCriarPessoa(nc, na);
                await supabase.from('projeto_participantes').insert({
                    projeto_id: projetoId, pessoa_id: pessoaId, papel: 'MUSICO', instrumento: inst
                });
            }
        }

        // 5. UPLOAD CAPA E FAIXAS
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
            const interpretes = f.querySelector('.input-interpretes-faixa').value.trim();
            const autores = f.querySelector('.input-autores-faixa').value.trim();
            const hook = f.querySelector('.input-hook-faixa').value.trim();
            const arquivoAudio = f.querySelector('.input-arquivo-faixa').files[0];
            
            const { data: faixaSalva, error: erroFaixa } = await supabase
                .from('projeto_faixas')
                .insert({
                    projeto_id: projetoId, numero_faixa: i + 1, titulo: titulo,
                    interpretes: interpretes || null, hook_tiktok: hook || null,
                    audio_status: arquivoAudio ? 'EM_ANDAMENTO' : 'AINDA_NAO_TEM',
                    data_upload_audio: arquivoAudio ? new Date().toISOString() : null
                })
                .select('id').single();
            
            if (erroFaixa) throw erroFaixa;

            if (autores) {
                const listaAutores = autores.split(',');
                for (let autor of listaAutores) {
                    if (autor.trim()) {
                        const pessoaId = await obterOuCriarPessoa(autor.trim(), autor.trim());
                        await supabase.from('projeto_participantes').insert({
                            projeto_id: projetoId, faixa_id: faixaSalva.id, pessoa_id: pessoaId, papel: 'AUTOR'
                        });
                    }
                }
            }

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
    }
});