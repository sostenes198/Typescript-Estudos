import * as json2csv from "json2csv";
import * as uuid from 'uuid';
import * as fs from 'fs';

const fields = ['_id', 'title', 'text', 'author', 'active'];
const opts = { fields };

class ExportFiles {
    tocsv = async function (news: any) {
        const csv = await json2csv.parseAsync(news, opts);
        const fileName = uuid.v4() + ".csv";
        fs.writeFileSync(`./exports/${fileName}`, csv);
        return fileName;
    };
}

export default new ExportFiles();