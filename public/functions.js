const form = document.getElementById('reg-form');
form.addEventListener('submit', regUser);

async function regUser(event) {
    event.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    // const confirmPassword = document.getElementById('reg-confirm-password').value;

    const result = await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username,
            password
        })
    }).then((res) => res.json());
};