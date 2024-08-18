document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('/api/register', {
        method: 'POST',
        body: JSON.stringify({
            email: formData.get('email'),
            username: formData.get('username'),
            password: formData.get('password'),
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    const messageElement = document.getElementById('register-message');
    if (response.status === 201) {
        messageElement.textContent = 'Account created successfully. You are now logged in.';
        messageElement.style.color = 'green';
        localStorage.setItem('token', data.token);
    } else {
        messageElement.textContent = data.error || 'An error occurred.';
        messageElement.style.color = 'red';
    }
});

document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({
            email: formData.get('email'),
            password: formData.get('password')
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    const messageElement = document.getElementById('login-message');
    if (response.status === 200) {
        messageElement.textContent = 'Logged in successfully.';
        messageElement.style.color = 'green';
        localStorage.setItem('token', data.token);
    } else {
        messageElement.textContent = data.error || 'An error occurred.';
        messageElement.style.color = 'red';
    }
});


document.getElementById('fetch-data').addEventListener('click', async () => {
    const animalType = document.getElementById('animal-type-selector').value;
    const token = localStorage.getItem('token'); // Preia token-ul stocat după autentificare
    const url = `/api/animal/${animalType}?random=1`; // Folosește animalType pentru a decide ruta

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (response.ok) {
        const data = await response.json();
        // Modifică elementul HTML pentru a afișa datele
        const displayDiv = document.getElementById('data-display');
        displayDiv.innerHTML = `
            <p>Animal: ${data.data.animal}</p>
            <p>Breed: ${data.data.breed}</p>
            <img src="${data.data.exampleImage}" alt="Image of ${data.data.animal}" />
            <p>Source: ${data.data.source}</p>
        `;
    } else {
        document.getElementById('data-display').textContent = 'Failed to fetch data.';
    }
});


document.getElementById('add-entry-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const token = localStorage.getItem('token');
    const response = await fetch('/api/animal', {
        method: 'POST',
        body: formData,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    console.log(data);
});