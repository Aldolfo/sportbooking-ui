// Formatear dinero a Pesos Chilenos ($28.000)
const formatearPesos = (valor) => "$" + Number(valor).toLocaleString("es-CL");

document.addEventListener("DOMContentLoaded", () => {
    // Detectar qué vista está abierta
    if (document.getElementById("gridCanchas")) iniciarCatalogo();
    if (document.getElementById("detalleCancha")) iniciarDetalleCancha();
    if (document.getElementById("formCheckout")) iniciarCheckout();
    if (document.getElementById("listaReservas")) iniciarMisReservas();
    if (document.getElementById("tablaAdminBody")) iniciarAdmin();
});

/* =========================================================
   VISTA 1: CATÁLOGO DE CANCHAS (index.html)
   ========================================================= */
function iniciarCatalogo() {
    const grid = document.getElementById("gridCanchas");
    const filtroDeporte = document.getElementById("filtroDeporte");
    const emptyState = document.getElementById("emptyState");
    const btnLimpiar = document.getElementById("btnLimpiar");

    function renderizar(lista) {
        grid.innerHTML = "";
        if (lista.length === 0) {
            emptyState.style.display = "block";
            return;
        }
        emptyState.style.display = "none";

        lista.forEach((cancha) => {
            const libres = cancha.horarios.filter((h) => h.disponible).length;
            const card = document.createElement("article");
            card.className = "cancha-card";
            card.innerHTML = `
                <img src="${cancha.imagen}" alt="${cancha.nombre}">
                <div class="cancha-info">
                    <small style="color:#659c35; font-weight:800;">${cancha.deporte.toUpperCase()} · ${cancha.comuna}</small>
                    <h3>${cancha.nombre}</h3>
                    <p>${cancha.descripcion}</p>
                    <p style="margin-top:12px; color:#171a17; font-weight:700;">
                        ${formatearPesos(cancha.precio)} / hora · 
                        <span style="color:#659c35;">${libres} bloques libres</span>
                    </p>
                    <button type="button" class="btn-primary" style="width:100%;" onclick="seleccionarCancha(${cancha.id})">
                        Ver horarios y reservar →
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function filtrar() {
        const canchas = obtenerCanchas();
        const deporte = filtroDeporte.value;
        const filtradas = deporte === "todos"
            ? canchas
            : canchas.filter((c) => c.deporte === deporte);
        renderizar(filtradas);
    }

    filtroDeporte.addEventListener("change", filtrar);
    btnLimpiar.addEventListener("click", () => {
        filtroDeporte.value = "todos";
        filtrar();
    });

    filtrar();
}

function seleccionarCancha(id) {
    localStorage.setItem("lcs_cancha_seleccionada", id);
    window.location.href = "cancha.html";
}

/* =========================================================
   VISTA 2: DETALLE DE CANCHA, HORARIOS Y EXTRAS (cancha.html)
   ========================================================= */
function iniciarDetalleCancha() {
    const canchas = obtenerCanchas();
    const idSeleccionado = Number(localStorage.getItem("lcs_cancha_seleccionada")) || canchas[0].id;
    const cancha = canchas.find((c) => c.id === idSeleccionado) || canchas[0];

    const detalle = document.getElementById("detalleCancha");
    const contenedorHorarios = document.getElementById("contenedorHorarios");
    const checksExtras = document.querySelectorAll(".check-extra");
    const totalEl = document.getElementById("totalCancha");
    const errorHorario = document.getElementById("errorHorario");
    const btnContinuar = document.getElementById("btnContinuarCheckout");

    let horaElegida = null;

    // Mostrar ficha de la cancha
    detalle.innerHTML = `
        <div class="cancha-card" style="display:flex; flex-wrap:wrap; align-items:center;">
            <img src="${cancha.imagen}" alt="${cancha.nombre}" style="max-width:340px; height:220px;">
            <div class="cancha-info" style="flex:1;">
                <small style="color:#659c35; font-weight:800;">${cancha.deporte.toUpperCase()} · ${cancha.comuna}</small>
                <h2 style="font-size:24px; margin:6px 0;">${cancha.nombre}</h2>
                <p>${cancha.descripcion}</p>
                <p style="margin-top:12px; font-size:16px; color:#171a17; font-weight:800;">
                    Valor base: ${formatearPesos(cancha.precio)} / hora
                </p>
            </div>
        </div>
    `;

    // Dibujar botones de horarios
    cancha.horarios.forEach((bloque) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `chip-hora ${bloque.disponible ? "" : "ocupado"}`;
        btn.textContent = bloque.disponible ? bloque.hora : `${bloque.hora} (Ocupado)`;
        btn.disabled = !bloque.disponible;

        if (bloque.disponible) {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".chip-hora").forEach((b) => b.classList.remove("seleccionado"));
                btn.classList.add("seleccionado");
                horaElegida = bloque.hora;
                errorHorario.style.display = "none";
            });
        }
        contenedorHorarios.appendChild(btn);
    });

    // Calcular total dinámico con extras
    function calcularTotal() {
        let sumaExtras = 0;
        const listaExtras = [];
        checksExtras.forEach((chk) => {
            if (chk.checked) {
                sumaExtras += Number(chk.value);
                listaExtras.push(chk.dataset.nombre);
            }
        });
        const total = cancha.precio + sumaExtras;
        totalEl.textContent = formatearPesos(total);
        return { total, listaExtras };
    }

    checksExtras.forEach((chk) => chk.addEventListener("change", calcularTotal));
    calcularTotal();

    // Guardar borrador y avanzar a checkout
    btnContinuar.addEventListener("click", () => {
        if (!horaElegida) {
            errorHorario.style.display = "block";
            return;
        }
        const { total, listaExtras } = calcularTotal();
        const borrador = {
            canchaId: cancha.id,
            canchaNombre: cancha.nombre,
            deporte: cancha.deporte,
            comuna: cancha.comuna,
            hora: horaElegida,
            extras: listaExtras,
            total: total
        };
        localStorage.setItem("lcs_borrador_reserva", JSON.stringify(borrador));
        window.location.href = "checkout.html";
    });
}

/* =========================================================
   VISTA 3: CHECKOUT Y VALIDACIÓN (checkout.html)
   ========================================================= */
function iniciarCheckout() {
    const borrador = JSON.parse(localStorage.getItem("lcs_borrador_reserva"));
    if (!borrador) {
        window.location.href = "index.html";
        return;
    }

    const resumen = document.getElementById("resumenCheckout");
    resumen.innerHTML = `
        <small style="color:#659c35; font-weight:800;">RESUMEN DE ARRIENDO</small>
        <h3 style="margin:8px 0 14px;">${borrador.canchaNombre}</h3>
        <p style="margin-bottom:8px;"><strong>Deporte:</strong> ${borrador.deporte} (${borrador.comuna})</p>
        <p style="margin-bottom:8px;"><strong>Horario:</strong> ${borrador.hora} hrs</p>
        <p style="margin-bottom:8px;"><strong>Extras:</strong> ${borrador.extras.length ? borrador.extras.join(", ") : "Ninguno"}</p>
        <hr style="margin:16px 0; border:none; border-top:1px solid #e1e5df;">
        <p style="font-size:18px; font-weight:800;">Total a pagar: <span style="color:#659c35;">${formatearPesos(borrador.total)}</span></p>
    `;

    const form = document.getElementById("formCheckout");
    const modalExito = document.getElementById("modalExito");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombreCliente");
        const correo = document.getElementById("correoCliente");
        const telefono = document.getElementById("telefonoCliente");
        const metodoPago = document.getElementById("metodoPago").value;

        let valido = true;

        // Validar nombre
        if (nombre.value.trim().length < 3) {
            document.getElementById("errNombre").style.display = "block";
            nombre.classList.add("input-error");
            valido = false;
        } else {
            document.getElementById("errNombre").style.display = "none";
            nombre.classList.remove("input-error");
        }

        // Validar correo
        if (!correo.value.includes("@") || !correo.value.includes(".")) {
            document.getElementById("errCorreo").style.display = "block";
            correo.classList.add("input-error");
            valido = false;
        } else {
            document.getElementById("errCorreo").style.display = "none";
            correo.classList.remove("input-error");
        }

        // Validar teléfono
        if (telefono.value.trim().length < 8) {
            document.getElementById("errTelefono").style.display = "block";
            telefono.classList.add("input-error");
            valido = false;
        } else {
            document.getElementById("errTelefono").style.display = "none";
            telefono.classList.remove("input-error");
        }

        if (!valido) return;

        // Guardar reserva confirmada
        const reservas = JSON.parse(localStorage.getItem("lcs_reservas")) || [];
        reservas.push({
            id: Date.now(),
            ...borrador,
            cliente: nombre.value.trim(),
            correo: correo.value.trim(),
            telefono: telefono.value.trim(),
            metodoPago
        });
        localStorage.setItem("lcs_reservas", JSON.stringify(reservas));

        // Marcar horario como ocupado en la cancha
        const canchas = obtenerCanchas();
        const cancha = canchas.find((c) => c.id === borrador.canchaId);
        if (cancha) {
            const bloque = cancha.horarios.find((h) => h.hora === borrador.hora);
            if (bloque) bloque.disponible = false;
            guardarCanchas(canchas);
        }

        localStorage.removeItem("lcs_borrador_reserva");
        modalExito.showModal();
    });
}

/* =========================================================
   VISTA 4: MIS RESERVAS Y CANCELACIÓN (mis-reservas.html)
   ========================================================= */
function iniciarMisReservas() {
    const listaEl = document.getElementById("listaReservas");
    const emptyEl = document.getElementById("emptyReservas");
    const modal = document.getElementById("modalCancelar");
    const btnCerrar = document.getElementById("btnCerrarModal");
    const btnConfirmar = document.getElementById("btnConfirmarCancelacion");

    let reservaACancelar = null;

    function renderizarReservas() {
        const reservas = JSON.parse(localStorage.getItem("lcs_reservas")) || [];
        listaEl.innerHTML = "";

        if (reservas.length === 0) {
            emptyEl.style.display = "block";
            return;
        }
        emptyEl.style.display = "none";

        reservas.forEach((res) => {
            const card = document.createElement("article");
            card.className = "cancha-card";
            card.innerHTML = `
                <div class="cancha-info">
                    <small style="color:#659c35; font-weight:800;">CONFIRMADA · ${res.deporte}</small>
                    <h3>${res.canchaNombre}</h3>
                    <p><strong>Horario:</strong> ${res.hora} hrs (${res.comuna})</p>
                    <p><strong>Titular:</strong> ${res.cliente}</p>
                    <p><strong>Pago:</strong> ${res.metodoPago} · <strong>${formatearPesos(res.total)}</strong></p>
                    <button type="button" class="btn-danger" style="width:100%; margin-top:16px;" onclick="abrirModalCancelar(${res.id})">
                        Cancelar reserva
                    </button>
                </div>
            `;
            listaEl.appendChild(card);
        });
    }

    window.abrirModalCancelar = (id) => {
        reservaACancelar = id;
        modal.showModal();
    };

    btnCerrar.addEventListener("click", () => modal.close());

    btnConfirmar.addEventListener("click", () => {
        let reservas = JSON.parse(localStorage.getItem("lcs_reservas")) || [];
        const target = reservas.find((r) => r.id === reservaACancelar);

        if (target) {
            // Liberar horario nuevamente
            const canchas = obtenerCanchas();
            const cancha = canchas.find((c) => c.id === target.canchaId);
            if (cancha) {
                const bloque = cancha.horarios.find((h) => h.hora === target.hora);
                if (bloque) bloque.disponible = true;
                guardarCanchas(canchas);
            }
            reservas = reservas.filter((r) => r.id !== reservaACancelar);
            localStorage.setItem("lcs_reservas", JSON.stringify(reservas));
        }

        modal.close();
        renderizarReservas();
    });

    renderizarReservas();
}

/* =========================================================
   VISTA 5: PANEL DE ADMINISTRACIÓN (admin.html)
   ========================================================= */
function iniciarAdmin() {
    const tbody = document.getElementById("tablaAdminBody");

    function renderizarTabla() {
        const canchas = obtenerCanchas();
        tbody.innerHTML = "";

        canchas.forEach((cancha) => {
            const tr = document.createElement("tr");
            const botonesHorarios = cancha.horarios
                .map(
                    (h, index) => `
                    <button type="button" 
                        class="btn-toggle ${h.disponible ? "libre" : "bloqueado"}"
                        onclick="alternarBloque(${cancha.id}, ${index})">
                        ${h.hora} · ${h.disponible ? "Libre" : "Bloqueado"}
                    </button>`
                )
                .join("");

            tr.innerHTML = `
                <td><strong>${cancha.nombre}</strong></td>
                <td>${cancha.deporte}</td>
                <td>${cancha.comuna}</td>
                <td>${botonesHorarios}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.alternarBloque = (canchaId, indexHorario) => {
        const canchas = obtenerCanchas();
        const cancha = canchas.find((c) => c.id === canchaId);
        if (cancha) {
            cancha.horarios[indexHorario].disponible = !cancha.horarios[indexHorario].disponible;
            guardarCanchas(canchas);
            renderizarTabla();
        }
    };

    renderizarTabla();
}