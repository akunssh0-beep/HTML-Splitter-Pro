let extractedData = { html: "", css: "", js: "" };
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const progressBar = document.getElementById('progressBar');
const statusSection = document.getElementById('statusSection');
const statusText = document.getElementById('statusText');
const resultArea = document.getElementById('resultArea');
const downloadZipBtn = document.getElementById('downloadZipBtn');

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('fileNameDisplay').innerText = file.name;
        processBtn.disabled = false;
        resultArea.style.display = 'none';
        statusSection.style.display = 'none';
    }
});

processBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) return;

    // UI Reset
    processBtn.disabled = true;
    statusSection.style.display = 'block';
    updateProgress(20, "Membaca file...");

    const reader = new FileReader();
    reader.onload = async function(e) {
        const fullText = e.target.result;
        const parser = new DOMParser();
        const doc = parser.parseFromString(fullText, 'text/html');

        updateProgress(40, "Mengekstrak CSS...");
        let cssContent = "";
        doc.querySelectorAll('style').forEach(s => {
            cssContent += s.textContent + "\n";
            s.remove();
        });

        updateProgress(60, "Mengekstrak JavaScript...");
        let jsContent = "";
        doc.querySelectorAll('script:not([src])').forEach(s => {
            jsContent += s.textContent + "\n";
            s.remove();
        });

        // Modifikasi HTML agar merujuk ke folder baru
        const link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/style.css';
        doc.head.appendChild(link);

        const scriptTag = doc.createElement('script');
        scriptTag.src = 'js/script.js';
        doc.body.appendChild(scriptTag);

        extractedData.html = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
        extractedData.css = cssContent || "/* No CSS found */";
        extractedData.js = jsContent || "// No JS found";

        updateProgress(80, "Mengompresi ke ZIP...");
        setTimeout(() => {
            updateProgress(100, "Selesai!");
            resultArea.style.display = 'block';
            processBtn.disabled = false;
        }, 500);
    };
    reader.readAsText(file);
});

function updateProgress(percent, text) {
    progressBar.style.width = percent + "%";
    statusText.innerText = text;
}

downloadZipBtn.addEventListener('click', async () => {
    const zip = new JSZip();
    
    // Struktur Folder
    zip.file("index.html", extractedData.html);
    zip.folder("css").file("style.css", extractedData.css);
    zip.folder("js").file("script.js", extractedData.js);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = "HTML_Splitter_Project.zip";
    document.body.appendChild(a);
    a.click();
    
    // Cleanup untuk Mobile Browser
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
});
