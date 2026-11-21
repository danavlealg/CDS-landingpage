

/* =====================================
   CDS - CONFIGURACIÓN
===================================== */

const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPyVkctIOLaV2icmhoyYw-MHldcWAWRj1LA3n0wJAnXqAbNeoPDqIpLzp_idZtadmrngi3w7h_6eHj/pub?output=csv";

// Escribe el usuario oficial de Instagram sin @
const INSTAGRAM_USER = "cds.col";

// Eventos visibles inicialmente
const INITIAL_EVENTS = 3;


/* =====================================
   ELEMENTOS DE LA PÁGINA
===================================== */

const eventsList = document.getElementById("events-list");
const eventsFooter = document.getElementById("events-footer");
const toggleEventsButton = document.getElementById("toggle-events");


/* =====================================
   NORMALIZAR TEXTO
===================================== */

function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


/* =====================================
   LEER ARCHIVO CSV
===================================== */

function parseCSV(text) {

    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && insideQuotes && next === '"') {

            value += '"';
            i++;

        } else if (char === '"') {

            insideQuotes = !insideQuotes;

        } else if (char === "," && !insideQuotes) {

            row.push(value.trim());
            value = "";

        } else if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(value.trim());

            if (row.some(cell => cell !== "")) {
                rows.push(row);
            }

            row = [];
            value = "";

        } else {

            value += char;

        }
    }

    row.push(value.trim());

    if (row.some(cell => cell !== "")) {
        rows.push(row);
    }

    return rows;

}


/* =====================================
   OBTENER VALOR DE UNA COLUMNA
===================================== */

function getColumn(row, headers, columnName) {

    const index = headers.indexOf(normalizeText(columnName));

    if (index === -1) {
        return "";
    }

    return String(row[index] || "").trim();

}


/* =====================================
   CONVERTIR FECHAS
===================================== */

function parseDate(value) {

    if (!value) {
        return null;
    }

    const dateText = value.trim();

    let year;
    let month;
    let day;

    // Formato AAAA-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateText)) {

        const parts = dateText.split("-");

        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);

    }

    // Formato DD/MM/AAAA
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateText)) {

        const parts = dateText.split("/");

        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);

    }

    else {

        return null;

    }

    const date = new Date(year, month - 1, day);

    // Validar que la fecha exista
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;

}


/* =====================================
   FORMATEAR FECHA
===================================== */

function formatMonth(date) {

    return new Intl.DateTimeFormat("es-CO", {
        month: "short"
    })
    .format(date)
    .replace(".", "")
    .toUpperCase();

}


function formatDay(date) {

    return String(date.getDate()).padStart(2, "0");

}


/* =====================================
   CREAR TARJETA DE EVENTO
===================================== */

function createEventCard(event, index) {

    const card = document.createElement("article");

    card.className = "event-card";

    if (index >= INITIAL_EVENTS) {
        card.classList.add("extra-event");
    }


    // FECHA

    const dateBox = document.createElement("div");
    dateBox.className = "event-date";

    const month = document.createElement("span");
    month.className = "event-date-month";
    month.textContent = formatMonth(event.date);

    const day = document.createElement("span");
    day.className = "event-date-day";
    day.textContent = formatDay(event.date);

    dateBox.append(month, day);


    // INFORMACIÓN

    const info = document.createElement("div");
    info.className = "event-info";

    const title = document.createElement("h3");
    title.className = "event-title";
    title.textContent = event.name;

    info.appendChild(title);


    if (event.description) {

        const description = document.createElement("p");

        description.className = "event-description";
        description.textContent = event.description;

        info.appendChild(description);

    }


    // HORA Y LUGAR

    const meta = document.createElement("div");
    meta.className = "event-meta";

    if (event.time) {

        const time = document.createElement("span");
        time.textContent = "◷ " + event.time;

        meta.appendChild(time);

    }

    if (event.place) {

        const place = document.createElement("span");
        place.textContent = "⌖ " + event.place;

        meta.appendChild(place);

    }

    info.appendChild(meta);


    // IMAGEN OPCIONAL

    if (event.image && /^https?:\/\//i.test(event.image)) {

        const image = document.createElement("img");

        image.className = "event-image";
        image.src = event.image;
        image.alt = event.name;
        image.loading = "lazy";

        image.onerror = function () {
            image.remove();
        };

        info.appendChild(image);

    }


    // BOTÓN DE ASISTENCIA

    const actions = document.createElement("div");
    actions.className = "event-actions";

    const button = document.createElement("a");

    button.className = "event-button";
    button.textContent = "QUIERO ASISTIR ↗";

    button.href =
        "https://ig.me/m/" + encodeURIComponent(INSTAGRAM_USER);

    button.target = "_blank";
    button.rel = "noopener noreferrer";

    actions.appendChild(button);

    card.append(dateBox, info, actions);

    return card;

}


/* =====================================
   MENSAJES DE LA AGENDA
===================================== */

function showMessage(message) {

    eventsList.innerHTML = "";

    const element = document.createElement("p");

    element.className = "events-message";
    element.textContent = message;

    eventsList.appendChild(element);

    eventsFooter.classList.add("hidden");

}


/* =====================================
   MOSTRAR EVENTOS
===================================== */

function renderEvents(events) {

    eventsList.innerHTML = "";

    if (events.length === 0) {

        showMessage(
            "Por ahora no tenemos eventos próximos. ¡Pronto habrá novedades!"
        );

        return;

    }

    events.forEach((event, index) => {

        const card = createEventCard(event, index);

        eventsList.appendChild(card);

    });


    if (events.length > INITIAL_EVENTS) {

        eventsFooter.classList.remove("hidden");

        toggleEventsButton.textContent =
            "VER TODOS LOS EVENTOS ↓";

        eventsList.classList.remove("expanded");

    } else {

        eventsFooter.classList.add("hidden");

    }

}


/* =====================================
   CARGAR EVENTOS DESDE GOOGLE SHEETS
===================================== */

async function loadEvents() {

    showMessage("Cargando próximos eventos...");

    try {

        const response = await fetch(SHEET_URL, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Google Sheets no respondió correctamente.");
        }

        const csvText = await response.text();

        const rows = parseCSV(csvText);

        if (rows.length < 2) {

            renderEvents([]);

            return;

        }


        // NORMALIZAR ENCABEZADOS
        const headers = rows[0].map(normalizeText);


        // FECHA ACTUAL LOCAL
        const today = new Date();

        today.setHours(0, 0, 0, 0);


        // CONVERTIR FILAS EN EVENTOS
        const events = rows.slice(1).map(row => {

            return {

                name: getColumn(row, headers, "nombre"),

                date: parseDate(
                    getColumn(row, headers, "fecha")
                ),

                time: getColumn(row, headers, "hora"),

                description: getColumn(row, headers, "descripcion"),

                place: getColumn(row, headers, "lugar"),

                image: getColumn(row, headers, "imagen"),

                status: normalizeText(
                    getColumn(row, headers, "estado")
                )

            };

        });


        // ESTADOS QUE SE MOSTRARÁN
        const acceptedStatuses = [
            "activo",
            "activa",
            "visible"
        ];


        // FILTRAR EVENTOS FUTUROS Y VISIBLES
        const upcomingEvents = events.filter(event => {

            return (
                event.name &&
                event.date &&
                event.date >= today &&
                acceptedStatuses.includes(event.status)
            );

        });


        // ORDENAR DEL MÁS PRÓXIMO AL MÁS LEJANO
        upcomingEvents.sort((a, b) => {

            return a.date - b.date;

        });


        renderEvents(upcomingEvents);

    }

    catch (error) {

        console.error("Error cargando eventos CDS:", error);

        showMessage(
            "No pudimos cargar los eventos. Intenta nuevamente más tarde."
        );

    }

}


/* =====================================
   BOTÓN VER TODOS LOS EVENTOS
===================================== */

toggleEventsButton.addEventListener("click", function () {

    const expanded = eventsList.classList.toggle("expanded");

    if (expanded) {

        toggleEventsButton.textContent =
            "MOSTRAR MENOS ↑";

    } else {

        toggleEventsButton.textContent =
            "VER TODOS LOS EVENTOS ↓";

    }

});


/* =====================================
   INICIAR AGENDA
===================================== */

loadEvents();
