const fs = require('fs');

async function convert() {
    const { marked } = await import('marked');

    const mdFile = '/home/aditi/.gemini/antigravity/brain/ba291f65-71bc-49be-b03f-0fd3690f3902/registration_and_requests_module.md';
    const docFile = '/home/aditi/workspace/registration_and_requests_module.doc';

    const mdContent = fs.readFileSync(mdFile, 'utf8');
    const htmlContent = marked.parse(mdContent);

    const documentHTML = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>Registration and Requests Module</title>
    <style>
    body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; padding: 40px; }
    h1 { font-size: 24pt; color: #2E74B5; border-bottom: 2px solid #5B9BD5; padding-bottom: 5px; }
    h2 { font-size: 18pt; color: #2E74B5; margin-top: 20px; }
    h3 { font-size: 14pt; color: #1F4D78; }
    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
    th, td { border: 1px solid #5B9BD5; padding: 8px; text-align: left; }
    th { background-color: #DDEBF7; font-weight: bold; color: #1F4D78; }
    pre { background: #f4f4f4; padding: 10px; border: 1px solid #ddd; border-radius: 4px; overflow-x: auto; font-family: Consolas, monospace; }
    code { font-family: Consolas, monospace; background: #f4f4f4; padding: 2px 4px; }
    .mermaid { display: block; font-family: Consolas, monospace; background: #f9f9f9; padding: 10px; border: 1px dashed #ccc; margin: 10px 0; white-space: pre-wrap; }
    </style>
    </head>
    <body>
    ${htmlContent}
    </body>
    </html>
    `;

    // Simple replacement to make mermaid blocks show nicely formatted as text blocks since Word can't render them natively
    const finalHTML = documentHTML.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, '<div class="mermaid"><strong>Diagram (Mermaid Format):</strong><br/><pre>$1</pre></div>');

    fs.writeFileSync(docFile, finalHTML);
    console.log('Successfully created DOC file.');
}
convert().catch(console.error);
