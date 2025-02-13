// Gets the insert button and adds a click event listener
document.getElementById('insertButton').addEventListener('click', () => {
    
    const people = [
        { name: "Alice Johnson", dob: "1990-05-15" },
        { name: "Bob Smith", dob: "1985-10-22" },
        { name: "Charlie Brown", dob: "2000-07-08" },
        { name: "Diana Ross", dob: "1995-12-30" }
    ];
    
    fetch('https://squid-app-cs2qy.ondigitalocean.app/insert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ people }) 
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response').innerText = JSON.stringify(data);
    })
    .catch(error => console.error('Error:', error));
});

// Gets the query button and adds a click event listener
document.getElementById('queryButton').addEventListener('click', () => {
    const query = document.getElementById('queryInput').value.trim();

    if (!query) {
        alert('Please enter a query.');
        return;
    }

    if (!query.startsWith('SELECT') && !query.startsWith('INSERT')) {
        alert('Only SELECT and INSERT queries are allowed.');
        return;
    }

    let requestOptions = {
        headers: { 'Content-Type': 'application/json' }
    };

    if (query.startsWith('SELECT')) {
        // GET request - query passed in URL
        fetch(`https://squid-app-cs2qy.ondigitalocean.app/query?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            ...requestOptions
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('response').innerText = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error('Error:', error));
    } else {
        // POST request - query passed in body
        fetch('https://squid-app-cs2qy.ondigitalocean.app/query', {
            method: 'POST',
            ...requestOptions,
            body: JSON.stringify({ query })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('response').innerText = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error('Error:', error));
    }
});