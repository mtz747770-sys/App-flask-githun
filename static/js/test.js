const datosTexto = JSON.parse(document.getElementById("texto-datos").textContent);
const palabras = datosTexto.split(/\s+/).filter(Boolean);

const contenedorTexto = document.getElementById("texto-prueba");
const entrada = document.getElementById("entrada-usuario");
const marcadorTiempo = document.getElementById("tiempo-restante");
const barraProgreso = document.getElementById("barra-progreso");
const pantallaResultado = document.getElementById("pantalla-resultado");
const valorWpm = document.getElementById("valor-wpm");
const indicadorRacha = document.getElementById("indicador-racha");
const contadorRacha = document.getElementById("contador-racha");

const DURACION_SEGUNDOS = 60;

let indicePalabraActual = 0;
let palabrasCorrectas = 0;
let rachaActual = 0;
let tiempoRestante = DURACION_SEGUNDOS;
let intervalo = null;
let pruebaIniciada = false;
let pruebaTerminada = false;

function obtenerPalabraObjetivo() {
    return palabras[indicePalabraActual] || "";
}

function dibujarTexto() {
    const palabra = obtenerPalabraObjetivo();
    contenedorTexto.innerHTML = palabra
        .split("")
        .map((letra) => `<span class="letra">${letra}</span>`)
        .join("");
}

function actualizarLetrasPalabraActual() {
    const letras = contenedorTexto.querySelectorAll(".letra");
    const palabraObjetivo = obtenerPalabraObjetivo();
    const escrito = entrada.value.replace(/\s+$/, "");

    letras.forEach((letraElemento, indice) => {
        letraElemento.classList.remove("correcta", "incorrecta", "cursor");

        if (indice < escrito.length) {
            letraElemento.classList.add(
                escrito[indice] === palabraObjetivo[indice] ? "correcta" : "incorrecta"
            );
        } else if (indice === escrito.length) {
            letraElemento.classList.add("cursor");
        }
    });
}

function actualizarRacha() {
    if (!indicadorRacha || !contadorRacha) return;

    if (rachaActual >= 4) {
        contadorRacha.textContent = rachaActual;
        indicadorRacha.classList.remove("oculto");
        indicadorRacha.classList.remove("animar-racha");
        void indicadorRacha.offsetWidth;
        indicadorRacha.classList.add("animar-racha");
    } else {
        indicadorRacha.classList.add("oculto");
    }
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
    if (pruebaTerminada) return;
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

    if (!palabraObjetivo) return;

    if (escrita === palabraObjetivo) {
        palabrasCorrectas += 1;
        rachaActual += 1;
    } else {
        rachaActual = 0;
    }

    actualizarRacha();

    indicePalabraActual += 1;
    entrada.value = "";

    if (indicePalabraActual >= palabras.length) {
        finalizarPrueba();
        return;
    }

    dibujarTexto();
    barraProgreso.style.width = `${(indicePalabraActual / palabras.length) * 100}%`;
}

function retrocederPalabra() {
    if (indicePalabraActual === 0) return;

    indicePalabraActual -= 1;
    dibujarTexto();
    barraProgreso.style.width = `${(indicePalabraActual / palabras.length) * 100}%`;
}

entrada.addEventListener("input", (evento) => {
    if (pruebaTerminada) return;

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
    if (pruebaTerminada) return;

    if (evento.key === "Enter") {
        evento.preventDefault();
        if (entrada.value.trim().length > 0) {
            procesarPalabra();
        }
        return;
    }

    if (evento.key === "Backspace" && entrada.value.length === 0 && indicePalabraActual > 0) {
        evento.preventDefault();
        retrocederPalabra();
    }
});

dibujarTexto();
entrada.focus();