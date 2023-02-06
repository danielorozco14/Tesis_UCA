import "./map.css";

import React, { useEffect, useRef, useState } from "react";
import {
  createSqlQuery,
  getLastYearInfo,
  getMostVolumeInfo,
  tableFormatting,
} from "../../utils";
import { createPointGL } from "./mapUtils";
import { Dropdown, Input, Button } from "rsuite";
import { ExportCSV } from "../ExportCSV/ExportCSV";
import numeral from 'numeral';

import ArcGIGMap from "@arcgis/core/Map";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GraphicLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import Sketch from "@arcgis/core/widgets/Sketch";
import Table from "../ProjectsTable";
import { NumericFormat } from "react-number-format";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ProjectsTable from "../ProjectsTable";
import { EstimatesTable } from "../EstimatesTable/EstimatesTable";
import * as XLSX from "xlsx";
import { useForm } from "../hooks/useForm";

const MapComponent = ({ setNotification }) => {
  const mapRef = useRef();
  const map = new ArcGIGMap({
    basemap: "gray-vector",
  });

  let graphicsLayerSketch = null;
  let layer = new FeatureLayer({
    url: process.env.REACT_APP_CUENCAS,
  });
  let projectsLayer = new FeatureLayer({
    url: process.env.REACT_APP_PROYECTOS,
  });

  const date = new Date();

  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();

  // This arrangement can be altered based on how we want the date's format to appear.
  let currentDate = `${year}-${month}-${day}`;
  const { formState, onInputChange } = useForm({
    //Valor por defecto del nombre del archivo
    fileName: "Archivo-" + currentDate,
  });

  const { fileName } = formState;
  const [visualValue, setVisualValue] = useState(0);
  const [allProjects, setAllProjectsInfo] = useState([]);
  const [projects, setProjectsInfo] = useState([]);
  const [loadingProjects, setLoadingProjectsInfo] = useState(false);
  const [cuencas, setCuencas] = useState([]);
  const [contadorCuencas, setContadorCuencas] = useState(0);
  const [balance, setBalance] = useState(null);
  const [queryGraphic, setQueryGraphic] = useState(null);
  const [mapView, setMapView] = useState(null);
  const [filtro, setFiltro] = useState("año");
  const [point, setPoint] = useState({ long: 0, lat: 0 });

  const [isVisible, setIsVisible] = useState(false);
  const [isVisible2, setIsVisible2] = useState(false);

  const [type, setType] = useState("Consumo poblacional");

  const [coeficiente, setCoeficiente] = useState(null);

  const [quantity, setQuantity] = useState(0);
  const [explotationindex, setExplotationindex] = useState(0.0);
  const [estado, setEstado] = useState("");
  const [estimates, setEstimates] = useState([]);
  const [isVisible3, setIsVisible3] = useState(false);
  const [validacion, setValidacion] = useState(false);
  const [ cuencaId, setCuencaId] = useState("");
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  useEffect(() => {
    switch (true) {
      case explotationindex < 0.8:
        setEstado("Buen estado cuantitatvo");
        break;
      case explotationindex > 0.8 && explotationindex < 1:
        setEstado("En proceso de sobre-explotación");
        break;
      case explotationindex > 1:
        setEstado("Sobre-explotación");
        break;
      default:
        break;
    }
  }, [explotationindex]);

  useEffect(() => {
    switch (type) {
      case "Industria":
        setCoeficiente(20);
        break;
      case "Casa":
        setCoeficiente(10);
        break;
      default:
        setCoeficiente(0);
        break;
    }
  }, [type]);

  useEffect(() => {
    let mapViewLocal = new MapView({
      container: mapRef.current,
      map: map,
      center: [-88.79499397277833, 13.7153719325982],
      zoom: 9,
    });

    setMapView(mapViewLocal);

    graphicsLayerSketch = new GraphicLayer();
    map.add(graphicsLayerSketch);

    const sketch = new Sketch({
      layer: graphicsLayerSketch,
      view: mapViewLocal,
      creationMode: "update", // Auto-select
    });

    mapViewLocal.ui.add(sketch, "top-right");

    sketch.on("update", (event) => {
      if (event.state === "start") {
      setIsAlertVisible(true);
        setLoadingProjectsInfo(true);

        setQueryGraphic(event.graphics[0].geometry);

        //makeSpatialQuery(event.graphics[0].geometry);
      }

      if (event.state === "complete") {
        graphicsLayerSketch.remove(event.graphics[0]); // Clear the graphic when a user clicks off of it or sketches new one
      }

      if (
        event.toolEventInfo &&
        (event.toolEventInfo.type === "scale-stop" ||
          event.toolEventInfo.type === "reshape-stop" ||
          event.toolEventInfo.type === "move-stop")
      ) {
        makeSpatialQuery(event.graphics[0].geometry);
      }
    });

    mapViewLocal.on("click", (e) => {});
    //return () => mapView && mapView.destroy();
  }, []);

  useEffect(() => {
    calculateBalance();
  }, [projects]);

  useEffect(() => {
    if (queryGraphic) {
      clearInfo();
      makeSpatialQuery(queryGraphic);
    }
  }, [queryGraphic]);

  const onAcceptDialog = (event) => {

    setLoadingProjectsInfo(true);

    setQueryGraphic(event.graphics[0].geometry);
  }

  const createPointAndQuery = () => {
    console.log(`lat: ${point.lat}, long: ${point.long}`);

    let makeQuery = true,
      reason = "";

    let lat = point.lat;
    let long = point.long;

    if (!(lat > -90 && lat < 90 && long > -180 && long < 180)) {
      makeQuery = false;

      reason = "Coordenadas fuera de rango.";
    }

    if (lat == 0 || long == 0) {
      makeQuery = false;
      reason = "Campo de coordenadas vacío.";
    }

    if (makeQuery) {
      clearInfo();

      mapView.center = [point.long, point.lat];
      mapView.zoom = 10;

      setLoadingProjectsInfo(true);

      let newPoint = createPointGL(point.long, point.lat);

      makeSpatialQuery(newPoint.geometry);
    } else {
      setNotification({
        mensaje: reason,
        type: "warning",
        header: "Advertencia",
        onClose: null,
      });
    }
  };

  const makeSpatialQuery = (geometry) => {
    const parcelQuery = {
      spatialRelationship: "intersects", // Relationship operation to apply
      geometry: geometry, // The sketch feature geometry
      outFields: ["OBJECTID", "Pfastetter", "volumen_m3","nombre_rio"], // Attributes to return
      returnGeometry: true,
    };

    layer
      .queryFeatures(parcelQuery)
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
          setLoadingProjectsInfo(false);

          setNotification({
            mensaje: "No hay registro de cuencas en esta zona.",
            type: "warning",
            header: "Advertencia",
            onClose: null,
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const queryProjects = async (geometry) => {
    let allProjectsLocal = [];
    let projectsLocal = [];

    for (let i = 0; i < geometry.length; i++) {
      let projectQuery = {
        spatialRelationship: "intersects", // Relationship operation to apply
        geometry: geometry[i].geometry, // The sketch feature geometry
        outFields: ["anio", "dga", "consumo_anual_m3"], // Attributes to return
        returnGeometry: true,
      };

      let results = await projectsLayer.queryFeatures(projectQuery);
      // console.log(results);
      //console.log(filtro, contadorCuencas);
      allProjectsLocal = allProjectsLocal.concat(results.features);
      setContadorCuencas(i + 1);
      if (filtro === "año") {
        projectsLocal = projectsLocal.concat(getLastYearInfo(results.features));
      } else {
        projectsLocal = projectsLocal.concat(
          getMostVolumeInfo(results.features)
        );
      }
    }

    // console.log(allProjectsLocal);

    setAllProjectsInfo(allProjectsLocal);

    displayResultProjects({ features: projectsLocal });
  };

  const queryTributary = (results) => {

    const parcelQuery = {
      where: createSqlQuery(results), // Set by select element
      outFields: ["OBJECTID", "Pfastetter", "volumen_m3","nombre_rio"], // Attributes to return
      returnGeometry: true,
    };

    layer
      .queryFeatures(parcelQuery)
      .then((resultsTributary) => {
        setCuencas(resultsTributary.features);

        displayResult(resultsTributary);

        queryProjects(resultsTributary.features);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const displayResult = (results) => {
    const symbol = {
      type: "simple-fill",
      color: [20, 130, 200, 0.5],
      outline: {
        color: "white",
        width: 0.5,
      },
    };

    const popupTemplate = {
      title: "{Nombre_Rio}",
      content: "Esta cuenta tiene un codigo de: {Pfastetter}",
    };

    var resultado = results.features.map((feature) => {
      feature.symbol = symbol;
      feature.popupTemplate = popupTemplate;
      return feature;
    });

    mapView.graphics.addMany(resultado);
  };

  const displayResultProjects = (results) => {
    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40], // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 0.5,
      },
    };

    results.features.map((feature) => {
      feature.symbol = simpleMarkerSymbol;
      return feature;
    });

    mapView.graphics.addMany(results.features);

    setProjectsInfo(tableFormatting(results.features));

    setLoadingProjectsInfo(false);

    setContadorCuencas(0);
  };

  const updateProjectsInfo = (filtroLocal) => {
    let projectsLocal = [];

    if (filtroLocal === "año") {
      projectsLocal = projectsLocal.concat(getLastYearInfo(allProjects));
    } else {
      projectsLocal = projectsLocal.concat(getMostVolumeInfo(allProjects));
    }

    setProjectsInfo(tableFormatting(projectsLocal));

    calculateBalance();
  };

  const calculateBalance = () => {
    if (projects && cuencas.length > 0) {
      let consumoProyectos = 0,
        volumen_cuencas = 0,
        indice = 0,
        estado = "",
        listaCuencas =[];

      cuencas.forEach((e) => {
        let cuenca = "";
        if (e.attributes.volumen_m3) {
          volumen_cuencas = volumen_cuencas + parseInt(e.attributes.volumen_m3);
        }if(e.attributes.Nombre_Rio){
          cuenca =  e.attributes.Nombre_Rio +" - "+ "Codigo de cuenca:" + e.attributes.Pfastetter
        }else{
          cuenca =  "Codigo de cuenca:" + e.attributes.Pfastetter
        }

        listaCuencas.push(cuenca);
      }, this);

      projects.forEach((e) => {
        consumoProyectos = consumoProyectos + e.consumo_anual_m3;
      }, this);

      consumoProyectos = Math.round(consumoProyectos);

      indice = Intl.NumberFormat().format(consumoProyectos / volumen_cuencas);

      if (indice < 0.8) {
        estado = "Buen estado cuantitavo";
      } else if (indice >= 0.8 && indice < 1) {
        estado = "En proceso de sobre explotación";
      } else if (indice > 1) {
        estado = "Sobre explotado";
      }

      setBalance({
        volumen_cuenca: Intl.NumberFormat().format(Math.round(volumen_cuencas)),
        consumoProyectos: Intl.NumberFormat().format(consumoProyectos),
        anual: Intl.NumberFormat().format(consumoProyectos / volumen_cuencas),
        estado,
      });
      setCuencaId(listaCuencas[0]);
    }
  };

  const handleCloseAlertVisible = () =>{
    setIsAlertVisible(false);
  }

  const clearInfo = () => {
    mapView.popup.close();
    mapView.graphics.removeAll();

    setProjectsInfo([]);
  };

  const onClose = () => {
    setIsVisible(false);
  };

  const onCloseDownload = () => {
    setIsVisible3(false);
  };

  const onClose2 = () => {
    setIsVisible2(false);
  };

  const handleChangeType = (e) => {
    setType(e.target.value);
  };

  const handleOnCalculate = () => {
    const volumenNumber = balance.volumen_cuenca.replace(/\,/g, "");

    setExplotationindex(((quantity / volumenNumber) * 1).toFixed(2));
    let test = ((quantity / volumenNumber) * 1).toFixed(2);

    let indiceExplotacion = "";

    switch (true) {
      case test < 0.8:
        indiceExplotacion = "Buen estado cuantitativo";
        break;
      case test >= 0.8 && test < 1:
        indiceExplotacion = "En proceso de sobre-explotación";
        break;
      case test > 1:
        indiceExplotacion = "Sobre-explotación";
        break;
      default:
        break;
    }

    setEstimates((estimate) => [
      ...estimates,
      { tipo_de_consumo:type, cantidad_de_consumo:quantity, indice_de_explotacion: test, estado:indiceExplotacion, id_cuenca:cuencaId },
    ]);
    setIsVisible(false); 
    setIsVisible2(true);
  };

  const changeHandler = async (e) => {
    const myFile = e.target.files[0];
    // setIsFilePicked(true);
    // setSelectedFileType(e.target.files[0].type);
    const f = await myFile.arrayBuffer();
    const wb = XLSX.read(f);
    // const fileReader = new FileReader();

    const ws = wb.Sheets[wb.SheetNames[0]]; // get the first worksheet
    const data = XLSX.utils.sheet_to_json(ws);
    console.log(data); // generate objects // update st

    setEstimates(data);
  };

  const handleChange = (e)=>{
    setQuantity(e);
    // setVisualValue(e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","))
  }

  return (
    <div className="container mx-auto">
      <div className="row justify-center">
        <div className="mapcss" ref={mapRef}>
          {!loadingProjects ? null : (
            <div
              style={{
                height: "100vh",
                width: "100vw",
                position: "fixed",
                top: 0,
                left: 0,
                opacity: 0.8,
                background: "white",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div className="column textAlign">
                <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-gray-900"></div>
                {/* {console.log(balance)} */}
                <div>{`Buscando en ${contadorCuencas}/${cuencas.length}`}</div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="m-auto ml-5 bg-white overflow-hidden shadow-x1 sm:rounded-lg">
            <table className="bg-bgmarn table-fixed">
              <tr className="border border-textmarn">
                <th className="py-4 bg-bgmarn text-textmarn">
                  Entrada por recarga hídrica potencial:
                </th>
                <td className="p-3 flex justify-center bg-bgmarn text-textmarn">
                  {!balance ? null : `${balance.volumen_cuenca} m3`}
                </td>
              </tr>
              <tr className="border border-textmarn">
                <th className="py-4 bg-bgmarn text-textmarn">
                  Consumo proyectos:
                </th>
                <td className="p-5 flex justify-center bg-bgmarn text-textmarn">
                  {!balance ? null : `${balance.consumoProyectos} m3`}
                </td>
              </tr>
              <tr className="border border-textmarn">
                <th className="py-4 bg-bgmarn text-textmarn">
                  Índice de explotación:
                </th>
                <td className="p-3 flex justify-center bg-bgmarn text-textmarn">
                  {!balance ? null : `${balance.anual}`}
                </td>
              </tr>
              <tr className="border border-textmarn">
                <th className="py-4 bg-bgmarn text-textmarn">Estado:</th>
                <td className="p-3 flex justify-center bg-bgmarn text-textmarn">
                  {!balance ? null : `${balance.estado}`}
                </td>
              </tr>
            </table>
          </div>

          <div>
            <Input
              type="number"
              onChange={(string, event) => {
                let newState = point;

                newState.lat = string;

                setPoint(newState);
              }}
              className={"m-5"}
              placeholder={"Ingrese Latitud..."}
            />

            <Input
              type="number"
              onChange={(string, event) => {
                let newState = point;

                point.long = string;

                setPoint(newState);
              }}
              className={"m-5"}
              placeholder={"Ingrese Longitud..."}
            />

            <Button
              onClick={() => {
                createPointAndQuery();
              }}
              className={"m-5 bg-bgmarn text-textmarn"}
            >
              Buscar
            </Button>
          </div>

          {balance && (
            <Stack width="100%" mt={1}>
              <Button
                className={"m-5 bg-bgmarn text-textmarn"}
                onClick={() => setIsVisible(true)}
              >
                Estimar
              </Button>

              <Button
                className={"m-5 bg-bgmarn text-textmarn"}
                onClick={() => setIsVisible3(true)}
              >
                Exportar
              </Button>
              <Dialog
                title={"Test"}
                open={isVisible3}
                onClose={onCloseDownload}
                fullWidth={true}
              >
                <Stack ml={2} direction="column" width="90%" height={150}>
                  <h1>Guardar como:</h1>
                  <input
                    type="text"
                    name="fileName"
                    value={fileName}
                    onChange={onInputChange}
                    placeholder="Nombre del archivo"
                    style={{
                      marginBottom: "2px",
                    }}
                  />
                  <ExportCSV
                    csvData={estimates}
                    fileName={fileName}
                    validacion={validacion}
                  />
                </Stack>
              </Dialog>

              <Stack ml={2} direction="column" width="90%">
                <input
                  className="form-control"
                  type="file"
                  accept="xlsx, xls"
                  multiple="false"
                  name="file"
                  style={{ marginTop: "1rem", marginBottom: "1rem" }}
                  onChange={changeHandler}
                />
              </Stack>

              <Dialog
                title={"Test"}
                open={isVisible}
                onClose={onClose}
                fullWidth={true}
              >
                <Box mt={2} p={2}>
                  <Typography mb={2}>
                    Seleccione tipo de industria:
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
                      <MenuItem value={"Consumo poblacional"}>
                        Consumo poblacional
                      </MenuItem>
                      <MenuItem value={"Industrial"}>Industrial</MenuItem>
                      <MenuItem value={"Agricola"}>Agricola</MenuItem>
                      <MenuItem value={"Consumo Total"}>Consumo total</MenuItem>

                    </Select>
                  </FormControl>
                </Box>

                <Box pl={2} mb={2}>
                  <Typography mb={2}>
                    Ingrese consumo en metros cúbicos m3:
                  </Typography>
                  <TextField
                    id="standard-basic"
                    label="m3"
                    variant="standard"
                    type="number"
                    // value={setQuantity}
                    required
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </Box>

                <Stack mb={2}>
                  <Button
                    size="lg"
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

          <Dialog title={"Test"} open={isVisible2} onClose={onClose2}>
            <div className="m-auto bg-white overflow-hidden shadow-x1 sm:rounded-lg">
              <table className="bg-bgmarn table-fixed">
                <tr className="border border-textmarn">
                  <th className="py-4 bg-bgmarn text-textmarn">
                    Entrada por recarga hídrica potencial:
                  </th>
                  <td className="p-3 flex justify-center bg-bgmarn text-textmarn">
                    {!balance ? null : `${balance.volumen_cuenca} m3`}
                  </td>
                </tr>
                <tr className="border border-textmarn">
                  <th className="py-4 bg-bgmarn text-textmarn">
                    Nuevo consumo estimado de proyectos:
                  </th>
                  <td className="p-5 flex justify-center bg-bgmarn text-textmarn">
                    {/* <NumericFormat value={quantity} allowLeadingZeros thousandSeparator="," />; */}
                    {/*quantity.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "*/}
                    {numeral(quantity).format('0,0')}
                    m3
                  </td>
                </tr>
                <tr className="border border-textmarn">
                  <th className="py-4 bg-bgmarn text-textmarn">
                    Índice de explotación estimado:
                  </th>
                  <td className="p-3 flex justify-center bg-bgmarn text-textmarn">
                    {explotationindex}
                  </td>
                </tr>
                <tr className="border border-textmarn">
                  <th className="py-4 bg-bgmarn text-textmarn">
                    Estado estimado:
                  </th>
                  <td className="p-3 flex justify-center bg-bgmarn text-textmarn">
                    {estado}
                  </td>
                </tr>
              </table>
            </div>
          </Dialog>
        </div>
      </div>

      <Dialog
        open={isAlertVisible}
        onClose={handleCloseAlertVisible}
      >
        <DialogTitle>
          {"Alerta"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Se ha seleccionado una nueva cuenca.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          {/* <Button onClick={handleCloseAlertVisible}>Disagree</Button> */}
          <Button onClick={handleCloseAlertVisible} autoFocus>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      <Grid container spacing={1} direction="row" mb={5}>
        <div className={"row tableContainer"}>
          <div className={"tableSpace"}>
            <Table projects={projects} loading={loadingProjects} />
          </div>
          {estimates.length > 0 && <EstimatesTable estimates={estimates} />}
        </div>
      </Grid>
    </div>
  );
};

export default MapComponent;