const video = document.getElementById('video'); // Obtener el elemento <video> del DOM
let faceMatcher; // Declarar faceMatcher en el ámbito global para que esté accesible en todas las funciones

// Función para cargar imágenes etiquetadas de una persona específica
async function loadLabeledImages() {
    const labels = ['Pablo', 'Angela']; // Nombres de las personas que deseas reconocer
    return Promise.all(
        labels.map(async label => {
            const descriptions = [];
            for (let i = 1; i <= 5; i++) { // Cargar cinco imágenes de ejemplo de cada persona
                const img = await faceapi.fetchImage(`../img/${label}/${i}.png`);
                console.log(`Cargando imagen: ../img/${label}/${i}.png`);
                const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                if (detections) {
                    descriptions.push(detections.descriptor);
                } else {
                    console.warn(`No se detectó ningún rostro en la imagen ../img/${label}/${i}.png`);
                }
            }

            console.log(`Imágenes de ${label} procesadas.`);
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
        })
    );
}

async function startVideo() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true }); // Solicitar acceso a la cámara
        video.srcObject = stream; // Asignar el flujo de video al elemento <video>
        video.onloadedmetadata = () => {
            video.play(); // Comenzar la reproducción del video una vez que los metadatos estén cargados
        };

        // Cargar las imágenes etiquetadas antes de iniciar la detección facial
        const labeledFaceDescriptors = await loadLabeledImages();
        faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    } catch (error) {
        console.error('Error al acceder a la cámara: ', error); // Manejar errores en caso de que no se pueda acceder a la cámara
    }
}

// Llamar a la función para iniciar el video desde la cámara y cargar los modelos
Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('models/'),
    faceapi.nets.tinyFaceDetector.loadFromUri('models/'),
    faceapi.nets.mtcnn.loadFromUri('models/'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models/'),
    faceapi.nets.faceLandmark68TinyNet.loadFromUri('models/'),
    faceapi.nets.faceRecognitionNet.loadFromUri('models/'),
    faceapi.nets.faceExpressionNet.loadFromUri('models/'),
    faceapi.nets.ageGenderNet.loadFromUri('models/'),
    console.log('Todos los modelos de face-api.js cargados correctamente.')
]).then(startVideo);

// Cuando el video empieza a reproducirse
video.addEventListener('play', () => {
    const canvas = document.getElementById('canvas'); // Obtener el elemento <canvas> del DOM
    const displaySize = { width: video.width, height: video.height }; // Tamaño de visualización es igual al tamaño del video

    faceapi.matchDimensions(canvas, displaySize); // Ajustar dimensiones del canvas al tamaño de visualización

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptors()
            .withFaceExpressions()
            .withAgeAndGender(); // Realizar detección de rostros con los modelos cargados

        if (detections.length > 0) {
            console.log('Rostros detectados:', detections);

            detections.forEach(detection => {
                const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                console.log('Mejor coincidencia:', bestMatch.toString());

                // Aquí puedes manejar la lógica según la coincidencia encontrada
                if (bestMatch.label !== 'unknown' && bestMatch.distance < 0.6) {
                    console.log(`${bestMatch.label} detectado!`);
                    // Set the language to English (en-US)
                    const utterance = new SpeechSynthesisUtterance(`${bestMatch.label} detectado!`);
                    utterance.lang = 'en-US';
                    // Hacer que el navegador hable el texto
                     speechSynthesis.speak(utterance);
                    //speechSynthesis.cancel();
                    document.getElementById('Name').innerHTML = bestMatch.label + ' Detectado';
                    
                    // Puedes realizar acciones específicas cuando detectas a alguien conocido
                }
            });
           
            const age = detections[0].age;
            const gender = detections[0].gender;
            const genderProbability = detections[0].genderProbability;
            const angry = detections[0].expressions.angry;
            const disgusted = detections[0].expressions.disgusted;
            const fearful = detections[0].expressions.fearful;
            const happy = detections[0].expressions.happy;
            const neutral = detections[0].expressions.neutral;
            const sad = detections[0].expressions.sad;
            const surprised = detections[0].expressions.surprised;

            var resultado = document.getElementById('resultados');
            resultado.innerText = 
             "Age " + Math.round(age) + " \n" + 
             "Gender " + gender + " \n" +
             "GenderProbability " + (genderProbability * 100).toFixed(2) + " %" + " \n" +
             "Fearful " + (fearful * 100).toFixed(2) + " % " + " \n" +
             "Happy " + (happy * 100).toFixed(2) + " % " + " \n" +
             "Neutral " + (neutral * 100).toFixed(2) + " % " + " \n" +
             "Sad " + (sad * 100).toFixed(2) + " % " + " \n" +
             "Surprised " + (surprised * 100).toFixed(2) + " % " + " \n";
             // Crear un nuevo objeto SpeechSynthesisUtterance
             const utterance = new SpeechSynthesisUtterance(resultado.innerText);

             // Set the language to English (en-US)
             utterance.lang = 'en-US';
             // Hacer que el navegador hable el texto
             speechSynthesis.speak(utterance);
             //speechSynthesis.cancel();

        }
    }, 15000); // Intervalo de tiempo para la detección de rostros (en milisegundos)
});
