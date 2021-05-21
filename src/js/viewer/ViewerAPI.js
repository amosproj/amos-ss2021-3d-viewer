"use strict";
import { libraryInfo } from "./LibraryInfo.js";


// API provided by the viewer
export class ViewerAPI {

    constructor(viewerImageAPI, viewerPanoAPI, viewerMapAPI, viewerFloorAPI) {
        this.min = 1;
        this.viewerImageAPI = viewerImageAPI;
        this.viewerPanoAPI = viewerPanoAPI;
        this.viewerMapAPI = viewerMapAPI;
        this.viewerFloorAPI = viewerFloorAPI;
        this.libs = libraryInfo(); // List of used third party libraries
        
        
       this.MAJOR =null;//adding in 18.05.2021

      
       this.MINOR =null;// adding in 18.05.2021
    }


    //Move the view to the given position.
    move(lon, lat, z) {

        let temp = [lon, lat, z];
        let resultset = [];
        let minval;
        let minkey;

        for (let i in this.viewerFloorAPI.currentFloor.viewerImages) {
            let result = Math.sqrt(
                Math.pow(this.viewerFloorAPI.currentFloor.viewerImages[i].pos[0] - temp[0], 2) +
                Math.pow(this.viewerFloorAPI.currentFloor.viewerImages[i].pos[1] - temp[1], 2) +
                Math.pow(this.viewerFloorAPI.currentFloor.viewerImages[i].pos[2] - temp[2], 2) ); // z value probably doesnt/should matter (see WGS84distance in Globals)
            resultset.push(result);  
        }

        minkey = 0;
        minval = resultset[0];
        for (let i in resultset) {
            if (resultset[i] < minval) {
                minval = resultset[i];
                minkey = i;
            }
        }

        this.min = minkey;

        
        // avoid duplication
        if (this.min != this.viewerImageAPI.currentImageId){

            this.viewerPanoAPI.display(this.min);
            this.viewerMapAPI.redraw();

        }
    }


}
