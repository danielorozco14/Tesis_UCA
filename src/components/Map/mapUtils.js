import Graphic from '@arcgis/core/Graphic';

export const createPointGL = (long, lat) => {
    const point = {
        type: 'point',
        longitude: long,
        latitude: lat
    }

    const simpleMarkerSymbol = {
        type: "simple-marker",
        color: [226, 119, 40],  // Orange
        outline: {
            color: [255, 255, 255], // White
            width: 0.5
        }
    };

    const pointGraphic = new Graphic({
        geometry: point,
        symbol: simpleMarkerSymbol
    });

    return pointGraphic;
}

export const createPolygonGL = (pointsArray) => { //Longitude, latitude
    const polygon = {
        type: "polygon",
        rings: [
            pointsArray
        ]
    };

    const simpleFillSymbol = {
        type: "simple-fill",
        color: [227, 139, 79, 0.8],  // Orange, opacity 80%
        outline: {
            color: [255, 255, 255],
            width: 1
        }
    };

    const polygonGraphic = new Graphic({
        geometry: polygon,
        symbol: simpleFillSymbol,

    });

    return polygonGraphic;
}

export const createPointFL = () => {


}
