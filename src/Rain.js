import React from "react"
import Sketch from "react-p5"

const SETTINGS = {
    dropNumber: 3000,               // [50, 10000)          El número de gotas que se dibujarán en pantalla. A mayor valor, mayor coste computacional
    dropLength: 30,                 // [5, 100]             La longitud base de las gotas. Esta se verá alterada por su velocidad final (las gotas más rápidas serán más largas)
    globalSpeedMultiplier: 5,      // [0, 15)               La velocidad a la que caen las gotas. Un valor negativo podría generar alteraciones en la gravedad. Usar con cuidado

    mouseInteractionRadius: 100,    // [10, 500]            El radio alrededor del ratón en el que las gotas interactúan con él.
    interactionStepDivider: 10,     // [5, 15]              La cantidad de vértices que crea una gota al surfear el paraguas. Valores más altos: gotas más suaves, pero más costosas de procesar.

    useUmbrella: true,              // true | false         Si el agua se desvía o no bajo la sombra del ratón
    mouseUmbrellaShadow: 0.8,       // [0.0, 1.0]           La cantidad de sombra que proyecta el ratón. 0: sin sombra. 1: sombra total.

    windSpeed: -10,                 // [-10, 10]            Valores negativos: viento hacia la izquierda. Valores positivos: viento hacia la derecha. 0: sin viento. Valores más allá de los límites pueden causar comportamientos erráticos.

    dropColor: {                    // [0, 255]{4}          El color de las gotas. La opacidad final de la gota se calcula en base a su velocidad (su profundidad en la escena)
        r: 220,
        g: 220,
        b: 255,
        baseAlpha: 32
    }
}

export const InteractiveRain = (props) => {

    // Array de gotas
    const drops = [];

    const setupFunction = (p5, canvasParentRef) => {

        // Creamos el canvas
        p5.createCanvas(window.innerWidth, window.innerHeight).parent(canvasParentRef)

        // Creamos las gotas
        for (let i = 0; i < SETTINGS.dropNumber; i++) {
            drops.push({
                x: Math.round(Math.random() * window.innerWidth),
                y: Math.round(Math.random() * window.innerHeight),
                speed: (Math.random() * 5) + 1,
                seed: Math.random() * 1000
            });
        }

        // Evitamos que las formas se rellenen
        p5.noFill();
    };

    const drawFunction = (p5) => {
        // Limpiamos el canvas
        p5.clear()
        p5.background(0, 0);
        
        // Dibujamos las gotas
        drops.forEach(drop => {
            
            // Las gotas más cercanas serán ligeramente más claras que las más lejanas
            p5.stroke(
                SETTINGS.dropColor.r,
                SETTINGS.dropColor.g,
                SETTINGS.dropColor.b,
                SETTINGS.dropColor.baseAlpha * drop.speed / 5
            )

            // Procesamos la gota para obtener los puntos que la forman
            const processedDrop = processDrop(drop, p5.mouseX, p5.mouseY);

            // Para ahorrar recursos, si la gota solo tiene dos puntos, la dibujamos como una línea recta en lugar de una serie de curvas
            if (processedDrop.length === 2) {
                p5.line(processedDrop[0].x, processedDrop[0].y, processedDrop[1].x, processedDrop[1].y);
            } else {

                // curveVertex exije que el primer y el último punto se repitan, por lo que además de marcar los puntos en el bucle, los añadimos antes y después.
                p5.beginShape();
                p5.curveVertex(processedDrop[0].x, processedDrop[0].y);
                for (let i = 0; i < processedDrop.length - 1; i++) {
                    p5.curveVertex(processedDrop[i].x, processedDrop[i].y);
                }
                p5.curveVertex(processedDrop[processedDrop.length - 1].x, processedDrop[processedDrop.length - 1].y);
                p5.endShape();

            }
        });

        // Actualizamos la posición lógica de las gotas
        updateDrops(drops);
    }

    return (
        <Sketch style={{position: "absolute", top:"0", left: "0"}} setup={setupFunction} draw={drawFunction} />
    );
}


// FUNCIONES DE APOYO

// Actualizar la posición lógica de las gotas
const updateDrops = (drops) => {

    // Hacemos caer la gota según la velocidad. Si la gota se sale de la pantalla, la volvemos a colocar en el borde opuesto.

    drops.forEach(drop => {
        drop.y += drop.speed * SETTINGS.globalSpeedMultiplier;
        if (drop.y > window.innerHeight) {
            drop.y = 0;
        }

        if (drop.y < -SETTINGS.dropLength) {
            drop.y = window.innerHeight;
        }
    });
}

// Procesar una gota para obtener los puntos que la forman
const processDrop = (drop, mouseX, mouseY) => {

    const points = []

    // Guardamos los puntos base inicial y final
    const initialPoint = {
        x: drop.x,
        y: drop.y
    }
    const endPoint = {
        x: drop.x,
        y: drop.y + SETTINGS.dropLength + (SETTINGS.dropLength * 0.5 * drop.speed)
    }

    // Si el ratón está fuera del radio de interacción, añadimos los puntos inicial y final (la gota cae en línea recta)
    if (Math.abs(drop.x - mouseX) > SETTINGS.mouseInteractionRadius) {
        points.push(initialPoint);
        points.push(endPoint);
    } else {

        // Si el ratón está dentro del radio de interacción, calculamos unos puntos intermedios que nos sirven para simular la curvatura de la gota

        // Calculamos el número de pasos que vamos a dar para calcular los puntos intermedios
        const steps = (endPoint.y - initialPoint.y) / SETTINGS.interactionStepDivider;

        // Calculamos la longitud de cada paso
        const stepLength = (endPoint.y - initialPoint.y) / steps

        // Calculamos los puntos intermedios
        for (let currentY = initialPoint.y; currentY < endPoint.y; currentY += stepLength) {

            // Si el ratón está fuera del radio de interacción (el punto está más arriba o más abajo que el ratón), comprobaremos si el punto está debajo para moverlo un poco
            // y simular un efecto de paraguas
            if (distance(initialPoint.x, currentY, mouseX, mouseY) > SETTINGS.mouseInteractionRadius) {
                if (currentY < mouseY) {    // El punto está mas arriba que el ratón
                    points.push({x: initialPoint.x, y: currentY});
                } else {                    // El punto está mas abajo que el ratón

                    // Si el punto está bajo la sombra del paraguas, lo movemos un poco para simular el efecto de paraguas
                    let calculatedX = umbrellaModifyX(initialPoint.x, mouseX, drop.seed);
                    const lastX = points.length > 0 ? points[points.length - 1].x : initialPoint.x;

                    const xDiff = Math.abs(calculatedX - lastX);
                    if (xDiff > 20) {
                    }

                    points.push({
                        x: calculatedX,
                        y: currentY
                    });
                }
            } else {

                // Si el punto está dentro del radio de interacción, calculamos la coordenada X del punto intermedio a la que se debería mover para repeler el ratón

                let translatedX = calculateCircleX(Math.round(currentY) - mouseY);
                translatedX = (
                    initialPoint.x > mouseX
                        ? mouseX + translatedX + noiseOffset(drop.seed)
                        : mouseX - translatedX - noiseOffset(drop.seed)
                )

                if (currentY > mouseY) {
                    translatedX = umbrellaModifyX(
                        translatedX,
                        mouseX,
                        drop.seed
                    );
                }

                points.push({
                    //x: calculateCircleX(currentY),
                    x: translatedX,
                    y: currentY
                })
            }
        }
    }

    // Aplicamos el viento y la fricción con el aire a los puntos
    points.forEach((point, index) => {
        point.x = windOffset(point.x, index * (1 / points.length));
        //point.x += frictionOffset(point.x, Math.round(point.y));
    });

    return points;
}

// Calcular la distancia entre dos puntos bidimensionales
const distance = (x1, y1, x2, y2) => {
    const a = x1 - x2;
    const b = y1 - y2;

    return Math.sqrt(a*a + b*b);
}

// Calcular la coordenada X de un punto en una circunferencia
const calculateCircleX = (y) => {

    const x = Math.floor(
        Math.sqrt(Math.pow(SETTINGS.mouseInteractionRadius, 2) - Math.pow(Math.floor(y), 2))
    );

    return x;
}

// Calcular la coordenada X de un punto que se encuentra bajo la sombra del ratón
const umbrellaModifyX = (x, mouseX, seed) => {
    if (!SETTINGS.useUmbrella) return x;

    let value = x;
    if (Math.abs(x - mouseX) < SETTINGS.mouseUmbrellaShadow * SETTINGS.mouseInteractionRadius) {
        value = x > mouseX
            ? (mouseX + SETTINGS.mouseUmbrellaShadow * SETTINGS.mouseInteractionRadius) + noiseOffset(seed)
            : (mouseX - SETTINGS.mouseUmbrellaShadow * SETTINGS.mouseInteractionRadius) - noiseOffset(seed);
    }

    return value;
}

// Calcular el offset de la gota producido por el ruido de la misma (para simular algo de desorden)
const noiseOffset = (seed) => {
    return Math.round(Math.cos(seed) * 4);
}

// Calcular el offset de la gota producido por el viento
const windOffset = (x, distanceFromOrigin) => {
    return x + distanceFromOrigin * SETTINGS.windSpeed;
}

// Calcular el offset de la gota producido por la fricción con el aire
const frictionOffset = (x, distanceFromOrigin) => {
    return Math.round(Math.cos(x + distanceFromOrigin) * SETTINGS.windSpeed);
}