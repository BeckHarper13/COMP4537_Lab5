// Gets the insert button and adds a click event listener
document.getElementById('insertButton').addEventListener('click', () => {
    
    // Define an array of people with their names and dates of birth
    // Partially written by ChatGPT
    const people = [
        { name: "Alice Johnson", dob: "1990-05-15" },
        { name: "Bob Smith", dob: "1985-10-22" },
        { name: "Charlie Brown", dob: "2000-07-08" },
        { name: "Diana Ross", dob: "1995-12-30" }
    ];
    
    // Send a POST request to the '/insert' endpoint
    fetch('https://squid-app-cs2qy.ondigitalocean.app/insert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ people }) // Convert the people array to JSON and send it in the request body
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('response').innerText = JSON.stringify(data);
    })
    .catch(error => console.error('Error:', error));
});

// Gets the query button and adds a click event listener
document.getElementById('queryButton').addEventListener('click', () => {
    // Get the query from the input field and trim any leading/trailing whitespace
    const query = document.getElementById('queryInput').value.trim();

    if (!query) {
        alert('Please enter a query.');
        return;
    }

    // Check if the query starts with 'SELECT' or 'INSERT'
    if (!query.startsWith('SELECT') && !query.startsWith('INSERT')) {
        alert('Only SELECT and INSERT queries are allowed.');
        return;
    }

    // Define request options, including headers
    let requestOptions = {
        headers: { 'Content-Type': 'application/json' }
    };

    // Handle SELECT queries
    if (query.startsWith('SELECT')) {
        // GET request - query passed in URL
        fetch(`https://squid-app-cs2qy.ondigitalocean.app/query?query=${encodeURIComponent(query)}`, {
            method: 'GET',
            ...requestOptions
        })
        .then(response => response.json())
        .then(data => {
            // Display the response data in the 'response' element, formatted with indentation
            document.getElementById('response').innerText = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error('Error:', error));
    } else {
        // Handle INSERT queries
        // POST request - query passed in body
        fetch('https://squid-app-cs2qy.ondigitalocean.app/query', {
            method: 'POST',
            ...requestOptions,
            body: JSON.stringify({ query }) // Convert the query to JSON and send it in the request body
        })
        .then(response => response.json()) // Parse the JSON response
        .then(data => {
            // Display the response data in the 'response' element, formatted with indentation
            document.getElementById('response').innerText = JSON.stringify(data, null, 2);
        })
        .catch(error => console.error('Error:', error));
    }
});