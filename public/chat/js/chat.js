const socket = io();
const chat = document.getElementById('chat');
const entradaMensagem = document.getElementById('entradaMensagem');
const botaoEnviar = document.getElementById('botaoEnviar');
const listaUsuarios = document.getElementById('listaUsuarios');

let usuarioAtual = localStorage.getItem('usuarioAtual') || 'Anônimo';
let privateChatWith = null;

entradaMensagem.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && entradaMensagem.value.trim() !== '') {
        enviarMensagem();
    }
});

botaoEnviar.addEventListener('click', () => {
    enviarMensagem();
});

function adicionarMensagem(usuario, mensagem, isPrivate) {
    const containerMensagem = document.createElement('div');
    containerMensagem.classList.add('mensagem-container');

    const fotoPerfil = document.createElement('div');
    fotoPerfil.classList.add('foto-perfil');

    const conteudoMensagem = document.createElement('div');
    conteudoMensagem.classList.add('conteudo-mensagem');

    const nomeUsuarioDiv = document.createElement('div');
    nomeUsuarioDiv.textContent = usuario;
    nomeUsuarioDiv.classList.add('nome-usuario');

    const mensagemDiv = document.createElement('div');
    mensagemDiv.textContent = mensagem;
    mensagemDiv.classList.add('texto-mensagem');

    conteudoMensagem.appendChild(nomeUsuarioDiv);
    conteudoMensagem.appendChild(fotoPerfil);
    conteudoMensagem.appendChild(mensagemDiv);

    containerMensagem.appendChild(conteudoMensagem);

    if (usuario === usuarioAtual) {
        containerMensagem.classList.add('mensagem-propria');
    } else {
        containerMensagem.classList.add('mensagem-outro');
    }

    if (isPrivate) {
        containerMensagem.classList.add('mensagem-privada');
    }

    chat.appendChild(containerMensagem);
    chat.scrollTop = chat.scrollHeight;
}

function enviarMensagem() {
    const usuario = usuarioAtual;
    const mensagem = entradaMensagem.value.trim();
    if (mensagem !== '') {
        fetch('/messages1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user: usuario, message: mensagem, privateChatWith })
        }).then(response => {
            if (response.ok) {
                console.log('Mensagem enviada com sucesso');
                entradaMensagem.value = '';
            } else {
                response.text().then(text => console.error('Erro ao enviar mensagem:', text));
            }
        }).catch(error => {
            console.error('Erro ao enviar mensagem:', error);
        });
    }
}

function carregarUsuarios() {
    const globalChatDiv = document.createElement('div');
    globalChatDiv.classList.add('usuario');
    globalChatDiv.textContent = 'Chat Global';
    globalChatDiv.addEventListener('click', () => {
        privateChatWith = null;
        carregarMensagens();
    });
    listaUsuarios.innerHTML = '';
    listaUsuarios.appendChild(globalChatDiv);

    fetch('/users')
        .then(response => response.json())
        .then(users => {
            users.forEach(user => {
                const userDiv = document.createElement('div');
                userDiv.classList.add('usuario');
                userDiv.textContent = user.email_user;
                userDiv.addEventListener('click', () => {
                    iniciarChatPrivado(user.email_user);
                });
                listaUsuarios.appendChild(userDiv);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar usuários:', error);
        });
}

function iniciarChatPrivado(email) {
    privateChatWith = email;
    carregarMensagens();
}

function iniciarChatPrivado(email) {
    privateChatWith = email;
    carregarMensagens();
}

socket.on('connect', () => {
    console.log('Conectado ao servidor Socket.io');

    fetch('/nomeUsuario')
        .then(response => response.json())
        .then(nome => {
            usuarioAtual = nome;
            localStorage.setItem('usuarioAtual', usuarioAtual);
            console.log('Usuário atual:', usuarioAtual);
        })
        .catch(error => {
            console.error('Erro ao obter o nome do usuário:', error);
            usuarioAtual = 'Anônimo';
        });
});

socket.on('initialMessages', (messages) => {
    console.log('Mensagens iniciais recebidas:', messages);
    messages.reverse().forEach(msg => adicionarMensagem(msg.user, msg.message, msg.privateChatWith !== null));
});

socket.on('chatMessage', (msg) => {
    console.log('Nova mensagem recebida:', msg);
    adicionarMensagem(msg.user, msg.message, msg.privateChatWith !== null);
});

socket.on('disconnect', () => {
    console.log('Desconectado do servidor Socket.io');
});

function carregarMensagens() {
    fetch(`/messages1?privateChatWith=${privateChatWith || ''}`)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(messages => {
            chat.innerHTML = '';
            messages.reverse().forEach(msg => adicionarMensagem(msg.user, msg.message, msg.privateChatWith !== null));
        })
        .catch(error => {
            console.error('Erro ao buscar mensagens:', error);
        });
}

carregarUsuarios();
carregarMensagens();
