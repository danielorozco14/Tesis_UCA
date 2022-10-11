import React from 'react'
//import Button from 'react-bootstrap/Button';
import Button from 'rsuite/Button';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';

export const ExportCSV = ({csvData, fileName, setNotification}) => {

    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const exportToCSV = (csvData, fileName) => {
        const ws = XLSX.utils.json_to_sheet(csvData);
        const wb = {Sheets: {'data': ws}, SheetNames: ['data']};
        const excelBuffer = XLSX.write(wb, {bookType: 'xlsx', type: 'array'});
        const data = new Blob([excelBuffer], {type: fileType});
        FileSaver.saveAs(data, fileName + fileExtension);
    }

    return (
        <Button appearance="primary" size="xs" onClick={(e) => {

            if (csvData.length > 0) {
                exportToCSV(csvData, fileName)
            }else{
                setNotification(
                    {
                        mensaje: "No hay data que exportar.",
                        type: "warning",
                        header: "Advertencia",
                        onClose: null
                    }
                )
            }
        }}>Exportar</Button>
    )
}
