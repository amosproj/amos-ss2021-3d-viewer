"use strict";
import { ViewerImage } from "./ViewerImage.js";
import { distanceWGS84TwoPoints } from "./Globals.js";

// Specific API for Panorama Image(s)
export class ViewerImageAPI {

    constructor(data) {
        // The file «data.json» contains the metadata defining the panorama image locations.
            //"images" Array Images Array
            //"lon0" Number Reference longitude of model (WGS 84)
            //"lat0" Number Reference latitude of model (WGS 84)
            //"floors" Object Floors Object

        this.origin = [data.lon0, data.lat0];
        this.floors = [];
        this.images = [];

        // iterate over floors
        Object.keys(data.floors).forEach((key) => {
            let currentFloor = new Floor(data.floors[key], key);

            // iterate over imageNums for this floor
            for (let imgIdx = currentFloor.i[0]; imgIdx < currentFloor.i[1]; imgIdx++) {
                let currentImage = new ViewerImage(data.images[imgIdx], imgIdx, key);

                // dx, dy distance in kilometers
                const [dx, dy] = distanceWGS84TwoPoints(this.origin[0], this.origin[1], currentImage.pos[0], currentImage.pos[1]);

                const offsetX = currentFloor.mapData.x + currentFloor.mapData.density * (dx * 1000);
                const offsetY = currentFloor.mapData.y - currentFloor.mapData.density * (dy * 1000);

                currentImage.mapOffset = [offsetX, offsetY];

                currentFloor.viewerImages.push(currentImage);
                this.images.push(currentImage);
            }

            this.floors.push(currentFloor);
        });

        // lowest floor will be at lowest index and highest floor at floors.length-1
        this.floors.sort((a, b) => (a.z > b.z) ? 1 : -1);

        this.currentFloorId = 0.0; // in range of floors.length
        this.currentImageId = this.floors[this.currentFloorId].i[0];
    }

    get currentFloor() {
        return this.floors[this.currentFloorId];
    }

    get currentImage() {
        return this.images[this.currentImageId];
    }

    all(callback) {
        // Get all panorama images.
        // Parameters: Function called with all images ([ViewerImage]): Array of panorama images
        callback(this.images);
    }

    changed() {
        //  Signal changed image data (e.g. hidden flag) to the viewer.
    }

    get get() {
        // Get the currently displayed panorama image.
        return this.currentImage();
    }

}

class Floor {

    constructor(floorData, key) {
        this.name = key;
        this.z = floorData.z;
        this.viewerImages = [];
        this.mapData = floorData.map;
        this.i = floorData.i[0];
    }

}