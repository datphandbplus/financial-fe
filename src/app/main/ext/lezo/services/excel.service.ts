import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import * as logoFile from '../../../../utils/dbPlusLogo.js';
import {
    getFileName, getFileNames,
    numToExcelColumn
} from '@app/utils/tableUtils';

@Injectable({
    providedIn: 'root'
})
export class ExcelService {

    constructor() { }

    /**
     * data: [[a, true, 13, sdsadas], [da, false, 45, sfddf]]
     * title: ''
     * headerSetting: {header: ['cot 1', 'cot 2', 'cot 3', 'cot 4'], fgColor: 'FFFFFF00', bgColor: 'FF0000FF', widths: []}
     * extraData = [{title: '', value: any, fgColors: [], bgColors: []}]
     * infoData = {data: [{title: '', value: '', fgColor: '', bgColor: ''}], cols: 4}
     * **/
    async exportArrayToExcel(data: any[], title: string, headerSetting: any, sheet_name: string, file_name: string, extraData?: any[], infoData?: any) {
        const {sheetName, fileName} = getFileName(sheet_name, file_name);
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet(sheetName);
        let count: number = 0;

        const titleRow = worksheet.addRow([title]);
        titleRow.font = { name: 'Tahoma', family: 4, size: 16, underline: 'double', bold: true };
        worksheet.addRow([]);
        worksheet.mergeCells(`A1:${numToExcelColumn(headerSetting.header.length - 2)}2`);

        worksheet.addRow([]);
        if (infoData && infoData.data && infoData.data.length > 0) {
            worksheet.addRow([]);
            count += 4;
        } else {
            count += 3;
        }

        if (infoData && infoData.data && infoData.data.length > 0) {
            const numOfColumns = +infoData.cols;
            const numOfRows =  Math.floor(infoData.data.length/numOfColumns + 0.5);
            for (let kR = 0; kR < numOfRows; kR++) {
                const infoDataTitle = [];
                const infoDataValue = [];
                const dataRichTextFormat: any[] = [];
                for (let kC = 0; kC < infoData.cols; kC++) {
                    const titleData = infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].title ? infoData.data[kR*numOfColumns + kC].title : '';
                    const valueData = infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].value ? infoData.data[kR*numOfColumns + kC].value : '';
                    infoDataTitle.push(titleData);
                    infoDataValue.push(valueData);
                    if (infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].richText) {
                        dataRichTextFormat.push({value: infoData.data[kR*numOfColumns + kC].richText, index: kC})
                    }
                }
                const infoRowTitle = worksheet.addRow(infoDataTitle);
                const infoRowValue = worksheet.addRow(infoDataValue);
                worksheet.addRow([]);
                infoRowTitle.eachCell((cell1, _number1) => {
                    cell1.font = { name: 'Tahoma', family: 4, size: 12, bold: true};
                });
                infoRowValue.eachCell((cell2, _number2) => {
                    cell2.font = { name: 'Tahoma', family: 4, size: 12, color: { argb: infoData.data[kR*numOfColumns + (_number2 - 1)].fgColor || '000000' }};
                    cell2.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: infoData.data[kR*numOfColumns + (_number2 - 1)].bgColor || 'FFFFFF' }
                    };
                });
                dataRichTextFormat.forEach(dfR => {
                    const itemFormatRichText = infoRowValue.getCell(dfR.index + 1);
                    itemFormatRichText.value = {richText: dfR.value};
                    itemFormatRichText.alignment = {
                        horizontal: 'left',
                        vertical: 'middle',
                        wrapText: true
                    };
                });
                count += 3;
            }
        }

        worksheet.addRow([]);
        count++;

        // Add Header Row
        const headerRow = worksheet.addRow(headerSetting.header);
        count++;

        // Cell Style : Fill and Border
        headerRow.height = 40;
        headerRow.alignment = {
            wrapText: true,
            vertical: "middle",
            horizontal: "left"
        };
        headerRow.eachCell((cell, _number) => {
            cell.font = { name: 'Tahoma', family: 4, size: 12, bold: true, color: { argb: headerSetting.fgColor || '000000' }};
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: headerSetting.bgColor || '00245A' }
            };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Add Image
        const logo = workbook.addImage({
            base64: logoFile.logoBase64,
            extension: 'png',
        });

        worksheet.addImage(logo, `${numToExcelColumn(headerSetting.header.length - 1)}1:${numToExcelColumn(headerSetting.header.length)}3`);

        if (data.length < 1) {
            // Footer Row
            const t = worksheet.addRow([headerSetting.noData]);
            const itemTotalLabel = t.getCell(1);
            itemTotalLabel.alignment = {
                horizontal: 'center'
            };
            itemTotalLabel.font = {name: 'Tahoma', family: 4, size: 13, bold: true};
            itemTotalLabel.border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'}
            };
            count++;
            worksheet.mergeCells(`A${count}:${numToExcelColumn(headerSetting.header.length)}${count}`);
        } else {
            // Add Data and Conditional Formatting
            data.forEach((item: any[]) => {
                const rowData: any[] = [];
                const dataFormat: any[] = [];
                const dataRichTextFormat: any[] = [];
                item.forEach((d: any, index: number) => {
                    if (typeof d === 'object') {
                        if (d.richText) {
                            rowData.push(d);
                            dataRichTextFormat.push({value: d.richText, index});
                        } else {
                            rowData.push(d.value);
                            const fI: any = {
                                index
                            };
                            if (d.alignment) {
                                fI.alignment = d.alignment;
                            }
                            if (d.fgColor) {
                                fI.fgColor = d.fgColor;
                            }
                            if (d.bgColor) {
                                fI.bgColor = d.bgColor;
                            }
                            dataFormat.push(fI);
                        }
                    } else {
                        rowData.push(d);
                    }
                });
                const row = worksheet.addRow(rowData);
                row.eachCell((cell, _number) => {
                    cell.font = {name: 'Tahoma', family: 4, size: 12};
                    cell.border = {
                        top: {style: 'thin'},
                        left: {style: 'thin'},
                        bottom: {style: 'thin'},
                        right: {style: 'thin'}
                    };
                });
                row.alignment = {
                    vertical: 'middle',
                    wrapText: true
                };
                dataFormat.forEach(df => {
                    const itemFormat = row.getCell(df.index + 1);
                    try {
                        if (df.bgColor) {
                            itemFormat.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: {argb: df.fgColor},
                                bgColor: {argb: df.bgColor}
                            };
                        } else {
                            itemFormat.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: {argb: df.fgColor}
                            };
                        }
                    } catch (e) {}
                    itemFormat.alignment = df.alignment ? df.alignment : {
                        horizontal: 'center',
                        vertical: 'middle',
                        wrapText: true
                    };
                });
                dataRichTextFormat.forEach(dfR => {
                    const itemFormatRichText = row.getCell(dfR.index + 1);
                    itemFormatRichText.value = {richText: dfR.value};
                    itemFormatRichText.alignment = {
                        horizontal: 'right',
                        vertical: 'middle',
                        wrapText: true
                    };
                });
                count++;
            });

            let filterRow = 5;
            if (infoData && infoData.data && infoData.data.length > 0) {
                const numOfColumns = +infoData.cols;
                const numOfRows = Math.floor(infoData.data.length / numOfColumns + 0.5);
                filterRow = numOfRows*3 + 6;
            }
            worksheet.autoFilter = `A${filterRow}:${numToExcelColumn(data[0].length)}${filterRow}`;
            // Footer Row
            if (extraData && extraData.length > 0) {
                extraData.forEach(extra => {
                    const extraRowData = data.map((item: any[]) => item.map(_it => ''))[0];
                    extraRowData[0] = extra.title + ':';
                    extraRowData[extraRowData.length - 1] = extra.value;
                    const t = worksheet.addRow(extraRowData);
                    const itemTotalLabel = t.getCell(1);
                    itemTotalLabel.alignment = {
                        horizontal: 'right'
                    };
                    t.eachCell((cell, _number) => {
                        if (extra.fgColors && extra.fgColors.length) {
                            const fillIndex = _number < data[0].length ? 0 : 1;
                            cell.font = {
                                name: 'Tahoma',
                                family: 4,
                                size: 12,
                                bold: true,
                                color: {argb: extra.fgColors[fillIndex]}
                            };
                            if (extra.bgColors && extra.bgColors[fillIndex]) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: {argb: extra.bgColors[fillIndex]}
                                };
                            }
                        } else {
                            cell.font = {name: 'Tahoma', family: 4, size: 12, bold: true};
                        }
                        cell.border = {
                            top: {style: 'thin'},
                            left: {style: 'thin'},
                            bottom: {style: 'thin'},
                            right: {style: 'thin'}
                        };
                    });
                    count++;
                    worksheet.mergeCells(`A${count}:${numToExcelColumn(headerSetting.header.length - 1)}${count}`);
                });
            }

            data.forEach((_d, ind) => {
                if (headerSetting.widths && headerSetting.widths.length) {
                    worksheet.getColumn(ind + 1).width = headerSetting.widths[ind];
                } else {
                    worksheet.columns.forEach(function (col, _i) {
                        let maxLength = 0;
                        col["eachCell"]({includeEmpty: true}, function (ce) {
                            const columnLength = ce.value ? (ce.value.toString().length + 5) : 10;
                            if (columnLength > maxLength) {
                                maxLength = columnLength;
                            }
                        });
                        if (typeof _d[_i] === 'object' && Object.keys(_d[_i]).length > 0) {
                            col.width = 25;
                        } else {
                            col.width = maxLength < 10 ? 10 : maxLength;
                        }
                    });
                }
            });
        }
        // Generate Excel File with given name
        workbook.xlsx.writeBuffer().then((data: any) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, `${fileName}.xlsx`);
        });
    }

    /**
     * data: [[[a, true, 13, sdsadas], [da, false, 45, sfddf]]]
     * titles: ['', '']
     * headerSettings: [{header: ['cot 1', 'cot 2', 'cot 3', 'cot 4'], fgColor: 'FFFFFF00', bgColor: 'FF0000FF', widths: []}]
     * extras = [[{title: '', value: any, fgColors: [], bgColors: []}]]
     * infoData = {data: [{title: '', value: '', fgColor: '', bgColor: ''}], cols: 4, applySheetIndex: 1}
     * **/
    async exportArraysToExcel(datas: any[], titles: string[], headerSettings: any[], sheet_names: string[], file_name: string, extras?: any[], infoData?: any) {
        const {sheetNames, fileName} = getFileNames(sheet_names, file_name);
        const workbook = new Workbook();
        for (let sheetIndex = 0; sheetIndex < datas.length; sheetIndex++) {
            const data = datas[sheetIndex];
            const worksheet = workbook.addWorksheet(sheetNames[sheetIndex]);
            let count: number = 0;
            const title = titles[sheetIndex];
            const titleRow = worksheet.addRow([title]);
            titleRow.font = {name: 'Tahoma', family: 4, size: 16, underline: 'double', bold: true};
            worksheet.addRow([]);
            worksheet.mergeCells(`A1:${numToExcelColumn(headerSettings[sheetIndex].header.length - 2)}2`);

            worksheet.addRow([]);
            if (sheetIndex === (infoData.applySheetIndex || 0) && infoData && infoData.data && infoData.data.length > 0) {
                worksheet.addRow([]);
                count += 4;
            } else {
                count += 3;
            }

            if (sheetIndex === (infoData.applySheetIndex || 0) && infoData && infoData.data && infoData.data.length > 0) {
                const numOfColumns = +infoData.cols;
                const numOfRows =  Math.floor(infoData.data.length/numOfColumns + 0.5);
                for (let kR = 0; kR < numOfRows; kR++) {
                    const infoDataTitle = [];
                    const infoDataValue = [];
                    const dataRichTextFormat: any[] = [];
                    for (let kC = 0; kC < infoData.cols; kC++) {
                        const titleData = infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].title ? infoData.data[kR*numOfColumns + kC].title : '';
                        const valueData = infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].value ? infoData.data[kR*numOfColumns + kC].value : '';
                        infoDataTitle.push(titleData);
                        infoDataValue.push(valueData);
                        if (infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].richText) {
                            dataRichTextFormat.push({value: infoData.data[kR*numOfColumns + kC].richText, index: kC})
                        }
                    }
                    const infoRowTitle = worksheet.addRow(infoDataTitle);
                    const infoRowValue = worksheet.addRow(infoDataValue);
                    worksheet.addRow([]);
                    infoRowTitle.eachCell((cell1, _number1) => {
                        cell1.font = { name: 'Tahoma', family: 4, size: 12, bold: true};
                    });
                    infoRowValue.eachCell((cell2, _number2) => {
                        cell2.font = { name: 'Tahoma', family: 4, size: 12, color: { argb: infoData.data[kR*numOfColumns + (_number2 - 1)].fgColor || '000000' }};
                        cell2.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: infoData.data[kR*numOfColumns + (_number2 - 1)].bgColor || 'FFFFFF' }
                        };
                    });
                    dataRichTextFormat.forEach(dfR => {
                        const itemFormatRichText = infoRowValue.getCell(dfR.index + 1);
                        itemFormatRichText.value = {richText: dfR.value};
                        itemFormatRichText.alignment = {
                            horizontal: 'left',
                            vertical: 'middle',
                            wrapText: true
                        };
                    });
                    count += 3;
                }
            }

            worksheet.addRow([]);
            count++;

            // Add Header Row
            const headerRow = worksheet.addRow(headerSettings[sheetIndex].header);
            count++;

            // Cell Style : Fill and Border
            headerRow.height = 40;
            headerRow.alignment = {
                wrapText: true,
                vertical: "middle",
                horizontal: "left"
            };
            headerRow.eachCell((cell, _number) => {
                cell.font = {name: 'Tahoma', family: 4, size: 12, bold: true, color: { argb: headerSettings[sheetIndex].fgColor || 'ffffff' }};
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: headerSettings[sheetIndex].bgColor || '00245A' }
                };
                cell.border = {
                    top: {style: 'thin'},
                    left: {style: 'thin'},
                    bottom: {style: 'thin'},
                    right: {style: 'thin'}
                };
            });

            // Add Image
            const logo = workbook.addImage({
                base64: logoFile.logoBase64,
                extension: 'png',
            });

            worksheet.addImage(logo, `${numToExcelColumn(headerSettings[sheetIndex].header.length - 1)}1:${numToExcelColumn(headerSettings[sheetIndex].header.length)}3`);

            if (data.length < 1) {
                // Footer Row
                const t = worksheet.addRow([headerSettings[sheetIndex].noData]);
                const itemTotalLabel = t.getCell(1);
                itemTotalLabel.alignment = {
                    horizontal: 'center'
                };
                itemTotalLabel.font = {name: 'Tahoma', family: 4, size: 13, bold: true};
                itemTotalLabel.border = {
                    top: {style: 'thin'},
                    left: {style: 'thin'},
                    bottom: {style: 'thin'},
                    right: {style: 'thin'}
                };
                count++;
                worksheet.mergeCells(`A${count}:${numToExcelColumn(headerSettings[sheetIndex].header.length)}${count}`);
            } else {
                // Add Data and Conditional Formatting
                data.forEach((item: any[]) => {
                    const rowData: any[] = [];
                    const dataFormat: any[] = [];
                    const dataRichTextFormat: any[] = [];
                    item.forEach((d: any, index: number) => {
                        if (typeof d === 'object') {
                            if (d.richText) {
                                rowData.push(d);
                                dataRichTextFormat.push({value: d.richText, index});
                            } else {
                                rowData.push(d.value);
                                const fI: any = {
                                    index
                                };
                                if (d.alignment) {
                                    fI.alignment = d.alignment;
                                }
                                if (d.fgColor) {
                                    fI.fgColor = d.fgColor;
                                }
                                if (d.bgColor) {
                                    fI.bgColor = d.bgColor;
                                }
                                dataFormat.push(fI);
                            }
                        } else {
                            rowData.push(d);
                        }
                    });
                    const row = worksheet.addRow(rowData);
                    row.eachCell((cell, _number) => {
                        cell.font = {name: 'Tahoma', family: 4, size: 12};
                        cell.border = {
                            top: {style: 'thin'},
                            left: {style: 'thin'},
                            bottom: {style: 'thin'},
                            right: {style: 'thin'}
                        };
                    });
                    row.alignment = {
                        vertical: 'middle',
                        wrapText: true
                    };
                    dataFormat.forEach(df => {
                        const itemFormat = row.getCell(df.index + 1);
                        try {
                            if (df.bgColor) {
                                itemFormat.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: {argb: df.fgColor},
                                    bgColor: {argb: df.bgColor}
                                };
                            } else {
                                itemFormat.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: {argb: df.fgColor}
                                };
                            }
                        } catch (e) {}
                        itemFormat.alignment = df.alignment ? df.alignment : {
                            horizontal: 'center',
                            vertical: 'middle',
                            wrapText: true
                        };
                    });
                    dataRichTextFormat.forEach(dfR => {
                        const itemFormatRichText = row.getCell(dfR.index + 1);
                        itemFormatRichText.value = {richText: dfR.value};
                        itemFormatRichText.alignment = {
                            horizontal: 'right',
                            vertical: 'middle',
                            wrapText: true
                        };
                    });
                    count++;
                });

                let filterRow = 5;
                if (sheetIndex === (infoData.applySheetIndex || 0) && infoData && infoData.data && infoData.data.length > 0) {
                    const numOfColumns = +infoData.cols;
                    const numOfRows = Math.floor(infoData.data.length / numOfColumns + 0.5);
                    filterRow = numOfRows*3 + 6;
                }
                worksheet.autoFilter = `A${filterRow}:${numToExcelColumn(data[0].length)}${filterRow}`;
                const extraData = extras[sheetIndex];
                // Footer Row
                if (extraData && extraData.length > 0) {
                    extraData.forEach(extra => {
                        const extraRowData = data.map((item: any[]) => item.map(_it => ''))[0];
                        extraRowData[0] = extra.title + ':';
                        extraRowData[extraRowData.length - 1] = extra.value;
                        const t = worksheet.addRow(extraRowData);
                        const itemTotalLabel = t.getCell(1);
                        itemTotalLabel.alignment = {
                            horizontal: 'right'
                        };
                        t.eachCell((cell, _number) => {
                            if (extra.fgColors && extra.fgColors.length) {
                                const fillIndex = _number < data[0].length ? 0 : 1;
                                cell.font = {
                                    name: 'Tahoma',
                                    family: 4,
                                    size: 12,
                                    bold: true,
                                    color: {argb: extra.fgColors[fillIndex]}
                                };
                                if (extra.bgColors && extra.bgColors[fillIndex]) {
                                    cell.fill = {
                                        type: 'pattern',
                                        pattern: 'solid',
                                        fgColor: {argb: extra.bgColors[fillIndex]}
                                    };
                                }
                            } else {
                                cell.font = {name: 'Tahoma', family: 4, size: 12, bold: true};
                            }
                            cell.border = {
                                top: {style: 'thin'},
                                left: {style: 'thin'},
                                bottom: {style: 'thin'},
                                right: {style: 'thin'}
                            };
                        });
                        count++;
                        worksheet.mergeCells(`A${count}:${numToExcelColumn(headerSettings[sheetIndex].header.length - 1)}${count}`);
                    });
                }
                data.forEach((_d, ind) => {
                    if (headerSettings[sheetIndex].widths && headerSettings[sheetIndex].widths.length) {
                        worksheet.getColumn(ind + 1).width = headerSettings[sheetIndex].widths[ind];
                    } else {
                        worksheet.columns.forEach(function (col, _i) {
                            let maxLength = 0;
                            col["eachCell"]({includeEmpty: true}, function (ce) {
                                const columnLength = ce.value ? (ce.value.toString().length + 5) : 10;
                                if (columnLength > maxLength) {
                                    maxLength = columnLength;
                                }
                            });
                            if (typeof _d[_i] === 'object' && Object.keys(_d[_i]).length > 0) {
                                col.width = 25;
                            } else {
                                col.width = maxLength < 10 ? 10 : maxLength;
                            }
                        });
                    }
                });
            }
        }
        // Generate Excel File with given name
        workbook.xlsx.writeBuffer().then((data: any) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, `${fileName}.xlsx`);
        });
    }

    /**
     * data: [[a, true, 13, sdsadas], [da, false, 45, sfddf]]
     * title: ''
     * headerSetting: {header: ['cot 1', 'cot 2', 'cot 3', 'cot 4'], fgColor: 'FFFFFF00', bgColor: 'FF0000FF', widths: []}
     * extraData = [{title: '', value: any, fgColors: [], bgColors: []}]
     * infoDatas = [{data: [{title: '', value: '', fgColor: '', bgColor: ''}], cols: 4, blockTitle: 'Tieu de block'}]
     * **/
    async exportArrayMultiDataInfoToExcel(data: any[], title: string, headerSetting: any, sheet_name: string, file_name: string, extraData?: any[], infoDatas?: Array<any>) {
        const {sheetName, fileName} = getFileName(sheet_name, file_name);
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet(sheetName);
        let count: number = 0;

        const titleRow = worksheet.addRow([title]);
        titleRow.font = { name: 'Tahoma', family: 4, size: 16, underline: 'double', bold: true };
        worksheet.addRow([]);
        worksheet.mergeCells(`A1:${numToExcelColumn(headerSetting.header.length - 2)}2`);

        worksheet.addRow([]);
        if (infoDatas && infoDatas.length > 0) {
            worksheet.addRow([]);
            count += 4;
        } else {
            count += 3;
        }

        infoDatas.forEach((infoData: any) => {
            if (infoData && infoData.data && infoData.data.length > 0) {
                const blockTitleRow = worksheet.addRow([infoData.blockTitle]);
                blockTitleRow.font = { name: 'Tahoma', family: 4, size: 13, bold: true};
                worksheet.addRow([]);
                count += 2;
                const numOfColumns = +infoData.cols;
                const numOfRows =  Math.floor(infoData.data.length/numOfColumns + 0.5);
                for (let kR = 0; kR < numOfRows; kR++) {
                    const infoDataTitle = [];
                    const infoDataValue:any[] = [];
                    const dataRichTextFormat: any[] = [];
                    for (let kC = 0; kC < infoData.cols; kC++) {
                        const titleData = infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].title ? infoData.data[kR*numOfColumns + kC].title : '';
                        const valueData = infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].value ? infoData.data[kR*numOfColumns + kC].value : '';
                        infoDataTitle.push(titleData);
                        infoDataValue.push(valueData);
                        if (infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].richText) {
                            dataRichTextFormat.push({value: infoData.data[kR*numOfColumns + kC].richText, index: kC})
                        }
                    }
                    const infoRowTitle = worksheet.addRow(infoDataTitle);
                    const infoRowValue = worksheet.addRow(infoDataValue);
                    worksheet.addRow([]);
                    infoRowTitle.eachCell((cell1, _number1) => {
                        cell1.font = { name: 'Tahoma', family: 4, size: 12, bold: true};
                    });
                    infoRowValue.eachCell((cell2, _number2) => {
                        cell2.font = { name: 'Tahoma', family: 4, size: 12, color: { argb: (infoData.data[kR*numOfColumns + (_number2 - 1)] ? infoData.data[kR*numOfColumns + (_number2 - 1)].fgColor : '000000') }};
                        cell2.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: (infoData.data[kR*numOfColumns + (_number2 - 1)] ? infoData.data[kR*numOfColumns + (_number2 - 1)].bgColor : 'FFFFFF') }
                        };
                    });
                    dataRichTextFormat.forEach(dfR => {
                        const itemFormatRichText = infoRowValue.getCell(dfR.index + 1);
                        itemFormatRichText.value = {richText: dfR.value};
                        itemFormatRichText.alignment = {
                            horizontal: 'left',
                            vertical: 'middle',
                            wrapText: true
                        };
                    });
                    count += 3;
                }
            }
        });

        worksheet.addRow([]);
        count++;

        // Add Header Row
        const headerRow = worksheet.addRow(headerSetting.header);
        count++;

        // Cell Style : Fill and Border
        headerRow.height = 40;
        headerRow.alignment = {
            wrapText: true,
            vertical: "middle",
            horizontal: "left"
        };
        headerRow.eachCell((cell, _number) => {
            cell.font = { name: 'Tahoma', family: 4, size: 12, bold: true, color: { argb: headerSetting.fgColor || '000000' }};
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: headerSetting.bgColor || '00245A' }
            };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        // Add Image
        const logo = workbook.addImage({
            base64: logoFile.logoBase64,
            extension: 'png',
        });

        worksheet.addImage(logo, `${numToExcelColumn(headerSetting.header.length - 1)}1:${numToExcelColumn(headerSetting.header.length)}3`);

        if (data.length < 1) {
            // Footer Row
            const t = worksheet.addRow([headerSetting.noData]);
            const itemTotalLabel = t.getCell(1);
            itemTotalLabel.alignment = {
                horizontal: 'center'
            };
            itemTotalLabel.font = {name: 'Tahoma', family: 4, size: 13, bold: true};
            itemTotalLabel.border = {
                top: {style: 'thin'},
                left: {style: 'thin'},
                bottom: {style: 'thin'},
                right: {style: 'thin'}
            };
            count++;
            worksheet.mergeCells(`A${count}:${numToExcelColumn(headerSetting.header.length)}${count}`);
        } else {
            // Add Data and Conditional Formatting
            data.forEach((item: any[]) => {
                const rowData: any[] = [];
                const dataFormat: any[] = [];
                const dataRichTextFormat: any[] = [];
                item.forEach((d: any, index: number) => {
                    if (typeof d === 'object') {
                        if (d.richText) {
                            rowData.push(d);
                            dataRichTextFormat.push({value: d.richText, index});
                        } else {
                            rowData.push(d.value);
                            const fI: any = {
                                index
                            };
                            if (d.alignment) {
                                fI.alignment = d.alignment;
                            }
                            if (d.fgColor) {
                                fI.fgColor = d.fgColor;
                            }
                            if (d.bgColor) {
                                fI.bgColor = d.bgColor;
                            }
                            dataFormat.push(fI);
                        }
                    } else {
                        rowData.push(d);
                    }
                });
                const row = worksheet.addRow(rowData);
                row.eachCell((cell, _number) => {
                    cell.font = {name: 'Tahoma', family: 4, size: 12};
                    cell.border = {
                        top: {style: 'thin'},
                        left: {style: 'thin'},
                        bottom: {style: 'thin'},
                        right: {style: 'thin'}
                    };
                });
                row.alignment = {
                    vertical: 'middle',
                    wrapText: true
                };
                dataFormat.forEach(df => {
                    const itemFormat = row.getCell(df.index + 1);
                    try {
                        if (df.bgColor) {
                            itemFormat.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: {argb: df.fgColor},
                                bgColor: {argb: df.bgColor}
                            };
                        } else {
                            itemFormat.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: {argb: df.fgColor}
                            };
                        }
                    } catch (e) {}
                    itemFormat.alignment = df.alignment ? df.alignment : {
                        horizontal: 'center',
                        vertical: 'middle',
                        wrapText: true
                    };
                });
                dataRichTextFormat.forEach(dfR => {
                    const itemFormatRichText = row.getCell(dfR.index + 1);
                    itemFormatRichText.value = {richText: dfR.value};
                    itemFormatRichText.alignment = {
                        horizontal: 'right',
                        vertical: 'middle',
                        wrapText: true
                    };
                });
                count++;
            });

            let filterRow = 5;
            if (infoDatas && infoDatas.length > 0) {
                filterRow = 0;
                infoDatas.forEach((infoData: any) => {
                    if (infoData && infoData.data && infoData.data.length > 0) {
                        const numOfColumns = +infoData.cols;
                        const numOfRows = Math.floor(infoData.data.length / numOfColumns + 0.5);
                        filterRow += numOfRows*5;
                    }
                });
                filterRow += 4;
            }
            worksheet.autoFilter = `A${filterRow}:${numToExcelColumn(data[0].length)}${filterRow}`;
            // Footer Row
            if (extraData && extraData.length > 0) {
                extraData.forEach(extra => {
                    const extraRowData = data.map((item: any[]) => item.map(_it => ''))[0];
                    extraRowData[0] = extra.title + ':';
                    extraRowData[extraRowData.length - 1] = extra.value;
                    const t = worksheet.addRow(extraRowData);
                    const itemTotalLabel = t.getCell(1);
                    itemTotalLabel.alignment = {
                        horizontal: 'right'
                    };
                    t.eachCell((cell, _number) => {
                        if (extra.fgColors && extra.fgColors.length) {
                            const fillIndex = _number < data[0].length ? 0 : 1;
                            cell.font = {
                                name: 'Tahoma',
                                family: 4,
                                size: 12,
                                bold: true,
                                color: {argb: extra.fgColors[fillIndex]}
                            };
                            if (extra.bgColors && extra.bgColors[fillIndex]) {
                                cell.fill = {
                                    type: 'pattern',
                                    pattern: 'solid',
                                    fgColor: {argb: extra.bgColors[fillIndex]}
                                };
                            }
                        } else {
                            cell.font = {name: 'Tahoma', family: 4, size: 12, bold: true};
                        }
                        cell.border = {
                            top: {style: 'thin'},
                            left: {style: 'thin'},
                            bottom: {style: 'thin'},
                            right: {style: 'thin'}
                        };
                    });
                    count++;
                    worksheet.mergeCells(`A${count}:${numToExcelColumn(headerSetting.header.length - 1)}${count}`);
                });
            }

            data.forEach((_d, ind) => {
                if (headerSetting.widths && headerSetting.widths.length) {
                    worksheet.getColumn(ind + 1).width = headerSetting.widths[ind];
                } else {
                    worksheet.columns.forEach(function (col, _i) {
                        let maxLength = 0;
                        col["eachCell"]({includeEmpty: true}, function (ce) {
                            const columnLength = ce.value ? (ce.value.toString().length + 5) : 10;
                            if (columnLength > maxLength) {
                                maxLength = columnLength;
                            }
                        });
                        if (typeof _d[_i] === 'object' && Object.keys(_d[_i]).length > 0) {
                            col.width = 25;
                        } else {
                            col.width = maxLength < 10 ? 10 : maxLength;
                        }
                    });
                }
            });
        }
        // Generate Excel File with given name
        workbook.xlsx.writeBuffer().then((data: any) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, `${fileName}.xlsx`);
        });
    }

    async exportNormalViewToExcel(infoData: any, title: string, sheet_name: string, file_name: string) {
        const {sheetName, fileName} = getFileName(sheet_name, file_name);
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet(sheetName);
        let hasMerged: boolean = false;

        const titleRow = worksheet.addRow([title]);
        titleRow.font = { name: 'Tahoma', family: 4, size: 16, underline: 'double', bold: true };
        worksheet.addRow([]);
        worksheet.mergeCells(`A1:B2`);

        worksheet.addRow([]);
        if (infoData && infoData.data && infoData.data.length > 0) {
            worksheet.addRow([]);
        }

        if (infoData && infoData.data && infoData.data.length > 0) {
            const numOfColumns = +infoData.cols;
            const numOfRows =  Math.floor(infoData.data.length/numOfColumns + 0.5);
            for (let kR = 0; kR < numOfRows; kR++) {
                const infoDataObject = [];
                const dataRichTextFormat: any[] = [];
                for (let kC = 0; kC < infoData.cols; kC++) {
                    const valueData = infoData.data[kR*numOfColumns + kC] && infoData.data[kR*numOfColumns + kC].richText ? infoData.data[kR*numOfColumns + kC].richText : [ {text: ''}];
                    infoDataObject.push(valueData);
                    dataRichTextFormat.push({value: valueData, index: kC});
                }
                const infoRowValue = worksheet.addRow(infoDataObject);
                worksheet.addRow([]);
                let merged: boolean = false;
                dataRichTextFormat.forEach(dfR => {
                    const itemFormatRichText = infoRowValue.getCell(dfR.index + 1);
                    if (dfR.value.length < 1) {
                        merged = true;
                        hasMerged = true;
                    }
                    itemFormatRichText.value = {richText: dfR.value};
                    itemFormatRichText.alignment = {
                        horizontal: 'left',
                        vertical: 'middle',
                        wrapText: true
                    };
                });
                if (merged) {
                    const _cells: any[] = infoRowValue['_cells'];
                    infoRowValue.height = 55;
                    worksheet.mergeCells(_cells[0]['_address'] + ':' + _cells[_cells.length - 1]['_address']);
                    const cellInf = worksheet.getCell(_cells[0]['_address']);
                    cellInf.alignment = {
                        horizontal: 'left',
                        vertical: 'top',
                        wrapText: true
                    };
                    infoRowValue.commit();
                }
            }
        }

        worksheet.addRow([]);

        // Add Image
        const logo = workbook.addImage({
            base64: logoFile.logoBase64,
            extension: 'png',
        });

        worksheet.addImage(logo, `C1:D3`);

        worksheet.columns.forEach(function (col, _i) {
            let maxLength = 0;
            col["eachCell"]({includeEmpty: true}, function (ce) {
                const columnLength = ce.value ? (ce.value.toString().length + 5) : 10;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            if (hasMerged && _i=== 0) {
                col.width = 60;
            } else {
                col.width = maxLength < 10 ? 10 : maxLength;
            }
        });
        // Generate Excel File with given name
        workbook.xlsx.writeBuffer().then((data: any) => {
            const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            fs.saveAs(blob, `${fileName}.xlsx`);
        });
    }
}