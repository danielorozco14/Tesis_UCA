import './navbar.css'

import * as AiIcons from 'react-icons/ai';
import * as FaIcons from 'react-icons/fa';

import React, {useState} from 'react'

import {Link} from 'react-router-dom'
import {SidebarData} from './SidebarData'

function Navbar() {
    const [sidebar, setsidebar] = useState(false)
    const showSidebar = () => setsidebar(!sidebar)
    return (
        <>
        <div className="navbar">
            <Link to="#" className="menu-bars">
                <FaIcons.FaBars onClick={showSidebar} />

            </Link>
            <div className=" m-auto flex justify-center p-1">
                <img src="/assets/img/marn.png" className="object-contain m-auto h-20" alt="" />
            </div>
        </div>
        <nav className={sidebar ? 'nav-menu active' : 'nav-menu'}>
            <ul className="nav-menu-items" onClick={showSidebar}>
                <li className="navbar-toogle">
                    <Link to="#" className="menu-bars">
                        <AiIcons.AiOutlineClose className="ml-8"/>
                    </Link>
                </li>
                {SidebarData.map((item, index) => {
                    return (
                        <li key={index} className={item.cName}>
                            <Link to={item.path}>
                                {item.icon}
                                <span>{item.title}</span>
                            </Link>
                        </li>

                    )
                })}
            </ul>
        </nav>

        </>
    )
}

export default Navbar
