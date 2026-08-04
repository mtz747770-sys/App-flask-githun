const datosTexto = JSON.parse(document.getElementById("texto-datos").textContent);
const palabras = datosTexto.split(/\s+/).filter(Boolean);

const contenedorTexto = document.getElementById("texto-prueba");
const entrada = document.getElementById("entrada-usuario");
const marcadorTiempo = document.getElementById("tiempo-restante");
const barraProgreso = document.getElementById("barra-progreso");
const pantallaResultado = document.getElementById("pantalla-resultado");
const valorWpm = document.getElementById("valor-wpm");

const DURACION_SEGUNDOS = 60;

let indiceActual = 0;
let palabrasCorrectas = 0;
let tiempoRestante = DURACION_SEGUNDOS;
let intervalo = null;
let pruebaIniciada = false;
let pruebaTerminada = false;

function obtenerPalabraObjetivo() {
    return palabras[indiceActual] || "";
}

function dibujarTexto() {
    const palabra = obtenerPalabraObjetivo();
    contenedorTexto.innerHTML = palabra
        .split("")
        .map((letra) => `<span class="letra">${letra}</span>`)
        .join("");
}

function actualizarLetrasPalabraActual() {
    const palabraObjetivo = obtenerPalabraObjetivo();
    const letras = contenedorTexto.querySelectorAll(".letra");
    const escrito = entrada.value;

    letras.forEach((letraElemento, indice) => {
        letraElemento.classList.remove("correcta", "incorrecta", "cursor");
        if (indice < escrito.length) {
            letraElemento.classList.add(escrito[indice] === palabraObjetivo[indice] ? "correcta" : "incorrecta");
        } else if (indice === escrito.length) {
            letraElemento.classList.add("cursor");
        }
    });
}

function iniciarCuentaRegresiva() {
    intervalo = setInterval(() => {
        tiempoRestante -= 1;
        marcadorTiempo.textContent = tiempoRestante;
        if (tiempoRestante <= 0) {
            finalizarPrueba();
        }
    }, 1000);
}

function finalizarPrueba() {
    if (pruebaTerminada) {
        return;
    }
    pruebaTerminada = true;

    clearInterval(intervalo);
    entrada.disabled = true;

    const segundosUsados = DURACION_SEGUNDOS - tiempoRestante;
    const minutos = segundosUsados > 0 ? segundosUsados / 60 : 1 / 60;
    const palabrasPorMinuto = Math.round(palabrasCorrectas / minutos);

    valorWpm.textContent = palabrasPorMinuto;
    pantallaResultado.classList.add("visible");

    fetch("/guardar_resultado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ velocidad: palabrasPorMinuto }),
    });
}

function procesarPalabra() {
    const escrita = entrada.value.trim();
    const palabraObjetivo = obtenerPalabraObjetivo();

    if (!palabraObjetivo) {
        return;
    }

    const letras = contenedorTexto.querySelectorAll(".letra");
    letras.forEach((letraElemento, indice) => {
        letraElemento.classList.remove("cursor");
        const correcta = indice < escrita.length && escrita[indice] === palabraObjetivo[indice];
        letraElemento.classList.toggle("correcta", correcta);
        letraElemento.classList.toggle("incorrecta", !correcta);
    });

    const esCorrecta = escrita === palabraObjetivo;
    if (esCorrecta && !contenedorTexto.dataset.contada) {
        palabrasCorrectas += 1;
        contenedorTexto.dataset.contada = "1";
    }

    indiceActual += 1;
    entrada.value = "";
    barraProgreso.style.width = `${(indiceActual / palabras.length) * 100}%`;

    if (indiceActual >= palabras.length) {
        finalizarPrueba();
        return;
    }

    contenedorTexto.removeAttribute("data-contada");
    dibujarTexto();
    actualizarLetrasPalabraActual();
}

function retrocederPalabra() {
    if (indiceActual === 0) {
        return;
    }

    indiceActual -= 1;
    barraProgreso.style.width = `${(indiceActual / palabras.length) * 100}%`;
    dibujarTexto();
    actualizarLetrasPalabraActual();
}

entrada.addEventListener("input", (evento) => {
    if (pruebaTerminada) {
        return;
    }

    if (!pruebaIniciada) {
        pruebaIniciada = true;
        iniciarCuentaRegresiva();
    }

    if (evento.target.value.endsWith(" ")) {
        procesarPalabra();
        return;
    }

    actualizarLetrasPalabraActual();
});

entrada.addEventListener("keydown", (evento) => {
    if (pruebaTerminada) {
        return;
    }

    if (evento.key === "Enter") {
        evento.preventDefault();
        if (entrada.value.trim().length > 0) {
            procesarPalabra();
        }
        return;
    }

    if (evento.key === "Backspace" && entrada.value.length === 0 && indiceActual > 0) {
        evento.preventDefault();
        retrocederPalabra();
    }
});

dibujarTexto();
entrada.focus();
