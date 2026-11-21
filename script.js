
/* =====================================
   CDS - CONFIGURACIÓN
===================================== */

// Enlace público de Google Sheets
const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQPyVkctIOLaV2icmhoyYw-MHldcWAWRj1LA3n0wJAnXqAbNeoPDqIpLzp_idZtadmrngi3w7h_6eHj/pub?output=csv";

// Usuario oficial de Instagram, sin @
const INSTAGRAM_USER = "TU_USUARIO";

// Cantidad de eventos que aparecen inicialmente
const INITIAL_EVENTS = 3;


/* =====================================
   ELEMENTOS HTML
===================================== */

const eventsList = document.getElementById("events-list");
const eventsFooter = document.getElementById("events-footer");
const toggleEventsButton = document.getElementById("toggle-events");


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
        const nextChar = text[i + 1];

        if (char === '"' && insideQuotes && nextChar === '"') {
            value += '"';
            i++;
        }

        else if (char === '"') {
            insideQuotes = !insideQuotes;
        }

        else if (char === "," && !insideQuotes) {
            row.push(value.trim());
            value = "";
        }

        else if ((char === "\n" || char === "\r") && !insideQuotes) {

            if (char === "\r" && nextChar === "\n") {
                i++;
            }

            row.push(value.trim());

            if (row.some(cell => cell !== "")) {
                rows.push(row);
            }

            row = [];
            value = "";
        }

        else {
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
   CONVERTIR FECHAS
===================================== */

function parseDate(dateValue) {

    if (!dateValue) {
        return null;
    }

    const value = dateValue.trim();

    let year;
    let month;
    let day;

    // Formato AAAA-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {

        const parts = value.split("-");

        year = Number(parts[0]);
        month = Number(parts[1]);
        day = Number(parts[2]);

    }

    // Formato DD/MM/AAAA
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {

        const parts = value.split("/");

        day = Number(parts[0]);
        month = Number(parts[1]);
        year = Number(parts[2]);

    }

    else {
        return null;
    }

    const date = new Date(year, month - 1, day);

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
    }).format(date).replace(".", "").toUpperCase();

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

    // Fecha
    const dateBox = document.createElement("div");
    dateBox.className = "event-date";

    const month = document.createElement("span");
    month.className = "event-date-month";
    month.textContent = formatMonth(event.date);

    const day = document.createElement("span");
    day.className = "event-date-day";
    day.textContent = formatDay(event.date);

    dateBox.append(month, day);


    // Información
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


    // Imagen opcional
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


    // Botón de asistencia
    const actions = document.createElement("div");
    actions.className = "event-actions";

    const button = document.createElement("a");

    button.className = "event-button";
    button.textContent = "QUIERO ASISTIR ↗";

    button.href = "https://ig.me/m/" + encodeURIComponent(INSTAGRAM_USER);

    button.target = "_blank";
    button.rel = "noopener noreferrer";
    button.setAttribute("aria-label", "Consultar asistencia para " + event.name);

    actions.appendChild(button);


    card.append(dateBox, info, actions);

    return card;
}


/* =====================================
   MOSTRAR EVENTOS
===================================== */

function showMessage(message) {

    eventsList.innerHTML = "";

    const element = document.createElement("p");
    element.className = "events-message";
    element.textContent = message;

    eventsList.appendChild(element);

    eventsFooter.classList.add("hidden");

}


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


    // Botón para desplegar más eventos
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
   CARGAR EVENTOS DE GOOGLE SHEETS
===================================== */

async function loadEvents() {

    showMessage("Cargando próximos eventos...");

    try {

        const response = await fetch(SHEET_URL);

        if (!response.ok) {
            throw new Error("No se pudo consultar Google Sheets.");
        }

        const csvText = await response.text();

        const rows = parseCSV(csvText);

        if (rows.length < 2) {

            renderEvents([]);

            return;
        }


        // Encabezados de la hoja
        const headers = rows[0].map(header =>
            header.trim().toLowerCase()
        );


        const getColumn = (row, name) => {

            const index = headers.indexOf(name);

            return index >= 0 ? (row[index] || "").trim() : "";

        };


        const today = new Date();

        today.setHours(0, 0, 0, 0);


        const events = rows.slice(1).map(row => {

            return {

                name: getColumn(row, "nombre"),

                date: parseDate(getColumn(row, "fecha")),

                time: getColumn(row, "hora"),

                description: getColumn(row, "descripcion"),

                place: getColumn(row, "lugar"),

                image: getColumn(row, "imagen"),

                status: getColumn(row, "estado").toLowerCase()

            };

        });


        // Solo eventos activos, completos y futuros
        const upcomingEvents = events.filter(event => {

            return (
                event.name &&
                event.date &&
                event.date >= today &&
                event.status === "activo"
            );

        });


        // Orden cronológico
        upcomingEvents.sort((a, b) => {

            return a.date - b.date;

        });


        renderEvents(upcomingEvents);

    }

    catch (error) {

        console.error("Error cargando eventos:", error);

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
   INICIAR PÁGINA
===================================== */

document.addEventListener("DOMContentLoaded", function () {

    loadEvents();

});
