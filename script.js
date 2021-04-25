// a lot of globals :L
let audioPlaying = false;
let boxes = [];
let analyser;
let frequencies;
const LIGHT_BLUE = new BABYLON.Color3(0.6, 0.851, 0.918);
const NUM_MOVING_WORLD_STARS = 3000;
const NUM_STATIC_WORLD_STARS = 12000;
const NUM_STATIC_PATH_STARS = 13000;
const NUM_MOVING_PATH_STARS = 2000;
const PATH_LENGTH = 1200;
const PATH_WIDTH = 6;
const FFT_SIZE = 2048;
let audioBuffer;
let mushroomStemMaterial;
let transparentMaterial;
let NUM_CAP_STARS = 0;
let NUM_STREAM_STARS = 5000;
let capPositions = [];

// once the window loads, do this
window.onload = () => {

    // get rid of the loading text
    document.getElementById('loadingtext').style.display = 'none';
    document.getElementById('loadingtext').style.zIndex = '-1';
    
    // set up the canvas
    const canvas = document.getElementById('canvas');
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
    const engine = new BABYLON.Engine(canvas, true);

    // set window resize behavior
    window.onresize = () => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        engine.resize();
    }

    // create the scene
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0, 0, 0);
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);
    scene.collisionsEnabled = true;

    // create the camera, give it a hitbox and gravity
    const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(5, 0, 0), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.speed = 0.15;
    camera.attachControl(canvas, true);
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    camera.checkCollisions = true;

    // switch the camera controls to WASD
    camera.inputs.attached.keyboard.keysDown = [83];
    camera.inputs.attached.keyboard.keysUp = [87];
    camera.inputs.attached.keyboard.keysLeft = [65];
    camera.inputs.attached.keyboard.keysRight = [68];

    // audio interface setup
    let audioContext = new AudioContext();
    let audioElement = document.getElementById('audio');
    let track = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    track.connect(analyser);
    analyser.connect(audioContext.destination);
    frequencies = new Uint8Array(analyser.frequencyBinCount);
    audioBuffer = new Float32Array(analyser.frequencyBinCount);

    // instantiate the two particle systems
    let staticParticles = new BABYLON.PointsCloudSystem('spcs', 1, scene);
    let dynamicParticles = new BABYLON.PointsCloudSystem('dpcs', 1, scene);

    // instantiate the materials to use
    transparentMaterial = new BABYLON.StandardMaterial("", scene);
    transparentMaterial.alpha = 0;
    mushroomStemMaterial = new BABYLON.StandardMaterial('', scene);

    // create the big world sphere thing
    let sphere = BABYLON.MeshBuilder.CreateSphere('', {diameter: 1200}, scene);
    sphere.position.infiniteDistance = true;
    sphere.material = transparentMaterial;
    dynamicParticles.addVolumePoints(sphere, NUM_MOVING_WORLD_STARS, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    staticParticles.addVolumePoints(sphere, NUM_STATIC_WORLD_STARS, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    for(let i = 0; i < NUM_MOVING_WORLD_STARS; i++) {
        let particle = dynamicParticles.particles[i];
        particle.velocity = new BABYLON.Vector3((Math.random() - .5) / 64, (Math.random() - .5) / 64, (Math.random() - .5) / 64);
    }

    // create the path you walk on
    let path = BABYLON.MeshBuilder.CreateGround('', {width: PATH_LENGTH, height: PATH_WIDTH}, scene);
    path.position.y = -1;
    path.material = transparentMaterial;
    dynamicParticles.addVolumePoints(path, NUM_MOVING_PATH_STARS, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    staticParticles.addVolumePoints(path, NUM_STATIC_PATH_STARS, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    path.checkCollisions = true;
    for(let i = NUM_MOVING_WORLD_STARS; i < NUM_MOVING_WORLD_STARS + NUM_MOVING_PATH_STARS; i++) {
        let particle = dynamicParticles.particles[i];
        particle.velocity = new BABYLON.Vector3((Math.random() - .5) / 256, 0, 0);
    }
    
    // determine the positions of the mushrooms, make sure they're far enough away from each other
    for(let i = 0; i < Math.floor(Math.random() * 16) + 7; i++) {
        let capPosition = new BABYLON.Vector3(0, 0, 0);
        let notOverlapping = false;
        while(!notOverlapping) {
            notOverlapping = true;
            capPosition.x = Math.floor((Math.random() - .5) * 1600);
            capPosition.y = Math.floor((Math.random() - .5) * 1600 + 400);
            capPosition.z = Math.floor((Math.random() - .5) * 1600);
            for(let i = 0; i < capPositions.length; i++) {
                if(BABYLON.Vector3.Distance(capPositions[i], capPosition) < 300) {
                    notOverlapping = false;
                    break;
                }
            }
            if(notOverlapping)
                capPositions.push(capPosition);
        }
    }

    // spawn a random number of mushrooms
    let capWidth = Math.floor(80 * Math.random() + 100);
    let capHeight = capWidth - Math.floor(Math.random() * 60);
    for(let i = 0; i < capPositions.length; i++) {
        let cap = BABYLON.MeshBuilder.CreateSphere('', {diameterZ: capWidth, diameterX: capWidth, diameterY: capHeight}, scene);
        cap.position = capPositions[i];
        cap.material = transparentMaterial;

        // create the points for the stem
        let point1 = new BABYLON.Vector3(cap.position.x, cap.position.y + capHeight / 2, cap.position.z);
        let point2 = new BABYLON.Vector3(point1.x + (Math.random() - .5) * 20, cap.position.y - (150 * Math.random() + 150), point1.z + (Math.random() - .5) * 20);
        let point3 = new BABYLON.Vector3(point2.x + (Math.random() - .5) * 20, point2.y - (150 * Math.random() + 150), point2.z + (Math.random() - .5) * 20);
        let point4 = new BABYLON.Vector3(point3.x + (Math.random() - .5) * 20, point3.y - (150 * Math.random() + 150), point3.z + (Math.random() - .5) * 20);
        let point5 = new BABYLON.Vector3(point4.x + (Math.random() - .5) * 20, point4.y - (150 * Math.random() + 150), point4.z + (Math.random() - .5) * 20);
        let point6 = new BABYLON.Vector3(point5.x + (Math.random() - .5) * 20, point5.y - (150 * Math.random() + 150), point5.z + (Math.random() - .5) * 20);

        // create the main stem
        let rootRadius = (Math.random() * 3) + 1;
        let tube = BABYLON.MeshBuilder.CreateTube('', {path: [point1, point2, point3, point4, point5, point6], radius: rootRadius}, scene);
        tube.material = mushroomStemMaterial;

        // give the stem some random roots
        let root1;
        let root2;
        let root3;
        let root4;
        if(Math.random() < .5) {
            let point;
            if(Math.random() < .5)
                point = point5;
            else
                point = point4;
            
            let root1x = point.x + (Math.random() - .5) * 40 + 30;
            let root1y = point.y - (150 * Math.random() + 150);
            let root1z = point.z + (Math.random() - .5) * 40 + 30;
            root1 = BABYLON.MeshBuilder.CreateTube('', {
                path: [point, new BABYLON.Vector3(root1x, root1y, root1z)],
                radiusFunction: (i) => {if(i > 0) return .5; else return 1}
            }, scene);
            root2 = BABYLON.MeshBuilder.CreateTube('', {
                path: [new BABYLON.Vector3(root1x, root1y, root1z), new BABYLON.Vector3(root1x + (Math.random() - .5) * 40 + 30, root1y - (150 * Math.random() + 150), root1z + (Math.random() - .5) * 40 + 30)],
                radiusFunction: (i) => {if(i > 0) return 0; else return .5}
            }, scene);
        } else {
            let point;
            if(Math.random() < .5)
                point = point5;
            else
                point = point4;
            root1 = BABYLON.MeshBuilder.CreateTube('', {
                path: [point, new BABYLON.Vector3(point.x + (Math.random() - .5) * 40 + 30, point.y - (150 * Math.random() + 150), point.z + (Math.random() - .5) * 40 + 30)],
                radiusFunction: (i) => {if(i > 0) return 0; else return 1}
            }, scene);
        }
        if(Math.random() < .5) {
            let root3x = point6.x + (Math.random() - .5) * 20;
            let root3y = point6.y - (150 * Math.random() + 150);
            let root3z = point6.z + (Math.random() - .5) + 20;
            
            root3 = BABYLON.MeshBuilder.CreateTube('', {
                path: [point6, new BABYLON.Vector3(root3x, root3y, root3z)],
                radiusFunction: (i) => {if(i > 0) return .5; else return 1}
            }, scene);
            root4 = BABYLON.MeshBuilder.CreateTube('', {
                path: [new BABYLON.Vector3(root3x, root3y, root3z), new BABYLON.Vector3(root3x + (Math.random() - .5) * 40 + 30, root3y - (150 * Math.random() + 150), root3z + (Math.random() - .5) * 40 + 30)],
                radiusFunction: (i) => {if(i > 0) return 0; else return .5}
            }, scene);
        } else {
            root3 = BABYLON.MeshBuilder.CreateTube('', {
                path: [point6, new BABYLON.Vector3(point6.x + (Math.random() - .5) * 20, point6.y - (150 * Math.random() + 150), point6.z + (Math.random() - .5) + 20)],
                radiusFunction: (i) => {if(i > 0) return 0; else return 1}
            }, scene);
        }
        root1.material = mushroomStemMaterial;
        if(root2) root2.material = mushroomStemMaterial;
        root3.material = mushroomStemMaterial;
        if(root4) root4.material = mushroomStemMaterial;

        // add all the particles for the stems/roots/caps
        let capParticles = 1800 + Math.floor(Math.random() * 1200);
        NUM_CAP_STARS += capParticles;
        dynamicParticles.addSurfacePoints(cap, capParticles, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
        staticParticles.addVolumePoints(root1, 250 + Math.floor(Math.random() * 50), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
        if(root2)
            staticParticles.addVolumePoints(root2, 150 + Math.floor(Math.random() * 50), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
        staticParticles.addVolumePoints(root3, 250 + Math.floor(Math.random() * 50), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
        if(root4)
            staticParticles.addVolumePoints(root4, 150 + Math.floor(Math.random() * 50), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
        staticParticles.addVolumePoints(tube, 3000 + Math.floor(Math.random() * 1000), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    }

    // save the original positions of the mushroom cap particles, so that they can respond to audio
    for(let i = NUM_MOVING_PATH_STARS + NUM_MOVING_WORLD_STARS; i < dynamicParticles.particles.length; i++) {
        let particle = dynamicParticles.particles[i];
            particle.originalPosition = new BABYLON.Vector3(
                particle.position.x,
                particle.position.y,
                particle.position.z
            );
    }

    // create the big square in the sky thing
    let moon = BABYLON.MeshBuilder.CreateBox('', {height: 200, width: 200}, scene);
    moon.material = transparentMaterial;
    moon.position = new BABYLON.Vector3(1400, 1200, 1200);
    staticParticles.addVolumePoints(moon, 10000, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);

    // create the streams that drip from the square
    let stream1 = BABYLON.MeshBuilder.CreateTube('', {path: [new BABYLON.Vector3(1430, 1100, 1170), new BABYLON.Vector3(1430, -10000, 1170)], radius: 5}, scene);
    stream1.material = transparentMaterial;
    dynamicParticles.addVolumePoints(stream1, 6000, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    for(let i = dynamicParticles.particles.length - 6000; i < dynamicParticles.particles.length; i++) {
        dynamicParticles.particles[i].originalPosition = new BABYLON.Vector3(dynamicParticles.particles[i].position.x, dynamicParticles.particles[i].position.y, dynamicParticles.particles[i].position.z);
        dynamicParticles.particles[i].velocity = new BABYLON.Vector3(0, -0.5 * Math.random(), 0);
    }
    let stream2 = BABYLON.MeshBuilder.CreateTube('', {path: [new BABYLON.Vector3(1440, 1100, 1160), new BABYLON.Vector3(1440, -10000, 1160)], radius: 1}, scene);
    stream2.material = transparentMaterial;
    dynamicParticles.addVolumePoints(stream2, 4000, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    for(let i = dynamicParticles.particles.length - 4000; i < dynamicParticles.particles.length; i++) {
        dynamicParticles.particles[i].originalPosition = new BABYLON.Vector3(dynamicParticles.particles[i].position.x, dynamicParticles.particles[i].position.y, dynamicParticles.particles[i].position.z);
        dynamicParticles.particles[i].velocity = new BABYLON.Vector3(0, -0.5 * Math.random(), 0);
    }

    // build the particle meshes!
        staticParticles.buildMeshAsync().then(mesh => {
            dynamicParticles.buildMeshAsync().then(mesh => {
                mesh.position.y -= 1;
                    engine.runRenderLoop(renderFunction);
            });
        });

    // this makes it so that you keep falling forever if you fall off the path
    camera._needMoveForGravity = true;

    // this is what locks your pointer to the canvas, and what triggers the audio to play
    scene.onPointerDown = () => {
        canvas.requestPointerLock();
        if(!audioPlaying) {
            audioElement.play();
            audioPlaying = true;
        }
    }
    
    // the render function! this is where the particles/materials get updated and redrawn
    function renderFunction() {

        // get the audio data from the track for this frame
        analyser.getFloatTimeDomainData(audioBuffer);

        // mushroom stem/root stuff
        if(mushroomStemMaterial.alpha <= 1)
            mushroomStemMaterial.alpha += .0125;
        let max = 0;
        for(let i = 0; i < audioBuffer.length; i++) {
            if(Math.abs(audioBuffer[i]) > max)
                max = Math.abs(audioBuffer[i]);
        }
        if(1 - max < mushroomStemMaterial.alpha)
            mushroomStemMaterial.alpha = 1 - max;

        // particle stuff! some particles have a velocity, some respond to the audio,
        // and some need to get moved somewhere if the go out of bounds
        for(let i = 0; i < dynamicParticles.particles.length; i++) {
            let particle = dynamicParticles.particles[i];
            if(i < NUM_MOVING_WORLD_STARS) {
                particle.position.x += particle.velocity.x;
                particle.position.y += particle.velocity.y;
                particle.position.z += particle.velocity.z;
            }
            else if(i < NUM_MOVING_WORLD_STARS + NUM_MOVING_PATH_STARS) {
                particle.position.x += particle.velocity.x;
                if(particle.position.x > PATH_LENGTH / 2)
                    particle.position.x = PATH_LENGTH / -2;
                else if(particle.position.x < PATH_LENGTH / -2)
                    particle.position.x = PATH_LENGTH;
            }
            else if(i < NUM_MOVING_WORLD_STARS + NUM_MOVING_PATH_STARS + NUM_CAP_STARS) {
                particle.position.y = particle.originalPosition.y + audioBuffer[i % audioBuffer.length] * 25;
            }
            else {
                particle.position.z = particle.originalPosition.z + (audioBuffer[i % audioBuffer.length] * 1000) / (particle.position.y + 10000);
                particle.position.x = particle.originalPosition.x + (audioBuffer[i % audioBuffer.length] * 1000) / (particle.position.y + 10000);
                particle.position.y += particle.velocity.y;
                if(particle.position.y < -10000)
                    particle.position.y = 1100;
                if(max > .94 && Math.random() > .99 && particle.position.y < -200)
                    particle.position.y = 1100;
            }
        }

        // this is here because i think babylonjs has an undocumented bug related to the pointscloudsystem
        // that will sometimes cause it to not add particles to something, which will cause an error when you
        // try to redraw the particles :(
        try {
            dynamicParticles.setParticles();
        } catch(e) {
            document.getElementById('loadingtext').style.display = 'block';
            document.getElementById('loadingtext').style.zIndex = '1';
            document.getElementById('loadingtext').innerText = 'load failed, reloading...';
            location.reload();
        }
        
        // render the scene
        scene.render();
    }
}