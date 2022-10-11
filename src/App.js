import './App.css';

import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import React, {useEffect, useRef, useState} from 'react';

import Map from './components/Map/map';
import Navbar from './components/Navbar/Navbar'
import Products from './pages/Products'
import Reports from './pages/Reports'
import esriConfig from "@arcgis/core/config.js";
import {Notification} from "rsuite";

//config

esriConfig.assetsPath = "./assets";
esriConfig.apiKey = process.env.REACT_APP_ARCGIS_API_KEY;

const Notificacion = ({mensaje, type, header, onClose}) => {
    return (
        <Notification closable={true} style={{position: "fixed", zIndex: 100, left: 28, top: 110}} header={header}
                      type={type}
                      onClose={onClose}>
            <text>{mensaje}</text>
        </Notification>
    )
}

function App() {

    const setNotificacion = ({mensaje, type, header}) => {
        setInfoNotificacion({mensaje, type, header});

        setVisible(true);
    }

    const [visible, setVisible] = useState(false);
    const [infoNotificacion, setInfoNotificacion] = useState("");

    return (
        <>
            <Router>
                <Navbar/>

                {!visible ? null : <Notificacion mensaje={infoNotificacion.mensaje} type={infoNotificacion.type}
                                                 header={infoNotificacion.header} onClose={() => setVisible(false)}/>}

                <Routes>
                    <Route path='/' exact element={<Map setNotification={setNotificacion}/>}/>
                    <Route path='/reports' exact element={<Reports/>}/>
                    <Route path='/products' exact element={<Products/>}/>
                </Routes>
            </Router>

        </>
    );
}

export default App;
