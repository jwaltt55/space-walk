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

window.onload = () => {
    const canvas = document.getElementById('canvas');
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;

    const engine = new BABYLON.Engine(canvas, true);

    window.onresize = () => {
        canvas.height = window.innerHeight;
        canvas.width = window.innerWidth;
        engine.resize();
    }

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0, 0, 0);
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);
    const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(5, 0, 0), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.speed = 0.15;
    camera.attachControl(canvas, true);
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    scene.collisionsEnabled = true;
    camera.checkCollisions = true;
    camera.inputs.attached.keyboard.keysDown = [83];
    camera.inputs.attached.keyboard.keysUp = [87];
    camera.inputs.attached.keyboard.keysLeft = [65];
    camera.inputs.attached.keyboard.keysRight = [68];


    let audioContext = new AudioContext();
    let audioElement = document.getElementById('audio');
    let track = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    track.connect(analyser);
    analyser.connect(audioContext.destination);
    frequencies = new Uint8Array(analyser.frequencyBinCount);
    audioBuffer = new Float32Array(analyser.frequencyBinCount);

    var material = new BABYLON.StandardMaterial(scene);
    material.alpha = 1;
    material.emissiveColor = new BABYLON.Color3(0.6, 0.851, 0.918);
/*  
    for(let i = 0; i < 128; i++) {
        let box = BABYLON.MeshBuilder.CreateBox("box", {size: 0.05}, scene);
        box.material = material;
        box.position = new BABYLON.Vector3(0, 0, -4 + i / 16);
        box.hasVertexAlpha = true;
        boxes.push(box);
    }
*/

    let staticParticles = new BABYLON.PointsCloudSystem('spcs', 1, scene);
    let dynamicParticles = new BABYLON.PointsCloudSystem('dpcs', 1, scene);

    transparentMaterial = new BABYLON.StandardMaterial("", scene);
    transparentMaterial.alpha = 0;

    mushroomStemMaterial = new BABYLON.StandardMaterial('', scene);

    let sphere = BABYLON.MeshBuilder.CreateSphere('', {diameter: 1200}, scene);
    sphere.position.infiniteDistance = true;
    sphere.material = transparentMaterial;
    dynamicParticles.addVolumePoints(sphere, NUM_MOVING_WORLD_STARS, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    staticParticles.addVolumePoints(sphere, NUM_STATIC_WORLD_STARS, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    for(let i = 0; i < NUM_MOVING_WORLD_STARS; i++) {
        let particle = dynamicParticles.particles[i];
        particle.velocity = new BABYLON.Vector3((Math.random() - .5) / 64, (Math.random() - .5) / 64, (Math.random() - .5) / 64);
    }

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
/*
    let rail1 = BABYLON.MeshBuilder.CreateGround('', {width: PATH_LENGTH, height: 1}, scene);
    rail1.position.y = -1;
    rail1.position.z = 2;
    rail1.material = transparentMaterial;
    dynamicParticles.addVolumePoints(rail1, 10000, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);

    let rail2 = BABYLON.MeshBuilder.CreateGround('', {width: PATH_LENGTH, height: 1}, scene);
    rail2.position.y = -1;
    rail2.position.z = -2;
    rail2.material = transparentMaterial;
    dynamicParticles.addVolumePoints(rail2, 10000, BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
*/
    for(let i = 0; i < Math.floor(Math.random() * 17) + 8; i++) {
        //let box = BABYLON.MeshBuilder.CreateBox("box", {size: Math.random() * 20 + 2}, scene);
        let capWidth = 120 * Math.random() + 80;
        let capHeight = capWidth / 1.75 + Math.random()
        //box.position = new BABYLON.Vector3(Math.random() * 1600 - 8
        let box = BABYLON.MeshBuilder.CreateSphere("box", {diameterZ: capWidth, diameterX: capWidth, diameterY: capHeight}, scene);
        //box.position = new BABYLON.Vector3(Math.random() * 1600 - 800, Math.random() * 1600 - 800, Math.random() * 1600 - 800);
        box.position = new BABYLON.Vector3((Math.random() - .5) * 1200 + 400, (Math.random() - .5) * 1200, (Math.random() - .5) * 1200);
        //box.rotation = new BABYLON.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5);
        box.material = transparentMaterial;
        boxes.push(box);
        let point1 = new BABYLON.Vector3(box.position.x, box.position.y + capHeight / 2/* - (Math.random() * 6 + 2)*/, box.position.z);
        let point2 = new BABYLON.Vector3(point1.x + (Math.random() - .5) * 20, box.position.y - (150 * Math.random() + 150), point1.z + (Math.random() - .5) * 20);
        let point3 = new BABYLON.Vector3(point2.x + (Math.random() - .5) * 20, point2.y - (150 * Math.random() + 150), point2.z + (Math.random() - .5) * 20);
        let point4 = new BABYLON.Vector3(point3.x + (Math.random() - .5) * 20, point3.y - (150 * Math.random() + 150), point3.z + (Math.random() - .5) * 20);
        let point5 = new BABYLON.Vector3(point4.x + (Math.random() - .5) * 20, point4.y - (150 * Math.random() + 150), point4.z + (Math.random() - .5) * 20);
        let point6 = new BABYLON.Vector3(point5.x + (Math.random() - .5) * 20, point5.y - (150 * Math.random() + 150), point5.z + (Math.random() - .5) * 20);

        let tube = BABYLON.MeshBuilder.CreateTube('', {path: [point1, point2, point3, point4, point5, point6], radius: Math.random() + 1}, scene);
        tube.material = mushroomStemMaterial;

        let root1 = BABYLON.MeshBuilder.CreateTube('', {
            path: [point5, new BABYLON.Vector3(point5.x + (Math.random() - .5) * 40 + 30, point5.y - (150 * Math.random() + 150), point5.z + (Math.random() - .5) * 40 + 30)],
            radiusFunction: (i) => {if(i > 0) return 0; else return 1}
        }, scene);
        let root2 = BABYLON.MeshBuilder.CreateTube('', {
            path: [point6, new BABYLON.Vector3(point6.x + (Math.random() - .5) * 20, point6.y - (150 * Math.random() + 150), point6.z + (Math.random() - .5) + 20)],
            radiusFunction: (i) => {if(i > 0) return 0; else return 1}
        }, scene);
        root1.material = mushroomStemMaterial;
        root2.material = mushroomStemMaterial;

        staticParticles.addVolumePoints(box, 2000 + Math.floor(Math.random() * 1000), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
        staticParticles.addVolumePoints(root1, 250 + Math.floor(Math.random() * 50), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
        staticParticles.addVolumePoints(root2, 250 + Math.floor(Math.random() * 50), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
        staticParticles.addVolumePoints(tube, 3000 + Math.floor(Math.random() * 1000), BABYLON.PointColor.Stated, LIGHT_BLUE, 0);
    }

    staticParticles.buildMeshAsync();
    dynamicParticles.buildMeshAsync().then(mesh => {
        mesh.position.y -= 1;
    });
    
/*
    for(let i = 0; i < dynamicParticles.particles.length; i++) {
        if(i >= NUM_MOVING_WORLD_STARS + NUM_STATIC_PATH_STARS && i < NUM_MOVING_WORLD_STARS + NUM_STATIC_PATH_STARS + 20000) {
            dynamicParticles.particles[i].velocity = new BABYLON.Vector3(Math.random() / 8, 0, 0);
        }
        dynamicParticles.particles[i].originalPosition = new BABYLON.Vector3(
            dynamicParticles.particles[i].position.x,
            dynamicParticles.particles[i].position.y,
            dynamicParticles.particles[i].position.z
        );
        /*
        if(i >= 20000) {
            let box = boxes[Math.floor((i - 20000) / 350)];
            dynamicParticles.particles[i].meshPosition = new BABYLON.Vector3(
                box.position.x,
                box.position.y,
                box.position.z
            );
        }
    }*/

    camera._needMoveForGravity = true;

/*
    BABYLON.SceneLoader.ImportMesh(null, "./", "temple.babylon", scene, (newMeshes) => {
        console.log(newMeshes);
        newMeshes[0].material = material;
        newMeshes[1].material = material;
        newMeshes[2].material = material;
        pointsCloud.addVolumePoints(newMeshes[0], 10000, BABYLON.PointColor.Stated, new BABYLON.Color3(0.6, 0.851, 0.918), 0);
        pointsCloud.addVolumePoints(newMeshes[1], 10000, BABYLON.PointColor.Stated, new BABYLON.Color3(0.6, 0.851, 0.918), 0);
        pointsCloud.addVolumePoints(newMeshes[2], 10000, BABYLON.PointColor.Stated, new BABYLON.Color3(0.6, 0.851, 0.918), 0);
        pointsCloud.buildMeshAsync();

    });
*/
    scene.onPointerDown = () => {
        canvas.requestPointerLock();
        if(!audioPlaying) {
            audioElement.play();
            audioPlaying = true;
        }
    }

    engine.runRenderLoop(() => {
        analyser.getFloatTimeDomainData(audioBuffer);
        /*
        for(let i = 0; i < boxes.length; i++) {
            //boxes[i].position = new BABYLON.Vector3(0, frequencies[i] / (255 / 16) - 8, boxes[i].position.z);
        }
        */
        if(mushroomStemMaterial.alpha <= 1)
            mushroomStemMaterial.alpha += .01;
        let max = 0;
        for(let i = 0; i < audioBuffer.length; i++) {
            if(audioBuffer[i] > max)
                max = audioBuffer[i];
        }
        if(1 - max < mushroomStemMaterial.alpha)
            mushroomStemMaterial.alpha = 1 - max;
        console.log(max);
        for(let i = 0; i < dynamicParticles.particles.length; i++) {
            let particle = dynamicParticles.particles[i];
            if(i < NUM_MOVING_WORLD_STARS) {
                particle.position.x += particle.velocity.x;
                particle.position.y += particle.velocity.y;
                particle.position.z += particle.velocity.z;
            }
            else if(i < NUM_MOVING_WORLD_STARS + NUM_MOVING_PATH_STARS) {
                particle.position.x += particle.velocity.x;
                //if(i >= NUM_MOVING_WORLD_STARS + NUM_MOVING_PATH_STARS) particle.position.y = particle.originalPosition.y + Math.abs(audioBuffer[i % 1000] / 2);
                if(particle.position.x > PATH_LENGTH / 2)
                    particle.position.x = PATH_LENGTH / -2;
                else if(particle.position.x < PATH_LENGTH / -2)
                    particle.position.x = PATH_LENGTH;
            }
            //if(i >= 20000) {
            //let particle = dynamicParticles.particles[i];
            //particle.position.x = particle.meshPosition.x + (particle.originalPosition.x - particle.meshPosition.x) * ((frequencies2[Math.floor(i / analyser.fftSize)]) * 2);
            //particle.position.y = particle.meshPosition.y + (particle.originalPosition.y - particle.meshPosition.y) * ((frequencies2[Math.floor(i / analyser.fftSize)]) * 2);
            //particle.position.z = particle.meshPosition.z + (particle.originalPosition.z - particle.meshPosition.z) * ((frequencies2[Math.floor(i / analyser.fftSize)]) * 2);
            //}
            //new BABYLON.Vector3(0, frequencies[Math.floor(i % analyser.fftSize)] / (255 / 16) - 8, dynamicParticles.particles[i].position.z);
            /*new BABYLON.Vector3(
                dynamicParticles.particles[i].position.x,
                frequencies2[Math.floor(i % analyser.fftSize)] - 1,
                dynamicParticles.particles[i].position.z//i / dynamicParticles.particles.length * (frequencies2[Math.floor(i % analyser.fftSize)] + 1)
            );*/
            //new BABYLON.Vector3(
                //dynamicParticles.particles[i].originalPosition.x * (frequencies2[Math.floor(i % analyser.fftSize)] + 1),
                //dynamicParticles.particles[i].originalPosition.y * (frequencies2[Math.floor(i % analyser.fftSize)] + 1),
                //dynamicParticles.particles[i].originalPosition.z * (frequencies2[Math.floor(i % analyser.fftSize)] + 1)
            //);
        }
        dynamicParticles.setParticles();
        scene.render();

 
    });
}