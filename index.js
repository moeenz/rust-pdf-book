const httpsync = require('sync-request');
const markdownpdf = require('markdown-pdf');
const fs = require('fs');

const downloadFolder = __dirname + '/dw/';
const bookPDF = __dirname + '/book/rust-book.pdf';
const bookMarkdown = __dirname + '/book/rust-book.md';
const basePath = 'https://raw.githubusercontent.com/rust-lang/rust/master/src/doc/book/';
const indexPath = basePath + 'SUMMARY.md';
const re = /\(([^\)]+\.md)\)/;

/* Get book index content. */
const indexContent = httpsync('GET', indexPath).getBody();
console.log('==> Book index fetched.');

if (!indexContent) { console.error('==? Error on fetching index content'); return; }

/* List all markdown files names. */
const fileNames = indexContent.toString()
    .split(/\r?\n/)
    .map(function (line, index) {
        const matches = line.match(re);
        if (matches) { return matches[1]; }
    })
    .filter(function (fileName) {
        return fileName !== undefined;
    });
console.log('==>> Documents file names listed.');

/* Download documents content. */
fileNames.forEach(function (fileName) {
    let fileContent = '';
    try {
        fileContent = httpsync('GET', basePath + fileName).getBody().toString();
    } catch (exception) {
        console.error('==? Getting file ' + fileName + ' did not go well.');
        console.error(exception);
    }
    if (fileContent !== '') {
        fs.writeFileSync(downloadFolder + fileName, fileContent);
        console.log('==>>> Document (' + fileName + ') content downloaded.');
    }
});

/* Create empty file for merged markdowns. */
fs.writeFileSync(bookMarkdown, '');

/* Append markdowns content. */
fileNames.forEach(function (fileName) {
    const mdContent = fs.readFileSync(downloadFolder + fileName).toString();
    fs.appendFileSync(bookMarkdown, '\r\n' + mdContent);
});

/* Generate the book pdf from compiled markdown. */
markdownpdf()
    .from(bookMarkdown)
    .to(bookPDF, function () {
        console.log('\n[SUCCESS] Book pdf generated successfully.');
    });
