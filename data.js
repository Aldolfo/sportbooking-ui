// Datos iniciales de La Curva Soccer
const CANCHAS_INICIALES = [
    {
        id: 1,
        nombre: "Cancha Principal La Curva",
        deporte: "Fútbol 8",
        comuna: "Chillán",
        precio: 28000,
        imagen: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80",
        descripcion: "Pasto sintético FIFA Quality Pro, graderías techadas y camarines equipados.",
        horarios: [
            { hora: "18:00", disponible: true },
            { hora: "19:00", disponible: true },
            { hora: "20:00", disponible: false },
            { hora: "21:00", disponible: true },
            { hora: "22:00", disponible: true }
        ]
    },
    {
        id: 2,
        nombre: "Cancha Norte Sintética",
        deporte: "Fútbol 8",
        comuna: "Bulnes",
        precio: 24000,
        imagen: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80",
        descripcion: "Césped de última generación con iluminación LED perimetral y estacionamiento privado.",
        horarios: [
            { hora: "17:00", disponible: true },
            { hora: "18:00", disponible: true },
            { hora: "19:00", disponible: true },
            { hora: "20:00", disponible: true },
            { hora: "21:00", disponible: false }
        ]
    },
    {
        id: 3,
        nombre: "Pista Cristal Panorámica 1",
        deporte: "Pádel",
        comuna: "Chillán",
        precio: 16000,
        imagen: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80",
        descripcion: "Cancha panorámica de cristal templado de 12mm y césped fibrilado azul.",
        horarios: [
            { hora: "18:00", disponible: true },
            { hora: "19:30", disponible: true },
            { hora: "21:00", disponible: true },
            { hora: "22:30", disponible: false }
        ]
    },
    {
        id: 4,
        nombre: "Pista Arena Sur 2",
        deporte: "Pádel",
        comuna: "Bulnes",
        precio: 14000,
        imagen: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80",
        descripcion: "Ideal para partidos nocturnos y torneos dobles, incluye zona de descanso.",
        horarios: [
            { hora: "17:30", disponible: true },
            { hora: "19:00", disponible: false },
            { hora: "20:30", disponible: true },
            { hora: "22:00", disponible: true }
        ]
    }
];

// Cargar canchas desde localStorage o guardar las iniciales la primera vez
function obtenerCanchas() {
    const guardadas = localStorage.getItem("lcs_canchas");
    if (guardadas) {
        return JSON.parse(guardadas);
    }
    localStorage.setItem("lcs_canchas", JSON.stringify(CANCHAS_INICIALES));
    return CANCHAS_INICIALES;
}

function guardarCanchas(canchas) {
    localStorage.setItem("lcs_canchas", JSON.stringify(canchas));
}
