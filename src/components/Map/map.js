import './map.css';

import React, {useEffect, useRef, useState} from 'react';
import {createSqlQuery, getLastYearInfo, getMostVolumeInfo, tableFormatting} from "../../utils";
import {createPointGL} from "./mapUtils";
import {Dropdown, Input, Button} from "rsuite";
import {ExportCSV} from "../ExportCSV/ExportCSV";

import ArcGIGMap from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import Sketch from "@arcgis/core/widgets/Sketch";
import Table from '../ProjectsTable';
import { Box, Dialog, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';


const MapComponent = ({setNotification}) => {
    const mapRef = useRef();
    const map = new ArcGIGMap({
        basemap: 'gray-vector'
    })

    let graphicsLayerSketch = null;
    let layer = new FeatureLayer({
        url: process.env.REACT_APP_CUENCAS
    });
    let projectsLayer = new FeatureLayer({
        url: process.env.REACT_APP_PROYECTOS
    });

    const [allProjects, setAllProjectsInfo] = useState([]);
    const [projects, setProjectsInfo] = useState([]);
    const [loadingProjects, setLoadingProjectsInfo] = useState(false);
    const [cuencas, setCuencas] = useState([]);
    const [contadorCuencas, setContadorCuencas] = useState(0);
    const [balance, setBalance] = useState(null);
    const [queryGraphic, setQueryGraphic] = useState(null);
    const [mapView, setMapView] = useState(null);
    const [filtro, setFiltro] = useState("año");
    const [point, setPoint] = useState({long: 0, lat: 0})

    const [isVisible, setIsVisible] = useState(false);
    const [type, setType] = useState("Industria");

    const [coeficiente, setCoeficiente] = useState(null);

    const [quantity, setQuantity] = useState(0);

    useEffect(() => {
      switch (type) {
        case "Industria":
          setCoeficiente(20)
          break;
        case "Casa":
          setCoeficiente(10)
          break;
        default:
          setCoeficiente(0)
          break;
      }
    }, [type])

    useEffect(() => {

        let mapViewLocal = new MapView({
            container: mapRef.current,
            map: map,
            center: [-88.79499397277833, 13.7153719325982],
            zoom: 9
        });

        setMapView(mapViewLocal)

        graphicsLayerSketch = new GraphicLayer();
        map.add(graphicsLayerSketch);

        const sketch = new Sketch({
            layer: graphicsLayerSketch,
            view: mapViewLocal,
            creationMode: "update" // Auto-select
        });

        mapViewLocal.ui.add(sketch, "top-right");

        sketch.on("update", (event) => {
            if (event.state === "start") {
                setLoadingProjectsInfo(true);

                setQueryGraphic(event.graphics[0].geometry);

                //makeSpatialQuery(event.graphics[0].geometry);
            }

            if (event.state === "complete") {
                graphicsLayerSketch.remove(event.graphics[0]); // Clear the graphic when a user clicks off of it or sketches new one
            }

            if (event.toolEventInfo && (event.toolEventInfo.type === "scale-stop" || event.toolEventInfo.type === "reshape-stop" || event.toolEventInfo.type === "move-stop")) {
                makeSpatialQuery(event.graphics[0].geometry);
            }
        })

        mapViewLocal.on("click", e => {

        })
        //return () => mapView && mapView.destroy();

    }, [])

    useEffect(() => {
        calculateBalance();
    }, [projects]);

    useEffect(() => {
        if (queryGraphic) {
            clearInfo();
            makeSpatialQuery(queryGraphic);
        }
    }, [queryGraphic])

    const createPointAndQuery = () => {
        console.log(`lat: ${point.lat}, long: ${point.long}`);

        let makeQuery = true, reason = "";

        let lat = point.lat;
        let long = point.long;

        if (!((lat > -90 && lat < 90) && (long > -180 && long < 180))) {
            makeQuery = false;

            reason = "Coordenadas fuera de rango.";
        }

        if (lat == 0 || long == 0) {
            makeQuery = false;
            reason = "Campo de coordenadas vacío."
        }

        if (makeQuery) {
            clearInfo();

            mapView.center = [point.long, point.lat]
            mapView.zoom = 10

            setLoadingProjectsInfo(true);

            let newPoint = createPointGL(point.long, point.lat);

            makeSpatialQuery(newPoint.geometry);

        } else {
            setNotification(
                {
                    mensaje: reason,
                    type: "warning",
                    header: "Advertencia",
                    onClose: null
                }
            )
        }
    }

    const makeSpatialQuery = (geometry) => {

        const parcelQuery = {
            spatialRelationship: "intersects", // Relationship operation to apply
            geometry: geometry,  // The sketch feature geometry
            outFields: ["OBJECTID", "Pfastetter", "volumen_m3"], // Attributes to return
            returnGeometry: true
        };

        layer.queryFeatures(parcelQuery)
            .then((results) => {
                //setCuencas(results.features);

                if (results.features.length > 0) {
                    let array = [];

                    for (let i = 0; i < results.features.length; i++) {

                        array.push(results.features[i].attributes.Pfastetter);
                    }

                    queryTributary(array);

                    //queryProjects(results.features);
                } else {
                    setLoadingProjectsInfo(false)

                    setNotification(
                        {
                            mensaje: "No hay registro de cuencas en esta zona.",
                            type: "warning",
                            header: "Advertencia",
                            onClose: null
                        }
                    )
                }

            }).catch((error) => {
            console.log(error);
        });
    }

    const queryProjects = async (geometry) => {

        let allProjectsLocal = [];
        let projectsLocal = [];

        for (let i = 0; i < geometry.length; i++) {
            let projectQuery = {
                spatialRelationship: "intersects", // Relationship operation to apply
                geometry: geometry[i].geometry,  // The sketch feature geometry
                outFields: ["anio", "dga", "consumo_anual_m3"], // Attributes to return
                returnGeometry: true
            };

            let results = await projectsLayer.queryFeatures(projectQuery);

            //console.log(filtro, contadorCuencas);
            allProjectsLocal = allProjectsLocal.concat(results.features)
            setContadorCuencas(i + 1);
            if (filtro === "año") {

                projectsLocal = projectsLocal.concat(getLastYearInfo(results.features));

            } else {
                projectsLocal = projectsLocal.concat(getMostVolumeInfo(results.features));
            }
        }

        console.log(allProjectsLocal);

        setAllProjectsInfo(allProjectsLocal);

        displayResultProjects({features: projectsLocal});
    }

    const queryTributary = (results) => {

        const parcelQuery = {
            where: createSqlQuery(results),  // Set by select element
            outFields: ["OBJECTID", "Pfastetter", "volumen_m3"], // Attributes to return
            returnGeometry: true
        };

        layer.queryFeatures(parcelQuery)
            .then((resultsTributary) => {

                setCuencas(resultsTributary.features);

                displayResult(resultsTributary);

                queryProjects(resultsTributary.features)

            }).catch((error) => {
            console.log(error);
        });
    }

    const displayResult = (results) => {

        const symbol = {
            type: "simple-fill",
            color: [20, 130, 200, 0.5],
            outline: {
                color: "white",
                width: .5
            },
        };

        const popupTemplate = {
            title: "{Nombre_Rio}",
            content: "Esta cuenta tiene un codigo de: {Pfastetter}"
        };

        var resultado = results.features.map((feature) => {

            feature.symbol = symbol;
            feature.popupTemplate = popupTemplate;
            return feature;
        });

        mapView.graphics.addMany(resultado);
    }

    const displayResultProjects = (results) => {

        const simpleMarkerSymbol = {
            type: "simple-marker",
            color: [226, 119, 40],  // Orange
            outline: {
                color: [255, 255, 255], // White
                width: 0.5
            }
        };

        results.features.map((feature) => {

            feature.symbol = simpleMarkerSymbol;
            return feature;
        });

        mapView.graphics.addMany(results.features);

        setProjectsInfo(tableFormatting(results.features));

        setLoadingProjectsInfo(false);

        setContadorCuencas(0);
    }

    const updateProjectsInfo = (filtroLocal) => {

        let projectsLocal = []

        if (filtroLocal === "año") {

            projectsLocal = projectsLocal.concat(getLastYearInfo(allProjects));

        } else {
            projectsLocal = projectsLocal.concat(getMostVolumeInfo(allProjects));
        }

        setProjectsInfo(tableFormatting(projectsLocal));

        calculateBalance()
    }

    const calculateBalance = () => {

        if (projects && cuencas.length > 0) {

            let consumoProyectos = 0, volumen_cuencas = 0, indice = 0, estado = "";

            cuencas.forEach((e) => {

                if (e.attributes.volumen_m3) {
                    volumen_cuencas = volumen_cuencas + parseInt(e.attributes.volumen_m3);
                }
            }, this)

            projects.forEach((e) => {
                consumoProyectos = consumoProyectos + e.consumo_anual_m3;
            }, this);

            consumoProyectos = Math.round(consumoProyectos);

            indice = Intl.NumberFormat().format(consumoProyectos / volumen_cuencas)

            if (indice < 0.8) {
                estado = "Buen estado cuantitavo"
            } else if (indice >= 0.8 && indice < 1) {
                estado = "En proceso de sobre explotación"
            } else if (indice > 1) {
                estado = "Sobre explotado"
            }

            setBalance({
                volumen_cuenca: Intl.NumberFormat().format(Math.round(volumen_cuencas)),
                consumoProyectos: Intl.NumberFormat().format(consumoProyectos),
                anual: Intl.NumberFormat().format(consumoProyectos / volumen_cuencas),
                estado
            })
        }
    }

    const clearInfo = () => {
        mapView.popup.close();
        mapView.graphics.removeAll();

        setProjectsInfo([]);
    }

    const onClose = () => {
      setIsVisible(false);
    }

    const handleChangeType = e => {
      setType(e.target.value)
    }

    const handleOnCalculate = () => {
      console.log(type,coeficiente,quantity)
    }

    return (
        <div className="container mx-auto">

            <div className="row justify-center">

                <div className="mapcss" ref={mapRef}>
                    {!loadingProjects ? null :
                        <div style={{
                            height: "100vh",
                            width: "100vw",
                            position: "fixed",
                            top: 0,
                            left: 0,
                            opacity: 0.8,
                            background: "white",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center"
                        }}>

                            <div className="column textAlign">
                                <div
                                    className="animate-spin rounded-full h-20 w-20 border-b-2 border-gray-900"
                                ></div>

                                <div>
                                    {`Buscando en ${contadorCuencas}/${cuencas.length}`}
                                </div>
                            </div>
                        </div>}
                </div>

                <div>
                    <div className="m-auto ml-5 bg-white overflow-hidden shadow-x1 sm:rounded-lg">
                        <table className="bg-bgmarn table-fixed">
                            <tr className="border border-textmarn">
                                <th className="py-4 bg-bgmarn text-textmarn">Entrada por recarga hídrica potencial:</th>
                                <td className="p-3 flex justify-center bg-bgmarn text-textmarn">{!balance ? null : `${balance.volumen_cuenca} m3`}</td>
                            </tr>
                            <tr className="border border-textmarn">
                                <th className="py-4 bg-bgmarn text-textmarn">Consumo proyectos:</th>
                                <td className="p-5 flex justify-center bg-bgmarn text-textmarn">{!balance ? null : `${balance.consumoProyectos} m3`}</td>
                            </tr>
                            <tr className="border border-textmarn">
                                <th className="py-4 bg-bgmarn text-textmarn">Índice de explotación:</th>
                                <td className="p-3 flex justify-center bg-bgmarn text-textmarn">{!balance ? null : `${balance.anual}`}</td>
                            </tr>
                            <tr className="border border-textmarn">
                                <th className="py-4 bg-bgmarn text-textmarn">Estado:</th>
                                <td className="p-3 flex justify-center bg-bgmarn text-textmarn">{!balance ? null : `${balance.estado}`}</td>
                            </tr>
                        </table>
                    </div>

                    
                    <div>
                        <Input type="number" onChange={(string, event) => {
                            let newState = point;

                            newState.lat = string;

                            setPoint(newState);
                        }} className={"m-5"} placeholder={"Ingrese Latitud..."}/>

                        <Input type="number" onChange={(string, event) => {
                            let newState = point;

                            point.long = string;

                            setPoint(newState);
                        }} className={"m-5"} placeholder={"Ingrese Longitud..."}/>

                        <Button onClick={() => {
                            createPointAndQuery();
                        }} className={"m-5 bg-bgmarn text-textmarn"}>Buscar</Button>
                    </div>

                    {balance && (




                      <Stack width="100%" border="2px black solid" mt={1} ml={2} alignItems="center" justifyContent="center">

                        
                        <Button
                          onClick={()=>setIsVisible(true)}
                        >
                          TODO:
                        </Button>
                        <Dialog
                          title={"Test"}
                          open={isVisible}
                          onClose={onClose}
                          fullWidth={true}
                        >
                          <Box mt={2} p={2}>
                            <Typography
                              mb={2}
                            >
                              Seleccione tipo de industria TODO: 
                            </Typography>

                            <FormControl fullWidth>
                              <InputLabel id="type">Tipo</InputLabel>
                              <Select
                                labelId="type"
                                id="type-select"
                                value={type}
                                label="Tipo"
                                onChange={handleChangeType}
                                >
                                <MenuItem value={"Industria"}>industria</MenuItem>
                                <MenuItem value={"Casa"}>casa</MenuItem>
                              </Select>
                            </FormControl>

                          </Box>
                          <Box pl={2}>
                            <Typography
                              mb={2}
                            >
                              Coeficiente de TODO: {coeficiente}
                            </Typography>
                          </Box>

                          <Box pl={2} mb={2}>
                            <Typography
                              mb={2}
                            >
                              Ingrese metros cubicos TODO:
                            </Typography>
                            <TextField 
                              id="standard-basic"
                              label="metros cubicos:"
                              variant="standard"
                              type="number"
                              required
                              onChange={e=>setQuantity(e.target.value)}
                            />
                            <h1>{quantity}</h1>

                          </Box>

                        <Stack mb={2}>
                            <Button
                                size='large'
                                variant="contained"         
                                onClick={handleOnCalculate}
                                xs={8}
                            >
                                Calcular
                            </Button>
                        </Stack>  
                        
                          
                        </Dialog>

                      </Stack>


                      )}


                </div>
            </div>
            <div className={"row tableContainer"}>
                <Table projects={projects} loading={loadingProjects}/>

                <div>
                    <ExportCSV csvData={projects} fileName={"archivo"} setNotification={setNotification}/>
                </div>

                <div>
                    <Dropdown title={`Filtrar por: ${filtro}`} onSelect={(eventKey, event) => {
                        setFiltro(eventKey)
                        updateProjectsInfo(eventKey)
                    }}>
                        <Dropdown.Item eventKey={"año"}>Filtrar por año mas reciente</Dropdown.Item>
                        <Dropdown.Item eventKey={"consumo"}>Filtrar por mayor consumo</Dropdown.Item>
                    </Dropdown>
                </div>
            </div>
        </div>
    );
}

export default MapComponent;
