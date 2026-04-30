(async () => {
    const res = await fetch('https://mealmaty.netlify.app/.netlify/functions/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.recipetineats.com/chicken-stroganoff/' })
    });
    const data = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", data);
})();
