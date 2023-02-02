import React from "react";
import "./../ProjectsTable/index.css";

import { Header, Pagination } from "rsuite";
import numeral from 'numeral';

import Table from "rsuite/Table";
import { ExportCSV } from "../ExportCSV/ExportCSV";

export const EstimatesTable = ({ estimates }) => {

  const tableHeader = {background:"#303845", color:"white", fontWeight: "900"};
  console.log("estimates table",JSON.stringify(estimates))

  if(estimates){
    estimates.forEach(estimate => {
      estimate.cantidad_de_consumo = numeral(estimate.cantidad_de_consumo).format('0,0');
    })
  }
  // estimates[0].quantity = numeral(estimates[0].quantity).format('0,0');
  return (
    <div className="containerTable">
        <Table
        wordWrap="break-word"
          width={1250}
          height={400}
          data={estimates}
          loading={false}
          className="sm:rounded-lg"
          autoHeight={true}
        >
          <Table.Column width={250} align="center" fixed="right">
            <Table.HeaderCell style={tableHeader}>
              Identificacion de cuenca
            </Table.HeaderCell>
            <Table.Cell dataKey="id_cuenca" />
          </Table.Column>
          <Table.Column align="center" width={250}>
            <Table.HeaderCell style={tableHeader}>Consumo</Table.HeaderCell>
            <Table.Cell dataKey="tipo_de_consumo" />
          </Table.Column>
          
            <Table.Column width={250} align="center" fixed>
              <Table.HeaderCell style={tableHeader}>Cantidad</Table.HeaderCell>
              <Table.Cell dataKey="cantidad_de_consumo" />
            </Table.Column>
          

          <Table.Column align="center" width={250}>
            <Table.HeaderCell style={tableHeader}>Indice</Table.HeaderCell>
            <Table.Cell dataKey="indice_de_explotacion" />
          </Table.Column>

          <Table.Column width={250} align="center" fixed="right">
            <Table.HeaderCell style={tableHeader}>
              Estado
            </Table.HeaderCell>
            <Table.Cell dataKey="estado" />
          </Table.Column>

          
          {/* <Table.Column>
                  <Table.HeaderCell style={tableHeader} >
                      <ExportCSV csvData={projects} fileName={"archivo"} />
                  </Table.HeaderCell>
                  <Table.Cell/>
              </Table.Column>*/}
        </Table>

    </div>
  );
};