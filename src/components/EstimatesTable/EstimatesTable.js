import React from "react";
import "./../ProjectsTable/index.css";

import { Header, Pagination } from "rsuite";

import Table from "rsuite/Table";
import { ExportCSV } from "../ExportCSV/ExportCSV";

export const EstimatesTable = ({ estimates }) => {

  const tableHeader = {background:"#303845", color:"white", fontWeight: "900"};
  return (
    <div className="containerTable">
      <div>
        <Table
          width={1000}
          height={400}
          data={estimates}
          loading={false}
          className="sm:rounded-lg"
          autoHeight={true}
        >
          <Table.Column align="center" width={250}>
            <Table.HeaderCell style={tableHeader}>Consumo</Table.HeaderCell>
            <Table.Cell dataKey="type" />
          </Table.Column>
          
            <Table.Column width={250} align="center" fixed>
              <Table.HeaderCell style={tableHeader}>Cantidad</Table.HeaderCell>
              <Table.Cell dataKey="quantity" />
            </Table.Column>
          

          <Table.Column align="center" width={250}>
            <Table.HeaderCell style={tableHeader}>Indice</Table.HeaderCell>
            <Table.Cell dataKey="explotationindex" />
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

        {/* <div style={{ padding: 12 }}>
          {data.length === 0 ? null : (
            <Pagination
              prev
              next
              boundaryLinks
              maxButtons={5}
              size="md"
              layout={["total", "-", "limit", "|", "pager", "skip"]}
              total={projects.length}
              limitOptions={[10, 20]}
              limit={limit}
              activePage={page}
              onChangePage={setPage}
              onChangeLimit={handleChangeLimit}
            />
          )}
        </div> */}
      </div>
    </div>
  );
};
