const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Carpeta para el HTML

// Variables de estado
let fase = 1; // 1: Recolección de datos, 2: Sorteo realizado
const participantes = [
    "Khristmar", "Pablo Jose", "Khristopher", "juan pablo jose", 
    "Juan Lucena", "Zoila", "Angelica", "Miguel Vielma", "Bartolo", 
    "Reina", "Gaby", "Kevin", "Maribel", "Edeilismar", "Oswaldo Gabriel"
];

// Diccionarios para almacenar la data
let seleccionesFijas = {}; // { "Gaby": "Kevin" }
let asignacionesFinales = {}; 

// Endpoint: Registrar si alguien se queda con su amigo secreto
app.post('/registrar', (req, res) => {
    if (fase !== 1) return res.status(400).json({ error: "La fase de registro ya cerró." });
    
    const { dador, quiereCambiar, receptor } = req.body;
    
    if (!quiereCambiar) {
        if (!receptor) return res.status(400).json({ error: "Debes indicar a quién le vas a dar." });
        seleccionesFijas[dador] = receptor;
    }
    res.json({ mensaje: "Registro guardado con éxito." });
});

// Endpoint: Solo Pablo Jose (Admin) ejecuta el sorteo
app.post('/admin/sorteo', (req, res) => {
    const { adminUser } = req.body;
    if (adminUser !== "Pablo Jose") return res.status(403).json({ error: "No autorizado." });

    // Separar los que ya están asignados de los que van a sorteo
    const dadoresFijos = Object.keys(seleccionesFijas);
    const receptoresFijos = Object.values(seleccionesFijas);

    const dadoresDisponibles = participantes.filter(p => !dadoresFijos.includes(p));
    const receptoresDisponibles = participantes.filter(p => !receptoresFijos.includes(p));

    let sorteoValido = false;
    let nuevasAsignaciones = {};

    // Algoritmo de fuerza bruta optimizada (Rejection Sampling) para evitar que alguien se saque a sí mismo
    while (!sorteoValido) {
        // Mezclar aleatoriamente los receptores disponibles
        let mezclados = [...receptoresDisponibles].sort(() => Math.random() - 0.5);
        sorteoValido = true;
        nuevasAsignaciones = {};

        for (let i = 0; i < dadoresDisponibles.length; i++) {
            if (dadoresDisponibles[i] === mezclados[i]) {
                sorteoValido = false; // Alguien se sacó a sí mismo, reiniciar ciclo
                break;
            }
            nuevasAsignaciones[dadoresDisponibles[i]] = mezclados[i];
        }
    }

    // Unir las selecciones fijas con las del nuevo sorteo
    asignacionesFinales = { ...seleccionesFijas, ...nuevasAsignaciones };
    fase = 2; // Avanzar a fase de consulta

    res.json({ mensaje: "Sorteo generado exitosamente. Fase 2 iniciada." });
});

// Endpoint: Consultar a quién le toca regalar
app.get('/consultar/:nombre', (req, res) => {
    if (fase !== 2) return res.status(400).json({ error: "El sorteo aún no se ha realizado. Espera a que el administrador avise." });
    
    const nombre = req.params.nombre;
    const leTocaA = asignacionesFinales[nombre];
    
    if (leTocaA) {
        res.json({ receptor: leTocaA });
    } else {
        res.status(404).json({ error: "Participante no encontrado." });
    }
});

app.get('/estado', (req, res) => res.json({ fase, participantes }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));