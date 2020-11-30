export const getDateFormat = (data: Date) => {
    const day = data.getDate();
    const month = data.getMonth() + 1;
    const year = data.getFullYear();
    const format = [];
    format.push(day > 9 ? day : '0' + day);
    format.push(month > 9 ? month : '0' + month);
    format.push(year);
    return format.join('_');
};

export const numToExcelColumn = (num: number) => {
    let s = '';
    let t;

    while (num > 0) {
        t = (num - 1) % 26;
        s = String.fromCharCode(65 + t) + s;
        num = (num - t)/26 | 0;
    }

    return s || undefined;
};

export const getFileName = (sheet_name: string, file_name: string) => {
    const timeSpan = new Date();
    const sheetName = sheet_name || 'Data';
    const fileName = `${file_name || 'Export_result'}_${getDateFormat(timeSpan)}`;
    return {
        sheetName,
        fileName
    };
};

export const getFileNames = (sheet_name: string[], file_name: string) => {
    const timeSpan = new Date();
    const fileName = `${file_name || 'Export_result'}_${getDateFormat(timeSpan)}`;
    return {
        sheetNames: sheet_name || ['Data'],
        fileName
    };
};

export const prevLetter = (letter) => {
    return String.fromCharCode(letter.charCodeAt(0) - 1);
}

export class TableUtil {
    static getDateFormatForExcel(data: Date) {
        const day = data.getDate();
        const month = data.getMonth() + 1;
        const year = data.getFullYear();
        const format = [];
        format.push(day > 9 ? day : '0' + day);
        format.push(month > 9 ? month : '0' + month);
        format.push(year);
        return format.join('/');
    };

    static pad(num, size = 2) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    };

    static getNumberFormatForExcel(number, digits = 0) {
        number = number.toFixed(digits) + '';
        const x = number.split('.');
        let x1 = x[0];
        const x2 = x.length > 1 ? '.' + x[1] : '';
        const rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    };

    static slug(str) {
        str = str ? str.replace(/^\s+|\s+$/g, '') : ''; // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = "ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;";
        var to   = "aaaaaeeeeeiiiiooooouuuunc------";
        for (var i=0, l=from.length ; i<l ; i++) {
            str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
            .replace(/-+/g, '') // collapse dashes
            .replace(/_/g, '') // collapse _
            .replace(/\s+/g, '_'); // collapse whitespace and replace by -

        return str.toUpperCase();
    };
}
