// DISPLAY VARIABLES

let audioPlaying = false;
let boxes = [];
let analyser;
let frequencies;

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
    camera.speed = 0.1;
    camera.attachControl(canvas, true);
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
    scene.collisionsEnabled = true;
    camera.checkCollisions = true;

    let audioContext = new AudioContext();
    let audioElement = document.getElementById('audio');
    let track = audioContext.createMediaElementSource(audioElement);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    track.connect(analyser);
    analyser.connect(audioContext.destination);
    frequencies = new Uint8Array(analyser.frequencyBinCount);

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

    let transparentMaterial = new BABYLON.StandardMaterial("", scene);
    transparentMaterial.alpha = 0;

    let sphere = BABYLON.MeshBuilder.CreateSphere('', {diameter: 1200}, scene);
    sphere.position.infiniteDistance = true;
    sphere.material = transparentMaterial;
    staticParticles.addVolumePoints(sphere, 10000, BABYLON.PointColor.Stated, new BABYLON.Color3(0.6, 0.851, 0.918), 0);

    let path = BABYLON.MeshBuilder.CreateGround('', {width: 800, height: 3}, scene);
    path.position.y = -1;
    path.material = transparentMaterial;
    staticParticles.addVolumePoints(path, 10000, BABYLON.PointColor.Stated, new BABYLON.Color3(0.6, 0.851, 0.918), 0);
    path.checkCollisions = true;

    let rail1 = BABYLON.MeshBuilder.CreateGround('', {width: 800, height: 1}, scene);
    rail1.position.y = -1;
    rail1.position.z = 2;
    rail1.material = transparentMaterial;
    dynamicParticles.addVolumePoints(rail1, 10000, BABYLON.PointColor.Stated, new BABYLON.Color3(0.6, 0.851, 0.918), 0);

    let rail2 = BABYLON.MeshBuilder.CreateGround('', {width: 800, height: 1}, scene);
    rail2.position.y = -1;
    rail2.position.z = -2;
    rail2.material = transparentMaterial;
    dynamicParticles.addVolumePoints(rail2, 10000, BABYLON.PointColor.Stated, new BABYLON.Color3(0.6, 0.851, 0.918), 0);

    for(let i = 0; i < 50; i++) {
        let box = BABYLON.MeshBuilder.CreateBox("box", {size: Math.random() * 20 + 2}, scene);
        box.position = new BABYLON.Vector3(Math.random() * 1600 - 800, Math.random() * 1600 - 800, Math.random() * 1600 - 800);
        box.rotation = new BABYLON.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5);
        box.material = transparentMaterial;
        dynamicParticles.addVolumePoints(box, 350, BABYLON.PointColor.Stated, new BABYLON.Color3(1, 0, 0), 0);
    }

    staticParticles.buildMeshAsync();
    dynamicParticles.buildMeshAsync();

    for(let i = 0; i < dynamicParticles.particles.length; i++) {
        dynamicParticles.particles[i].originalPosition = new BABYLON.Vector3(0, 0, 0);
        dynamicParticles.particles[i].originalPosition.x = dynamicParticles.particles[i].position.x;
        dynamicParticles.particles[i].originalPosition.y = dynamicParticles.particles[i].position.y;
        dynamicParticles.particles[i].originalPosition.z = dynamicParticles.particles[i].position.z;
    }

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
        let frequencies2 = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(frequencies2);
        analyser.getByteTimeDomainData(frequencies);
        for(let i = 0; i < boxes.length; i++) {
            boxes[i].position = new BABYLON.Vector3(0, frequencies[i] / (255 / 16) - 8, boxes[i].position.z);
        }
        for(let i = 0; i < dynamicParticles.particles.length; i++) {
            dynamicParticles.particles[i].position = //new BABYLON.Vector3(0, frequencies[Math.floor(i % analyser.fftSize)] / (255 / 16) - 8, dynamicParticles.particles[i].position.z);
            /*new BABYLON.Vector3(
                dynamicParticles.particles[i].position.x,
                frequencies2[Math.floor(i % analyser.fftSize)] - 1,
                dynamicParticles.particles[i].position.z//i / dynamicParticles.particles.length * (frequencies2[Math.floor(i % analyser.fftSize)] + 1)
            );*/
            new BABYLON.Vector3(
                dynamicParticles.particles[i].originalPosition.x * (frequencies2[Math.floor(i % analyser.fftSize)] + 1),
                dynamicParticles.particles[i].originalPosition.y * (frequencies2[Math.floor(i % analyser.fftSize)] + 1),
                dynamicParticles.particles[i].originalPosition.z * (frequencies2[Math.floor(i % analyser.fftSize)] + 1)
            );
        }
        dynamicParticles.setParticles();
        scene.render();

 
    });
}