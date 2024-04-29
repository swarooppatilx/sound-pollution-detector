// Get the canvas element for the bar graph
const canvas = document.getElementById('barGraph');
const ctx = canvas.getContext('2d');

// Set up the canvas dimensions
canvas.width = 800;
canvas.height = 400;

// Get the decibel info elements
const decibelLevelElement = document.getElementById('decibelLevel');
const decibelValueElement = document.getElementById('decibelValue');
const warningMessageElement = document.getElementById('warningMessage');
const thresholdValueElement = document.getElementById('thresholdValue');

// Set up the Web Audio API
let audioContext, analyserNode, source, dataArray;

// Set up the bar graph dimensions and data
const barCount = 512; // Increased the number of bars
const data = new Uint8Array(barCount); // Array to store the frequency data

// Function to get the current time in hours
function getCurrentHour() {
    const now = new Date();
    return now.getHours() + (now.getMinutes() / 60); // Adding minutes to get a more precise hour value
}

// Function to calculate the threshold based on the current time
function calculateThreshold() {
    const currentHour = getCurrentHour();
    if (currentHour >= 6 && currentHour < 22) {
        return 55; // Daytime threshold
    } else {
        return 45; // Nighttime threshold
    }
}

// Set the threshold value for sound pollution warning
const soundPollutionThreshold = calculateThreshold(); // Initialize the threshold based on the current time
thresholdValueElement.textContent = soundPollutionThreshold; // Display the threshold value on the page


// Function to start the audio recording
function startAudio() {
    // Request access to the user's microphone
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            // Create an AudioContext and AnalyserNode
            audioContext = new AudioContext();
            analyserNode = audioContext.createAnalyser();
            source = audioContext.createMediaStreamSource(stream);
            dataArray = new Uint8Array(analyserNode.frequencyBinCount);

            // Connect the audio source to the analyser
            source.connect(analyserNode);

            // Start the animation loop
            animationLoop();

            // Enable the stop button
            stopButton.disabled = false;
            // Disable the start button
            startButton.disabled = true;
            
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
        });
}

// Function to stop the audio recording
function stopAudio() {
    if (source) {
        source.disconnect();
        audioContext.close();
        source = null;
        audioContext = null;
        dataArray = null;

        // Disable the stop button
        stopButton.disabled = true;
        // Enable the start button
        startButton.disabled = false;
    }
}

// Animation loop to update the bar graph and decibel info
function animationLoop() {
    // Get the frequency data from the analyser
    analyserNode.getByteFrequencyData(data);

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the bar graph
    const barWidth = canvas.width / barCount;
    const bottomOffset = canvas.height - 50; // Adjust this value to move the bars up or down
    const scaleFactor = 5; // Decreased the scale factor to show smaller fluctuations

    for (let i = 0; i < barCount; i++) {
        const barHeight = (data[i] / 256) * (canvas.height - bottomOffset) * scaleFactor;
        ctx.beginPath();
        ctx.moveTo(i * barWidth, bottomOffset);
        ctx.lineTo(i * barWidth, bottomOffset - barHeight);
        ctx.strokeStyle = 'black';
        ctx.stroke();
    }

    // Calculate and display the decibel level and value
    analyserNode.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] ** 2;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const decibelLevel = 20 * Math.log10(rms / 1);
    const decibelValue = Math.round(decibelLevel);

    decibelLevelElement.textContent = decibelLevel.toFixed(2) + ' dB';
    decibelValueElement.textContent = decibelValue + ' dB';

    // Show/hide the warning message based on the threshold
    warningMessageElement.style.display = decibelValue >= soundPollutionThreshold ? 'block' : 'none';

    // Set the bar color based on the threshold
    const isAboveThreshold = decibelValue >= soundPollutionThreshold;
    ctx.strokeStyle = isAboveThreshold ? 'red' : 'black';

    // Redraw the bar graph with the updated color
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < barCount; i++) {
        const barHeight = (data[i] / 256) * (canvas.height - bottomOffset) * scaleFactor;
        ctx.beginPath();
        ctx.moveTo(i * barWidth, bottomOffset);
        ctx.lineTo(i * barWidth, bottomOffset - barHeight);
        ctx.stroke();
    }

    // Request the next animation frame
    requestAnimationFrame(animationLoop);
}

// Get the start and stop buttons
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

// Add event listeners for the start and stop buttons
startButton.addEventListener('click', startAudio);
stopButton.addEventListener('click', stopAudio);
