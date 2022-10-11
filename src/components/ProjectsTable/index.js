import './index.css';
import 'rsuite/dist/rsuite.min.css';

import {Header, Pagination} from "rsuite";
import React, {useEffect} from "react";

import Table from 'rsuite/Table';
import {ExportCSV} from "../ExportCSV/ExportCSV";

const ProjectsTable = ({loading, projects}) => {

    const [limit, setLimit] = React.useState(10);
    const [page, setPage] = React.useState(1);

    const handleChangeLimit = dataKey => {
        setPage(1);
        setLimit(dataKey);

    };

    const data = projects.filter((v, i) => {
        const start = limit * (page - 1);
        const end = start + limit;
        return i >= start && i < end;
    });


    const tableHeader = {background:"#303845", color:"white", fontWeight: "900"};
    return (

        <div className="containerTable" >
            <div>
                <Table
                    width={530}
                    height={400}
                       data={data}
                       loading={false}
                       className="sm:rounded-lg"
                       autoHeight={true}
                       loading={loading}>

                    {<Table.Column width={150} align="center" fixed>
                        <Table.HeaderCell style={tableHeader}>Año</Table.HeaderCell>
                        <Table.Cell dataKey="anio"/>
                    </Table.Column>}

                    <Table.Column width={140}>
                        <Table.HeaderCell style={tableHeader}>DGA</Table.HeaderCell>
                        <Table.Cell dataKey="dga"/>
                    </Table.Column >

                    <Table.Column width={240} fixed="right">
                        <Table.HeaderCell style={tableHeader}>Consumo anual (metros cubicos)</Table.HeaderCell>
                        <Table.Cell dataKey="consumo_anual_m3"/>
                    </Table.Column>
                    {/* <Table.Column>
                        <Table.HeaderCell style={tableHeader} >
                            <ExportCSV csvData={projects} fileName={"archivo"} />
                        </Table.HeaderCell>
                        <Table.Cell/>
                    </Table.Column>*/}
                </Table>

                <div style={{padding: 12}}>
                    {data.length === 0 ? null : <Pagination
                        prev
                        next
                        boundaryLinks
                        maxButtons={5}
                        size="md"
                        layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                        total={projects.length}
                        limitOptions={[10, 20]}
                        limit={limit}
                        activePage={page}
                        onChangePage={setPage}
                        onChangeLimit={handleChangeLimit}
                    />}
                </div>
            </div>

        </div>

    )
}

export default ProjectsTable;
