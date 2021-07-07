"use strict";

import { ViewerViewState } from "./ViewerViewState.js";
import { DEFAULT_FOV, MAX_FOV, MIN_FOV, ZOOM_SPEED, PAN_SPEED} from "./ViewerConfig.js";
import { EventPosition } from "./EventPosition.js";

export class ViewerPanoAPI {

    constructor(viewerAPI) {
        this.viewerAPI = viewerAPI;
        this.addedLayers = new Set(); // EventMesh and EventLayer objects added via addLayer();

        this.scene = new THREE.Scene(); // three.js scene used by the panorama (3D) viewer
        this.camera = new THREE.PerspectiveCamera(DEFAULT_FOV, window.innerWidth / window.innerHeight, 1, 1100);
        this.camera.up = new THREE.Vector3(0, 0, 1);
        this.sphereRadius = 10;

        // property needed for display method 
        this.loadedMesh = null;

        // property needed for depthAtPointer method
        this.depthCanvas = document.createElement("canvas");

        // handeling zooming / panning / moving / resizing
        const panoViewer = document.getElementById('pano-viewer');
        this.viewerViewState = new ViewerViewState(DEFAULT_FOV, 0, 0);
        this.lastViewState;
        this.lastMousePos;
        panoViewer.addEventListener('wheel', (event) => this.onDocumentMouseWheel(event));
        panoViewer.addEventListener('pointerdown', (event) => this.onPointerDown(event));
        panoViewer.addEventListener('dblclick', (event) => this.onDoubleClick(event));
        window.addEventListener("resize", () => this.onWindowResize());
        // Two new event listeneres are called to handle *how far* the user drags
        this.oPM = (event) => this.onPointerMove(event);
        this.oPU = () => this.onPointerUp();
        
        // handeling EventMesh / EventLayer API integration
        this.preMeshes = new Set(); // meshes that the mouse pointer is currently over
        panoViewer.addEventListener('click', (event) => this.meshCheckClick(event));
        panoViewer.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            this.meshCheckRightClick(event);
        });
        panoViewer.addEventListener('pointermove', (event) => this.meshCheckMouseOver(event));
       /////new changes
	    panoViewer.addEventListener('keydown', (event) => {
            const keyName = event.key;
          
            if (keyName === 'Control') {
              // do not alert when only Control key is pressed.
              return;
            }
          
            if (event.ctrlKey) {
              // Even though event.key is not 'Control' (e.g., 'a' is pressed),
              // event.ctrlKey may be true if Ctrl key is pressed at the same time.
              alert(`Combination of ctrlKey + ${keyName}`);
            } else {
              alert(`Key pressed ${keyName}`);
            }
          }, false);
	 ////

        this.display(this.viewerAPI.image.currentImageId);
    }

    // displays the panorama with idx *ImageNum* in the model
    
 display(imageNum) {
       this.viewerAPI.image.currentImageId = imageNum;
       let loadnum=0;
       let count=0;
       let displayimgid=this.viewerAPI.image.currentImageId;
       const texttureloader0=this.viewerAPI.textureLoader;
       


      let loadImage=(count)=>{
       if(count>3){
           return ;
       }

    if(displayimgid==imageNum){	      
       texttureloader0.load(this.viewerAPI.baseURL +
            Math.trunc(imageNum / 100) +
            '/' +
            imageNum +
            'r'+count+'.jpg',
    
                  
       (texturePano)=>{ 
           
	//loding depth data          
        if(count==0){
            const image = new Image();
            //image.crossOrigin = "use-credentials";
            image.src = this.viewerAPI.baseURL +
                Math.trunc(imageNum / 100) + '/' +
                imageNum + 'd.png';
    
            image.addEventListener('load', () => {
                this.depthCanvas.getContext("2d").drawImage(image, 0, 0);
            }, false);
    
          }  

        const sphere = new THREE.SphereGeometry(this.sphereRadius, 60, 40);
        // invert the geometry on the x-axis so that we look out from the middle of the sphere
        sphere.scale(-1, 1, 1);
        sphere.rotateX(Math.PI / 2);
       
        texturePano.mapping = THREE.EquirectangularReflectionMapping; // not sure if this line matters
	       
       
	       
       
        const material =new THREE.MeshBasicMaterial({ map: texturePano });
  
        const mesh = new THREE.Mesh(sphere, material);
         
        mesh.applyQuaternion(this.viewerAPI.image.currentImage.orientation)
       // put in the correct position in the scene
         const localCoord = this.viewerAPI.toLocal(this.viewerAPI.image.currentImage.pos);
         mesh.position.set(localCoord.x, localCoord.y, localCoord.z);
     
         // check if other panorama was previously already loaded
         if (this.loadedMesh != null) {
             this.scene.remove(this.loadedMesh);
         }
     
         this.scene.add(mesh);
         this.loadedMesh = mesh;
     
         // put camera inside sphere mesh
         this.camera.position.set(localCoord.x, localCoord.y, localCoord.z);
         flag_imgid=imageNum;
         count++;
         loadImage(count);
       
    });}
    else {
        displayimgid=imageNum;
       return;
     }

};

loadImage(0);


}

arrowMove(Documentpara) {
 
var keyboard=(event)=> {

    const currentPos = this.viewerAPI.toLocal(this.viewerAPI.image.currentImage.pos);
 
    const viewingDireciton = lonLatToLocal(this.viewerViewState.lonov, this.viewerViewState.latov);

    let forwardimgid=this.viewerAPI.image.currentImageId;
    let ARROW_UP_DOWN_DISTANCE=4;

    var e = event || window.event || arguments.callee.caller.arguments[0];
            if (e && e.keyCode == 40) { 
                console.log('down');

                const backward = currentPos.addScaledVector(viewingDireciton, - ARROW_UP_DOWN_DISTANCE);
                const globalBackward = this.viewerAPI.toGlobal(backward);
                this.viewerAPI.move(globalBackward[0], globalBackward[1], globalBackward[2]);

                this.viewerAPI.propagateEvent("moved", this.viewerAPI.image.currentImage.id, true);
         
            }
            if (e && e.keyCode == 37) { 
                console.log('left');
                const scalingFactor = this.camera.fov / MAX_FOV;
                this.viewerViewState.setLonov(30 * PAN_SPEED * scalingFactor + this.viewerViewState.lonov);
                                  
                this.lastViewState[0]=30 * PAN_SPEED * scalingFactor + this.viewerViewState.lonov;
                this.viewerAPI.map.show_direction();
            }
            if (e && e.keyCode == 39) { 
                console.log('right');
                const scalingFactor = this.camera.fov / MAX_FOV;
                this.viewerViewState.setLonov(-30 * PAN_SPEED * scalingFactor + this.viewerViewState.lonov);
                this.lastViewState[0]=-30 * PAN_SPEED * scalingFactor + this.viewerViewState.lonov;
                this.viewerAPI.map.show_direction();
                   
            }
            if (e && e.keyCode == 38) { 


               console.log('up');
               const forward = currentPos.addScaledVector(viewingDireciton, ARROW_UP_DOWN_DISTANCE);
               const globalForward = this.viewerAPI.toGlobal(forward);
               this.viewerAPI.move(globalForward[0], globalForward[1], globalForward[2]);
               this.viewerAPI.propagateEvent("moved", this.viewerAPI.image.currentImage.id, true);

                }

       }

Documentpara.onkeydown  = keyboard;
}



	
	
	


    camera() {
        return this.camera;
    }

    // Set the panorama view characteristics.
    view(lonov, latov, fov) {
        const normalizedViewingDirection = lonLatToLocal(lonov, latov);

        // adjust looking direction for offset of current mesh in scene
        const localCoord = this.viewerAPI.toLocal(this.viewerAPI.image.currentImage.pos);

        this.camera.lookAt(localCoord.add(normalizedViewingDirection));

        this.camera.fov = THREE.MathUtils.clamp(fov, MIN_FOV, MAX_FOV);

        this.camera.updateProjectionMatrix();
    }

    // Add an event layer to the panorama (3D) viewer.
    // param: EventLayer (or EventMesh) to add
    addLayer(layer) {
        if (!layer) return;
        if (this.addedLayers.has(layer)) return;

        this.scene.add(layer);
        this.addedLayers.add(layer);
    }

    removeLayer(layer) {
        if (!layer) return;
        if (!this.addedLayers.has(layer)) return;

        this.scene.remove(layer);
        this.addedLayers.delete(layer);
    }

    // ----- Event handling functions for panning, zooming and moving -----
    onPointerDown(event) {
        this.lastMousePos = [event.clientX, event.clientY];

        this.lastViewState = [this.viewerViewState.lonov, this.viewerViewState.latov];

        document.addEventListener('pointermove', this.oPM);
        document.addEventListener('pointerup', this.oPU);
    }

    // handles continues update of the distance mouse moved
    onPointerMove(event) {
        const scalingFactor = this.camera.fov / MAX_FOV;
    
        this.viewerViewState.setLonov((event.clientX - this.lastMousePos[0]) * PAN_SPEED * scalingFactor + this.lastViewState[0]);
        this.viewerViewState.setLatov((event.clientY - this.lastMousePos[1]) * PAN_SPEED * scalingFactor + this.lastViewState[1]);

        this.viewerAPI.map.show_direction();
    }

    // this event listener is called when the user *ends* moving the picture
    onPointerUp() {
        document.removeEventListener('pointermove', this.oPM);
        document.removeEventListener('pointerup', this.oPU);

        this.viewerAPI.propagateEvent("viewed", this.viewerViewState, true);
    }

    onDocumentMouseWheel(event) {
        this.viewerViewState.fov = this.camera.fov + event.deltaY * ZOOM_SPEED;

        this.view(this.viewerViewState.lonov, this.viewerViewState.latov, this.viewerViewState.fov);
        this.camera.updateProjectionMatrix();

        this.viewerAPI.propagateEvent("viewed", this.viewerViewState, true);
        this.viewerAPI.map.show_direction();
    }

    onDoubleClick(event) {
        const currentPos = this.viewerAPI.image.currentImage.pos;
        const newLocalPos = this.getCursorLocation(event);
        const newPos = this.viewerAPI.toGlobal(newLocalPos);

        this.viewerAPI.move(newPos[0], newPos[1], currentPos[2]);

        this.viewerAPI.propagateEvent("moved", this.viewerAPI.image.currentImage.id, true);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.viewerAPI.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ---- event handeling functions for EventMesh / EventLayer API interaction ----
    getIntersectingMeshes(event) {
        const raycaster = this.getRaycaster(event);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(this.scene.children);

        // include only objects that are added meshes
        const meshes = [];
        for (const e in intersects) {
            if (this.addedLayers.has(intersects[e].object)) {
                // check if mesh is within sphere radius to camera
                const dist = this.camera.position.distanceTo(intersects[e].object.position);
                if (dist < this.sphereRadius) {
                    meshes.push(intersects[e].object);
                }
            }
        }

        return meshes;
    }

    meshCheckClick(event) {
        const meshes = this.getIntersectingMeshes(event);
        const xy = new EventPosition(event);
        const location = this.getCursorLocation(event);

        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];

            if (typeof mesh.vwr_onclick == "function") {
                mesh.vwr_onclick(xy, location);
            }
        }
    }

    meshCheckRightClick(event) {
        const meshes = this.getIntersectingMeshes(event);
        const xy = new EventPosition(event);
        const location = this.getCursorLocation(event);

        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];

            if (typeof mesh.vwr_oncontext == "function") {
                const callback = mesh.vwr_oncontext(xy, location);

                $.contextMenu({
                    selector: '#pano-viewer',
                    items: callback,
                });
            }
        }
    }

    meshCheckMouseOver(event) {
        const meshes = this.getIntersectingMeshes(event);

        // check for meshes that mouse pointer is no longer over
        this.preMeshes.forEach((preMesh) => {
            if (!meshes.includes(preMesh)) {
                if (typeof preMesh.vwr_onpointerleave == "function") {
                    // remove the current mesh
                    this.preMeshes.delete(preMesh);
                    
                    preMesh.vwr_onpointerleave();
                }
            }
        });

        // check for meshes that mouse pointer is newly over
        for (let i = 0; i < meshes.length; i++) {
            const mesh = meshes[i];
            
            //if the current mesh has not been entered before.
            if (!this.preMeshes.has(mesh)) {
                if (typeof mesh.vwr_onpointerenter == "function") {
                    // store the current mesh
                    this.preMeshes.add(mesh);
                    
                    mesh.vwr_onpointerenter();
                }
            }
        }
    }

    // returns: the depth information (in meter) of the panorama at the current curser position (event.clientX, event.clientY)
    depthAtPointer(event) {
        const raycaster = this.getRaycaster(event);
        // because depth map is not rotated by quaternion like panorama mesh, the quaternion adjustment need to happen first
        const mappedCursorDirection = raycaster.ray.direction.applyQuaternion(this.viewerAPI.image.currentImage.orientation);
        const [cursorLon, cursorLat] = localToLonLat(mappedCursorDirection);

        // adjust to calculate pixel offset on image, values in [0;360, -90;90]
        const [adjustedLonov, adjustedLatov] = [((180 - cursorLon) + 360) % 360, cursorLat];
        
        // pixel offsets in depth map at current curser position
        const pixelX = Math.trunc((adjustedLonov / 360) * this.depthCanvas.width);
        const pixelY = Math.trunc((adjustedLatov + 90) / 180 * this.depthCanvas.height);

        // convert pixel value to depth information 
        const imgData = this.depthCanvas.getContext("2d").getImageData(pixelX, pixelY, 1, 1);
        const [red, green, blue, alpha] = imgData.data;

        // LSB red -> green -> blue MSB (ignore alpha)
        const distanceMM = red | (green << 8) | (blue << 16);

        // convert from millimeter to meter
        return distanceMM / 1000;
    }

    // returns the current location of the cursor in the three js scene (Vector3)
    getCursorLocation(event) {
        const raycaster = this.getRaycaster(event);
        // formula for position is currentLoc + direction*distance (where the direction is normalized)
        const distance = this.depthAtPointer(event);
        const cursorLocation = raycaster.ray.origin.addScaledVector(raycaster.ray.direction, distance);
        
        return cursorLocation;
    }

    getRaycaster(event) {
        // calculate mouse position in normalized device coordinates
	    // (-1 to +1) for both components
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;    
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.camera);
    
        return raycaster;
    }
    
}

// returns a normalized Vector3 pointing in the direction specified by lonov latov
const lonLatToLocal = (lonov, latov) => {
    const phi = THREE.MathUtils.degToRad(90 - latov);
    const theta = THREE.MathUtils.degToRad(lonov);

    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.sin(phi) * Math.sin(theta);
    const z = Math.cos(phi);

    return new THREE.Vector3(-x, -y, z);
}

// inverse operation to above
const localToLonLat = (vec) => {
    const phi = Math.acos(vec.z);
    const theta = Math.atan2(-vec.y, -vec.x);

    const latov = THREE.MathUtils.radToDeg(phi);
    const lonov = (THREE.MathUtils.radToDeg(theta) + 360) % 360;

    return [lonov, 90 - latov];
}
